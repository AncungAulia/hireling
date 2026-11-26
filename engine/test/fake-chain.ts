import type { HirelingChain, Job } from "../src/chain";

type Method = "acceptJob" | "deliver" | "job" | "openJobIds";

const WEEK_S = 7 * 86400;

export class FakeChain implements HirelingChain {
  nowS: number;
  calls: Record<string, bigint[]> = { acceptJob: [], deliver: [], job: [], openJobIds: [] };
  private agent: string;
  private jobs = new Map<bigint, Job>();
  private failing = new Set<Method>();
  private txCount = 0;

  constructor(opts: { agent: string; nowS: number }) {
    this.agent = opts.agent;
    this.nowS = opts.nowS;
  }

  addJob(partial: Partial<Job> & { id: bigint }): void {
    this.jobs.set(partial.id, {
      agent: this.agent,
      hirer: "g1hirer",
      price: 1000000n,
      brief: "",
      result: "",
      status: "open",
      createdAt: this.nowS,
      acceptedAt: 0,
      deadline: this.nowS + WEEK_S,
      deliveredAt: 0,
      disputeId: 0n,
      ...partial,
    });
  }

  getJob(id: bigint): Job {
    const j = this.jobs.get(id);
    if (!j) throw new Error(`hireling: job ${id} not found`);
    return { ...j };
  }

  failNext(method: Method): void {
    this.failing.add(method);
  }

  now(): number {
    return this.nowS;
  }

  async agentAddress(): Promise<string> {
    return this.agent;
  }

  async openJobIds(agent: string): Promise<bigint[]> {
    this.enter("openJobIds");
    return [...this.jobs.values()]
      .filter((j) => j.agent === agent && (j.status === "open" || j.status === "in_progress"))
      .map((j) => j.id)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  async job(id: bigint): Promise<Job> {
    this.enter("job", id);
    return this.getJob(id);
  }

  async acceptJob(id: bigint): Promise<string> {
    this.enter("acceptJob", id);
    const j = this.mustGet(id);
    if (j.status !== "open") throw new Error(`hireling: job ${id} is not open`);
    j.status = "in_progress";
    j.acceptedAt = this.nowS;
    return this.tx();
  }

  async deliver(id: bigint, result: string): Promise<string> {
    this.enter("deliver", id);
    const j = this.mustGet(id);
    if (j.status !== "in_progress") throw new Error(`hireling: job ${id} is not in progress`);
    j.status = "delivered";
    j.result = result;
    j.deliveredAt = this.nowS;
    return this.tx();
  }

  // Records the call, then throws if a failure was injected for this method.
  private enter(method: Method, id?: bigint): void {
    if (id !== undefined) this.calls[method]!.push(id);
    if (this.failing.delete(method)) throw new Error("fake: injected failure");
  }

  private mustGet(id: bigint): Job {
    const j = this.jobs.get(id);
    if (!j) throw new Error(`hireling: job ${id} not found`);
    return j;
  }

  private tx(): string {
    return `faketx-${++this.txCount}`;
  }
}
