export type ReturnStatus = "pending" | "approved" | "rejected" | "refunded" | "completed";
export type RefundStatus = "pending" | "processing" | "refunded" | "rejected";

export interface ReturnRequestRow {
  id: string;
  order_id: string;
  customer_id: string | null;
  reason: string;
  description: string;
  status: ReturnStatus;
  refund_status: RefundStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnRequestRowWithOrder extends ReturnRequestRow {
  orders: {
    order_number: string;
    customer_name: string;
    total: number;
  } | null;
}

export interface ReturnRequestProfile {
  id: string;
  orderId: string;
  customerId: string | null;
  reason: string;
  description: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReturnRequestProfile extends ReturnRequestProfile {
  orderNumber: string;
  customerName: string;
  orderTotal: number;
}
