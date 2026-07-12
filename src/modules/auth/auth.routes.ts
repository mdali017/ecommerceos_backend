import { Router } from "express";
import { authenticate, authenticateCustomer } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as authController from "./auth.controller";
import {
  adminLoginSchema,
  checkoutActivateSchema,
  customerLoginSchema,
  customerRegisterSchema,
  customerUpdatePasswordSchema,
  customerUpdateProfileSchema,
  refreshTokenSchema,
} from "./auth.validation";

const router = Router();

router.post(
  "/customer/register",
  validate(customerRegisterSchema),
  authController.registerCustomer
);

router.post(
  "/customer/checkout-activate",
  validate(checkoutActivateSchema),
  authController.activateCheckoutCustomer
);

router.post(
  "/customer/login",
  validate(customerLoginSchema),
  authController.loginCustomer
);

router.post("/admin/login", validate(adminLoginSchema), authController.loginAdmin);

router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);

router.post("/logout", validate(refreshTokenSchema), authController.logout);

router.get("/me", authenticate(), authController.getMe);

router.patch(
  "/customer/profile",
  authenticateCustomer,
  validate(customerUpdateProfileSchema),
  authController.updateCustomerProfile
);

router.patch(
  "/customer/password",
  authenticateCustomer,
  validate(customerUpdatePasswordSchema),
  authController.updateCustomerPassword
);

export default router;
