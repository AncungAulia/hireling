# gnoweb pages: Render spec

What `Render(path)` in `sc/r/hireling/render.gno` returns for each route (PRD §9.4). Designed by Dilly, implemented by Ancung. The frames `gnoweb · …` in `hireling.pen` show how these pages look inside gnoweb; this file is the contract.

## 1. What gnoweb gives us

Checked on Onyx gnoweb (`latest.testnets.gno.land`) on 2026-11-27:

- gnoweb draws the page: top bar with the realm path, tabs Content / State / Source / Actions / Run, a content column of about 915 px, and a **Contents** sidebar built from the `##` and `###` headings. Light and dark themes follow the visitor's setting.
- The realm only returns Markdown. Hireling's look reaches gnoweb through **structure and the Guild Hall SVG**, not colours or fonts.
- Headings, paragraphs, lists, tables, links, `---` rules and images render. Links are gnoweb green.
- Only `data:` SVG images are used (allowed image host), built by the realm (`design/guild-hall-svg.md`).
- gnoweb extensions, checked on 28 Nov 2026 in a local `gnodev` running the Onyx version (`v1.8.0-rc.1`). All of them render, in light and dark:
  - **Columns:** `<gno-columns>`, then blocks separated by `<gno-columns-sep>`, then `</gno-columns>`. Each tag goes on its own line, with blank lines around the Markdown inside.
  - **Frames** (bordered cards): `<gno-frame>` … `</gno-frame>`. A frame alone in a column becomes a card.
  - **Buttons:** `<gno-button href="…" label="…" variant="…" />`. The variants are `info`, `outline`, `success`, `caution`, `warning`, `note` and `tip`. A button is a link, so `$help&func=…` TxLinks work as `href`.
  - **Alerts:** `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` and `> [!CAUTION]`, with the text on the next `>` line.
  - **Icons:** `<gno-icon name="…" />`. Not used yet.
- Recheck these on the live Onyx gnoweb once the realm is deployed.
- Never put user text inside a tag attribute (`label`, `href`). Button labels and links are built by the realm from fixed words, numbers and addresses only.

## 2. Rules for every page

