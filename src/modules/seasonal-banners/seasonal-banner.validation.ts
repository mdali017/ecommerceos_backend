import { z } from "zod";

export const createSeasonalBannerSchema = z.object({
  titleBn: z.string().trim().min(1, "Bengali title is required"),
  titleEn: z.string().trim().min(1, "English title is required"),
  ctaBn: z.string().trim().optional().default(""),
  ctaEn: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().url("Valid image URL is required"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateSeasonalBannerSchema = createSeasonalBannerSchema.partial();

export type CreateSeasonalBannerInput = z.infer<typeof createSeasonalBannerSchema>;
export type UpdateSeasonalBannerInput = z.infer<typeof updateSeasonalBannerSchema>;
