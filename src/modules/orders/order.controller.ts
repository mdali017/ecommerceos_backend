import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors/app-error";
import { sendSuccess } from "../../shared/utils/api-response";
import type { OrderStatus } from "./order.types";
import * as orderService from "./order.service";

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.role === "customer" ? req.user.sub : undefined;
    const order = await orderService.createOrder(req.body, customerId);
    return sendSuccess(res, order, 201, "Order placed successfully");
  } catch (error) {
    return next(error);
  }
}

export async function listMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new UnauthorizedError();
    const orders = await orderService.listMyOrders(req.user.sub);
    return sendSuccess(res, orders);
  } catch (error) {
    return next(error);
  }
}

export async function listAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status ? (String(req.query.status) as OrderStatus) : undefined;
    const orders = await orderService.listAllOrders(status);
    return sendSuccess(res, orders);
  } catch (error) {
    return next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const requester = req.user
      ? { sub: req.user.sub, role: req.user.role as "customer" | "admin" }
      : undefined;

    if (!requester) throw new UnauthorizedError();

    const order = await orderService.getOrderById(id, requester);
    return sendSuccess(res, order);
  } catch (error) {
    return next(error);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const order = await orderService.updateOrderStatus(id, req.body.status);
    return sendSuccess(res, order, 200, "Order status updated");
  } catch (error) {
    return next(error);
  }
}
