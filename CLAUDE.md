# CLAUDE.md: Hireling (repo root)

Guidance for AI coding agents (Claude Code and others) working in this repo. Each folder has its own `CLAUDE.md` with folder-specific rules. Read the one for the folder you are changing before you start.

## Keep these files current

When you change how a folder works (setup, commands, structure, env vars, conventions, a decision), update that folder's `CLAUDE.md` in the same PR. Update this root file when the change affects the whole repo. A PR that changes behaviour but leaves the relevant `CLAUDE.md` stale is not done.

## What this is

Hireling is deposit-backed trust for Gno.land, with AI agents as the first use case. Agents (and humans) lock GNOT; others vouch with their own GNOT; the result is a public trust score any realm can check in one line (`hireling.IsTrusted(addr, min)`). Vouched agents can be hired through escrow, and a council settles disputes by slashing the agent's stake.

Built for the Gnome Tavern Hackathon by Gno.land (DoraHacks). Submission deadline: **18 Dec 2026 01:00 UTC**.

- Product spec: [`docs/PRD-Hireling.md`](docs/PRD-Hireling.md). It is the source of truth for behaviour, parameters and priorities.
- Public interface (frozen): [`docs/interface.md`](docs/interface.md).
- Gno reference for this team: [`docs/gno-notes.md`](docs/gno-notes.md).
- Plans: `docs/superpowers/plans/` (one per workstream, written with the `superpowers:writing-plans` skill).

## Layout

| Folder | What | Owner |
|---|---|---|
| `sc/p/hireling` | Pure Gno package: parameters (constants), trust-score math, share accounting, fee split | Ancung |
| `sc/r/hireling` | Main realm: registry, stake, jobs, disputes, council, Trust API, `Render` | Ancung |
| `sc/r/tavernboard` | Demo consumer realm: a board that only trusted addresses can post to | Wikan |
| `sc/**/*_filetest.gno` | Adversarial filetests from PRD §10, written against `docs/interface.md` | Wikan |
| `engine` | AI agent runner (TypeScript, bun): watches jobs, calls an LLM, delivers results | Wikan |
| `apps/fe` | Web app: fallback UI for paid actions and the landing page (Next.js, bun) | Dilly |
| `design` | Pencil design file `hireling.pen` (pen.dev): web app, landing, Guild Hall / SVG look | Dilly |
| `scripts` | Setup, deploy and seed scripts for testnet | Wikan |
| `docs` | PRD, interface, Gno notes, plans | Ancung |

## Network

- **Testnet only** during the hackathon: Onyx, chain id `onyx-1`, RPC `https://rpc.onyx.testnets.gno.land:443`, gnoweb `https://latest.testnets.gno.land`, faucet `https://faucet.gno.land`.
- Namespace: `gno.land/{p,r}/<deployer-g1-address>/...`. There is **one team deployer key**, held by Ancung. Nobody else deploys to the team namespace.
- Deployed packages and addresses: recorded in `sc/CLAUDE.md` once they exist.

## Decided stack

| Area | Choice |
|---|---|
| Smart contracts | Gno (`gno`, `gnokey`, `gnodev`), version pinned to the Onyx chain version (see `sc/CLAUDE.md`) |
| Dev OS | WSL Ubuntu for everyone (the Gno installer does not support native Windows) |
| Off-chain language | TypeScript, **bun** (never npm, yarn or pnpm) |
| Web | Next.js App Router, per the repo skill `frontend-starter-kit`, with the overrides in `apps/fe/CLAUDE.md` |
| Wallet | Adena |
| Storage | **Everything on-chain.** No backend, no database, no IPFS. Job brief ≤ 2 KB, result ≤ 4 KB, dispute evidence ≤ 2 KB |
| Design | pen.dev (`design/hireling.pen`), via the `pencil-design` skill |

## Required skills

Check at the start of every session that these are available. If one is missing, stop and tell the user how to install it.

- `frontend-starter-kit` and `motion-rules`: committed in `.claude/skills/`, available automatically in this repo.
- `pencil-design`: needed by anyone touching `design/`. Requires the pen.dev app and its MCP server.
- `superpowers` plugin: for `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`.

## Rules (non-negotiable)

1. **Everything in the repo and on GitHub is in English**: code, comments, docs, commit messages, issues, PRs, review comments. No other language, ever.
2. **Stop and ask instead of guessing.** If a spec is ambiguous, a test fails twice, a Gno API differs from the notes, or the task would touch another owner's folder, stop. Write the question as a comment on the issue or PR (`gh issue comment` / `gh pr comment`) with what you saw, what you tried and the options. Do not change scope, design or interface on your own.
3. **The interface is frozen.** `docs/interface.md` changes only through an issue labelled `interface-change`, approved by Ancung, in its own PR.
4. **Stay in your folder.** `CODEOWNERS` lists the owner of each path. Changes outside your folder go through an issue first.
5. **Design before frontend code.** No screen is built in `apps/fe` before its design is merged in `design/`.
6. **Use evidence, not assumptions.** "Works", "safe" or "done" must be backed by test output, a transaction hash or a log seen in this session; otherwise write "not proven yet".
7. **Verify Gno facts** against `docs/gno-notes.md`, docs.gno.land and the gnolang/gno source. Docs describe `master`, which can be ahead of the chain: confirm a package is deployed on Onyx before importing it.
8. **Secrets never enter git.** Keys, mnemonics and `.env` files stay local. Each folder keeps a `.env.example` with names only.
9. **No push to `main`.** Every change lands through a PR with at least one approval. PRs touching `sc/` need Ancung's approval.

## Workflow

1. Every piece of work starts from a GitHub issue with acceptance criteria. No issue, no work.
2. Branch: `feat/<issue-number>-<short-slug>` (or `fix/`, `test/`, `docs/`, `chore/`).
3. Open a PR early as a draft; write `Closes #<n>` in its description.
4. Questions and decisions live in issue and PR comments, so the next session (human or agent) can find them.
5. Before marking a PR ready: the folder's tests pass locally and the output is pasted in the PR.

## Commits

- Small commits, one logical step each (refactor, then feature, then tests, then docs). Each commit builds and passes its tests.
- Conventional prefixes with a scope: `feat(sc): …`, `test(sc): …`, `feat(engine): …`, `feat(fe): …`, `docs: …`, `chore: …`.
- The body says why, and which tests ran with their results.

## Hackathon submission rules (summary)

- Live testnet deployment link, public repo, a real Gno component, README, demo video, short description.
- The project name must not start with "Gno" or use official Gno.land branding.
- The root `README.md` must say what it is, the problem, and "do X, see Y" steps. No marketing.
- A human builds and approves the submission; agents never submit or invent names, accounts or emails.
