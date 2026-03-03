import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/apiError";

type Targets = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, target: Targets = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(
        new ApiError(400, "Validation failed", {
          issues: result.error.issues
        })
      );
    }
    req[target] = result.data;
    next();
  };