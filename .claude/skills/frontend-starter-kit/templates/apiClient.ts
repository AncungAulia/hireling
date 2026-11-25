// src/lib/apiClient.ts: one axios instance; every failure becomes an ApiError with a kind
// and a message written for people. Copy follows the UI profile; translate it per product.
import axios from "axios";
import type { z } from "zod";
import { env } from "./env";

export type ApiErrorKind =
  | "offline"
  | "unreachable"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "server"
  | "invalid_response"
  | "unknown";

const MESSAGES: Record<ApiErrorKind, string> = {
  offline: "You are offline. Check your internet connection, then try again.",
  unreachable: "Can't reach the server. Check your connection, then try again.",
  timeout: "The server took too long to respond. Try again in a moment.",
  unauthorized: "Your session has ended. Sign in again.",
  forbidden: "You don't have access to this data. Contact your admin if you need it.",
  not_found: "This data wasn't found. It may have been deleted.",
  conflict: "This data was changed somewhere else. Reload, then try again.",
  validation: "Some entries aren't valid. Check them, then try again.",
  server: "Something went wrong on the server. Try again in a moment.",
  invalid_response: "The server's data couldn't be read. Contact your admin if this keeps happening.",
  unknown: "Something unexpected went wrong. Try again.",
};

/**
 * Show the backend's own message instead of the mapped one. Turn on only when the UI profile
 * says the API returns messages in the UI language; otherwise they stay in `details`.
 */
const SHOW_SERVER_MESSAGES = false;

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    /** HTTP status, or null when no response arrived. */
    readonly status: number | null = null,
    /** Raw response body or validation issues, for logs, never for the screen. */
    readonly details?: unknown,
    message: string = MESSAGES[kind],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

function serverMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return undefined;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const { status, data } = error.response;
      const kind = kindFromStatus(status);
      const fromServer = SHOW_SERVER_MESSAGES ? serverMessage(data) : undefined;
      return new ApiError(kind, status, data, fromServer ?? MESSAGES[kind]);
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return new ApiError("timeout");
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return new ApiError(offline ? "offline" : "unreachable");
  }
  return new ApiError("unknown", null, error);
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cancellations (query unmounted, filter changed) must stay cancellations.
    if (axios.isCancel(error)) return Promise.reject(error);
    return Promise.reject(toApiError(error));
  },
);

// Mock mode (references/mocking.md). The condition is inline and the import is dynamic, so a
// production build sees `false` here, drops the branch and ships no mock code.
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
  const mocksReady = import("@/mocks/attachMocks").then(({ attachMocks }) =>
    attachMocks(apiClient),
  );
  // A request sent before the mocks finish loading waits for them, then takes the mock adapter
  // (its config was built while the real adapter was still the default).
  apiClient.interceptors.request.use(async (config) => {
    await mocksReady;
    config.adapter = apiClient.defaults.adapter;
    return config;
  });
}

/** Validate a response body. A shape mismatch is an error, never patched with defaults. */
export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError("invalid_response", null, result.error.issues);
  return result.data;
}
