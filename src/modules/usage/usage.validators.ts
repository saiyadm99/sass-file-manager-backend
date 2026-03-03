import { z } from "zod";

export const usageQuerySchema = z.object({
  folderId: z.string().min(1).optional()
});