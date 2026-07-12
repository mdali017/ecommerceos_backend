-- Categories schema for product catalog navigation

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  name_bn TEXT NOT NULL,
  icon TEXT DEFAULT '',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  keywords TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

INSERT INTO categories (slug, name, name_bn, icon, sort_order, keywords) VALUES
  ('am', 'Mango', 'আম', '🥭', 1, 'am,mango,আম'),
  ('khejur', 'Dates', 'খেজুর', '🌴', 2, 'khejur,dates,খেজুর'),
  ('modhu', 'Honey', 'মধু', '🍯', 3, 'modhu,honey,মধু'),
  ('tel', 'Oil', 'তেল', '🫒', 4, 'tel,oil,তেল'),
  ('ghi', 'Ghee', 'ঘি', '🧈', 5, 'ghi,ghee,ঘি'),
  ('moshla', 'Spice', 'মশলা', '🌶️', 6, 'moshla,spice,মশলা'),
  ('chal', 'Rice', 'চাল', '🌾', 7, 'chal,rice,চাল'),
  ('dal', 'Lentils', 'ডাল', '🫘', 8, 'dal,lentils,ডাল'),
  ('badam', 'Nuts', 'বাদাম', '🥜', 9, 'badam,nuts,বাদাম'),
  ('shukno-fol', 'Dried Fruits', 'শুকনো ফল', '🍇', 10, 'shukno,dried fruit,শুকনো ফল'),
  ('cha-kofi', 'Tea & Coffee', 'চা-কফি', '🍵', 11, 'cha,kofi,tea,coffee,চা,কফি'),
  ('shastho', 'Health', 'স্বাস্থ্য', '💚', 12, 'shastho,health,স্বাস্থ্য')
ON CONFLICT (slug) DO NOTHING;
