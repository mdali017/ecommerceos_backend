export interface WishlistItemRow {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
}

export interface WishlistProductRow {
  id: string;
  product_name: string;
  slug: string;
  selling_price: number;
  offer_price: number;
  unit: string;
  pack_size: string;
  status: string;
  discount_percent: number;
}

export interface WishlistItemProfile {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  sellingPrice: number;
  offerPrice: number;
  unit: string;
  packSize: string;
  imageUrl: string;
  inStock: boolean;
  createdAt: string;
}
