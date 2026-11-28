package hireling

// SVG images for the gnoweb pages. Owner: Dilly.
//
// Contract: design/guild-hall-svg.md (§9 banner, §10 score card, §11 top
// agents board, §13 guild stats). Every number is an integer coordinate and
// every text is built from numbers, fixed words and addresses. No user text
// (names, descriptions) ever goes into an SVG: the image has no escaping.

import (
	"crypto/sha256"
	"encoding/base64"
	"strconv"
	"strings"
)

const logoPath = "M0 105V75A30 30 0 0 1 30 45H86A4 4 0 0 0 90 41V15A15 15 0 0 1 120 15V45A30 30 0 0 1 90 75H34A4 4 0 0 0 30 79V105A15 15 0 0 1 0 105Z"

const fontStack = "system-ui,-apple-system,Segoe UI,sans-serif"
const monoStack = "ui-monospace,SFMono-Regular,Menlo,monospace"

func dataURI(svg string) string {
	return "data:image/svg+xml;base64," + base64.StdEncoding.EncodeToString([]byte(svg))
}

// svgDoc is a tiny writer for the few elements the images use.
type svgDoc struct {
	b    strings.Builder
	open int // clip groups still open, closed by String
}

func newSVG(w, h int, style string) *svgDoc {
	d := &svgDoc{}
	d.b.WriteString("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + si(w) + "\" height=\"" + si(h) +
		"\" viewBox=\"0 0 " + si(w) + " " + si(h) + "\"><style>" + style + "</style>")
	return d
}

func (d *svgDoc) raw(s string) { d.b.WriteString(s) }

func (d *svgDoc) rect(x, y, w, h, rx int, attrs string) {
	d.b.WriteString("<rect x=\"" + si(x) + "\" y=\"" + si(y) + "\" width=\"" + si(w) + "\" height=\"" + si(h) + "\"")
	if rx > 0 {
		d.b.WriteString(" rx=\"" + si(rx) + "\"")
	}
	d.b.WriteString(" " + attrs + "/>")
}

func (d *svgDoc) circle(cx, cy, r int, attrs string) {
	d.b.WriteString("<circle cx=\"" + si(cx) + "\" cy=\"" + si(cy) + "\" r=\"" + si(r) + "\" " + attrs + "/>")
}

func (d *svgDoc) path(dd, attrs string) {
	d.b.WriteString("<path d=\"" + dd + "\" " + attrs + "/>")
}

// text writes a fixed string. Callers pass only numbers, fixed words and
// addresses; nothing here escapes.
func (d *svgDoc) text(x, y int, s, attrs string) {
	d.b.WriteString("<text x=\"" + si(x) + "\" y=\"" + si(y) + "\" " + attrs + ">" + s + "</text>")
}

func (d *svgDoc) String() string { return d.b.String() + strings.Repeat("</g>", d.open) + "</svg>" }

// clip starts a group clipped to a rounded rectangle, so glows never spill
// past a card's corners. End it with unclip.
func (d *svgDoc) clip(id string, x, y, w, h, rx int) {
	d.b.WriteString("<clipPath id=\"" + id + "\"><rect x=\"" + si(x) + "\" y=\"" + si(y) + "\" width=\"" + si(w) +
		"\" height=\"" + si(h) + "\" rx=\"" + si(rx) + "\"/></clipPath><g clip-path=\"url(#" + id + ")\">")
}

func (d *svgDoc) unclip() { d.b.WriteString("</g>") }

func si(n int) string { return strconv.Itoa(n) }

// fluted draws the dark background with its vertical ribs.
func (d *svgDoc) fluted(w, h, rx int, lo, hi string) {
	d.clip("bg", 0, 0, w, h, rx)
	d.open++
	d.rect(0, 0, w, h, 0, "fill=\"#03050F\"")
	for i := 0; i*20 < w; i++ {
		op := lo
		if i%2 == 1 {
			op = hi
		}
		d.rect(i*20, 0, 20, h, 0, "fill=\"#FFFFFF\" opacity=\""+op+"\"")
	}
}

func (d *svgDoc) glow(cx, cy int, rs []int, ops []string) {
	for i, r := range rs {
		d.circle(cx, cy, r, "fill=\"#1660FF\" opacity=\""+ops[i]+"\"")
	}
}

