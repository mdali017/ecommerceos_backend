import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as wishlistService from "./wishlist.service";

export async function listWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await wishlistService.listWishlist(req.user!.sub);
    return sendSuccess(res, items);
  } catch (error) {
    return next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await wishlistService.addToWishlist(req.user!.sub, String(req.body.productId));
    return sendSuccess(res, item, 201, "Added to wishlist");
  } catch (error) {
    return next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    await wishlistService.removeFromWishlist(req.user!.sub, String(req.params.productId));
    return sendSuccess(res, null, 200, "Removed from wishlist");
  } catch (error) {
    return next(error);
  }
}

export async function listWishlistIds(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await wishlistService.getWishlistProductIds(req.user!.sub);
    return sendSuccess(res, ids);
  } catch (error) {
    return next(error);
  }
}
