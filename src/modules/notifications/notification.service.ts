import { supabase } from "../../config/supabase";
import { NotFoundError } from "../../shared/errors/app-error";
import type {
  CreateNotificationInput,
  NotificationProfile,
  NotificationRow,
} from "./notification.types";

function toNotificationProfile(row: NotificationRow): NotificationProfile {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function logEmailNotification(title: string, message: string, customerId: string) {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[notification:email] customer=${customerId} | ${title} — ${message}`);
  }
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationProfile> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      customer_id: input.customerId,
      type: input.type,
      title: input.title.trim(),
      message: input.message.trim(),
      link: input.link?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create notification: ${error.message}`);

  logEmailNotification(input.title, input.message, input.customerId);
  return toNotificationProfile(data as NotificationRow);
}

export async function notifyOrderPlaced(
  customerId: string,
  orderNumber: string,
  total: number
): Promise<void> {
  await createNotification({
    customerId,
    type: "order_placed",
    title: "Order placed successfully",
    message: `Your order ${orderNumber} for ৳${total.toLocaleString("en-US")} has been received.`,
    link: "/dashboard/orders",
  });
}

export async function notifyOrderStatusChanged(
  customerId: string,
  orderNumber: string,
  status: string
): Promise<void> {
  const statusLabel = status.replace(/_/g, " ");
  await createNotification({
    customerId,
    type: "order_status",
    title: "Order status updated",
    message: `Order ${orderNumber} is now ${statusLabel}.`,
    link: "/dashboard/orders",
  });
}

export async function listCustomerNotifications(
  customerId: string
): Promise<NotificationProfile[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select()
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to list notifications: ${error.message}`);
  return ((data ?? []) as NotificationRow[]).map(toNotificationProfile);
}

export async function getUnreadCount(customerId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("is_read", false);

  if (error) throw new Error(`Failed to count notifications: ${error.message}`);
  return count ?? 0;
}

export async function markNotificationRead(
  customerId: string,
  notificationId: string
): Promise<NotificationProfile> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) throw new Error(`Failed to mark notification read: ${error.message}`);
  if (!data) throw new NotFoundError("Notification not found");

  return toNotificationProfile(data as NotificationRow);
}

export async function markAllNotificationsRead(customerId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("customer_id", customerId)
    .eq("is_read", false);

  if (error) throw new Error(`Failed to mark notifications read: ${error.message}`);
}
