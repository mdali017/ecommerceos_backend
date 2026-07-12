import { z } from "zod";

const sectionTypeSchema = z.enum(["grid", "carousel", "flash_sale"]);
const productSourceSchema = z.enum(["featured", "on_sale", "category", "manual"]);

export const createHomepageProductSectionSchema = z.object({
  titleBn: z.string().trim().min(1, "Bengali title is required"),
  titleEn: z.string().trim().optional().default(""),
  sectionType: sectionTypeSchema.optional().default("carousel"),
  productSource: productSourceSchema.optional().default("category"),
  categorySlug: z.string().trim().optional().default(""),
  categoryKeywords: z.string().trim().optional().default(""),
  productSkus: z.string().trim().optional().default(""),
  maxProducts: z.coerce.number().int().min(1).max(50).optional().default(12),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateHomepageProductSectionSchema =
  createHomepageProductSectionSchema.partial();

export type CreateHomepageProductSectionInput = z.infer<
  typeof createHomepageProductSectionSchema
>;
export type UpdateHomepageProductSectionInput = z.infer<
  typeof updateHomepageProductSectionSchema
>;
