-- Hero slider banners for homepage carousel

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_bn TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT NOT NULL DEFAULT '',
  cta_bn TEXT NOT NULL DEFAULT '',
  cta_en TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_sort_order ON hero_slides(sort_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_is_active ON hero_slides(is_active);

DROP TRIGGER IF EXISTS hero_slides_updated_at ON hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

INSERT INTO hero_slides (id, title_bn, title_en, subtitle_bn, subtitle_en, cta_bn, cta_en, image_url, sort_order, is_active) VALUES
  (
    'a1000001-0000-4000-8000-000000000001',
    'প্রতিদিনের পুষ্টি যোগাতে স্বাস্থ্যকর খেজুর',
    'Healthy dates for everyday nutrition',
    'খাঁটি ও প্রাকৃতিক — সরাসরি সংগ্রহ',
    'Pure & natural — sourced directly',
    'এখনই অর্ডার করুন',
    'Order Now',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1000&h=500&fit=crop',
    1,
    TRUE
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'খাঁটি ঘি ও প্রাকৃতিক মধু',
    'Pure ghee & natural honey',
    '১০০% খাঁটি — কোনো মিশ্রণ নেই',
    '100% pure — no additives',
    'দেখুন সব পণ্য',
    'Browse Products',
    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1400&h=500&fit=crop',
    2,
    TRUE
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'বিশ্বমানের মশলা সংগ্রহ',
    'Premium spice collection',
    'রান্নায় দিন আসল স্বাদ',
    'Bring authentic flavor to your kitchen',
    'কিনুন এখন',
    'Shop Now',
    'https://images.unsplash.com/photo-1596040033229-a0b451c4f2a6?w=1400&h=500&fit=crop',
    3,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title_bn = EXCLUDED.title_bn,
  title_en = EXCLUDED.title_en,
  subtitle_bn = EXCLUDED.subtitle_bn,
  subtitle_en = EXCLUDED.subtitle_en,
  cta_bn = EXCLUDED.cta_bn,
  cta_en = EXCLUDED.cta_en,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Supabase Storage bucket (run in Dashboard if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('hero-slides', 'hero-slides', true)
-- ON CONFLICT (id) DO NOTHING;
