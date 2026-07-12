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
  CustomerLoginInput,
  CustomerRegisterInput,
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
