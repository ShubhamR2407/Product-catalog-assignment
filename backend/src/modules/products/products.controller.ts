import { Request, Response } from "express";
import { productsService } from "./products.service";

function imagePathFromFile(file: Express.Multer.File | undefined) {
  return file ? `/uploads/products/${file.filename}` : null;
}

export const productsController = {
  list: async (req: Request, res: Response) => {
    const q = req.query as unknown as {
      page: number;
      limit: number;
      sortBy?: "price";
      order: "asc" | "desc";
      search?: string;
      categoryId?: string;
    };
    res.json(await productsService.list(q));
  },

  getOne: async (req: Request, res: Response) => {
    res.json(await productsService.getById((req.params.id as string)));
  },

  create: async (req: Request, res: Response) => {
    const product = await productsService.create({
      ...req.body,
      imagePath: imagePathFromFile(req.file),
    });
    res.status(201).json(product);
  },

  update: async (req: Request, res: Response) => {
    const imagePath = req.file ? imagePathFromFile(req.file) : undefined;
    const product = await productsService.update((req.params.id as string), {
      ...req.body,
      ...(imagePath !== undefined ? { imagePath } : {}),
    });
    res.json(product);
  },

  remove: async (req: Request, res: Response) => {
    await productsService.remove((req.params.id as string));
    res.status(204).send();
  },

  bulkRemove: async (req: Request, res: Response) => {
    const { ids } = req.body as { ids: string[] };
    res.json(await productsService.bulkRemove(ids));
  },
};
