/** Simple HTTP error type with a status code, used by routers and the error middleware. */
export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Brak autoryzacji lub nieprawidłowy token") {
    return new HttpError(401, "UNAUTHORIZED", message);
  }

  static notFound(message = "Nie znaleziono zasobu") {
    return new HttpError(404, "NOT_FOUND", message);
  }
}
