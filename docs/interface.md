# Hireling public interface (frozen)

This file is the contract between workstreams. `sc/` implements it; filetests, `engine/` and `apps/fe` are written against it. It changes only through an issue labelled `interface-change`, approved by Ancung, in its own PR.

Behaviour, numbers and edge cases are defined in [`PRD-Hireling.md`](PRD-Hireling.md); section references below point there.

> Status: draft v0, written before the toolchain is installed. Signatures follow interrealm v2 (`cur realm`) as described in `gno-notes.md`; compile them once in week 0 and fix any syntax issue through an `interface-change` PR.

## Conventions

- Package paths: `gno.land/p/<ns>/hireling`, `gno.land/r/<ns>/hireling`, `gno.land/r/<ns>/tavernboard`, where `<ns>` is the team deployer address.
- Every state-changing function is a **crossing function** (`cur realm` first). Callers use `cross(cur)` from another realm; users call it with `gnokey maketx call`.
- Payments arrive with `-send` (ugnot). The realm validates them with `IsUserCall()` + `OriginSend`.
- All failures **panic** with a message starting with `hireling: ` (for example `hireling: price below minimum`). Returned errors are never used, because they do not revert state.
- Arguments are primitives only (`string`, `int`, `int64`, `uint64`, `bool`, `address`), so every function can be called from `gnokey` and TxLinks. Lists are comma-separated strings.
- Amounts are `int64` in ugnot. Times are Unix seconds.
- Read-only functions (no `cur realm`) are safe to call from other realms and through `vm/qeval`.

## `p/<ns>/hireling` (pure package)

Constants (PRD §5): `MinSelfStake`, `MinVouch`, `DiversityThreshold`, `DiversityCap`, `MinJobPrice`, `DisputeDepositBps`, `MinDisputeDeposit`, `AcceptWindow`, `DefaultDeadline`, `MaxDeadline`, `DisputeWindow`, `VoteWindow`, `UnbondDelay`, `VouchWarmup`, `SlashJobMultiplier`, `VoucherSlashBps`, `FeeOwnerBps`, `FeeVoucherBps`, `FeeTreasuryBps`, `StrikeLimit`, `CouncilTimelock`, `MaxBrief`, `MaxResult`, `MaxEvidence`, `MaxName`, `MaxDesc`.

```go
func ISqrt(x int64) int64
func TrustScore(totalStakeUgnot int64, diverseVouchers int, strikes int) int64   // PRD §6.1
func RequiredSelfStake(bannedAgents int) int64                                    // MinSelfStake × (1 + bannedAgents)
func SplitFee(price int64) (owner, vouchers, treasury int64)                      // sums exactly to price
func DisputeDeposit(price int64) int64                                            // max(10% of price, MinDisputeDeposit)
func OwnerSlash(price, selfStake int64) int64                                     // min(2 × price, selfStake)

// Share-based pool (PRD §9.3). O(1) per operation.
type Pool struct { /* TotalShares, TotalAmount, AccRewardPerShare */ }
func (p *Pool) Deposit(amount int64) (shares int64)
func (p *Pool) Withdraw(shares int64) (amount int64)
func (p *Pool) ValueOf(shares int64) int64
func (p *Pool) Slash(bps int64) (removed int64)
func (p *Pool) AddReward(amount int64)
func (p *Pool) PendingReward(shares, rewardDebt int64) int64
```

## `r/<ns>/hireling` (main realm)

### Registry (PRD F1, F1b)

```go
func RegisterAgent(cur realm, agent address, name, desc, tags string)  // owner; -send self-stake ≥ RequiredSelfStake
func AcceptRegistration(cur realm)                                     // called by the agent key; Pending → Active
func RegisterMember(cur realm, name, desc string)                      // -send self-stake ≥ MinSelfStake
func TopUpSelfStake(cur realm, target address)                         // owner; -send amount
```

### Stake (PRD F2)

```go
func Vouch(cur realm, target address)                       // -send ≥ MinVouch; inactive until VouchWarmup has passed
func Activate(cur realm, target address)                    // anyone; moves warmed-up vouches to the active pool
func RequestUnbond(cur realm, target address, amount int64) // voucher or owner; panics during an active dispute
func Withdraw(cur realm)                                    // pays out matured unbonds + pending rewards + juror pay
```

### Jobs (PRD F3)

```go
func CreateJob(cur realm, agent address, brief string, deadlineDays int) uint64 // -send price; returns job id
func AcceptJob(cur realm, id uint64)        // agent key
func Deliver(cur realm, id uint64, result string) // agent key; result ≤ MaxResult
func Approve(cur realm, id uint64)          // hirer
func Release(cur realm, id uint64)          // anyone, only when now ≥ T (DeliveredAt + DisputeWindow)
func CancelJob(cur realm, id uint64)        // agent/owner before Deliver; hirer after accept window or deadline
```

### Disputes and council (PRD F4, §9.5)

```go
func OpenDispute(cur realm, jobID uint64, evidence string) uint64 // hirer, only when now < T; -send DisputeDeposit(price)
func Vote(cur realm, disputeID uint64, choice, reason string)     // choice: "yes" (guilty) | "no" | "abstain"
func Resolve(cur realm, disputeID uint64)                         // anyone, once settled or after VoteWindow

func QueueCouncilChange(cur realm, member address, add bool) uint64 // admin; takes effect after CouncilTimelock
func ApplyCouncilChange(cur realm, changeID uint64)                 // anyone, after the timelock
```

### Trust API (read-only, PRD F5)

```go
func TrustScore(addr address) int64
func IsTrusted(addr address, min int64) bool // true when TrustScore(addr) >= min
```

### Read API for off-chain clients (read-only, for `engine` and `apps/fe` via `vm/qeval`)

```go
func OpenJobIDs(agent address) string // comma-separated ids of jobs in Open or InProgress for this agent
func JobJSON(id uint64) string         // {"id","agent","hirer","price","brief","result","status","createdAt","acceptedAt","deadline","deliveredAt","disputeId"}
func ProfileJSON(addr address) string  // {"addr","owner","kind","name","desc","status","selfStake","activeVouched","diverseVouchers","strikes","score","capacityLeft"}
func TreasuryBalance() int64
```

Status strings: profiles `pending|active|inactive|banned`; jobs `open|in_progress|delivered|disputed|completed|cancelled|refunded`.

### Render routes (PRD §9.4)

`""` (Guild Hall), `agent/<addr>`, `job/<id>`, `dispute/<id>`, `voucher/<addr>`, `council`, `treasury`.

### Events (`chain.Emit`)

`AgentRegistered`, `RegistrationAccepted`, `MemberRegistered`, `SelfStakeToppedUp`, `Vouched`, `VouchActivated`, `UnbondRequested`, `Withdrawn`, `JobCreated`, `JobAccepted`, `JobDelivered`, `JobApproved`, `JobReleased`, `JobCancelled`, `DisputeOpened`, `Voted`, `DisputeResolved`, `Slashed`, `Struck`, `Banned`, `CouncilChangeQueued`, `CouncilChangeApplied`.

## `r/<ns>/tavernboard` (demo consumer)

```go
func Post(cur realm, text string) // panics "tavernboard: trust score too low" unless hireling.IsTrusted(caller, MinScore)
func Render(path string) string
```
