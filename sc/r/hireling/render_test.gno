package hireling

import (
	"encoding/base64"
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
	return homeStats{
		TotalStake: 12_480 * gnotU, OwnerStake: 3_120 * gnotU, BackerStake: 9_360 * gnotU,
		Profiles: 38, Agents: 24, Members: 14, JobsDone: 112, JobsInProgress: 9, JobsDisputed: 3,
		Treasury:      64_500_000,
		TreasuryTrail: []int64{5 * gnotU, 12 * gnotU, 20 * gnotU, 32 * gnotU, 62 * gnotU, 64_500_000},
	}
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
				Status: "active", Owner: sinta, OwnerName: "Sinta", SelfStake: 100 * gnotU, TotalStake: 400 * gnotU, Score: 240,
				Counted: 2, BonusPct: 20, StrikePct: 100, CapacityLeft: 100 * gnotU, JobsDone: 14, OwnedAgents: 1,
				ActiveBackers: 2, WarmingBackers: 1,
			},
			budi: {Addr: budi, Kind: "member", Name: "Budi", Status: "active", SelfStake: 10 * gnotU, TotalStake: 10 * gnotU, Score: 100, StrikePct: 100},
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

// svgs decodes every data: SVG image on a page.
func svgs(t *testing.T, page string) []string {
	var out []string
	const marker = "(data:image/svg+xml;base64,"
	for {
		i := strings.Index(page, marker)
		if i < 0 {
			return out
		}
		page = page[i+len(marker):]
		j := strings.Index(page, ")")
		raw, err := base64.StdEncoding.DecodeString(page[:j])
		urequire.NoError(t, err)
		out = append(out, string(raw))
		page = page[j:]
	}
}

const tick = "`"

func TestRenderHomeEmpty(t *testing.T) {
	out := Render("")
	urequire.True(t, strings.HasPrefix(out, "![Hireling, deposit-backed trust for Gno](data:image/svg+xml;base64,"))
	uassert.True(t, strings.Contains(out, "\n# The Guild Hall\n"))
	uassert.True(t, strings.Contains(out, "No agents yet."))
	uassert.True(t, strings.Contains(out, "Testnet only. Hireling is not affiliated with Gno.land."))
	uassert.Equal(t, 2, len(svgs(t, out))) // banner and stats, no board
}

func TestRenderHomeWithAgents(t *testing.T) {
	withSource(example(), func() {
		out := Render("")
		uassert.True(t, strings.Contains(out, "![12,480 GNOT at stake, 9,360 from backers. 38 profiles, 24 agents and 14 members. 112 jobs done, 9 in progress, 3 disputed. 64.5 GNOT in the Guild Treasury.]("))
		uassert.True(t, strings.Contains(out, "| #1 | [AuditBot](:agent/"+auditBot.String()+") "+tick+short(auditBot)+tick+" | **240** | 400 GNOT | 2 | 14 |"))
		uassert.True(t, strings.Contains(out, `<gno-button href="https://hirelings.xyz/register?kind=agent" label="Register an agent" variant="info" />`))
		uassert.True(t, strings.Contains(out, "> [!NOTE]\n> Testnet only. For this demo, the council that judges disputes is the Hireling team.\n"))
		uassert.True(t, strings.Contains(out, "| Fee split, owner, backers, treasury | 80%, 15%, 5% |"))
		images := svgs(t, out)
		urequire.Equal(t, 3, len(images)) // banner, stats, board
		uassert.True(t, strings.Contains(images[1], ">12,480</text>"))
		uassert.True(t, strings.Contains(images[1], "prefers-color-scheme:dark"))
		uassert.True(t, strings.Contains(images[1], ">75% put in by backers</text>"))
		uassert.True(t, strings.Contains(images[2], ">"+short(auditBot)+"</text>"))
	})
}

