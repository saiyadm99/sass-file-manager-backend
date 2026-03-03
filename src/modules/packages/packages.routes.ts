import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAdmin } from "../../middlewares/requireAdmin";
import { validate } from "../../middlewares/validate";
import { PackagesController } from "./packages.controller";
import { createPackageSchema, idParamSchema, updatePackageSchema } from "./packages.validators";

export const packagesRoutes = Router();

// all routes in this file are admin-only
packagesRoutes.use(requireAuth, requireAdmin);

packagesRoutes.get("/", PackagesController.list);

packagesRoutes.get("/:id", validate(idParamSchema, "params"), PackagesController.getOne);

packagesRoutes.post("/", validate(createPackageSchema), PackagesController.create);

packagesRoutes.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updatePackageSchema),
  PackagesController.update
);

packagesRoutes.delete("/:id", validate(idParamSchema, "params"), PackagesController.remove);