import bcrypt from "bcrypt";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../utils/ApiError";

const SALT_ROUNDS = 10;

function toPublicUser(user: { id: string; email: string; createdAt: Date; updatedAt: Date }) {
  return { id: user.id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

export const usersService = {
  async list() {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map(toPublicUser);
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, "User not found");
    return toPublicUser(user);
  },

  async create(data: { email: string; password: string }) {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash },
    });
    return toPublicUser(user);
  },

  async update(id: string, data: { email?: string; password?: string }) {
    await usersService.getById(id);
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        passwordHash: data.password ? await bcrypt.hash(data.password, SALT_ROUNDS) : undefined,
      },
    });
    return toPublicUser(user);
  },

  async remove(id: string) {
    await usersService.getById(id);
    await prisma.user.delete({ where: { id } });
  },
};
