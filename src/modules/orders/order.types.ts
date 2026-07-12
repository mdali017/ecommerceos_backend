export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  status: OrderStatus;
  payment_method: string;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  product_image: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface OrderItemProfile {
  id: string;
  productId: string | null;
  productName: string;
  productSlug: string | null;
  productImage: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderProfile {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  status: OrderStatus;
  paymentMethod: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  notes: string;
  itemCount: number;
  items: OrderItemProfile[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}
