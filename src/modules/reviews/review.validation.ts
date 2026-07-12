import { z } from "zod";

export const createReviewSchema = z.object({
  authorName: z.string().trim().min(2, "Name must be at least 2 characters"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Comment must be at least 3 characters"),
});

export const updateReviewStatusSchema = z.object({
  isApproved: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
