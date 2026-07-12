import { z } from "zod";

export const createReturnSchema = z.object({
  orderId: z.string().trim().min(1),
  reason: z.string().trim().min(3, "Reason is required"),
  description: z.string().trim().optional().default(""),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "refunded", "completed"]),
  refundStatus: z.enum(["pending", "processing", "refunded", "rejected"]).optional(),
  adminNotes: z.string().trim().optional().default(""),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type UpdateReturnStatusInput = z.infer<typeof updateReturnStatusSchema>;
