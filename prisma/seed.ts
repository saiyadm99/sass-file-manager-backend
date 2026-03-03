import bcrypt from "bcrypt";
import { PrismaClient, FileType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ====== Credentials (change these before submission if you want) ======
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";

  const DEMO_USER_EMAIL = process.env.SEED_USER_EMAIL ?? "user@example.com";
  const DEMO_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? "user12345";
  const DEMO_USER_NAME = process.env.SEED_USER_NAME ?? "Demo User";

  // ====== Hash passwords ======
  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 10),
    bcrypt.hash(DEMO_USER_PASSWORD, 10)
  ]);

  // ====== Seed Admin ======
  const admin = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: {
      passwordHash: adminHash
    },
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash: adminHash,
      role: "ADMIN"
    },
    select: { id: true, email: true, role: true }
  });

  // ====== Seed Packages (Free/Silver/Gold/Diamond) ======
  // You can tune these limits based on what looks realistic.
  const packages = [
    {
      name: "Free",
      maxFolders: 10,
      maxNestingLevel: 2,
      allowedTypes: [FileType.IMAGE, FileType.PDF],
      maxFileSizeMB: 5,
      totalFileLimit: 20,
      filesPerFolder: 5
    },
    {
      name: "Silver",
      maxFolders: 50,
      maxNestingLevel: 4,
      allowedTypes: [FileType.IMAGE, FileType.PDF, FileType.AUDIO],
      maxFileSizeMB: 25,
      totalFileLimit: 200,
      filesPerFolder: 25
    },
    {
      name: "Gold",
      maxFolders: 200,
      maxNestingLevel: 6,
      allowedTypes: [FileType.IMAGE, FileType.PDF, FileType.AUDIO, FileType.VIDEO],
      maxFileSizeMB: 100,
      totalFileLimit: 1000,
      filesPerFolder: 100
    },
    {
      name: "Diamond",
      maxFolders: 1000,
      maxNestingLevel: 10,
      allowedTypes: [FileType.IMAGE, FileType.PDF, FileType.AUDIO, FileType.VIDEO],
      maxFileSizeMB: 500,
      totalFileLimit: 5000,
      filesPerFolder: 500
    }
  ];

  const createdPackages = [];
  for (const p of packages) {
    const pkg = await prisma.subscriptionPackage.upsert({
      where: { name: p.name },
      update: {
        maxFolders: p.maxFolders,
        maxNestingLevel: p.maxNestingLevel,
        allowedTypes: p.allowedTypes,
        maxFileSizeMB: p.maxFileSizeMB,
        totalFileLimit: p.totalFileLimit,
        filesPerFolder: p.filesPerFolder,
        isActive: true
      },
      create: {
        name: p.name,
        maxFolders: p.maxFolders,
        maxNestingLevel: p.maxNestingLevel,
        allowedTypes: p.allowedTypes,
        maxFileSizeMB: p.maxFileSizeMB,
        totalFileLimit: p.totalFileLimit,
        filesPerFolder: p.filesPerFolder,
        isActive: true
      }
    });
    createdPackages.push(pkg);
  }

  const freePkg = createdPackages.find((p) => p.name === "Free");
  if (!freePkg) throw new Error("Free package not found after seeding.");

  // ====== Seed Demo User ======
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL.toLowerCase() },
    update: {
      name: DEMO_USER_NAME,
      passwordHash: userHash
      // You can also set emailVerifiedAt here if you want:
      // emailVerifiedAt: new Date(),
    },
    create: {
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL.toLowerCase(),
      passwordHash: userHash
    },
    select: { id: true, name: true, email: true }
  });

  // ====== Ensure demo user has exactly one active subscription ======
  // End any existing active subscription and create a new one with Free plan.
  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.updateMany({
      where: { userId: demoUser.id, endAt: null },
      data: { endAt: new Date() }
    });

    await tx.userSubscription.create({
      data: {
        userId: demoUser.id,
        packageId: freePkg.id,
        startAt: new Date()
      }
    });
  });

  // ====== Print seed summary ======
  // (Useful for submission + sanity check)
  console.log("✅ Seed complete");
  console.log("Admin:", admin.email, "| role:", admin.role);
  console.log("Demo user:", demoUser.email);
  console.log("Packages:", createdPackages.map((p) => p.name).join(", "));
  console.log("");
  console.log("== Credentials (change for production/submission if needed) ==");
  console.log("ADMIN_EMAIL:", ADMIN_EMAIL);
  console.log("ADMIN_PASSWORD:", ADMIN_PASSWORD);
  console.log("USER_EMAIL:", DEMO_USER_EMAIL);
  console.log("USER_PASSWORD:", DEMO_USER_PASSWORD);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });