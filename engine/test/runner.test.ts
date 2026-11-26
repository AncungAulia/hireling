import { describe, expect, test } from "bun:test";
import { ACCEPT_WINDOW_S, DEADLINE_MARGIN_S, Runner, type Logger } from "../src/runner";
import type { Reviewer } from "../src/llm";
import { FakeChain } from "./fake-chain";

const AGENT = "g1agent";
const NOW = 1_800_000_000;

class StubReviewer implements Reviewer {
  briefs: string[] = [];
  failNext = false;
  async review(brief: string): Promise<string> {
    this.briefs.push(brief);
    if (this.failNext) {
      this.failNext = false;
      throw new Error("llm: request failed");
    }
    return `review of ${brief}`;
  }
}

function setup() {
  const chain = new FakeChain({ agent: AGENT, nowS: NOW });
  const reviewer = new StubReviewer();
  const logs: { msg: string; f?: object }[] = [];
  const log: Logger = {
    info: () => {},
    warn: (msg, f) => logs.push({ msg, f }),
  };
  const mk = () => new Runner({ chain, reviewer, log });
  return { chain, reviewer, logs, mk };
}

describe("Runner", () => {
  test("accepts then delivers an open job in one tick", async () => {
    const { chain, mk } = setup();
    chain.addJob({ id: 1n, brief: "b1" });
    const report = await mk().tick();
    expect(chain.calls.acceptJob).toEqual([1n]);
    expect(chain.calls.deliver).toEqual([1n]);
    expect(report.delivered).toEqual([1n]);
    expect(report.accepted).toEqual([1n]);
    expect(chain.getJob(1n).status).toBe("delivered");
    expect(chain.getJob(1n).result).toBe("review of b1");
  });

  test("restart after accept delivers without accepting again", async () => {
    const { chain, mk } = setup();
    chain.addJob({ id: 1n, brief: "b1", status: "in_progress", acceptedAt: NOW });
    const report = await mk().tick();
    expect(chain.calls.acceptJob).toEqual([]);
    expect(chain.calls.deliver).toEqual([1n]);
    expect(report.delivered).toEqual([1n]);
  });

  test("restart after deliver does nothing", async () => {
    const { chain, reviewer, mk } = setup();
    chain.addJob({ id: 1n, status: "delivered" });
    const report = await mk().tick();
    expect(chain.calls.acceptJob).toEqual([]);
    expect(chain.calls.deliver).toEqual([]);
    expect(chain.calls.job).toEqual([]);
    expect(reviewer.briefs).toEqual([]);
    expect(report).toEqual({ accepted: [], delivered: [], skipped: [], failed: [] });
  });

  test("two ticks never deliver twice", async () => {
    const { chain, reviewer, mk } = setup();
    chain.addJob({ id: 1n, brief: "b1" });
    const runner = mk();
    await runner.tick();
    const second = await runner.tick();
    expect(chain.calls.deliver).toEqual([1n]);
    expect(reviewer.briefs).toHaveLength(1);
    expect(second.delivered).toEqual([]);
  });

  test("skips open job past accept window", async () => {
    const { chain, mk } = setup();
    chain.addJob({ id: 1n, createdAt: NOW - ACCEPT_WINDOW_S });
    const report = await mk().tick();
    expect(chain.calls.acceptJob).toEqual([]);
    expect(chain.calls.deliver).toEqual([]);
    expect(report.skipped).toEqual([1n]);
  });

  test("skips in_progress job past deadline", async () => {
    const { chain, mk } = setup();
    chain.addJob({ id: 1n, status: "in_progress", deadline: NOW + DEADLINE_MARGIN_S });
    const report = await mk().tick();
    expect(chain.calls.deliver).toEqual([]);
    expect(chain.calls.acceptJob).toEqual([]);
    expect(report.skipped).toEqual([1n]);
  });

  test("reviewer failure leaves the job for the next tick", async () => {
    const { chain, reviewer, logs, mk } = setup();
    chain.addJob({ id: 1n, brief: "SECRET-BRIEF" });
    reviewer.failNext = true;
    const runner = mk();
    const first = await runner.tick();
    expect(chain.calls.deliver).toEqual([]);
    expect(first.failed).toEqual([1n]);
    expect(logs).toHaveLength(1);
    expect(JSON.stringify(logs)).not.toContain("SECRET-BRIEF");
    const second = await runner.tick();
    expect(chain.calls.acceptJob).toEqual([1n]);
    expect(chain.calls.deliver).toEqual([1n]);
    expect(second.delivered).toEqual([1n]);
    expect(reviewer.briefs).toHaveLength(2);
  });

  test("deliver failure reuses cached result", async () => {
    const { chain, reviewer, mk } = setup();
    chain.addJob({ id: 1n, brief: "b1" });
    chain.failNext("deliver");
    const runner = mk();
    const first = await runner.tick();
    expect(first.failed).toEqual([1n]);
    expect(chain.getJob(1n).status).toBe("in_progress");
    const second = await runner.tick();
    expect(second.delivered).toEqual([1n]);
    expect(chain.getJob(1n).status).toBe("delivered");
    expect(reviewer.briefs).toHaveLength(1);
  });

  test("one failing job does not block another", async () => {
    const { chain, reviewer, mk } = setup();
    chain.addJob({ id: 1n, brief: "b1" });
    chain.addJob({ id: 2n, brief: "b2" });
    chain.failNext("acceptJob");
    const report = await mk().tick();
    expect(report.failed).toEqual([1n]);
    expect(report.delivered).toEqual([2n]);
    expect(chain.getJob(2n).status).toBe("delivered");
    expect(reviewer.briefs).toEqual(["b2"]);
  });

  test("skips a job whose agent is not ours", async () => {
    const { chain, mk } = setup();
    chain.addJob({ id: 1n, agent: "g1other" });
    chain.openJobIds = async () => [1n]; // a stale listing that still names the job
    const report = await mk().tick();
    expect(chain.calls.acceptJob).toEqual([]);
    expect(report.skipped).toEqual([1n]);
  });

  test("tick never throws when listing fails", async () => {
    const { chain, logs, mk } = setup();
    chain.failNext("openJobIds");
    const report = await mk().tick();
    expect(report).toEqual({ accepted: [], delivered: [], skipped: [], failed: [] });
    expect(logs).toHaveLength(1);
  });

  test("run stops on abort and ticks do not overlap", async () => {
    const { mk } = setup();
    const runner = mk();
    let active = 0;
    let max = 0;
    let count = 0;
    runner.tick = async () => {
      active++;
      max = Math.max(max, active);
      count++;
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { accepted: [], delivered: [], skipped: [], failed: [] };
    };
    const ac = new AbortController();
    const done = runner.run(1, ac.signal);
    await new Promise((r) => setTimeout(r, 40));
    ac.abort();
    await done;
    expect(max).toBe(1);
    expect(count).toBeGreaterThan(1);
    const seen = count;
    await new Promise((r) => setTimeout(r, 20));
    expect(count).toBe(seen);
  });

  test("run resolves promptly on abort during a long interval", async () => {
    const { mk } = setup();
    const runner = mk();
    const ac = new AbortController();
    const done = runner.run(60_000, ac.signal);
    await new Promise((r) => setTimeout(r, 10));
    ac.abort();
    await done;
  });
});
