export type HomepageSectionType = "grid" | "carousel" | "flash_sale";
export type HomepageProductSource = "featured" | "on_sale" | "category" | "manual";

export interface HomepageProductSectionRow {
  id: string;
  title_bn: string;
  title_en: string;
  section_type: HomepageSectionType;
  product_source: HomepageProductSource;
  category_slug: string;
  category_keywords: string;
  product_skus: string;
  max_products: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageProductSectionProfile {
  id: string;
  titleBn: string;
  titleEn: string;
  sectionType: HomepageSectionType;
  productSource: HomepageProductSource;
  categorySlug: string;
  categoryKeywords: string;
  productSkus: string;
  maxProducts: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
