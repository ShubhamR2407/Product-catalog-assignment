import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { uploadProductImage } from "../../middleware/upload";
import { productsController } from "./products.controller";
import {
  bulkDeleteSchema,
  createProductSchema,
  idParamSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "./products.schema";
import { bulkUploadRouter } from "../bulk-upload/bulkUpload.routes";
import { reportsRouter } from "../reports/reports.routes";

export const productsRouter = Router();

productsRouter.use("/bulk-upload", bulkUploadRouter);
productsRouter.use("/reports", reportsRouter);

productsRouter.post(
  "/bulk-delete",
  validate({ body: bulkDeleteSchema }),
  asyncHandler(productsController.bulkRemove)
);

productsRouter.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  asyncHandler(productsController.list)
);
productsRouter.get("/:id", validate({ params: idParamSchema }), asyncHandler(productsController.getOne));
productsRouter.post(
  "/",
  uploadProductImage.single("image"),
  validate({ body: createProductSchema }),
  asyncHandler(productsController.create)
);
productsRouter.put(
  "/:id",
  uploadProductImage.single("image"),
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(productsController.update)
);
productsRouter.delete(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(productsController.remove)
);
