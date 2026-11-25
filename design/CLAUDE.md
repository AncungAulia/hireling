# CLAUDE.md: design/

Design source for Hireling. Owner: Dilly. Root rules in `/CLAUDE.md` also apply.

- One file: `hireling.pen` (pen.dev). Use the `pencil-design` skill; never read or edit `.pen` files as text.
- Scope:
  - landing page
  - web app screens for paid actions (if needed, see `apps/fe/CLAUDE.md`)
  - the look of the gnoweb pages and the Guild Hall trust-graph SVG, which Ancung implements in `sc/r/hireling/render.gno`
- Each design PR includes exported PNGs of the changed frames, so reviewers can see them without pen.dev.
- Design tokens (colours, type, spacing) are defined once in the file and exported for `apps/fe`.
- Light and dark versions for every web screen.
