-- Return requests (Phase 9)

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'refunded', 'completed')
  ),
  refund_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    refund_status IN ('pending', 'processing', 'refunded', 'rejected')
  ),
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_customer_id ON return_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);

DROP TRIGGER IF EXISTS return_requests_updated_at ON return_requests;
CREATE TRIGGER return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
