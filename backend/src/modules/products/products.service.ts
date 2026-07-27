import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

function toPublicProduct(product: Prisma.ProductGetPayload<{ include: { category: true } }>) {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    imagePath: product.imagePath,
    categoryId: product.categoryId,
    category: { id: product.category.id, name: product.category.name },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function deleteImageFile(imagePath: string | null) {
  if (!imagePath) return;
  const filePath = path.join(env.uploadDir, imagePath.replace(/^\/uploads\//, ""));
  fs.unlink(filePath, () => {});
}

export type ListProductsQuery = {
  page: number;
  limit: number;
  sortBy?: "price";
  order: "asc" | "desc";
  search?: string;
  categoryId?: string;
};

function buildProductWhere(filter: { search?: string; categoryId?: string }): Prisma.ProductWhereInput {
  return {
    AND: [
      filter.categoryId ? { categoryId: filter.categoryId } : {},
      filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { category: { name: { contains: filter.search, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };
}

export const productsService = {
  async list(query: ListProductsQuery) {
    const { page, limit, sortBy, order, search, categoryId } = query;
    const where = buildProductWhere({ search, categoryId });

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: sortBy === "price" ? { price: order } : { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: rows.map(toPublicProduct),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!product) throw new ApiError(404, "Product not found");
    return toPublicProduct(product);
  },

  async create(data: { name: string; price: number; categoryId: string; imagePath: string | null }) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new ApiError(400, "Category does not exist");

    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        imagePath: data.imagePath,
      },
      include: { category: true },
    });
    return toPublicProduct(product);
  },

  async update(
    id: string,
    data: { name?: string; price?: number; categoryId?: string; imagePath?: string | null }
  ) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Product not found");

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new ApiError(400, "Category does not exist");
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        imagePath: data.imagePath ?? undefined,
      },
      include: { category: true },
    });

    if (data.imagePath && existing.imagePath && data.imagePath !== existing.imagePath) {
      deleteImageFile(existing.imagePath);
    }

    return toPublicProduct(product);
  },

  async remove(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Product not found");
    await prisma.product.delete({ where: { id } });
    deleteImageFile(existing.imagePath);
  },

  async bulkRemove(ids: string[]) {
    const existing = await prisma.product.findMany({ where: { id: { in: ids } } });
    const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    for (const product of existing) deleteImageFile(product.imagePath);
    return { deletedCount: count };
  },

  async bulkRemoveByFilter(filter: { search?: string; categoryId?: string }) {
    const where = buildProductWhere(filter);
    const existing = await prisma.product.findMany({ where, select: { imagePath: true } });
    const { count } = await prisma.product.deleteMany({ where });
    for (const product of existing) deleteImageFile(product.imagePath);
    return { deletedCount: count };
  },
};
