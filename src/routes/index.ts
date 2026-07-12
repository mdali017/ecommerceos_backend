import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import categoryRoutes from "../modules/categories/category.routes";
import homepageBrandRoutes from "../modules/homepage-brands/homepage-brand.routes";
import heroSlideRoutes from "../modules/hero-slides/hero-slide.routes";
import productRoutes from "../modules/products/product.routes";
import promoBannerRoutes from "../modules/promo-banners/promo-banner.routes";
import seasonalBannerRoutes from "../modules/seasonal-banners/seasonal-banner.routes";
import testimonialRoutes from "../modules/testimonials/testimonial.routes";
import orderRoutes from "../modules/orders/order.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", homepageBrandRoutes);
router.use("/hero-slides", heroSlideRoutes);
router.use("/promo-banners", promoBannerRoutes);
router.use("/seasonal-banners", seasonalBannerRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

export default router;
