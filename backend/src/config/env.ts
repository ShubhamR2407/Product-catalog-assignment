import "dotenv/config";
import path from "path";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads"),
  reportDir: path.resolve(process.cwd(), process.env.REPORT_DIR ?? "./storage/reports"),
  tmpUploadDir: path.resolve(process.cwd(), "./tmp/uploads"),
};
