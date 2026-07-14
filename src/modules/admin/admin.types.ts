export interface AdminDashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  todaySales: number;
  pendingOrders: number;
  lowStock: number;
}

export interface AdminRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  orderCount: number;
  completedOrderCount: number;
  createdAt: string;
}
