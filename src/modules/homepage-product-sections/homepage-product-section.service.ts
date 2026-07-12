import { supabase } from "../../config/supabase";
import { NotFoundError } from "../../shared/errors/app-error";
import type {
  HomepageProductSectionProfile,
  HomepageProductSectionRow,
} from "./homepage-product-section.types";
import type {
  CreateHomepageProductSectionInput,
  UpdateHomepageProductSectionInput,
} from "./homepage-product-section.validation";

function toProfile(row: HomepageProductSectionRow): HomepageProductSectionProfile {
  return {
    id: row.id,
    titleBn: row.title_bn,
    titleEn: row.title_en,
    sectionType: row.section_type,
    productSource: row.product_source,
    categorySlug: row.category_slug,
    categoryKeywords: row.category_keywords,
    productSkus: row.product_skus,
    maxProducts: row.max_products,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchSections(activeOnly = false): Promise<HomepageProductSectionProfile[]> {
  let query = supabase
    .from("homepage_product_sections")
    .select()
    .order("sort_order", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list homepage product sections: ${error.message}`);

  return ((data ?? []) as HomepageProductSectionRow[]).map(toProfile);
}

export async function listHomepageProductSections(): Promise<HomepageProductSectionProfile[]> {
  return fetchSections(true);
}

export async function listAllHomepageProductSections(): Promise<HomepageProductSectionProfile[]> {
  return fetchSections(false);
}

export async function getHomepageProductSectionById(
  id: string
): Promise<HomepageProductSectionProfile> {
  const { data, error } = await supabase
    .from("homepage_product_sections")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch homepage product section: ${error.message}`);
  if (!data) throw new NotFoundError("Homepage product section not found");

  return toProfile(data as HomepageProductSectionRow);
}

export async function createHomepageProductSection(
  input: CreateHomepageProductSectionInput
): Promise<HomepageProductSectionProfile> {
  const row = {
    title_bn: input.titleBn.trim(),
    title_en: input.titleEn?.trim() ?? "",
    section_type: input.sectionType ?? "carousel",
    product_source: input.productSource ?? "category",
    category_slug: input.categorySlug?.trim() ?? "",
    category_keywords: input.categoryKeywords?.trim() ?? "",
    product_skus: input.productSkus?.trim() ?? "",
    max_products: input.maxProducts ?? 12,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase
    .from("homepage_product_sections")
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create homepage product section: ${error.message}`);

  return toProfile(data as HomepageProductSectionRow);
}

export async function updateHomepageProductSection(
  id: string,
  input: UpdateHomepageProductSectionInput
): Promise<HomepageProductSectionProfile> {
  const current = await getHomepageProductSectionById(id);

  const next = {
    title_bn: input.titleBn?.trim() ?? current.titleBn,
    title_en: input.titleEn?.trim() ?? current.titleEn,
    section_type: input.sectionType ?? current.sectionType,
    product_source: input.productSource ?? current.productSource,
    category_slug: input.categorySlug?.trim() ?? current.categorySlug,
    category_keywords: input.categoryKeywords?.trim() ?? current.categoryKeywords,
    product_skus: input.productSkus?.trim() ?? current.productSkus,
    max_products: input.maxProducts ?? current.maxProducts,
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
  };

  const { data, error } = await supabase
    .from("homepage_product_sections")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update homepage product section: ${error.message}`);

  return toProfile(data as HomepageProductSectionRow);
}

export async function deleteHomepageProductSection(id: string): Promise<void> {
  const { error } = await supabase.from("homepage_product_sections").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete homepage product section: ${error.message}`);
}
