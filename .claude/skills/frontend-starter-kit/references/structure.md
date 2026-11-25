# Folder structure

```
src/
├── app/                       routes only
│   ├── (public)/              route group: marketing, auth pages
│   ├── (dashboard)/           route group: signed-in app, shared layout
│   │   └── purchase-orders/
│   │       ├── page.tsx       thin: reads params, renders a module component
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── api/                   route handlers (only when the app owns a backend)
│   ├── layout.tsx
│   └── Providers.tsx          QueryClientProvider, Toaster, mock banner, theme
├── modules/
│   └── <module>/              one business domain, e.g. products, purchase-orders, auth
│       ├── api/
│       │   ├── <module>.api.ts       axios calls; parse responses with the schema
│       │   ├── <module>.keys.ts      query key factory
│       │   └── use<Thing>.ts         useQuery / useMutation hooks
│       ├── components/        components only this module uses
│       ├── hooks/             non-data hooks of this module (optional)
│       ├── schemas/           zod schemas + inferred types
│       ├── store.ts           Zustand, only if needed
│       ├── utils.ts           pure helpers of this module (optional)
│       └── index.ts           public surface: what other code may import
├── components/
│   ├── ui/                    shadcn generated (kebab-case); edit only to change the design system
│   ├── shared/                app-wide compositions: PageStates, NumberInput, ConfirmDialog, ResponsiveDialog, PageHeader, DataTable
│   └── layout/                shell: AppSidebar, Topbar, Footer
├── hooks/                     app-wide hooks: useMediaQuery, useDebounce
├── lib/                       apiClient, queryClient, env, format, schemas (zod helpers), utils (cn)
├── stores/                    app-wide Zustand store factories (rare)
├── config/                    constants, nav items, site metadata
├── types/                     app-wide types not owned by one module
└── mocks/                     mock mode only (references/mocking.md); app code never imports it
    ├── attachMocks.ts, mockUtils.ts, MockBanner.tsx
    ├── handlers/              one <module>Mocks.ts per module
    └── fixtures/
```

`docs/ui-profile.md` holds the per-project UI values (`ui-rules.md`). E2E specs live in `e2e/` at the root.

## Rules

- **app/ is thin.** A `page.tsx` reads `params`/`searchParams` and renders a module component. No fetching logic, no business rules, no long JSX.
- **Module boundary.** Code outside a module imports only from `@/modules/<module>` (its `index.ts`). A module may import `components/`, `hooks/`, `lib/`, `config/`, `types/`, never another module's internals.
- **Where a component goes.**
  - Used by one module → that module's `components/`.
  - Used by two or more modules → `components/shared/`.
  - A primitive with no app knowledge → `components/ui/`, via shadcn.
- **Imports.** Use the `@/` alias, never `../../..`.
- **Size.** A file over ~250 lines, or a component doing two jobs, is split by responsibility (data hook, view, sub-components).

## Naming

### Files and folders

| Kind | Pattern | Example |
|---|---|---|
| Component | PascalCase, named after its export | `ProductList.tsx` → `ProductList` |
| Hook | camelCase, `use…` | `useProducts.ts`, `useMediaQuery.ts` |
| Helper, lib module | camelCase | `apiClient.ts`, `queryClient.ts`, `format.ts` |
| File with a role | entity + role suffix | `products.api.ts`, `products.keys.ts`, `product.schema.ts` |
| Zustand store | `store.ts` in its module, or `<name>Store.ts` in `stores/` | `modules/cart/store.ts`, `stores/uiStore.ts` |
| Test | the file's name + `.test` | `ProductList.test.tsx` |
| E2E spec | camelCase flow + `.spec` | `e2e/addProduct.spec.ts` |
| Folder | kebab-case (route segments become URLs) | `modules/purchase-orders/`, `components/shared/` |
| Next.js special file | lowercase, fixed by the framework | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` |
| Route params and groups | `[param]`, `(group)` | `[id]/`, `(dashboard)/` |
| `components/ui/` | kebab-case, as shadcn generates it; do not rename | `button.tsx`, `input-group.tsx` |

- One exported component per file. A second large component means the file should split.
- A file that exports several small related components is named for the group (`PageStates.tsx`).
- **Case-only renames** go through `git mv`, in two steps on Windows: `git mv a.tsx tmp.tsx && git mv tmp.tsx A.tsx`. A plain rename is invisible to git on Windows and macOS, and breaks the Linux build.
- Keep `forceConsistentCasingInFileNames` on in `tsconfig.json` (TypeScript 5 default) so a wrongly cased import fails locally too.

### Inside the code

| Kind | Pattern | Example |
|---|---|---|
| Component | PascalCase noun | `ProductList`, `AddProductForm` |
| Data hook | `use<Thing>Query`, `use<Action><Thing>Mutation` | `useProductsQuery`, `useCreateProductMutation` |
| Other hook | `use<Something>` | `useMediaQuery` |
| API function | verb + entity | `getProducts`, `getProduct`, `createProduct` |
| zod schema | camelCase + `Schema` | `productSchema`, `productInputSchema` |
| Type | PascalCase | `Product`, `ProductInput`, `ProductFormValues` |
| Constant | UPPER_SNAKE | `EMPTY_FORM`, `TABLET_UP`, `LOCALE` |
| Boolean | `is` / `has` / `can` | `isTabletUp`, `hasDecimal` |
| Event prop / handler | `on<Event>` in props, `handle<Event>` inside the component | `onRetry`, `handleSubmit` |

## README sections every app has

1. What the app is, in two sentences.
2. Stack (the table from SKILL.md section 3, with real versions).
3. Scripts and how to run locally, including env setup.
4. This folder map, trimmed to what exists.
5. Rules for contributors: link to this structure and the honesty rule.

## Common mistakes

```tsx
// ❌ Fetching and business logic in a route file
export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
  const products = await res.json();
  return <table>{/* 200 lines */}</table>;
}
// ✅ The route is thin; the module owns the rest
export default function Page() {
  return <ProductList />;
}
```

```ts
// ❌ Reaches into another module's internals, with a relative path
import { ProductRow } from "../../products/components/ProductRow";
// ✅ Through the module's public surface
import { ProductRow } from "@/modules/products";
```

| Don't | Instead |
|---|---|
| `features/`, `views/`, `containers/` folders | `modules/<module>/` |
| `utils/` dumping ground at the root | `lib/` for app-wide, `modules/<m>/utils.ts` for one module |
| `productList.tsx`, `product-list.tsx` | `ProductList.tsx` |
| `ProductsFolder/`, `purchaseOrders/` | `products/`, `purchase-orders/` |
| Renaming `components/ui/button.tsx` | Keep shadcn's kebab-case names |
| A case-only rename with a plain `mv` | Two `git mv` steps |
| `index.ts` re-exporting everything in the module | Export only what other code uses |

## Check

- `app/` holds routing files only; each `page.tsx` is a few lines.
- No import reaches into another module's folders (search for `@/modules/<m>/`).
- No `../../` imports.
- No file over ~250 lines without a reason.
