import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as couponService from "./coupon.service";

export async function validateCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.role === "customer" ? req.user.sub : undefined;
    const result = await couponService.validateCouponForOrder(
      req.body.code,
      req.body.subtotal,
      customerId
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listCoupons(_req: Request, res: Response, next: NextFunction) {
  try {
    const coupons = await couponService.listCoupons();
    return sendSuccess(res, coupons);
  } catch (error) {
    return next(error);
  }
}

export async function createCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.createCoupon(req.body);
    return sendSuccess(res, coupon, 201, "Coupon created");
  } catch (error) {
    return next(error);
  }
}

export async function updateCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.updateCoupon(String(req.params.id), req.body);
    return sendSuccess(res, coupon, 200, "Coupon updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    await couponService.deleteCoupon(String(req.params.id));
    return sendSuccess(res, null, 200, "Coupon deleted");
  } catch (error) {
    return next(error);
  }
}
