# Mock mode: example data before the backend is ready

The one exception to the honest-data rule. It exists so the user can see a screen with data while an endpoint is not built or not wired yet.

## Ask first

When a screen needs an endpoint the backend does not serve yet, **ask the user** whether they want mock mode for it. Never add mocks on your own initiative.
- **No:** build the screen against the real API. It shows its honest states (error or empty) until the backend is ready, and the gap is listed in the final message.
- **Yes:** set it up as below.

## How it works

`axios-mock-adapter` is attached to the one axios instance in `lib/apiClient.ts`:
- **Mocked endpoints** answer from in-memory example data.
- **Every other request** passes through to the real backend, so mocked and real endpoints can be mixed.
- **App code is untouched.** Components, hooks, api functions and zod schemas stay exactly as they are against the real API.
- **Server Components are covered too.** They call the same api functions through the same instance.

```
src/mocks/
├── attachMocks.ts          creates the adapter, registers each module's handlers
├── mockUtils.ts            pathParam() and parseBody() shared by handlers
├── MockBanner.tsx          "Sample data mode is on" banner
├── handlers/
│   └── productMocks.ts     one file per module: registerProductMocks(mock)
└── fixtures/
    └── products.ts         example data, parsed through the real schema
```

## Setup

1. `<pm> add -D axios-mock-adapter`.
2. Copy `templates/mocks/` to `src/mocks/`. Use `templates/apiClient.ts` and `templates/Providers.tsx`; they already contain the switch and the banner.
3. Switch it on in `.env.local`:

   ```bash
   # Mock mode (dev only): enabled | off
   NEXT_PUBLIC_API_MOCKING=enabled
   ```

   Add the same line, set to `off`, to `.env.example`.

## Adding mocks for a module

Write one file per module in `src/mocks/handlers/` and add its register function to the list in `attachMocks.ts`:

```ts
const ORDER_NOTE_PATH = /^\/orders\/([^/]+)\/note$/;

export function registerOrderMocks(mock: MockAdapter) {
  let orders: Order[] = [...orderFixtures];

  mock.onPut(ORDER_NOTE_PATH).reply((config) => {
    const id = pathParam(ORDER_NOTE_PATH, config);
    const body = parseBody(orderNoteInputSchema, config);
    if (!body.ok) return body.reply;
    orders = orders.map((o) => (o.id === id ? { ...o, note: body.data.note } : o));
    return [200, orders.find((o) => o.id === id)];
  });
}
```

- **Routes.** Match a relative path (`"/products"`) or a regex with one capture group for the id. Read the id with `pathParam`.
- **Request bodies.** Validate them with the same zod input schema the module uses (`parseBody`). An invalid body gets the 422 the real API would send.
- **Response bodies.** Use the shape the real API returns. Not-found gets 404 with a message, exactly like the backend, so the screen's error states are exercised.
- **Fixtures** go through the real schema (`z.array(productSchema).parse([...])`), so they can never hold a shape the API would not return.
- **Local state.** Keep state inside the register function. Changes last until reload, and the server and the browser each hold their own copy.

## Rules

- **Only in dev, and nothing ships.** The switch is `process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled"`, written **inline** where it is used.
  - In `apiClient.ts`, the mocks are loaded with a **dynamic** `import()` inside that condition.
  - A static import, or a condition imported as a constant, keeps the adapter and the fixtures in the production bundle.
  - After `build`, search `.next/static` and `.next/server` (excluding `.map`) for `onNoMatch` or a fixture name. Neither may be there.
- **Requests sent before the mocks load** wait in a request interceptor, then take the mock adapter. This is already in the template; keep it.
- **Always labelled.** While mock mode is on, the banner is visible on every page.
- **App code never imports `src/mocks/`.** Only `apiClient.ts` (dynamic import), `Providers.tsx` (banner) and tests may.

## When the backend is ready

1. Delete that endpoint's handler. The request then passes through to the real backend automatically.
2. Check the screen with mock mode off.
3. When a module has no handlers left, remove its file and its entry in `attachMocks.ts`. Keep the fixture only if tests use it.
4. When no handlers are left at all, set `NEXT_PUBLIC_API_MOCKING=off`.

Mocks live in one folder instead of being deleted at once. Endpoints switch to the real backend one by one, and the app can never show example data silently.

## Common mistakes

```ts
// ❌ Static import: the adapter and fixtures ship in the production bundle
import { attachMocks } from "@/mocks/attachMocks";
if (MOCKING_ENABLED) attachMocks(apiClient);
// ✅ Inline condition + dynamic import: removed from the build
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
  const mocksReady = import("@/mocks/attachMocks").then(({ attachMocks }) => attachMocks(apiClient));
  // + the waiting interceptor from templates/apiClient.ts
}
```

```ts
// ❌ Accepts anything and always succeeds, so error states are never seen
mock.onPost("/products").reply(201, { id: "1" });
// ✅ Same validation and status codes as the real API
mock.onPost("/products").reply((config) => {
  const body = parseBody(productInputSchema, config);
  if (!body.ok) return body.reply;
  …
});
```

| Don't | Instead |
|---|---|
| Adding mocks without asking | Ask first |
| `?? sampleProducts` in a component | A handler in `src/mocks/handlers/` |
| Fixtures typed by hand | `z.array(schema).parse([...])` |
| State at module level in a handler file | State inside the register function |
| Hiding mock mode | The banner on every page |
| `onNoMatch: "throwException"` | `"passthrough"`, so real endpoints keep working |

## Check

- With `NEXT_PUBLIC_API_MOCKING=off`, the app calls only the real API.
- After `build`, `.next/static` and `.next/server` (excluding `.map`) contain no `onNoMatch` or fixture names.
- The banner shows on every page while mock mode is on.
