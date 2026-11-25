# Data and state

## Where each kind of state lives

| State | Home | Example |
|---|---|---|
| Data from the server | TanStack Query | product list, current user |
| Shareable view state | URL search params | `?category=drinks&page=2&q=tea` |
| Form input and validation | react-hook-form + zod | add-product form |
| Client state shared across distant components | Zustand store | cart, sidebar open, selected rows kept across pages |
| Everything else | `useState` in the component | dialog open, hover, tab |

Never copy query data into `useState` or Zustand. Derive with `useMemo` or `select` instead.

## Server Component or TanStack Query

| Page | Fetch with |
|---|---|
| Public, SEO-relevant, mostly read-only | Server Component (`async` page, `fetch` or the api function on the server) |
| Interactive: filters, mutations, polling, optimistic updates | TanStack Query in a client component |

Pick one per page. Both use the same api functions and schemas from the module.

## The data chain

```
component → use<Thing>Query/Mutation (modules/x/api/use<Thing>.ts)
          → x.api.ts function (parses with zod)
          → lib/apiClient.ts (axios instance, error normalisation)
```

See `templates/example-module/` for one complete module.

### Query keys

One factory per module, so invalidation hits exactly what it should:

```ts
export const productKeys = {
  all: ["products"] as const,
  list: (filters: ProductFilters) => [...productKeys.all, "list", filters] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};
```

### Mutations

- Invalidate the affected keys in `onSuccess`.
- Show success and failure with a toast (`sonner`) or inline message; the error text comes from `ApiError.message`.
- Disable the submit button while `isPending`.

### Errors

`lib/apiClient.ts` turns every failure into an `ApiError`:

| Field | Holds |
|---|---|
| `kind` | `offline`, `unreachable`, `timeout`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `validation`, `server`, `invalid_response` or `unknown` |
| `message` | copy written for people, in the UI language, mapped from `kind` |
| `status` | the HTTP status, or null |
| `details` | the raw response body or zod issues, for logs only |

- **Screen text.** The backend's own message reaches the screen only when `SHOW_SERVER_MESSAGES` is on. The UI profile decides that.
- **Branching.** Branch on `kind`, never on message text. `ErrorState` uses it to pick the error, offline or no-access state.
- **Field errors.** When a `validation` error carries per-field errors in `details`, map them onto the form with `form.setError`.
- **Bad responses.** A response that fails zod parsing is an error (`invalid_response`), not something to patch with defaults.

## URL state

Read with `useSearchParams` (client) or the `searchParams` prop (page), write with `router.replace`:

```ts
const params = useSearchParams();
const router = useRouter();
const pathname = usePathname();

const category = params.get("category") ?? undefined;

function setCategory(next: string | undefined) {
  const sp = new URLSearchParams(params);
  if (next) sp.set("category", next);
  else sp.delete("category");
  router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
}
```

Put the URL values into the query key so each filter combination caches separately.

## Zustand

Add it only for the "shared across distant components" row above.

**REQUIRED SUB-SKILL:** `zustand` from [josephyaduvanshi/zustand-skill](https://github.com/josephyaduvanshi/zustand-skill) (MIT; Zustand v5, Next.js SSR, persist, testing). Load it before writing or changing a store.
- **Not installed yet?** Install it the first time a store is needed, not before. Tell the user first, because it downloads from GitHub:

  ```bash
  git clone --depth 1 https://github.com/josephyaduvanshi/zustand-skill ~/.claude/skills/zustand
  ```

- **The user declines, or the agent is not Claude Code:** follow the rules below. They match that skill's Next.js pattern.

### Next.js: a factory and a provider, never a module-level store

A module-level `create()` store is one object per server process. During SSR it is shared by every request, so one user's state can leak into another user's page. In Next.js:

```ts
// src/modules/cart/store.ts: a FACTORY, not a global store
import { createStore } from "zustand/vanilla";

type CartState = { itemIds: string[] };
type CartActions = { add: (id: string) => void; clear: () => void };
export type CartStore = CartState & { actions: CartActions };

export const createCartStore = (init: CartState = { itemIds: [] }) =>
  createStore<CartStore>()((set) => ({
    ...init,
    actions: {
      add: (id) => set((s) => ({ itemIds: [...s.itemIds, id] })),
      clear: () => set({ itemIds: [] }),
    },
  }));
```

```tsx
// src/modules/cart/CartStoreProvider.tsx
"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createCartStore, type CartStore } from "./store";

const CartStoreContext = createContext<ReturnType<typeof createCartStore> | null>(null);

export function CartStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createCartStore()); // one store per provider mount
  return <CartStoreContext.Provider value={store}>{children}</CartStoreContext.Provider>;
}

function useCartStore<T>(selector: (s: CartStore) => T): T {
  const store = useContext(CartStoreContext);
  if (!store) throw new Error("useCartStore must be used inside CartStoreProvider");
  return useStore(store, selector);
}

// Export narrow hooks only; the raw store hook stays private.
export const useCartCount = () => useCartStore((s) => s.itemIds.length);
export const useCartActions = () => useCartStore((s) => s.actions);
```

### Rules

- **Never select the whole store.** One field per selector, or `useShallow` for a small pick.
- **Selectors return stable values.** A new object or array on every call throws "getSnapshot should be cached".
- **Export narrow hooks** (`useCartCount`), never the raw store hook.
- **Actions live in one stable `actions` object.** Name them as events (`checkoutStarted`), not setters.
- **Server Components never touch a store.** They fetch and pass props; seed a store through the provider's initial state.
- **persist:**
  - Use it only when the user expects the state to survive a reload.
  - Use `skipHydration: true` and call `rehydrate()` after mount, otherwise you get a hydration mismatch.
  - State that must be correct in the first HTML (theme, locale) goes in a cookie instead.

## Common mistakes

```tsx
// ❌ Fetch in the component: no cache, no shared states, no parsing
useEffect(() => { axios.get("/products").then((r) => setProducts(r.data)); }, []);
// ✅ Through the module's hook
const query = useProductsQuery(filters);
```

```ts
// ❌ Masks a failure as "no data"
const products = query.data ?? [];
// ✅ Each state is its own branch (components.md, Data views)
if (query.isPending) return <LoadingState />;
if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
```

```ts
// ❌ Branches on message text, which changes with language or backend
if (error.message.includes("not found")) { … }
// ✅ Branches on kind
if (error instanceof ApiError && error.kind === "not_found") { … }
```

```ts
// ❌ A new array on every call: "getSnapshot should be cached", infinite renders
const items = useCartStore((s) => s.items.filter((i) => i.selected));
// ✅ Select the raw value, derive in render
const items = useCartStore((s) => s.items);
const selected = useMemo(() => items.filter((i) => i.selected), [items]);
```

| Don't | Instead |
|---|---|
| Query data copied into `useState` or a store | Read it from the query; derive with `select` or `useMemo` |
| Inline keys: `["products", id]` | `productKeys.detail(id)` |
| `setQueryData` guesses after a mutation | Invalidate the affected keys |
| A response used without parsing | `parseResponse(schema, data)` in the api function |
| Filters kept in `useState` | URL search params, also in the query key |
| `create()` at module level in Next.js | Store factory + provider |

## Check

- No `axios` or `fetch` call outside `modules/*/api/` and `lib/apiClient.ts`.
- Every response is parsed with its zod schema.
- Every mutation invalidates the keys it changes.
- No `?? []`, `?? 0` or `|| "-"` that hides a failed or missing value (the `lib/format.ts` helpers showing "-" for an empty field is fine).
