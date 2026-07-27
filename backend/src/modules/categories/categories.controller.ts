import { Request, Response } from "express";
import { categoriesService } from "./categories.service";

export const categoriesController = {
  list: async (req: Request, res: Response) => {
    res.json(await categoriesService.list(req.query.search as string | undefined));
  },

  getOne: async (req: Request, res: Response) => {
    res.json(await categoriesService.getById((req.params.id as string)));
  },

  create: async (req: Request, res: Response) => {
    res.status(201).json(await categoriesService.create(req.body));
  },

  update: async (req: Request, res: Response) => {
    res.json(await categoriesService.update((req.params.id as string), req.body));
  },

  remove: async (req: Request, res: Response) => {
    await categoriesService.remove((req.params.id as string));
    res.status(204).send();
  },
};
