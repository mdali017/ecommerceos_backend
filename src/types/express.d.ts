import type { UserRole } from "../types/database.types";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
