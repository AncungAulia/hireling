# Motion in this stack

**REQUIRED:** load the `motion-rules` skill for the rules themselves (what moves, how much, tokens, durations). This file only says how to apply them with Tailwind v4, shadcn on Base UI, Sonner and the Base UI drawer, plus a few extras from Emil Kowalski's `emil-design-eng`.

## Setup (Scaffold)

1. Easing tokens become utilities through `@theme` in `globals.css`:

   ```css
   @theme {
     --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
     --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
     --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
   }
   ```

2. Press feedback on every button. In `components/ui/button.tsx`, add `transition-transform duration-150 ease-out active:scale-[0.97]` to the base class. `scale` works on Base UI and Radix alike.
3. Reduced motion, once in `globals.css`:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-property: opacity, color, background-color, border-color !important;
     }
   }
   ```

   Fades and color changes stay; movement and scale go.
4. Write the project's **Moments** table (from `motion-rules`) into its CLAUDE.md or README before animating anything special.

## Library components keep their own motion

- **Sonner** (toasts) and the **shadcn Drawer** (Base UI) already animate, swipe to dismiss and respect reduced motion. Do not override their transitions.
- **shadcn Dialog, Popover, Select and Menu** animate through `data-starting-style` and `data-ending-style` with `tw-animate-css`. To change one, edit its `components/ui` file once (it is a design-system change), not per page.

## Extras from emil-design-eng

- **Popovers grow from their trigger.** Base UI exposes `var(--transform-origin)`, so use `origin-(--transform-origin)` on popovers, menus, selects and tooltips. Dialogs stay centered.
- **Tooltips:** after the first one opens, neighbouring tooltips open instantly with no animation (Base UI `data-instant`, `transition-duration: 0ms`).
- **Transitions, not keyframes,** for anything triggered rapidly (toasts, toggles), so a new trigger retargets smoothly instead of restarting.
- **Enter with `@starting-style`** for simple CSS entrances, instead of a `mounted` state set in `useEffect`. The latter is also a hydration-flash risk.
- **Stagger** list entrances by 30–80 ms per item, decorative only. Never block interaction while it plays.
- **Asymmetric timing:** slow where the user decides (hold-to-confirm), fast where the system answers (release 200 ms).
- **Framer Motion / `motion`:** only for springs, gestures and drag. Its `x`/`y` shorthands run on the main thread; use `transform: "translateX(...)"` when smoothness under load matters.
- **Only `transform` and `opacity`** (plus `clip-path` and a small `filter: blur`). Never animate `width`, `height`, `margin` or `padding`.

## Check

Play new motion at reduced speed (DevTools → Animations) and once with reduced motion on.

## Common mistakes

```tsx
// ❌ Animates layout: janky, and it moves everything below
<div className="transition-all duration-300 hover:h-40">
// ✅ Only transform and opacity, with a named property and easing token
<div className="transition-transform duration-200 ease-out hover:scale-[1.02]">
```

```tsx
// ❌ An entrance driven by a mounted flag: flashes on hydration, costs a render
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
<div className={mounted ? "opacity-100" : "opacity-0"}>
// ✅ CSS only
<div className="transition-opacity duration-200 starting:opacity-0">
```

```tsx
// ❌ A popover that scales from its own center, away from the button
<PopoverContent className="data-starting-style:scale-95">
// ✅ Grows from the trigger
<PopoverContent className="origin-(--transform-origin) data-starting-style:scale-95">
```

| Don't | Instead |
|---|---|
| `transition-all` | Name the property: `transition-transform`, `transition-opacity`, `transition-colors` |
| `ease-in` on something entering | `ease-out` (the `@theme` token) |
| Bounce or elastic easing in app UI | `--ease-out` or `--ease-drawer` |
| Over 300 ms for UI feedback | 150–250 ms; longer only for large surfaces such as a drawer |
| Overriding Sonner or Drawer transitions | Leave them as they are |
| Changing a dialog's animation in one page | Edit its `components/ui` file once |
| Motion that ignores reduced motion | The global CSS in Setup step 3 |
