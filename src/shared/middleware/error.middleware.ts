import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { sendError } from "../utils/api-response";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "Validation failed", "VALIDATION_ERROR", err.flatten());
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, 401, "Invalid or expired token", "UNAUTHORIZED");
  }

  console.error("[Unhandled Error]", err);
  return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}
