import { Request, Response } from "express";
import { jobsService } from "../jobs/jobs.service";
import { processBulkUpload } from "./bulkUpload.worker";
import { ApiError } from "../../utils/ApiError";

export const bulkUploadController = {
  create: async (req: Request, res: Response) => {
    if (!req.file) throw new ApiError(400, "CSV file is required (field name: file)");

    const job = await jobsService.create({ type: "bulk_upload", sourceFilePath: req.file.path });

    res.status(202).json({ jobId: job.id, status: job.status });

    setImmediate(() => {
      processBulkUpload(job.id, req.file!.path).catch((err) => console.error("Bulk upload worker error:", err));
    });
  },
};
