import { z } from "zod";
import { Router } from "express";
import { authenticateCustomer } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import * as wishlistController from "./wishlist.controller";

const router = Router();

const addWishlistSchema = z.object({
  productId: z.string().trim().min(1, "Product id is required"),
});

router.use(authenticateCustomer);

router.get("/", wishlistController.listWishlist);
router.get("/ids", wishlistController.listWishlistIds);
router.post("/", validate(addWishlistSchema), wishlistController.addToWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

export default router;
