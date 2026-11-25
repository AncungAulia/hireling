---
name: motion-rules
description: The user's own motion rules for web UI (easing tokens, durations, press, hover, enter and exit, menus, dialogs, swipe, layout changes, reduced motion, plus optional patterns for streamed text and important numbers). Use when the user runs /motion-rules, or asks to set up or apply motion/animation rules in a project.
---

# Motion rules

Based on Emil Kowalski's approach (`emil-design-eng` skill; load it too for details).
Core idea: **the more often people see something, the less it moves. Delight only for rare moments.**
Animate `transform` and `opacity` only (plus `clip-path` and `filter: blur` for small swaps).

## How to apply in a project

1. Read the project first (stack, existing CSS tokens, components, any CLAUDE.md).
2. Add the easing tokens below to the project's CSS (Tailwind 4: put them in `@theme` as `--ease-*` so they become utilities).
3. Write a short "Motion" section into the project's own `CLAUDE.md` (or design doc): the tokens, the rules that apply, and a **Moments** table for this product. Leave out optional patterns that don't fit.
4. Show the user the Moments table before animating anything special.

## Tokens

- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`: anything entering or responding.
- `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`: things moving across the screen.
- `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`: drawers and sheets.
- Hover and color changes: plain `ease`. **Never `ease-in`.**
- Durations: press 100 to 160 ms; tooltips and menus 150 ms; enter 200 ms, leave 150 ms (exits faster than entries); drawers and sheets 300 ms. UI motion stays under 300 ms; only rare moments run longer.

## Rules

- **Press:** scale 0.97 to 0.98 on anything tappable; release faster than press.
- **Hover:** only for real pointers (`@media (hover: hover) and (pointer: fine)`).
- **Focus:** 2 px ring, 2 px offset, keyboard only (`:focus-visible`).
- **Enter:** fade + 8 px rise. Never from `scale(0)`; start at 0.95 or more with opacity 0.
- **Menus and popovers:** scale 0.96 to 1 from their trigger (`transform-origin` on the trigger side). **Dialogs:** scale from the center.
- **Button state swaps** (Save, Saving, Saved): 200 ms crossfade with a 2 px blur.
- **No animation** for keyboard actions (Enter, Esc, shortcuts) or for switching menu items and tabs. Exception: the active tab highlight may slide.
- **Drawers, sheets, toasts** can be swiped away; a quick flick (velocity over 0.11) dismisses with no distance threshold. Dragging past an edge slows down (rubber band) instead of stopping.
- **Layout changes** (panel fold, resize): `ease-in-out` 200 ms, crossfade the contents, no animation on first load (enable transitions after mount).
- **Lists and loading:** skeletons use a slow linear shimmer and crossfade to content; content that was already loaded appears instantly.
- **Reduced motion** (`prefers-reduced-motion: reduce`): keep fades and color changes, drop movement and scale.

## Optional patterns (use only when they fit)

- **Important numbers** (money, balances, scores that matter): no count-up or ticking; a new value crossfades. No bounce or shake.
- **Streamed text** (AI replies, live logs): buffer chunks and reveal at a steady pace, each new word fading in over about 150 ms. No fake blinking cursor. Auto-scroll follows new text unless the user scrolled up; then show a "New message" button.
- **Counts and badges:** a changed count pops once (0.9 to 1), nothing more.

## Moments (fill per project)

List the product's special moments and how often people see them; frequency decides how much motion is allowed.

| How often | Motion allowed |
|---|---|
| Many times a day | Press feedback and crossfades only |
| Sometimes | A short enter (200 ms), no spring |
| Rare | A small spring (about 400 ms) |
| Once (first success, onboarding done) | Spring entrance (bounce 0.2), items stagger 50 ms apart |

## Tools

- CSS transitions for almost everything.
- A spring/gesture library (e.g. `motion`) only for springs, gestures and drag.
- Check performance with the `animation-performance` skill if something stutters.
