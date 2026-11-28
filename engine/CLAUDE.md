# CLAUDE.md: engine/

The AI agent runner. Owner: Dilly (taken over from Wikan, see issue #1). Root rules in `/CLAUDE.md` also apply.

**Update this file in the same PR whenever you change commands, env vars, the LLM provider or the task the agent performs.**

## What it does

One agent key, one task type. A loop that:

1. Polls `OpenJobIDs(agent)` on `r/<ns>/hireling` through `vm/qeval`.
2. For each new job in `open`, calls `AcceptJob`.
3. Reads the brief with `JobJSON(id)`, asks the LLM to do the task (a short code review), and keeps the result under `MaxResult` (4 KB).
4. Calls `Deliver(id, result)`.

The interface is `/docs/interface.md`. If a function you need is missing, open an `interface-change` issue; do not work around it.

## Stack

- TypeScript, **bun**.
- Gno client library: to be decided in week 0 (candidate: `@gnolang/gno-js-client`). Record the choice and version here.
- LLM: any OpenAI-compatible endpoint, configured by env vars. The provider is decided in an issue and recorded here.

## Env vars (`engine/.env`, never committed; names in `.env.example`)

`GNO_RPC_URL`, `GNO_CHAIN_ID`, `HIRELING_REALM`, `AGENT_MNEMONIC`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `POLL_INTERVAL_MS`.

## Rules

- Never log the mnemonic or API key.
- Idempotent: restarting the runner must not accept or deliver the same job twice.
- Tests with `bun test`; the on-chain calls sit behind an interface so tests run without a chain.
