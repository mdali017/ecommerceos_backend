import { Router } from "express";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as testimonialController from "./testimonial.controller";
import { createTestimonialSchema, updateTestimonialSchema } from "./testimonial.validation";

const router = Router();

router.get("/", testimonialController.listTestimonials);
router.get("/admin/all", authenticateAdmin, testimonialController.listAllTestimonials);

router.post(
  "/",
  authenticateAdmin,
  validate(createTestimonialSchema),
  testimonialController.createTestimonial
);

router.put(
  "/:id",
  authenticateAdmin,
  validate(updateTestimonialSchema),
  testimonialController.updateTestimonial
);

router.delete("/:id", authenticateAdmin, testimonialController.deleteTestimonial);

export default router;
