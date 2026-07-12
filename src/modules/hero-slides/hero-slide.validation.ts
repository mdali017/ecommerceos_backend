import { z } from "zod";

export const createHeroSlideSchema = z.object({
  titleBn: z.string().trim().min(1, "Bengali title is required"),
  titleEn: z.string().trim().min(1, "English title is required"),
  subtitleBn: z.string().trim().optional().default(""),
  subtitleEn: z.string().trim().optional().default(""),
  ctaBn: z.string().trim().optional().default(""),
  ctaEn: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().url("Valid image URL is required"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

export type CreateHeroSlideInput = z.infer<typeof createHeroSlideSchema>;
export type UpdateHeroSlideInput = z.infer<typeof updateHeroSlideSchema>;
