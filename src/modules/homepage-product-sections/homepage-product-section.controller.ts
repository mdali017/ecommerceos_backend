import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as homepageProductSectionService from "./homepage-product-section.service";

export async function listHomepageProductSections(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sections = await homepageProductSectionService.listHomepageProductSections();
    return sendSuccess(res, sections);
  } catch (error) {
    return next(error);
  }
}

export async function listAllHomepageProductSections(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sections = await homepageProductSectionService.listAllHomepageProductSections();
    return sendSuccess(res, sections);
  } catch (error) {
    return next(error);
  }
}

export async function createHomepageProductSection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const section = await homepageProductSectionService.createHomepageProductSection(req.body);
    return sendSuccess(res, section, 201, "Homepage product section created");
  } catch (error) {
    return next(error);
  }
}

export async function updateHomepageProductSection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = String(req.params.id);
    const section = await homepageProductSectionService.updateHomepageProductSection(id, req.body);
    return sendSuccess(res, section, 200, "Homepage product section updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteHomepageProductSection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = String(req.params.id);
    await homepageProductSectionService.deleteHomepageProductSection(id);
    return sendSuccess(res, { id }, 200, "Homepage product section deleted");
  } catch (error) {
    return next(error);
  }
}
