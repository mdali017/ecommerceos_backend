import { supabase } from "../../config/supabase";
import { AppError, ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/app-error";
import {
  recordCouponUsage,
  validateCouponForOrder,
} from "../coupons/coupon.service";
import {
  notifyOrderPlaced,
  notifyOrderStatusChanged,
} from "../notifications/notification.service";
import { ensureReturnRequestForReturnedOrder } from "../returns/return.service";
import {
  calculateCheckoutTotals,
  calculateShippingQuote,
} from "../shipping/shipping.service";
import type { ProductRow } from "../products/product.types";
import type {
  OrderItemProfile,
  OrderItemRow,
  OrderProfile,
  OrderRow,
  OrderStatus,
  OrderSummary,
  PaymentStatus,
} from "./order.types";
import type { CreateOrderInput } from "./order.validation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toOrderItemProfile(row: OrderItemRow): OrderItemProfile {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    productImage: row.product_image,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    lineTotal: Number(row.line_total),
  };
}

function toOrderProfile(row: OrderRow, items: OrderItemProfile[]): OrderProfile {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    customerAddress: row.customer_address,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status ?? "pending",
    subtotal: Number(row.subtotal),
    deliveryCharge: Number(row.delivery_charge),
    discount: Number(row.discount),
    total: Number(row.total),
    notes: row.notes,
    shippingZoneId: row.shipping_zone_id ?? null,
    courierName: row.courier_name ?? null,
    trackingNumber: row.tracking_number ?? null,
    estimatedDelivery: row.estimated_delivery ?? null,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOrderSummary(row: OrderRow, itemCount: number): OrderSummary {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    status: row.status,
    paymentStatus: row.payment_status ?? "pending",
    total: Number(row.total),
    itemCount,
    createdAt: row.created_at,
  };
}

function resolveUnitPrice(product: ProductRow): number {
  const selling = Number(product.selling_price);
  const offer = Number(product.offer_price);
  if (offer > 0 && offer < selling) return offer;
  return selling;
}

function calculateCharges(
  subtotal: number,
  shippingQuote: Awaited<ReturnType<typeof calculateShippingQuote>>,
  coupon?: { discountAmount: number; freeShipping: boolean }
) {
  return calculateCheckoutTotals(subtotal, shippingQuote, coupon);
}

function generateOrderNumber(): string {
  return `KF-${Date.now().toString().slice(-8)}`;
}

function raiseOrderDbError(action: string, error: { message: string }): never {
  if (error.message.includes("Could not find the table") && error.message.includes("orders")) {
    throw new AppError(
      503,
      "Orders table is not set up yet. Run npm run setup:orders or execute supabase/migrations/010_orders.sql in Supabase SQL Editor.",
      "ORDERS_TABLE_MISSING"
    );
  }

  throw new Error(`${action}: ${error.message}`);
}

function deriveStatus(stockQty: number, minStock: number): string {
  if (stockQty <= 0) return "out_of_stock";
  if (minStock > 0 && stockQty <= minStock) return "low_stock";
  return "active";
}

async function fetchProductByIdentifier(identifier: string): Promise<ProductRow | null> {
  const trimmed = identifier.trim();
  const column = UUID_RE.test(trimmed) ? "id" : "slug";

  const { data, error } = await supabase
    .from("products")
    .select()
    .eq(column, trimmed)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) return null;

  return data as ProductRow;
}

async function getProductImage(productId: string): Promise<string> {
  const { data, error } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product image: ${error.message}`);
  return data?.url ?? "";
}

async function deductStock(product: ProductRow, quantity: number): Promise<void> {
  const nextStock = product.stock_qty - quantity;
  const nextStatus = deriveStatus(nextStock, product.min_stock);

  const { error } = await supabase
    .from("products")
    .update({ stock_qty: nextStock, status: nextStatus })
    .eq("id", product.id);

  if (error) throw new Error(`Failed to update stock: ${error.message}`);
}

async function fetchOrderItems(orderId: string): Promise<OrderItemProfile[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch order items: ${error.message}`);

  return ((data ?? []) as OrderItemRow[]).map(toOrderItemProfile);
}

