import { supabase } from "../../config/supabase";
import { NotFoundError } from "../../shared/errors/app-error";
import type {
  AdminProductReviewProfile,
  ProductReviewProfile,
  ProductReviewRow,
  ProductReviewRowWithProduct,
  ProductReviewSummary,
} from "./review.types";
import type { CreateReviewInput } from "./review.validation";

function toReviewProfile(row: ProductReviewRow): ProductReviewProfile {
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.customer_id,
    authorName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    isApproved: row.is_approved,
    createdAt: row.created_at,
  };
}

async function getProductIdBySlug(slug: string): Promise<string> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug.trim())
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) throw new NotFoundError("Product not found");

  return (data as { id: string }).id;
}

export async function listProductReviewsBySlug(
  slug: string,
  approvedOnly = true
): Promise<ProductReviewSummary> {
  const productId = await getProductIdBySlug(slug);

  let query = supabase
    .from("product_reviews")
    .select()
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (approvedOnly) {
    query = query.eq("is_approved", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list reviews: ${error.message}`);

  const reviews = ((data ?? []) as ProductReviewRow[]).map(toReviewProfile);
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  return { averageRating, totalReviews, reviews };
}

export async function createProductReview(
  slug: string,
  input: CreateReviewInput,
  customerId?: string
): Promise<ProductReviewProfile> {
  const productId = await getProductIdBySlug(slug);

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: productId,
      customer_id: customerId ?? null,
      author_name: input.authorName.trim(),
      rating: input.rating,
      comment: input.comment.trim(),
      is_approved: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create review: ${error.message}`);

  return toReviewProfile(data as ProductReviewRow);
}

function toAdminReviewProfile(row: ProductReviewRowWithProduct): AdminProductReviewProfile {
  return {
    ...toReviewProfile(row),
    productName: row.products?.product_name ?? "Unknown product",
    productSlug: row.products?.slug ?? "",
  };
}

export async function listAllReviews(): Promise<AdminProductReviewProfile[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*, products(product_name, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list reviews: ${error.message}`);

  return ((data ?? []) as ProductReviewRowWithProduct[]).map(toAdminReviewProfile);
}

export async function updateReviewStatus(
  id: string,
  isApproved: boolean
): Promise<ProductReviewProfile> {
  const { data, error } = await supabase
    .from("product_reviews")
    .update({ is_approved: isApproved })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update review: ${error.message}`);
  if (!data) throw new NotFoundError("Review not found");

  return toReviewProfile(data as ProductReviewRow);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete review: ${error.message}`);
}
