import { describe, expect, test } from "bun:test";
import { FakeChain } from "./fake-chain";

const mk = () => new FakeChain({ agent: "g1agent", nowS: 1000 });

describe("FakeChain", () => {
  test("addJob fills defaults", async () => {
    const c = mk();
    c.addJob({ id: 1n });
    const j = await c.job(1n);
    expect(j.agent).toBe("g1agent");
    expect(j.status).toBe("open");
    expect(j.createdAt).toBe(1000);
    expect(j.deadline).toBe(1000 + 7 * 86400);
  });

  test("getJob returns a copy", () => {
    const c = mk();
    c.addJob({ id: 1n });
    c.getJob(1n).status = "completed";
    expect(c.getJob(1n).status).toBe("open");
  });

  test("openJobIds lists open and in_progress for the agent", async () => {
    const c = mk();
    c.addJob({ id: 1n });
    c.addJob({ id: 2n, status: "in_progress" });
    c.addJob({ id: 3n, status: "delivered" });
    c.addJob({ id: 4n, agent: "g1other" });
    expect(await c.openJobIds("g1agent")).toEqual([1n, 2n]);
  });

  test("accept then deliver", async () => {
    const c = mk();
    c.addJob({ id: 1n });
    c.nowS = 1500;
    expect(typeof (await c.acceptJob(1n))).toBe("string");
    expect(c.getJob(1n).status).toBe("in_progress");
    expect(c.getJob(1n).acceptedAt).toBe(1500);
    c.nowS = 1600;
    await c.deliver(1n, "done");
    const j = c.getJob(1n);
    expect(j.status).toBe("delivered");
    expect(j.result).toBe("done");
    expect(j.deliveredAt).toBe(1600);
    expect(c.calls.acceptJob).toEqual([1n]);
    expect(c.calls.deliver).toEqual([1n]);
  });

  test("rule violations throw hireling:", async () => {
    const c = mk();
    c.addJob({ id: 1n });
    await expect(c.deliver(1n, "x")).rejects.toThrow(/^hireling: /);
    await expect(c.acceptJob(99n)).rejects.toThrow(/^hireling: /);
    await c.acceptJob(1n);
    await expect(c.acceptJob(1n)).rejects.toThrow(/^hireling: /);
  });

  test("failNext fails once without changing state", async () => {
    const c = mk();
    c.addJob({ id: 1n });
    c.failNext("acceptJob");
    await expect(c.acceptJob(1n)).rejects.toThrow("fake: injected failure");
    expect(c.getJob(1n).status).toBe("open");
    await c.acceptJob(1n);
    expect(c.getJob(1n).status).toBe("in_progress");
  });

  test("now and agentAddress", async () => {
    const c = mk();
    c.nowS = 5;
    expect(c.now()).toBe(5);
    expect(await c.agentAddress()).toBe("g1agent");
  });
});
