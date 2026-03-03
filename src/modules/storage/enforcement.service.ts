import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { FileType } from "@prisma/client";

type ActivePackage = {
  id: string;
  name: string;
  maxFolders: number;
  maxNestingLevel: number;
  allowedTypes: FileType[];
  maxFileSizeMB: number;
  totalFileLimit: number;
  filesPerFolder: number;
  isActive: boolean;
};

export class EnforcementService {
  // -----------------------------
  // Package resolution
  // -----------------------------
  static async getActivePackage(userId: string): Promise<ActivePackage> {
    const active = await prisma.userSubscription.findFirst({
      where: { userId, endAt: null },
      include: { pkg: true }
    });

    if (!active) {
      throw new ApiError(400, "No active subscription package selected.");
    }

    if (!active.pkg.isActive) {
      throw new ApiError(400, "Your active package is currently disabled. Please select another package.");
    }

    return active.pkg;
  }

  // -----------------------------
  // Folder enforcement
  // -----------------------------
  static async assertCanCreateFolder(params: {
    userId: string;
    parentId?: string | null;
  }) {
    const { userId, parentId } = params;
    const pkg = await this.getActivePackage(userId);

    // 1) Max folders check
    const totalFolders = await prisma.folder.count({
      where: { userId, deletedAt: null }
    });

    if (totalFolders >= pkg.maxFolders) {
      throw new ApiError(403, `Folder limit reached. Your plan (${pkg.name}) allows max ${pkg.maxFolders} folders.`);
    }

    // 2) Nesting level check
    let newDepth = 1;

    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, userId, deletedAt: null },
        select: { id: true, depth: true }
      });

      if (!parent) throw new ApiError(404, "Parent folder not found.");

      newDepth = parent.depth + 1;
    }

    if (newDepth > pkg.maxNestingLevel) {
      throw new ApiError(
        403,
        `Nesting level exceeded. Your plan (${pkg.name}) allows max depth ${pkg.maxNestingLevel}.`
      );
    }

    return { pkg, newDepth };
  }

  // -----------------------------
  // File upload enforcement
  // -----------------------------
  static async assertCanUploadFile(params: {
    userId: string;
    folderId: string;
    fileType: FileType;
    sizeBytes: number;
  }) {
    const { userId, folderId, fileType, sizeBytes } = params;
    const pkg = await this.getActivePackage(userId);

    // Ensure folder exists and belongs to user (and not deleted)
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, deletedAt: null },
      select: { id: true }
    });
    if (!folder) throw new ApiError(404, "Target folder not found.");

    // 1) Allowed types
    if (!pkg.allowedTypes.includes(fileType)) {
      throw new ApiError(
        403,
        `File type ${fileType} is not allowed in your plan (${pkg.name}). Allowed: ${pkg.allowedTypes.join(", ")}.`
      );
    }

    // 2) Max size
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > pkg.maxFileSizeMB) {
      throw new ApiError(
        403,
        `File too large. Your plan (${pkg.name}) allows max ${pkg.maxFileSizeMB}MB per file.`
      );
    }

    // 3) Total file limit (account-wide)
    const totalFiles = await prisma.file.count({
      where: { userId, deletedAt: null }
    });

    if (totalFiles >= pkg.totalFileLimit) {
      throw new ApiError(
        403,
        `Total file limit reached. Your plan (${pkg.name}) allows max ${pkg.totalFileLimit} files.`
      );
    }

    // 4) Files per folder limit
    const folderFiles = await prisma.file.count({
      where: { userId, folderId, deletedAt: null }
    });

    if (folderFiles >= pkg.filesPerFolder) {
      throw new ApiError(
        403,
        `Folder file limit reached. Your plan (${pkg.name}) allows max ${pkg.filesPerFolder} files per folder.`
      );
    }

    return { pkg };
  }

  // -----------------------------
  // Optional: usage snapshot for UI meters
  // (helpful for frontend dashboard)
  // -----------------------------
  static async getUsageSnapshot(params: { userId: string; folderId?: string }) {
    const { userId, folderId } = params;
    const pkg = await this.getActivePackage(userId);

    const [folderCount, totalFileCount] = await Promise.all([
      prisma.folder.count({ where: { userId, deletedAt: null } }),
      prisma.file.count({ where: { userId, deletedAt: null } })
    ]);

    let filesInFolder: number | null = null;
    if (folderId) {
      filesInFolder = await prisma.file.count({
        where: { userId, folderId, deletedAt: null }
      });
    }

    return {
      package: {
        id: pkg.id,
        name: pkg.name,
        limits: {
          maxFolders: pkg.maxFolders,
          maxNestingLevel: pkg.maxNestingLevel,
          allowedTypes: pkg.allowedTypes,
          maxFileSizeMB: pkg.maxFileSizeMB,
          totalFileLimit: pkg.totalFileLimit,
          filesPerFolder: pkg.filesPerFolder
        }
      },
      usage: {
        folderCount,
        totalFileCount,
        filesInFolder
      }
    };
  }
}