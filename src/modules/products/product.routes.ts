import { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as productController from "./product.controller";
import { bulkUploadSchema, publicProductsQuerySchema } from "./product.validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
});

router.get("/public", validate(publicProductsQuerySchema, "query"), productController.listPublicProducts);
router.get("/public/:slug", productController.getPublicProductBySlug);

router.get("/", authenticateAdmin, productController.listProducts);

router.post(
  "/bulk",
  authenticateAdmin,
  validate(bulkUploadSchema),
  productController.bulkUpload
);

router.post(
  "/upload-images",
  authenticateAdmin,
  upload.array("images", 20),
  productController.uploadImages
);

export default router;
