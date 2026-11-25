# Testing

## Unit and component: Vitest + Testing Library

Config in `templates/vitest.config.mts` and `templates/vitest.setup.ts`.
- The setup stubs `window.matchMedia`, which jsdom lacks, and defaults it to the mobile layout. So components that use `useMediaQuery` (ConfirmDialog, ResponsiveDialog) render their drawer in tests.
- To test the desktop variant, override `window.matchMedia` in that test.

Test, in order of value:

1. Pure helpers (`lib/format.ts`, module `utils.ts`, zod schemas).
2. Module components through their states (loading, error with retry, no access, empty, data). Mock the api module or the HTTP layer; never the component under test.
3. Forms:
   - leaving a required field shows its error;
   - invalid input blocks submit;
   - valid input calls the mutation with typed values;
   - the save button follows `ui-rules.md` §2.
4. Risky actions: nothing happens until the confirmation is accepted, and cancel does nothing.

Query by role and label (`getByRole("button", { name: "Save" })`), not by class or test id. Wrap components that use TanStack Query in a fresh `QueryClient` per test with `retry: false`.

Vitest cannot render async Server Components; cover those pages with E2E.

Examples of all of the above: `templates/example-module/components/*.test.tsx`.

## End-to-end

- **You are Claude and Claude in Chrome is connected:**
  - Start the dev server and open the page in a new tab.
  - Walk the flow and check each state. Force the error state by pointing the API env at a dead host or by blocking the request.
  - Read the console for hydration warnings.
  - Record a GIF for flows the user will review.
  - If Chrome does not respond after two tries, stop and say so; do not loop.
- **Otherwise:** Playwright. `<pmx> playwright install chromium`, specs in `e2e/`, `webServer` in `playwright.config.ts` starts the app. Add a `test:e2e` script.
- **Either way, check widths.** Look at each page at 390, 834 and 1440 px (resize the window, or use Playwright viewports). Check for horizontal scroll, overflowing text and the small-screen patterns of `ui-rules.md` §4. If the window cannot be resized (e.g. it is maximised), say which widths went unchecked.

## Mocks and fixtures

- **In tests**, mock the api module with `vi.mock`, or reuse `src/mocks/fixtures` when mock mode exists.
- **In the app**, example data appears only through mock mode (`mocking.md`). App code never imports fixtures or `src/mocks/`.

## Common mistakes

```tsx
// ❌ Tied to markup and class names; breaks on any restyle
container.querySelector(".btn-primary");
// ✅ What the user sees
screen.getByRole("button", { name: "Save product" });
```

```tsx
// ❌ One client shared by all tests, with retries: slow and leaks cache between tests
const client = new QueryClient();
// ✅ A fresh client per test, no retries
function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
```

```tsx
// ❌ Mocks the component under test, so the test proves nothing
vi.mock("./ProductList");
// ✅ Mocks the boundary: the api module
vi.mock("../api/products.api", () => ({ getProducts: vi.fn(), deleteProduct: vi.fn() }));
```

| Don't | Instead |
|---|---|
| `fireEvent` for typing and clicks | `userEvent.setup()`, then `await user.type(...)` |
| `getBy…` for something that appears after a request | `await screen.findBy…` |
| `waitFor(() => {})` with several assertions inside | One assertion per `waitFor`, or `findBy…` |
| Testing only the success path | Loading, error with retry, empty and data |
| Snapshot tests of whole pages | Assertions on what the user sees |
| Unit-testing an async Server Component | E2E |
| Saying "checked in the browser" without listing the widths | Name the widths checked, and the ones that were not |

## Check

- `test` passes, and the new tests fail when the behaviour they cover is removed.
- Each touched data view has tests for its states; each form has a test for leaving a required field.
- E2E or a Chrome walk-through covered the touched flow at 390, 834 and 1440 px, or the gap is listed.
