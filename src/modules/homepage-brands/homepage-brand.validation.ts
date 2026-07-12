import { z } from "zod";

export const createHomepageBrandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required"),
  logoUrl: z.string().trim().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateHomepageBrandSchema = createHomepageBrandSchema.partial();

export type CreateHomepageBrandInput = z.infer<typeof createHomepageBrandSchema>;
export type UpdateHomepageBrandInput = z.infer<typeof updateHomepageBrandSchema>;
