import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { AdminController } from "./admin.controller";
import { adminLoginSchema } from "./admin.validators";

export const adminRoutes = Router();

adminRoutes.post("/login", validate(adminLoginSchema), AdminController.login);