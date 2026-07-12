import { Router } from "express";
import {
  authenticateAdmin,
  authenticateCustomer,
  authenticateCustomerOrAdmin,
  optionalAuthenticate,
} from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as orderController from "./order.controller";
import { createOrderSchema, updateOrderShippingSchema, updateOrderStatusSchema } from "./order.validation";

const router = Router();

router.post(
  "/",
  optionalAuthenticate,
  validate(createOrderSchema),
  orderController.createOrder
);

router.get("/me", authenticateCustomer, orderController.listMyOrders);
router.get("/admin/all", authenticateAdmin, orderController.listAllOrders);

router.get("/:id", authenticateCustomerOrAdmin, orderController.getOrder);

router.patch(
  "/:id/status",
  authenticateAdmin,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

router.patch(
  "/:id/shipping",
  authenticateAdmin,
  validate(updateOrderShippingSchema),
  orderController.updateOrderShipping
);

export default router;