func TestRenderAgentShowsScoreAndBackers(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + auditBot.String())
		uassert.True(t, strings.HasPrefix(out, "# AuditBot\n"))
		uassert.True(t, strings.Contains(out, tick+short(auditBot)+tick+"  Agent, active."))
		uassert.True(t, strings.Contains(out, "Owned by Sinta "+tick+short(sinta)+tick+"."))
		uassert.True(t, strings.Contains(out, "![Trust score 240 for "+short(auditBot)+". 400 GNOT at stake, 100 from the owner and 300 from backers."))
		uassert.True(t, strings.Contains(out, `label="Vouch" variant="info"`))
		uassert.True(t, strings.Contains(out, `label="Hire" variant="outline"`))
		uassert.True(t, strings.Contains(out, "> [!TIP]\n> Vouching puts your GNOT behind this profile. If it is found guilty, each backer loses 10% and the owner loses 2× the job price."))
		uassert.True(t, strings.Contains(out, "## Score 240"))
		uassert.True(t, strings.Contains(out, "| Backers counted (1 GNOT or more) | 2 |"))
		uassert.True(t, strings.Contains(out, "score = floor(√400 × 10 × 1.2 × 1.0) = 240"))
		uassert.True(t, strings.Contains(out, "| Sinta "+tick+short(sinta)+tick+` (owner) | 100 GNOT | <gno-icon name="check-circle" /> active |`))
		uassert.True(t, strings.Contains(out, "| "+tick+short(newbie)+tick+` | 48 GNOT | <gno-icon name="alarm" /> warm-up, counts in 2 days |`))
		uassert.True(t, strings.Contains(out, `| [#12](:job/12) | 50 GNOT | <gno-icon name="check-circle" /> completed | 27 Nov 2026, 14:00 UTC |`))
		uassert.True(t, strings.Contains(out, "owns 1 agent. None has been banned."))
		card := svgs(t, out)[0]
		uassert.True(t, strings.Contains(card, ">240</text>"))
		uassert.True(t, strings.Contains(card, ">+20% diversity</text>"))
		uassert.True(t, strings.Contains(card, ">25% owner</text>"))
		uassert.True(t, strings.Contains(card, ">capacity left for jobs</text>"))
	})
}

func TestRenderMemberHasNoJobsOrHire(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + budi.String())
		uassert.True(t, strings.Contains(out, "Member, active."))
		uassert.True(t, strings.Contains(out, `label="Vouch"`))
		uassert.False(t, strings.Contains(out, `label="Hire"`))
		uassert.False(t, strings.Contains(out, "## Jobs"))
		uassert.False(t, strings.Contains(out, "Capacity left"))
		uassert.False(t, strings.Contains(svgs(t, out)[0], "capacity left"))
	})
}

func TestRenderBannedAgent(t *testing.T) {
	s := example()
	v := s.profiles[auditBot]
	v.Status, v.Strikes = "banned", 3
	s.profiles[auditBot] = v
	withSource(s, func() {
		out := Render("agent/" + auditBot.String())
		uassert.True(t, strings.Contains(out, "Agent, banned after 3 strikes."))
		uassert.True(t, strings.Contains(out, "> [!WARNING]\n> Banned after 3 strikes. It cannot be vouched for or hired."))
		uassert.False(t, strings.Contains(out, "<gno-button"))
	})
}

func TestRenderPendingAgent(t *testing.T) {
	s := example()
	v := s.profiles[auditBot]
	v.Status = "pending"
	s.profiles[auditBot] = v
	withSource(s, func() {
		out := Render("agent/" + auditBot.String())
		uassert.True(t, strings.Contains(out, `<gno-button href="$help&func=AcceptRegistration" label="Accept registration" variant="success" />`))
		uassert.False(t, strings.Contains(out, `label="Vouch"`))
	})
}

