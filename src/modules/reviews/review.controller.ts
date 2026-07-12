import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as reviewService from "./review.service";

export async function listProductReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.listProductReviewsBySlug(String(req.params.slug));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function createProductReview(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.role === "customer" ? req.user.sub : undefined;
    const review = await reviewService.createProductReview(
      String(req.params.slug),
      req.body,
      customerId
    );
    return sendSuccess(res, review, 201, "Review submitted");
  } catch (error) {
    return next(error);
  }
}

export async function listAllReviews(_req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.listAllReviews();
    return sendSuccess(res, reviews);
  } catch (error) {
    return next(error);
  }
}

export async function updateReviewStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.updateReviewStatus(
      String(req.params.id),
      req.body.isApproved
    );
    return sendSuccess(res, review, 200, "Review updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    await reviewService.deleteReview(String(req.params.id));
    return sendSuccess(res, null, 200, "Review deleted");
  } catch (error) {
    return next(error);
  }
}
