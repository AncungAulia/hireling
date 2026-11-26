export type JobStatus =
  | "open"
  | "in_progress"
  | "delivered"
  | "disputed"
  | "completed"
  | "cancelled"
  | "refunded";

export const JOB_STATUSES: readonly JobStatus[] = [
  "open",
  "in_progress",
  "delivered",
  "disputed",
  "completed",
  "cancelled",
  "refunded",
];

export interface Job {
  id: bigint;
  agent: string;
  hirer: string;
  price: bigint;
  brief: string;
  result: string;
  status: JobStatus;
  createdAt: number;
  acceptedAt: number;
  deadline: number;
  deliveredAt: number;
  disputeId: bigint;
}

/**
 * What the runner needs from the chain. The real adapter talks to the realm;
 * tests use FakeChain.
 *
 * Adapter contract (restart idempotency depends on it):
 * - `acceptJob` and `deliver` resolve only after the tx is committed in a
 *   block (broadcast-commit). Reads made after they resolve reflect the new
 *   state.
 * - They throw if the tx fails or its commit is unknown.
 * - Error messages must never contain the signed tx, the mnemonic or key
 *   material, because the runner logs `err.message`.
 */
export interface HirelingChain {
  agentAddress(): Promise<string>;
  /** Realm OpenJobIDs: ids of the agent's jobs in open or in_progress. */
  openJobIds(agent: string): Promise<bigint[]>;
  /** Realm JobJSON, parsed. */
  job(id: bigint): Promise<Job>;
  /** Returns the tx hash; throws on chain panic. */
  acceptJob(id: bigint): Promise<string>;
  /** Returns the tx hash; throws on chain panic. */
  deliver(id: bigint, result: string): Promise<string>;
  /** Unix seconds. */
  now(): number;
}
