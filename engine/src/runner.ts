import type { HirelingChain, Job } from "./chain";
import type { Reviewer } from "./llm";

export const ACCEPT_WINDOW_S = 2 * 86400; // PRD §5 accept deadline
export const DEADLINE_MARGIN_S = 60; // don't start a Deliver tx this close to the deadline

export interface Logger {
  info(msg: string, f?: object): void;
  warn(msg: string, f?: object): void;
}

export interface TickReport {
  accepted: bigint[];
  delivered: bigint[];
  skipped: bigint[];
  failed: bigint[];
}

// All durable state lives on chain. The only local state is the result cache,
// which saves an LLM call when a Deliver tx fails and is retried.
export class Runner {
  private readonly chain: HirelingChain;
  private readonly reviewer: Reviewer;
  private readonly log: Logger;
  private agent: string | undefined;
  private readonly results = new Map<bigint, string>();

  constructor(deps: { chain: HirelingChain; reviewer: Reviewer; log: Logger }) {
    this.chain = deps.chain;
    this.reviewer = deps.reviewer;
    this.log = deps.log;
  }

  async tick(): Promise<TickReport> {
    const report: TickReport = { accepted: [], delivered: [], skipped: [], failed: [] };
    let ids: bigint[];
    try {
      this.agent ??= await this.chain.agentAddress();
      ids = [...(await this.chain.openJobIds(this.agent))].sort((a, b) =>
        a < b ? -1 : a > b ? 1 : 0,
      );
    } catch (err) {
      this.log.warn("poll failed", { error: errMessage(err) });
      return report;
    }
    for (const id of ids) {
      try {
        await this.handle(id, this.agent, report);
      } catch (err) {
        report.failed.push(id);
        this.log.warn("job failed", { id: String(id), error: errMessage(err) });
      }
    }
    return report;
  }

  private async handle(id: bigint, agent: string, report: TickReport): Promise<void> {
    let job: Job = await this.chain.job(id);
    if (job.agent !== agent) {
      report.skipped.push(id);
      return;
    }
    if (job.status === "open") {
      if (this.chain.now() >= job.createdAt + ACCEPT_WINDOW_S) {
        report.skipped.push(id);
        return;
      }
      await this.chain.acceptJob(id);
      report.accepted.push(id);
      this.log.info("accepted", { id: String(id) });
      job = await this.chain.job(id);
    }
    if (job.status !== "in_progress") {
      report.skipped.push(id);
      return;
    }
    if (this.chain.now() >= job.deadline - DEADLINE_MARGIN_S) {
      report.skipped.push(id);
      return;
    }
    let result = this.results.get(id);
    if (result === undefined) {
      result = await this.reviewer.review(job.brief);
      this.results.set(id, result);
    }
    await this.chain.deliver(id, result);
    this.results.delete(id);
    report.delivered.push(id);
    this.log.info("delivered", { id: String(id) });
  }

  async run(intervalMs: number, signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      await this.tick();
      await sleep(intervalMs, signal);
    }
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// Resolves after ms, or as soon as the signal aborts.
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done);
  });
}
