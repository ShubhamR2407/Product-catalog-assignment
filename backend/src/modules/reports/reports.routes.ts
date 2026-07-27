import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { reportsController } from "./reports.controller";
import { createReportSchema } from "./reports.schema";

export const reportsRouter = Router();

reportsRouter.post("/", validate({ body: createReportSchema }), asyncHandler(reportsController.create));
