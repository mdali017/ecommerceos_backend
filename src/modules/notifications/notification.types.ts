export type NotificationType = "order_placed" | "order_status" | "promo" | "system";

export interface NotificationRow {
  id: string;
  customer_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationProfile {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  customerId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}
