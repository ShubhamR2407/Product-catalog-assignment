import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(150),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(150).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const listCategoriesQuerySchema = z.object({
  search: z.string().optional(),
});
