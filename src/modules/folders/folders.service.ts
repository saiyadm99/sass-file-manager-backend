import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { EnforcementService } from "../storage/enforcement.service";

function sanitizeName(name: string) {
  return name.trim();
}

export class FoldersService {
  // Flat list (useful for building tree on frontend if you want)
  static async listFlat(userId: string) {
    return prisma.folder.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ depth: "asc" }, { createdAt: "asc" }]
    });
  }

  // Build nested tree on backend
  static async getTree(userId: string) {
    const folders = await prisma.folder.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        parentId: true,
        depth: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [{ depth: "asc" }, { createdAt: "asc" }]
    });

    // Build adjacency list
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        parentId: string | null;
        depth: number;
        createdAt: Date;
        updatedAt: Date;
        children: any[];
      }
    >();

    folders.forEach((f) => {
      byId.set(f.id, { ...f, parentId: f.parentId ?? null, children: [] });
    });

    const roots: any[] = [];

    for (const node of byId.values()) {
      if (!node.parentId) {
        roots.push(node);
      } else {
        const parent = byId.get(node.parentId);
        if (parent) parent.children.push(node);
        else roots.push(node); // orphan fallback (shouldn't happen)
      }
    }

    return roots;
  }

  static async getById(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, deletedAt: null }
    });
    if (!folder) throw new ApiError(404, "Folder not found");
    return folder;
  }

  static async create(userId: string, input: { name: string; parentId?: string | null }) {
    const name = sanitizeName(input.name);
    const parentId = input.parentId ?? null;

    // Enforcement: maxFolders + maxNestingLevel + parent ownership
    const { newDepth } = await EnforcementService.assertCanCreateFolder({ userId, parentId });

    // Optional: prevent duplicate folder names under same parent (common UX)
    // If you want duplicates allowed, remove this block.
    const duplicate = await prisma.folder.findFirst({
      where: {
        userId,
        parentId,
        deletedAt: null,
        name
      },
      select: { id: true }
    });
    if (duplicate) throw new ApiError(409, "A folder with this name already exists in this location");

    const folder = await prisma.folder.create({
      data: {
        userId,
        name,
        parentId,
        depth: newDepth
      }
    });

    return folder;
  }

  static async rename(userId: string, folderId: string, input: { name: string }) {
    const name = sanitizeName(input.name);

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, deletedAt: null },
      select: { id: true, parentId: true }
    });
    if (!folder) throw new ApiError(404, "Folder not found");

    // Optional duplicate name check under same parent
    const duplicate = await prisma.folder.findFirst({
      where: {
        userId,
        parentId: folder.parentId,
        deletedAt: null,
        name,
        NOT: { id: folderId }
      },
      select: { id: true }
    });
    if (duplicate) throw new ApiError(409, "A folder with this name already exists in this location");

    return prisma.folder.update({
      where: { id: folderId },
      data: { name }
    });
  }

  static async remove(userId: string, folderId: string) {
    // Ensure folder exists and owned by user
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, deletedAt: null },
      select: { id: true }
    });
    if (!folder) throw new ApiError(404, "Folder not found");

    // Safe delete policy (recommended for deadline):
    // Block delete if folder has active children or active files.
    const [childCount, fileCount] = await Promise.all([
      prisma.folder.count({ where: { userId, parentId: folderId, deletedAt: null } }),
      prisma.file.count({ where: { userId, folderId, deletedAt: null } })
    ]);

    if (childCount > 0) {
      throw new ApiError(409, "Folder is not empty. Delete or move subfolders first.");
    }
    if (fileCount > 0) {
      throw new ApiError(409, "Folder is not empty. Delete or move files first.");
    }

    // Soft delete folder
    return prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() }
    });
  }
}