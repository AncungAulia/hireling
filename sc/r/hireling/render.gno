package hireling

// Render pages for gnoweb (PRD §9.4, FR-06). Owner: Dilly.
//
// The Markdown contract is design/gnoweb-pages.md. Every user string goes
// through p/nt/markdown/sanitize/v0 before it reaches the page: InlineText
// for headings and lines, TableCell for table cells. User text never becomes
// a link, an image, a button label or part of an SVG; a name is always
// followed by its short address.
//
// The pages use the gnoweb extensions checked on the Onyx version
// (v1.8.0-rc.1): <gno-button>, <gno-icon> and > [!NOTE] alerts. The images
// are SVGs built in render_svg.gno.
//
// Render reads the realm through viewSource. The registry and stake code
// (Wikan, issue #4) provides the real source; until it lands, source is
// emptySource and every page shows its empty state.

import (
	"strconv"
	"strings"
	"time"

	"gno.land/p/nt/markdown/sanitize/v0"
)

const pageSize = 20

// webApp is where paid actions (register, vouch, hire) go until OQ-9 (#3)
// says whether a TxLink can attach -send. Free actions are TxLinks.
const webApp = "https://hirelings.xyz"

// Views: plain data the pages need, filled by the source.

type homeStats struct {
	TotalStake     int64 // ugnot
	OwnerStake     int64 // ugnot, self-stake of all profiles
	BackerStake    int64 // ugnot, vouched by others
	Profiles       int
	Agents         int
	Members        int
	JobsDone       int
	JobsInProgress int
	JobsDisputed   int
	Treasury       int64   // ugnot
	TreasuryTrail  []int64 // running total after each of the last incoming funds, oldest first, at most 7
}

type agentRow struct {
	Addr     address
	Name     string
	Score    int64
	Stake    int64 // ugnot, total at stake
	Backers  int   // backers counted
	JobsDone int
}

type profileView struct {
	Addr         address
	Kind         string // "agent" | "member"
	Name         string
	Desc         string
	Status       string // "pending" | "active" | "inactive" | "banned"
	Owner        address
	OwnerName    string
	SelfStake    int64 // ugnot
	TotalStake   int64 // ugnot
	Score        int64
	Counted      int // backers counted for the diversity bonus
	BonusPct     int // diversity bonus, percent
	StrikePct    int // strike factor, percent (100 = no penalty)
	Strikes      int
	CapacityLeft int64 // ugnot
	JobsDone     int
	OwnedAgents  int
	BannedAgents []nameAddr
}

type nameAddr struct {
	Name string
	Addr address
}

type backerRow struct {
	Addr    address
	Name    string
	Amount  int64  // ugnot
	Status  string // "active" | "warmup" | "unbonding"
	IsOwner bool
	At      int64 // unix: warm-up ends (warmup) or stake is free (unbonding)
}

type jobRow struct {
	ID      uint64
	Price   int64 // ugnot
	Status  string
	Updated int64 // unix
}

type vouchRow struct {
	Agent   address
	Name    string
	Stake   int64  // ugnot
	Status  string // "active" | "warmup" | "unbonding"
	At      int64  // unix, as in backerRow
	Rewards int64  // ugnot earned
}

type paramsView struct {
	MinSelfStake       int64 // ugnot
	MinVouch           int64 // ugnot
	DiversityThreshold int64 // ugnot
	WarmupDays         int
	UnbondDays         int
	FeeOwnerPct        int
	FeeBackerPct       int
	FeeTreasuryPct     int
	SlashJobMultiplier int
	BackerSlashPct     int
	StrikeLimit        int
}

// viewSource is what Render needs from the realm state. Lists are paged
// by the source, so a page never walks an unbounded collection.
type viewSource interface {
	stats() homeStats
	topAgents(offset, limit int) ([]agentRow, int)
	profile(addr address) (profileView, bool)
	backers(addr address, offset, limit int) ([]backerRow, int)
	jobsOf(addr address, offset, limit int) ([]jobRow, int)
	portfolio(addr address, offset, limit int) ([]vouchRow, int)
	pendingRewards(addr address) int64
	params() paramsView
	now() int64
}

type emptySource struct{}

func (emptySource) stats() homeStats                              { return homeStats{} }
func (emptySource) topAgents(int, int) ([]agentRow, int)          { return nil, 0 }
func (emptySource) profile(address) (profileView, bool)           { return profileView{}, false }
func (emptySource) backers(address, int, int) ([]backerRow, int)  { return nil, 0 }
func (emptySource) jobsOf(address, int, int) ([]jobRow, int)      { return nil, 0 }
func (emptySource) portfolio(address, int, int) ([]vouchRow, int) { return nil, 0 }
func (emptySource) pendingRewards(address) int64                  { return 0 }
func (emptySource) params() paramsView                            { return paramsView{} }
func (emptySource) now() int64                                    { return time.Now().Unix() }

