import { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as seasonalBannerController from "./seasonal-banner.controller";
import {
  createSeasonalBannerSchema,
  updateSeasonalBannerSchema,
} from "./seasonal-banner.validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get("/", seasonalBannerController.listSeasonalBanners);
router.get("/admin/all", authenticateAdmin, seasonalBannerController.listAllSeasonalBanners);

router.post(
  "/upload-image",
  authenticateAdmin,
  upload.single("image"),
  seasonalBannerController.uploadImage
);

router.post(
  "/",
  authenticateAdmin,
  validate(createSeasonalBannerSchema),
  seasonalBannerController.createSeasonalBanner
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateSeasonalBannerSchema),
  seasonalBannerController.updateSeasonalBanner
);

router.delete("/:id", authenticateAdmin, seasonalBannerController.deleteSeasonalBanner);

export default router;
