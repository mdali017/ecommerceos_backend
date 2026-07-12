-- Payment status for orders (Phase 4)
-- COD flow: payment stays 'pending' until the order is delivered/completed,
-- then it is automatically marked 'paid'.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid'));

-- Backfill: already delivered/completed orders are considered paid
UPDATE orders
SET payment_status = 'paid'
WHERE status IN ('delivered', 'completed')
  AND payment_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Refresh PostgREST schema cache so API sees the new column immediately
NOTIFY pgrst, 'reload schema';
