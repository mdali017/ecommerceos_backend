import { z } from "zod";

const optionalString = z.string().trim().optional().default("");
const optionalNumber = z.union([z.string(), z.number()]).optional().default("");

const bulkProductItemSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  barcode: optionalString,
  productName: z.string().trim().min(1, "Product name is required"),
  genericName: optionalString,
  brand: optionalString,
  category: optionalString,
  subcategory: optionalString,
  description: optionalString,
  unit: optionalString,
  packSize: optionalString,
  purchasePrice: optionalNumber,
  costPrice: optionalNumber,
  sellingPrice: optionalNumber,
  offerPrice: optionalNumber,
  taxPercent: optionalNumber,
  discountPercent: optionalNumber,
  stockQty: optionalNumber,
  minStock: optionalNumber,
  maxStock: optionalNumber,
  batchNo: optionalString,
  expiryDate: optionalString,
  manufactureDate: optionalString,
  supplier: optionalString,
  manufacturer: optionalString,
  weight: optionalString,
  color: optionalString,
  size: optionalString,
  variant: optionalString,
  imageUrl: optionalString,
  status: optionalString,
  featured: optionalString,
  tags: optionalString,
  notes: optionalString,
  imageUrls: z.array(z.string()).optional().default([]),
});

export const bulkUploadSchema = z.object({
  products: z.array(bulkProductItemSchema).min(1, "At least one product is required"),
});

export const publicProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "name"])
    .optional()
    .default("newest"),
  search: z.string().trim().optional(),
});

export type BulkProductInput = z.infer<typeof bulkProductItemSchema>;
export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;
export type PublicProductsQuery = z.infer<typeof publicProductsQuerySchema>;
