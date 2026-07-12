import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
) {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
) {
  const body: ApiErrorResponse = {
    success: false,
    error: { message, code, details },
  };
  return res.status(statusCode).json(body);
}
