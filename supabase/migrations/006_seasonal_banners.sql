-- Seasonal side banner next to hero slider

CREATE TABLE IF NOT EXISTS seasonal_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  cta_bn TEXT NOT NULL DEFAULT '',
  cta_en TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_banners_sort_order ON seasonal_banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_seasonal_banners_is_active ON seasonal_banners(is_active);

DROP TRIGGER IF EXISTS seasonal_banners_updated_at ON seasonal_banners;
CREATE TRIGGER seasonal_banners_updated_at
  BEFORE UPDATE ON seasonal_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE seasonal_banners ENABLE ROW LEVEL SECURITY;

INSERT INTO seasonal_banners (id, title_bn, title_en, cta_bn, cta_en, image_url, sort_order, is_active) VALUES
  (
    'b2000001-0000-4000-8000-000000000001',
    'মিষ্টি-রসালে স্বাদে অনন্য বাগানের সেরা আম্রপালি',
    'Garden-fresh Amrapali mangoes — sweet & juicy',
    'অর্ডার চলছে',
    'Order Now',
    'https://images.unsplash.com/photo-1553279768-865489fd8dcc?w=600&h=700&fit=crop',
    1,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title_bn = EXCLUDED.title_bn,
  title_en = EXCLUDED.title_en,
  cta_bn = EXCLUDED.cta_bn,
  cta_en = EXCLUDED.cta_en,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Supabase Storage bucket (run in Dashboard if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('seasonal-banners', 'seasonal-banners', true)
-- ON CONFLICT (id) DO NOTHING;
