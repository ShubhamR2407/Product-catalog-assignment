import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.coerce.number().nonnegative(),
  categoryId: z.string().uuid(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  price: z.coerce.number().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const bulkDeleteSchema = z.union([
  z.object({
    ids: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    all: z.literal(true),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
  }),
]);

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["price"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});
