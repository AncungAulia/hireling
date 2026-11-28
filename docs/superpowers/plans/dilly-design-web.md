# Workstream #6 (design, Render, engine, then web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision 2 (28 Nov).** Rewritten after Ancung's review of #14 and the ownership change in #1 / PR #16. Dilly now also owns `sc/r/hireling/render.gno` and `engine/` (continuing from #13). Priorities follow the PRD: Render is P0, the engine P1, the landing page P2.

**Goal:** Deliver, in priority order:

1. **P0, week 1:** the `Render` pages of `r/<ns>/hireling` for FR-06 (Guild Hall home, agent or member profile, voucher profile), escaped and paged, deployed with Wikan's P0 core by 1 Dec.
2. **P1, weeks 2 and 3:** the remaining Render routes, the Guild Hall SVG (FR-12), TxLinks (FR-13), and the AuditBot engine (FR-15) running against Onyx.
3. **P2, cuttable:** the landing page in `apps/fe`, and the paid-action screens only if OQ-9 needs them.

The design for all of it lives in `design/hireling.pen` (PR #15).

**Architecture:**
- `render.gno` is one file in the main realm. It reads the realm state through a small set of unexported accessors that Wikan's registry and stake code provide (agreed in #4, see R0), builds Markdown with `p/moul/md/v0` and `p/moul/mdtable/v0`, escapes every user string with `p/nt/markdown/sanitize/v0`, pages lists with `p/nt/avl/pager/v0`, and draws the Guild Hall with `p/nt/svg/v0`. The Markdown contract is `design/gnoweb-pages.md`; the SVG contract is `design/guild-hall-svg.md`.
- The engine is the #13 core (config, qeval parsing, runner loop) plus a Gno chain adapter, a `vm/qfile` source fetcher and an OpenRouter reviewer with structured output, as decided in #2 and recorded by PR #7.
- The web app is a static Next.js export (`output: "export"`) with no backend. Reads go through `vm/qeval`; writes go through the Adena wallet only.

**Tech Stack:** Gno `v1.8.0-rc.1` (commit `fc79041f4`, the Onyx version, #3) with `gno test` and `gnodev`, in WSL Ubuntu; TypeScript and **bun** for the engine (`bun test`) and the web app (`bun run test`, Vitest); OpenRouter `z-ai/glm-5.3-flash`; Next.js App Router per `frontend-starter-kit`; Adena; pen.dev with the `pencil-design` skill.

**Spec:** `docs/PRD-Hireling.md` (§5, §5.2 #9 and #21, §6.1, §7, §9.4, §9.7, FR-06, FR-12, FR-13, FR-15, FR-16, NFR-02, NFR-06, OQ-9), `docs/interface.md` (frozen), issue #2 and `engine/CLAUDE.md` (LLM decisions), `design/gnoweb-pages.md`, `design/guild-hall-svg.md`, `sc/CLAUDE.md`, `apps/fe/CLAUDE.md`. Issue: #6.

## Dependencies and order

| Task | Priority | Blocked by | Target date |
|---|---|---|---|
| D1 to D3 Brand, foundations, gnoweb look, Guild Hall spec, landing | done in PR #15, review fixes left | Ancung's review of #15 | 30 Nov |
| R0 Render read contract with Wikan | P0 | Wikan's answer in #4 | 29 Nov |
| R1 Render: home, agent, voucher, not found (FR-06) | **P0** | R0; Wikan's registry and stake code | tests 30 Nov, deploy with P0 by **1 Dec** |
| R2 Render: job, dispute, council, treasury | P1 | Ancung's escrow and disputes (#4, week 2) | 10 Dec |
| R3 Guild Hall SVG (FR-12) | P1 | R1 | 8 Dec |
| R4 TxLinks and paid-action links (FR-13) | P1 | OQ-9 (#3); R2 for job and dispute actions | 12 Dec |
| E1 Take over #13 and fix its review | P1 | PR #7 merged first, then #12 and #13 | 6 Dec |
| E2 AuditBot reviewer per #2 | P1 | E1 | 11 Dec |
| E3 Gno chain adapter and live run | P1 | JS client choice (#3); escrow deployed (week 2) | 14 Dec |
| W1 to W3 Landing page in `apps/fe` | P2, cuttable | D3 merged; R1 to R4 and E1 to E3 first | 15 Dec |
| D4, W4, W5 Paid-action screens | P2, only if OQ-9 = "cannot send" | OQ-9 cut-off (below) | 15 Dec |
| W6 Final pass and docs | last | | 15 Dec (freeze 16 Dec) |

**OQ-9 cut-off.** OQ-9 decides whether Vouch, Register, Hire and Open dispute can be TxLinks with `-send`. Wikan is asked in #3 for a date. If there is no answer by **4 Dec**, this plan assumes "cannot send":
- R4 links paid actions to the web app;
- D4, W4 and W5 are built for **Vouch** first, then Hire, Register and Open dispute in that order.

If W5 is not done by 15 Dec, the Render pages show the matching `gnokey maketx call` command instead of a web link, and the screens are dropped and recorded in #6.

**Cut order if time runs out** (last cut first): landing page (W1 to W3), then the paid-action screens beyond Vouch, then R2's council and treasury pages. R1, R3 and the engine are never cut.

## Global Constraints

- Everything in the repo, the UI and on GitHub is English. Locale `en-US`, time zone `UTC`.
- **Stay in folder:** `design/`, `apps/fe/`, `engine/`, and `sc/r/hireling/render.gno` with its own tests (`render_test.gno`, `render_*_filetest.gno`). Every other file in `sc/` (registry, stake, jobs, `p/hireling`) belongs to Wikan or Ancung. If Render needs something there, ask in #4 first (root rule 4).
- **bun only.** The engine uses `bun test` (bun's runner, as set up in #13); the web app uses `bun run test` (Vitest).
- The interface is frozen (`docs/interface.md`). A missing *public* read function means an `interface-change` issue, never a workaround. Render lives inside the realm, so it does not need new public functions; the unexported accessors in R0 are an internal agreement with Wikan, not an interface change.
- Network: Onyx, chain id `onyx-1`, RPC `https://rpc.onyx.testnets.gno.land:443`, gnoweb `https://latest.testnets.gno.land`. Namespace `g1hfywsc0ytpxkyyrkz7dgxnkuuepsm63wae4mrj`. Only Ancung deploys.
- Amounts: `int64` ugnot on chain, shown as GNOT with the unit (`400 GNOT`, `0.1 GNOT`) and no float math. Times in UTC.
- Parameter values come from the `p/<ns>/hireling` constants, never hard-coded, because testnet and mainnet differ (PRD §5). Render prints them from the constants (for example the diversity threshold, testnet 1 GNOT).
- Text limits are bytes: brief ≤ 2 KB (`MaxBrief`), evidence ≤ 2 KB (`MaxEvidence`), result ≤ 4 KB (`MaxResult`), name ≤ 32 (`MaxName`), desc ≤ 280 (`MaxDesc`).
- **User text is never Markdown, a link, an image or HTML** (NFR-06, PRD §5.2 #21). The shortened address always follows a name.
- The UI and the pages say that briefs, results and evidence are public, that this is testnet only, and that the demo council is the team (PRD §11).
- Secrets: the OpenRouter key and the agent mnemonic live only in `engine/.env`. They never appear in an issue, PR, commit, log, test fixture or prompt.
- Web screens: dark is the default theme, every screen also has a light version, checked at 390, 834 and 1440 px with no horizontal scroll and 44 px touch targets.
- Design PRs include exports of every changed frame in `design/exports/`. `.pen` files are touched only through the pen.dev MCP tools.
- No marketing copy. The name never starts with "Gno" and uses no official Gno.land branding.
- Branches `feat/6-…`, `fix/6-…`, `docs/6-…`. PRs say `Part of #6`; only the last one says `Closes #6`. PRs that touch `sc/` need Ancung's approval.

## Review Focus

1. **User text that tries to become Markdown.** A name like `[Approve](javascript:alert(1))`, `![x](https://evil.example/a.png)`, `<img src=x>`, `| a | b |` or a line starting with `#` must show as plain text, and a `|` must not break a table. Pinned by the escaping tests in R1 (`TestRenderEscapesUserText`) and a filetest that registers such a name and renders the page.
2. **Unbounded lists.** A profile can have any number of backers and jobs (PRD §5). Every list on a page is paged at 20 rows, and the SVG draws at most 12 nodes plus "+N". Pinned by `TestRenderPagesBackers` (45 backers give 3 pages) and `TestGuildHallSVGCapsNodes` in R3.
3. **Address with no profile.** `agent/<addr>` for a valid address that never registered shows the "No profile" page, and an invalid address shows "Not a valid address", never a panic. What `ProfileJSON` returns for an unknown address is asked of Wikan in #4 (R0); the web app follows the same answer (W2).
4. **Prompt injection through the brief.** A brief containing `</brief>`, "ignore the instructions above" or a fake JSON findings block must stay data. The brief and the fetched source are sent JSON-encoded inside the user message, never spliced into tags. Pinned by `review() sends the brief JSON-encoded` in E1.
5. **Delivering after the deadline.** The LLM call can take up to 120 s. The runner checks the deadline again after `review()` and does not send `Deliver` if fewer than 60 s are left. Pinned by `skips deliver when review ends past the deadline margin` in E1.
6. **GNOT amount entry and multibyte limits in the web app** (W1, W5), as in revision 1: `0.1` is exactly `100000n`; more than 6 decimals, negatives, exponents and empty input are rejected; byte counters count UTF-8 bytes.

---

## Design tasks

Design check: every frame exists in dark and light at the listed widths, exports are in the PR, text contrast is measured, and a reviewer approves. Load the `pencil-design` skill first.

### Tasks D1 to D3: done in PR #15, review fixes left

PR #15 holds the brand, foundations, the final logo, the landing page at 1440, 834 and 390 in dark and light, the trust-lookup states, the gnoweb frames, `design/gnoweb-pages.md`, `design/guild-hall-svg.md` and the sample SVGs. Ancung approves once his review points are fixed:

- [ ] **Step 1: Copy fixes.** Collateral copy says "each backer loses 10%; the owner loses 2× the job price". The ticker shows the shortened address after every name and says **95 GNOT** slashed to the Treasury (5 GNOT goes to jurors first).
- [ ] **Step 2: Spec fixes.** `gnoweb-pages.md` 3.2 prints the diversity threshold from the constant instead of "5 GNOT or more"; the agent example shows capacity left 100 GNOT; the dispute page says "a majority of non-abstain votes decides". `guild-hall-svg.md` says "floor" instead of "round", mentions the 0.4 opacity on the "+N" edge, and §8 no longer says the gnoweb frames are coming.
- [ ] **Step 3: Sample fix.** `guild-hall-samples.mjs` labels the owner node with the owner's address, not the agent's. Regenerate the three samples and paste their sizes.
- [ ] **Step 4: Tokens.** Export `design/tokens.css` from the `.pen` variables (dark under `:root`, light under `[data-theme="light"]`), which Foundations already refers to.
- [ ] **Step 5: Housekeeping.** "Trust travels" is already in every landing frame; refresh the exports. After PR #8 merges, delete `design/.gitattributes` (the root file has `*.pen binary`).
- [ ] **Step 6: Push, reply to each review point in #15, and mark it ready.**

### Task D4: Paid-action screens (only if OQ-9 needs them)

Unchanged from revision 1, except that the order is **Vouch first**, then Hire, Register and Open dispute, and each screen is designed dark first with its light version.

- Modify: `design/hireling.pen` (page `Actions`); create `design/exports/action-<name>-<width>-<theme>.jpg`.
- [ ] **Step 1:** the shared wallet bar: not installed, locked, wrong network, connected, awaiting signature, submitted.
- [ ] **Step 2:** each screen with its form, field errors, pending, success and a confirm step that shows the amount in GNOT before signing. Content as in revision 1 (Vouch: target summary, amount ≥ `MinVouch`, warm-up, 10% slash and unbond notes; Hire: capacity left, price, brief byte counter, deadline, "public on chain"; Register: Agent and Member tabs; Dispute: time left, evidence byte counter, deposit).
- [ ] **Step 3:** verify as in D3 and export. **Step 4:** commit and open the PR (`feat(design): paid-action screens`).

---

## Render tasks (`sc/r/hireling/render.gno`)

All Render work is test-first. Commands run in WSL from the repo root with the Onyx toolchain from `sc/CLAUDE.md`. "Verify" means `gno test ./sc/r/hireling/ -v` passes (all tests, including Wikan's), output pasted in the PR, and the page checked in `gnodev` in both gnoweb themes.

### Task R0: Render read contract with Wikan

**Files:** none (an issue comment in #4).

- [ ] **Step 1: Check the helper packages on Onyx.** `gnokey query vm/qfile -data gno.land/p/nt/markdown/sanitize/v0 -remote $RPC`, and the same for `p/moul/md/v0`, `p/moul/mdtable/v0`, `p/nt/avl/pager/v0`, `p/nt/svg/v0`, `p/moul/txlink/v0`. Write down the exported functions Render will use (for example the inline-text escaper in `sanitize`, `pager.NewPager`, `txlink.Call`).
- [ ] **Step 2: Ask Wikan in #4** for the unexported accessors Render needs, with the shapes proposed so he can accept or rename them:

```go
// in Wikan's files; read-only, no cross
func getProfile(addr address) (*Profile, bool)         // ok=false if never registered
func profilesByScore() *avl.Tree                        // key sorts by score desc, value *Profile
func backersOf(target address) *avl.Tree               // value *Vouch{Voucher, Amount, Status, WarmsAt, FreeAt}
func vouchesBy(voucher address) *avl.Tree              // value *Vouch, keyed by target
func ownedBy(owner address) []address
func pendingRewards(voucher address) int64
func guildStats() (totalStake int64, profiles int, jobsDone int)
```

Also ask what `ProfileJSON` returns for an address that never registered (empty string, `{}` or a panic), because W2 and the engine parse it.
- [ ] **Step 3: Record the answer** at the top of `render.gno` as a comment listing the accessors used. Until they land, R1's tests build state only through the public functions (`RegisterMember`, `RegisterAgent`, `AcceptRegistration`, `Vouch`) with `testing.SetOriginCaller` and `testing.SetOriginSend`, so they survive renames inside Wikan's code.

### Task R1: Home, agent, voucher and not-found pages (FR-06, P0)

**Files:**
- Create: `sc/r/hireling/render.gno`
- Test: `sc/r/hireling/render_test.gno`, `sc/r/hireling/render_escape_filetest.gno`
- Modify: `sc/CLAUDE.md` (Render section: routes, helper packages used, how to view in `gnodev`)

**Interfaces:**
- Consumes: R0 accessors; `p/<ns>/hireling` constants and `TrustScore`.
- Produces: `func Render(path string) string` for `""`, `agent/<addr>`, `voucher/<addr>`; unknown routes return a "Page not found" page with the footer. Markdown exactly as in `design/gnoweb-pages.md` 3.1, 3.2, 3.5 and 3.8, minus the SVG image (R3) and action links (R4).

- [ ] **Step 1: Write the failing tests.**

```go
// render_test.gno
func TestRenderHomeEmpty(t *testing.T) {
	out := Render("")
	urequire.True(t, strings.HasPrefix(out, "# The Guild Hall\n"))
	uassert.True(t, strings.Contains(out, "No agents yet."))
	uassert.True(t, strings.Contains(out, "Testnet only. Hireling is not affiliated with Gno.land."))
}

func TestRenderAgentShowsScoreAndBackers(t *testing.T) {
	// Sinta registers AuditBot with 100 GNOT; Budi vouches 200, Rina 100; warm-up passes; Activate
	out := Render("agent/" + auditBot.String())
	uassert.True(t, strings.Contains(out, "# AuditBot\n"))
	uassert.True(t, strings.Contains(out, "`g1jg8m…sqf5`  Agent, active."))
	uassert.True(t, strings.Contains(out, "## Score 240"))
	uassert.True(t, strings.Contains(out, "| Budi `g1bud1…7x2a` | 200 GNOT | active |"))
}

func TestRenderNoProfile(t *testing.T)    // valid unknown address -> "# No profile at `g1xx…yyyy`"
func TestRenderInvalidAddress(t *testing.T) // "agent/hello" -> "Not a valid address", no panic
func TestRenderPagesBackers(t *testing.T)  // 45 backers -> page 1 has 20 rows and "[Next 20 backers](:agent/<addr>?page=2)", page 3 has 5
func TestRenderVoucherPortfolio(t *testing.T) // Budi backs 2 agents -> both rows, "Withdraw" amount from pendingRewards
func TestRenderThresholdFromConstant(t *testing.T) // "Backers counted (" + gnot(DiversityThreshold) + " or more)"

func TestRenderEscapesUserText(t *testing.T) {
	for _, name := range []string{"[Approve](javascript:alert(1))", "![x](https://evil.example/a.png)", "<img src=x>", "a | b", "# big", "`code`"} {
		// register a member with this name, render its page
		out := Render("agent/" + addr.String())
		uassert.False(t, strings.Contains(out, "]("+"javascript"))
		uassert.False(t, strings.Contains(out, "![x]("))
		uassert.False(t, strings.Contains(out, "<img"))
		uassert.False(t, strings.Contains(out, "\n# big"))
	}
}
```

`render_escape_filetest.gno` does the same through a real `RegisterMember` transaction and checks the `// Output:` of `Render`. It sits under Wikan's filetest path, so he reviews it.

- [ ] **Step 2: Run** `gno test ./sc/r/hireling/ -run TestRender -v`. Expected: FAIL, `Render` not defined.
- [ ] **Step 3: Implement** `render.gno`: a router on the first path segment and `?page=`, one builder per page, a helper `who(name string, addr address) string` that returns the escaped name plus the shortened address, `gnot(ugnot int64) string` (integer math, at most 6 decimals, trailing zeros dropped), `utc(unix int64) string`, and the shared footer.
- [ ] **Step 4: Verify.** Full command; then `gnodev` with seed data, open `/r/<ns>/hireling`, `:agent/<addr>` and `:voucher/<addr>` in gnoweb light and dark, and compare with the `gnoweb · …` frames. Paste screenshots in the PR.
- [ ] **Step 5: Commit** (`feat(sc): render guild hall, profile and voucher pages`), open the PR with Ancung and Wikan as reviewers, and tell Ancung it is ready for the 1 Dec deploy.

### Task R2: Job, dispute, council and treasury pages (P1)

**Files:** modify `render.gno`, `render_test.gno`.

**Interfaces:** consumes Ancung's job, dispute and council state (accessors asked in #4 the same way as R0, once his week-2 code exists); produces `job/<id>`, `dispute/<id>`, `council`, `treasury` as in `gnoweb-pages.md` 3.3, 3.4, 3.6 and 3.7, and the "Latest jobs" table on the home page.

- [ ] **Step 1: Failing tests:** brief and result render as block quotes of escaped text (a result with `## Heading` and `[link](x)` stays literal on every line, including after newlines); the job steps table shows only the steps that happened; a dispute shows "2 of 3 voted" and, after `Resolve`, an "## Outcome" section; the treasury balance equals `TreasuryBalance()`; unknown ids give "No job 99".
- [ ] **Step 2: Run** (FAIL), **Step 3: Implement**, **Step 4: Verify** in `gnodev`, **Step 5: Commit** (`feat(sc): render job, dispute, council and treasury pages`).

### Task R3: Guild Hall SVG (FR-12, P1)

**Files:** modify `render.gno` (or add `render_svg.gno`, also Dilly's; update `CODEOWNERS` through Ancung if so), `render_test.gno`; test data `sc/r/hireling/testdata/guild-hall-sample.svg` copied from `design/`.

**Interfaces:** consumes R0 accessors and `ISqrt`; produces `guildHallSVG(target address) string` (the raw SVG) and its `data:image/svg+xml;base64,` image line on the agent page, following `design/guild-hall-svg.md`.

- [ ] **Step 1: Failing tests:**
  - `TestGuildHallSVGMatchesSample`: the 12-backer state from `guild-hall-samples.mjs` produces byte-for-byte `testdata/guild-hall-sample.svg`;
  - `TestGuildHallSVGCapsNodes`: 30 backers give 12 nodes and one "+18" node;
  - empty and banned states match their samples;
  - output is ≤ 8192 bytes for 12 backers;
  - the SVG contains no name, only addresses and numbers; the alt text is built from numbers and the address only.
- [ ] **Step 2: Run** (FAIL), **Step 3: Implement** with integer coordinates (`radius = 8 + 14·ISqrt(stake·10000/max)/100`), **Step 4: Verify**: the image shows in gnoweb light and dark in `gnodev`; paste the byte size. **Step 5: Commit** (`feat(sc): guild hall trust graph svg`).

### Task R4: TxLinks and paid-action links (FR-13, P1)

**Files:** modify `render.gno`, `render_test.gno`, `design/gnoweb-pages.md` (replace `{… link}` placeholders with the chosen form).

- [ ] **Step 1: Confirm on Onyx** that a `$help&func=Approve&id=12` link opens the call form in gnoweb, and whether `p/moul/txlink/v0` builds the same link. Record the result in `sc/CLAUDE.md`.
- [ ] **Step 2: Failing tests:** free actions appear only in the states where they are allowed (Approve and Open dispute only for `delivered` before T; Release only after T; Accept and Cancel per PRD F3; Vote only while voting is open; Withdraw only when something is ready); paid actions use the OQ-9 form (TxLink with send, web link `https://hirelings.xyz/vouch?agent=<addr>`, or the `gnokey` command after the cut-off); a banned agent shows no Vouch or Hire link; no link ever contains user text.
- [ ] **Step 3: Run** (FAIL), **Step 4: Implement**, **Step 5: Verify** one real TxLink call on Onyx after Ancung deploys, with the tx hash in the PR. **Step 6: Commit** (`feat(sc): action links on render pages`).

---

## Engine tasks (`engine/`)

Commands run from `engine/`. "Verify" means `bun test && bun run typecheck` passes, output pasted in the PR. Pin `"packageManager": "bun@1.4.5"`.

### Task E1: Take over #13 and fix its review

**Files:** `engine/src/llm.ts`, `engine/src/runner.ts`, `engine/package.json`, `engine/CLAUDE.md`; tests in `engine/test/llm.test.ts`, `engine/test/runner.test.ts`.

- [ ] **Step 1: Merge order.** Wait for PR #7 to merge, then rebase #13 (with Wikan's agreement, or continue it on `feat/6-engine-review-fixes` from his branch) and keep #7's LLM lines in `engine/CLAUDE.md`. Change the owner line to Dilly as in PR #16.
- [ ] **Step 2: Failing tests:**
  - `times out a hung endpoint` finishes on bun 1.3.13 and 1.4.5 (timeout via `AbortController` and a `setTimeout` cleared in `finally`, not `AbortSignal.timeout`);
  - `review() sends the brief JSON-encoded`: a brief containing `</brief>` appears in the request body only as a JSON string value;
  - `skips deliver when review ends past the deadline margin`: `now()` advances 120 s inside `review()`, and `deliver` is never called;
  - `drops cached results for jobs no longer open`.
- [ ] **Step 3: Run** `bun test` (FAIL), **Step 4: Implement**, **Step 5: Verify**, **Step 6: Commit** (`fix(engine): timeout, deadline recheck and brief encoding`).

### Task E2: AuditBot reviewer per #2

**Files:** create `engine/src/source.ts`, `engine/src/findings.ts`; modify `engine/src/llm.ts`, `engine/src/config.ts`, `engine/.env.example`, `engine/CLAUDE.md`; tests `engine/test/source.test.ts`, `engine/test/findings.test.ts`, `engine/test/llm.test.ts`.

**Interfaces:**
- `parseBrief(brief: string): { realmPath: string; criteria: string } | null`: finds one `gno.land/r/…` path; `null` means "Brief does not name a realm" is delivered as the result.
- `fetchSource(realmPath: string): Promise<{ file: string; body: string }[]>` through `vm/qfile` (list files, then each `.gno` file); total capped at a byte budget, cut files are named in the result.
- `Finding = { file: string; line: number; severity: "high" | "medium" | "low"; explanation: string }`; `renderFindings(f: Finding[], verdict: string): string` ≤ `MaxResult` bytes, plain text, no Markdown links.
- The request: model from `LLM_MODEL` (`z-ai/glm-5.3-flash`), `max_tokens: 6000`, `reasoning: { effort: LLM_REASONING_EFFORT, exclude: true }`, a `response_format` JSON schema for `{ findings: Finding[], verdict: string }`, and the checklist from `docs/gno-notes.md` in the system prompt.

- [ ] **Step 1: Failing tests:** `loadConfig` requires `LLM_REASONING_EFFORT` in `low|medium|high`; the request body has exactly the settings above; a response with reasoning text stores only the final answer; invalid JSON gives one retry, then the error "llm: invalid findings"; `renderFindings` of 200 findings stays ≤ 4096 bytes and ends with "N more findings not shown"; `fetchSource` parses a captured `vm/qfile` fixture from Onyx.
- [ ] **Step 2: Run** (FAIL), **Step 3: Implement**, **Step 4: Verify**, plus one real OpenRouter call on a public realm (for example `gno.land/r/gnoland/blog`) with the rendered result pasted, and no key in the output. **Step 5: Commit** (`feat(engine): audit a realm's source with structured findings`).

### Task E3: Gno chain adapter and live run

**Files:** create `engine/src/gnoChain.ts`, `engine/src/main.ts`; test `engine/test/gnoChain.test.ts` (fixtures only).

- [ ] **Step 1:** use the JS client chosen in #3. `acceptJob` and `deliver` resolve only after commit, and errors never include the signed tx or key material (the `HirelingChain` contract in `chain.ts`). Add per-job backoff when `Deliver` panics with a fixed reason. Read `MaxResult` and `AcceptWindow` from the `p/` constants at start instead of hard-coding them.
- [ ] **Step 2: Failing tests** with captured `abci_query` and broadcast fixtures; **Step 3: Implement**; **Step 4: Verify** live on Onyx after Ancung deploys escrow: a job created with `gnokey` is accepted and delivered by AuditBot, with both tx hashes in the PR. **Step 5: Commit** (`feat(engine): gno chain adapter and main loop`).

---

## Web tasks

Web tasks are P2 and start only after R1 to R4 and E1 to E3 (see the cut order). They follow `frontend-starter-kit` with the overrides in `apps/fe/CLAUDE.md`. Commands run from `apps/fe/`. "Verify" always means `bun run typecheck && bun run lint && bun run test && bun run build` passes, with the output pasted in the PR.

### Task W1: Scaffold, tokens, format, env

**Files:**
- Create: the Next.js app in `apps/fe/` (Scaffold mode, `references/stack.md`), `next.config.ts` with `output: "export"`
- Create: `apps/fe/docs/ui-profile.md` (kept in `apps/fe/`, not `docs/`, because `docs/` is Ancung's folder)
- Create: `apps/fe/src/app/tokens.css` (copy of `design/tokens.css`), imported from `globals.css`, plus the shadcn variable names (`--background`, `--foreground`, `--primary`, …) mapped onto those tokens in `globals.css`
- Create: `apps/fe/src/lib/format.ts`, `apps/fe/src/lib/env.ts`
- Test: `apps/fe/src/lib/format.test.ts`, `apps/fe/src/lib/env.test.ts`, `apps/fe/src/app/tokens.test.ts`
- Modify: `apps/fe/CLAUDE.md` (Commands: replace `bun test` with `bun run test`, which runs Vitest; ui-profile location), `apps/fe/.env.example` if names change

**Interfaces:**
- Produces:
  - `formatGnot(ugnot: bigint): string`: `1_500_000n` → `"1.5 GNOT"`, `100_000n` → `"0.1 GNOT"`, `0n` → `"0 GNOT"`, `1_234_000_000n` → `"1,234 GNOT"`.
  - `parseGnot(input: string): bigint | null`: string parsing, no floats.
  - `formatAddress(addr: string): string`: `g1` + 4 … last 4.
  - `formatDate(unixSeconds: number): string` in `UTC`, `en-US`.
  - `env: { rpcUrl: string; chainId: string; realmPath: string; pkgPath: string }` from `env.ts`, zod-validated. `pkgPath` is derived: `realmPath` with `/r/` replaced by `/p/`.

- [ ] **Step 1: Scaffold** with `bunx create-next-app@latest` and `bunx shadcn@latest`, per `references/stack.md`, minus axios. Add scripts `typecheck`, `lint`, `test` (Vitest), `build`. Fill `ui-profile.md`: language English, theme dark (default) and light, number `en-US`, currency `1.5 GNOT`, time zone `UTC`, glossary (Vouch, Self-stake, Trust score, Hire, Dispute, Guild Hall), design source `design/hireling.pen`, backend messages safe to show: only `hireling: ` panics, through `mapTxError` (W4).
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
- Create: `apps/fe/src/modules/landing/components/` (`Hero.tsx`, `HowItWorks.tsx`, `ScoreFormula.tsx`, `IntegrateSnippet.tsx`, `TrustTravels.tsx`, `FollowOneHire.tsx`, `HonestNotes.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`), `apps/fe/src/modules/landing/index.ts`
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
