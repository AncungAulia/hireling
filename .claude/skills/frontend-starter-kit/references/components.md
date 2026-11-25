# Components

How components are organised and built. How they look and read is in `ui-rules.md`.

## Layers

| Layer | Folder | Knows about | Example |
|---|---|---|---|
| Primitive | `components/ui/` | nothing app-specific (shadcn) | `Button`, `Input`, `Dialog` |
| Shared composition | `components/shared/` | layout and copy patterns, no module data | `ErrorState`, `EmptyState`, `NumberInput`, `PageHeader`, `DataTable`, `ConfirmDialog` |
| Layout | `components/layout/` | navigation and shell | `AppSidebar`, `Topbar` |
| Module component | `modules/<m>/components/` | one module's data and rules | `ProductTable`, `AddProductForm` |

A component moves down a layer (module → shared) on its third use across modules, not earlier. Exception: anything `ui-rules.md` §2 says must be one component app-wide, such as a formatted input or a search field, is shared from its first use.

## Data views

Render the states from `ui-rules.md` §5 in this order, with `templates/PageStates.tsx`:

1. `isPending` → `LoadingState`, or a skeleton shaped like the content.
2. `isError` → `ErrorState error={query.error} onRetry={refetch}`. It picks error, offline or no access from `ApiError.kind`.
3. Empty → `EmptyState`.
4. Data → the view.

`templates/example-module/components/ProductList.tsx` shows all of them.

## Clean-code rules, applied

- **Single responsibility.** A component either fetches (container, via a hook) or renders (view, via props). Split when it does both and passes ~150 lines.
- **Open for extension.** Variants go through props and `cva` (as shadcn does), not copy-pasted components (`PrimaryCard`, `DangerCard`).
- **Depend on abstractions.** Views receive data and callbacks; they do not import axios, the query client or a store they do not need.
- **DRY with the rule of three.** Two similar blocks stay duplicated. The third time, extract and replace all three.
- **Composition over props explosion.** More than ~8 props or several boolean modes → use `children` or compound components (`<Card><CardHeader/>…`).

## Forms

Full example with tests: `templates/example-module/components/AddProductForm.tsx`.

```tsx
const form = useForm<ProductFormValues, unknown, ProductInput>({
  resolver: zodResolver(productInputSchema),
  mode: "onTouched",
  defaultValues: { name: "", category: "", price: null, stock: null },
});
```

- **When errors appear: `mode: "onTouched"`.**
  - A field is checked the first time the user leaves it, or on submit, so leaving a required field empty shows its error right away.
  - After that, it is re-checked on every keystroke, so the error disappears as soon as the value is valid.
  - Nobody is told off while typing for the first time.
- **Debounce only for checks that call the server** (e.g. "is this username taken?"). Debounce such a check by about 400 ms, and show it on the field with a small spinner. Rules the schema can check (required, format, range) are never debounced; they are instant.
- **Wiring.** Connect inputs with react-hook-form's `Controller`. Lay them out with shadcn `Field`, `FieldLabel`, `FieldError` and `FieldGroup`. Current shadcn has no `form` component; check its docs if this changes.
- **Types.** Type the form with `z.input` (what the inputs hold) and `z.output` (what submit receives).
- **Number fields.**
  - Use `NumberInput`, which holds `number | null`.
  - In the schema, use `requiredNumber("… is required").pipe(z.number()…)` from `lib/schemas.ts`, or `z.number().nullable()` when the field is optional.
  - An empty number field is `null`, never 0.
- **Defaults.** `defaultValues` are empty inputs, not invented data.
- **Submit.** Follow the save behaviour in `ui-rules.md` §2: disabled until dirty, spinner inside the button, a saved label after success. Submit calls the module's mutation, and the form resets only on success.
- **Server field errors.** When the API rejects a field (`ApiError.kind === "validation"` with per-field details), put the message on that field with `form.setError`, not in a toast.

## Dialogs, drawers, confirmations and toasts

Which one to use is decided by `ui-rules.md` §5 (feedback by urgency). The components:

| Need | Component | Library |
|---|---|---|
| Confirm a risky or irreversible action | `ConfirmDialog` (`templates/ConfirmDialog.tsx`) | shadcn AlertDialog from tablet up, shadcn Drawer on mobile |
| Short form or picker | `ResponsiveDialog` (`templates/ResponsiveDialog.tsx`) | shadcn Dialog from tablet up, shadcn Drawer on mobile |
| Long form on mobile | full-screen sheet | shadcn Drawer or Sheet |
| Toast | `toast.success(...)`, `toast.error(...)` | Sonner, through the shadcn `sonner` component |

