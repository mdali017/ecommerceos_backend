-- Products schema for bulk upload

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT DEFAULT '',
  product_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  generic_name TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  category TEXT DEFAULT '',
  subcategory TEXT DEFAULT '',
  description TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  pack_size TEXT DEFAULT '',
  purchase_price NUMERIC(12, 2) DEFAULT 0,
  cost_price NUMERIC(12, 2) DEFAULT 0,
  selling_price NUMERIC(12, 2) DEFAULT 0,
  offer_price NUMERIC(12, 2) DEFAULT 0,
  tax_percent NUMERIC(5, 2) DEFAULT 0,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  stock_qty INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  batch_no TEXT DEFAULT '',
  expiry_date DATE,
  manufacture_date DATE,
  supplier TEXT DEFAULT '',
  manufacturer TEXT DEFAULT '',
  weight TEXT DEFAULT '',
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  variant TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'low_stock', 'out_of_stock', 'draft')),
  featured BOOLEAN DEFAULT FALSE,
  tags TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Supabase Storage bucket (run separately if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;
