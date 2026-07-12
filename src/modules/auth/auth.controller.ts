import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../../shared/errors/app-error";
import { sendSuccess } from "../../shared/utils/api-response";
import * as authService from "./auth.service";

export async function registerCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.registerCustomer(req.body);
    return sendSuccess(res, result, 201, "Customer registered successfully");
  } catch (error) {
    return next(error);
  }
}

export async function loginCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.loginCustomer(req.body);
    return sendSuccess(res, result, 200, "Login successful");
  } catch (error) {
    return next(error);
  }
}

export async function loginAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginAdmin(req.body);
    return sendSuccess(res, result, 200, "Admin login successful");
  } catch (error) {
    return next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    return sendSuccess(res, { tokens }, 200, "Token refreshed");
  } catch (error) {
    return next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body.refreshToken);
    return sendSuccess(res, null, 200, "Logged out successfully");
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("User not attached to request"));
    }

    const result = await authService.getMe(req.user.sub, req.user.role);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}
