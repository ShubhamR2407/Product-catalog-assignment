import { prisma } from "../../db/prisma";
import { ApiError } from "../../utils/ApiError";

export const categoriesService = {
  async list(search?: string) {
    return prisma.category.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new ApiError(404, "Category not found");
    return category;
  },

  async create(data: { name: string }) {
    return prisma.category.create({ data });
  },

  async update(id: string, data: { name?: string }) {
    await categoriesService.getById(id);
    return prisma.category.update({ where: { id }, data });
  },

  async remove(id: string) {
    await categoriesService.getById(id);
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ApiError(409, `Cannot delete category with ${productCount} product(s) assigned to it`);
    }
    await prisma.category.delete({ where: { id } });
  },
};
