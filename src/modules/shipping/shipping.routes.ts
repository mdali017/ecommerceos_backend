import { Router } from "express";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as shippingController from "./shipping.controller";
import {
  createShippingZoneSchema,
  shippingQuoteSchema,
  updateShippingZoneSchema,
} from "./shipping.validation";

const router = Router();

router.get("/zones", shippingController.listZones);
router.post("/quote", validate(shippingQuoteSchema), shippingController.getQuote);

router.get("/admin/zones", authenticateAdmin, shippingController.listAllZones);
router.post(
  "/admin/zones",
  authenticateAdmin,
  validate(createShippingZoneSchema),
  shippingController.createZone
);
router.put(
  "/admin/zones/:id",
  authenticateAdmin,
  validate(updateShippingZoneSchema),
  shippingController.updateZone
);
router.delete("/admin/zones/:id", authenticateAdmin, shippingController.deleteZone);

export default router;
