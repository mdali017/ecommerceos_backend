import { Router } from "express";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as homepageProductSectionController from "./homepage-product-section.controller";
import {
  createHomepageProductSectionSchema,
  updateHomepageProductSectionSchema,
} from "./homepage-product-section.validation";

const router = Router();

router.get("/", homepageProductSectionController.listHomepageProductSections);
router.get(
  "/admin/all",
  authenticateAdmin,
  homepageProductSectionController.listAllHomepageProductSections
);

router.post(
  "/",
  authenticateAdmin,
  validate(createHomepageProductSectionSchema),
  homepageProductSectionController.createHomepageProductSection
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateHomepageProductSectionSchema),
  homepageProductSectionController.updateHomepageProductSection
);

router.delete(
  "/:id",
  authenticateAdmin,
  homepageProductSectionController.deleteHomepageProductSection
);

export default router;