var source viewSource = emptySource{}

// Render is called by gnoweb with the path after the realm, for example
// "agent/g1…?page=2".
func Render(path string) string {
	route, query := path, ""
	if i := strings.Index(path, "?"); i >= 0 {
		route, query = path[:i], path[i+1:]
	}
	page := pageFromQuery(query)
	switch {
	case route == "":
		return renderHome(source, page)
	case strings.HasPrefix(route, "agent/"):
		return renderAgent(source, strings.TrimPrefix(route, "agent/"), page)
	case strings.HasPrefix(route, "voucher/"):
		return renderVoucher(source, strings.TrimPrefix(route, "voucher/"), page)
	}
	return "# Page not found\n\nThere is no page at this path. Start from [the Guild Hall](:).\n" + footer()
}

// Pages

func renderHome(s viewSource, page int) string {
	var b strings.Builder
	st := s.stats()
	b.WriteString(image("Hireling, deposit-backed trust for Gno", bannerSVG()) + "\n\n")
	b.WriteString("# The Guild Hall\n\n")
	b.WriteString("Deposit-backed trust for Gno. Agents and members lock GNOT, others vouch with their own, and any realm checks the score in one line.\n\n")
	b.WriteString(image(statsAlt(st), statsSVG(st)) + "\n\n")
	b.WriteString(button(webApp+"/register?kind=agent", "Register an agent", "info") + "  " +
		button(webApp+"/register?kind=member", "Become a member", "outline") + "\n\n")
	b.WriteString(alert("NOTE", "Testnet only. For this demo, the council that judges disputes is the Hireling team."))

	b.WriteString("## Top agents\n\n")
	rows, total := s.topAgents((page-1)*pageSize, pageSize)
	if total == 0 {
		b.WriteString("No agents yet. Register one and it shows here once it has stake.\n\n")
	} else {
		if page == 1 {
			top := rows
			if len(top) > 5 {
				top = top[:5]
			}
			b.WriteString(image(boardAlt(top), boardSVG(top)) + "\n\n")
		}
		b.WriteString("| # | Agent | Score | At stake | Backers | Jobs done |\n|---|---|---:|---:|---:|---:|\n")
		for i, r := range rows {
			rank := (page-1)*pageSize + i + 1
			b.WriteString("| #" + strconv.Itoa(rank) + " | " + linkWho(r.Name, r.Addr) + " | **" + itoa(r.Score) + "** | " +
				gnot(r.Stake) + " | " + strconv.Itoa(r.Backers) + " | " + strconv.Itoa(r.JobsDone) + " |\n")
		}
		b.WriteString(pagerLinks(":", page, total, "agents"))
	}

	b.WriteString("## Check any address in your realm\n\n")
	b.WriteString("    if !hireling.IsTrusted(caller, 100) { panic(\"trust score too low\") }\n\n")

	p := s.params()
	b.WriteString("## Rules\n\n| Rule | Value |\n|---|---:|\n")
	b.WriteString("| Minimum self-stake | " + gnot(p.MinSelfStake) + " |\n")
	b.WriteString("| Minimum vouch | " + gnot(p.MinVouch) + " |\n")
	b.WriteString("| Vouch warm-up | " + plural(p.WarmupDays, "day") + " |\n")
	b.WriteString("| Unbond wait | " + plural(p.UnbondDays, "day") + " |\n")
	b.WriteString("| Fee split, owner, backers, treasury | " + strconv.Itoa(p.FeeOwnerPct) + "%, " +
		strconv.Itoa(p.FeeBackerPct) + "%, " + strconv.Itoa(p.FeeTreasuryPct) + "% |\n")
	b.WriteString("| Slash if guilty | " + strconv.Itoa(p.SlashJobMultiplier) + " × price from the owner, " +
		strconv.Itoa(p.BackerSlashPct) + "% from each backer |\n\n")
	b.WriteString("The rules are constants in an immutable package. Nobody can change them, including the team.\n")
	b.WriteString(footer())
	return b.String()
}

