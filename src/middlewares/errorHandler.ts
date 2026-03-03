import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const isApiError = err instanceof ApiError;

  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : "Internal Server Error";
  const details = isApiError ? err.details : undefined;

  const payload: Record<string, unknown> = {
    success: false,
    message
  };

  if (details) payload.details = details;
  if (env.NODE_ENV !== "production" && !isApiError) {
    payload.debug = { err };
  }

  res.status(statusCode).json(payload);
}