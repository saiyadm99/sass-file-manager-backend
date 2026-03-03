import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await AuthService.register(req.body);
    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: { user, token }
    });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await AuthService.login(req.body);
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: { user, token }
    });
  });
}