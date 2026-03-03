import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/apiError";
import { EnforcementService } from "../storage/enforcement.service";

export class UsageController {
  static me = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const folderId = typeof req.query.folderId === "string" ? req.query.folderId : undefined;

    const data = await EnforcementService.getUsageSnapshot({ userId, folderId });

    res.json({
      success: true,
      data
    });
  });
}