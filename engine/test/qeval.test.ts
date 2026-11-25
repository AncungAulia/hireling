import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseIdList, parseJob, parseQevalString } from "../src/qeval";

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

describe("parseQevalString", () => {
  test("plain string", () => {
    expect(parseQevalString('("1,2" string)')).toBe("1,2");
  });

  test("escaped quotes", () => {
    expect(parseQevalString(String.raw`("{\"id\":1}" string)`)).toBe('{"id":1}');
  });

  test("Go escapes", () => {
    expect(parseQevalString(String.raw`("\x41" string)`)).toBe("A");
    expect(parseQevalString(String.raw`("\u00e9" string)`)).toBe("é");
    expect(parseQevalString(String.raw`("\U0001F600" string)`)).toBe("😀");
    const raw = String.raw`("a\tb\\c\'d\101" string)`;
    expect(parseQevalString(raw)).toBe("a\tb\\c'dA");
  });

  test("tolerates surrounding whitespace and trailing newline", () => {
    expect(parseQevalString('  ("hi" string)\n')).toBe("hi");
  });

  test("simple fixture from Onyx", () => {
    expect(parseQevalString(fixture("qeval-string-simple.txt"))).toBe(
      "# Gno.land's blog\n\nNo posts.",
    );
  });

  test("real fixture from Onyx", () => {
    const s = parseQevalString(fixture("qeval-string.txt"));
    expect(s.startsWith("# GovDAO\n## Members")).toBe(true);
    expect(s).toContain(String.raw`\-`);
  });

  test("rejects bad wrapper and bad escapes with qeval: prefix", () => {
    expect(() => parseQevalString("hello")).toThrow(/^qeval: /);
    expect(() => parseQevalString('("abc" int)')).toThrow(/^qeval: /);
    expect(() => parseQevalString(String.raw`("\q" string)`)).toThrow(/^qeval: /);
    expect(() => parseQevalString(String.raw`("\xZZ" string)`)).toThrow(/^qeval: /);
  });

  test("error message truncates long input", () => {
    try {
      parseQevalString("x".repeat(500));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error).message.length).toBeLessThan(200);
    }
  });
});

describe("parseIdList", () => {
  test("empty", () => {
    expect(parseIdList("")).toEqual([]);
  });
  test("sorted and deduped", () => {
    expect(parseIdList("3,1,1")).toEqual([1n, 3n]);
    expect(parseIdList("3,1,2")).toEqual([1n, 2n, 3n]);
  });
  test("rejects garbage", () => {
    expect(() => parseIdList("1,x")).toThrow(/^qeval: /);
  });
});

const baseJob = {
  id: 7,
  agent: "g1agent",
  hirer: "g1hirer",
  price: 5000000,
  brief: "do it",
  result: "",
  status: "open",
  createdAt: 100,
  acceptedAt: 0,
  deadline: 200,
  deliveredAt: 0,
  disputeId: 0,
};

describe("parseJob", () => {
  test("accepts numbers", () => {
    const j = parseJob(JSON.stringify(baseJob));
    expect(j.id).toBe(7n);
    expect(j.price).toBe(5000000n);
    expect(j.disputeId).toBe(0n);
    expect(j.createdAt).toBe(100);
    expect(j.status).toBe("open");
  });
  test("accepts numeric strings", () => {
    const j = parseJob(
      JSON.stringify({ ...baseJob, price: "5000000", id: "7", createdAt: "100" }),
    );
    expect(j.price).toBe(5000000n);
    expect(j.id).toBe(7n);
    expect(j.createdAt).toBe(100);
  });
  test("unknown status throws", () => {
    expect(() => parseJob(JSON.stringify({ ...baseJob, status: "weird" }))).toThrow(/^qeval: /);
  });
  test("missing key throws", () => {
    const { brief: _b, ...rest } = baseJob;
    expect(() => parseJob(JSON.stringify(rest))).toThrow(/^qeval: .*brief/);
  });
  test("non-numeric value throws", () => {
    expect(() => parseJob(JSON.stringify({ ...baseJob, price: "abc" }))).toThrow(/^qeval: /);
  });
  test("invalid JSON throws", () => {
    expect(() => parseJob("{nope")).toThrow(/^qeval: /);
  });
});
