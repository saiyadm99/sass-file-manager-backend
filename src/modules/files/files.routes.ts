import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { FilesController } from "./files.controller";
import { idParamSchema, listByFolderParamsSchema, renameSchema, uploadSchema } from "./files.validators";
import { UPLOAD_DIR } from "../../config/storage";

// Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // keep extension, add unique prefix
    const ext = path.extname(file.originalname || "");
    const safeExt = ext.slice(0, 10); // avoid crazy ext length
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  }
});

// Note: fileSize cannot be dynamic per plan here.
// We set a high cap; EnforcementService will enforce actual plan limits.
// If enforcement fails, we delete the uploaded file immediately.
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB hard cap to prevent abuse; adjust if needed
  }
});

export const filesRoutes = Router();

filesRoutes.use(requireAuth);

// List files by folder (for folder view)
filesRoutes.get(
  "/folder/:folderId",
  validate(listByFolderParamsSchema, "params"),
  FilesController.listByFolder
);

// Upload file (multipart/form-data, field: file)
filesRoutes.post(
  "/upload",
  upload.single("file"),
  validate(uploadSchema),
  FilesController.upload
);

// Download
filesRoutes.get("/:id/download", validate(idParamSchema, "params"), FilesController.download);

// Rename
filesRoutes.patch("/:id", validate(idParamSchema, "params"), validate(renameSchema), FilesController.rename);

// Delete
filesRoutes.delete("/:id", validate(idParamSchema, "params"), FilesController.remove);