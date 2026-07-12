import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as promoBannerService from "./promo-banner.service";

export async function listPromoBanners(_req: Request, res: Response, next: NextFunction) {
  try {
    const banners = await promoBannerService.listPromoBanners();
    return sendSuccess(res, banners);
  } catch (error) {
    return next(error);
  }
}

export async function listAllPromoBanners(_req: Request, res: Response, next: NextFunction) {
  try {
    const banners = await promoBannerService.listAllPromoBanners();
    return sendSuccess(res, banners);
  } catch (error) {
    return next(error);
  }
}

export async function createPromoBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const banner = await promoBannerService.createPromoBanner(req.body);
    return sendSuccess(res, banner, 201, "Promo banner created");
  } catch (error) {
    return next(error);
  }
}

export async function updatePromoBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const banner = await promoBannerService.updatePromoBanner(id, req.body);
    return sendSuccess(res, banner, 200, "Promo banner updated");
  } catch (error) {
    return next(error);
  }
}

export async function deletePromoBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await promoBannerService.deletePromoBanner(id);
    return sendSuccess(res, { id }, 200, "Promo banner deleted");
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

    const url = await promoBannerService.uploadPromoBannerImage(file);
    return sendSuccess(res, { url }, 201, "Image uploaded");
  } catch (error) {
    return next(error);
  }
}
