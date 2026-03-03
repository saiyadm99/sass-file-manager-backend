import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/apiError";
import { FilesService } from "./files.service";

export class FilesController {
  static listByFolder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FilesService.listByFolder(userId, req.params.folderId);
    res.json({ success: true, data });
  });

  static upload = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const file = req.file as Express.Multer.File | undefined;
    const { folderId, name } = req.body;

    const data = await FilesService.upload({
      userId,
      folderId,
      file: file as Express.Multer.File,
      displayName: name
    });

    res.status(201).json({ success: true, message: "File uploaded", data });
  });

  static download = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { absPath, downloadName, mimeType } = await FilesService.getDownloadInfo(userId, req.params.id);

    res.setHeader("Content-Type", mimeType);
    res.download(absPath, downloadName);
  });

  static rename = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FilesService.rename(userId, req.params.id, req.body.name);
    res.json({ success: true, message: "File renamed", data });
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = await FilesService.remove(userId, req.params.id);
    res.json({ success: true, message: "File deleted", data });
  });
}