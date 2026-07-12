import { z } from "zod";

export const createCategorySchema = z.object({
  slug: z.string().trim().min(1, "Slug is required"),
  name: z.string().trim().min(1, "English name is required"),
  nameBn: z.string().trim().min(1, "Bengali name is required"),
  icon: z.string().trim().min(1, "Icon is required"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  keywords: z.string().trim().optional().default(""),
  isActive: z.boolean().optional().default(true),
  parentId: z.string().uuid().nullable().optional().default(null),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
