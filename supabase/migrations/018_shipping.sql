-- Shipping zones & order shipping fields (Phase 9)

CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL DEFAULT '',
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 80,
  free_delivery_threshold NUMERIC(12, 2) NOT NULL DEFAULT 2000,
  estimated_days_min INTEGER NOT NULL DEFAULT 1,
  estimated_days_max INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO shipping_zones (id, name, name_bn, delivery_fee, free_delivery_threshold, estimated_days_min, estimated_days_max, sort_order)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Dhaka', 'ঢাকা', 80, 2000, 1, 2, 1),
  ('11111111-1111-1111-1111-111111111102', 'Outside Dhaka', 'ঢাকার বাইরে', 120, 3000, 2, 5, 2)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned')
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON shipping_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_zone_id ON orders(shipping_zone_id);

DROP TRIGGER IF EXISTS shipping_zones_updated_at ON shipping_zones;
CREATE TRIGGER shipping_zones_updated_at
  BEFORE UPDATE ON shipping_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
