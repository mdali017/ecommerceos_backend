import { supabase } from "../../config/supabase";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors/app-error";
import {
  comparePassword,
  generateCampaignPassword,
  hashPassword,
} from "../../shared/utils/password";
import {
  createTokenPair,
  getRefreshTokenExpiry,
  hashToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt";
import type { CustomerRow, AdminRow, RefreshTokenRow } from "../../types/database.types";
import type {
  AdminAuthResponse,
  AdminProfile,
  AuthTokens,
  CustomerAuthResponse,
  CustomerProfile,
  MeResponse,
} from "./auth.types";
import type {
  AdminLoginInput,
  CheckoutActivateInput,
  CustomerLoginInput,
  CustomerRegisterInput,
  CustomerUpdatePasswordInput,
  CustomerUpdateProfileInput,
} from "./auth.validation";

function toCustomerProfile(row: CustomerRow): CustomerProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    source: row.source,
  };
}

function toAdminProfile(row: AdminRow): AdminProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
  };
}

async function storeRefreshToken(
  userId: string,
  role: "customer" | "admin",
  refreshToken: string
) {
  const { error } = await supabase.from("refresh_tokens").insert({
    user_id: userId,
    role,
    token_hash: hashToken(refreshToken),
    expires_at: getRefreshTokenExpiry().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }
}

async function revokeRefreshToken(refreshToken: string) {
  await supabase
    .from("refresh_tokens")
    .delete()
    .eq("token_hash", hashToken(refreshToken));
}

export async function registerCustomer(
  input: CustomerRegisterInput
): Promise<CustomerAuthResponse> {
  const password =
    input.password ??
    (input.source === "campaign" ? generateCampaignPassword(input.phone) : undefined);

  if (!password) {
    throw new ConflictError("Password is required for registration");
  }

  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email.toLowerCase(),
      address: input.address,
      password_hash: passwordHash,
      source: input.source,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ConflictError("Customer with this phone or email already exists");
    }
    throw new Error(`Registration failed: ${error.message}`);
  }

  const customer = data as CustomerRow;
  const tokens = createTokenPair(customer.id, "customer", customer.email);
  await storeRefreshToken(customer.id, "customer", tokens.refreshToken);

  return {
    user: toCustomerProfile(customer),
    tokens,
  };
}

export async function activateCheckoutCustomer(
  input: CheckoutActivateInput
): Promise<CustomerAuthResponse> {
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  const { data: existingByPhone, error: phoneLookupError } = await supabase
    .from("customers")
    .select()
    .eq("phone", phone)
    .maybeSingle();

  if (phoneLookupError) {
    throw new Error(`Checkout activation failed: ${phoneLookupError.message}`);
  }

  if (existingByPhone) {
    const { data: emailOwner, error: emailLookupError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailLookupError) {
      throw new Error(`Checkout activation failed: ${emailLookupError.message}`);
    }

    if (emailOwner && emailOwner.id !== existingByPhone.id) {
      throw new ConflictError("Email already used by another account");
    }

    const { data, error } = await supabase
      .from("customers")
      .update({
        name: input.name.trim(),
        email,
        address: input.address.trim(),
        password_hash: passwordHash,
        source: "checkout",
      })
      .eq("id", existingByPhone.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Checkout activation failed: ${error.message}`);
    }

    const customer = data as CustomerRow;
    const tokens = createTokenPair(customer.id, "customer", customer.email);
    await storeRefreshToken(customer.id, "customer", tokens.refreshToken);

    return {
      user: toCustomerProfile(customer),
      tokens,
    };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name.trim(),
      phone,
      email,
      address: input.address.trim(),
      password_hash: passwordHash,
      source: "checkout",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ConflictError("Customer with this phone or email already exists");
    }
    throw new Error(`Checkout activation failed: ${error.message}`);
  }

  const customer = data as CustomerRow;
  const tokens = createTokenPair(customer.id, "customer", customer.email);
  await storeRefreshToken(customer.id, "customer", tokens.refreshToken);

  return {
    user: toCustomerProfile(customer),
    tokens,
  };
}

export async function loginCustomer(
  input: CustomerLoginInput
): Promise<CustomerAuthResponse> {
  const identifier = input.identifier.trim();
  const column = input.method === "phone" ? "phone" : "email";
  const value =
    input.method === "email" ? identifier.toLowerCase() : identifier;

  const { data, error } = await supabase
    .from("customers")
    .select()
    .eq(column, value)
    .maybeSingle();

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  if (!data) {
    throw new UnauthorizedError("Invalid phone/email or password");
  }

  const customer = data as CustomerRow;
  const isValid = await comparePassword(input.password, customer.password_hash);

  if (!isValid) {
    throw new UnauthorizedError("Invalid phone/email or password");
  }

  const tokens = createTokenPair(customer.id, "customer", customer.email);
  await storeRefreshToken(customer.id, "customer", tokens.refreshToken);

  return {
    user: toCustomerProfile(customer),
    tokens,
  };
}

export async function loginAdmin(input: AdminLoginInput): Promise<AdminAuthResponse> {
  const email = input.email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("admins")
    .select()
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Admin login failed: ${error.message}`);
  }

  if (!data) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const admin = data as AdminRow;
  const isValid = await comparePassword(input.password, admin.password_hash);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = createTokenPair(admin.id, "admin", admin.email);
  await storeRefreshToken(admin.id, "admin", tokens.refreshToken);

  return {
    user: toAdminProfile(admin),
    tokens,
  };
}

