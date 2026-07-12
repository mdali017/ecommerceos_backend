import { z } from "zod";

export const createShippingZoneSchema = z.object({
  name: z.string().trim().min(1),
  nameBn: z.string().trim().optional().default(""),
  deliveryFee: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0).optional().default(2000),
  estimatedDaysMin: z.coerce.number().int().min(1).optional().default(1),
  estimatedDaysMax: z.coerce.number().int().min(1).optional().default(3),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const updateShippingZoneSchema = createShippingZoneSchema.partial();

export const shippingQuoteSchema = z.object({
  subtotal: z.coerce.number().min(0),
  zoneId: z.string().trim().optional(),
  freeShipping: z.boolean().optional().default(false),
});

export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;
