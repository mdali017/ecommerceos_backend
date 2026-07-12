-- Mid-page promotional banner on homepage

CREATE TABLE IF NOT EXISTS promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_bn TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_banners_sort_order ON promo_banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_promo_banners_is_active ON promo_banners(is_active);

DROP TRIGGER IF EXISTS promo_banners_updated_at ON promo_banners;
CREATE TRIGGER promo_banners_updated_at
  BEFORE UPDATE ON promo_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;

INSERT INTO promo_banners (id, title_bn, title_en, subtitle_bn, subtitle_en, image_url, sort_order, is_active) VALUES
  (
    'd4000001-0000-4000-8000-000000000001',
    'প্রাকৃতিক ও খাঁটি পণ্য',
    'Natural & Pure Products',
    'সরাসরি কৃষকের কাছ থেকে আপনার দোরগোড়ায়',
    'From farm to your doorstep',
    'https://images.unsplash.com/photo-1596040033229-a0b451c4f2a6?w=1400&h=400&fit=crop',
    1,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title_bn = EXCLUDED.title_bn,
  title_en = EXCLUDED.title_en,
  subtitle_bn = EXCLUDED.subtitle_bn,
  subtitle_en = EXCLUDED.subtitle_en,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Supabase Storage bucket (run in Dashboard if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('promo-banners', 'promo-banners', true)
-- ON CONFLICT (id) DO NOTHING;
