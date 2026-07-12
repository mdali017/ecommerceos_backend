import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as categoryService from "./category.service";

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listCategories();
    return sendSuccess(res, categories);
  } catch (error) {
    return next(error);
  }
}

export async function listAllCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listAllCategories();
    return sendSuccess(res, categories);
  } catch (error) {
    return next(error);
  }
}

export async function getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const category = await categoryService.getCategoryBySlug(slug, true);
    return sendSuccess(res, category);
  } catch (error) {
    return next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.body);
    return sendSuccess(res, category, 201, "Category created");
  } catch (error) {
    return next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const category = await categoryService.updateCategory(id, req.body);
    return sendSuccess(res, category, 200, "Category updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await categoryService.deleteCategory(id);
    return sendSuccess(res, { id }, 200, "Category deleted");
  } catch (error) {
    return next(error);
  }
}

export async function uploadIcon(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return sendSuccess(res, { url: "" });
    }

    const url = await categoryService.uploadCategoryIcon(file);
    return sendSuccess(res, { url }, 201, "Icon uploaded");
  } catch (error) {
    return next(error);
  }
}
