# Scaffold a new web app

Replace `<pm>` with the package manager the user chose and `<pmx>` with its runner: bun → `bunx`, pnpm → `pnpm dlx`.
Check the current docs of Next.js and shadcn before running; flags change between majors.

## 0. UI profile first

Copy `templates/ui-profile.md` to `docs/ui-profile.md` and fill it with the user. Its values feed the steps below:
- the locale and time zone in `format.ts`;
- the error copy in `apiClient.ts`;
- the tablet breakpoint in `Providers.tsx`;
- the brand color in `globals.css`.

Also ask now whether the user wants mock mode for endpoints that are not ready (`mocking.md`). Set it up only on a yes.

## 1. Create the app

```bash
<pmx> create-next-app@latest <app-name> --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-<pm>
cd <app-name>
<pmx> shadcn@latest init
<pmx> shadcn@latest add button input input-group label field card dialog alert-dialog drawer table skeleton sonner select badge --yes --overwrite
```

**Add every shadcn component you expect to need here, before step 4 customises the primitives.**
- `--overwrite` is needed because otherwise the CLI stops on a prompt. It also rewrites the base files a component depends on (`button.tsx`, `input.tsx`), which wipes any customisation.
- When you add a component later, run `git diff src/components/ui` afterwards and restore the step 4 customisations it removed.

**Font check.** `shadcn init` can write `--font-sans: var(--font-sans);` in `globals.css`. That points at itself, so the page falls back to Times New Roman.
- Point it at the variable that `next/font` sets in `layout.tsx`, e.g. `--font-sans: var(--font-geist-sans);`.
- Restart the dev server after this edit, and clear its cache if the old font remains: delete `.next/dev`.

## 2. Install the stack

```bash
<pm> add axios @tanstack/react-query zod react-hook-form @hookform/resolvers lucide-react
<pm> add -D @tanstack/react-query-devtools prettier prettier-plugin-tailwindcss eslint-config-prettier \
  vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

Add `zustand` only when the first piece of shared client state appears.
Add `@playwright/test` only when E2E runs outside Claude in Chrome.

## 3. Copy the templates

| Template | Goes to |
|---|---|
| `prettier.config.mjs`, `vitest.config.mts`, `vitest.setup.ts` | project root |
| `env.ts`, `apiClient.ts`, `queryClient.ts`, `format.ts`, `schemas.ts` | `src/lib/` |
| `Providers.tsx` | `src/app/Providers.tsx`, then wrap `{children}` in `src/app/layout.tsx` |
| `useMediaQuery.ts` | `src/hooks/` |
| `PageStates.tsx`, `NumberInput.tsx`, `NumberInput.test.tsx`, `ConfirmDialog.tsx`, `ResponsiveDialog.tsx` | `src/components/shared/` |
| `mocks/` | `src/mocks/`, only when the user chose mock mode (`mocking.md`). Otherwise remove the mock block from `apiClient.ts` and the banner from `Providers.tsx` |
| `example-module/` | read as the pattern for the first real module (api, schema, list with every state, form, confirmed delete, tests); do not copy it as-is |
| `example-route/page.tsx` | how a thin `page.tsx` renders a module; a component using `useSearchParams` sits inside `<Suspense>` |

Translate the copy in `apiClient.ts`, `PageStates.tsx`, `ConfirmDialog.tsx` and the examples when the profile's language differs from the templates.

## 4. Wire-up

- **ESLint and Prettier.** In `eslint.config.mjs` add `import prettier from "eslint-config-prettier/flat";` and put `prettier` last in the config array, so ESLint does not fight Prettier.
- **Cursor rule** (`ui-rules.md` §1). Append to `src/app/globals.css`:

  ```css
  @layer base {
    button:not(:disabled),
    [role="button"]:not([aria-disabled="true"]),
    a[href],
    summary,
    label[for],
    select:not(:disabled) {
      cursor: pointer;
    }
    :disabled,
    [aria-disabled="true"] {
      cursor: not-allowed;
    }
  }
  ```

  Then in `components/ui/button.tsx` and `components/ui/input.tsx`, replace or remove `disabled:pointer-events-none`. Otherwise the not-allowed cursor never shows.
- **Touch targets** (`ui-rules.md` §4). On touch screens, controls grow to 44 px; with a mouse they stay compact.
  - `button.tsx`: add `pointer-coarse:min-h-11 pointer-coarse:min-w-11` to the base class. This covers every size, icon buttons included.
  - `input.tsx`: add `pointer-coarse:h-11` next to its height.
  - `select.tsx`: add `pointer-coarse:h-11` next to its trigger height.
  - Apply the same to any primitive you add later that has a fixed small height (checkbox row, menu item, tab).
- **Breakpoints.** The defaults are `md` at 768 px for tablet and `xl` at 1280 px for desktop. When the profile differs, override `--breakpoint-*` in the `@theme` block of `globals.css`.
- **Motion.** Easing tokens, button press and reduced motion, from `motion.md`.
- **Brand color.** Set `--primary` and `--primary-foreground` in `globals.css` from the profile.
- **Format once.** Run `format`, since generated files are not in Prettier style yet.

## 5. package.json scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Keep what create-next-app generated when it differs only in flags.

## 6. Environment

- `.env.example` is committed and lists every variable with an empty or dummy value.
- `.env.local` is git-ignored.
- Read env only through `src/lib/env.ts`; it fails fast on a missing value instead of falling back to a guess.

## 7. First checks

Run `typecheck`, `lint`, `test`, `build`. Open the dev server in a browser. Then write the README sections from `references/structure.md` (stack, scripts, folder map, link to `docs/ui-profile.md`).

## Common mistakes

```css
/* ❌ shadcn init output refers to itself: the font falls back to Times New Roman */
--font-sans: var(--font-sans);
/* ✅ Point at the variable next/font sets */
--font-sans: var(--font-geist-sans);
```

```ts
// ❌ A guess when the value is missing
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
// ✅ Fails fast on startup
import { env } from "@/lib/env";
const baseURL = env.NEXT_PUBLIC_API_URL;
```

| Don't | Instead |
|---|---|
| `npm install` | Ask bun or pnpm, then use it everywhere |
| `shadcn add` after customizing `components/ui` | Install every component first; afterwards check `git diff src/components/ui` |
| Zustand, axios-mock-adapter or Playwright in a new app "just in case" | Add each one when it is first needed |
| Skipping the UI profile | Fill `docs/ui-profile.md` first |
| Formatting by hand file by file | Run `format` once after the templates are copied |
| An old font still showing after a CSS fix | Stop the dev server, delete `.next/dev`, start again |