async function getOrderRowByIdentifier(identifier: string): Promise<OrderRow> {
  const trimmed = identifier.trim();
  const column = UUID_RE.test(trimmed) ? "id" : "order_number";

  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq(column, trimmed)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch order: ${error.message}`);
  if (!data) throw new NotFoundError("Order not found");

  return data as OrderRow;
}

export async function createOrder(
  input: CreateOrderInput,
  customerId?: string
): Promise<OrderProfile> {
  const resolvedItems: {
    product: ProductRow | null;
    productName: string;
    productSlug: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imageUrl: string;
  }[] = [];

  let subtotal = 0;

  for (const item of input.items) {
    const product = await fetchProductByIdentifier(item.productId);

    if (product) {
      if (product.status === "out_of_stock" || product.status === "draft") {
        throw new ValidationError(`${product.product_name} is not available`);
      }

      if (product.stock_qty < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for ${product.product_name}. Available: ${product.stock_qty}`
        );
      }
    }

    const snapshotName = item.productName.trim();
    const snapshotPrice = Number(item.unitPrice);
    if (!product && (!snapshotName || snapshotPrice <= 0)) {
      throw new NotFoundError(`Product not found: ${item.productId}`);
    }

    const unitPrice = product ? resolveUnitPrice(product) : snapshotPrice;
    const lineTotal = unitPrice * item.quantity;
    const imageUrl = product ? await getProductImage(product.id) : item.productImage.trim();

    subtotal += lineTotal;
    resolvedItems.push({
      product,
      productName: product?.product_name ?? snapshotName,
      productSlug: (product?.slug ?? item.productSlug.trim()) || item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      imageUrl,
    });
  }

  const couponCode = input.couponCode?.trim();
  let appliedCoupon:
    | { discountAmount: number; freeShipping: boolean; couponId: string; code: string }
    | undefined;

  if (couponCode) {
    const validation = await validateCouponForOrder(couponCode, subtotal, customerId);
    if (!validation.valid || !validation.couponId) {
      throw new ValidationError(validation.message);
    }
    appliedCoupon = {
      discountAmount: validation.discountAmount,
      freeShipping: validation.freeShipping,
      couponId: validation.couponId,
      code: validation.code,
    };
  }

  const shippingQuote = await calculateShippingQuote(
    subtotal,
    input.shippingZoneId,
    appliedCoupon?.freeShipping ?? false
  );

  const { deliveryCharge, discount, total, estimatedDelivery, shippingZoneId } =
    calculateCharges(subtotal, shippingQuote, appliedCoupon);
  const orderNumber = generateOrderNumber();

  const orderPayload: Record<string, unknown> = {
    order_number: orderNumber,
    customer_id: customerId ?? null,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_email: input.customerEmail.trim().toLowerCase(),
    customer_address: input.customerAddress.trim(),
    status: "pending",
    payment_method: input.paymentMethod ?? "cod",
    subtotal,
    delivery_charge: deliveryCharge,
    discount,
    total,
    notes: input.notes?.trim() ?? "",
    shipping_zone_id: shippingZoneId,
    estimated_delivery: estimatedDelivery,
  };

  if (appliedCoupon) {
    orderPayload.coupon_code = appliedCoupon.code;
    orderPayload.coupon_id = appliedCoupon.couponId;
  }

  let { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (orderError && appliedCoupon && orderError.message.includes("coupon")) {
    delete orderPayload.coupon_code;
    delete orderPayload.coupon_id;
    ({ data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single());
  }

  if (orderError && orderError.message.includes("shipping_zone")) {
    delete orderPayload.shipping_zone_id;
    delete orderPayload.estimated_delivery;
    ({ data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single());
  }

  if (orderError) raiseOrderDbError("Failed to create order", orderError);

  const order = orderData as OrderRow;

  const itemRows = resolvedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product?.id ?? null,
    product_name: item.productName,
    product_slug: item.productSlug,
    product_image: item.imageUrl,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    line_total: item.lineTotal,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(itemRows)
    .select();

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error(`Failed to create order items: ${itemsError.message}`);
  }

  for (const item of resolvedItems) {
    if (item.product) {
      await deductStock(item.product, item.quantity);
    }
  }

  if (appliedCoupon) {
    await recordCouponUsage(appliedCoupon.couponId, order.id, customerId);
  }

  if (customerId) {
    await notifyOrderPlaced(customerId, order.order_number, total).catch(() => undefined);
  }

  const items = ((insertedItems ?? []) as OrderItemRow[]).map(toOrderItemProfile);
  return toOrderProfile(order, items);
}

export async function listMyOrders(customerId: string): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select()
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list orders: ${error.message}`);

  const rows = (data ?? []) as OrderRow[];
  const summaries: OrderSummary[] = [];

  for (const row of rows) {
    const items = await fetchOrderItems(row.id);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    summaries.push(toOrderSummary(row, itemCount));
  }

  return summaries;
}

export async function listAllOrders(status?: OrderStatus): Promise<OrderSummary[]> {
  let query = supabase.from("orders").select().order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list orders: ${error.message}`);

  const rows = (data ?? []) as OrderRow[];
  const summaries: OrderSummary[] = [];

  for (const row of rows) {
    const items = await fetchOrderItems(row.id);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    summaries.push(toOrderSummary(row, itemCount));
  }

  return summaries;
}

