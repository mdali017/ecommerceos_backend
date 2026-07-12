import { Router } from "express";
import {
  authenticateAdmin,
  optionalAuthenticate,
} from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as couponController from "./coupon.controller";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupon.validation";

const router = Router();

router.post(
  "/validate",
  optionalAuthenticate,
  validate(validateCouponSchema),
  couponController.validateCoupon
);

router.get("/admin/all", authenticateAdmin, couponController.listCoupons);

router.post(
  "/",
  authenticateAdmin,
  validate(createCouponSchema),
  couponController.createCoupon
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateCouponSchema),
  couponController.updateCoupon
);

router.delete("/:id", authenticateAdmin, couponController.deleteCoupon);

export default router;
