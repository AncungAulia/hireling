package hireling

import (
	"strconv"
	"strings"
	"testing"

	"gno.land/p/nt/testutils/v0"
	"gno.land/p/nt/uassert/v0"
	"gno.land/p/nt/urequire/v0"
)

const gnotU = 1_000_000

var (
	auditBot = testutils.TestAddress("auditbot")
	sinta    = testutils.TestAddress("sinta")
	budi     = testutils.TestAddress("budi")
	rina     = testutils.TestAddress("rina")
	newbie   = testutils.TestAddress("newbie")
	nowUnix  = int64(1795867200) // 28 Nov 2026, 12:00 UTC
)

// fakeSource is a viewSource with fixed data, the §6.1 example of PRD.
type fakeSource struct {
	agents   []agentRow
	profiles map[address]profileView
	backs    map[address][]backerRow
	jobs     map[address][]jobRow
	folio    map[address][]vouchRow
	rewards  map[address]int64
}

func (f *fakeSource) stats() homeStats {
	return homeStats{TotalStake: 12_480 * gnotU, Profiles: 38, JobsDone: 112, Treasury: 64_500_000}
}

func (f *fakeSource) topAgents(offset, limit int) ([]agentRow, int) {
	return window(f.agents, offset, limit), len(f.agents)
}

func (f *fakeSource) profile(a address) (profileView, bool) {
	v, ok := f.profiles[a]
	return v, ok
}

func (f *fakeSource) backers(a address, offset, limit int) ([]backerRow, int) {
	rows := f.backs[a]
	end := offset + limit
	if offset > len(rows) {
		offset = len(rows)
	}
	if end > len(rows) {
		end = len(rows)
	}
	return rows[offset:end], len(rows)
}

func (f *fakeSource) jobsOf(a address, offset, limit int) ([]jobRow, int) {
	return f.jobs[a], len(f.jobs[a])
}

func (f *fakeSource) portfolio(a address, offset, limit int) ([]vouchRow, int) {
	return f.folio[a], len(f.folio[a])
}

func (f *fakeSource) pendingRewards(a address) int64 { return f.rewards[a] }

func (f *fakeSource) params() paramsView {
	return paramsView{
		MinSelfStake: 10 * gnotU, MinVouch: 1 * gnotU, DiversityThreshold: 1 * gnotU,
		WarmupDays: 3, UnbondDays: 7, FeeOwnerPct: 80, FeeBackerPct: 15, FeeTreasuryPct: 5,
		SlashJobMultiplier: 2, BackerSlashPct: 10, StrikeLimit: 3,
	}
}

func (f *fakeSource) now() int64 { return nowUnix }

func window(rows []agentRow, offset, limit int) []agentRow {
	if offset > len(rows) {
		return nil
	}
	end := offset + limit
	if end > len(rows) {
		end = len(rows)
	}
	return rows[offset:end]
}

func example() *fakeSource {
	return &fakeSource{
		agents: []agentRow{{Addr: auditBot, Name: "AuditBot", Score: 240, Stake: 400 * gnotU, Backers: 2, JobsDone: 14}},
		profiles: map[address]profileView{
			auditBot: {
				Addr: auditBot, Kind: "agent", Name: "AuditBot", Desc: "Reviews Gno realms against the security checklist.",
				Status: "active", Owner: sinta, OwnerName: "Sinta", TotalStake: 400 * gnotU, Score: 240,
				Counted: 2, BonusPct: 20, StrikePct: 100, CapacityLeft: 100 * gnotU, OwnedAgents: 1,
			},
			budi: {Addr: budi, Kind: "member", Name: "Budi", Status: "active", Score: 100, StrikePct: 100},
		},
		backs: map[address][]backerRow{
			auditBot: {
				{Addr: sinta, Name: "Sinta", Amount: 100 * gnotU, Status: "active", IsOwner: true},
				{Addr: budi, Name: "Budi", Amount: 200 * gnotU, Status: "active"},
				{Addr: rina, Name: "Rina", Amount: 100 * gnotU, Status: "active"},
				{Addr: newbie, Amount: 48 * gnotU, Status: "warmup", At: nowUnix + 2*86400},
			},
		},
		jobs: map[address][]jobRow{auditBot: {{ID: 12, Price: 50 * gnotU, Status: "completed", Updated: 1795788000}}},
		folio: map[address][]vouchRow{
			budi: {{Agent: auditBot, Name: "AuditBot", Stake: 200 * gnotU, Status: "active", Rewards: 3 * gnotU}},
		},
		rewards: map[address]int64{budi: 3_400_000},
	}
}

