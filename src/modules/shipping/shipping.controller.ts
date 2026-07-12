import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as shippingService from "./shipping.service";

export async function listZones(_req: Request, res: Response, next: NextFunction) {
  try {
    const zones = await shippingService.listActiveZones();
    return sendSuccess(res, zones);
  } catch (error) {
    return next(error);
  }
}

export async function listAllZones(_req: Request, res: Response, next: NextFunction) {
  try {
    const zones = await shippingService.listAllZones();
    return sendSuccess(res, zones);
  } catch (error) {
    return next(error);
  }
}

export async function getQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await shippingService.calculateShippingQuote(
      req.body.subtotal,
      req.body.zoneId,
      req.body.freeShipping
    );
    return sendSuccess(res, quote);
  } catch (error) {
    return next(error);
  }
}

export async function createZone(req: Request, res: Response, next: NextFunction) {
  try {
    const zone = await shippingService.createZone(req.body);
    return sendSuccess(res, zone, 201, "Shipping zone created");
  } catch (error) {
    return next(error);
  }
}

export async function updateZone(req: Request, res: Response, next: NextFunction) {
  try {
    const zone = await shippingService.updateZone(String(req.params.id), req.body);
    return sendSuccess(res, zone, 200, "Shipping zone updated");
  } catch (error) {
    return next(error);
  }
}

export async function deleteZone(req: Request, res: Response, next: NextFunction) {
  try {
    await shippingService.deleteZone(String(req.params.id));
    return sendSuccess(res, null, 200, "Shipping zone deleted");
  } catch (error) {
    return next(error);
  }
}
