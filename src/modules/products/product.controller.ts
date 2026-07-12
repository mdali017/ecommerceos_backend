import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as productService from "./product.service";
import type { PublicProductsQuery } from "./product.validation";

export async function listProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const products = await productService.listProducts();
    return sendSuccess(res, products);
  } catch (error) {
    return next(error);
  }
}

export async function listPublicProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.listPublicProducts(
      req.query as unknown as PublicProductsQuery
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getPublicProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const product = await productService.getPublicProductBySlug(slug);
    return sendSuccess(res, product);
  } catch (error) {
    return next(error);
  }
}

export async function bulkUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.bulkUploadProducts(req.body.products);
    return sendSuccess(res, result, 201, "Bulk upload completed");
  } catch (error) {
    return next(error);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return sendSuccess(res, { urls: [] });
    }

    const urls = await productService.uploadProductImages(files);
    return sendSuccess(res, { urls }, 201, "Images uploaded");
  } catch (error) {
    return next(error);
  }
}
