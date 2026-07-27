import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { HttpError } from "../lib/http-error.js";

/**
 * Returns middleware that validates `req.body` against the given Zod schema.
 * On success it replaces `req.body` with the parsed (and defaulted) data.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw HttpError.badRequest("Błąd walidacji danych wejściowych", err.flatten());
      }
      throw err;
    }
  };
}
