import { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as promoBannerController from "./promo-banner.controller";
import { createPromoBannerSchema, updatePromoBannerSchema } from "./promo-banner.validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get("/", promoBannerController.listPromoBanners);
router.get("/admin/all", authenticateAdmin, promoBannerController.listAllPromoBanners);

router.post(
  "/upload-image",
  authenticateAdmin,
  upload.single("image"),
  promoBannerController.uploadImage
);

router.post(
  "/",
  authenticateAdmin,
  validate(createPromoBannerSchema),
  promoBannerController.createPromoBanner
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updatePromoBannerSchema),
  promoBannerController.updatePromoBanner
);

router.delete("/:id", authenticateAdmin, promoBannerController.deletePromoBanner);

export default router;