func renderAgent(s viewSource, raw string, page int) string {
	addr, ok := parseAddr(raw)
	if !ok {
		return notAddress()
	}
	v, found := s.profile(addr)
	if !found {
		return "# No profile at `" + short(addr) + "`\n\n" +
			"This address has not registered.\n\n" +
			button(webApp+"/register", "Register as a member or an agent", "info") + "\n" + footer()
	}
	var b strings.Builder
	isAgent := v.Kind == "agent"
	p := s.params()
	b.WriteString("# " + title(v.Name, addr) + "\n\n")
	b.WriteString("`" + short(addr) + "`  " + statusLine(v) + "\n\n")
	if v.Desc != "" {
		b.WriteString(sanitize.InlineText(v.Desc) + "\n\n")
	}
	if isAgent {
		b.WriteString("Owned by " + who(v.OwnerName, v.Owner) + ".\n\n")
	}
	b.WriteString(image(scoreAlt(v), scoreSVG(v, p)) + "\n\n")

	switch v.Status {
	case "banned":
		b.WriteString(alert("WARNING", "Banned after "+plural(v.Strikes, "strike")+". It cannot be vouched for or hired."))
	case "pending":
		b.WriteString(alert("WARNING", "Waiting for the agent key to accept the registration."))
		b.WriteString(button("$help&func=AcceptRegistration", "Accept registration", "success") + "\n\n")
	default:
		actions := button(webApp+"/vouch?agent="+addr.String(), "Vouch", "info")
		if isAgent && v.Status == "active" {
			actions += "  " + button(webApp+"/hire?agent="+addr.String(), "Hire", "outline")
		}
		b.WriteString(actions + "\n\n")
		b.WriteString(alert("TIP", "Vouching puts your GNOT behind this profile. If it is found guilty, each backer loses "+
			strconv.Itoa(p.BackerSlashPct)+"% and the owner loses "+strconv.Itoa(p.SlashJobMultiplier)+"× the job price."))
	}

	b.WriteString("## Score " + itoa(v.Score) + "\n\n| Part | Value |\n|---|---:|\n")
	b.WriteString("| Total at stake | " + gnot(v.TotalStake) + " |\n")
	b.WriteString("| Backers counted (" + gnot(p.DiversityThreshold) + " or more) | " + strconv.Itoa(v.Counted) + " |\n")
	b.WriteString("| Diversity bonus | +" + strconv.Itoa(v.BonusPct) + "% |\n")
	b.WriteString("| Strikes | " + strconv.Itoa(v.Strikes) + " of " + strconv.Itoa(p.StrikeLimit) + " |\n")
	if isAgent {
		b.WriteString("| Capacity left for new jobs | " + gnot(v.CapacityLeft) + " |\n")
	}
	b.WriteString("\nscore = floor(√" + gnotNumber(v.TotalStake) + " × 10 × " + pctFactor(100+v.BonusPct) +
		" × " + pctFactor(v.StrikePct) + ") = " + itoa(v.Score) + "\n\n")

	now := s.now()
	b.WriteString("## Backers\n\n")
	rows, total := s.backers(addr, (page-1)*pageSize, pageSize)
	if total == 0 {
		b.WriteString("No backers yet.\n\n")
	} else {
		b.WriteString("| Backer | Stake | Status |\n|---|---:|---|\n")
		for _, r := range rows {
			name := cellWho(r.Name, r.Addr)
			if r.IsOwner {
				name += " (owner)"
			}
			b.WriteString("| " + name + " | " + gnot(r.Amount) + " | " + stakeStatus(r.Status, r.At, now) + " |\n")
		}
		b.WriteString(pagerLinks(":agent/"+addr.String(), page, total, "backers"))
	}

	if isAgent {
		b.WriteString("## Jobs\n\n")
		jobs, jt := s.jobsOf(addr, 0, pageSize)
		if jt == 0 {
			b.WriteString("No jobs yet.\n\n")
		} else {
			b.WriteString("| Job | Price | Status | Updated |\n|---|---:|---|---|\n")
			for _, j := range jobs {
				id := strconv.FormatUint(j.ID, 10)
				b.WriteString("| [#" + id + "](:job/" + id + ") | " + gnot(j.Price) + " | " +
					withIcon(j.Status, strings.ReplaceAll(j.Status, "_", " ")) + " | " + utc(j.Updated) + " |\n")
			}
			b.WriteString("\n")
		}

		b.WriteString("## Owner history\n\n")
		line := who(v.OwnerName, v.Owner) + " owns " + plural(v.OwnedAgents, "agent") + ". "
		if len(v.BannedAgents) == 0 {
			line += "None has been banned."
		} else {
			names := make([]string, 0, len(v.BannedAgents))
			for _, a := range v.BannedAgents {
				names = append(names, who(a.Name, a.Addr))
			}
			line += strconv.Itoa(len(v.BannedAgents)) + " banned: " + strings.Join(names, ", ") + "."
		}
		b.WriteString(line + "\n")
	}
	b.WriteString(footer())
	return b.String()
}

