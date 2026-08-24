import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/apiError.js";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw ApiError.badRequest(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
    req.body = result.data;
    next();
  };
}