// §9 Home banner: the same on every page. Built per call: Render runs as a
// query and must not write package state.
func bannerSVG() string {
	d := newSVG(915, 200, ".w{font:700 40px "+fontStack+";fill:#FFFFFF}.t{font:400 18px "+fontStack+";fill:#C7CEF5}")
	d.fluted(915, 200, 16, "0.03", "0.06")
	d.glow(760, 100, []int{260, 200, 150, 105}, []string{"0.06", "0.08", "0.10", "0.14"})
	nodes := [][4]int{{700, 52, 10, 1}, {812, 70, 14, 0}, {846, 140, 9, 0}, {690, 150, 12, 0}}
	for _, n := range nodes {
		d.path("M760 100L"+si(n[0])+" "+si(n[1]), "stroke=\"#8FA2FF\" stroke-width=\"2\" opacity=\"0.6\" fill=\"none\"")
	}
	for _, n := range nodes {
		fill := "#8FA2FF"
		if n[3] == 1 {
			fill = "#FFFFFF"
		}
		d.circle(n[0], n[1], n[2], "fill=\""+fill+"\"")
	}
	d.circle(760, 100, 32, "fill=\"#2233D9\" stroke=\"#8FA2FF\" stroke-width=\"2\"")
	d.path(logoPath, "fill=\"#FFFFFF\" transform=\"translate(48 56) scale(0.7333)\"")
	d.text(164, 100, "Hireling", "class=\"w\"")
	d.text(166, 134, "Deposit-backed trust for Gno", "class=\"t\"")
	return d.String()
}

// §10 Score card.
func scoreSVG(v profileView, p paramsView) string {
	d := newSVG(915, 300, ".h{font:600 16px "+fontStack+";fill:#FFFFFF}"+
		".s{font:700 72px "+fontStack+";fill:#FFFFFF}"+
		".c{font:600 13px "+fontStack+"}"+
		".m{font:400 13px "+fontStack+";fill:#C9D4F2}"+
		".v{font:700 20px "+fontStack+";fill:#FFFFFF}"+
		".n{font:700 24px "+fontStack+";fill:#FFFFFF}"+
		".l{font:400 14px "+fontStack+";fill:#C9D4F2}")
	d.fluted(915, 300, 24, "0.025", "0.05")
	d.glow(150, 20, []int{220, 160, 110}, []string{"0.07", "0.10", "0.14"})
	d.rect(40, 36, 36, 36, 10, "fill=\"#2233D9\"")
	d.path(logoPath, "fill=\"#FFFFFF\" transform=\"translate(48 44) scale(0.1667)\"")
	d.text(88, 60, "Trust score", "class=\"h\"")
	d.text(38, 156, itoa(v.Score), "class=\"s\"")

	chip := func(x int, label, fill, fillOp, textFill string) int {
		w := 8*len(label) + 24
		d.rect(x, 124, w, 28, 14, "fill=\""+fill+"\" opacity=\""+fillOp+"\"")
		d.text(x+12, 143, label, "class=\"c\" fill=\""+textFill+"\"")
		return x + w + 10
	}
	x := 38 + 44*len(itoa(v.Score)) + 16
	x = chip(x, "+"+si(v.BonusPct)+"% diversity", "#5CF2A6", "0.15", "#5CF2A6")
	chip(x, si(v.Strikes)+" of "+si(p.StrikeLimit)+" strikes", "#FFFFFF", "0.08", "#C9D4F2")

	owner, backers := v.SelfStake, v.TotalStake-v.SelfStake
	if backers < 0 {
		backers = 0
	}
	d.text(500, 58, "Owner", "class=\"m\"")
	d.text(500, 84, gnot(owner), "class=\"v\"")
	d.text(690, 58, "Backers", "class=\"m\"")
	d.text(690, 84, gnot(backers), "class=\"v\"")
	total := owner + backers
	if total <= 0 || backers == 0 {
		d.rect(500, 112, 375, 12, 6, "fill=\"#FFFFFF\"")
	} else {
		ow := int(369 * owner / total)
		if ow < 12 {
			ow = 12
		}
		d.rect(500, 112, ow, 12, 6, "fill=\"#FFFFFF\"")
		d.rect(500+ow+6, 112, 369-ow, 12, 6, "fill=\"#8FA2FF\"")
	}
	ownPct := 100
	if total > 0 {
		ownPct = int(owner * 100 / total)
	}
	d.text(500, 148, si(ownPct)+"% owner", "class=\"m\"")
	d.text(875, 148, si(100-ownPct)+"% backers", "class=\"m\" text-anchor=\"end\"")
	d.rect(40, 196, 835, 1, 0, "fill=\"#FFFFFF\" opacity=\"0.12\"")

	stats := [][2]string{{gnot(v.TotalStake), "at stake"}, {si(v.Counted), "backers counted"}}
	if v.Kind == "agent" {
		stats = append(stats, [2]string{gnot(v.CapacityLeft), "capacity left for jobs"}, [2]string{si(v.JobsDone), "jobs done"})
	}
	for i, s := range stats {
		d.text(40+210*i, 242, s[0], "class=\"n\"")
		d.text(40+210*i, 270, s[1], "class=\"l\"")
	}
	return d.String()
}

