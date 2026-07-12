import { z } from "zod";

const discountTypeSchema = z.enum(["fixed", "percent"]);

export const createCouponSchema = z.object({
  code: z.string().trim().min(3, "Code must be at least 3 characters").max(32),
  description: z.string().trim().optional().default(""),
  discountType: discountTypeSchema,
  discountValue: z.coerce.number().positive("Discount value must be positive"),
  minOrderAmount: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.number().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.coerce.number().int().positive().optional().default(1),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  freeShipping: z.boolean().optional().default(false),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
  subtotal: z.coerce.number().min(0),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
