import { describe, expect, test } from "bun:test";
import { MAX_RESULT_BYTES, OpenAICompatReviewer, truncateUtf8 } from "../src/llm";

interface Captured {
  url: string;
  init: RequestInit;
}

function mockFetch(respond: () => Response | Promise<Response>) {
  const calls: Captured[] = [];
  const fn = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return respond();
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const ok = (content: unknown) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

const make = (f: typeof fetch, baseUrl = "https://llm.example/v1") =>
  new OpenAICompatReviewer({ baseUrl, apiKey: "secret-key", model: "m1", fetch: f });

describe("OpenAICompatReviewer", () => {
  test("sends model, bearer key and wrapped brief", async () => {
    const { fn, calls } = mockFetch(() => ok("looks fine"));
    const out = await make(fn).review("x");
    expect(out).toBe("looks fine");
    expect(calls[0]!.url).toBe("https://llm.example/v1/chat/completions");
    expect(calls[0]!.init.method).toBe("POST");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-key");
    const body = JSON.parse(calls[0]!.init.body as string);
    expect(body.model).toBe("m1");
    expect(body.max_tokens).toBe(900);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("You are AuditBot");
    expect(body.messages[1].role).toBe("user");
    expect(body.messages[1].content).toContain("<brief>x</brief>");
  });

  test("strips one trailing slash from baseUrl", async () => {
    const { fn, calls } = mockFetch(() => ok("a"));
    await make(fn, "https://llm.example/v1/").review("x");
    expect(calls[0]!.url).toBe("https://llm.example/v1/chat/completions");
  });

  test("throws on 500 without leaking key or brief", async () => {
    const { fn } = mockFetch(() => new Response("boom secret-key", { status: 500 }));
    const err = await make(fn).review("private brief text").catch((e: Error) => e) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("llm: HTTP 500");
    expect(err.message).not.toContain("secret-key");
    expect(err.message).not.toContain("private brief text");
  });

  test("throws on empty, whitespace or missing content", async () => {
    for (const c of ["", "  \n ", undefined, null]) {
      const { fn } = mockFetch(() => ok(c));
      await expect(make(fn).review("x")).rejects.toThrow("llm: empty response");
    }
    const { fn } = mockFetch(() => new Response("{}", { status: 200 }));
    await expect(make(fn).review("x")).rejects.toThrow("llm: empty response");
  });

  test("wraps network failure without underlying message", async () => {
    const { fn } = mockFetch(() => {
      throw new Error("connect https://user:secret-key@llm.example failed");
    });
    const err = await make(fn).review("x").catch((e: Error) => e) as Error;
    expect(err.message).toBe("llm: request failed");
    expect(err.message).not.toContain("secret-key");
  });

  test("caps the returned review at MAX_RESULT_BYTES", async () => {
    const { fn } = mockFetch(() => ok("é".repeat(5000)));
    const out = await make(fn).review("x");
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(MAX_RESULT_BYTES);
  });

  test("times out a hung endpoint", async () => {
    const hung = (async (_url: unknown, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })) as unknown as typeof fetch;
    const r = new OpenAICompatReviewer({
      baseUrl: "https://llm.example/v1",
      apiKey: "k",
      model: "m",
      fetch: hung,
      timeoutMs: 10,
    });
    await expect(r.review("x")).rejects.toThrow("llm: request failed");
  });
});

describe("truncateUtf8", () => {
  test("keeps multibyte characters whole", () => {
    const out = truncateUtf8("é".repeat(3000), MAX_RESULT_BYTES);
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(4096);
    expect(out.endsWith("é")).toBe(true);
    expect(out.includes("\uFFFD")).toBe(false);
  });

  test("leaves short text unchanged", () => {
    expect(truncateUtf8("hello é", 4096)).toBe("hello é");
  });

  test("does not split 4-byte characters", () => {
    const out = truncateUtf8("a" + "😀".repeat(10), 6);
    expect(out).toBe("a😀");
  });

});
