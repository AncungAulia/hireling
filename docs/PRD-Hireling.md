# Hireling: Product Requirements Document (PRD)

> **Status:** Draft v2 · **Date:** 25 Nov 2026 · **Target:** Gnome Tavern Hackathon (Gno.land, DoraHacks)
> **Changes from v1** (based on an internal idea review and red-team pass):
> - Focus shifted to a **deposit-backed trust primitive**; the marketplace becomes the first use case.
> - Trust score now gives a **voucher diversity bonus** (capped to stay Sybil-safe).
> - Scope trimmed: curator multiplier, Insurance Pool, complex pro-rata slash, and the AI clerk were dropped.
> - Vouchers share the risk through a **flat 10% slash of each one's own stake**, and their fee share rises to **15%**.
> - **Plot hole fixes (§5.2):**
>   - Slashed funds go to the **Guild Treasury**, not to the victim, so an owner cannot rob their own vouchers through fake accounts.
>   - The victim only gets a **refund + deposit back, no bonus** (round 3, §5.2 #18).
>   - Juror pay is **the same regardless of the verdict**.
>   - Funds that are unbonding can still be slashed.
>   - **Anyone** (human or agent) can create a profile.
>   - Owner history is displayed.
> - **Round 2 fixes (§5.2 #10–17):**
>   - jobs must be accepted and have a deadline, so the hirer can cancel if the agent goes silent
>   - job capacity is capped by self-stake
>   - disputing parties may not vote
>   - AI agent runner promoted to P1
>   - 3-day vouch warm-up
>   - minimum price and deposit
>   - rules for remaining stake after a ban
>   - check TxLink support for `-send`
> - **Round 3 fixes (red-team, §5.2 #18–24):**
>   - parameters locked in an immutable `/p/` package, and council changes are subject to a timelock
>   - victim gets no bonus
>   - share-based voucher accounting (O(1), no 50 limit)
>   - user text is escaped (anti-phishing)
>   - higher self-stake for owners who have been banned before
>   - strict time boundaries
>   - auto-release trade-off openly acknowledged
> - Full **roadmap** in §18.
> - Added a **Guild Hall** page with an SVG trust graph.
> **Domain:** `hirelings.xyz` (not yet purchased; `hireling.xyz` is already owned by someone else) · **Language:** everything in the repository is in English (UI, README, video, code comments, internal docs)
> Team reference notes: [`docs/gno-notes.md`](gno-notes.md) (Gno reference notes for the team)

---

## 1. Summary

**Hireling is a deposit-backed trust system on Gno.land, with AI agents as the first use case.**

Think of it like a rental security deposit. An agent puts up GNOT as collateral, and others can **vouch** for it as well. This produces a public **trust score**. If the agent cheats, a **council** of jurors decides the dispute, the victim gets their money back, and the agent's deposit is **slashed** as punishment.

The trust score is used in two ways:
1. **Trust API**: other realms need only **a one-line import** (`IsTrusted(addr, min)`) to filter out spam or Sybils. This is the core of the product and the most Gno-native part.
2. **Marketplace (Guild)**: agents that have been vouched for can be **hired with escrow**, and vouchers earn a share of every hire.

**One-liner (EN):** *Deposit-backed trust for Gno. Start with AI agents someone has put money behind.*

### 1.1 Problem
- Anyone can create new addresses or AI agents for free and without limit (a **Sybil** attack). There is no on-chain way to tell trustworthy agents from untrustworthy ones.
- gnomcp already lets AI agents act on Gno.land (read, deploy, call, Sessions). But **there is no registry, reputation, or accountability mechanism for agents yet** (the official issue [#5661 "AI agents x Gno"](https://github.com/gnolang/gno/issues/5661) is still open).
- The official Gno.land wishlist ("Future Work" in the Manifesto) asks for **composable reputation and access primitives**: web-of-trust, deposit-based access, invitation trees, oracle attestations. None of them exist in the monorepo yet (checked 25 Nov 2026).

### 1.2 Solution (in order of build priority)
1. **Agent registry**: agents have a profile, an owner, and capabilities.
2. **Stake-backed vouching**: the owner (self-stake) and vouchers lock GNOT. The result is a public **trust score** (§6).
3. **Importable Trust API**: `IsTrusted(addr, min)` and `TrustScore(addr)` for other realms, demonstrated by the **tavernboard** demo realm.
4. **Hiring with escrow** (minimal version): the hirer pays into the contract. Funds are released once the work is accepted, and the fee is then split between the owner, the vouchers, and the Guild Treasury.
5. **Disputes and slashing** (thin version): a 3-member council votes. If the agent is guilty, the hirer gets their money back in full, and the agent and its vouchers are punished through a slash to the Guild Treasury.

If time runs short, items 1–3 already form a complete and valuable product.

---

## 2. Hackathon context

| Item | Detail |
|---|---|
| Event | Gnome Tavern Hackathon, Gno.land (organizer: GnoLand (BVI) Limited) |
| Deadline | **18 Dec 2026, 01:00 UTC = 08:00 WIB**. Target submission: **evening of 17 Dec** |
| Prizes | 1st $2,000 · 2nd $1,000 · 14× Builder Award $500 (in GNOT). **Retention Prize** up to 2× the prize |
| Mandatory requirements | Live on **Gno.land testnet** + deploy link · public repo · genuine Gno component (realm/package) · README · **demo video** · short description |
| Prohibited | Name may not start with "Gno" or use official Gno.land branding · mockups or concepts only · duplicate or mass entries |
| Judging | Technical quality **40%** · User appeal 20% · Creativity 20% · Docs & demo 20% |
| Community | Discord `#gnome-tavern-hackathon` (https://discord.gg/gnoland) |

### 2.1 Mapping to judging criteria
| Criterion | How Hireling meets it |
|---|---|
| **Technical quality (40%)** | Correct interrealm usage (`cur realm`, `cross`), safe escrow and banker, avl.Tree for storage, **adversarial filetests** (using the official Gno security checklist), `chain.Emit` events |
| **User appeal (20%)** | Guild/tavern theme, **Guild Hall** page with an SVG trust graph in gnoweb, one-click TxLinks with Adena, a flow that is easy to tell as a story |
| **Creativity (20%)** | A deposit-backed trust primitive that **other realms can import**, a Sybil-resistant voucher diversity bonus, AI agents as the first use case. Answers Gno's "Future Work" wishlist |
| **Docs & demo (20%)** | Structured README, flow diagrams, a story-driven demo video (Sinta, Budi, Joko, jurors), integration examples for other realms |

### 2.2 Retention Prize (post-hackathon)
Requirements: still live on **mainnet** in months 3 and 6, at least one release or deploy per month, **50 unique addresses (month 3) and 100 (month 6)** (team wallets not counted), **at least one other project imports or uses** Hireling, and a community on X/Telegram/Discord.

Hireling is designed for this: the **Trust API** is built specifically to be imported by other projects.

---

## 3. Personas

| Persona | Example | Needs |
|---|---|---|
| **Agent owner** | Sinta, developer of AuditBot | Distribution and credibility for her agent, plus income from hires |
| **Voucher** | Budi, Rina | Passive income from fees |
| **Hirer** | Joko, needs a code audit | Hire an agent safely, and get his money back in full if cheated |
| **Juror** | Council member (DAO) | Decide disputes fairly and get paid |
| **Other realm developer** | Builder of a forum or DAO | A ready-made anti-Sybil filter: `hireling.IsTrusted(addr, 50)` |
| **AI agent** | AuditBot (via gnomcp) | Receive jobs, submit results, build on-chain reputation |

---

## 4. Core concepts

| Concept | Definition in Hireling |
|---|---|
| **Profile** | An address's identity in Hireling. There are two kinds: **Member** (a human, self-registered, used only for trust) and **Agent** (can be hired). Both have a trust score, so the Trust API works for any address. |
| **Agent** | A profile of kind Agent: a `g1…` address controlled by an AI agent (for example, a key held by gnomcp). Owned by a single **owner**. |
| **Guild Treasury** | A realm-owned balance that holds the 5% fee, owner slashes (after juror pay), and all voucher slashes. Displayed transparently in Render. In the MVP there is **no function to withdraw funds** (nobody can take them, including the team); how it is used will be decided through governance on the roadmap (§18). |
| **Self-stake** | GNOT locked by the owner for their agent. Mandatory, and bears the **main slash** (2× the job price). |
| **Vouch** | A voucher locks GNOT behind an agent. If the agent is found guilty, **each voucher loses 10% of their own stake**. This gives vouching real risk and makes it meaningful as a signal. |
| **Unbond** | Withdrawing a vouch. There is a **waiting period** of 7 days before funds can be withdrawn, and during the waiting period the funds **can still be slashed**. |
| **Trust score** | An agent's trust number, computed from stake and history (§6). |
| **Job (Quest)** | A single hire. Payment is held in escrow until it is accepted or decided by the jurors. |
| **Dispute** | A dispute opened by the hirer over a job. |
| **Council** | A set of juror addresses that vote on disputes. |
| **Strike** | A violation mark. 3 strikes get an agent **banned**. |
| **Slash** | Cutting stake as a penalty. |

---

## 5. Economic parameters (agreed 25 Nov 2026)

All parameters are **constants in the `p/<ns>/hireling` package**. Pure packages in Gno are **immutable** after deployment, so **nobody can change the rules, including the admin**. Rules can only change by deploying a new version (`v2`), and jobs or stakes already in progress keep following the old version. Parameters are shown in `Render`. Demo values on testnet use a separate package version with small numbers because the faucet is limited.

| Parameter | Value | Note |
|---|---|---|
| Job fee split | **80% owner · 15% vouchers · 5% Guild Treasury** | The vouchers' share is split pro-rata by active stake; raised from 10% to offset the slash risk |
| Minimum self-stake | 100 GNOT (mainnet) · **10 GNOT (testnet demo)**, multiplied by **(1 + number of the owner's agents that have ever been banned)** | Owners who have been banned pay more to start again (§5.2 #22) |
| Minimum vouch | 1 GNOT | Prevents spam of tiny vouches |
| Voucher threshold counted toward diversity bonus | **5 GNOT** (mainnet) · 1 GNOT (testnet demo) | Makes splitting funds across many fake wallets expensive (§6) |
| Diversity bonus cap | **5 vouchers** (max. bonus +50%) | |
| Minimum job price | **1 GNOT** (mainnet) · 0.1 GNOT (testnet demo) | Prevents penny jobs used for griefing (§5.2 #15) |
| Agent job capacity | Total price of active jobs (Open/InProgress/Delivered/Disputed) **≤ unfrozen self-stake** | The penalty is always proportional to the job, and juror pay can always be covered (§5.2 #11) |
| Accept deadline | **2 days** after `CreateJob` | Past the deadline → the hirer can `CancelJob` (full refund) |
| Work deadline | Set by the hirer in `CreateJob` (default **7 days**, max. 30 days) | Past the deadline without `Deliver` → the hirer can `CancelJob` (full refund) |
| Dispute deadline (T) | `T = DeliveredAt + 3 days` | `OpenDispute` is only valid if `now < T`; `Release` is only valid if `now ≥ T`. There is no block in which both are valid (§5.2 #23) |
| Job auto-release | From `T` | If the hirer stays silent, funds are released automatically. **Deliberate trade-off**: a hirer who is offline for more than 3 days loses the right to dispute (§5.2 #24) |
| Dispute deposit | **10% of the job price, minimum 1 GNOT** (0.1 GNOT on testnet) | Prevents frivolous accusations |
| Juror pay (D) | **Always = the dispute deposit amount**, split evenly among jurors who voted (YES/NO/ABSTAIN). Source: from the **owner slash** if guilty, from the **hirer's deposit** if not guilty | The amount is the same regardless of the verdict, so jurors stay neutral. Jurors who do not vote are not paid |
| Juror voting period | **5 days** | |
| Quorum | Majority of the council member count (e.g., 2 of 3) | |
| Owner slash if guilty | **2× the job price** from self-stake (capped at the available self-stake) | |
| Hirer wins dispute | **Full refund of the job price + deposit back. No bonus** | The victim loses nothing, but also cannot profit from accusing (§5.2 #18) |
| Remaining owner slash | After juror pay → **Guild Treasury** | `ugnot` cannot be burned by a realm (see OQ-1) |
| Voucher slash | **10% of each voucher's stake** (including those still in warm-up or unbonding) → **Guild Treasury** | Computed via a share index (O(1), §9.3), not a loop. **Not to the victim**, so the owner cannot rob vouchers through fake accounts |
| Number of vouchers per agent | **Unlimited** | Share-based accounting keeps gas cost constant, independent of the number of vouchers (§5.2 #20) |
| Hirer loses dispute | The dispute deposit becomes juror pay; the job is processed as in the smooth flow | |
| Jurors fail to reach quorum | **Full refund to the hirer, no slash**, deposit returned; jurors are not paid | Safe default: no punishment without a verdict |
| Strike limit | **3 strikes = permanent ban** | All vouchers can unbond immediately with no waiting period. The ban is recorded in the **owner history** and shown on every agent profile belonging to that owner |
| Unbond waiting period | **7 days** | |
| Vouch activation period (warm-up) | **3 days** after vouching | Before activation, a vouch does not yet count toward the trust score or the fee share, but can already be slashed (§5.2 #14) |
| Remaining self-stake after a ban | The owner can still withdraw the remaining self-stake after the 7-day waiting period | A ban stops the agent; it does not confiscate all funds |
| Freeze | The agent's stake is **frozen** while there is an active dispute | Anti-escape |

### 5.1 Worked example
AuditBot: Sinta's self-stake 100, Budi 200, Rina 100 → **total 400 GNOT**. Joko hires it for **50 GNOT**.
- **Smooth:** Sinta 40 · vouchers 7.5 (Budi 5 · Rina 2.5) · Guild Treasury 2.5.
- **Guilty:**
  - Joko gets the 50 refund + 5 deposit back = **55**, i.e., all of his capital. No profit, no loss.
  - Owner slash = 100, taken from Sinta's self-stake of 100 (fully depleted): 5 for the pay of 3 jurors (about 1.67 each), the remaining 95 to the Guild Treasury.
  - Voucher slash: Budi −20, Rina −10, a total of 30 to the Guild Treasury.
  - AuditBot gets 1 strike. Sinta's self-stake = 0, so the agent is **inactive** until Sinta tops up.
- **Not guilty:** the 50 is processed as in the smooth flow. Joko's deposit of 5 becomes juror pay.

### 5.2 Plot holes fixed

| # | Loophole | Attack scenario | Fix |
|---|---|---|---|
| 1 | **Owner robs vouchers** | Sinta creates a fake account, hires her own agent, deliberately cheats, then wins the dispute. If the voucher slash went to the victim, the vouchers' money would flow to Sinta | The voucher slash and remaining owner slash go to the **Guild Treasury**, which nobody can withdraw from in the MVP. The math: the fake account only gets its own money back, while the owner loses the slash. **Always a loss** |
| 2 | **Frivolous complaints for profit** | A hirer pays 55 and hopes to get 165 if they win | The victim only gets a refund + deposit (#18). If they lose, the deposit is gone. The only "profit" is the work already received, and honest jurors are the defense |
| 3 | **Jurors biased toward "guilty"** | If juror pay comes from the slash, jurors get paid more for a guilty verdict | Juror pay is **always = D** (the deposit amount), regardless of the verdict; only the source differs. Jurors who do not vote are not paid |
| 4 | **Vouchers flee before a complaint** | As soon as the agent calls `Deliver`, vouchers immediately call `RequestUnbond` | Funds in the unbond waiting period **can still be slashed**. The 7-day waiting period is longer than the 3-day dispute window |
| 5 | **"For any address", but registration is agents-only** | Humans on tavernboard have no trust score | **Member** profiles for anyone (§4, F1b) |
| 6 | **Get banned, then create a new agent** | An owner whose agent was banned immediately registers a new agent | The new agent starts from zero, **minimum self-stake is multiplied by (1 + the owner's ban count)** (#22), and the owner history is shown on the profile |
| 7 | **Jurors = the team itself** | Hackathon judges ask, "So the jurors are you guys?" | Disclosed honestly in the README; tally rules follow the Common DAO Spec; a self-governing council is on the roadmap |
| 8 | **Unclear standard for "cheating"** | Jurors don't know what correct work looks like | `brief` must contain **acceptance criteria**; jurors judge against that brief |
| 9 | **Privacy** | Briefs and work results are stored publicly on the blockchain | Warnings in the UI and README: do not enter confidential data. Encrypted briefs are on the roadmap |
| 10 | **Stuck escrow** | The agent never accepts or delivers, yet only the agent can `CancelJob` | `AcceptJob` is required within 2 days and `Deliver` is required before the deadline. If either is missed, the **hirer** can `CancelJob` and get a full refund |
| 11 | **Collateral smaller than the job** | Self-stake 100, job 1,000; or 5 jobs @100 at once, so the penalty is not proportional | **Capacity** rule: total price of active jobs ≤ unfrozen self-stake. `CreateJob` is rejected if it exceeds capacity |
| 12 | **Jurors judging their own case** | A juror account turns out to be the owner, hirer, or a voucher of the disputed agent | The dispute electorate = council **minus related parties** (owner, agent, hirer, that agent's vouchers). If the electorate is empty → no-quorum fallback |
| 13 | **"Where's the AI?"** | In the demo, the job is done by a human through the CLI | **Agent runner promoted to P1** (FR-15): a script that watches jobs, calls an LLM, then calls `Deliver` |
| 14 | **Sniping voucher rewards** | Vouch right before a large job is approved, take the 15%, then unbond | A new vouch only becomes active after a **3-day warm-up** |
| 15 | **Cheap freeze griefing** | A 1 GNOT job + 0.1 GNOT deposit freezes all of an agent's stake for 5 days | Minimum job price and minimum dispute deposit (1 GNOT on mainnet) |
| 16 | **Unclear remaining funds after a ban** | The owner doesn't know whether the remaining self-stake is lost | Remaining self-stake can be withdrawn after the 7-day waiting period |
| 18 | **Victim profits from disputes** (red-team A1/A2) | Refund + compensation bonus makes accusing (or suing one's own agent) profitable | The victim **only** gets a refund + deposit back. The entire slash (after juror pay) goes to the Treasury |
| 19 | **Admin too powerful** (A4) | The admin adds fake jurors and convicts every agent, or changes the slash and fee amounts mid-job | Parameters = **constants in an immutable `/p/`**. Adding or removing council members is subject to a **3-day timelock** and does not apply to disputes already opened (the electorate is snapshotted). Because victims get no bonus and the Treasury cannot be withdrawn, a fake verdict **earns the admin no money**; the only remaining risk is griefing, and that is openly disclosed in the README |
| 20 | **Gas DoS / voucher slots filled** (B8) | Thousands of tiny vouches make the fee-split or slash loop run out of gas; a limit of 50 vouchers could be filled by an attacker | **Share-based** accounting (§9.3): fee splitting and slashing take a single O(1) operation, with no loop and no limit on the number of vouchers |
| 21 | **Phishing through Render** (B13) | An agent description contains a fake "✅ Vouch" link to the attacker's realm; agent names are impersonated | All user-supplied text is **escaped** (no links, images, or HTML are rendered). Lengths are limited (name 32, description 280 characters). **The (shortened) address is always shown next to the name**, and TxLinks are only generated by the realm itself |
| 22 | **Name laundering through a new agent** (B12) | After being banned, the owner registers AuditBot2 | Minimum self-stake is multiplied by (1 + the owner's ban count) |
| 23 | **Race at the time boundary** (B11) | `Release` and `OpenDispute` are both valid in the boundary block | Strict boundary: dispute `now < T`, release `now ≥ T` |
| 24 | **Auto-release while the hirer is offline** (B10) | The hirer is offline for 3 days, then funds are released for poor work | **Deliberate and disclosed trade-off**: without auto-release, an agent could be left hanging forever. Hirers are advised to use an appropriate deadline |
| 17 | **TxLink may not be able to send GNOT** | The Vouch or Hire button in gnoweb fails because it cannot include `-send` | **Check in week 0** (OQ-9). Fallback: a small web page with Adena for paid actions; actions without money keep using TxLink |

**Not a loophole, but have an answer ready:** *"Why does an agent with 50 successful jobs have the same score as a new agent?"* Because the number of successful jobs is easy to fake by hiring yourself over and over. Job history is **displayed** on the profile but **not counted** in the score. Manipulation-resistant history-based reputation weighting is on the roadmap.

---

## 6. Trust score

### 6.1 MVP formula: amount of money + voucher diversity, capped
```
TotalStake   = selfStake + Σ vouchStake_i                       (in GNOT)
N            = number of unique vouchers with vouch ≥ threshold (5 GNOT), excluding the owner
Diversity    = 1 + 0.1 × min(N, 5)                              (1.0 … 1.5)
TrustScore   = floor( sqrt(TotalStake) × 10 × Diversity × (1 − 0.25 × strikes) )
```
- **`sqrt`**: whales don't dominate outright. 100× more money only raises the score 10×.
- **Diversity bonus**: an agent vouched for by many people is valued more than one vouched for by a single rich person, with a bonus of up to +50%.
- **Why capped, rather than a per-voucher root (Σ√stake_i)?** A per-voucher root is vulnerable to Sybils. 400 GNOT split across 400 wallets yields a score of 4,000, whereas from a single wallet it is only 200. With a cap of 5 vouchers and a 5 GNOT threshold, the maximum gain from fake wallets is only +50%, and getting it still takes 25 real GNOT.
- **Strikes** cut the score by 25% per strike; at 3 strikes the agent is banned.
- Agents that are **inactive** (self-stake below the minimum) or **banned** get a score of 0.
- Also displayed: number of vouchers, completed jobs, percentage of disputes won.
- Implementation: integer `sqrt` (Newton's method) in `p/<ns>/hireling`, with unit tests for the example table below.

**Examples** (0 strikes):

| Case | Total | N | Score |
|---|---|---|---|
| Owner only, 100 GNOT | 100 | 0 | 100 |
| Owner 100 + 1 voucher 300 | 400 | 1 | 220 |
| Owner 100 + Budi 200 + Rina 100 | 400 | 2 | 240 |
| Owner 100 + 30 vouchers × 10 | 400 | 5 (capped) | 300 |
| Owner 100 + 300 fake wallets × 1 (below threshold) | 400 | 0 | 200 |

### 6.2 Roadmap (post-hackathon)
Curator reputation (voucher weight based on the track record of the agents they vouch for), transitive weighting (vouchers who are themselves vouched for by others), decay over time, and invitation trees.

---

## 7. User flows

### F1. Register an agent (2 steps, prevents claiming someone else's address)
1. Owner: `RegisterAgent(cur, agentAddr, name, description, tags, pricingHint)` + `-send` self-stake → status `Pending`.
2. Agent (with its own key, e.g., via gnomcp `gno_call`): `AcceptRegistration(cur)` → status `Active`.

### F1b. Register a member (human, 1 step)
- `RegisterMember(cur, name, description)` + `-send` self-stake. The caller's address immediately becomes an `Active` Member profile.
- Members can be vouched for and have a trust score (same formula, §6.1), but **cannot be hired**. Slashing for members (e.g., through spam reports) is on the roadmap.

### F2. Vouch and unbond
- `Vouch(cur, agentAddr)` + `-send` GNOT. The stake increases and becomes **active after 3 days** (counted toward the trust score and the fee share).
- `RequestUnbond(cur, agentAddr, amount)` → enters the queue, `unlockAt = now + 7 days`. Rejected if there is an active dispute. Funds in the queue **can still be slashed** until `unlockAt`, and no longer count toward the trust score.
- `Withdraw(cur)` → releases all unbond queue entries that have passed the waiting period, plus any unclaimed rewards.

### F3. Hire (Quest)
1. Hirer: `CreateJob(cur, agentAddr, brief)` + `-send` price → `Open`, funds in escrow. `brief` must include **acceptance criteria**, since that is the jurors' standard in a dispute. The UI shows a warning that the brief and the result are **public**, along with the agent's remaining capacity.
   Additional parameter: `deadlineDays` (default 7). Rejected if the price < minimum, the target is not an `Active` Agent, or it exceeds the agent's **capacity**.
2. Agent: `AcceptJob(cur, jobID)` → `InProgress`. **Required**, within 2 days.
3. Agent: `Deliver(cur, jobID, result)` → `Delivered`, the 3-day timer starts. Must be before the deadline. `result` is the **work result text stored directly on chain** (max. 4 KB, OQ-4). Once submitted, this result cannot be changed.
4. Hirer: `Approve(cur, jobID)`, **or** anyone may call `Release(cur, jobID)` after 3 days → `Completed`. The fee is split per §5.
5. `CancelJob` → full refund to the hirer. May be called by:
   - the agent or owner, at any time before `Deliver`
   - the **hirer**, if the job has not been accepted within 2 days or not delivered before the deadline

### F4. Dispute
1. Hirer: `OpenDispute(cur, jobID, evidence)` (text on chain, max. 2 KB) + `-send` 10% → `Disputed`, the agent's stake is frozen.
   The electorate is snapshotted at that moment: council members **minus related parties** (owner, agent, hirer, that agent's vouchers).
2. Jurors (electorate members): `Vote(cur, disputeID, guilty bool, reason)`.
3. Anyone: `Resolve(cur, disputeID)` after quorum is reached **or** after 5 days → executes §5.

### F5. Consumption by other realms (Trust API)
```go
import "gno.land/r/<ns>/hireling"

func Post(cur realm, text string) {
    caller := cur.Previous().Address()
    if !hireling.IsTrusted(caller, 100) { panic("hireling: trust score too low") }
    // ...
}
```

### F6. Claim rewards
- Voucher rewards and juror pay accumulate in an internal ledger (pull payment). They are paid out through `Withdraw(cur)`.
- The Guild Treasury **has no withdrawal function** in the MVP.

---

## 8. Functional requirements

**Priority:** P0 = required for submission · P1 = target · P2 = bonus

| ID | Requirement | Prio |
|---|---|---|
| FR-01 | 2-step agent registration (owner + accept by agent) + 1-step **member** registration | P0 |
| FR-02 | Self-stake with a minimum; agent inactive if below the minimum | P0 |
| FR-03 | Vouch / RequestUnbond / Withdraw with a 7-day waiting period | P0 |
| FR-04 | Trust score (§6.1, with diversity bonus) + `TrustScore(addr)` + `IsTrusted(addr, min)` | P0 |
| FR-05 | **tavernboard** consumer realm that calls `IsTrusted` | P0 |
| FR-06 | `Render` pages: guild home, agent profile, voucher profile | P0 |
| FR-07 | Minimal job escrow: Create / Accept (required, 2 days) / Deliver (before deadline) / Approve / Release (auto after 3 days) / Cancel (including by the hirer on timeout), minimum price, capacity rule | P1 |
| FR-08 | 80/15/5 fee split (owner/vouchers/Treasury), voucher share pro-rata (pull payment via `Withdraw`) | P1 |
| FR-09 | Thin dispute: deposit as juror pay (same regardless of verdict, minimum 1 GNOT), stake freeze, 3-member council vote **excluding related parties**, Resolve, no-quorum fallback | P1 |
| FR-10 | Owner slash of 2× the price (juror pay, remainder to Treasury; victim only gets refund + deposit) + 10% voucher slash via share index (to Treasury), strikes, ban at 3 strikes, owner history, higher self-stake for owners who have been banned before | P1 |
| FR-10c | **Share-based** voucher accounting (reward-per-share + slash index), O(1) per operation | P1 |
| FR-10d | Council with a **3-day timelock** for membership changes; parameters as constants in `/p/` | P1 |
| FR-10b | **Guild Treasury**: transparent balance in Render, no withdrawal function in the MVP | P1 |
| FR-11 | Internal council module (see §9.5): members stored in `p/moul/addrset/v0`, managed by an admin (`p/nt/ownable/v0`), tally rules follow the Common DAO Spec | P1 |
| FR-12 | **Guild Hall SVG**: trust graph on the agent page (agent in the center, vouchers around it, line thickness by stake) using `p/nt/svg/v0` | P1 |
| FR-13 | TxLinks (`$help&func=...`) on Render pages for Vouch/Hire/Approve/Dispute | P1 |
| FR-14 | `chain.Emit` events on every important action | P1 |
| FR-15 | **AI agent runner**: a script (gnomcp or gnokey + LLM) that watches for new jobs, calls `AcceptJob`, performs one type of task (e.g., a short code review), then calls `Deliver` | **P1** |
| FR-16 | Landing page on the domain | P2 |

### 8.1 Non-functional requirements
| ID | Requirement |
|---|---|
| NFR-01 | **Security**: passes the 13-point Gno AI Contract Review checklist (see §10) |
| NFR-02 | Storage uses `avl.Tree` (not `map`) for collections that keep growing; pagination in Render |
| NFR-03 | All state changes go through crossing functions (`cur realm`); inputs are validated before mutation; `panic` to abort |
| NFR-04 | Token math uses `math/overflow` or is otherwise overflow-safe |
| NFR-05 | Test coverage: unit tests for every public function + **adversarial filetests** |
| NFR-06 | Render output is sanitized (`p/nt/markdown/sanitize/v0`). **User-supplied text is fully escaped** (no links, images, or HTML); name ≤ 32 characters, description ≤ 280 characters; address always shown next to the name |
| NFR-07 | Deploy to testnet **no later than 1 Dec** (to allow for the package approver queue) |

---

## 9. Technical architecture

### 9.1 Package structure (namespace = our `g1…` address)
```
gno.land/p/<g1addr>/hireling/      # pure: types, score math, fee split, validation (importable & testable separately)
gno.land/r/<g1addr>/hireling/      # main realm: registry, stake, job, dispute, council, Render, Trust API
gno.land/r/<g1addr>/tavernboard/   # consumer demo realm: a board that only trusted addresses can post to
```
The local workspace uses `gnowork.toml` so that `r/` can import `p/` during `gno test`.

### 9.2 Data model (sketch)
```go
type Profile struct {
    Addr, Owner       address       // Member: Owner == Addr
    Kind              ProfileKind   // Member, Agent (only Agents can be hired)
    Name, Desc        string
    Tags              []string
    Status            Status        // Pending, Active, Inactive, Banned
    SelfStake         int64         // ugnot
    TotalVouched      int64
    Strikes           int
    JobsDone, Disputes int
    CreatedAt         time.Time
}
type OwnerRecord struct { Owner address; Agents []address; BannedCount int }
type Pool struct { TotalShares, TotalAmount int64; AccRewardPerShare int64 } // Active & Inactive per agent (§9.3)
type Vouch struct { Voucher, Agent address; Shares, RewardDebt int64; InActive bool; Since time.Time }
type Unbond struct { Who, Agent address; Amount int64; UnlockAt time.Time }
type Job struct {
    ID uint64; Agent, Hirer address; Price int64
    Brief, Result string; Status JobStatus   // brief ≤ 2 KB, result ≤ 4 KB, stored on-chain
    CreatedAt, AcceptedAt, Deadline, DeliveredAt time.Time; DisputeID uint64
}
type Dispute struct {
    ID, JobID uint64; Deposit int64; Evidence string   // ≤ 2 KB, on-chain
    Votes map[address]bool   // small (≤ number of jurors) → map is safe
    OpenedAt time.Time; Resolved bool; Guilty bool
}
var treasury int64   // Guild Treasury (ugnot), no withdrawal function in the MVP
```
Indexes: `profiles avl.Tree` (addr → *Profile), `owners avl.Tree` (addr → *OwnerRecord), `vouches avl.Tree` (agent/voucher → *Vouch), `vouchesByVoucher`, `jobs avl.Tree` (seqid → *Job), `jobsByAgent`, `disputes`, `balances avl.Tree` (addr → claimable rewards).

### 9.3 Money and payment security
- Payments come in via `-send`: validate with `cur.Previous().IsUserCall()` + `unsafe.OriginSend().AmountOf("ugnot")`. **Do not use `IsUser()`**, because it also lets MsgRun through.
- Money goes out via `banker.NewBanker(banker.BankerTypeRealmSend, cur).SendCoins(realmAddr, to, coins)`, using the **pull pattern** (accumulate balances, then `Withdraw`) so there are no large send loops.
- Balances are read with `NewReadonlyBanker().GetCoin(addr, "ugnot")`, **not** `GetCoins`.
- No pointers to internal state are returned from public functions.

**Share-based voucher accounting (O(1), no loops):**
- Each agent has two voucher "pools":
  - **Active**: counted toward the trust score, earns a fee share, can be slashed.
  - **Inactive**: vouches still in the 3-day warm-up and funds that are unbonding. Can be slashed, but are not counted and earn no fees.
- Each pool stores `totalShares` and `totalAmount`. Vouchers hold **shares**. Share value = `share × totalAmount / totalShares`.
- **10% slash**: `totalAmount = totalAmount × 9 / 10` in both pools. A single operation is enough, and every voucher is automatically cut by 10%.
- **Fee share**: the *reward-per-share* (MasterChef) pattern. The variable `accRewardPerShare += reward × 1e12 / totalShares` (Active pool), and a voucher's reward = `share × accRewardPerShare − rewardDebt`. Also a single operation.
- **Activation**: after 3 days, a vouch is moved from Inactive to Active *lazily* on the voucher's next interaction, or via `Activate(cur, agent)`, which anyone can call.
- Mandatory unit tests for rounding: the total value of all shares never exceeds `totalAmount`.

### 9.4 Render (gnoweb)
| Path | Content |
|---|---|
| `/r/<ns>/hireling` | "The Guild Hall" home: top agents, latest jobs, statistics, parameters |
| `:agent/<addr>` | Agent or member profile: **SVG trust graph**, score with its breakdown (total, N, bonus, strikes), voucher list, job history, **owner history** (agents that have been banned), remaining job capacity, full address next to the name, Vouch/Hire buttons (TxLinks) |
| `:job/<id>` | Job details and status, Approve/Release/Dispute buttons |
| `:dispute/<id>` | Evidence and juror votes |
| `:voucher/<addr>` | Voucher portfolio: agents vouched for and rewards |
| `:council` | Juror members and active disputes, with an honest note that the demo council is the team |
| `:treasury` | Guild Treasury balance and history of incoming funds (fees, slashes) |

### 9.5 Council: internal module, based on the Common DAO Spec
OQ-2 decision: **do not use `p/nt/commondao/v0` directly**, because as of 25 Nov 2026 that package **is not yet deployed on either the Onyx testnet or mainnet** (a `vm/qfile` query returns `InvalidPackageError`; the code only exists on the `master` branch). We build our own small council module that **follows the Common DAO Spec voting rules** (Constitution, Appendix), the same ones `commondao` uses:
```
E  = snapshot of council members when the dispute is opened, minus related parties
     (owner, agent, hirer, that agent's vouchers); E empty ⇒ immediate fallback
D  = |E| − abstain
Guilty (pass)      ⇔ D > 0 && 2·yes > D        (simple majority)
Not guilty (dismiss) ⇔ 2·no > D
Not reached by the 5-day deadline ⇒ fallback: refund hirer, no slash
```
- The verdict is **final as soon as the outcome is mathematically certain** (early settlement), so there is no need to wait 5 days.
- Vote options: YES (guilty) / NO (not guilty) / ABSTAIN. Not voting counts against a guilty verdict.
- Members are stored in `gno.land/p/moul/addrset/v0` (already deployed); the admin uses `gno.land/p/nt/ownable/v0` (already deployed).
- **Roadmap:** migrate to `commondao` once that package lands on chain, so the council can govern itself through proposals.
- A plus for the pitch: our tally rules **match the Gno.land constitution**.

### 9.6 On-chain dependencies (verified present on testnet, 25 Nov 2026)
`p/nt/avl/v0` · `p/nt/avl/pager/v0` · `p/nt/seqid/v0` · `p/nt/ufmt/v0` · `p/nt/ownable/v0` · `p/nt/markdown/sanitize/v0` · `p/nt/testutils/v0` · `p/nt/uassert/v0` · `p/nt/urequire/v0` · `p/nt/svg/v0` · `p/moul/addrset/v0` · `p/moul/md/v0` · `p/moul/mdtable/v0` · `p/moul/txlink/v0`.
**Not yet available on chain:** `p/nt/commondao/v0`, `p/nt/addrset/v0`. The official documentation describes the `master` branch, which can be newer than the chain version. **Always check whether a package exists on chain before using it.**

### 9.7 Off-chain components (optional)
- **Agent runner** (**P1**, required for the demo): a small script (Go or TS) or a gnomcp session that polls jobs for the agent, calls `AcceptJob`, performs the task via an LLM (only one type of task, e.g., a short code review), then calls `Deliver`. This answers the question "where's the AI?".
- **Paid-action fallback UI** (depends on OQ-9): if TxLink cannot include `-send`, build a small web page with Adena for Vouch, Register, CreateJob, and OpenDispute.
- **Landing page** (P2) on the domain: explanation and links to gnoweb. Can use GnoConnect meta.

---

## 10. Security

Checklist (from the official Gno documentation):
1. Authentication only via `cur realm` (`cur.Previous().Address()`), never via an address parameter.
2. Payment guard uses `IsUserCall()` + `OriginSend`.
3. No exported pointers to internal state.
4. No calling callbacks from the caller.
5. No storing `realm` values.
6. No mixing `unsafe.PreviousRealm()` with `cur`.
7. Render is sanitized.
8. `GetCoin`, not `GetCoins`.
9. Validate first, mutate later, and `panic` to abort (errors do not revert).
10. No shadowing builtins (fails at deploy).

**Required adversarial filetests:**
- Claiming registration of an agent address owned by someone else → fails.
- Vouch or Create Job from a code realm (not an EOA) with a fake send → fails.
- Unbond during an active dispute → fails. Withdraw before `unlockAt` → fails.
- A juror voting twice, or a non-juror voting → fails.
- `Resolve` before its time without quorum → fails.
- Release before 3 days by anyone other than the hirer → fails.
- Fee split rounding never sends more than the escrowed funds (invariant: total out ≤ total in).
- Voucher slash: each voucher's share value drops by 10% (with round-down tolerance); the Treasury increases by exactly the decrease in `totalAmount` (no funds lost or created).
- 1,000 tiny vouches, then `Approve` and `Resolve` → gas stays constant (no loops).
- Admin changes the council → takes effect only after 3 days, and does not affect the electorate of disputes already opened.
- An agent description containing `[link](...)`, `![img](...)`, or HTML → displayed as plain text. A name longer than 32 characters → rejected.
- `OpenDispute` exactly at `T` → fails; `Release` exactly at `T` → succeeds.
- Hirer wins a dispute → their final balance is exactly the same as before hiring (no profit).
- **Self-dealing:** an owner hires their own agent through a second account and then wins the dispute → the combined balance of owner + second account **decreases**, and voucher balances do not flow to them.
- Funds in the unbond queue are also cut on a slash.
- Juror pay is identical for guilty and not-guilty verdicts; jurors who do not vote are not paid.
- An owner with 1 banned agent registers a new agent with 1× the minimum self-stake → fails (requires 2×).
- No public function can reduce the Treasury balance.
- A Member cannot be the target of `CreateJob`.
- `CreateJob` exceeding the agent's capacity, or below the minimum price → fails.
- Hirer calls `CancelJob` before the accept deadline or work deadline → fails; afterwards → succeeds with a full refund.
- A juror who is the owner, hirer, or a voucher of the disputed agent tries to vote → fails.
- A vouch that has not passed the 3-day warm-up adds neither score nor fee share, but is still cut on a slash.
- A vouch below the threshold does not increase N; a second vouch from the same voucher does not increase N (the diversity bonus cannot be pumped).

---

## 11. Demo plan

**Accounts:** Sinta (owner), AuditBot (agent key), Budi and Rina (vouchers), Joko (hirer), Juror1 (us) + **2 friends as real jurors**, plus one "other realm developer" account for tavernboard.

**So the trust graph doesn't look fake:**
- Invite **5–10 other hackathon participants** (via Discord) to vouch on testnet with faucet GNOT.
- Find **at least one other participating team** willing to call `IsTrusted` in their realm. This is real proof of adoption for the technical score and the Retention Prize. Start looking in week 1.

**Video storyboard (~3 minutes):**
1. Hook (15 sec): *"Anyone can create a new address or AI agent for free. Who's on the hook when that agent cheats?"*
2. Tavernboard: a new address fails to post. The problem is immediately visible.
3. Sinta registers AuditBot and puts up self-stake; AuditBot accepts via gnomcp.
4. Budi, Rina, and other participants vouch → **the SVG trust graph grows** in the Guild Hall, and the score and diversity bonus go up.
5. AuditBot can now post on tavernboard (proof of composability, a one-line import).
6. Joko hires → AuditBot delivers → Approve → the fee split is visible.
7. Second job: AuditBot cheats → dispute → jurors vote → slash, refund, strike → the score drops and the graph changes.
8. Closing: architecture, security (filetests), third-party realms already using `IsTrusted`, roadmap to mainnet.

The README states honestly which demo accounts belong to the team, and that the demo council is staffed by the team (a self-governing council is on the roadmap).

---

## 12. Timeline (25 Nov – 18 Dec 2026)

| Week | Dates | Target |
|---|---|---|
| **0** | 25–26 Nov | Set up toolchain (WSL or build from source), testnet wallet, faucet, repo structure, deploy "hello realm" to testnet. **Check OQ-9:** whether TxLink in gnoweb can include `-send` |
| **1** | 27 Nov – 3 Dec | **P0 core:** FR-01…06 (registry, stake, vouch, trust score, Trust API, tavernboard, basic Render), unit tests. **First deploy to testnet ≤ 1 Dec.** Post on Discord to find vouchers and teams willing to use `IsTrusted` |
| **2** | 4–10 Dec | FR-07…11 (escrow, fees, disputes, slashing, council), adversarial filetests |
| **3** | 11–15 Dec | FR-15 AI agent runner, FR-12 Guild Hall SVG, FR-13 TxLinks (or fallback UI), FR-14 events, Render polish, README, collect vouches from other participants |
| **Final** | 16–17 Dec | Feature freeze, final deploy, record video, fill in the DoraHacks form, **submit the evening of 17 Dec** |
| Deadline | 18 Dec 08:00 WIB | Buffer only, do not use it |

---

## 13. DoraHacks submission checklist
- [ ] Project name "Hireling" (does not start with "Gno")
- [ ] Testnet deploy link (`https://latest.testnets.gno.land/r/<g1addr>/hireling`), checked right before submitting
- [ ] Public GitHub repo + open source license
- [ ] README: what, why, how to use, architecture, parameters, security, how to integrate the Trust API, demo accounts
- [ ] Demo video (YouTube/Loom)
- [ ] Short description and tagline
- [ ] Join the Discord and post progress in `#gnome-tavern-hackathon`

---

## 14. Success metrics
- **Hackathon:** all P0 and P1 features working on testnet, at least 7 adversarial filetests passing, a clear video, placing in the top 16 (target: Top 2).
- **Retention (post-hackathon):** deploy to mainnet; 50 unique addresses in month 3 and 100 in month 6; **≥1 third-party realm using `IsTrusted`**; monthly releases; active X/Discord accounts.

---

## 15. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Scope too large for 3 weeks | Scope already trimmed in v2. P0 (registry + trust + tavernboard) is already a complete product; disputes can be cut down to an admin-only version if time is tight |
| "Plutocratic" criticism (the rich are the ones trusted) | `sqrt` + diversity bonus + strikes; explain in the README with the §6.1 example table |
| "How is this different from Kleros, Ethos, ERC-8004?" criticism | Native to Gno and importable by other realms in one line; proven by tavernboard and third-party realms |
| "This is just a bounty board" criticism | Escrow is only a supporting feature; the pitch starts from the Trust API |
| Economic loopholes (self-dealing, frivolous complaints, biased jurors, fleeing vouchers, admin power) | Fixed in §5.2 (#1–24) and locked down with adversarial filetests (§10) |
| Share accounting is harder for beginners | The MasterChef pattern is very well documented; written in `/p/` as pure functions and tested separately first. If time is tight: fall back to a loop with a voucher limit (the old v2 version), and disclose the risk in the README |
| "Trust score = bank balance" / "sqrt favors Sybils" criticism | That is exactly the concept: **deposit-based access** (on the Gno wishlist). Every identity that wants to pass `IsTrusted(addr, X)` must lock a real deposit, so 100 fake identities = 100× the cost. Splitting stake across many addresses actually drops each address below the threshold. **Do not claim "score = quality"**; the claim is "score = money at stake that can be lost" |
| "Why does it have to be on Gno?" criticism | (1) Other realms only need a **one-line import**, with no ABI, bridge, or oracle. (2) **Contract code is readable by anyone** in gnoweb's Source tab, and the rules are locked in an immutable `/p/`, so it can be publicly audited. (3) The UI comes straight from `Render`, with no server or indexer |
| "Agent keys can be sold" criticism | Ownership and self-stake remain recorded under the original owner. If the agent cheats after the key is sold, **the original owner bears the cost**, so owners are incentivized to guard their keys |
| "Who would hire AI on Gno?" / cold-start criticism | A real weakness, and acknowledged. The core product is the trust primitive (usable by anyone through `IsTrusted`); the marketplace is the first use case; the demo uses a real AI agent runner and vouches from other participants |
| "Spam on tavernboard can't be slashed" criticism | True in the MVP: for members, `IsTrusted` is a deposit gate, not a punishment. Member slashing through reports is on the roadmap (§18) |
| Hackathon judges ask "are the jurors your own team?" | Disclosed honestly; tally follows the Common DAO Spec; self-governing council on the roadmap (§18) |
| Treasury funds locked with no way out | Deliberate in the MVP so nobody can take them (including the team). A spending mechanism through the council and governance is on the roadmap; on mainnet a new realm can migrate the balance through a proposal |
| Why would anyone become a voucher? | A 15% fee share; vouchers help make the agent sell, since a large stake raises trust. The risk is real (−10% if the agent is guilty), so vouchers are incentivized to choose carefully, and the vouching signal becomes meaningful |
| Package approver queue on testnet | Deploy from week 1; check `vm/qpkgmeta_json`; ask on Discord |
| Testnet reset or having issues | Keep deploy scripts; redeploy as soon as possible |
| Limited faucet for many demo accounts | Small demo parameters (self-stake 10 GNOT); request faucet funds from several accounts early |
| Toolchain on Windows | Use WSL Ubuntu, or build from source with Go 1.26 |
| Trust graph cold-start (all accounts belong to the team) | Invite other participants to vouch on testnet; find one team that uses `IsTrusted`; README is honest about team accounts |
| Hackathon judges rate the project as "AI slop" | Code written and reviewed carefully, comprehensive tests, original and documented design |
| gnomcp Sessions are still pre-release | Hireling does not depend on Sessions; the agent uses its own key |
| Docs and `master` code are newer than the chain version (e.g., `commondao`, `p/nt/addrset` not yet deployed) | Only use packages proven to exist on chain (§9.6); local toolchain matched to the Onyx version; test in gnodev with `-remote gno.land=https://rpc.latest.testnets.gno.land:443` |

---

## 16. Open questions and decisions

### Decided
- **OQ-1 (burning `ugnot`) → NOT POSSIBLE.** In v1 this was redirected to the Guild Insurance Pool (explained below). **In v2 it was replaced by the Guild Treasury**, which holds the 5% fee, the remaining owner slash, and all voucher slashes, **with no withdrawal function** in the MVP (§5.2 #1). Insurance functions and Treasury usage will be decided through governance (§18).
  Facts from the source `gnovm/stdlibs/chain/banker/banker.gno`: `RemoveCoin` can only be called by a `BankerTypeRealmIssue` banker, and `assertCoinDenom` requires the denom to have the realm's own `"/" + pkgPath + ":"` prefix. So a realm can only burn tokens it issued itself, **not `ugnot`**. Sending to a "dead" address is also not credible, since there is no official burn address.
  *(v1 note, now roadmap)* The original replacement: a **Guild Insurance Pool**, an internal realm balance that (a) covers victim compensation if the agent's stake is not enough to cover the slash, and (b) is displayed transparently in Render. More useful than burning, and a good "guild insurance" story for the demo.
- **OQ-2 (council) → an internal module that follows the Common DAO Spec** (details in §9.5). Reason: `commondao` is not yet deployed on testnet or mainnet, is still v0 and *unaudited*, and its dependency (`p/nt/addrset/v0`) is not on chain either. Our own module is about 200 lines, easy to test, and can be migrated to commondao later.
- **OQ-5 (domain) → `hirelings.xyz`.**
- **OQ-8 (trust score formula) → `sqrt(total) × 10 × diversity bonus (max. +50%, 5 GNOT threshold) × strike penalty`** (§6.1). A per-voucher root was rejected because it is vulnerable to Sybils.
- **OQ-4 (storing work results) → directly on the blockchain, without IPFS or external services.** `brief` ≤ 2 KB, `result` ≤ 4 KB, `evidence` ≤ 2 KB, all text and escaped when rendered.
  - Storage cost about 0.1 GNOT per KB, paid by the caller (a 4 KB result ≈ 0.4 GNOT, paid by the agent).
  - Reasons: no additional service to maintain, results **cannot be changed** after `Deliver` (important for disputes), and jurors can read results directly in gnoweb.
  - Consequence: the demo agent only performs tasks with short results (e.g., a short code review). Large results via IPFS (CID on chain) are on the roadmap.
- **OQ-6 (language) → English** for everything in the repository: UI, README, video, code comments, and internal docs.

### Still open
- **OQ-3:** May an agent be owned or hired by another realm (not an EOA)? MVP: **EOA only**.
- **OQ-9:** Can a TxLink (`$help&func=...`) or the Actions tab in gnoweb include a `-send` amount? **Not yet verified.** To be checked in week 0. If not, paid actions use a small fallback UI with Adena (§9.7).
- **OQ-7:** The local toolchain version must match the Onyx chain version (check `UPGRADES.md` in `misc/deployments/onyx.gno.land/`). To be verified during week 0 setup.

---

## 17. Out of scope (MVP)
Payment with GRC20 tokens other than GNOT, realm-owned agents, verdict appeals, automatically selected jurors, transitive trust, a full React frontend, mainnet deployment (done after the hackathon).

Features dropped in v2 have been moved to the roadmap (§18).

---

## 18. Roadmap (post-hackathon)

### Phase 1: Mainnet and Retention (Jan – Feb 2027, months 1–3)
- Deploy to mainnet `gnoland-1` with mainnet parameters (self-stake 100 GNOT, voucher threshold 5 GNOT).
- Get at least one third-party realm to use `IsTrusted`, per the Retention Prize adoption requirement.
- Build a community on X and Discord; release at least once a month.
- Target 50 unique addresses in month 3.

### Phase 2: Real governance (months 3–6)
- **Self-governing council**: migrate to `commondao` as soon as that package is available on chain. Jurors can be added or replaced through proposals, not by the admin.
- **Automatically selected jurors** per dispute (a random sample from a pool of staked jurors), with secure randomness once the primitive is available.
- **Verdict appeals**: the hirer or owner can appeal to a larger panel with a higher deposit.
- **Guild Treasury spending through proposals**:
  - additional compensation for victims (e.g., for wasted time), decided case by case through a proposal, not automatically, so it does not create an incentive to accuse
  - juror pay bonuses
  - ecosystem grants
- Target 100 unique addresses in month 6.

### Phase 3: Smarter trust
- **Curator reputation**: a voucher's weight rises or falls according to the track record of the agents they vouch for.
- **Transitive trust**: vouches from vouchers who are themselves vouched for carry more weight.
- **Time decay**: old, inactive vouches gradually lose value.
- **Invitation tree**: new members can be invited by trusted members.
- **Owner-level strikes**: owners who repeatedly own agents that get banned receive a cross-agent penalty.
- **Slashing for members** through spam reports decided by the council.
- **Weighted voucher slash**, e.g., larger for vouchers who joined just before a dispute.

### Phase 4: A more complete marketplace
- **Pay-per-call (PAYG)** through payment channels, e.g., integration with Accrue (x402 batch-settlement).
- Payment with GRC20 tokens other than GNOT.
- **AI clerk**: a registered agent summarizes evidence and gives recommendations to jurors (human jurors still decide).
- **Encrypted briefs**, or only a hash on-chain, for work that needs privacy.
- **Large work results via IPFS**: the agent uploads a file (e.g., to Filebase/Pinata), then stores `ipfs://<CID>` on chain. The CID also serves as a fingerprint of the file's contents.
- Realm-owned agents (not EOAs).
- A ready-to-use agent runner script based on gnomcp.
- Full frontend at `hirelings.xyz`.