func TestRenderNoProfile(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + newbie.String())
		uassert.True(t, strings.HasPrefix(out, "# No profile at "+tick+short(newbie)+tick+"\n"))
		uassert.True(t, strings.Contains(out, `label="Register as a member or an agent"`))
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
	row := `| 1 GNOT | <gno-icon name="check-circle" /> active |`
	withSource(s, func() {
		p1 := Render("agent/" + auditBot.String())
		uassert.Equal(t, 20, strings.Count(p1, row))
		uassert.True(t, strings.Contains(p1, "Page 1 of 3.  [Next 20 backers]("+base+"?page=2)"))
		p3 := Render("agent/" + auditBot.String() + "?page=3")
		uassert.Equal(t, 5, strings.Count(p3, row))
		uassert.True(t, strings.Contains(p3, "[Previous]("+base+"?page=2)"))
		uassert.False(t, strings.Contains(p3, "[Next"))
	})
}

func TestRenderHomeBoardOnlyOnFirstPage(t *testing.T) {
	s := example()
	for i := 0; i < 25; i++ {
		s.agents = append(s.agents, agentRow{Addr: testutils.TestAddress("a" + strconv.Itoa(i)), Name: "A", Score: 10, Stake: gnotU})
	}
	withSource(s, func() {
		p1 := Render("")
		images := svgs(t, p1)
		urequire.Equal(t, 3, len(images))
		uassert.Equal(t, 5, strings.Count(images[2], ">trust score "))
		p2 := Render("?page=2")
		uassert.Equal(t, 2, len(svgs(t, p2)))
		uassert.True(t, strings.Contains(p2, "| #21 | "))
	})
}

func TestRenderVoucherPortfolio(t *testing.T) {
	withSource(example(), func() {
		out := Render("voucher/" + budi.String())
		uassert.True(t, strings.HasPrefix(out, "# Budi\n"))
		uassert.True(t, strings.Contains(out, "Backs 1 agent with 200 GNOT. 3.4 GNOT ready to withdraw."))
		uassert.True(t, strings.Contains(out, "| [AuditBot](:agent/"+auditBot.String()+") "+tick+short(auditBot)+tick+` | 200 GNOT | <gno-icon name="check-circle" /> active | 3 GNOT |`))
		uassert.True(t, strings.Contains(out, `<gno-button href="$help&func=Withdraw" label="Withdraw 3.4 GNOT" variant="success" />`))
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
		`" onload="x`,
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
				uassert.False(t, strings.Contains(out, "`code`"), name)
				for _, line := range strings.Split(out, "\n") {
					if strings.HasPrefix(line, "|") {
						uassert.False(t, strings.Contains(line, "a | b"), line)
					}
					if strings.Contains(line, "<gno-button") {
						uassert.False(t, strings.Contains(line, "Approve"), line)
						uassert.False(t, strings.Contains(line, "onload"), line)
					}
				}
				// No user text ever reaches an SVG.
				for _, img := range svgs(t, out) {
					uassert.False(t, strings.Contains(img, "Approve"), name)
					uassert.False(t, strings.Contains(img, "evil"), name)
					uassert.False(t, strings.Contains(img, "<img"), name)
					uassert.False(t, strings.Contains(img, "onload"), name)
					uassert.False(t, strings.Contains(img, "AuditBot"), name)
				}
			}
		})
	}
}

func TestSVGSizes(t *testing.T) {
	s := example()
	v, _ := s.profile(auditBot)
	uassert.True(t, len(bannerSVG()) <= 6*1024, "banner "+strconv.Itoa(len(bannerSVG())))
	uassert.True(t, len(scoreSVG(v, s.params())) <= 10*1024, "score "+strconv.Itoa(len(scoreSVG(v, s.params()))))
	uassert.True(t, len(statsSVG(s.stats())) <= 10*1024, "stats "+strconv.Itoa(len(statsSVG(s.stats()))))
	rows := make([]agentRow, 5)
	for i := range rows {
		rows[i] = agentRow{Addr: testutils.TestAddress("z" + strconv.Itoa(i)), Score: 100, Stake: gnotU}
	}
	uassert.True(t, len(boardSVG(rows)) <= 10*1024, "board "+strconv.Itoa(len(boardSVG(rows))))
}

