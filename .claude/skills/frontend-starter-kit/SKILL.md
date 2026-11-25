---
name: frontend-starter-kit
description: Use for any code or UI change in a Next.js or React web frontend, including a small or urgent page, fix or feature on a deadline; when creating a new web app or website from scratch; or when tidying an existing web frontend's code and folders (refactor, restructure). Not for React Native or Expo mobile apps.
---

# Frontend Starter Kit

The house stack, folder shape, UI rules and working rules for every web frontend. A project's own README, CLAUDE.md or `docs/ui-profile.md` wins over this skill wherever they disagree.

## 1. Pick the mode first

| Situation | Mode | Read before coding |
|---|---|---|
| No app yet (no `package.json`) | **Scaffold** | `references/stack.md`, `references/structure.md`, `references/ui-rules.md`, `references/motion.md`, then copy `templates/` |
| Existing app, user wants a page or feature | **Feature** | `references/structure.md`, `references/data-and-state.md`, `references/components.md`, `references/ui-rules.md` |
| An endpoint the screen needs is not ready | Ask the user about **mock mode** | `references/mocking.md` |
| User asks to tidy, regroup, refactor or clean up | **Tidy** | `references/refactor.md` |

Feature mode in an app that does not follow this shape:
- Put new code in the shape the app already uses.
- Keep the rules in section 4.
- Tell the user what a Tidy pass would change. Restructure only in Tidy mode.

Feature mode adds no setup and no extra steps; it is sized for a one-file change on a deadline. A small or urgent task still follows section 4: money goes through a format helper, types come from the existing source, and the shape is never guessed. When the app has no `format.ts` yet, add it with only the function you need.

## 2. Working rules

Adapted from multica-ai/andrej-karpathy-skills (MIT).

1. **Think before coding.** State assumptions. When a request has two readings, ask. Name a simpler approach when one exists.
2. **Simplicity first.** Write the least code that does the job. No speculative options or config. Extract a shared component, hook or helper on its **third** use, not before. The exception is the controls `ui-rules.md` §2 requires to be one component app-wide.
3. **Surgical changes** (Feature mode). Every changed line traces to the request. Remove only what your change orphaned. Mention unrelated problems; leave them.
4. **Goal-driven.** Write the checks that prove "done" before starting, then loop until they pass (section 5).

## 3. Default stack (Scaffold)

| Need | Use |
|---|---|
| Package manager | **Ask the user: bun or pnpm.** Never default to npm. |
| Framework | Next.js, App Router, TypeScript strict, `src/` dir |
| UI | shadcn/ui + Tailwind + lucide-react; dialogs, alert dialogs and drawers from shadcn |
| Toasts | Sonner (shadcn `sonner`) |
| Server data | axios (one instance) + TanStack Query |
| Forms | react-hook-form + zod (`@hookform/resolvers/zod`) |
| Shared client state | Zustand, only when section 4 says so; load the `zustand` skill, installing it on first use (`data-and-state.md`) |
| Unit / component tests | Vitest + Testing Library |
| Mock mode (only if the user wants it) | axios-mock-adapter, switched on in `.env.local` |
| End-to-end | Claude in Chrome when you are Claude and it is connected; otherwise Playwright |
| Lint / format | ESLint + Prettier |

Use `@latest` installers and check current docs; do not pin versions from memory.

## 4. Rules for every mode

- **Honest data.** A failed or empty load shows its state (`ui-rules.md` §5). Never show sample, mock or default values in its place.
  - **One exception: mock mode.** When an endpoint is not ready, ask the user whether they want to see the screen with example data.
  - Only on a yes, set up axios-mock-adapter per `references/mocking.md`. It runs only in dev, is switched on in `.env.local`, shows a banner while on, and never ships in the production build.
