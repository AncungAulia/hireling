# UI profile

Per-project values the UI rules refer to. Fill every field with the user at scaffold time, keep it in `docs/ui-profile.md`, and link it from the README. Leave a field as `TBD` rather than guessing.

| Field | Value |
|---|---|
| UI language and form of address | e.g. English, plain, second person |
| Brand color / text color on it | e.g. `#0F766E` / `#FFFFFF` |
| Font | e.g. Inter |
| Theme | light only / light and dark |
| Breakpoints | default: mobile < 768px, tablet 768–1279px, desktop ≥ 1280px |
| Number format | e.g. `1,234.5` (`en-US`) |
| Currency format | e.g. `$36,750.00`; abbreviated `$36.25M` |
| Date and time format | e.g. `Nov 21, 2026`, `2:30 PM` |
| Time zone | e.g. `UTC` (used by `format.ts` so server and browser render the same date) |
| Units in use | e.g. g/kg, ml/L, pcs |
| Glossary (one concept, one term) | e.g. Sign in / Sign out / Sign up, e-ticket |
| Component library | e.g. shadcn/ui (Base UI) |
| Design source / may it be edited? | e.g. Figma link / no |
| Backend messages safe to show as-is? | no (default) / yes, the API returns messages in the UI language |
