# CLAUDE.md: engine/

The AI agent runner. Owner: Wikan. Root rules in `/CLAUDE.md` also apply.

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
- Gno client library: to be decided in #3 (candidate: `@gnolang/gno-js-client`). Record the choice and version here.
- LLM: any OpenAI-compatible endpoint, configured by env vars. LLM provider: to be decided in #11; record it here.

## Commands

Run from `engine/`:

- `bun install`
- `bun test`
- `bun run typecheck`
- `bun run start`: needs `src/main.ts`, which Task 12 adds. Blocked on issue #3, which picks the Gno JS client.

## Modules

- `src/config.ts`: env to `Config`.
- `src/chain.ts`: `HirelingChain` interface and Job types.
- `src/qeval.ts`: `vm/qeval` output parsing.
- `src/llm.ts`: OpenAI-compatible `Reviewer`, UTF-8 byte cap 4096, request timeout default 120 s.
- `src/runner.ts`: poll loop.

## qeval wire format

`("<Go strconv.Quote-escaped string>" string)`, confirmed on Onyx 2026-11-25 (fixtures in `test/fixtures`). `\x` and octal escapes are raw bytes.

## Idempotency design

Chain state is the only durable state. An in-memory result cache avoids paying the LLM twice when a deliver is retried.

## Env vars (`engine/.env`, never committed; names in `.env.example`)

`GNO_RPC_URL`, `GNO_CHAIN_ID`, `HIRELING_REALM`, `AGENT_MNEMONIC`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `POLL_INTERVAL_MS`.

## Rules

- Never log the mnemonic or API key.
- Idempotent: restarting the runner must not accept or deliver the same job twice.
- Tests with `bun test`; the on-chain calls sit behind an interface so tests run without a chain.