func renderVoucher(s viewSource, raw string, page int) string {
	addr, ok := parseAddr(raw)
	if !ok {
		return notAddress()
	}
	v, registered := s.profile(addr)
	rows, total := s.portfolio(addr, (page-1)*pageSize, pageSize)
	var b strings.Builder
	if registered {
		b.WriteString("# " + title(v.Name, addr) + "\n\n")
	} else {
		b.WriteString("# Backer\n\n")
	}
	if total == 0 {
		b.WriteString("`" + short(addr) + "`  Backs no agents yet.\n" + footer())
		return b.String()
	}
	var sum int64
	for _, r := range rows {
		sum += r.Stake
	}
	ready := s.pendingRewards(addr)
	stakeText := gnot(sum)
	if total > len(rows) {
		stakeText = gnot(sum) + " on this page"
	}
	b.WriteString("`" + short(addr) + "`  Backs " + plural(total, "agent") + " with " + stakeText + ". " +
		gnot(ready) + " ready to withdraw.\n\n")

	now := s.now()
	b.WriteString("## Agents backed\n\n| Agent | Stake | Status | Rewards earned |\n|---|---:|---|---:|\n")
	for _, r := range rows {
		b.WriteString("| " + linkWho(r.Name, r.Agent) + " | " + gnot(r.Stake) + " | " +
			stakeStatus(r.Status, r.At, now) + " | " + gnot(r.Rewards) + " |\n")
	}
	b.WriteString(pagerLinks(":voucher/"+addr.String(), page, total, "agents"))
	b.WriteString("## Rewards\n\n")
	if ready > 0 {
		b.WriteString(button("$help&func=Withdraw", "Withdraw "+gnot(ready), "success") + "\n\n")
	} else {
		b.WriteString("Nothing to withdraw yet.\n\n")
	}
	b.WriteString(alert("NOTE", "A guilty verdict cuts "+strconv.Itoa(s.params().BackerSlashPct)+
		"% of each backer's stake, including stake that is still warming up or unbonding."))
	b.WriteString(footer())
	return b.String()
}

func notAddress() string {
	return "# Not a valid address\n\nA Gno address starts with g1 and has 40 characters.\n" + footer()
}

func footer() string {
	return "\n---\n\n[The Guild Hall](:)  [Council](:council)  [Treasury](:treasury)  [Source](./$source)\n\n" +
		"Testnet only. Hireling is not affiliated with Gno.land.\n"
}

// gnoweb pieces. Labels and hrefs are built by the realm from fixed words,
// numbers and addresses only, never from user text.

func button(href, label, variant string) string {
	return "<gno-button href=\"" + href + "\" label=\"" + label + "\" variant=\"" + variant + "\" />"
}

func alert(kind, text string) string {
	return "> [!" + kind + "]\n> " + text + "\n\n"
}

func image(alt, svg string) string {
	return "![" + alt + "](" + dataURI(svg) + ")"
}

var statusIcons = map[string]string{
	"active":      "check-circle",
	"completed":   "check-circle",
	"open":        "clock",
	"in_progress": "clock",
	"delivered":   "clock",
	"warmup":      "alarm",
	"unbonding":   "arrow-down",
	"banned":      "ban",
	"disputed":    "caution",
	"cancelled":   "close-circle",
	"refunded":    "close-circle",
}

// withIcon puts the gnoweb icon for a status in front of its words, so the
// status never depends on the icon alone.
func withIcon(status, words string) string {
	if name, ok := statusIcons[status]; ok {
		return "<gno-icon name=\"" + name + "\" /> " + words
	}
	return words
}

// Pieces

func statusLine(v profileView) string {
	kind := "Member"
	if v.Kind == "agent" {
		kind = "Agent"
	}
	if v.Status == "banned" {
		return kind + ", banned after " + plural(v.Strikes, "strike") + "."
	}
	return kind + ", " + v.Status + "."
}

func stakeStatus(status string, at, now int64) string {
	switch status {
	case "warmup":
		return withIcon(status, "warm-up, counts "+inDays(at, now))
	case "unbonding":
		return withIcon(status, "unbonding, free on "+day(at))
	}
	return withIcon(status, status)
}

