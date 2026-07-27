import { Prisma, JobStatus, JobType } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../utils/ApiError";

const MAX_STORED_ERRORS = 100;

export const jobsService = {
  async create(data: { type: JobType; sourceFilePath?: string; params?: Prisma.InputJsonValue }) {
    return prisma.job.create({
      data: {
        type: data.type,
        sourceFilePath: data.sourceFilePath,
        params: data.params,
      },
    });
  },

  async getById(id: string) {
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) throw new ApiError(404, "Job not found");
    return job;
  },

  async list() {
    return prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  },

  async markProcessing(id: string) {
    return prisma.job.update({
      where: { id },
      data: { status: JobStatus.processing, startedAt: new Date() },
    });
  },

  async updateProgress(
    id: string,
    progress: { totalRows?: number; processedRows?: number; successRows?: number; failedRows?: number; errors?: unknown[] }
  ) {
    return prisma.job.update({
      where: { id },
      data: {
        totalRows: progress.totalRows,
        processedRows: progress.processedRows,
        successRows: progress.successRows,
        failedRows: progress.failedRows,
        errors: progress.errors ? (progress.errors.slice(0, MAX_STORED_ERRORS) as Prisma.InputJsonValue) : undefined,
      },
    });
  },

  async markCompleted(id: string, resultFilePath?: string) {
    return prisma.job.update({
      where: { id },
      data: { status: JobStatus.completed, completedAt: new Date(), resultFilePath },
    });
  },

  async markFailed(id: string, message: string) {
    return prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.failed,
        completedAt: new Date(),
        errors: [{ message }] as Prisma.InputJsonValue,
      },
    });
  },
};
