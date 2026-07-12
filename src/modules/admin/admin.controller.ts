import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as adminService from "./admin.service";

export async function getDashboardStats(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await adminService.getDashboardStats();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listCustomers(_req: Request, res: Response, next: NextFunction) {
  try {
    const customers = await adminService.listCustomers();
    return sendSuccess(res, customers);
  } catch (error) {
    return next(error);
  }
}
