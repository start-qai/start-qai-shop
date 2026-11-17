import { config } from "../config.js";

export type BearerCheckResult = "ok" | "missing" | "invalid";

/**
 * Checks an `Authorization` header value – SIMULATED auth (training).
 * Shared by the REST middleware and the gRPC server so both channels behave the same way.
 * The scheme name ("Bearer") is matched case-insensitively (per RFC 7235/6750).
 * Only a single hardcoded token (config.authToken) is accepted.
 */
export function checkBearer(header: unknown): BearerCheckResult {
  const match = typeof header === "string" ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  if (!match) {
    return "missing";
  }
  return match[1].trim() === config.authToken ? "ok" : "invalid";
}

export const AUTH_MESSAGES = {
  missing: "Brak nagłówka Authorization: Bearer <token>",
  invalid: "Nieprawidłowy token autoryzacyjny",
} as const;
