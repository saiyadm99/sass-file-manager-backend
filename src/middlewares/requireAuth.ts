import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

export type AuthUser = {
  sub: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) return next(new ApiError(401, "Missing authorization token"));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.auth = decoded;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}