- **Data access.** Components never call axios or fetch. They call a module hook (`useProductsQuery`), which calls a module api function, which uses `lib/apiClient.ts`.
- **State home.**
  - Server data lives in TanStack Query only.
  - Filters, search, sort and page live in the URL.
  - Form input lives in react-hook-form.
  - Zustand holds client state shared by distant components (e.g. a cart, a sidebar toggle). In Next.js it is a store factory behind a provider, never a module-level `create()` store (`data-and-state.md`).
  - Everything else is local `useState`.
- **One source for types.** Derive types from the zod schema (`z.infer`). Do not retype a shape that already exists.
- **Formatting.** Money, numbers, units and dates go through `lib/format.ts` for display and `NumberInput` for entry. No `Intl.*` or `toFixed` inside components.
- **UI kit.** Controls come from `components/ui` (shadcn), icons from lucide-react, never native browser controls.
- **Feedback by urgency** (`ui-rules.md` §5).
  - Field errors show under the field. Load errors show as the page state.
  - Routine success gets a Sonner toast.
  - Risky or irreversible actions are confirmed first with `ConfirmDialog` (shadcn AlertDialog, a drawer on mobile).
- **Forms validate on leave** (`mode: "onTouched"`). Debounce only checks that call the server.
- **Hydration-safe.** No nested interactive elements, no browser-only values or unzoned dates during render (`components.md`).
- **UI rules.** Visual style, consistency, tables, responsive, states, feedback and copy follow `references/ui-rules.md` and the project's UI profile. Motion follows the `motion-rules` skill through `references/motion.md`.

## 5. Done means

How to test: `references/testing.md`.

- `tsc --noEmit`, lint, tests and `build` pass.
- The page was opened in a browser and each of its states (`ui-rules.md` §5) was seen, filling the rest of the screen (or its card), not squeezed at the top.
- The page was seen at 390, 834 and 1440 px wide with no horizontal scroll (`ui-rules.md` §4).
- The browser console shows no hydration warning.
- With mock mode set up: the `build` output contains no mock code (`mocking.md`).
- Backend gaps found against the design are listed.
- Anything not verified is named in the final message.

## Common mistakes

| Mistake | Do instead |
|---|---|
| Picking Vite/CRA "because it is simpler" | Next.js, unless the user named another framework |
| Running `npm install` without asking | Ask bun or pnpm first |
| Hand-written form validation | zod schema + `zodResolver` |
| Filter kept in `useState` | URL search params (`references/data-and-state.md`) |
| Eight files flat in one module folder | `api/`, `components/`, `hooks/`, `schemas/` subfolders |
| `product-list.tsx` or `Product_List.tsx` | `ProductList.tsx`; hooks `useProducts.ts`; folders kebab-case (`references/structure.md`) |
| Styled `<button>` or `<input type="number">` | shadcn `Button`, shared `NumberInput` |
| Showing sample data when the API fails | `ErrorState` with retry |
| Checking only the desktop width | Also 390 and 834 px; no horizontal scroll, 44 px touch targets |
| Spinner while a list loads | Skeleton; spinners only inside the button that started an action |
| Backend error text on screen | `ApiError.message` mapped from `kind` |
| Skipping this skill because the task is small or urgent | Feature mode is the small-task path; use it |
| `asChild` on a Base UI shadcn component | `render={<Button />}` (`references/components.md`) |
| `<DialogTrigger><Button /></DialogTrigger>` (button in a button, hydration error) | `<DialogTrigger render={<Button />}>` |
| Deleting or cancelling without asking | `ConfirmDialog` first; reversible actions get an "Undo" toast instead |
| A toast for a failed page load or an invalid field | Page state, or the message under the field |
| Validating on every keystroke from the start, or debouncing a required check | `mode: "onTouched"`; debounce only server checks |
| Adding mock data without asking, or importing `src/mocks` from app code | Ask first; `src/mocks/` handlers only, behind the `.env.local` switch |
| Module-level `create()` Zustand store in Next.js | Store factory + provider (`data-and-state.md`) |
| `new Date().toLocaleDateString()` in a component | `formatDate` from `lib/format.ts` (fixed time zone) |
| `shadcn add` after customising `button.tsx` | Re-apply the customisations; check `git diff src/components/ui` |
