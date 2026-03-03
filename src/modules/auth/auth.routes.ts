import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { AuthController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validators";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), AuthController.register);
authRoutes.post("/login", validate(loginSchema), AuthController.login);