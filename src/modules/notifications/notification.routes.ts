import { Router } from "express";
import { authenticateCustomer } from "../../shared/middleware/auth.middleware";
import * as notificationController from "./notification.controller";

const router = Router();

router.use(authenticateCustomer);

router.get("/", notificationController.listNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
