import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { categoriesController } from "./categories.controller";
import {
  createCategorySchema,
  idParamSchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "./categories.schema";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  validate({ query: listCategoriesQuerySchema }),
  asyncHandler(categoriesController.list)
);
categoriesRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(categoriesController.getOne)
);
categoriesRouter.post(
  "/",
  validate({ body: createCategorySchema }),
  asyncHandler(categoriesController.create)
);
categoriesRouter.put(
  "/:id",
  validate({ params: idParamSchema, body: updateCategorySchema }),
  asyncHandler(categoriesController.update)
);
categoriesRouter.delete(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(categoriesController.remove)
);
