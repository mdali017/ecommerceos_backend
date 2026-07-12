import { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as homepageBrandController from "./homepage-brand.controller";
import {
  createHomepageBrandSchema,
  updateHomepageBrandSchema,
} from "./homepage-brand.validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

router.get("/", homepageBrandController.listHomepageBrands);
router.get("/admin/all", authenticateAdmin, homepageBrandController.listAllHomepageBrands);

router.post(
  "/upload-logo",
  authenticateAdmin,
  upload.single("logo"),
  homepageBrandController.uploadLogo
);

router.post(
  "/",
  authenticateAdmin,
  validate(createHomepageBrandSchema),
  homepageBrandController.createHomepageBrand
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateHomepageBrandSchema),
  homepageBrandController.updateHomepageBrand
);

router.delete("/:id", authenticateAdmin, homepageBrandController.deleteHomepageBrand);

export default router;
