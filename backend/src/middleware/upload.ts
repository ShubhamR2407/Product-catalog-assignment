import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { env } from "../config/env";

for (const dir of [
  env.uploadDir,
  path.join(env.uploadDir, "products"),
  env.reportDir,
  env.tmpUploadDir,
]) {
  fs.mkdirSync(dir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(env.uploadDir, "products")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

const bulkUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.tmpUploadDir),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

export const uploadCsv = multer({
  storage: bulkUploadStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/\.csv$/i.test(file.originalname)) {
      return cb(new Error("Only .csv files are allowed"));
    }
    cb(null, true);
  },
});