func withSource(s viewSource, fn func()) {
	old := source
	source = s
	defer func() { source = old }()
	fn()
}

func TestRenderHomeEmpty(t *testing.T) {
	out := Render("")
	urequire.True(t, strings.HasPrefix(out, "# The Guild Hall\n"))
	uassert.True(t, strings.Contains(out, "No agents yet."))
	uassert.True(t, strings.Contains(out, "Testnet only. Hireling is not affiliated with Gno.land."))
}

func TestRenderHomeWithAgents(t *testing.T) {
	withSource(example(), func() {
		out := Render("")
		uassert.True(t, strings.Contains(out, "12,480 GNOT at stake across 38 profiles. 112 jobs done. 64.5 GNOT in the Guild Treasury."))
		uassert.True(t, strings.Contains(out, "| [AuditBot](:agent/"+auditBot.String()+") `"+short(auditBot)+"` | 240 | 400 GNOT | 2 | 14 |"))
		uassert.True(t, strings.Contains(out, "| Fee split, owner, backers, treasury | 80%, 15%, 5% |"))
		uassert.True(t, strings.Contains(out, "| Slash if guilty | 2 × price from the owner, 10% from each backer |"))
	})
}

func TestRenderAgentShowsScoreAndBackers(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + auditBot.String())
		uassert.True(t, strings.HasPrefix(out, "# AuditBot\n"))
		uassert.True(t, strings.Contains(out, "`"+short(auditBot)+"`  Agent, active."))
		uassert.True(t, strings.Contains(out, "Owned by Sinta `"+short(sinta)+"`."))
		uassert.True(t, strings.Contains(out, "## Score 240"))
		uassert.True(t, strings.Contains(out, "| Backers counted (1 GNOT or more) | 2 |"))
		uassert.True(t, strings.Contains(out, "| Capacity left for new jobs | 100 GNOT |"))
		uassert.True(t, strings.Contains(out, "score = floor(√400 × 10 × 1.2 × 1.0) = 240"))
		uassert.True(t, strings.Contains(out, "| Sinta `"+short(sinta)+"` (owner) | 100 GNOT | active |"))
		uassert.True(t, strings.Contains(out, "| Budi `"+short(budi)+"` | 200 GNOT | active |"))
		uassert.True(t, strings.Contains(out, "| `"+short(newbie)+"` | 48 GNOT | warm-up, counts in 2 days |"))
		uassert.True(t, strings.Contains(out, "| [#12](:job/12) | 50 GNOT | completed | 27 Nov 2026, 14:00 UTC |"))
		uassert.True(t, strings.Contains(out, "owns 1 agent. None has been banned."))
	})
}

func TestRenderMemberHasNoJobs(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + budi.String())
		uassert.True(t, strings.Contains(out, "Member, active."))
		uassert.False(t, strings.Contains(out, "## Jobs"))
		uassert.False(t, strings.Contains(out, "Capacity left"))
	})
}

func TestRenderBannedAgent(t *testing.T) {
	s := example()
	v := s.profiles[auditBot]
	v.Status, v.Strikes = "banned", 3
	s.profiles[auditBot] = v
	withSource(s, func() {
		uassert.True(t, strings.Contains(Render("agent/"+auditBot.String()), "Agent, banned after 3 strikes."))
	})
}

func TestRenderNoProfile(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + newbie.String())
		uassert.True(t, strings.HasPrefix(out, "# No profile at `"+short(newbie)+"`\n"))
	})
}

func TestRenderInvalidAddress(t *testing.T) {
	for _, p := range []string{"agent/hello", "agent/", "voucher/g1nope"} {
		uassert.True(t, strings.HasPrefix(Render(p), "# Not a valid address\n"), p)
	}
}

func TestRenderUnknownRoute(t *testing.T) {
	uassert.True(t, strings.HasPrefix(Render("nope"), "# Page not found\n"))
}

