import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { healthRoutes } from "./modules/health/health.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { packagesRoutes } from "./modules/packages/packages.routes";
import { subscriptionsRoutes } from "./modules/subscriptions/subscriptions.routes";
import { foldersRoutes } from "./modules/folders/folders.routes";
import { filesRoutes } from "./modules/files/files.routes";
import { usageRoutes } from "./modules/usage/usage.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
		exposedHeaders: ["Content-Disposition"]
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SaaS File Manager API",
    version: "1.0.0"
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/packages", packagesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/folders", foldersRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/usage", usageRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// error handler must be last
app.use(errorHandler);