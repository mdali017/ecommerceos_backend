import { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as heroSlideController from "./hero-slide.controller";
import { createHeroSlideSchema, updateHeroSlideSchema } from "./hero-slide.validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get("/", heroSlideController.listHeroSlides);
router.get("/admin/all", authenticateAdmin, heroSlideController.listAllHeroSlides);

router.post(
  "/upload-image",
  authenticateAdmin,
  upload.single("image"),
  heroSlideController.uploadImage
);

router.post(
  "/",
  authenticateAdmin,
  validate(createHeroSlideSchema),
  heroSlideController.createHeroSlide
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateHeroSlideSchema),
  heroSlideController.updateHeroSlide
);

router.delete("/:id", authenticateAdmin, heroSlideController.deleteHeroSlide);

export default router;
