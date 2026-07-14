import { supabase } from "../../config/supabase";
import type {
  AdminCustomerSummary,
  AdminDashboardStats,
  AdminRecentOrder,
} from "./admin.types";

function startOfTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function getDashboardStats(): Promise<{
  stats: AdminDashboardStats;
  recentOrders: AdminRecentOrder[];
}> {
  const todayStart = startOfTodayIso();

  const [
    { count: totalOrders, error: ordersError },
    { count: totalCustomers, error: customersError },
    { count: totalProducts, error: productsError },
    { count: pendingOrders, error: pendingError },
    { count: lowStock, error: lowStockError },
    { data: todayOrders, error: todayError },
    { data: recentRows, error: recentError },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .in("status", ["low_stock", "out_of_stock"]),
    supabase.from("orders").select("total").gte("created_at", todayStart),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (ordersError) throw new Error(`Failed to count orders: ${ordersError.message}`);
  if (customersError) throw new Error(`Failed to count customers: ${customersError.message}`);
  if (productsError) throw new Error(`Failed to count products: ${productsError.message}`);
  if (pendingError) throw new Error(`Failed to count pending orders: ${pendingError.message}`);
  if (lowStockError) throw new Error(`Failed to count low stock products: ${lowStockError.message}`);
  if (todayError) throw new Error(`Failed to fetch today's sales: ${todayError.message}`);
  if (recentError) throw new Error(`Failed to fetch recent orders: ${recentError.message}`);

  const todaySales = (todayOrders ?? []).reduce(
    (sum, row) => sum + Number((row as { total: number }).total),
    0
  );

  const recentOrders: AdminRecentOrder[] = (recentRows ?? []).map((row) => {
    const order = row as {
      id: string;
      order_number: string;
      customer_name: string;
      total: number;
      status: string;
      created_at: string;
    };

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      total: Number(order.total),
      status: order.status,
      createdAt: order.created_at,
    };
  });

  return {
    stats: {
      totalOrders: totalOrders ?? 0,
      totalCustomers: totalCustomers ?? 0,
      totalProducts: totalProducts ?? 0,
      todaySales,
      pendingOrders: pendingOrders ?? 0,
      lowStock: lowStock ?? 0,
    },
    recentOrders,
  };
}

export async function listCustomers(): Promise<AdminCustomerSummary[]> {
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, address, source, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list customers: ${error.message}`);

  const { data: orderRows, error: ordersError } = await supabase
    .from("orders")
    .select("customer_id, status");

  if (ordersError) throw new Error(`Failed to count customer orders: ${ordersError.message}`);

  const orderCountByCustomer = new Map<string, number>();
  const completedCountByCustomer = new Map<string, number>();

  for (const row of orderRows ?? []) {
    const order = row as { customer_id: string | null; status: string };
    if (!order.customer_id) continue;
    orderCountByCustomer.set(
      order.customer_id,
      (orderCountByCustomer.get(order.customer_id) ?? 0) + 1
    );
    if (order.status === "completed") {
      completedCountByCustomer.set(
        order.customer_id,
        (completedCountByCustomer.get(order.customer_id) ?? 0) + 1
      );
    }
  }

  return (customers ?? []).map((row) => {
    const customer = row as {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      source: string;
      created_at: string;
    };

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      source: customer.source,
      orderCount: orderCountByCustomer.get(customer.id) ?? 0,
      completedOrderCount: completedCountByCustomer.get(customer.id) ?? 0,
      createdAt: customer.created_at,
    };
  });
}
