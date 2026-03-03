import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/apiError";
import { FoldersService } from "./folders.service";

export class FoldersController {
  static tree = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FoldersService.getTree(userId);
    res.json({ success: true, data });
  });

  static listFlat = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FoldersService.listFlat(userId);
    res.json({ success: true, data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FoldersService.create(userId, req.body);
    res.status(201).json({ success: true, message: "Folder created", data });
  });

  static rename = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FoldersService.rename(userId, req.params.id, req.body);
    res.json({ success: true, message: "Folder renamed", data });
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FoldersService.remove(userId, req.params.id);
    res.json({ success: true, message: "Folder deleted", data });
  });
}