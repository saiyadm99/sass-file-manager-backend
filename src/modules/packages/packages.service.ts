import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { FileType, Prisma } from "@prisma/client";

type CreateInput = {
  name: string;
  maxFolders: number;
  maxNestingLevel: number;
  allowedTypes: FileType[];
  maxFileSizeMB: number;
  totalFileLimit: number;
  filesPerFolder: number;
  isActive?: boolean;
};

type UpdateInput = Partial<CreateInput>;

function normalizeName(name: string) {
  return name.trim();
}

export class PackagesService {
  static async list() {
    return prisma.subscriptionPackage.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  static async getById(id: string) {
    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id } });
    if (!pkg) throw new ApiError(404, "Package not found");
    return pkg;
  }

  static async create(input: CreateInput) {
    const data: Prisma.SubscriptionPackageCreateInput = {
      name: normalizeName(input.name),
      maxFolders: input.maxFolders,
      maxNestingLevel: input.maxNestingLevel,
      allowedTypes: input.allowedTypes,
      maxFileSizeMB: input.maxFileSizeMB,
      totalFileLimit: input.totalFileLimit,
      filesPerFolder: input.filesPerFolder,
      isActive: input.isActive ?? true
    };

    try {
      return await prisma.subscriptionPackage.create({ data });
    } catch (e: any) {
      // Prisma unique constraint
      if (e?.code === "P2002") {
        throw new ApiError(409, "Package name already exists");
      }
      throw e;
    }
  }

  static async update(id: string, input: UpdateInput) {
    // ensure exists
    await this.getById(id);

    const data: Prisma.SubscriptionPackageUpdateInput = {};

    if (input.name !== undefined) data.name = normalizeName(input.name);
    if (input.maxFolders !== undefined) data.maxFolders = input.maxFolders;
    if (input.maxNestingLevel !== undefined) data.maxNestingLevel = input.maxNestingLevel;
    if (input.allowedTypes !== undefined) data.allowedTypes = input.allowedTypes;
    if (input.maxFileSizeMB !== undefined) data.maxFileSizeMB = input.maxFileSizeMB;
    if (input.totalFileLimit !== undefined) data.totalFileLimit = input.totalFileLimit;
    if (input.filesPerFolder !== undefined) data.filesPerFolder = input.filesPerFolder;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    try {
      return await prisma.subscriptionPackage.update({
        where: { id },
        data
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new ApiError(409, "Package name already exists");
      }
      throw e;
    }
  }

  static async remove(id: string) {
    // ensure exists
    await this.getById(id);

    // Optional safety: prevent deleting a package that is currently active for any user.
    const activeCount = await prisma.userSubscription.count({
      where: { packageId: id, endAt: null }
    });
    if (activeCount > 0) {
      throw new ApiError(
        409,
        "Cannot delete a package that is currently active for users. Disable it instead."
      );
    }

    return prisma.subscriptionPackage.delete({ where: { id } });
  }
}