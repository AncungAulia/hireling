export interface Config {
  rpcUrl: string;
  chainId: string;
  realm: string;
  mnemonic: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  pollIntervalMs: number;
}

const DEFAULT_POLL_INTERVAL_MS = 5000;
const MIN_POLL_INTERVAL_MS = 1000;

const REQUIRED = [
  "GNO_RPC_URL",
  "GNO_CHAIN_ID",
  "HIRELING_REALM",
  "AGENT_MNEMONIC",
  "LLM_BASE_URL",
  "LLM_API_KEY",
  "LLM_MODEL",
] as const;

// Error messages name variables only, never their values (they may be secrets).
export function loadConfig(env: Record<string, string | undefined>): Config {
  const missing = REQUIRED.filter((k) => !env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const rawInterval = env.POLL_INTERVAL_MS?.trim();
  let pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;
  if (rawInterval) {
    pollIntervalMs = Number(rawInterval);
    if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < MIN_POLL_INTERVAL_MS) {
      throw new Error(
        `POLL_INTERVAL_MS must be an integer >= ${MIN_POLL_INTERVAL_MS}`,
      );
    }
  }

  return {
    rpcUrl: env.GNO_RPC_URL!,
    chainId: env.GNO_CHAIN_ID!,
    realm: env.HIRELING_REALM!,
    mnemonic: env.AGENT_MNEMONIC!,
    llmBaseUrl: env.LLM_BASE_URL!,
    llmApiKey: env.LLM_API_KEY!,
    llmModel: env.LLM_MODEL!,
    pollIntervalMs,
  };
}
