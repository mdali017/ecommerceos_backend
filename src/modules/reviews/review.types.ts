export interface ProductReviewRow {
  id: string;
  product_id: string;
  customer_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface ProductReviewProfile {
  id: string;
  productId: string;
  customerId: string | null;
  authorName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  reviews: ProductReviewProfile[];
}

export interface ProductReviewRowWithProduct extends ProductReviewRow {
  products: { product_name: string; slug: string } | null;
}

export interface AdminProductReviewProfile extends ProductReviewProfile {
  productName: string;
  productSlug: string;
}
