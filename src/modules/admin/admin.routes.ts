import { Router } from "express";
import { authenticateAdmin } from "../../shared/middleware/auth.middleware";
import * as adminController from "./admin.controller";

const router = Router();

router.get("/stats", authenticateAdmin, adminController.getDashboardStats);
router.get("/customers", authenticateAdmin, adminController.listCustomers);

export default router;
