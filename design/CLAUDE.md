# CLAUDE.md: design/

Design source for Hireling. Owner: Dilly. Root rules in `/CLAUDE.md` also apply.

- One file: `hireling.pen` (pen.dev). Use the `pencil-design` skill; never read or edit `.pen` files as text.
- Scope:
  - landing page
  - web app screens for paid actions (if needed, see `apps/fe/CLAUDE.md`)
  - the look of the gnoweb pages and the Guild Hall trust-graph SVG, which Dilly implements in `sc/r/hireling/render.gno` (ownership change, issue #1)
- Each design PR includes exports of the changed frames in `exports/`, so reviewers can see them without pen.dev: PNG at scale 1 for short frames, JPEG quality 85 for long pages (a full landing is about 1 MB as JPEG against about 7 MB as PNG). Names: `<page>-<width>-<theme>.jpg`, for example `landing-mobile-390-light.jpg`.
- Design tokens (colours, type, spacing) are defined once as variables in the file and exported by hand to `tokens.css` for `apps/fe`. Change the variable first, then the CSS.
- Themes: every web screen has a dark and a light version. **Dark is the default** (the glass and fluted-light look is strongest on a dark field); the light version keeps the same layout, with Mist glass over pale flutes.
- The visual direction, voice, glossary, tokens, glass recipes and the project UI profile live in the `Brand` and `Foundations` frames of `hireling.pen`. Read them before designing a new screen.

## Files

| Path | What |
|---|---|
| `hireling.pen` | The design file |
| `logo/hireling-mark.svg` | Final logo ("Slim": two coins joined by one band), `currentColor`, for `apps/fe` (favicon, header, footer). `-blue` and `-white` are fixed-colour copies. Minimum size 16 px; clear space equals one coin |
| `guild-hall-svg.md` | Spec of the Guild Hall trust-graph SVG for `sc/r/hireling/render.gno` |
| `gnoweb-pages.md` | Markdown templates for every `Render` route, the contract for `render.gno`; the `gnoweb · …` frames in `hireling.pen` show them inside gnoweb |
| `guild-hall-sample*.svg` | Samples that follow that spec |
| `scripts-design/guild-hall-samples.mjs` | Generates the samples: `node design/scripts-design/guild-hall-samples.mjs` (or `bun`) |
| `tokens.css` | The variables of `hireling.pen` as CSS custom properties: dark under `:root`, light under `[data-theme="light"]` |
| `assets/` | 3D glass coins used in the landing: `coin-<pose>.png` (transparent cutouts), with the original renders in `assets/source/`. `assets/cards/hero-*.png` are exports of the `Hero Cards` frame, used as image fills in the landing hero fan; re-export them when that frame changes. Faces are blank; the vector logo is overlaid in pen.dev. Never ask an image model to draw the logo |
| `exports/` | JPEG and PNG exports for PR review |