- **Drawers.** Current shadcn (Base UI) builds its Drawer on Base UI's own drawer, not on vaul. It swipes and snaps the same way. Radix-based styles still use vaul. Either way, take it from shadcn, never from a separate drawer library.
- **Who owns state.** The parent owns `open` and `pending` (e.g. `mutation.isPending`). The dialog stays open while the action runs, and closes in the mutation's `onSuccess`.
- **Example.** `templates/example-module/components/DeleteProductButton.tsx` is the pattern.

## Hydration-safe components

A hydration error means the HTML from the server differs from the first render in the browser. The usual causes when generating shadcn code, and their fixes:

| Cause | Fix |
|---|---|
| A button inside a button: `<DialogTrigger><Button/></DialogTrigger>` | `render={<Button />}` (Base UI) or `asChild` (Radix): one element, not two |
| Invalid nesting: `<div>` or `<p>` inside `<p>`, `<a>` inside `<a>`, interactive element inside `<button>` | Fix the markup; check what each shadcn part renders (e.g. `CardDescription`, `DialogDescription` are `<p>`) |
| Reading `window`, `localStorage`, `navigator` or `matchMedia` during render | Read it in an effect, or with `useSyncExternalStore` plus a server snapshot (`templates/useMediaQuery.ts`) |
| `Date.now()`, `new Date()`, `Math.random()` in render | Pass the value from the server, or compute it after mount; IDs come from `useId()` |
| Dates formatted without a time zone (server and browser zones differ) | Always format through `lib/format.ts`, which pins `TIME_ZONE` from the UI profile |
| Layout chosen in JS by screen width | Use CSS breakpoints (`md:hidden`); `useMediaQuery` only switches behaviour that is closed on first render, such as Dialog vs Drawer |
| Theme (next-themes) | `suppressHydrationWarning` on `<html>`, and render theme-dependent UI only after mount |
| Zustand `persist` | `skipHydration` + `rehydrate()` after mount (`data-and-state.md`) |

Check: the browser console shows no hydration warning on any page you touched. Warnings that name attributes added by browser extensions are not ours.

## Accessibility baseline

- Icon-only buttons have `aria-label`.
- Errors use `role="alert"`; loading uses `role="status"` with `aria-busy`.
- Everything works by keyboard; dialogs trap focus (shadcn does this).
- Text contrast at least 4.5:1.

## shadcn primitives: Base UI or Radix

Read the generated file before using a primitive's composition API.
- Current shadcn styles (e.g. `base-nova`) are built on Base UI, which composes with a `render` prop: `<DialogTrigger render={<Button />}>Add product</DialogTrigger>`.
- Older Radix-based styles use `asChild` instead.
- The `style` field in `components.json` tells which one the project uses.

## Icons

lucide-react, imported per icon: `import { Plus } from "lucide-react"`. Size with Tailwind (`size-4`).

## Common mistakes

```tsx
// ❌ A button inside a button: hydration error, two tab stops
<DialogTrigger><Button>Add product</Button></DialogTrigger>
// ✅ One element (Base UI). Radix styles use asChild instead.
<DialogTrigger render={<Button />}>Add product</DialogTrigger>
```

```tsx
// ❌ Errors shown while the user is still typing the first time
useForm({ resolver: zodResolver(schema), mode: "onChange" });
// ✅ Checked when the field is left, then re-checked live
useForm({ resolver: zodResolver(schema), mode: "onTouched" });
```

```tsx
// ❌ Load error as a toast: it disappears and leaves an empty screen
if (query.isError) toast.error("Couldn't load products");
// ✅ The error stays on the screen, with a way out
if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
```

```tsx
// ❌ Deletes on the first click
<Button variant="destructive" onClick={() => remove.mutate(id)}>Delete</Button>
// ✅ Confirm first; the dialog stays open while it runs
<ConfirmDialog open={open} onOpenChange={setOpen} title="Delete product?" destructive
  confirmLabel="Delete product" pending={remove.isPending} onConfirm={handleDelete} />
```

| Don't | Instead |
|---|---|
| `useState` + `useEffect` to copy props or query data | Derive in render, or use `select` |
| `<Input type="number">` for money or quantities | `NumberInput` (`number \| null`, formatted) |
| `defaultValues: { price: 0 }` | `price: null`: empty is not zero |
| Server field error in a toast | `form.setError("field", …)` |
| A view component importing `apiClient` or `useQueryClient` | Container hook passes data and callbacks as props |
| `PrimaryCard`, `DangerCard` copies | One component with a `variant` prop (`cva`) |
| A Drawer from vaul or another library | shadcn `drawer` |
| Editing `components/ui/*` to fix one page | Fix it in the page, or change the design system on purpose |

## Check

- Every data view renders loading, error (with retry), empty and data.
- Every form: leaving a required field empty shows its error; submit follows `ui-rules.md` §2.
- Every risky action goes through `ConfirmDialog`.
- No hydration warning in the console on the pages you touched.
- Icon-only buttons have `aria-label`; the flow works by keyboard.
