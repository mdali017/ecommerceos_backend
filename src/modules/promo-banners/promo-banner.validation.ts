import { z } from "zod";

export const createPromoBannerSchema = z.object({
  titleBn: z.string().trim().min(1, "Bengali title is required"),
  titleEn: z.string().trim().min(1, "English title is required"),
  subtitleBn: z.string().trim().optional().default(""),
  subtitleEn: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().url("Valid image URL is required"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updatePromoBannerSchema = createPromoBannerSchema.partial();

export type CreatePromoBannerInput = z.infer<typeof createPromoBannerSchema>;
export type UpdatePromoBannerInput = z.infer<typeof updatePromoBannerSchema>;
