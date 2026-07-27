import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { jobsService } from "./jobs.service";
import { ApiError } from "../../utils/ApiError";

export const jobsController = {
  list: async (_req: Request, res: Response) => {
    res.json(await jobsService.list());
  },

  getOne: async (req: Request, res: Response) => {
    res.json(await jobsService.getById((req.params.id as string)));
  },

  download: async (req: Request, res: Response) => {
    const job = await jobsService.getById((req.params.id as string));
    if (job.type !== "report") throw new ApiError(409, "Job is not a report job");
    if (job.status !== "completed" || !job.resultFilePath) {
      throw new ApiError(409, `Report is not ready yet (status: ${job.status})`);
    }
    if (!fs.existsSync(job.resultFilePath)) {
      throw new ApiError(404, "Report file no longer exists");
    }

    const ext = path.extname(job.resultFilePath);
    const filename = `product-report-${job.id}${ext}`;
    res.download(job.resultFilePath, filename);
  },
};
