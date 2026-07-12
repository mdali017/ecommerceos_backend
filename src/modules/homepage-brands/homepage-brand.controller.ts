import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as homepageBrandService from "./homepage-brand.service";

export async function listHomepageBrands(_req: Request, res: Response, next: NextFunction) {
  try {
    const brands = await homepageBrandService.listHomepageBrands();
    return sendSuccess(res, brands);
  } catch (error) {
    return next(error);
  }
}

export async function listAllHomepageBrands(_req: Request, res: Response, next: NextFunction) {
  try {
    const brands = await homepageBrandService.listAllHomepageBrands();
    return sendSuccess(res, brands);
  } catch (error) {
    return next(error);
  }
}

export async function createHomepageBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const brand = await homepageBrandService.createHomepageBrand(req.body);
    return sendSuccess(res, brand, 201, "Brand created");
  } catch (error) {
    return next(error);
  }
}

export async function updateHomepageBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const brand = await homepageBrandService.updateHomepageBrand(id, req.body);
    return sendSuccess(res, brand, 200, "Brand updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteHomepageBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await homepageBrandService.deleteHomepageBrand(id);
    return sendSuccess(res, { id }, 200, "Brand deleted");
  } catch (error) {
    return next(error);
  }
}

export async function uploadLogo(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return sendSuccess(res, { url: "" });
    }

    const url = await homepageBrandService.uploadHomepageBrandLogo(file);
    return sendSuccess(res, { url }, 201, "Logo uploaded");
  } catch (error) {
    return next(error);
  }
}
