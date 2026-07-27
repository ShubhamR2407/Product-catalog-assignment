import fs from "fs";
import { parse } from "csv-parse";
import { prisma } from "../../db/prisma";
import { jobsService } from "../jobs/jobs.service";

const BATCH_SIZE = 500;

type CsvRow = { name?: string; price?: string; category?: string };
type RowError = { row: number; message: string };

async function resolveCategoryId(name: string, cache: Map<string, string | null>) {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  const category = await prisma.category.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });
  cache.set(key, category?.id ?? null);
  return category?.id ?? null;
}

export async function processBulkUpload(jobId: string, filePath: string) {
  await jobsService.markProcessing(jobId);

  const categoryCache = new Map<string, string | null>();
  const errors: RowError[] = [];
  let totalRows = 0;
  let processedRows = 0;
  let successRows = 0;
  let failedRows = 0;

  let batch: { name: string; price: number; categoryId: string }[] = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.product.createMany({ data: batch });
    successRows += batch.length;
    batch = [];
    await jobsService.updateProgress(jobId, { totalRows, processedRows, successRows, failedRows, errors });
  }

  try {
    const parser = fs.createReadStream(filePath).pipe(
      parse({ columns: true, trim: true, skip_empty_lines: true })
    );

    for await (const record of parser as AsyncIterable<CsvRow>) {
      totalRows += 1;
      processedRows += 1;

      const name = record.name?.trim();
      const priceRaw = record.price?.trim();
      const categoryName = record.category?.trim();
      const price = priceRaw ? Number(priceRaw) : NaN;

      if (!name) {
        failedRows += 1;
        errors.push({ row: totalRows, message: "Missing product name" });
        continue;
      }
      if (!priceRaw || Number.isNaN(price) || price < 0) {
        failedRows += 1;
        errors.push({ row: totalRows, message: `Invalid price: "${priceRaw ?? ""}"` });
        continue;
      }
      if (!categoryName) {
        failedRows += 1;
        errors.push({ row: totalRows, message: "Missing category" });
        continue;
      }

      const categoryId = await resolveCategoryId(categoryName, categoryCache);
      if (!categoryId) {
        failedRows += 1;
        errors.push({ row: totalRows, message: `Unknown category: "${categoryName}"` });
        continue;
      }

      batch.push({ name, price, categoryId });
      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    }

    await flushBatch();
    await jobsService.updateProgress(jobId, { totalRows, processedRows, successRows, failedRows, errors });
    await jobsService.markCompleted(jobId);
  } catch (err) {
    await jobsService.markFailed(jobId, err instanceof Error ? err.message : "Bulk upload failed");
  } finally {
    fs.unlink(filePath, () => {});
  }
}
