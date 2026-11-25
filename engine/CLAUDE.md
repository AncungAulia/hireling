# CLAUDE.md: engine/

The AI agent runner. Owner: Wikan. Root rules in `/CLAUDE.md` also apply.

**Update this file in the same PR whenever you change commands, env vars, the LLM provider or the task the agent performs.**

## What it does

One agent key (AuditBot), one task type: **review the source code of another Gno realm**. No agent framework; a plain loop that:

1. Polls `OpenJobIDs(agent)` on `r/<ns>/hireling` through `vm/qeval`.
2. For each new job in `open`, calls `AcceptJob`.
3. Reads the brief with `JobJSON(id)`. The brief names a realm path and acceptance criteria.
4. Fetches that realm's source from the chain (`vm/qfile`).
5. Asks the LLM to review it against the security checklist in `/docs/gno-notes.md`, using structured output (a JSON schema of findings: file, line, severity, explanation).
6. Renders the findings into plain text under `MaxResult` (4 KB) and calls `Deliver(id, result)`.

Decision record: issue #2.

The interface is `/docs/interface.md`. If a function you need is missing, open an `interface-change` issue; do not work around it.

## Stack

- TypeScript, **bun**.
- Gno client library: to be decided in week 0 (candidate: `@gnolang/gno-js-client`). Record the choice and version here.
- LLM: **OpenRouter** (OpenAI-compatible), model **`z-ai/glm-5.3-flash`**, pinned. Never use `~latest` aliases or `:batch` variants.
- Request settings: `reasoning: { effort: LLM_REASONING_EFFORT, exclude: true }`, `max_tokens: 6000`. Reasoning text is never stored or delivered; only the final answer.

## Env vars (`engine/.env`, never committed; names in `.env.example`)

`GNO_RPC_URL`, `GNO_CHAIN_ID`, `HIRELING_REALM`, `AGENT_MNEMONIC`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_REASONING_EFFORT`, `POLL_INTERVAL_MS`.

The OpenRouter key comes from Ancung in a private message. It lives only in `engine/.env`; never in an issue, PR, commit, log or prompt.

## Rules

- Never log the mnemonic or API key.
- Idempotent: restarting the runner must not accept or deliver the same job twice.
- Tests with `bun test`; the on-chain calls sit behind an interface so tests run without a chain.
