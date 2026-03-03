import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { UsageController } from "./usage.controller";
import { usageQuerySchema } from "./usage.validators";

export const usageRoutes = Router();

usageRoutes.use(requireAuth);

usageRoutes.get("/me", validate(usageQuerySchema, "query"), UsageController.me);