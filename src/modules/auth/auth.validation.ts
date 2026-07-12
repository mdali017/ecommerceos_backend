import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Phone must be at least 10 digits")
  .max(15, "Phone must be at most 15 digits");

const emailSchema = z.string().trim().email("Invalid email address");

const passwordSchema = z
  .string()
  .min(4, "Password must be at least 4 characters")
  .max(128, "Password is too long");

export const customerLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier is required"),
  password: passwordSchema,
  method: z.enum(["phone", "email"]),
});

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().trim().min(1, "Address is required"),
  password: passwordSchema.optional(),
  source: z.enum(["campaign", "default", "checkout"]).default("default"),
});

export const checkoutActivateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().trim().min(1, "Address is required"),
  password: passwordSchema,
});

export const customerUpdateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: z.string().trim().min(1, "Address is required").optional(),
});

export const customerUpdatePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CheckoutActivateInput = z.infer<typeof checkoutActivateSchema>;
export type CustomerUpdateProfileInput = z.infer<typeof customerUpdateProfileSchema>;
export type CustomerUpdatePasswordInput = z.infer<typeof customerUpdatePasswordSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
