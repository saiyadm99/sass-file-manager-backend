import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { SubscriptionsService } from "./subscriptions.service";
import { ApiError } from "../../utils/apiError";

export class SubscriptionsController {
  static listPackages = asyncHandler(async (req: Request, res: Response) => {
    const data = await SubscriptionsService.listPackages();
    res.json({ success: true, data });
  });

  static getMyActive = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await SubscriptionsService.getMyActivePackage(userId);
    res.json({ success: true, data });
  });

  static getMyHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await SubscriptionsService.getMyHistory(userId);
    res.json({ success: true, data });
  });

  static selectPackage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { packageId } = req.body;
    const result = await SubscriptionsService.selectPackage(userId, packageId);

    res.status(result.changed ? 201 : 200).json({
      success: true,
      message: result.message,
      data: result.active
    });
  });
}