// who is a name followed by its short address, for lines and headings.
func who(name string, addr address) string {
	if name == "" {
		return "`" + short(addr) + "`"
	}
	return sanitize.InlineText(name) + " `" + short(addr) + "`"
}

// cellWho is who for a table cell: `|` in a name must not open a column.
func cellWho(name string, addr address) string {
	if name == "" {
		return "`" + short(addr) + "`"
	}
	return sanitize.TableCell(name) + " `" + short(addr) + "`"
}

// linkWho links the escaped name to its profile, in a table cell.
func linkWho(name string, addr address) string {
	label := sanitize.TableCell(name)
	if label == "" {
		label = "Profile"
	}
	return "[" + label + "](:agent/" + addr.String() + ") `" + short(addr) + "`"
}

func title(name string, addr address) string {
	if name == "" {
		return "Profile " + short(addr)
	}
	return sanitize.InlineText(name)
}

func pagerLinks(base string, page, total int, noun string) string {
	pages := (total + pageSize - 1) / pageSize
	if pages <= 1 {
		return "\n"
	}
	sep := "?"
	if strings.Contains(base, "?") {
		sep = "&"
	}
	var links []string
	if page > 1 {
		links = append(links, "[Previous]("+base+sep+"page="+strconv.Itoa(page-1)+")")
	}
	if page < pages {
		next := total - page*pageSize
		if next > pageSize {
			next = pageSize
		}
		links = append(links, "[Next "+strconv.Itoa(next)+" "+noun+"]("+base+sep+"page="+strconv.Itoa(page+1)+")")
	}
	return "\nPage " + strconv.Itoa(page) + " of " + strconv.Itoa(pages) + ".  " + strings.Join(links, "  ") + "\n\n"
}

func pageFromQuery(q string) int {
	for _, kv := range strings.Split(q, "&") {
		if strings.HasPrefix(kv, "page=") {
			n, err := strconv.Atoi(strings.TrimPrefix(kv, "page="))
			if err == nil && n >= 1 && n <= 100000 {
				return n
			}
		}
	}
	return 1
}

func parseAddr(s string) (address, bool) {
	a := address(s)
	if !a.IsValid() {
		return "", false
	}
	return a, true
}

// Formatting

// short is "g1" plus 4 characters, an ellipsis and the last 4: g1jg8m…sqf5.
func short(a address) string {
	s := a.String()
	if len(s) < 12 {
		return s
	}
	return s[:6] + "…" + s[len(s)-4:]
}

// gnot formats ugnot as GNOT with the unit: 1500000 -> "1.5 GNOT".
func gnot(ugnot int64) string {
	return gnotNumber(ugnot) + " GNOT"
}

func gnotNumber(ugnot int64) string {
	neg := ugnot < 0
	if neg {
		ugnot = -ugnot
	}
	whole, frac := ugnot/1_000_000, ugnot%1_000_000
	s := groupThousands(strconv.FormatInt(whole, 10))
	if frac != 0 {
		f := strconv.FormatInt(frac, 10)
		f = strings.Repeat("0", 6-len(f)) + f
		s += "." + strings.TrimRight(f, "0")
	}
	if neg {
		s = "-" + s
	}
	return s
}

func groupThousands(d string) string {
	if len(d) <= 3 {
		return d
	}
	head := len(d) % 3
	var parts []string
	if head > 0 {
		parts = append(parts, d[:head])
	}
	for i := head; i < len(d); i += 3 {
		parts = append(parts, d[i:i+3])
	}
	return strings.Join(parts, ",")
}

// pctFactor turns 120 into "1.2" and 100 into "1.0".
func pctFactor(pct int) string {
	s := strconv.Itoa(pct/100) + "."
	rest := strings.TrimRight(strconv.Itoa(100 + pct%100)[1:], "0")
	if rest == "" {
		rest = "0"
	}
	return s + rest
}

func itoa(n int64) string { return strconv.FormatInt(n, 10) }

func plural(n int, noun string) string {
	if n == 1 {
		return "1 " + noun
	}
	return groupThousands(strconv.Itoa(n)) + " " + noun + "s"
}

func utc(unix int64) string {
	return time.Unix(unix, 0).UTC().Format("2 Jan 2006, 15:04 UTC")
}

func day(unix int64) string {
	return time.Unix(unix, 0).UTC().Format("2 Jan 2006")
}

func inDays(at, now int64) string {
	if at <= now {
		return "now"
	}
	d := int((at - now + 86399) / 86400)
	if d == 1 {
		return "in 1 day"
	}
	return "in " + strconv.Itoa(d) + " days"
}
