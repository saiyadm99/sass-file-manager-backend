import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";

export class SubscriptionsService {
  // User sees packages created by admin (optionally only active ones)
  static async listPackages() {
    return prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    });
  }

  // Active package for this user
  static async getMyActivePackage(userId: string) {
    const active = await prisma.userSubscription.findFirst({
      where: { userId, endAt: null },
      include: { pkg: true }
    });

    if (!active) {
      return null; // user hasn't selected any package yet
    }

    return {
      subscriptionId: active.id,
      startAt: active.startAt,
      package: active.pkg
    };
  }

  // Full history for user (latest first)
  static async getMyHistory(userId: string) {
    const history = await prisma.userSubscription.findMany({
      where: { userId },
      include: { pkg: true },
      orderBy: { startAt: "desc" }
    });

    return history.map((h) => ({
      id: h.id,
      startAt: h.startAt,
      endAt: h.endAt,
      package: h.pkg
    }));
  }

  // Select/switch package
  static async selectPackage(userId: string, packageId: string) {
    // must exist and be active
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId }
    });
    if (!pkg) throw new ApiError(404, "Package not found");
    if (!pkg.isActive) throw new ApiError(400, "Package is not active");

    // If user already has active package and selects same package -> no-op (or treat as error)
    const current = await prisma.userSubscription.findFirst({
      where: { userId, endAt: null }
    });

    if (current && current.packageId === packageId) {
      return {
        changed: false,
        message: "Package already active",
        active: await this.getMyActivePackage(userId)
      };
    }

    // Transaction:
    // 1) end current active (if any)
    // 2) create new subscription row
    const now = new Date();
    const created = await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.userSubscription.update({
          where: { id: current.id },
          data: { endAt: now }
        });
      }

      const newSub = await tx.userSubscription.create({
        data: {
          userId,
          packageId,
          startAt: now
        }
      });

      return newSub;
    });

    const active = await prisma.userSubscription.findUnique({
      where: { id: created.id },
      include: { pkg: true }
    });

    return {
      changed: true,
      message: "Package selected successfully",
      active: active
        ? { subscriptionId: active.id, startAt: active.startAt, package: active.pkg }
        : null
    };
  }
}