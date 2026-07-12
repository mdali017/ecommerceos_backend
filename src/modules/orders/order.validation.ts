import { z } from "zod";

const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
]);

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerPhone: z.string().trim().min(11, "Valid phone number is required"),
  customerEmail: z.string().trim().email("Valid email is required"),
  customerAddress: z.string().trim().min(1, "Delivery address is required"),
  paymentMethod: z.literal("cod").optional().default("cod"),
  notes: z.string().trim().optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1, "Product id is required"),
        productName: z.string().trim().optional().default(""),
        productSlug: z.string().trim().optional().default(""),
        productImage: z.string().trim().optional().default(""),
        unitPrice: z.coerce.number().min(0).optional().default(0),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
