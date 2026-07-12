import { supabase } from "../../config/supabase";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/app-error";
import type { ProductRow } from "../products/product.types";
import type {
  OrderItemProfile,
  OrderItemRow,
  OrderProfile,
  OrderRow,
  OrderStatus,
  OrderSummary,
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
    subtotal: Number(row.subtotal),
    deliveryCharge: Number(row.delivery_charge),
    discount: Number(row.discount),
    total: Number(row.total),
    notes: row.notes,
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

function calculateCharges(subtotal: number) {
  const deliveryCharge = subtotal >= 2000 ? 0 : 80;
  const discount = subtotal >= 3000 ? 150 : 0;
  const total = Math.max(0, subtotal + deliveryCharge - discount);
  return { deliveryCharge, discount, total };
}

function generateOrderNumber(): string {
  return `KF-${Date.now().toString().slice(-8)}`;
}

function deriveStatus(stockQty: number, minStock: number): string {
  if (stockQty <= 0) return "out_of_stock";
  if (minStock > 0 && stockQty <= minStock) return "low_stock";
  return "active";
}

async function fetchProductByIdentifier(identifier: string): Promise<ProductRow> {
  const trimmed = identifier.trim();
  const column = UUID_RE.test(trimmed) ? "id" : "slug";

  const { data, error } = await supabase
    .from("products")
    .select()
    .eq(column, trimmed)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) throw new NotFoundError(`Product not found: ${trimmed}`);

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
    product: ProductRow;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imageUrl: string;
  }[] = [];

  let subtotal = 0;

  for (const item of input.items) {
    const product = await fetchProductByIdentifier(item.productId);

    if (product.status === "out_of_stock" || product.status === "draft") {
      throw new ValidationError(`${product.product_name} is not available`);
    }

    if (product.stock_qty < item.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${product.product_name}. Available: ${product.stock_qty}`
      );
    }

    const unitPrice = resolveUnitPrice(product);
    const lineTotal = unitPrice * item.quantity;
    const imageUrl = await getProductImage(product.id);

    subtotal += lineTotal;
    resolvedItems.push({
      product,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      imageUrl,
    });
  }

  const { deliveryCharge, discount, total } = calculateCharges(subtotal);
  const orderNumber = generateOrderNumber();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
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
    })
    .select()
    .single();

  if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

  const order = orderData as OrderRow;

  const itemRows = resolvedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.product_name,
    product_slug: item.product.slug,
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
    await deductStock(item.product, item.quantity);
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

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", current.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update order status: ${error.message}`);

  const items = await fetchOrderItems(current.id);
  return toOrderProfile(data as OrderRow, items);
}
