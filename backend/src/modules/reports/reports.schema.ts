import { z } from "zod";

export const createReportSchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv"),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
});
