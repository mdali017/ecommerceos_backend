import { supabase } from "../../config/supabase";
import { AppError, ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/app-error";
import { notifyOrderStatusChanged } from "../notifications/notification.service";
import type {
  AdminReturnRequestProfile,
  ReturnRequestProfile,
  ReturnRequestRow,
  ReturnRequestRowWithOrder,
} from "./return.types";
import type { CreateReturnInput, UpdateReturnStatusInput } from "./return.validation";

function toReturnProfile(row: ReturnRequestRow): ReturnRequestProfile {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    refundStatus: row.refund_status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAdminReturnProfile(row: ReturnRequestRowWithOrder): AdminReturnRequestProfile {
  return {
    ...toReturnProfile(row),
    orderNumber: row.orders?.order_number ?? "—",
    customerName: row.orders?.customer_name ?? "—",
    orderTotal: Number(row.orders?.total ?? 0),
  };
}

function raiseReturnDbError(action: string, error: { message: string }): never {
  if (error.message.includes("Could not find the table") && error.message.includes("return_requests")) {
    throw new AppError(
      503,
      "Return requests table is not set up yet. Run supabase/migrations/019_returns.sql in Supabase SQL Editor.",
      "RETURNS_TABLE_MISSING"
    );
  }
  throw new Error(`${action}: ${error.message}`);
}

async function getOrderForReturn(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, status, total")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch order: ${error.message}`);
  if (!data) throw new NotFoundError("Order not found");

  return data as {
    id: string;
    order_number: string;
    customer_id: string | null;
    status: string;
    total: number;
  };
}

export async function createReturnRequest(
  input: CreateReturnInput,
  customerId: string
): Promise<ReturnRequestProfile> {
  const order = await getOrderForReturn(input.orderId);

  if (order.customer_id !== customerId) {
    throw new ForbiddenError("You can only request returns for your own orders");
  }

  if (!["delivered", "completed", "shipped"].includes(order.status)) {
    throw new ValidationError("Return can only be requested for delivered or shipped orders");
  }

  const { data: existing } = await supabase
    .from("return_requests")
    .select("id")
    .eq("order_id", order.id)
    .neq("status", "rejected")
    .maybeSingle();

  if (existing) {
    throw new ValidationError("A return request already exists for this order");
  }

  const { data, error } = await supabase
    .from("return_requests")
    .insert({
      order_id: order.id,
      customer_id: customerId,
      reason: input.reason.trim(),
      description: input.description?.trim() ?? "",
    })
    .select()
    .single();

  if (error) raiseReturnDbError("Failed to create return request", error);
  return toReturnProfile(data as ReturnRequestRow);
}

export async function listMyReturns(customerId: string): Promise<ReturnRequestProfile[]> {
  const { data, error } = await supabase
    .from("return_requests")
    .select()
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) raiseReturnDbError("Failed to list return requests", error);
  return ((data ?? []) as ReturnRequestRow[]).map(toReturnProfile);
}

export async function listAllReturns(): Promise<AdminReturnRequestProfile[]> {
  const { data, error } = await supabase
    .from("return_requests")
    .select("*, orders(order_number, customer_name, total)")
    .order("created_at", { ascending: false });

  if (error) raiseReturnDbError("Failed to list return requests", error);
  return ((data ?? []) as ReturnRequestRowWithOrder[]).map(toAdminReturnProfile);
}

export async function updateReturnStatus(
  id: string,
  input: UpdateReturnStatusInput
): Promise<AdminReturnRequestProfile> {
  const payload: Record<string, unknown> = {
    status: input.status,
    admin_notes: input.adminNotes?.trim() ?? "",
  };

  if (input.refundStatus !== undefined) {
    payload.refund_status = input.refundStatus;
  }

  const { data, error } = await supabase
    .from("return_requests")
    .update(payload)
    .eq("id", id)
    .select("*, orders(order_number, customer_name, total)")
    .single();

  if (error) raiseReturnDbError("Failed to update return request", error);
  if (!data) throw new NotFoundError("Return request not found");

  const row = data as ReturnRequestRowWithOrder;

  if (input.status === "approved" || input.status === "refunded") {
    await supabase.from("orders").update({ status: "returned" }).eq("id", row.order_id);
  }

  if (row.customer_id && (input.status === "approved" || input.status === "rejected")) {
    const orderNumber = row.orders?.order_number ?? row.order_id;
    await notifyOrderStatusChanged(
      row.customer_id,
      orderNumber,
      `return ${input.status}`
    ).catch(() => undefined);
  }

  return toAdminReturnProfile(row);
}
