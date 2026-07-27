import { Request, Response } from "express";
import { usersService } from "./users.service";

export const usersController = {
  list: async (_req: Request, res: Response) => {
    res.json(await usersService.list());
  },

  getOne: async (req: Request, res: Response) => {
    res.json(await usersService.getById((req.params.id as string)));
  },

  create: async (req: Request, res: Response) => {
    const user = await usersService.create(req.body);
    res.status(201).json(user);
  },

  update: async (req: Request, res: Response) => {
    res.json(await usersService.update((req.params.id as string), req.body));
  },

  remove: async (req: Request, res: Response) => {
    await usersService.remove((req.params.id as string));
    res.status(204).send();
  },
};
