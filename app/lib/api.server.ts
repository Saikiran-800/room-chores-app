import { json } from "@remix-run/node";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

function messageFrom(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (Array.isArray(record.violations)) {
      const parts = record.violations
        .map((v) => (v && typeof v === "object" ? String((v as Record<string, unknown>).message ?? "") : ""))
        .filter(Boolean);
      if (parts.length > 0) return parts.join("; ");
    }
    if (typeof record.title === "string") return record.title;
  }
  return fallback;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(503, `Can't reach the API at ${API_URL}. Is room-chores-svc running?`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(payload, `Request failed (${response.status})`));
  }
  return payload as T;
}

/** For actions: turn a client-side ApiError (4xx) into form feedback, rethrow anything else. */
export function actionError(error: unknown) {
  if (error instanceof ApiError && error.status < 500) {
    return json({ error: error.message }, { status: error.status });
  }
  return loaderFailure(error);
}

/**
 * For loaders (and unexpected action failures): throw a Response so the root ErrorBoundary can show
 * the real message even in production builds, where plain Errors are sanitized.
 */
export function loaderFailure(error: unknown): never {
  if (error instanceof ApiError) {
    throw json({ message: error.message }, { status: error.status });
  }
  throw error;
}
