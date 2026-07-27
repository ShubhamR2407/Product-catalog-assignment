import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { env } from "../../config/env";
import { jobsService } from "../jobs/jobs.service";

const PAGE_SIZE = 1000;

export type ReportParams = {
  format: "csv" | "xlsx";
  categoryId?: string;
  search?: string;
};

function buildWhere(params: ReportParams): Prisma.ProductWhereInput {
  return {
    AND: [
      params.categoryId ? { categoryId: params.categoryId } : {},
      params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { category: { name: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };
}

const COLUMNS = ["Unique ID", "Name", "Category", "Price", "Image Path", "Created At"];

function toRow(product: { id: string; name: string; category: { name: string }; price: Prisma.Decimal; imagePath: string | null; createdAt: Date }) {
  return [product.id, product.name, product.category.name, Number(product.price), product.imagePath ?? "", product.createdAt.toISOString()];
}

async function writeCsv(jobId: string, where: Prisma.ProductWhereInput, filePath: string, onProgress: (n: number) => Promise<void>) {
  const writeStream = fs.createWriteStream(filePath);
  const stringifier = stringify({ header: true, columns: COLUMNS });
  stringifier.pipe(writeStream);

  let cursor: string | undefined;
  let processed = 0;

  for (;;) {
    const rows = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;

    for (const row of rows) stringifier.write(toRow(row));
    processed += rows.length;
    await onProgress(processed);

    cursor = rows[rows.length - 1].id;
    if (rows.length < PAGE_SIZE) break;
  }

  stringifier.end();
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });
}

async function writeXlsx(jobId: string, where: Prisma.ProductWhereInput, filePath: string, onProgress: (n: number) => Promise<void>) {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: filePath, useSharedStrings: false });
  const sheet = workbook.addWorksheet("Products");
  sheet.addRow(COLUMNS).commit();

  let cursor: string | undefined;
  let processed = 0;

  for (;;) {
    const rows = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;

    for (const row of rows) sheet.addRow(toRow(row)).commit();
    processed += rows.length;
    await onProgress(processed);

    cursor = rows[rows.length - 1].id;
    if (rows.length < PAGE_SIZE) break;
  }

  sheet.commit();
  await workbook.commit();
}

export async function processReport(jobId: string, params: ReportParams) {
  await jobsService.markProcessing(jobId);

  const where = buildWhere(params);

  try {
    const totalRows = await prisma.product.count({ where });
    await jobsService.updateProgress(jobId, { totalRows, processedRows: 0, successRows: 0, failedRows: 0 });

    const ext = params.format === "xlsx" ? "xlsx" : "csv";
    const filePath = path.join(env.reportDir, `${jobId}.${ext}`);

    const onProgress = async (processed: number) => {
      await jobsService.updateProgress(jobId, {
        totalRows,
        processedRows: processed,
        successRows: processed,
        failedRows: 0,
      });
    };

    if (params.format === "xlsx") {
      await writeXlsx(jobId, where, filePath, onProgress);
    } else {
      await writeCsv(jobId, where, filePath, onProgress);
    }

    await jobsService.markCompleted(jobId, filePath);
  } catch (err) {
    await jobsService.markFailed(jobId, err instanceof Error ? err.message : "Report generation failed");
  }
}
