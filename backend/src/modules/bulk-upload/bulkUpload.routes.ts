import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadCsv } from "../../middleware/upload";
import { bulkUploadController } from "./bulkUpload.controller";

export const bulkUploadRouter = Router();

bulkUploadRouter.post("/", uploadCsv.single("file"), asyncHandler(bulkUploadController.create));
