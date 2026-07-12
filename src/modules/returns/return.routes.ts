import { Router } from "express";
import { authenticateAdmin, authenticateCustomer } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as returnController from "./return.controller";
import { createReturnSchema, updateReturnStatusSchema } from "./return.validation";

const router = Router();

router.post(
  "/",
  authenticateCustomer,
  validate(createReturnSchema),
  returnController.createReturn
);
router.get("/me", authenticateCustomer, returnController.listMyReturns);
router.get("/admin/all", authenticateAdmin, returnController.listAllReturns);
router.patch(
  "/:id/status",
  authenticateAdmin,
  validate(updateReturnStatusSchema),
  returnController.updateReturnStatus
);

export default router;
