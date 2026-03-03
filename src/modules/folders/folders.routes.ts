import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { FoldersController } from "./folders.controller";
import { createFolderSchema, idParamSchema, renameFolderSchema } from "./folders.validators";

export const foldersRoutes = Router();

foldersRoutes.use(requireAuth);

// Tree for sidebar UI
foldersRoutes.get("/tree", FoldersController.tree);

// Optional flat list (sometimes easier to render)
foldersRoutes.get("/", FoldersController.listFlat);

// Create folder (root or inside parentId)
foldersRoutes.post("/", validate(createFolderSchema), FoldersController.create);

// Rename folder
foldersRoutes.patch("/:id", validate(idParamSchema, "params"), validate(renameFolderSchema), FoldersController.rename);

// Delete folder (soft delete; blocks if not empty)
foldersRoutes.delete("/:id", validate(idParamSchema, "params"), FoldersController.remove);