func scoreAlt(v profileView) string {
	owner := v.SelfStake
	alt := "Trust score " + itoa(v.Score) + " for " + short(v.Addr) + ". " + gnot(v.TotalStake) + " at stake, " +
		gnotNumber(owner) + " from the owner and " + gnotNumber(v.TotalStake-owner) + " from backers. " +
		plural(v.Counted, "backer") + " counted, +" + si(v.BonusPct) + "% diversity, " + plural(v.Strikes, "strike")
	if v.Kind == "agent" {
		alt += ", " + gnot(v.CapacityLeft) + " capacity left, " + plural(v.JobsDone, "job") + " done"
	}
	return alt
}

// §11 Top agents board, for the first rows of the home page.
var identiconColors = []string{"#8FA2FF", "#5CF2A6", "#FBBF24", "#3FE0FF", "#FF7A7A"}

// identicon is a 4 × 4 picture mirrored left to right: the first byte of
// sha256(address) sets the 8 squares of the left half, the second picks
// the colour. The same address always gets the same picture.
func identicon(d *svgDoc, x, y int, a address) {
	sum := sha256.Sum256([]byte(a.String()))
	col := identiconColors[int(sum[1])%len(identiconColors)]
	d.rect(x, y, 40, 40, 12, "fill=\"#0B0F24\"")
	for r := 0; r < 4; r++ {
		for k := 0; k < 2; k++ {
			if sum[0]&(1<<uint(r*2+k)) == 0 {
				continue
			}
			for _, kk := range []int{k, 3 - k} {
				d.rect(x+4+kk*8, y+4+r*8, 8, 8, 0, "fill=\""+col+"\"")
			}
		}
	}
}

func boardSVG(rows []agentRow) string {
	h := 52 + 76*len(rows)
	d := newSVG(915, h, ".r{font:700 18px "+fontStack+"}"+
		".a{font:600 16px "+monoStack+";fill:#FFFFFF}"+
		".m{font:400 13px "+fontStack+"}"+
		".v{font:700 16px "+fontStack+"}")
	d.fluted(915, h, 24, "0.025", "0.05")
	d.glow(457, 30, []int{200, 140, 90}, []string{"0.06", "0.10", "0.16"})
	for i, r := range rows {
		y := 32 + 76*i
		top := i == 0
		if top {
			d.rect(157, y, 600, 64, 32, "fill=\"#2233D9\" stroke=\"#8FA2FF\" stroke-opacity=\"0.7\"")
		} else {
			d.rect(157, y, 600, 64, 32, "fill=\"#FFFFFF\" fill-opacity=\"0.05\" stroke=\"#FFFFFF\" stroke-opacity=\"0.12\"")
		}
		rankFill, subFill, stakeFill := "#9CA5D6", "#9CA5D6", "#5CF2A6"
		if top {
			rankFill, subFill, stakeFill = "#FFFFFF", "#DCE2FA", "#FFFFFF"
		}
		d.text(181, y+38, si(i+1), "class=\"r\" fill=\""+rankFill+"\"")
		identicon(d, 209, y+12, r.Addr)
		d.text(265, y+30, short(r.Addr), "class=\"a\"")
		d.text(265, y+50, "trust score "+itoa(r.Score), "class=\"m\" fill=\""+subFill+"\"")
		d.text(733, y+38, gnot(r.Stake), "class=\"v\" fill=\""+stakeFill+"\" text-anchor=\"end\"")
	}
	return d.String()
}

func boardAlt(rows []agentRow) string {
	parts := make([]string, 0, len(rows))
	for i, r := range rows {
		parts = append(parts, si(i+1)+". "+short(r.Addr)+", score "+itoa(r.Score)+", "+gnot(r.Stake))
	}
	head := "Top " + si(len(rows)) + " agents by trust score: "
	if len(rows) == 1 {
		head = "Top agent by trust score: "
	}
	return head + strings.Join(parts, ". ")
}

