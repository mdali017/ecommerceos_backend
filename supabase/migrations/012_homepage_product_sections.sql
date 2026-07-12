-- Dynamic homepage product sections (category / best sell / flash sale)

CREATE TABLE IF NOT EXISTS homepage_product_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  section_type TEXT NOT NULL DEFAULT 'carousel' CHECK (
    section_type IN ('grid', 'carousel', 'flash_sale')
  ),
  product_source TEXT NOT NULL DEFAULT 'category' CHECK (
    product_source IN ('featured', 'on_sale', 'category', 'manual')
  ),
  category_slug TEXT NOT NULL DEFAULT '',
  category_keywords TEXT NOT NULL DEFAULT '',
  product_skus TEXT NOT NULL DEFAULT '',
  max_products INTEGER NOT NULL DEFAULT 12 CHECK (max_products > 0 AND max_products <= 50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_product_sections_sort_order
  ON homepage_product_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_homepage_product_sections_is_active
  ON homepage_product_sections(is_active);

DROP TRIGGER IF EXISTS homepage_product_sections_updated_at ON homepage_product_sections;
CREATE TRIGGER homepage_product_sections_updated_at
  BEFORE UPDATE ON homepage_product_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE homepage_product_sections ENABLE ROW LEVEL SECURITY;

INSERT INTO homepage_product_sections (
  id, title_bn, title_en, section_type, product_source,
  category_slug, category_keywords, product_skus, max_products, sort_order, is_active
) VALUES
  (
    'f1000001-0000-4000-8000-000000000001',
    'টপ সেলিং পণ্য',
    'Top Selling Products',
    'grid',
    'manual',
    '',
    '',
    'KF-001,KF-002,KF-003,KF-004,KF-005,KF-006',
    6,
    10,
    TRUE
  ),
  (
    'f1000001-0000-4000-8000-000000000002',
    'তাজা আম',
    'Fresh Mango',
    'carousel',
    'category',
    'am',
    'mango,আম',
    'KF-007,KF-008,KF-009,KF-010,KF-011',
    12,
    30,
    TRUE
  ),
  (
    'f1000001-0000-4000-8000-000000000003',
    'ফ্ল্যাশ সেল',
    'Flash Sale',
    'flash_sale',
    'on_sale',
    '',
    '',
    'KF-021,KF-022,KF-023,KF-024,KF-025',
    12,
    40,
    TRUE
  ),
  (
    'f1000001-0000-4000-8000-000000000004',
    'খাঁটি মধু',
    'Pure Honey',
    'carousel',
    'category',
    'modhu',
    'honey,মধু',
    'KF-012,KF-013,KF-014,KF-015,KF-016',
    12,
    50,
    TRUE
  ),
  (
    'f1000001-0000-4000-8000-000000000005',
    'মশলা সংগ্রহ',
    'Spice Collection',
    'carousel',
    'category',
    'moshla',
    'spice,মশলা',
    'KF-006,KF-017,KF-018,KF-019,KF-020',
    12,
    70,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title_bn = EXCLUDED.title_bn,
  title_en = EXCLUDED.title_en,
  section_type = EXCLUDED.section_type,
  product_source = EXCLUDED.product_source,
  category_slug = EXCLUDED.category_slug,
  category_keywords = EXCLUDED.category_keywords,
  product_skus = EXCLUDED.product_skus,
  max_products = EXCLUDED.max_products,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

NOTIFY pgrst, 'reload schema';