func TestStatsSVGWithNoData(t *testing.T) {
	out := statsSVG(homeStats{})
	uassert.True(t, strings.Contains(out, ">0%</text>"))
	uassert.True(t, strings.Contains(out, ">Fees and slashes land here</text>"))
}

func TestIdenticonIsStable(t *testing.T) {
	a, b, c := &svgDoc{}, &svgDoc{}, &svgDoc{}
	identicon(a, 0, 0, auditBot)
	identicon(b, 0, 0, auditBot)
	identicon(c, 0, 0, budi)
	uassert.Equal(t, a.b.String(), b.b.String())
	uassert.NotEqual(t, a.b.String(), c.b.String())
}

func TestRingPoint(t *testing.T) {
	x, y := ringPoint(100, 100, 10, 25)
	uassert.Equal(t, 110, x)
	uassert.Equal(t, 100, y)
	x, y = ringPoint(100, 100, 10, 50)
	uassert.Equal(t, 100, x)
	uassert.Equal(t, 110, y)
}

func TestTrustGraphOnAgentPage(t *testing.T) {
	withSource(example(), func() {
		out := Render("agent/" + auditBot.String())
		uassert.True(t, strings.Contains(out, "![Trust graph of "+short(auditBot)+", score 240, 4 backers including the owner, 400 GNOT at stake]("))
		images := svgs(t, out)
		urequire.Equal(t, 2, len(images)) // score card, graph
		g := images[1]
		uassert.Equal(t, 4*2+2+3, strings.Count(g, "<polygon")) // 4 nodes x (ring, node), agent outer and inner, 3 legend marks
		uassert.True(t, strings.Contains(g, ">"+short(sinta)+"</text>"))
		uassert.True(t, strings.Contains(g, ">100 GNOT, owner</text>"))
		uassert.True(t, strings.Contains(g, ">48 GNOT, warm-up</text>"))
		uassert.True(t, strings.Contains(g, `stroke-dasharray="6 6"`))
		uassert.True(t, strings.Contains(g, ">Stake behind "+short(auditBot)+"</text>"))
		uassert.False(t, strings.Contains(g, "Sinta"))
		uassert.False(t, strings.Contains(g, "AuditBot"))
	})
}

func TestTrustGraphCapsNodes(t *testing.T) {
	v := example().profiles[auditBot]
	var rows []backerRow
	rows = append(rows, backerRow{Addr: sinta, Amount: 100 * gnotU, Status: "active", IsOwner: true})
	for i := 0; i < 11; i++ {
		rows = append(rows, backerRow{Addr: testutils.TestAddress("g" + strconv.Itoa(i)), Amount: int64(60-i) * gnotU, Status: "active"})
	}
	g := graphSVG(v, rows, 30)
	uassert.True(t, strings.Contains(g, ">+19</text>"))
	uassert.True(t, len(g) <= 12*1024, "graph "+strconv.Itoa(len(g)))
	// 11 nodes shown, the 12th slot is "+19", and no chips when crowded.
	uassert.Equal(t, 11, strings.Count(g, `opacity="0.12"/>`))
	uassert.False(t, strings.Contains(g, ", owner</text>"))
}

func TestTrustGraphStates(t *testing.T) {
	v := example().profiles[auditBot]
	v.Status = "banned"
	g := graphSVG(v, []backerRow{{Addr: sinta, Amount: 100 * gnotU, Status: "active", IsOwner: true}}, 1)
	uassert.True(t, strings.Contains(g, `fill="#3A3F55" stroke="#FF7A7A" stroke-width="3"`))
	uassert.True(t, strings.Contains(g, ">No backers yet</text>"))
}

func TestIsqrt(t *testing.T) {
	uassert.Equal(t, int64(0), isqrt(0))
	uassert.Equal(t, int64(1), isqrt(3))
	uassert.Equal(t, int64(100), isqrt(10000))
	uassert.Equal(t, int64(70), isqrt(5000))
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
