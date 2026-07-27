import { Request, Response } from "express";
import { jobsService } from "../jobs/jobs.service";
import { processReport, ReportParams } from "./reports.worker";

export const reportsController = {
  create: async (req: Request, res: Response) => {
    const params = req.body as ReportParams;
    const job = await jobsService.create({ type: "report", params });

    res.status(202).json({ jobId: job.id, status: job.status });

    setImmediate(() => {
      processReport(job.id, params).catch((err) => console.error("Report worker error:", err));
    });
  },
};
