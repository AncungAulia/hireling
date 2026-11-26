# Workstream #6 (design, then web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver issue #6: the design in `design/hireling.pen` (landing page, the look of the gnoweb pages and the Guild Hall trust-graph SVG, and the paid-action screens if OQ-9 needs them), then the web app in `apps/fe` (landing page first, then the paid-action screens if needed). Every screen is checked at 390, 834 and 1440 px.

**Architecture:** Design comes first and is merged before its screen is coded (root rule 5). The web app is a static Next.js export (`output: "export"`) with no backend. Reads go `lib/gnoClient.ts` → module api functions (`vm/qeval` on `ProfileJSON`, `JobJSON`, `TrustScore`, `p/` constants) → TanStack Query hooks. Writes go through the Adena wallet only. The Guild Hall SVG is a design hand-off (`design/guild-hall-svg.md` plus a sample SVG); Ancung implements it in `sc/r/hireling/render.gno`.

**Tech Stack:** pen.dev with the `pencil-design` skill; Next.js App Router, TypeScript strict, shadcn/ui, Tailwind, TanStack Query, react-hook-form + zod, Vitest + Testing Library (per `frontend-starter-kit`); **bun**; Adena wallet; Gno JS client chosen in #3 (candidate `@gnolang/gno-js-client`), or plain JSON-RPC `abci_query` if #3 rejects it.

**Spec:** `docs/PRD-Hireling.md` (§1, §5, §6.1, §7 F1–F5, §9.4, §9.7, FR-12, FR-13, FR-16, OQ-9), `docs/interface.md` (frozen), `apps/fe/CLAUDE.md`, `design/CLAUDE.md`, `.claude/skills/frontend-starter-kit/`. Issue: #6.

## Dependencies and order

| Task | Can start | Blocked by | Target date |
|---|---|---|---|
| D1 Foundations (tokens, components) | **now** | `pencil-design` skill available | 30 Nov |
| D2 gnoweb look + Guild Hall SVG hand-off | after D1 | — (reads `p/nt/svg/v0` on Onyx) | 3 Dec |
| D3 Landing page design | after D1 | — | 5 Dec |
| W1 Scaffold, tokens, format, env | after D1 merged | — | 6 Dec |
| W2 Gno read layer | after W1 | #3 JS-client result (falls back to raw JSON-RPC) | 8 Dec |
| W3 Landing page | after D3 merged, W2 | — | 10 Dec |
| D4 Paid-action screens design | only if OQ-9 = "TxLink cannot send" | #3 OQ-9 | 11 Dec |
| W4 Wallet module (Adena) | after D4 merged | #3 OQ-9 | 12 Dec |
| W5 Paid-action screens | after W4 | D4 | 15 Dec |
| W6 Final width, theme and state pass; docs | last | — | 15 Dec (freeze is 16 Dec) |

Ancung starts the Guild Hall SVG in week 3 (11–15 Dec), so D2 lands first among the design tasks that other people wait on.

If OQ-9 shows TxLinks *can* attach `-send`, D4, W4 and W5 are dropped and recorded as such in #6. The landing page still ships.

## Global Constraints

