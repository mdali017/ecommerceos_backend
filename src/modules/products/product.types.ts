export type ProductStatus = "active" | "low_stock" | "out_of_stock" | "draft";

export interface ProductRow {
  id: string;
  sku: string;
  barcode: string;
  product_name: string;
  slug: string;
  generic_name: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  unit: string;
  pack_size: string;
  purchase_price: number;
  cost_price: number;
  selling_price: number;
  offer_price: number;
  tax_percent: number;
  discount_percent: number;
  stock_qty: number;
  min_stock: number;
  max_stock: number;
  batch_no: string;
  expiry_date: string | null;
  manufacture_date: string | null;
  supplier: string;
  manufacturer: string;
  weight: string;
  color: string;
  size: string;
  variant: string;
  image_url: string;
  status: ProductStatus;
  featured: boolean;
  tags: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductProfile {
  id: string;
  sku: string;
  barcode: string;
  productName: string;
  slug: string;
  genericName: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  unit: string;
  packSize: string;
  purchasePrice: number;
  costPrice: number;
  sellingPrice: number;
  offerPrice: number;
  taxPercent: number;
  discountPercent: number;
  stockQty: number;
  minStock: number;
  maxStock: number;
  batchNo: string;
  expiryDate: string | null;
  manufactureDate: string | null;
  supplier: string;
  manufacturer: string;
  weight: string;
  color: string;
  size: string;
  variant: string;
  imageUrl: string;
  status: ProductStatus;
  featured: boolean;
  tags: string;
  notes: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BulkUploadResult {
  created: number;
  updated: number;
  failed: { sku: string; error: string }[];
  products: ProductProfile[];
}

export interface PaginatedProducts {
  products: ProductProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
