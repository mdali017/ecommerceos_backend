import { randomUUID } from "crypto";
import path from "path";
import { supabase } from "../../config/supabase";
import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error";
import type { CategoryProfile, CategoryRow } from "./category.types";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validation";

const STORAGE_BUCKET = "category-icons";

function toCategoryProfile(row: CategoryRow, productCount?: number): CategoryProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameBn: row.name_bn,
    icon: row.icon,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    keywords: row.keywords,
    isActive: row.is_active ?? true,
    productCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingIsActiveColumn(message: string) {
  return message.includes("is_active");
}

function buildKeywords(input: { slug: string; name: string; nameBn: string; keywords?: string }) {
  const parts = [
    input.slug,
    input.name,
    input.nameBn,
    ...(input.keywords ?? "").split(","),
  ];
  return Array.from(new Set(parts.map((part) => part.trim()).filter(Boolean))).join(",");
}

function getCategoryKeywords(category: CategoryRow): string[] {
  const parts = [category.name_bn, category.name, category.slug, ...category.keywords.split(",")];
  return parts.map((part) => part.trim().toLowerCase()).filter(Boolean);
}

async function attachProductCounts(categories: CategoryRow[]): Promise<CategoryProfile[]> {
  if (categories.length === 0) return [];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("category, subcategory, tags, status")
    .in("status", ["active", "low_stock"]);

  if (productsError) {
    throw new Error(`Failed to count category products: ${productsError.message}`);
  }

  const productRows = products ?? [];

  return categories.map((category) => {
    const keywords = getCategoryKeywords(category);
    const productCount = productRows.filter((product) => {
      const haystack = [product.category, product.subcategory, product.tags]
        .join(" ")
        .toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    }).length;

    return toCategoryProfile(category, productCount);
  });
}

async function fetchCategories(activeOnly = false): Promise<CategoryProfile[]> {
  let query = supabase.from("categories").select().order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  let { data, error } = await query;

  if (error && isMissingIsActiveColumn(error.message)) {
    const fallback = await supabase
      .from("categories")
      .select()
      .order("sort_order", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(`Failed to list categories: ${error.message}`);

  return attachProductCounts((data ?? []) as CategoryRow[]);
}

export async function listCategories(): Promise<CategoryProfile[]> {
  return fetchCategories(true);
}

export async function listAllCategories(): Promise<CategoryProfile[]> {
  return fetchCategories(false);
}

export async function getCategoryBySlug(slug: string, activeOnly = true): Promise<CategoryProfile> {
  let query = supabase.from("categories").select().eq("slug", slug);
  if (activeOnly) query = query.eq("is_active", true);

  let { data, error } = await query.maybeSingle();

  if (error && isMissingIsActiveColumn(error.message)) {
    const fallback = await supabase.from("categories").select().eq("slug", slug).maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(`Failed to fetch category: ${error.message}`);
  if (!data) throw new NotFoundError("Category not found");

  return toCategoryProfile(data as CategoryRow);
}

export async function getCategoryById(id: string): Promise<CategoryProfile> {
  const { data, error } = await supabase.from("categories").select().eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to fetch category: ${error.message}`);
  if (!data) throw new NotFoundError("Category not found");

  return toCategoryProfile(data as CategoryRow);
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryProfile> {
  const slug = input.slug.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) throw new ConflictError("Category slug already exists");

  const row = {
    slug,
    name: input.name.trim(),
    name_bn: input.nameBn.trim(),
    icon: input.icon.trim(),
    sort_order: input.sortOrder ?? 0,
    keywords: buildKeywords(input),
    is_active: input.isActive ?? true,
    parent_id: input.parentId ?? null,
  };

  const { data, error } = await supabase.from("categories").insert(row).select().single();
  if (error) throw new Error(`Failed to create category: ${error.message}`);

  return toCategoryProfile(data as CategoryRow);
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryProfile> {
  const current = await getCategoryById(id);

  if (input.slug && input.slug.trim().toLowerCase() !== current.slug) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", input.slug.trim().toLowerCase())
      .neq("id", id)
      .maybeSingle();

    if (existing) throw new ConflictError("Category slug already exists");
  }

  const next = {
    slug: input.slug?.trim().toLowerCase() ?? current.slug,
    name: input.name?.trim() ?? current.name,
    name_bn: input.nameBn?.trim() ?? current.nameBn,
    icon: input.icon?.trim() ?? current.icon,
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
    parent_id: input.parentId ?? current.parentId,
    keywords: buildKeywords({
      slug: input.slug?.trim().toLowerCase() ?? current.slug,
      name: input.name?.trim() ?? current.name,
      nameBn: input.nameBn?.trim() ?? current.nameBn,
      keywords: input.keywords ?? current.keywords,
    }),
  };

  const { data, error } = await supabase
    .from("categories")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update category: ${error.message}`);

  return toCategoryProfile(data as CategoryRow);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete category: ${error.message}`);
}

export async function uploadCategoryIcon(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || ".png";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(500, `Icon upload failed: ${error.message}`, "UPLOAD_FAILED");
  }

  const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

export function matchesCategory(
  category: CategoryRow | CategoryProfile,
  product: { category: string; subcategory: string; tags: string }
): boolean {
  const keywords =
    "nameBn" in category
      ? [category.nameBn, category.name, category.slug, ...category.keywords.split(",")]
      : [category.name_bn, category.name, category.slug, ...category.keywords.split(",")];

  const normalized = keywords.map((part) => part.trim().toLowerCase()).filter(Boolean);
  const haystack = [product.category, product.subcategory, product.tags]
    .join(" ")
    .toLowerCase();

  return normalized.some((keyword) => haystack.includes(keyword));
}
