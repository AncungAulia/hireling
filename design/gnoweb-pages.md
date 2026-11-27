# gnoweb pages: Render spec

What `Render(path)` in `sc/r/hireling/render.gno` returns for each route (PRD §9.4). Designed by Dilly, implemented by Ancung. The frames `gnoweb · …` in `hireling.pen` show how these pages look inside gnoweb; this file is the contract.

## 1. What gnoweb gives us

Checked on Onyx gnoweb (`latest.testnets.gno.land`) on 2026-11-27:

- gnoweb draws the page: top bar with the realm path, tabs Content / State / Source / Actions / Run, a content column of about 915 px, and a **Contents** sidebar built from the `##` and `###` headings. Light and dark themes follow the visitor's setting.
- The realm only returns Markdown. Hireling's look reaches gnoweb through **structure and the Guild Hall SVG**, not colours or fonts.
- Headings, paragraphs, lists, tables, links, `---` rules and images render. Links are gnoweb green.
- Only `data:` SVG images are used (allowed image host), built by the realm (`design/guild-hall-svg.md`).
- Extensions not confirmed on Onyx yet (columns, alerts, forms): **not used**. If Ancung confirms one works, we can add it later.

## 2. Rules for every page

- Titles in sentence case. The first line is the page `#` title, then one plain sentence that says what the page is. A `#` title holds a name only; the address goes in the first line under it (a code span in a big title is too heavy).
- **Separate lines are separate paragraphs.** gnoweb follows standard Markdown, where a single newline joins two lines into one. Put a blank line between lines that must stand apart. Links that belong on one row sit on one line, separated by two spaces.
- **Every name is followed by its shortened address** in backticks: ``AuditBot `g1jg8m…sqf5` ``. A name alone is never shown (PRD §5.2 #21).
- **All user text is escaped** with `sanitize.InlineText` and `|` is escaped in table cells (NFR-06). User text never becomes a link or an image. Names ≤ 32, descriptions ≤ 280 (`MaxName`, `MaxDesc`).
- Amounts always in GNOT with their unit: `400 GNOT`, `0.1 GNOT`. Times in UTC: `27 Nov 2026, 14:00 UTC`. Durations in words: `in 2 days`.
- No "·", ";" or em dash. Separate actions with two spaces or put them on their own line.
- Actions are links the realm builds, never from user text:
  - **Free actions** (Approve, Release, Cancel, Accept, Vote, Resolve, Activate, Request unbond, Withdraw) are TxLinks: `[Approve job 12]($help&func=Approve&id=12)`. Use `p/moul/txlink/v0` if it works on Onyx.
  - **Paid actions** (Register, Vouch, Hire, Open dispute) depend on OQ-9 (#3):
    - if a TxLink can attach `-send`: a TxLink like the free ones;
    - if not: a link to the web app, `https://<site>/vouch?agent=<addr>`, `/hire?agent=<addr>`, `/dispute?job=<id>`, `/register`.
    The templates below write `{vouch link}` where this choice applies.
- Lists that grow are paged (`p/nt/avl/pager/v0`), 20 rows per page, with `[Previous](…)` and `[Next](…)` at the bottom.
- Empty states say what is empty and what to do next, in one sentence.
- Every page ends with the same footer block (section 3.8).

## 3. Templates

Example data: AuditBot `g1jg8m…sqf5`, owner Sinta `g1sint…a8x2` with 100 GNOT, backers Budi 200 and Rina 100, so total 400 GNOT, 2 backers counted, score 240 (PRD §6.1).

### 3.1 `""` The Guild Hall

```markdown
# The Guild Hall

Deposit-backed trust for Gno. Agents and members lock GNOT, others vouch with their own, and any realm checks the score in one line.

12,480 GNOT at stake across 38 profiles. 112 jobs done. 64.5 GNOT in the Guild Treasury.

## Top agents

| Agent | Score | At stake | Backers | Jobs done |
|---|---:|---:|---:|---:|
| [AuditBot](:agent/g1jg8m…) `g1jg8m…sqf5` | 240 | 400 GNOT | 2 | 14 |
| [LintBot](:agent/g1lint…) `g1lint…9k2d` | 160 | 256 GNOT | 1 | 3 |

[Next 20 agents](:?page=2)

## Latest jobs

| Job | Agent | Price | Status | Updated |
|---|---|---:|---|---|
| [#12](:job/12) | AuditBot `g1jg8m…sqf5` | 50 GNOT | completed | 27 Nov 2026, 14:00 UTC |
| [#11](:job/11) | LintBot `g1lint…9k2d` | 5 GNOT | in progress | 27 Nov 2026, 09:12 UTC |

## Check any address in your realm

    if !hireling.IsTrusted(caller, 100) { panic("trust score too low") }

## Rules

| Rule | Value |
|---|---:|
| Minimum self-stake | 10 GNOT |
| Minimum vouch | 1 GNOT |
| Vouch warm-up | 3 days |
| Unbond wait | 7 days |
| Fee split, owner, backers, treasury | 80%, 15%, 5% |
| Slash if guilty | 2 × price from the owner, 10% from each backer |

The rules are constants in an immutable package. Nobody can change them, including the team.
```

### 3.2 `agent/<addr>` Agent or member profile

```markdown
# AuditBot

`g1jg8m…sqf5`  Agent, active.

Reviews Gno realms against the security checklist.

Owned by Sinta `g1sint…a8x2`.

![Trust graph of g1jg8m…sqf5, score 240, 2 backers, 400 GNOT at stake](data:image/svg+xml;base64,…)

{vouch link: Vouch for AuditBot}  {hire link: Hire AuditBot}

## Score 240

| Part | Value |
|---|---:|
| Total at stake | 400 GNOT |
| Backers counted (5 GNOT or more) | 2 |
| Diversity bonus | +20% |
| Strikes | 0 of 3 |
| Capacity left for new jobs | 50 GNOT |

score = floor(√400 × 10 × 1.2 × 1.0) = 240

## Backers

| Backer | Stake | Status |
|---|---:|---|
| Sinta `g1sint…a8x2` (owner) | 100 GNOT | active |
| Budi `g1bud1…7x2a` | 200 GNOT | active |
| Rina `g1rina…k9q0` | 100 GNOT | active |
| `g1tt0n…9qe3` | 48 GNOT | warm-up, counts in 2 days |

## Jobs

| Job | Price | Status | Updated |
|---|---:|---|---|
| [#12](:job/12) | 50 GNOT | completed | 27 Nov 2026, 14:00 UTC |

## Owner history

Sinta `g1sint…a8x2` owns 1 agent. None has been banned.
```

- **Member** profiles use the same page without Hire, Capacity and Jobs.
- **Pending** agents show one line under the title: "Waiting for the agent key to accept. [Accept registration]($help&func=AcceptRegistration)".
- **Banned** agents: the title line says "Agent, banned after 3 strikes." The Vouch and Hire links are not shown, and the SVG uses the banned state.
- **Owner history** with a ban: "Sinta `g1sint…a8x2` owns 2 agents. 1 was banned: OldBot `g1old0…11aa`."
- **Not found**: "# No profile at `g1xxxx…yyyy`" and "This address has not registered. {register link: Register as a member or an agent}".

### 3.3 `job/<id>` Job

```markdown
# Job 12

AuditBot `g1jg8m…sqf5` for Joko `g1joko…3m1z`. 50 GNOT in escrow.

| Step | When |
|---|---|
| Created | 24 Nov 2026, 10:00 UTC |
| Accepted | 24 Nov 2026, 11:30 UTC |
| Delivered | 26 Nov 2026, 09:00 UTC |
| Dispute window ends | 29 Nov 2026, 09:00 UTC, in 2 days |

Status delivered.

## Brief

> Review gno.land/r/joko/shop. Acceptance: list every finding against the Gno security checklist, with the line.

## Result

> 3 findings. 1. Payment guard uses IsUser instead of IsUserCall, line 42. …

## Actions

[Approve job 12]($help&func=Approve&id=12)  {dispute link: Open a dispute}

The brief and the result are public on chain.
```

- Actions shown depend on status and time: Accept and Cancel for the agent while open; Cancel for the hirer after the accept window or deadline; Approve and Open dispute before the window ends; Release for anyone after it ends (PRD F3, §5.2 #23).
- Brief and result are block quotes of escaped text, never Markdown from the user.

### 3.4 `dispute/<id>` Dispute

```markdown
# Dispute 3

Joko `g1joko…3m1z` against AuditBot `g1jg8m…sqf5` on [job 12](:job/12).

Deposit 5 GNOT. Voting ends 2 Dec 2026, 09:00 UTC.

## Evidence

> The result claims 3 findings, but the realm has 5 issues listed in the brief's checklist. …

## Votes

| Juror | Vote | Reason |
|---|---|---|
| Juror1 `g1jur1…0a1b` | guilty | Missed two required checks. |
| Juror2 `g1jur2…9c8d` | not guilty | The brief did not require line numbers. |
| Juror3 `g1jur3…5e6f` | waiting | |

2 of 3 voted. 2 votes decide the outcome.

## Actions

[Vote guilty]($help&func=Vote&disputeID=3&choice=yes)  [Vote not guilty]($help&func=Vote&disputeID=3&choice=no)  [Abstain]($help&func=Vote&disputeID=3&choice=abstain)

[Resolve dispute 3]($help&func=Resolve&disputeID=3)

Jurors who are the owner, the agent, the hirer or a backer of the agent cannot vote.
```

- After resolution, the Actions section is replaced by "## Outcome" with one sentence per effect: refund, slash, strike, juror pay (PRD §5).

### 3.5 `voucher/<addr>` Backer portfolio

```markdown
# Budi

`g1bud1…7x2a`  Backs 2 agents with 260 GNOT. 3.4 GNOT ready to withdraw.

## Agents backed

| Agent | Stake | Status | Rewards earned |
|---|---:|---|---:|
| [AuditBot](:agent/g1jg8m…) `g1jg8m…sqf5` | 200 GNOT | active | 3.0 GNOT |
| [LintBot](:agent/g1lint…) `g1lint…9k2d` | 60 GNOT | unbonding, free on 3 Dec 2026 | 0.4 GNOT |

## Rewards

[Withdraw 3.4 GNOT]($help&func=Withdraw)

A guilty verdict cuts 10% of each backer's stake, including stake that is still warming up or unbonding.
```

### 3.6 `council` Council

```markdown
# Council

Three jurors judge disputes. In this demo the jurors are the Hireling team. A self-governing council is on the roadmap.

| Juror | Since |
|---|---|
| Juror1 `g1jur1…0a1b` | 25 Nov 2026 |

## Open disputes

| Dispute | Job | Votes | Ends |
|---|---|---:|---|
| [3](:dispute/3) | [12](:job/12) | 2 of 3 | 2 Dec 2026, 09:00 UTC |

## Queued changes

| Change | Takes effect |
|---|---|
| Add Juror4 `g1jur4…7g8h` | 30 Nov 2026, 12:00 UTC |

Changes wait 3 days and never apply to disputes already open.
```

### 3.7 `treasury` Guild Treasury

```markdown
# Guild Treasury

64.5 GNOT. The treasury has no withdrawal function, so nobody can take it out, including the team.

## Incoming funds

| Date | Source | Amount |
|---|---|---:|
| 27 Nov 2026 | Fee from [job 12](:job/12) | 2.5 GNOT |
| 26 Nov 2026 | Slash after [dispute 2](:dispute/2) | 30 GNOT |
```

### 3.8 Footer (every page)

```markdown
---

[The Guild Hall](:)  [Council](:council)  [Treasury](:treasury)  [Source](./$source)

Testnet only. Hireling is not affiliated with Gno.land.
```
