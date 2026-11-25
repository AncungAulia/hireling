import { JOB_STATUSES, type Job, type JobStatus } from "./chain";

function fail(msg: string, input?: string): never {
  const snippet = input === undefined ? "" : ` (input starts: ${JSON.stringify(input.slice(0, 80))})`;
  throw new Error(`qeval: ${msg}${snippet}`);
}

const WRAPPER = /^\s*\("([\s\S]*)" string\)\s*$/;
const SIMPLE: Record<string, string> = {
  a: "\x07",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
  v: "\v",
  "\\": "\\",
  '"': '"',
  "'": "'",
};

function hex(body: string, i: number, n: number, raw: string): number {
  const h = body.slice(i, i + n);
  if (h.length !== n || !/^[0-9a-fA-F]+$/.test(h)) fail("bad hex escape", raw);
  return parseInt(h, 16);
}

/** Parses `("<Go %q string>" string)` into the unescaped string. */
export function parseQevalString(raw: string): string {
  const m = WRAPPER.exec(raw);
  if (!m) fail("unexpected output format", raw);
  const body = m[1] as string;
  // Go %q emits hex and octal escapes for raw bytes: build bytes, decode once.
  const enc = new TextEncoder();
  const out: number[] = [];
  const pushText = (t: string) => out.push(...enc.encode(t));
  for (let i = 0; i < body.length; i++) {
    const c = body[i] as string;
    if (c !== "\\") {
      const cp = body.codePointAt(i) as number;
      pushText(String.fromCodePoint(cp));
      if (cp > 0xffff) i++;
      continue;
    }
    const e = body[++i];
    if (e === undefined) fail("dangling backslash", raw);
    if (e in SIMPLE) {
      pushText(SIMPLE[e] as string);
    } else if (e === "x") {
      out.push(hex(body, i + 1, 2, raw));
      i += 2;
    } else if (e === "u" || e === "U") {
      const n = e === "u" ? 4 : 8;
      const cp = hex(body, i + 1, n, raw);
      if (cp > 0x10ffff) fail("code point out of range", raw);
      if (cp >= 0xd800 && cp <= 0xdfff) fail("surrogate code point", raw);
      pushText(String.fromCodePoint(cp));
      i += n;
    } else if (e >= "0" && e <= "7") {
      const o = body.slice(i, i + 3);
      if (!/^[0-7]{3}$/.test(o)) fail("bad octal escape", raw);
      const v = parseInt(o, 8);
      if (v > 255) fail("octal escape out of range", raw);
      out.push(v);
      i += 2;
    } else {
      fail("bad escape", raw);
    }
  }
  return new TextDecoder().decode(new Uint8Array(out));
}

/** "" -> [], "3,1,2" -> [1n,2n,3n] (sorted, deduped). */
export function parseIdList(s: string): bigint[] {
  const t = s.trim();
  if (t === "") return [];
  const seen = new Set<bigint>();
  for (const part of t.split(",")) {
    if (!/^\d+$/.test(part.trim())) fail("bad id list", s);
    seen.add(BigInt(part.trim()));
  }
  return [...seen].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

type Obj = Record<string, unknown>;

function str(o: Obj, key: string): string {
  const v = o[key];
  if (typeof v !== "string") fail(`job field ${key} missing or not a string`);
  return v;
}

function big(o: Obj, key: string): bigint {
  const v = o[key];
  if (typeof v === "number" && Number.isInteger(v)) return BigInt(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
  fail(`job field ${key} missing or not numeric`);
}

function num(o: Obj, key: string): number {
  return Number(big(o, key));
}

export function parseJob(json: string): Job {
  let o: unknown;
  try {
    o = JSON.parse(json);
  } catch {
    fail("job is not valid JSON", json);
  }
  if (typeof o !== "object" || o === null || Array.isArray(o)) fail("job is not an object", json);
  const r = o as Obj;
  const status = str(r, "status");
  if (!(JOB_STATUSES as readonly string[]).includes(status)) fail(`unknown job status ${JSON.stringify(status.slice(0, 40))}`);
  return {
    id: big(r, "id"),
    agent: str(r, "agent"),
    hirer: str(r, "hirer"),
    price: big(r, "price"),
    brief: str(r, "brief"),
    result: str(r, "result"),
    status: status as JobStatus,
    createdAt: num(r, "createdAt"),
    acceptedAt: num(r, "acceptedAt"),
    deadline: num(r, "deadline"),
    deliveredAt: num(r, "deliveredAt"),
    disputeId: big(r, "disputeId"),
  };
}
