import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AdminService } from "./admin.service";

export class AdminController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { admin, token } = await AdminService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: { admin, token }
    });
  });
}