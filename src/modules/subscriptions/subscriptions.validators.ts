import { z } from "zod";

export const selectPackageSchema = z.object({
  packageId: z.string().min(1, "packageId is required")
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});