- Everything in the repo, the UI and on GitHub is English. Locale `en-US`, time zone `UTC` (`apps/fe/CLAUDE.md`).
- **bun only**; never npm, yarn or pnpm. Unit tests run with `bun run test` (Vitest), not `bun test` (bun's own runner).
- No backend, no database, no IPFS, no axios, no mock mode. Static export only: no route handlers, no server actions, no `next/image` optimisation.
- Network: Onyx, chain id `onyx-1`, RPC `https://rpc.onyx.testnets.gno.land:443`, gnoweb `https://latest.testnets.gno.land`. Env vars: `NEXT_PUBLIC_GNO_RPC_URL`, `NEXT_PUBLIC_GNO_CHAIN_ID`, `NEXT_PUBLIC_HIRELING_REALM`.
- Interface is frozen (`docs/interface.md`). A missing read function means an `interface-change` issue, never a workaround.
- Amounts: `int64` ugnot on chain, `bigint` in the app, shown in GNOT (1 GNOT = 1,000,000 ugnot) only through `lib/format.ts`. No float math on amounts.
- Parameter values are read from the `p/<ns>/hireling` constants at runtime, never hard-coded, because testnet and mainnet values differ (PRD §5).
- Text limits are bytes: brief ≤ 2 KB (`MaxBrief`), evidence ≤ 2 KB (`MaxEvidence`), result ≤ 4 KB (`MaxResult`), name ≤ 32 (`MaxName`), desc ≤ 280 (`MaxDesc`).
- Every screen: light and dark, checked at 390, 834 and 1440 px with no horizontal scroll, 44 px touch targets (`frontend-starter-kit` §5).
- Design PRs include PNG exports of every changed frame in `design/exports/`. `.pen` files are touched only through the pen.dev MCP tools, never read or edited as text.
- User text is never rendered as HTML or links (PRD §5.2 #21). The shortened address always appears next to a name.
- The UI always says that briefs, results and evidence are public (PRD §5.2 #9), that this is testnet only, and that the demo council is the team (PRD §11).
- No marketing copy: say what it is, the problem, and "do X, see Y". The name never starts with "Gno" and uses no official Gno.land branding.
- Stay in folder: `design/`, `apps/fe/`. Anything else (`sc/`, `docs/`, root `README.md`) goes through an issue first.
- Branches `feat/6-…`, `docs/6-…`. PRs say `Part of #6`; only the last one says `Closes #6`.

## Review Focus

1. **GNOT amount entry.** People type `0.1`, `1,5`, `1.0000001`, ` 2 `, `-1`, `1e3` or nothing. `0.1` must become exactly `100000n` ugnot. More than 6 decimals, negatives, exponents and empty input must be rejected under the field, never rounded silently. Pinned by `parseGnot` tests in W1.
2. **Multibyte text at the limit.** A brief of 700 emoji is under 2048 characters but over 2048 bytes. The realm counts bytes, so the counter and the schema must count UTF-8 bytes and block submit at `MaxBrief + 1` bytes. Pinned by `briefSchema rejects MaxBrief+1 bytes of multibyte text` in W5.
3. **Wallet not ready.** Adena is not installed, is locked, is on another chain, or the person rejects the signature. The app must never send to a chain other than `NEXT_PUBLIC_GNO_CHAIN_ID`, and each case gets its own message. Pinned by the `useWallet` state tests in W4.
4. **Realm panic shown to the person.** A tx fails with `hireling: price below minimum`. The person sees `Price below minimum.`, not a stack trace or a generic error. Pinned by `mapTxError` tests in W4.
5. **Address with no profile.** Someone looks up or vouches for a valid `g1…` address that never registered. What `ProfileJSON` returns for it is not in the interface (empty string, `{}` or a panic). All three must show the "not registered" state, not the error state. Pinned by `getProfile treats empty, {} and panic as not registered` in W2; the real behaviour is asked of Ancung in the plan PR.

---

## Design tasks

Design tasks have no unit tests. Their check is: every frame exists in light and dark at the listed widths, the PNG exports are in the PR, text contrast is measured, and Ancung (D2) or a reviewer approves. Before each design task, load the `pencil-design` skill and open `design/hireling.pen` through the pen.dev MCP server.

### Task D1: Foundations

**Files:**
- Create: `design/hireling.pen` (pages `Foundations`, `Components`)
- Create: `design/tokens.css`
- Create: `design/exports/foundations-light.png`, `foundations-dark.png`, `components-light.png`, `components-dark.png`
- Modify: `design/CLAUDE.md` (page list, token export step)

**Interfaces:**
- Produces: `design/tokens.css` with CSS custom properties under `:root` (light) and `.dark` (dark), named to match shadcn: `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, plus Hireling-specific `--score-high`, `--score-mid`, `--score-low`, `--stake`, `--slash`. W1 copies this file into the app.

- [ ] **Step 1: Define the look.** Guild / tavern theme (PRD §2.1 "User appeal"): warm, readable, not a game skin. Pick one display font and one text font from Google Fonts (`next/font` can load them), and one monospace for addresses and amounts.
- [ ] **Step 2: Define the variables** in the `.pen` file for every token listed above, in both themes. Body text on `--background` and `--card` must reach WCAG AA (4.5:1); large text and icons 3:1.
- [ ] **Step 3: Build the components** used by D2–D4: Button (primary, secondary, ghost, destructive; default, hover, pressed, disabled, loading), Input, Textarea with byte counter, Amount input with `GNOT` suffix, Address chip (`g1abcd…wxyz` + copy), Score badge (score number, colour from `--score-*`), Status badge (`pending|active|inactive|banned`, job statuses), Card, Alert (info, warning for "public on chain", error), Skeleton, Empty state, Error state with retry.
- [ ] **Step 4: Export** `design/tokens.css` from the variables, and the four PNGs.
- [ ] **Step 5: Verify.** Measure contrast for every text/background pair in both themes and paste the numbers in the PR. Expected: all body pairs ≥ 4.5:1.
- [ ] **Step 6: Commit and open the PR** (`feat(design): foundations and components`).

### Task D2: gnoweb look and Guild Hall SVG hand-off

gnoweb styles the page itself, so "the look of the gnoweb pages" means the Markdown structure each `Render` route returns, plus the SVG, which Hireling fully controls.

**Files:**
- Modify: `design/hireling.pen` (page `gnoweb`)
- Create: `design/guild-hall-svg.md` (spec for Ancung)
- Create: `design/guild-hall-sample.svg`, `design/guild-hall-sample-empty.svg`, `design/guild-hall-sample-banned.svg`
- Create: `design/exports/gnoweb-*-light.png`, `gnoweb-*-dark.png` (one pair per route)

**Interfaces:**
- Consumes: Render routes `""`, `agent/<addr>`, `job/<id>`, `dispute/<id>`, `voucher/<addr>`, `council`, `treasury` and their content from PRD §9.4.
- Produces: `design/guild-hall-svg.md`, the contract Ancung implements in `render.gno`.

- [ ] **Step 1: Check what gnoweb on Onyx renders.** Read `p/nt/svg/v0` on Onyx (`gnokey query vm/qfile -data gno.land/p/nt/svg/v0 -remote $RPC`) and list the elements and attributes it can emit. Render a throwaway Markdown sample in `gnodev` against the Onyx version (Ancung's pin in `sc/CLAUDE.md`) to see which extensions work (tables, columns, alerts, `data:` SVG images). Record both lists at the top of `guild-hall-svg.md`. Use nothing outside them.
- [ ] **Step 2: Design one frame per route**, as it will look inside gnoweb's chrome in light and dark: section order, headings, tables, where the TxLink buttons and the "public on chain" and "demo council is the team" notes go. The agent profile shows the SVG, the score breakdown (total, N, bonus, strikes), vouchers, job history, owner history, capacity left, and the full address next to the name (PRD §9.4).
- [ ] **Step 3: Write `guild-hall-svg.md`** with these decisions pinned:
  - Canvas `640 × 400` viewBox, scales to width. Own background `rect` with rounded corners and fixed hex colours that read on both gnoweb themes. The SVG does not depend on the page theme.
  - Agent node in the centre (radius 40, score inside). Vouchers on a circle around it, ordered by active stake, largest at 12 o'clock and going clockwise.
  - At most **12** voucher nodes. The rest are one node `+N more`. Voucher count is unlimited (PRD §5), so the SVG must stay bounded.
  - Line width `1 + 7 × sqrt(stake / maxStake)` px, rounded to an integer (Ancung can use `ISqrt` from `p/` on scaled integers).
  - Line style: active vouch solid; warm-up vouch dashed; unbonding faded at 40 % opacity.
  - Labels: shortened address (`g1` + 4 … last 4) under each node; the agent name only in the page Markdown, not in the SVG, so no user text goes into SVG markup.
  - Banned agent: grey node with a red ring and a strike count; inactive agent: grey node.
  - Empty state (no vouchers): agent node alone and the text "No vouchers yet".
  - System font stack only (an SVG in an `img` cannot load web fonts).
  - Size budget: ≤ 8 KB for the 12-voucher case, so the `data:` URI stays small.
- [ ] **Step 4: Hand-draw the three sample SVGs** that follow the spec (12 + "more", empty, banned).
- [ ] **Step 5: Verify.** Open each sample SVG in a browser over a white and a black page, and paste the byte sizes in the PR. Expected: readable on both, each ≤ 8 KB. Export the PNGs.
- [ ] **Step 6: Commit and open the PR** (`feat(design): gnoweb look and Guild Hall SVG spec`) with Ancung as reviewer, because he implements it.

### Task D3: Landing page

**Files:**
- Modify: `design/hireling.pen` (page `Landing`, frames at 390, 834, 1440, each light and dark)
- Create: `design/exports/landing-{390,834,1440}-{light,dark}.png`

**Interfaces:**
- Produces: the landing copy and section order W3 builds. The copy is final in the design; W3 does not rewrite it.

- [ ] **Step 1: Lay out the sections**, in this order:
  1. Header: name, links "Guild Hall" (gnoweb realm URL), "Source" (GitHub repo), theme toggle.
  2. Hero: the one-liner "Deposit-backed trust for Gno. Start with AI agents someone has put money behind." (PRD §1), a one-sentence problem (PRD §1.1), and two actions: "Open the Guild Hall" and "Check a trust score".
  3. How it works: four steps, Stake, Vouch, Hire, Dispute, one sentence each (PRD §1.2).
  4. Trust score: the formula and the five-row example table from PRD §6.1.
  5. For realm developers: the one-line `IsTrusted` snippet from PRD §7 F5 with a copy button, and a link to `tavernboard`.
  6. Check a trust score: address field → score badge, status, total stake, voucher count, link to the agent's gnoweb page. States: idle, loading, found, not registered, invalid address, chain error.
  7. Honest notes: testnet only, the demo council is the team, briefs and results are public on chain.
  8. Footer: repo, realm, licence.
- [ ] **Step 2: Design all states of section 6** and the mobile header.
- [ ] **Step 3: Verify.** Every frame exists at the three widths in both themes; no text below 16 px on mobile; touch targets ≥ 44 px. Export the PNGs.
- [ ] **Step 4: Commit and open the PR** (`feat(design): landing page`).

### Task D4: Paid-action screens (only if OQ-9 needs them)

**Files:**
- Modify: `design/hireling.pen` (page `Actions`)
- Create: `design/exports/action-{register,vouch,hire,dispute}-{390,834,1440}-{light,dark}.png`

**Interfaces:**
- Consumes: `RegisterAgent`, `RegisterMember`, `Vouch`, `CreateJob`, `OpenDispute` from `docs/interface.md`; the fields of `ProfileJSON` and `JobJSON`.
- Produces: the screens and copy W5 builds.

- [ ] **Step 1: Design the shared wallet bar**: not installed (link to Adena), locked, wrong network (shows the expected chain id), connected (address chip), awaiting signature, submitted (tx hash and link to the gnoweb page).
- [ ] **Step 2: Design four screens**, each with its form, every field error, the pending and success states, and a confirm step that shows the amount in GNOT before signing:
  - **Register**: tabs Agent / Member. Agent: agent address, name (≤ `MaxName`), description (≤ `MaxDesc`), tags (comma-separated), self-stake ≥ shown minimum; a note that the agent key must then call `AcceptRegistration`. Member: name, description, self-stake.
  - **Vouch**: target summary from `ProfileJSON` (name, address, score, status), amount ≥ `MinVouch`, notes "counts after 3 days", "10 % of your stake is slashed if the agent is found guilty", "unbonding takes 7 days".
  - **Hire** (`CreateJob`): agent summary with capacity left, price ≥ `MinJobPrice` and ≤ capacity left, brief with a byte counter and an acceptance-criteria hint (PRD §5.2 #8), deadline days (default `DefaultDeadline`, max `MaxDeadline`), the "public on chain" warning.
  - **Dispute** (`OpenDispute`): job summary from `JobJSON`, time left until `T`, evidence with a byte counter, the deposit amount, closed state when `now ≥ T` or the caller is not the hirer.
- [ ] **Step 3: Verify** as in D3 and export the PNGs.
- [ ] **Step 4: Commit and open the PR** (`feat(design): paid-action screens`).

---

## Web tasks

All web tasks follow `frontend-starter-kit` with the overrides in `apps/fe/CLAUDE.md`. Commands run from `apps/fe/`. "Verify" always means `bun run typecheck && bun run lint && bun run test && bun run build` passes, with the output pasted in the PR.

### Task W1: Scaffold, tokens, format, env

**Files:**
- Create: the Next.js app in `apps/fe/` (Scaffold mode, `references/stack.md`), `next.config.ts` with `output: "export"`
- Create: `apps/fe/docs/ui-profile.md` (kept in `apps/fe/`, not `docs/`, because `docs/` is Ancung's folder)
- Create: `apps/fe/src/app/tokens.css` (copy of `design/tokens.css`), imported from `globals.css`
- Create: `apps/fe/src/lib/format.ts`, `apps/fe/src/lib/env.ts`
- Test: `apps/fe/src/lib/format.test.ts`, `apps/fe/src/lib/env.test.ts`, `apps/fe/src/app/tokens.test.ts`
- Modify: `apps/fe/CLAUDE.md` (Commands, ui-profile location), `apps/fe/.env.example` if names change

**Interfaces:**
- Produces:
  - `formatGnot(ugnot: bigint): string`: `1_500_000n` → `"1.5 GNOT"`, `100_000n` → `"0.1 GNOT"`, `0n` → `"0 GNOT"`, `1_234_000_000n` → `"1,234 GNOT"`.
  - `parseGnot(input: string): bigint | null`: string parsing, no floats.
  - `formatAddress(addr: string): string`: `g1` + 4 … last 4.
  - `formatDate(unixSeconds: number): string` in `UTC`, `en-US`.
  - `env: { rpcUrl: string; chainId: string; realmPath: string; pkgPath: string }` from `env.ts`, zod-validated. `pkgPath` is derived: `realmPath` with `/r/` replaced by `/p/`.

- [ ] **Step 1: Scaffold** with `bunx create-next-app@latest` and `bunx shadcn@latest`, per `references/stack.md`, minus axios. Add scripts `typecheck`, `lint`, `test` (Vitest), `build`. Fill `ui-profile.md`: language English, theme light and dark, number `en-US`, currency `1.5 GNOT`, time zone `UTC`, glossary (Vouch, Self-stake, Trust score, Hire, Dispute, Guild Hall), design source `design/hireling.pen`, backend messages safe to show: only `hireling: ` panics, through `mapTxError` (W4).
- [ ] **Step 2: Write the failing tests.**

```ts
// format.test.ts
expect(parseGnot("0.1")).toBe(100_000n);
expect(parseGnot("1")).toBe(1_000_000n);
expect(parseGnot(" 2 ")).toBe(2_000_000n);
expect(parseGnot("1.000001")).toBe(1_000_001n);
for (const bad of ["", "1.0000001", "-1", "1e3", "1,5", "abc", ".", "1."]) expect(parseGnot(bad)).toBeNull();
expect(formatGnot(1_500_000n)).toBe("1.5 GNOT");
expect(formatGnot(1_234_000_000n)).toBe("1,234 GNOT");
expect(formatAddress("g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5")).toBe("g1jg8m…sqf5");
expect(formatDate(0)).toBe("Jan 1, 1970, 12:00 AM UTC");
// env.test.ts: missing NEXT_PUBLIC_GNO_RPC_URL throws; realmPath gno.land/r/g1x/hireling -> pkgPath gno.land/p/g1x/hireling
// tokens.test.ts: src/app/tokens.css is byte-identical to ../../design/tokens.css
```

- [ ] **Step 3: Run** `bun run test`. Expected: FAIL, functions not defined.
- [ ] **Step 4: Implement** `format.ts` and `env.ts`. `parseGnot` accepts `^\d+(\.\d{1,6})?$` after trimming, then builds the bigint from the integer and padded fraction parts.
- [ ] **Step 5: Verify** (full command above). Expected: all pass; `out/` is produced.
- [ ] **Step 6: Commit** (`feat(fe): scaffold app with tokens, format and env`).

### Task W2: Gno read layer

**Files:**
- Create: `apps/fe/src/lib/gnoClient.ts`, `apps/fe/src/lib/qeval.ts`
- Create: `apps/fe/src/modules/params/` (`api/params.api.ts`, `api/params.keys.ts`, `api/useParams.ts`, `schemas/params.schema.ts`, `index.ts`)
- Create: `apps/fe/src/modules/profiles/` (`api/profiles.api.ts`, `api/profiles.keys.ts`, `api/useProfile.ts`, `schemas/profile.schema.ts`, `index.ts`)
- Create: `apps/fe/src/modules/jobs/` (`api/jobs.api.ts`, `api/jobs.keys.ts`, `api/useJob.ts`, `schemas/job.schema.ts`, `index.ts`)
- Test: `apps/fe/src/lib/qeval.test.ts`, `apps/fe/src/modules/profiles/api/profiles.api.test.ts`, `apps/fe/src/modules/jobs/api/jobs.api.test.ts`
- Test fixtures: `apps/fe/src/lib/__fixtures__/` (copied from `engine/test/fixtures/qeval-*.txt`, plus int64, bool and panic captures from Onyx)

**Interfaces:**
- Consumes: `env` from W1.
- Produces:
  - `qeval(pkgPath: string, expr: string): Promise<string>`: raw result; throws `GnoError { kind: "network" | "panic" | "format"; message: string }`.
  - `parseQevalString(raw: string): string`, `parseQevalInt(raw: string): bigint`, `parseQevalBool(raw: string): boolean`. String rules match `engine/src/qeval.ts` (Go `%q`, hex and octal escapes decoded as UTF-8 bytes). Ported, not imported: `apps/fe` and `engine` are separate packages.
  - `getParams(): Promise<Params>`; `Params` = `{ minSelfStake, minVouch, minJobPrice, minDisputeDeposit: bigint; disputeDepositBps, disputeWindow, defaultDeadline, maxDeadline, maxBrief, maxEvidence, maxName, maxDesc: number }`; `useParams()` with `staleTime: Infinity` (constants never change).
  - `getProfile(addr: string): Promise<Profile | null>`; `null` means not registered. `Profile` is `z.infer` of the `ProfileJSON` fields in `docs/interface.md`, with stakes as `bigint`. `useProfile(addr)`.
  - `getJob(id: bigint): Promise<Job | null>`; `Job` from the `JobJSON` fields. `useJob(id)`.
  - `isGnoAddress(s: string): boolean`: `^g1[02-9ac-hj-np-z]{38}$`.

- [ ] **Step 1: Capture fixtures from Onyx** (`gnokey query vm/qeval -remote $RPC`) for a string, an `int64`, a `bool` and a panic, on any deployed realm. If `#3` picked a JS client, capture through it instead. Check that `vm/qeval` works on a `/p/` constant (`gno.land/p/<ns>/hireling.MinVouch`). If it does not, stop and open an `interface-change` issue for a read function that returns the parameters (root rule 2).
- [ ] **Step 2: Write the failing tests.**

```ts
// qeval.test.ts: every engine fixture gives the same string the engine test expects
expect(parseQevalInt("(42 int64)")).toBe(42n);
expect(parseQevalBool("(true bool)")).toBe(true);
expect(() => parseQevalInt('("x" string)')).toThrow(/format/);
// profiles.api.test.ts (qeval mocked)
// getProfile treats empty, {} and panic as not registered
for (const reply of ['("" string)', '("{}" string)', PANIC_FIXTURE]) expect(await getProfile(ADDR)).toBeNull();
// getProfile parses a full ProfileJSON into bigint stakes
expect((await getProfile(ADDR))?.selfStake).toBe(10_000_000n);
// a network failure is an error, not "not registered"
await expect(getProfile(ADDR)).rejects.toMatchObject({ kind: "network" });
// jobs.api.test.ts: same three cases for getJob
```

- [ ] **Step 3: Run** `bun run test`. Expected: FAIL.
- [ ] **Step 4: Implement** `gnoClient.ts` with the #3 client, or with `fetch` to `abci_query` (path `vm/qeval`, data base64 of `<pkgPath>.<expr>`). A failed query still returns HTTP 200, so check `response.ResponseBase.Error` (`docs/gno-notes.md` §8). Then the parsers and the three modules.
- [ ] **Step 5: Verify.** Full command, plus one live call: `getProfile` on a registered address on Onyx returns a profile (paste it in the PR). If nothing is registered yet, write "live read not proven yet".
- [ ] **Step 6: Commit** (`feat(fe): Gno read layer over vm/qeval`).

### Task W3: Landing page

**Files:**
- Create: `apps/fe/src/app/page.tsx` (thin), `apps/fe/src/app/layout.tsx` metadata
- Create: `apps/fe/src/modules/landing/components/` (`Hero.tsx`, `HowItWorks.tsx`, `ScoreFormula.tsx`, `IntegrateSnippet.tsx`, `HonestNotes.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`), `apps/fe/src/modules/landing/index.ts`
- Create: `apps/fe/src/modules/profiles/components/TrustLookup.tsx`
- Test: `apps/fe/src/modules/profiles/components/TrustLookup.test.tsx`

**Interfaces:**
- Consumes: `useProfile`, `isGnoAddress` (W2); `formatGnot`, `formatAddress` (W1); the copy and layout from D3.
- Produces: the `/` route. The lookup address lives in the URL (`/?addr=g1…`) per the starter-kit state rule, so a lookup can be shared.

- [ ] **Step 1: Write the failing tests** for `TrustLookup` (profiles api mocked, fresh `QueryClient` per test):

```tsx
// invalid address shows the field error and sends no query
await user.type(screen.getByLabelText("Address"), "g1nope"); await user.tab();
expect(screen.getByText("Enter a valid g1 address.")).toBeInTheDocument();
expect(getProfile).not.toHaveBeenCalled();
// found: score, status and total stake
expect(await screen.findByText("240")).toBeInTheDocument();
expect(screen.getByText("400 GNOT")).toBeInTheDocument();
// not registered (getProfile -> null) shows the empty state, not the error state
expect(await screen.findByText("This address has no Hireling profile.")).toBeInTheDocument();
// network error shows ErrorState with a retry button that refetches
await user.click(await screen.findByRole("button", { name: "Try again" }));
expect(getProfile).toHaveBeenCalledTimes(2);
```

(Copy strings come from D3; replace these if D3 words them differently.)

- [ ] **Step 2: Run** `bun run test`. Expected: FAIL.
- [ ] **Step 3: Implement** the sections and `TrustLookup` from the D3 frames. `TrustLookup` uses `useSearchParams`, so it sits inside `<Suspense>`. Links to gnoweb are built from `env` (`https://latest.testnets.gno.land/r/…:agent/<addr>`).
- [ ] **Step 4: Verify.** Full command. Then open `bun run dev` in Chrome: every lookup state seen, at 390, 834 and 1440 px, light and dark, no horizontal scroll, no hydration warning in the console. Compare with the D3 PNGs and list differences in the PR.
- [ ] **Step 5: Commit** (`feat(fe): landing page with trust score lookup`). Ask in the PR where the site is hosted (see the questions in the plan PR); deploying is not part of this task.

### Task W4: Wallet module (only if OQ-9 needs it)

**Files:**
- Create: `apps/fe/src/modules/wallet/` (`adena.ts`, `useWallet.ts`, `useCallMutation.ts`, `mapTxError.ts`, `components/WalletBar.tsx`, `index.ts`)
- Test: `apps/fe/src/modules/wallet/mapTxError.test.ts`, `apps/fe/src/modules/wallet/useWallet.test.tsx`

**Interfaces:**
- Consumes: `env` (W1).
- Produces:
  - `type WalletState = { status: "missing" } | { status: "locked" } | { status: "disconnected" } | { status: "wrongNetwork"; chainId: string } | { status: "ready"; address: string }`; `useWallet(): { state: WalletState; connect(): Promise<void> }`.
  - `useCallMutation()` → mutation taking `{ func: string; args: string[]; sendUgnot: bigint }`, returning `{ txHash: string }`. It refuses to run unless `state.status === "ready"`.
  - `mapTxError(raw: string): string`: `"…hireling: price below minimum…"` → `"Price below minimum."`; person rejected → `"You cancelled the signature."`; anything else → `"The transaction failed. Nothing was sent."`.

- [ ] **Step 1: Check the Adena API** against Adena's current docs and write what you found at the top of `adena.ts`: detection (`window.adena`), `AddEstablish`, `GetAccount` (address and chain id), `SwitchNetwork`, and `DoContract` with a `/vm.m_call` message (`caller`, `send` as `"<n>ugnot"`, `pkg_path`, `func`, `args`). Measure the gas of one real `Vouch` on Onyx with `gnokey` and pin `gasWanted` from it (+ 20 % margin), with the tx hash in the PR.
- [ ] **Step 2: Write the failing tests.**

```ts
expect(mapTxError("... panic: hireling: price below minimum ...")).toBe("Price below minimum.");
expect(mapTxError("hireling: trust score too low")).toBe("Trust score too low.");
expect(mapTxError("rejected by user")).toBe("You cancelled the signature.");
expect(mapTxError("something else")).toBe("The transaction failed. Nothing was sent.");
// useWallet with window.adena undefined -> missing; GetAccount chainId "test5" -> wrongNetwork("test5");
// useCallMutation while wrongNetwork rejects and DoContract is never called
```

- [ ] **Step 3: Run** `bun run test`. Expected: FAIL.
- [ ] **Step 4: Implement** the module. `adena.ts` is the only file that touches `window.adena`; tests replace it with `vi.mock`. Fill the user-rejection text from the real Adena response captured in Step 1.
- [ ] **Step 5: Verify.** Full command.
- [ ] **Step 6: Commit** (`feat(fe): Adena wallet module`).

### Task W5: Paid-action screens (only if OQ-9 needs them)

**Files:**
- Create routes (thin, query params because the export is static): `apps/fe/src/app/register/page.tsx`, `vouch/page.tsx` (`?agent=`), `hire/page.tsx` (`?agent=`), `dispute/page.tsx` (`?job=`)
- Create: `apps/fe/src/modules/registry/` (`components/RegisterForm.tsx`, `schemas/register.schema.ts`, `index.ts`)
- Create: `apps/fe/src/modules/stake/` (`components/VouchForm.tsx`, `schemas/vouch.schema.ts`, `index.ts`)
- Modify: `apps/fe/src/modules/jobs/` (add `components/HireForm.tsx`, `components/DisputeForm.tsx`, `schemas/hire.schema.ts`, `schemas/dispute.schema.ts`)
- Create: `apps/fe/src/lib/bytes.ts` (`utf8Bytes(s: string): number`)
- Test: one `*.schema.test.ts` and one `*Form.test.tsx` per form

**Interfaces:**
- Consumes: `useParams`, `useProfile`, `useJob`, `isGnoAddress` (W2); `useWallet`, `useCallMutation`, `WalletBar` (W4); `parseGnot`, `formatGnot` (W1); frames and copy from D4.
- Produces: schema factories that take `Params` (the limits come from the chain):
  - `registerAgentSchema(p)`, `registerMemberSchema(p)`, `vouchSchema(p)`, `hireSchema(p, capacityLeft: bigint)`, `disputeSchema(p)`.
  - Calls: `RegisterAgent(agent, name, desc, tags)` / `RegisterMember(name, desc)` / `Vouch(target)` / `CreateJob(agent, brief, deadlineDays)` / `OpenDispute(jobID, evidence)`, each with `sendUgnot`.

- [ ] **Step 1: Write the failing schema tests.**

```ts
// hire.schema.test.ts
const s = hireSchema(params, 5_000_000n);
// briefSchema rejects MaxBrief+1 bytes of multibyte text
expect(s.safeParse({ ...ok, brief: "é".repeat(params.maxBrief / 2) + "a" }).success).toBe(false);
expect(s.safeParse({ ...ok, brief: "é".repeat(params.maxBrief / 2) }).success).toBe(true);
expect(s.safeParse({ ...ok, price: "0.01" }).success).toBe(false);   // below MinJobPrice on the test params
expect(s.safeParse({ ...ok, price: "6" }).success).toBe(false);      // above capacity left
expect(s.safeParse({ ...ok, deadlineDays: params.maxDeadline + 1 }).success).toBe(false);
// register.schema.test.ts: name of MaxName+1 bytes rejected; agent "g1nope" rejected
// vouch.schema.test.ts: amount below MinVouch rejected
// dispute.schema.test.ts: deposit = max(price * DisputeDepositBps / 10000, MinDisputeDeposit)
```

- [ ] **Step 2: Write the failing form tests**, per form (wallet and api mocked):
  - leaving a required field shows its error; invalid input blocks submit;
  - submit opens the confirm step showing the amount in GNOT, and nothing is called until it is accepted;
  - accepting calls `useCallMutation` with the exact `func`, `args` and `sendUgnot`;
  - success shows the tx hash and a link to the gnoweb page;
  - `VouchForm` for a `banned` or unregistered target shows its state and no form;
  - `HireForm` for a `member` or non-`active` profile shows "This profile cannot be hired.";
  - `DisputeForm` is closed when `now ≥ deliveredAt + DisputeWindow`, when the job is not `delivered`, or when the wallet is not the hirer; the time check runs again at submit.
- [ ] **Step 3: Run** `bun run test`. Expected: FAIL.
- [ ] **Step 4: Implement** the schemas, then the forms from the D4 frames, using `NumberInput` with the `GNOT` suffix, the byte counter from `utf8Bytes`, and `ConfirmDialog`. For `RegisterAgent`, show `MinSelfStake` as the minimum and say that owners with a banned agent need more: the interface has no read for the owner's ban count, so the form cannot compute `RequiredSelfStake` (listed as a gap in the PR; open an `interface-change` issue only if Ancung wants the exact number shown).
- [ ] **Step 5: Verify.** Full command. Then one real tx per form on Onyx from a test account, with each tx hash in the PR. Check every state in Chrome at 390, 834 and 1440 px, light and dark.
- [ ] **Step 6: Commit** one form per commit (`feat(fe): register screen`, …).

### Task W6: Final pass and docs

**Files:**
- Modify: `apps/fe/CLAUDE.md` (commands, routes, data layer, client library and version), `design/CLAUDE.md` (pages, exports)

- [ ] **Step 1: Walk every route** in Chrome at 390, 834 and 1440 px, light and dark. Record a GIF of the landing lookup (and of one paid action if built) for the demo video. List anything not checked.
- [ ] **Step 2: Check `bun run build` output** contains no `console.log`, no test fixtures, and works when served from a subpath-less static host (`bunx serve out`).
- [ ] **Step 3: Update both `CLAUDE.md` files** so the next session can run, test and extend the app without this plan.
- [ ] **Step 4: Commit and open the last PR** with `Closes #6`.
