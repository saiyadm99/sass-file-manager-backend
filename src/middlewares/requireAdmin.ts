import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.auth?.role;
  if (role !== "ADMIN") return next(new ApiError(403, "Admin access required"));
  next();
}