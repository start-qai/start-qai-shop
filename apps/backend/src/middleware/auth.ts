import type { Request, Response, NextFunction } from "express";
import { AUTH_HEADER } from "@qai-shop/shared";
import { config } from "../config.js";
import { HttpError } from "../lib/http-error.js";

/**
 * Authorization middleware – SIMULATED (training).
 * The scheme name ("Bearer") is matched case-insensitively (per RFC 7235/6750).
 * Only a single hardcoded token (config.authToken) is accepted => anything else => 401.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers[AUTH_HEADER];

  const match = typeof header === "string" ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;

  if (!match) {
    throw HttpError.unauthorized("Brak nagłówka Authorization: Bearer <token>");
  }

  const token = match[1].trim();

  if (token !== config.authToken) {
    throw HttpError.unauthorized("Nieprawidłowy token autoryzacyjny");
  }

  next();
}