// §13 Guild stats, light and dark in one image through prefers-color-scheme.
const statsStyle = ".card{fill:#FFFFFF;stroke:#E1E5F2}.tx{fill:#0B1033}.mu{fill:#4A5275}" +
	".a0{fill:#2233D9}.a1{fill:#0E7490}.a2{fill:#15803D}.a3{fill:#6D28D9}" +
	".s0{stroke:#2233D9}.s1{stroke:#0E7490}.s2{stroke:#15803D}.s3{stroke:#6D28D9}" +
	".soft{fill:#0B10330F}.softs{stroke:#0B10330F}.own{fill:#0B1033}" +
	"@media (prefers-color-scheme:dark){.card{fill:#0B0F24;stroke:#FFFFFF1F}.tx{fill:#FFFFFF}.mu{fill:#9CA5D6}" +
	".a0{fill:#8FA2FF}.a1{fill:#3FE0FF}.a2{fill:#5CF2A6}.a3{fill:#B18CFF}" +
	".s0{stroke:#8FA2FF}.s1{stroke:#3FE0FF}.s2{stroke:#5CF2A6}.s3{stroke:#B18CFF}" +
	".soft{fill:#FFFFFF14}.softs{stroke:#FFFFFF14}.own{fill:#FFFFFF}}" +
	".t{font:600 15px " + fontStack + "}.l{font:400 12px " + fontStack + "}.b{font:700 40px " + fontStack + "}" +
	".xs{font:400 11px " + fontStack + "}.xb{font:600 11px " + fontStack + "}.n{font:400 12px " + fontStack + "}"

