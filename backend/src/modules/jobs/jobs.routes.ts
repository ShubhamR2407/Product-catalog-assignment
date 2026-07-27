import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { jobsController } from "./jobs.controller";
import { idParamSchema } from "./jobs.schema";

export const jobsRouter = Router();

jobsRouter.get("/", asyncHandler(jobsController.list));
jobsRouter.get("/:id", validate({ params: idParamSchema }), asyncHandler(jobsController.getOne));
jobsRouter.get(
  "/:id/download",
  validate({ params: idParamSchema }),
  asyncHandler(jobsController.download)
);
