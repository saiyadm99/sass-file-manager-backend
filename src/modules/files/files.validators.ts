import { z } from "zod";

export const uploadSchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
  name: z.string().min(1).max(200).optional() // optional display name override
});

export const listByFolderParamsSchema = z.object({
  folderId: z.string().min(1)
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});

export const renameSchema = z.object({
  name: z.string().min(1, "name is required").max(200)
});