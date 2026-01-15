export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function jsonResponse(payload: unknown, status = 200, headers: HeadersInit = {}): Response {
  const merged = new Headers(headers);
  if (!merged.has("content-type")) {
    merged.set("content-type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(payload), { status, headers: merged });
}

export function handleError(err: unknown): Response {
  if (err instanceof HttpError) {
    return jsonResponse({ error: err.message, details: err.details ?? null }, err.status);
  }
  console.error("Unhandled error", err);
  return jsonResponse({ error: "Internal Server Error" }, 500);
}
