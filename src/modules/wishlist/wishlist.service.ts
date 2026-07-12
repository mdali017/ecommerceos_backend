import { supabase } from "../../config/supabase";
import { NotFoundError, ValidationError } from "../../shared/errors/app-error";
import type {
  WishlistItemProfile,
  WishlistItemRow,
  WishlistProductRow,
} from "./wishlist.types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getProductImage(productId: string): Promise<string> {
  const { data, error } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product image: ${error.message}`);
  return data?.url ?? "";
}

async function toWishlistProfile(
  row: WishlistItemRow,
  product: WishlistProductRow
): Promise<WishlistItemProfile> {
  const imageUrl = await getProductImage(product.id);
  return {
    id: row.id,
    productId: product.id,
    productName: product.product_name,
    slug: product.slug,
    sellingPrice: Number(product.selling_price),
    offerPrice: Number(product.offer_price),
    unit: product.unit,
    packSize: product.pack_size,
    imageUrl,
    inStock: product.status !== "out_of_stock" && product.status !== "draft",
    createdAt: row.created_at,
  };
}

async function resolveProductId(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  const column = UUID_RE.test(trimmed) ? "id" : "slug";

  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq(column, trimmed)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) throw new NotFoundError("Product not found");

  return (data as { id: string }).id;
}

async function fetchProduct(productId: string): Promise<WishlistProductRow> {
  const { data, error } = await supabase
    .from("products")
    .select("id, product_name, slug, selling_price, offer_price, unit, pack_size, status, discount_percent")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) throw new NotFoundError("Product not found");

  return data as WishlistProductRow;
}

export async function listWishlist(customerId: string): Promise<WishlistItemProfile[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select()
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list wishlist: ${error.message}`);

  const rows = (data ?? []) as WishlistItemRow[];
  const profiles: WishlistItemProfile[] = [];

  for (const row of rows) {
    const product = await fetchProduct(row.product_id);
    profiles.push(await toWishlistProfile(row, product));
  }

  return profiles;
}

export async function addToWishlist(
  customerId: string,
  productIdentifier: string
): Promise<WishlistItemProfile> {
  const productId = await resolveProductId(productIdentifier);
  await fetchProduct(productId);

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select()
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const product = await fetchProduct(productId);
    return toWishlistProfile(existing as WishlistItemRow, product);
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({ customer_id: customerId, product_id: productId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ValidationError("Product is already in wishlist");
    }
    throw new Error(`Failed to add to wishlist: ${error.message}`);
  }

  const product = await fetchProduct(productId);
  return toWishlistProfile(data as WishlistItemRow, product);
}

export async function removeFromWishlist(
  customerId: string,
  productIdentifier: string
): Promise<void> {
  const productId = await resolveProductId(productIdentifier);
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (error) throw new Error(`Failed to remove from wishlist: ${error.message}`);
}

export async function isInWishlist(
  customerId: string,
  productId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw new Error(`Failed to check wishlist: ${error.message}`);
  return Boolean(data);
}

export async function getWishlistProductIds(customerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id, products(slug)")
    .eq("customer_id", customerId);

  if (error) throw new Error(`Failed to fetch wishlist ids: ${error.message}`);

  return ((data ?? []) as Array<{ product_id: string; products: { slug: string } | { slug: string }[] | null }>).map(
    (row) => {
      const product = row.products;
      const slug = Array.isArray(product) ? product[0]?.slug : product?.slug;
      return slug ?? row.product_id;
    }
  );
}