export async function refreshAuth(refreshToken: string): Promise<AuthTokens> {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const { data: storedToken, error } = await supabase
    .from("refresh_tokens")
    .select()
    .eq("token_hash", hashToken(refreshToken))
    .eq("user_id", payload.sub)
    .maybeSingle();

  if (error || !storedToken) {
    throw new UnauthorizedError("Refresh token not found or revoked");
  }

  const tokenRow = storedToken as RefreshTokenRow;

  if (new Date(tokenRow.expires_at) < new Date()) {
    await revokeRefreshToken(refreshToken);
    throw new UnauthorizedError("Refresh token expired");
  }

  await revokeRefreshToken(refreshToken);

  const tokens = createTokenPair(payload.sub, payload.role, payload.email);
  await storeRefreshToken(payload.sub, payload.role, tokens.refreshToken);

  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
}

export async function getMe(userId: string, role: "customer" | "admin"): Promise<MeResponse> {
  if (role === "customer") {
    const { data, error } = await supabase
      .from("customers")
      .select()
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError("Customer not found");
    }

    return { role: "customer", user: toCustomerProfile(data as CustomerRow) };
  }

  const { data, error } = await supabase
    .from("admins")
    .select()
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch admin: ${error.message}`);
  }

  if (!data) {
    throw new NotFoundError("Admin not found");
  }

  return { role: "admin", user: toAdminProfile(data as AdminRow) };
}

export async function updateCustomerProfile(
  customerId: string,
  input: CustomerUpdateProfileInput
): Promise<CustomerProfile> {
  const { data: existing, error: lookupError } = await supabase
    .from("customers")
    .select()
    .eq("id", customerId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Profile update failed: ${lookupError.message}`);
  }

  if (!existing) {
    throw new NotFoundError("Customer not found");
  }

  const current = existing as CustomerRow;
  const phone = input.phone?.trim() ?? current.phone;
  const email = (input.email?.trim() ?? current.email).toLowerCase();

  if (phone !== current.phone) {
    const { data: phoneOwner, error: phoneError } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (phoneError) {
      throw new Error(`Profile update failed: ${phoneError.message}`);
    }

    if (phoneOwner && phoneOwner.id !== customerId) {
      throw new ConflictError("Phone already used by another account");
    }
  }

  if (email !== current.email) {
    const { data: emailOwner, error: emailError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailError) {
      throw new Error(`Profile update failed: ${emailError.message}`);
    }

    if (emailOwner && emailOwner.id !== customerId) {
      throw new ConflictError("Email already used by another account");
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .update({
      name: input.name?.trim() ?? current.name,
      phone,
      email,
      address: input.address?.trim() ?? current.address,
    })
    .eq("id", customerId)
    .select()
    .single();

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }

  return toCustomerProfile(data as CustomerRow);
}

export async function updateCustomerPassword(
  customerId: string,
  input: CustomerUpdatePasswordInput
): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from("customers")
    .select("password_hash")
    .eq("id", customerId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Password update failed: ${lookupError.message}`);
  }

  if (!existing) {
    throw new NotFoundError("Customer not found");
  }

  const isValid = await comparePassword(
    input.currentPassword,
    (existing as Pick<CustomerRow, "password_hash">).password_hash
  );

  if (!isValid) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  const passwordHash = await hashPassword(input.newPassword);

  const { error } = await supabase
    .from("customers")
    .update({ password_hash: passwordHash })
    .eq("id", customerId);

  if (error) {
    throw new Error(`Password update failed: ${error.message}`);
  }
}
