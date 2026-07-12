import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as heroSlideService from "./hero-slide.service";

export async function listHeroSlides(_req: Request, res: Response, next: NextFunction) {
  try {
    const slides = await heroSlideService.listHeroSlides();
    return sendSuccess(res, slides);
  } catch (error) {
    return next(error);
  }
}

export async function listAllHeroSlides(_req: Request, res: Response, next: NextFunction) {
  try {
    const slides = await heroSlideService.listAllHeroSlides();
    return sendSuccess(res, slides);
  } catch (error) {
    return next(error);
  }
}

export async function createHeroSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const slide = await heroSlideService.createHeroSlide(req.body);
    return sendSuccess(res, slide, 201, "Hero slide created");
  } catch (error) {
    return next(error);
  }
}

export async function updateHeroSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const slide = await heroSlideService.updateHeroSlide(id, req.body);
    return sendSuccess(res, slide, 200, "Hero slide updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteHeroSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await heroSlideService.deleteHeroSlide(id);
    return sendSuccess(res, { id }, 200, "Hero slide deleted");
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

    const url = await heroSlideService.uploadHeroSlideImage(file);
    return sendSuccess(res, { url }, 201, "Image uploaded");
  } catch (error) {
    return next(error);
  }
}
