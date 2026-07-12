-- Nav categories admin support

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Refresh seed data (safe to re-run)
INSERT INTO categories (slug, name, name_bn, icon, sort_order, keywords, is_active) VALUES
  ('am', 'Mango', 'আম', '🥭', 1, 'am,mango,আম', TRUE),
  ('khejur', 'Dates', 'খেজুর', '🌴', 2, 'khejur,dates,খেজুর', TRUE),
  ('modhu', 'Honey', 'মধু', '🍯', 3, 'modhu,honey,মধু', TRUE),
  ('tel', 'Oil', 'তেল', '🫒', 4, 'tel,oil,তেল', TRUE),
  ('ghi', 'Ghee', 'ঘি', '🧈', 5, 'ghi,ghee,ঘি', TRUE),
  ('moshla', 'Spice', 'মশলা', '🌶️', 6, 'moshla,spice,মশলা', TRUE),
  ('chal', 'Rice', 'চাল', '🌾', 7, 'chal,rice,চাল', TRUE),
  ('dal', 'Lentils', 'ডাল', '🫘', 8, 'dal,lentils,ডাল', TRUE),
  ('badam', 'Nuts', 'বাদাম', '🥜', 9, 'badam,nuts,বাদাম', TRUE),
  ('shukno-fol', 'Dried Fruits', 'শুকনো ফল', '🍇', 10, 'shukno,dried fruit,শুকনো ফল', TRUE),
  ('cha-kofi', 'Tea & Coffee', 'চা-কফি', '🍵', 11, 'cha,kofi,tea,coffee,চা,কফি', TRUE),
  ('shastho', 'Health', 'স্বাস্থ্য', '💚', 12, 'shastho,health,স্বাস্থ্য', TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  keywords = EXCLUDED.keywords,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Supabase Storage bucket (run in Dashboard if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('category-icons', 'category-icons', true)
-- ON CONFLICT (id) DO NOTHING;
