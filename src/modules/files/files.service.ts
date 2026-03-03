import path from "path";
import fs from "fs/promises";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { EnforcementService } from "../storage/enforcement.service";
import { FileType } from "@prisma/client";

function sanitizeName(name: string) {
  return name.trim();
}

function inferFileType(mimeType: string, originalName: string): FileType {
  const m = (mimeType || "").toLowerCase();
  const ext = path.extname(originalName || "").toLowerCase();

  // Images
  if (m.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return "IMAGE";

  // Video
  if (m.startsWith("video/") || [".mp4", ".mov", ".mkv", ".webm"].includes(ext)) return "VIDEO";

  // Audio
  if (m.startsWith("audio/") || [".mp3", ".wav", ".aac", ".m4a", ".ogg"].includes(ext)) return "AUDIO";

  // PDF
  if (m === "application/pdf" || ext === ".pdf") return "PDF";

  throw new ApiError(400, "Unsupported file type. Allowed: Image, Video, Audio, PDF.");
}

export class FilesService {
  static async listByFolder(userId: string, folderId: string) {
    // ensure folder belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, deletedAt: null },
      select: { id: true }
    });
    if (!folder) throw new ApiError(404, "Folder not found");

    return prisma.file.findMany({
      where: { userId, folderId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        originalName: true,
        fileType: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  static async upload(params: {
    userId: string;
    folderId: string;
    file: Express.Multer.File;
    displayName?: string;
  }) {
    const { userId, folderId, file, displayName } = params;

    if (!file) throw new ApiError(400, "File is required (field name: file)");

    const fileType = inferFileType(file.mimetype, file.originalname);

    // Enforce plan rules BEFORE writing DB record.
    // Note: file is already written to disk by multer at this point.
    // If enforcement fails, we delete the physical file immediately.
    try {
      await EnforcementService.assertCanUploadFile({
        userId,
        folderId,
        fileType,
        sizeBytes: file.size
      });
    } catch (err) {
      // remove uploaded file if not allowed
      try {
        await fs.unlink(file.path);
      } catch {
        // ignore unlink errors
      }
      throw err;
    }

    const name = sanitizeName(displayName?.length ? displayName : file.originalname);

    // store relative key (portable across envs)
    const storageKey = path.relative(process.cwd(), file.path);

    const created = await prisma.file.create({
      data: {
        userId,
        folderId,
        name,
        originalName: file.originalname,
        fileType,
        mimeType: file.mimetype || "application/octet-stream",
        sizeBytes: file.size,
        storageKey
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        fileType: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true
      }
    });

    return created;
  }

  static async getDownloadInfo(userId: string, fileId: string) {
    const f = await prisma.file.findFirst({
      where: { id: fileId, userId, deletedAt: null },
      select: { id: true, name: true, originalName: true, mimeType: true, storageKey: true }
    });
    if (!f) throw new ApiError(404, "File not found");

    const absPath = path.resolve(process.cwd(), f.storageKey);

    return {
      absPath,
      downloadName: f.originalName || f.name,
      mimeType: f.mimeType
    };
  }

  static async rename(userId: string, fileId: string, name: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, deletedAt: null },
      select: { id: true }
    });
    if (!file) throw new ApiError(404, "File not found");

    return prisma.file.update({
      where: { id: fileId },
      data: { name: sanitizeName(name) },
      select: {
        id: true,
        name: true,
        originalName: true,
        fileType: true,
        mimeType: true,
        sizeBytes: true,
        updatedAt: true
      }
    });
  }

  static async remove(userId: string, fileId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, deletedAt: null },
      select: { id: true, storageKey: true }
    });
    if (!file) throw new ApiError(404, "File not found");

    // Soft delete first (DB truth)
    const deleted = await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
      select: { id: true }
    });

    // Delete physical file (best-effort)
    const absPath = path.resolve(process.cwd(), file.storageKey);
    try {
      await fs.unlink(absPath);
    } catch {
      // ignore filesystem errors (file might not exist)
    }

    return deleted;
  }
}