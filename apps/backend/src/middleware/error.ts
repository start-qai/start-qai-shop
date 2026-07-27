import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";
import type { ApiError } from "@qai-shop/shared";

/** Unified error handler – always returns JSON conforming to ApiErrorSchema. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    const body: ApiError = { error: err.code, message: err.message, details: err.details };
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiError = {
      error: "BAD_REQUEST",
      message: "Błąd walidacji danych wejściowych",
      details: err.flatten(),
    };
    res.status(400).json(body);
    return;
  }

  // Malformed JSON body (express.json / body-parser error) => 400, not 500.
  if (
    err instanceof SyntaxError &&
    typeof (err as { status?: number }).status === "number" &&
    "body" in (err as object)
  ) {
    const body: ApiError = {
      error: "BAD_REQUEST",
      message: "Nieprawidłowy format JSON w treści żądania",
    };
    res.status(400).json(body);
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);
  const body: ApiError = {
    error: "INTERNAL_ERROR",
    message: "Wystąpił nieoczekiwany błąd serwera",
  };
  res.status(500).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiError = {
    error: "NOT_FOUND",
    message: "Nie znaleziono zasobu",
  };
  res.status(404).json(body);
}