export async function getOrderById(
  identifier: string,
  requester?: { sub: string; role: "customer" | "admin" }
): Promise<OrderProfile> {
  const order = await getOrderRowByIdentifier(identifier);
  const items = await fetchOrderItems(order.id);

  if (requester?.role === "customer" && order.customer_id !== requester.sub) {
    throw new ForbiddenError("You do not have access to this order");
  }

  return toOrderProfile(order, items);
}

export async function updateOrderStatus(
  identifier: string,
  status: OrderStatus
): Promise<OrderProfile> {
  const current = await getOrderRowByIdentifier(identifier);

  // When order is completed/delivered, payment becomes paid (COD confirmation).
  // Do not force other statuses back to pending if payment was already paid.
  const patch: { status: OrderStatus; payment_status?: PaymentStatus } = { status };
  if (status === "delivered" || status === "completed") {
    patch.payment_status = "paid";
  }

  let { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", current.id)
    .select()
    .single();

  // Fallback for when 013_order_payment_status.sql has not been applied yet
  if (error && error.message.includes("payment_status")) {
    ({ data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", current.id)
      .select()
      .single());
  }

  if (error) throw new Error(`Failed to update order status: ${error.message}`);

  const updatedOrder = data as OrderRow;

  // If payment_status column exists but wasn't returned/updated for an older row path,
  // ensure completed/delivered orders are marked paid.
  if (
    (status === "delivered" || status === "completed") &&
    updatedOrder.payment_status !== "paid"
  ) {
    const { data: paidRow, error: paidError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", current.id)
      .select()
      .single();

    if (!paidError && paidRow) {
      Object.assign(updatedOrder, paidRow);
    }
  }

  if (updatedOrder.customer_id && updatedOrder.status !== current.status) {
    await notifyOrderStatusChanged(
      updatedOrder.customer_id,
      updatedOrder.order_number,
      updatedOrder.status
    ).catch(() => undefined);
  }

  if (status === "returned" && current.status !== "returned") {
    await ensureReturnRequestForReturnedOrder({
      id: updatedOrder.id,
      customer_id: updatedOrder.customer_id,
      order_number: updatedOrder.order_number,
    }).catch(() => undefined);
  }

  const items = await fetchOrderItems(current.id);
  return toOrderProfile(updatedOrder, items);
}

export async function updateOrderShipping(
  identifier: string,
  input: { courierName?: string; trackingNumber?: string; estimatedDelivery?: string }
): Promise<OrderProfile> {
  const current = await getOrderRowByIdentifier(identifier);

  const { data, error } = await supabase
    .from("orders")
    .update({
      courier_name: input.courierName?.trim() ?? "",
      tracking_number: input.trackingNumber?.trim() ?? "",
      estimated_delivery: input.estimatedDelivery?.trim() ?? current.estimated_delivery ?? "",
      status: current.status === "processing" || current.status === "confirmed" ? "shipped" : current.status,
    })
    .eq("id", current.id)
    .select()
    .single();

  if (error && error.message.includes("courier_name")) {
    throw new AppError(
      503,
      "Order shipping fields are not set up yet. Run supabase/migrations/018_shipping.sql in Supabase SQL Editor.",
      "SHIPPING_FIELDS_MISSING"
    );
  }

  if (error) throw new Error(`Failed to update order shipping: ${error.message}`);

  const updatedOrder = data as OrderRow;

  if (updatedOrder.customer_id) {
    await notifyOrderStatusChanged(
      updatedOrder.customer_id,
      updatedOrder.order_number,
      "shipped"
    ).catch(() => undefined);
  }

  const items = await fetchOrderItems(current.id);
  return toOrderProfile(updatedOrder, items);
}
