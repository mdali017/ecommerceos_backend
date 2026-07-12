import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as testimonialService from "./testimonial.service";

export async function listTestimonials(_req: Request, res: Response, next: NextFunction) {
  try {
    const testimonials = await testimonialService.listTestimonials();
    return sendSuccess(res, testimonials);
  } catch (error) {
    return next(error);
  }
}

export async function listAllTestimonials(_req: Request, res: Response, next: NextFunction) {
  try {
    const testimonials = await testimonialService.listAllTestimonials();
    return sendSuccess(res, testimonials);
  } catch (error) {
    return next(error);
  }
}

export async function createTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const testimonial = await testimonialService.createTestimonial(req.body);
    return sendSuccess(res, testimonial, 201, "Testimonial created");
  } catch (error) {
    return next(error);
  }
}

export async function updateTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const testimonial = await testimonialService.updateTestimonial(id, req.body);
    return sendSuccess(res, testimonial, 200, "Testimonial updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await testimonialService.deleteTestimonial(id);
    return sendSuccess(res, { id }, 200, "Testimonial deleted");
  } catch (error) {
    return next(error);
  }
}
