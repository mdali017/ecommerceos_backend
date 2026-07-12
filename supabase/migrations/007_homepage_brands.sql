-- Homepage brand strip logos/names

CREATE TABLE IF NOT EXISTS homepage_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_brands_sort_order ON homepage_brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_homepage_brands_is_active ON homepage_brands(is_active);

DROP TRIGGER IF EXISTS homepage_brands_updated_at ON homepage_brands;
CREATE TRIGGER homepage_brands_updated_at
  BEFORE UPDATE ON homepage_brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE homepage_brands ENABLE ROW LEVEL SECURITY;

INSERT INTO homepage_brands (id, name, sort_order, is_active) VALUES
  ('c3000001-0000-4000-8000-000000000001', 'Khaas Organic', 1, TRUE),
  ('c3000001-0000-4000-8000-000000000002', 'Farm Fresh', 2, TRUE),
  ('c3000001-0000-4000-8000-000000000003', 'Pure Harvest', 3, TRUE),
  ('c3000001-0000-4000-8000-000000000004', 'Nature''s Best', 4, TRUE),
  ('c3000001-0000-4000-8000-000000000005', 'Green Valley', 5, TRUE),
  ('c3000001-0000-4000-8000-000000000006', 'Golden Grain', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Supabase Storage bucket (run in Dashboard if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true)
-- ON CONFLICT (id) DO NOTHING;
