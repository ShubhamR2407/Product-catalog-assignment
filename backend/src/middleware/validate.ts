import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

type ValidateTargets = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(targets: ValidateTargets) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (targets.body) req.body = targets.body.parse(req.body);
      if (targets.query) {
        const parsed = targets.query.parse(req.query);
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
      }
      if (targets.params) {
        const parsed = targets.params.parse(req.params);
        Object.defineProperty(req, "params", { value: parsed, writable: true, configurable: true });
      }
      next();
    } catch (err: any) {
      next(new ApiError(400, "Validation failed", err.errors ?? err.message));
    }
  };
}
