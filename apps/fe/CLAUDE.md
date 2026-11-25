# CLAUDE.md: apps/fe/

The web app: the landing page plus a small UI for paid actions (Register, Vouch, CreateJob, OpenDispute) if gnoweb TxLinks cannot attach `-send` (PRD OQ-9). Owner: Dilly. Root rules in `/CLAUDE.md` also apply.

**Update this file in the same PR whenever you change commands, env vars, routes or the data layer.**

## Before writing code

1. Use the repo skill `frontend-starter-kit` (in `.claude/skills/`) for every change here.
2. **Design first.** A screen is built only after its design is merged in `/design/hireling.pen`. Link the design frame in the PR.
3. Whether the paid-action UI is needed depends on OQ-9 (checked in week 0). Until then, build the landing page only.

## Overrides to `frontend-starter-kit`

This project wins over the skill wherever they disagree:

- **Package manager: bun.**
- **No REST backend.** The skill's data layer (axios → api function → hook) becomes: `lib/gnoClient.ts` (one Gno RPC client, the equivalent of `apiClient.ts`) → module api functions calling read functions through `vm/qeval` (`ProfileJSON`, `JobJSON`, `TrustScore`, …) → TanStack Query hooks. Writes go through the **Adena** wallet. There is no axios and no mock mode.
- **UI language: English. Locale `en-US`, time zone `UTC`.** Amounts are shown in GNOT (1 GNOT = 1,000,000 ugnot) through `lib/format.ts`.
- The interface it reads is `/docs/interface.md`. A missing read function means an `interface-change` issue, not a workaround.

## Env vars (`apps/fe/.env.local`, never committed; names in `.env.example`)

`NEXT_PUBLIC_GNO_RPC_URL`, `NEXT_PUBLIC_GNO_CHAIN_ID`, `NEXT_PUBLIC_HIRELING_REALM`.

## Commands

To be filled when the app is scaffolded (`bun install`, `bun dev`, `bun test`, `bun run build`).
