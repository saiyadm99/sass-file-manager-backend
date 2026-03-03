import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1, "name is required").max(120),
  parentId: z.string().min(1).optional().nullable()
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, "name is required").max(120)
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});