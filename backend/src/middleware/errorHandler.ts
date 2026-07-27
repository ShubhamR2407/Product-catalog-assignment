import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: `Duplicate value for ${err.meta?.target ?? "field"}` });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ message: "Operation blocked by a related record" });
    }
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
