import { supabase } from "../../config/supabase";
import { AppError, NotFoundError, ValidationError } from "../../shared/errors/app-error";
import type {
  CouponProfile,
  CouponRow,
  CouponValidationResult,
} from "./coupon.types";
import type { CreateCouponInput, UpdateCouponInput } from "./coupon.validation";

function toCouponProfile(row: CouponRow): CouponProfile {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderAmount: Number(row.min_order_amount),
    maxDiscount: row.max_discount != null ? Number(row.max_discount) : null,
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    perUserLimit: row.per_user_limit,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    freeShipping: row.free_shipping,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function raiseCouponDbError(action: string, error: { message: string }): never {
  if (error.message.includes("Could not find the table") && error.message.includes("coupons")) {
    throw new AppError(
      503,
      "Coupons table is not set up yet. Run supabase/migrations/015_coupons.sql in Supabase SQL Editor.",
      "COUPONS_TABLE_MISSING"
    );
  }

  throw new Error(`${action}: ${error.message}`);
}

function computeDiscountAmount(coupon: CouponRow, subtotal: number): number {
  if (coupon.discount_type === "fixed") {
    return Math.min(Number(coupon.discount_value), subtotal);
  }

  const raw = (subtotal * Number(coupon.discount_value)) / 100;
  const capped =
    coupon.max_discount != null ? Math.min(raw, Number(coupon.max_discount)) : raw;
  return Math.min(capped, subtotal);
}

async function getCouponRowByCode(code: string): Promise<CouponRow | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select()
    .eq("code", normalizeCode(code))
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch coupon: ${error.message}`);
  return data ? (data as CouponRow) : null;
}

async function getCustomerUsageCount(
  couponId: string,
  customerId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("coupon_usages")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", couponId)
    .eq("customer_id", customerId);

  if (error) throw new Error(`Failed to count coupon usage: ${error.message}`);
  return count ?? 0;
}

export async function validateCouponForOrder(
  code: string,
  subtotal: number,
  customerId?: string
): Promise<CouponValidationResult> {
  const normalized = normalizeCode(code);
  const coupon = await getCouponRowByCode(normalized);

  if (!coupon) {
    return { valid: false, code: normalized, discountAmount: 0, freeShipping: false, message: "Invalid coupon code" };
  }

  if (!coupon.is_active) {
    return { valid: false, code: normalized, discountAmount: 0, freeShipping: false, message: "This coupon is inactive" };
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { valid: false, code: normalized, discountAmount: 0, freeShipping: false, message: "This coupon is not active yet" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { valid: false, code: normalized, discountAmount: 0, freeShipping: false, message: "This coupon has expired" };
  }

  if (subtotal < Number(coupon.min_order_amount)) {
    return {
      valid: false,
      code: normalized,
      discountAmount: 0,
      freeShipping: false,
      message: `Minimum order amount is ৳${Number(coupon.min_order_amount).toLocaleString("en-US")}`,
    };
  }

  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, code: normalized, discountAmount: 0, freeShipping: false, message: "This coupon has reached its usage limit" };
  }

  if (customerId && coupon.per_user_limit > 0) {
    const usageCount = await getCustomerUsageCount(coupon.id, customerId);
    if (usageCount >= coupon.per_user_limit) {
      return { valid: false, code: normalized, discountAmount: 0, freeShipping: false, message: "You have already used this coupon" };
    }
  }

  const discountAmount = computeDiscountAmount(coupon, subtotal);

  return {
    valid: true,
    code: normalized,
    discountAmount,
    freeShipping: coupon.free_shipping,
    message: "Coupon applied successfully",
    couponId: coupon.id,
  };
}

export function calculateOrderCharges(
  subtotal: number,
  coupon?: { discountAmount: number; freeShipping: boolean }
) {
  let deliveryCharge = subtotal >= 2000 ? 0 : 80;
  if (coupon?.freeShipping) deliveryCharge = 0;

  const autoDiscount = coupon ? 0 : subtotal >= 3000 ? 150 : 0;
  const couponDiscount = coupon?.discountAmount ?? 0;
  const discount = autoDiscount + couponDiscount;
  const total = Math.max(0, subtotal + deliveryCharge - discount);

  return { deliveryCharge, discount, total, autoDiscount, couponDiscount };
}

export async function recordCouponUsage(
  couponId: string,
  orderId: string,
  customerId?: string
): Promise<void> {
  const { error: usageError } = await supabase.from("coupon_usages").insert({
    coupon_id: couponId,
    order_id: orderId,
    customer_id: customerId ?? null,
  });

  if (usageError) throw new Error(`Failed to record coupon usage: ${usageError.message}`);

  const { data: coupon, error: fetchError } = await supabase
    .from("coupons")
    .select("used_count")
    .eq("id", couponId)
    .single();

  if (fetchError) throw new Error(`Failed to fetch coupon: ${fetchError.message}`);

  const { error: updateError } = await supabase
    .from("coupons")
    .update({ used_count: (coupon as { used_count: number }).used_count + 1 })
    .eq("id", couponId);

  if (updateError) throw new Error(`Failed to update coupon usage: ${updateError.message}`);
}

export async function listCoupons(): Promise<CouponProfile[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select()
    .order("created_at", { ascending: false });

  if (error) raiseCouponDbError("Failed to list coupons", error);
  return ((data ?? []) as CouponRow[]).map(toCouponProfile);
}

export async function createCoupon(input: CreateCouponInput): Promise<CouponProfile> {
  const code = normalizeCode(input.code);

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code,
      description: input.description?.trim() ?? "",
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_amount: input.minOrderAmount ?? 0,
      max_discount: input.maxDiscount ?? null,
      usage_limit: input.usageLimit ?? null,
      per_user_limit: input.perUserLimit ?? 1,
      starts_at: input.startsAt ?? null,
      expires_at: input.expiresAt ?? null,
      is_active: input.isActive ?? true,
      free_shipping: input.freeShipping ?? false,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      throw new ValidationError("Coupon code already exists");
    }
    raiseCouponDbError("Failed to create coupon", error);
  }

  return toCouponProfile(data as CouponRow);
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput
): Promise<CouponProfile> {
  const payload: Record<string, unknown> = {};

  if (input.code !== undefined) payload.code = normalizeCode(input.code);
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.discountType !== undefined) payload.discount_type = input.discountType;
  if (input.discountValue !== undefined) payload.discount_value = input.discountValue;
  if (input.minOrderAmount !== undefined) payload.min_order_amount = input.minOrderAmount;
  if (input.maxDiscount !== undefined) payload.max_discount = input.maxDiscount;
  if (input.usageLimit !== undefined) payload.usage_limit = input.usageLimit;
  if (input.perUserLimit !== undefined) payload.per_user_limit = input.perUserLimit;
  if (input.startsAt !== undefined) payload.starts_at = input.startsAt;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.freeShipping !== undefined) payload.free_shipping = input.freeShipping;

  const { data, error } = await supabase
    .from("coupons")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update coupon: ${error.message}`);
  if (!data) throw new NotFoundError("Coupon not found");

  return toCouponProfile(data as CouponRow);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete coupon: ${error.message}`);
}

export async function getCouponById(id: string): Promise<CouponProfile> {
  const { data, error } = await supabase.from("coupons").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to fetch coupon: ${error.message}`);
  if (!data) throw new NotFoundError("Coupon not found");
  return toCouponProfile(data as CouponRow);
}
