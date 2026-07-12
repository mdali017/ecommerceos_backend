import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as notificationService from "./notification.service";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await notificationService.listCustomerNotifications(req.user!.sub);
    return sendSuccess(res, notifications);
  } catch (error) {
    return next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.sub);
    return sendSuccess(res, { count });
  } catch (error) {
    return next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markNotificationRead(
      req.user!.sub,
      String(req.params.id)
    );
    return sendSuccess(res, notification, 200, "Notification marked as read");
  } catch (error) {
    return next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllNotificationsRead(req.user!.sub);
    return sendSuccess(res, null, 200, "All notifications marked as read");
  } catch (error) {
    return next(error);
  }
}
