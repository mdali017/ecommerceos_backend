import { Router } from "express";
import {
  authenticateAdmin,
  optionalAuthenticate,
} from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as reviewController from "./review.controller";
import { createReviewSchema, updateReviewStatusSchema } from "./review.validation";

const router = Router();

router.get("/public/:slug", reviewController.listProductReviews);

router.post(
  "/public/:slug",
  optionalAuthenticate,
  validate(createReviewSchema),
  reviewController.createProductReview
);

router.get("/admin/all", authenticateAdmin, reviewController.listAllReviews);

router.patch(
  "/:id/status",
  authenticateAdmin,
  validate(updateReviewStatusSchema),
  reviewController.updateReviewStatus
);

router.delete("/:id", authenticateAdmin, reviewController.deleteReview);

export default router;
