// src/mocks/mockUtils.ts: small helpers shared by the mock handlers.
import type { AxiosRequestConfig } from "axios";
import type { z } from "zod";

/** What a handler returns: [status, body]. */
export type MockReply = [status: number, data?: unknown];

/** The path segment captured by a pattern's first group: /^\/products\/([^/]+)$/ gives "p-1". */
export function pathParam(pattern: RegExp, config: AxiosRequestConfig): string {
  const path = (config.url ?? "").split("?")[0];
  const value = pattern.exec(path)?.[1];
  if (value === undefined) throw new Error(`Mock route ${pattern} does not match ${path}`);
  return decodeURIComponent(value);
}

/**
 * Validate a request body with the same schema the real API uses. An invalid body gets the
 * 422 the real API would send, so the form's error path is exercised too.
 */
export function parseBody<S extends z.ZodType>(
  schema: S,
  config: AxiosRequestConfig,
): { ok: true; data: z.output<S> } | { ok: false; reply: MockReply } {
  let raw: unknown = config.data;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { ok: false, reply: [400, { message: "Body is not valid JSON" }] };
    }
  }
  const result = schema.safeParse(raw);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, reply: [422, { issues: result.error.issues }] };
}
