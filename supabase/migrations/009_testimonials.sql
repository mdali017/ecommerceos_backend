-- Customer testimonials on homepage

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  review_bn TEXT NOT NULL,
  review_en TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_sort_order ON testimonials(sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);

DROP TRIGGER IF EXISTS testimonials_updated_at ON testimonials;
CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

INSERT INTO testimonials (id, name_bn, name_en, review_bn, review_en, rating, avatar, sort_order, is_active) VALUES
  (
    'e5000001-0000-4000-8000-000000000001',
    'রাহিমা বেগম',
    'Rahima Begum',
    'মধু ও ঘি একদম খাঁটি। ডেলিভারিও সময়মতো হয়েছে।',
    'The honey and ghee are absolutely pure. Delivery was on time too.',
    5,
    'র',
    1,
    TRUE
  ),
  (
    'e5000001-0000-4000-8000-000000000002',
    'করিম হোসেন',
    'Karim Hossen',
    'আমের মান অসাধারণ! রাজশাহীর মতো স্বাদ পেয়েছি।',
    'Amazing mango quality! Tasted just like Rajshahi mangoes.',
    5,
    'ক',
    2,
    TRUE
  ),
  (
    'e5000001-0000-4000-8000-000000000003',
    'সুমাইয়া আক্তার',
    'Sumaiya Akter',
    'মশলার গুণমান দেখে মুগ্ধ। সবাইকে রেকমেন্ড করি।',
    'Impressed by the spice quality. Highly recommended!',
    5,
    'স',
    3,
    TRUE
  ),
  (
    'e5000001-0000-4000-8000-000000000004',
    'আব্দুল্লাহ আল মামুন',
    'Abdullah Al Mamun',
    'বারবার অর্ডার করছি। দাম reasonable এবং প্রোডাক্ট authentic।',
    'I order regularly. Reasonable prices and authentic products.',
    4,
    'আ',
    4,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name_bn = EXCLUDED.name_bn,
  name_en = EXCLUDED.name_en,
  review_bn = EXCLUDED.review_bn,
  review_en = EXCLUDED.review_en,
  rating = EXCLUDED.rating,
  avatar = EXCLUDED.avatar,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
