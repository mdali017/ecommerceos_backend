import { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as categoryController from "./category.controller";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

router.get("/", categoryController.listCategories);
router.get("/admin/all", authenticateAdmin, categoryController.listAllCategories);

router.post(
  "/upload-icon",
  authenticateAdmin,
  upload.single("icon"),
  categoryController.uploadIcon
);

router.post(
  "/",
  authenticateAdmin,
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete("/:id", authenticateAdmin, categoryController.deleteCategory);

router.get("/:slug", categoryController.getCategoryBySlug);

export default router;