- Titles in sentence case. The first line is the page `#` title, then one plain sentence that says what the page is. A `#` title holds a name only; the address goes in the first line under it (a code span in a big title is too heavy).
- **Separate lines are separate paragraphs.** gnoweb follows standard Markdown, where a single newline joins two lines into one. Put a blank line between lines that must stand apart. Links that belong on one row sit on one line, separated by two spaces.
- **Every name is followed by its shortened address** in backticks: ``AuditBot `g1jg8m…sqf5` ``. A name alone is never shown (PRD §5.2 #21).
- **All user text is escaped** with `sanitize.InlineText` and `|` is escaped in table cells (NFR-06). User text never becomes a link or an image. Names ≤ 32, descriptions ≤ 280 (`MaxName`, `MaxDesc`).
- Amounts always in GNOT with their unit: `400 GNOT`, `0.1 GNOT`. Times in UTC: `27 Nov 2026, 14:00 UTC`. Durations in words: `in 2 days`.
- No "·", ";" or em dash. Separate actions with two spaces or put them on their own line.
- Actions are **buttons** (`<gno-button>`) the realm builds, never from user text. Variants: `info` for the main paid action, `outline` for the second one, `success` for approve, release and withdraw, `caution` for dispute and guilty votes.
  - **Free actions** (Approve, Release, Cancel, Accept, Vote, Resolve, Activate, Request unbond, Withdraw) are TxLinks used as the button `href`: `<gno-button href="$help&func=Approve&id=12" label="Approve job 12" variant="success" />`. Build the href with `p/moul/txlink/v0` (on Onyx; it also has `SetSend`, see OQ-9).
  - **Paid actions** (Register, Vouch, Hire, Open dispute) depend on OQ-9 (#3):
    - if a TxLink can attach `-send`: a TxLink like the free ones;
    - if not: a link to the web app, `https://<site>/vouch?agent=<addr>`, `/hire?agent=<addr>`, `/dispute?job=<id>`, `/register`.
    The templates below write `{vouch button: label, variant}` where this choice applies.
- **Tables** keep gnoweb's own style (we cannot colour them). What we control:
  - ranked lists start with a `#` column (`#1`, `#2`);
  - the number a table is about (the score on the home page) is **bold**;
  - every status cell starts with an icon: `<gno-icon name="check-circle" />` for active and completed, `<gno-icon name="clock" />` for open, in progress, delivered and waiting, `<gno-icon name="alarm" />` for warm-up, `<gno-icon name="arrow-down" />` for unbonding, `<gno-icon name="ban" />` for banned, `<gno-icon name="caution" />` for a guilty vote and `<gno-icon name="close-circle" />` for not guilty. The words stay next to the icon, so the status never depends on the icon alone;
  - names are links followed by the short address in a code span; numbers are right-aligned (`---:`).
- Lists that grow are paged (`p/nt/avl/pager/v0`), 20 rows per page, with `[Previous](…)` and `[Next](…)` at the bottom.
- Empty states say what is empty and what to do next, in one sentence.
- Every page ends with the same footer block (section 3.8).
- Numbers that matter most on a page go in a row of cards (columns of frames), each with the value in bold and a short label under it. At most four cards per row.
- Notes the reader must not miss go in an alert: `NOTE` for facts (testnet, public data), `TIP` for what an action means, `WARNING` for a state that blocks an action. One or two per page at most.

## 3. Templates

Example data: AuditBot `g1jg8m…sqf5`, owner Sinta `g1sint…a8x2` with 100 GNOT, backers Budi 200 and Rina 100, so total 400 GNOT, 2 backers counted, score 240 (PRD §6.1).

A name in braces such as `{DiversityThreshold}` is printed from the `p/<ns>/hireling` constant, in GNOT with the unit (testnet: `1 GNOT`). Parameter values are never typed into the templates.

### 3.1 `""` The Guild Hall

```markdown
![Hireling, deposit-backed trust for Gno](data:image/svg+xml;base64,…)

# The Guild Hall

Deposit-backed trust for Gno. Agents and members lock GNOT, others vouch with their own, and any realm checks the score in one line.

![12,480 GNOT at stake, 75% from backers. 38 profiles, 24 agents and 14 members. 112 jobs done, 9 in progress, 3 disputed. 64.5 GNOT in the Guild Treasury.](data:image/svg+xml;base64,…)

{register button: Register an agent, info}  {register button: Become a member, outline}

> [!NOTE]
> Testnet only. For this demo, the council that judges disputes is the Hireling team.

## Top agents

![Top 5 agents by trust score: 1. g1jg8m…sqf5, score 240, 400 GNOT. 2. g1lint…9k2d, score 160, 256 GNOT. …](data:image/svg+xml;base64,…)

| # | Agent | Score | At stake | Backers | Jobs done |
|---|---|---:|---:|---:|---:|
| #1 | [AuditBot](:agent/g1jg8m…) `g1jg8m…sqf5` | **240** | 400 GNOT | 2 | 14 |
| #2 | [LintBot](:agent/g1lint…) `g1lint…9k2d` | **160** | 256 GNOT | 1 | 3 |

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

![Trust score 240 for g1jg8m…sqf5. 400 GNOT at stake, 100 from the owner and 300 from backers. 2 backers counted, +20% diversity, 0 of 3 strikes, 100 GNOT capacity left, 14 jobs done](data:image/svg+xml;base64,…)

{vouch button: Vouch for AuditBot, info}  {hire button: Hire AuditBot, outline}

![Trust graph of g1jg8m…sqf5, score 240, 2 backers, 400 GNOT at stake](data:image/svg+xml;base64,…)

> [!TIP]
> Vouching puts your GNOT behind AuditBot. If it is found guilty, each backer loses 10% and the owner loses 2× the job price.

## Score 240

| Part | Value |
|---|---:|
| Total at stake | 400 GNOT |
| Backers counted ({DiversityThreshold} or more) | 2 |
| Diversity bonus | +20% |
| Strikes | 0 of 3 |
| Capacity left for new jobs | 100 GNOT |

score = floor(√400 × 10 × 1.2 × 1.0) = 240

## Backers

| Backer | Stake | Status |
|---|---:|---|
| Sinta `g1sint…a8x2` (owner) | 100 GNOT | <gno-icon name="check-circle" /> active |
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
- **Not found**: "# No profile at `g1xxxx…yyyy`" and "This address has not registered. {register button: Register as a member or an agent, info}".

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

> [!NOTE]
> The brief and the result are public on chain.

## Brief

> Review gno.land/r/joko/shop. Acceptance: list every finding against the Gno security checklist, with the line.

## Result

> 3 findings. 1. Payment guard uses IsUser instead of IsUserCall, line 42. …

## Actions

<gno-button href="$help&func=Approve&id=12" label="Approve job 12" variant="success" />  {dispute button: Open a dispute, caution}
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

2 of 3 voted. A majority of non-abstain votes decides.

## Actions

<gno-button href="$help&func=Vote&disputeID=3&choice=yes" label="Vote guilty" variant="caution" />  <gno-button href="$help&func=Vote&disputeID=3&choice=no" label="Vote not guilty" variant="success" />  <gno-button href="$help&func=Vote&disputeID=3&choice=abstain" label="Abstain" variant="outline" />

<gno-button href="$help&func=Resolve&disputeID=3" label="Resolve dispute 3" variant="info" />

> [!WARNING]
> Jurors who are the owner, the agent, the hirer or a backer of the agent cannot vote.
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

<gno-button href="$help&func=Withdraw" label="Withdraw 3.4 GNOT" variant="success" />

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