func statsSVG(st homeStats) string {
	d := newSVG(915, 300, statsStyle)
	cards := [][3]string{
		{"At stake", "GNOT locked", gnotNumber(st.TotalStake)},
		{"Profiles", "registered", groupThousands(si(st.Profiles))},
		{"Jobs", "done through escrow", groupThousands(si(st.JobsDone))},
		{"Treasury", "GNOT, no withdrawal", gnotNumber(st.Treasury)},
	}
	for k, c := range cards {
		x0 := 233 * k
		ak := "a" + si(k)
		d.rect(x0, 0, 216, 300, 20, "class=\"card\" stroke-width=\"1\"")
		d.clip("c"+si(k), x0, 0, 216, 300, 20)
		d.circle(x0+186, 20, 90, "class=\""+ak+"\" opacity=\"0.08\"")
		d.unclip()
		d.text(x0+20, 38, c[0], "class=\"tx t\"")
		d.path("M"+si(x0+180)+" 36L"+si(x0+192)+" 24M"+si(x0+183)+" 24L"+si(x0+192)+" 24L"+si(x0+192)+" 33",
			"class=\"s"+si(k)+"\" stroke-width=\"2\" fill=\"none\"")
		d.text(x0+20, 74, c[1], "class=\"mu l\"")
		d.text(x0+18, 124, c[2], "class=\"tx b\"")
	}

	// At stake: owners vs backers.
	total := st.OwnerStake + st.BackerStake
	ow := 176
	if total > 0 {
		ow = int(176 * st.OwnerStake / total)
	}
	if ow > 0 {
		d.rect(20, 168, ow, 12, 6, "class=\"own\"")
	}
	if ow < 176 {
		d.rect(20+ow+4, 168, 172-ow, 12, 6, "class=\"a0\"")
	}
	d.text(20, 200, "Owners "+gnotNumber(st.OwnerStake), "class=\"mu xs\"")
	d.text(196, 200, "Backers "+gnotNumber(st.BackerStake), "class=\"mu xs\" text-anchor=\"end\"")
	backerPct := 0
	if total > 0 {
		backerPct = int(st.BackerStake * 100 / total)
	}
	d.text(20, 276, si(backerPct)+"% put in by backers", "class=\"mu n\"")

	// Profiles: share of agents on a ring.
	cx, cy, r := 233+70, 190, 34
	d.circle(cx, cy, r, "fill=\"none\" class=\"softs\" stroke-width=\"12\"")
	agentPct := 0
	if st.Profiles > 0 {
		agentPct = st.Agents * 100 / st.Profiles
	}
	switch {
	case agentPct >= 100:
		d.circle(cx, cy, r, "fill=\"none\" class=\"s1\" stroke-width=\"12\"")
	case agentPct > 0:
		ex, ey := ringPoint(cx, cy, r, agentPct)
		large := "0"
		if agentPct > 50 {
			large = "1"
		}
		d.path("M"+si(cx)+" "+si(cy-r)+"A"+si(r)+" "+si(r)+" 0 "+large+" 1 "+si(ex)+" "+si(ey),
			"fill=\"none\" class=\"s1\" stroke-width=\"12\"")
	}
	d.text(cx, cy+4, si(agentPct)+"%", "class=\"tx xb\" text-anchor=\"middle\"")
	d.circle(233+128, 172, 4, "class=\"a1\"")
	d.text(233+138, 176, plural(st.Agents, "agent"), "class=\"tx l\"")
	d.circle(233+128, 200, 4, "class=\"soft\"")
	d.text(233+138, 204, plural(st.Members, "member"), "class=\"tx l\"")
	d.text(233+20, 276, "Humans can be vouched too", "class=\"mu n\"")

	// Jobs: one bar per state.
	jobs := []int{st.JobsDone, st.JobsInProgress, st.JobsDisputed}
	ops := []string{"1", "0.6", "0.35"}
	names := []string{"Completed", "In progress", "Disputed"}
	most := 1
	for _, j := range jobs {
		if j > most {
			most = j
		}
	}
	for i, j := range jobs {
		x0, y := 466, 160+28*i
		d.text(x0+20, y+8, names[i], "class=\"mu xs\"")
		d.rect(x0+96, y+3, 72, 8, 4, "class=\"soft\"")
		w := 72 * j / most
		if w < 6 && j > 0 {
			w = 6
		}
		if w > 0 {
			d.rect(x0+96, y+3, w, 8, 4, "class=\"a2\" opacity=\""+ops[i]+"\"")
		}
		d.text(x0+196, y+11, groupThousands(si(j)), "class=\"tx xb\" text-anchor=\"end\"")
	}
	d.text(466+20, 276, plural(st.JobsDisputed, "job")+" went to the council", "class=\"mu n\"")

	// Treasury: running total of incoming funds.
	trail := st.TreasuryTrail
	if len(trail) > 7 {
		trail = trail[len(trail)-7:]
	}
	x0 := 699
	if len(trail) >= 2 {
		var top int64 = 1
		for _, v := range trail {
			if v > top {
				top = v
			}
		}
		step := 174 / (len(trail) - 1)
		pts := make([]string, len(trail))
		var lx, ly int
		for i, v := range trail {
			lx, ly = x0+20+step*i, 236-int(72*v/top)
			pts[i] = si(lx) + " " + si(ly)
		}
		line := "M" + strings.Join(pts, "L")
		d.path(line+"L"+si(lx)+" 236L"+si(x0+20)+" 236Z", "class=\"a3\" opacity=\"0.12\"")
		d.path(line, "fill=\"none\" class=\"s3\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"")
		d.circle(lx, ly, 11, "class=\"a3\" opacity=\"0.25\"")
		d.circle(lx, ly, 5, "class=\"a3\"")
		delta := trail[len(trail)-1] - trail[len(trail)-2]
		d.text(x0+20, 276, "+"+gnot(delta)+" in the latest entry", "class=\"mu n\"")
	} else {
		d.text(x0+20, 276, "Fees and slashes land here", "class=\"mu n\"")
	}
	return d.String()
}

// ringPoint is the end of an arc that starts at 12 o'clock and runs
// clockwise for pct percent of the circle, from a table of whole percents
// rounded to integer pixels.
func ringPoint(cx, cy, r, pct int) (int, int) {
	// sin and cos in thousandths for every 5 percent; pct is rounded to it.
	sin := []int{0, 309, 588, 809, 951, 1000, 951, 809, 588, 309, 0, -309, -588, -809, -951, -1000, -951, -809, -588, -309, 0}
	cos := []int{1000, 951, 809, 588, 309, 0, -309, -588, -809, -951, -1000, -951, -809, -588, -309, 0, 309, 588, 809, 951, 1000}
	i := (pct + 2) / 5
	if i > 20 {
		i = 20
	}
	return cx + r*sin[i]/1000, cy - r*cos[i]/1000
}

func statsAlt(st homeStats) string {
	return gnot(st.TotalStake) + " at stake, " + gnotNumber(st.BackerStake) + " from backers. " +
		plural(st.Profiles, "profile") + ", " + plural(st.Agents, "agent") + " and " + plural(st.Members, "member") + ". " +
		plural(st.JobsDone, "job") + " done, " + si(st.JobsInProgress) + " in progress, " + si(st.JobsDisputed) + " disputed. " +
		gnot(st.Treasury) + " in the Guild Treasury."
}
