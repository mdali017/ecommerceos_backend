import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as seasonalBannerService from "./seasonal-banner.service";

export async function listSeasonalBanners(_req: Request, res: Response, next: NextFunction) {
  try {
    const banners = await seasonalBannerService.listSeasonalBanners();
    return sendSuccess(res, banners);
  } catch (error) {
    return next(error);
  }
}

export async function listAllSeasonalBanners(_req: Request, res: Response, next: NextFunction) {
  try {
    const banners = await seasonalBannerService.listAllSeasonalBanners();
    return sendSuccess(res, banners);
  } catch (error) {
    return next(error);
  }
}

export async function createSeasonalBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const banner = await seasonalBannerService.createSeasonalBanner(req.body);
    return sendSuccess(res, banner, 201, "Seasonal banner created");
  } catch (error) {
    return next(error);
  }
}

export async function updateSeasonalBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const banner = await seasonalBannerService.updateSeasonalBanner(id, req.body);
    return sendSuccess(res, banner, 200, "Seasonal banner updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteSeasonalBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await seasonalBannerService.deleteSeasonalBanner(id);
    return sendSuccess(res, { id }, 200, "Seasonal banner deleted");
  } catch (error) {
    return next(error);
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return sendSuccess(res, { url: "" });
    }

    const url = await seasonalBannerService.uploadSeasonalBannerImage(file);
    return sendSuccess(res, { url }, 201, "Image uploaded");
  } catch (error) {
    return next(error);
  }
}
