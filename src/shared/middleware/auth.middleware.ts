import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/app-error";
import { verifyAccessToken } from "../utils/jwt";
import type { UserRole } from "../../types/database.types";

export function authenticate(requiredRole?: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Access token required"));
    }

    const token = header.slice(7);

    try {
      const payload = verifyAccessToken(token);

      if (requiredRole && payload.role !== requiredRole) {
        return next(new UnauthorizedError("Insufficient permissions"));
      }

      req.user = payload;
      return next();
    } catch {
      return next(new UnauthorizedError("Invalid or expired access token"));
    }
  };
}

export const authenticateCustomer = authenticate("customer");
export const authenticateAdmin = authenticate("admin");

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);

  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Guest checkout — ignore invalid tokens
  }

  return next();
}

export function authenticateCustomerOrAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Access token required"));
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);

    if (payload.role !== "customer" && payload.role !== "admin") {
      return next(new UnauthorizedError("Insufficient permissions"));
    }

    req.user = payload;
    return next();
  } catch {
    return next(new UnauthorizedError("Invalid or expired access token"));
  }
}