func TestRenderPagesBackers(t *testing.T) {
	s := example()
	var rows []backerRow
	for i := 0; i < 45; i++ {
		rows = append(rows, backerRow{Addr: testutils.TestAddress("b" + strconv.Itoa(i)), Amount: gnotU, Status: "active"})
	}
	s.backs[auditBot] = rows
	base := ":agent/" + auditBot.String()
	withSource(s, func() {
		p1 := Render("agent/" + auditBot.String())
		uassert.Equal(t, 20, strings.Count(p1, "| 1 GNOT | active |"))
		uassert.True(t, strings.Contains(p1, "Page 1 of 3.  [Next 20 backers]("+base+"?page=2)"))
		p3 := Render("agent/" + auditBot.String() + "?page=3")
		uassert.Equal(t, 5, strings.Count(p3, "| 1 GNOT | active |"))
		uassert.True(t, strings.Contains(p3, "[Previous]("+base+"?page=2)"))
		uassert.False(t, strings.Contains(p3, "[Next"))
	})
}

func TestRenderVoucherPortfolio(t *testing.T) {
	withSource(example(), func() {
		out := Render("voucher/" + budi.String())
		uassert.True(t, strings.HasPrefix(out, "# Budi\n"))
		uassert.True(t, strings.Contains(out, "Backs 1 agent with 200 GNOT. 3.4 GNOT ready to withdraw."))
		uassert.True(t, strings.Contains(out, "| [AuditBot](:agent/"+auditBot.String()+") `"+short(auditBot)+"` | 200 GNOT | active | 3 GNOT |"))
	})
}

func TestRenderVoucherEmpty(t *testing.T) {
	withSource(example(), func() {
		out := Render("voucher/" + newbie.String())
		uassert.True(t, strings.HasPrefix(out, "# Backer\n"))
		uassert.True(t, strings.Contains(out, "Backs no agents yet."))
	})
}

func TestRenderEscapesUserText(t *testing.T) {
	evil := []string{
		"[Approve](javascript:alert(1))",
		"![x](https://evil.example/a.png)",
		"<img src=x>",
		"a | b",
		"# big",
		"line\n# injected",
		"`code`",
	}
	for _, name := range evil {
		s := example()
		v := s.profiles[auditBot]
		v.Name, v.Desc, v.OwnerName = name, name, name
		s.profiles[auditBot] = v
		s.agents[0].Name = name
		s.backs[auditBot][1].Name = name
		withSource(s, func() {
			for _, out := range []string{Render("agent/" + auditBot.String()), Render("")} {
				uassert.False(t, strings.Contains(out, "[Approve]("), name)
				uassert.False(t, strings.Contains(out, "![x]("), name)
				uassert.False(t, strings.Contains(strings.ReplaceAll(out, `\<`, ""), "<img"), name)
				uassert.False(t, strings.Contains(out, "\n# big"), name)
				uassert.False(t, strings.Contains(out, "\n# injected"), name)
				for _, line := range strings.Split(out, "\n") {
					if strings.HasPrefix(line, "|") {
						uassert.False(t, strings.Contains(line, "a | b"), line)
					}
				}
				uassert.False(t, strings.Contains(out, "`code`"), name)
			}
		})
	}
}

func TestFormatting(t *testing.T) {
	uassert.Equal(t, "1.5 GNOT", gnot(1_500_000))
	uassert.Equal(t, "0.1 GNOT", gnot(100_000))
	uassert.Equal(t, "0.000001 GNOT", gnot(1))
	uassert.Equal(t, "0 GNOT", gnot(0))
	uassert.Equal(t, "1,234 GNOT", gnot(1_234_000_000))
	uassert.Equal(t, "1,234,567.89 GNOT", gnot(1_234_567_890_000))
	uassert.Equal(t, "1.2", pctFactor(120))
	uassert.Equal(t, "1.0", pctFactor(100))
	uassert.Equal(t, "0.75", pctFactor(75))
	uassert.Equal(t, "27 Nov 2026, 14:00 UTC", utc(1795788000))
	uassert.Equal(t, "in 2 days", inDays(nowUnix+2*86400, nowUnix))
	uassert.Equal(t, "in 1 day", inDays(nowUnix+60, nowUnix))
	uassert.Equal(t, 1, pageFromQuery("page=0"))
	uassert.Equal(t, 3, pageFromQuery("x=1&page=3"))
	uassert.Equal(t, 1, pageFromQuery("page=abc"))
}
