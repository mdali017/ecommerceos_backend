import { supabase } from "../../config/supabase";
import { AppError, NotFoundError } from "../../shared/errors/app-error";
import type {
  CheckoutTotals,
  ShippingQuote,
  ShippingZoneProfile,
  ShippingZoneRow,
} from "./shipping.types";
import type {
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
} from "./shipping.validation";

const DEFAULT_ZONE = {
  deliveryFee: 80,
  freeDeliveryThreshold: 2000,
  estimatedDaysMin: 1,
  estimatedDaysMax: 3,
  name: "Standard",
};

function toZoneProfile(row: ShippingZoneRow): ShippingZoneProfile {
  return {
    id: row.id,
    name: row.name,
    nameBn: row.name_bn,
    deliveryFee: Number(row.delivery_fee),
    freeDeliveryThreshold: Number(row.free_delivery_threshold),
    estimatedDaysMin: row.estimated_days_min,
    estimatedDaysMax: row.estimated_days_max,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function raiseShippingDbError(action: string, error: { message: string }): never {
  if (error.message.includes("Could not find the table") && error.message.includes("shipping_zones")) {
    throw new AppError(
      503,
      "Shipping zones table is not set up yet. Run supabase/migrations/018_shipping.sql in Supabase SQL Editor.",
      "SHIPPING_TABLE_MISSING"
    );
  }
  throw new Error(`${action}: ${error.message}`);
}

async function getZoneRowById(id: string): Promise<ShippingZoneRow | null> {
  const { data, error } = await supabase
    .from("shipping_zones")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch shipping zone: ${error.message}`);
  return data ? (data as ShippingZoneRow) : null;
}

export async function listActiveZones(): Promise<ShippingZoneProfile[]> {
  const { data, error } = await supabase
    .from("shipping_zones")
    .select()
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) raiseShippingDbError("Failed to list shipping zones", error);
  return ((data ?? []) as ShippingZoneRow[]).map(toZoneProfile);
}

export async function listAllZones(): Promise<ShippingZoneProfile[]> {
  const { data, error } = await supabase
    .from("shipping_zones")
    .select()
    .order("sort_order", { ascending: true });

  if (error) raiseShippingDbError("Failed to list shipping zones", error);
  return ((data ?? []) as ShippingZoneRow[]).map(toZoneProfile);
}

export async function calculateShippingQuote(
  subtotal: number,
  zoneId?: string,
  couponFreeShipping = false
): Promise<ShippingQuote> {
  let zone: ShippingZoneRow | null = null;

  if (zoneId) {
    zone = await getZoneRowById(zoneId);
  }

  if (!zone) {
    const zones = await listActiveZones();
    zone = zones[0] ? await getZoneRowById(zones[0].id) : null;
  }

  const deliveryFee = zone ? Number(zone.delivery_fee) : DEFAULT_ZONE.deliveryFee;
  const freeThreshold = zone
    ? Number(zone.free_delivery_threshold)
    : DEFAULT_ZONE.freeDeliveryThreshold;
  const daysMin = zone?.estimated_days_min ?? DEFAULT_ZONE.estimatedDaysMin;
  const daysMax = zone?.estimated_days_max ?? DEFAULT_ZONE.estimatedDaysMax;
  const zoneName = zone?.name_bn || zone?.name || DEFAULT_ZONE.name;

  const isFreeDelivery = couponFreeShipping || subtotal >= freeThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : deliveryFee;

  return {
    zoneId: zone?.id ?? null,
    zoneName,
    deliveryCharge,
    freeDeliveryThreshold: freeThreshold,
    estimatedDelivery: `${daysMin}-${daysMax} দিন`,
    isFreeDelivery,
  };
}

export function calculateCheckoutTotals(
  subtotal: number,
  shippingQuote: ShippingQuote,
  coupon?: { discountAmount: number; freeShipping: boolean }
): CheckoutTotals {
  const deliveryCharge = coupon?.freeShipping ? 0 : shippingQuote.deliveryCharge;
  const autoDiscount = coupon ? 0 : subtotal >= 3000 ? 150 : 0;
  const couponDiscount = coupon?.discountAmount ?? 0;
  const discount = autoDiscount + couponDiscount;
  const total = Math.max(0, subtotal + deliveryCharge - discount);

  return {
    deliveryCharge,
    discount,
    total,
    autoDiscount,
    couponDiscount,
    estimatedDelivery: shippingQuote.estimatedDelivery,
    shippingZoneId: shippingQuote.zoneId,
  };
}

export async function createZone(input: CreateShippingZoneInput): Promise<ShippingZoneProfile> {
  const { data, error } = await supabase
    .from("shipping_zones")
    .insert({
      name: input.name.trim(),
      name_bn: input.nameBn?.trim() ?? "",
      delivery_fee: input.deliveryFee,
      free_delivery_threshold: input.freeDeliveryThreshold ?? 2000,
      estimated_days_min: input.estimatedDaysMin ?? 1,
      estimated_days_max: input.estimatedDaysMax ?? 3,
      is_active: input.isActive ?? true,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) raiseShippingDbError("Failed to create shipping zone", error);
  return toZoneProfile(data as ShippingZoneRow);
}

export async function updateZone(
  id: string,
  input: UpdateShippingZoneInput
): Promise<ShippingZoneProfile> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.nameBn !== undefined) payload.name_bn = input.nameBn.trim();
  if (input.deliveryFee !== undefined) payload.delivery_fee = input.deliveryFee;
  if (input.freeDeliveryThreshold !== undefined) {
    payload.free_delivery_threshold = input.freeDeliveryThreshold;
  }
  if (input.estimatedDaysMin !== undefined) payload.estimated_days_min = input.estimatedDaysMin;
  if (input.estimatedDaysMax !== undefined) payload.estimated_days_max = input.estimatedDaysMax;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("shipping_zones")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) raiseShippingDbError("Failed to update shipping zone", error);
  if (!data) throw new NotFoundError("Shipping zone not found");
  return toZoneProfile(data as ShippingZoneRow);
}

export async function deleteZone(id: string): Promise<void> {
  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  if (error) raiseShippingDbError("Failed to delete shipping zone", error);
}
