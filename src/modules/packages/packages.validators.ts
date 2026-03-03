import { z } from "zod";

const fileTypeEnum = z.enum(["IMAGE", "VIDEO", "PDF", "AUDIO"]);

const positiveInt = (field: string) =>
  z
    .number({ invalid_type_error: `${field} must be a number` })
    .int(`${field} must be an integer`)
    .min(0, `${field} must be >= 0`);

export const createPackageSchema = z.object({
  name: z.string().min(2).max(50),
  maxFolders: positiveInt("maxFolders"),
  maxNestingLevel: z.number().int().min(1, "maxNestingLevel must be >= 1"),
  allowedTypes: z.array(fileTypeEnum).min(1, "allowedTypes cannot be empty"),
  maxFileSizeMB: z.number().int().min(1, "maxFileSizeMB must be >= 1"),
  totalFileLimit: positiveInt("totalFileLimit"),
  filesPerFolder: positiveInt("filesPerFolder"),
  isActive: z.boolean().optional()
});

export const updatePackageSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    maxFolders: positiveInt("maxFolders").optional(),
    maxNestingLevel: z.number().int().min(1).optional(),
    allowedTypes: z.array(fileTypeEnum).min(1).optional(),
    maxFileSizeMB: z.number().int().min(1).optional(),
    totalFileLimit: positiveInt("totalFileLimit").optional(),
    filesPerFolder: positiveInt("filesPerFolder").optional(),
    isActive: z.boolean().optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided"
  });

export const idParamSchema = z.object({
  id: z.string().min(1)
});