# CLAUDE.md: sc/

Gno packages for Hireling. Owner: Ancung (`p/hireling`, `r/hireling`); Wikan (`r/tavernboard`, filetests). Root rules in `/CLAUDE.md` also apply.

**Update this file in the same PR whenever you change build, test or deploy commands, the toolchain version, the namespace, or a deployed package path.**

## Layout

```
sc/
├── gnowork.toml          workspace, so r/ can import p/ in local tests
├── p/hireling/           pure package: constants, math, share pool
├── r/hireling/           main realm, one file per area:
│   ├── registry.gno        profiles, owners
│   ├── stake.gno           vouch, unbond, withdraw
│   ├── job.gno             escrow lifecycle
│   ├── dispute.gno         disputes, council, timelock
│   ├── trust.gno           Trust API + read API
│   └── render.gno          gnoweb pages + SVG
└── r/tavernboard/        demo consumer realm
```

## Stack

- Toolchain version: **not pinned yet**. In week 0, read `misc/deployments/onyx.gno.land/UPGRADES.md` in gnolang/gno, build `gno`, `gnokey` and `gnodev` from that tag, and record the tag and commit here.
- Reference: `/docs/gno-notes.md`. Interface: `/docs/interface.md` (frozen).
- Only import packages confirmed deployed on Onyx (list in `gno-notes.md`). `p/nt/commondao` and `p/nt/addrset` are not deployed.

## Conventions

- Every state change goes through a crossing function (`cur realm`). Authenticate with `cur.Previous().Address()`, never an address parameter.
- Validate first, mutate after, and `panic("hireling: …")` to abort. Never rely on returned errors.
- Payment guard: `cur.Previous().IsUserCall()` + `unsafe.OriginSend()`; never `IsUser()`.
- Money leaves only through pull payments (`Withdraw`), never in loops.
- Growing collections use `avl.Tree`, not `map`.
- User text is escaped before rendering: no links, images or HTML from users.
- Parameters are constants in `p/hireling`; there is no setter.

## Commands

To be filled in week 0, once the toolchain is installed (test, lint, local `gnodev`, deploy to Onyx). Tests must pass locally before every PR that touches `sc/`; paste the output in the PR.

## Deployed

Nothing deployed yet. Record each deployment here: package path, version, date, transaction hash.

## Render (`r/hireling/render.gno`, owner Dilly)

- Contract: `/design/gnoweb-pages.md` (Markdown per route) and `/design/guild-hall-svg.md` (SVG).
- Routes so far: `""`, `agent/<addr>`, `voucher/<addr>`; any other path gives "Page not found".
- Files: `render.gno` (routes, Markdown) and `render_svg.gno` (the SVG images: banner, guild stats, top agents board, score card). Images are `data:` SVGs written as raw strings with integer coordinates; only numbers, fixed words and addresses go into them, never user text.
- gnoweb extensions used (checked on the Onyx version in `gnodev`): `<gno-button>`, `<gno-icon>`, `> [!NOTE]` alerts. Button labels and hrefs are built from fixed words, numbers and addresses only.
- Paid actions (register, vouch, hire) link to the web app (`webApp` in `render.gno`) until OQ-9 (#3) is answered; free actions are `$help&func=…` TxLinks.
- User text goes through `gno.land/p/nt/markdown/sanitize/v0`: `InlineText` for headings and lines, `TableCell` for table cells. Never print user text raw.
- Render reads state only through the `viewSource` interface at the top of `render.gno`. The registry and stake code sets `source`; until then it is `emptySource` and every page shows its empty state. Lists are paged by the source, 20 rows per page.
- Tests: `cd sc/r/hireling && gno test -v .` (toolchain v1.8.0-rc.1, in WSL).
