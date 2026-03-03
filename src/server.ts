import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { ensureUploadDir } from "./config/storage";

async function main() {
  // Ensure DB connection is healthy on startup
  await prisma.$connect();
	ensureUploadDir();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});