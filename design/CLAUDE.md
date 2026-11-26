# CLAUDE.md: design/

Design source for Hireling. Owner: Dilly. Root rules in `/CLAUDE.md` also apply.

- One file: `hireling.pen` (pen.dev). Use the `pencil-design` skill; never read or edit `.pen` files as text.
- Scope:
  - landing page
  - web app screens for paid actions (if needed, see `apps/fe/CLAUDE.md`)
  - the look of the gnoweb pages and the Guild Hall trust-graph SVG, which Ancung implements in `sc/r/hireling/render.gno`
- Each design PR includes exported PNGs of the changed frames in `exports/`, so reviewers can see them without pen.dev.
- Design tokens (colours, type, spacing) are defined once in the file and exported for `apps/fe`.
- Themes: every web screen has a dark and a light version. **Dark is the default** (the glass and fluted-light look is strongest on a dark field); the light version keeps the same layout, with Mist glass over pale flutes.
- The visual direction, voice, glossary, tokens, glass recipes and the project UI profile live in the `Brand` and `Foundations` frames of `hireling.pen`. Read them before designing a new screen.

## Files

| Path | What |
|---|---|
| `hireling.pen` | The design file |
| `guild-hall-svg.md` | Spec of the Guild Hall trust-graph SVG for `sc/r/hireling/render.gno` |
| `guild-hall-sample*.svg` | Samples that follow that spec |
| `scripts-design/guild-hall-samples.mjs` | Generates the samples: `node design/scripts-design/guild-hall-samples.mjs` (or `bun`) |
| `exports/` | PNG exports for PR review |
