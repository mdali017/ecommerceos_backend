import { z } from "zod";

export const createTestimonialSchema = z.object({
  nameBn: z.string().trim().min(1, "Bengali name is required"),
  nameEn: z.string().trim().optional().default(""),
  reviewBn: z.string().trim().min(1, "Bengali review is required"),
  reviewEn: z.string().trim().optional().default(""),
  rating: z.coerce.number().int().min(1).max(5).optional().default(5),
  avatar: z.string().trim().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
