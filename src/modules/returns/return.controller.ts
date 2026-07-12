import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../shared/utils/api-response";
import * as returnService from "./return.service";

export async function createReturn(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await returnService.createReturnRequest(req.body, req.user!.sub);
    return sendSuccess(res, result, 201, "Return request submitted");
  } catch (error) {
    return next(error);
  }
}

export async function listMyReturns(req: Request, res: Response, next: NextFunction) {
  try {
    const returns = await returnService.listMyReturns(req.user!.sub);
    return sendSuccess(res, returns);
  } catch (error) {
    return next(error);
  }
}

export async function listAllReturns(_req: Request, res: Response, next: NextFunction) {
  try {
    const returns = await returnService.listAllReturns();
    return sendSuccess(res, returns);
  } catch (error) {
    return next(error);
  }
}

export async function updateReturnStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await returnService.updateReturnStatus(String(req.params.id), req.body);
    return sendSuccess(res, result, 200, "Return request updated");
  } catch (error) {
    return next(error);
  }
}
