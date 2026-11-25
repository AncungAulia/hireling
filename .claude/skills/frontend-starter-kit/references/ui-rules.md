# UI rules

These apply to every screen. Values that differ per project (language, brand color, currency, glossary) live in the project's UI profile, `docs/ui-profile.md` (template: `templates/ui-profile.md`). When the profile is missing, ask the user for the fields the current task needs; never invent a brand color, font or glossary term.

## 1. Visual style

- No ALL-CAPS text with wide tracking. Sentence case everywhere; headings use 0 or slightly negative letter-spacing. Hierarchy comes from size, weight and color.
- No eyebrow labels above headings.
- One brand color; everything else is neutral. The brand color is not used as text on a light background. Warnings, errors and successes use their own status colors, not the brand color.
- No thick accent stripe on one side of an element with rounded corners.
- Tabs mark only the active tab; no full-width line under the whole tab row.
- On a gray page background, each content block sits in a white card. Rows inside one list are separated by dividers, not boxed individually.
- Large values in stat cards and badges never overflow their container. Abbreviate (per the profile's number format) and show the full value in a caption or tooltip.
- Everything clickable has `cursor: pointer`; disabled controls have `cursor: not-allowed` (setup in `stack.md`).
- No label, pill or badge that only repeats information already visible.
- **Avoid the generated look.** These are defaults, not choices. Use one only when the design asks for it:
  - an arrow (→) appended to button or link text;
  - one word in a heading picked out in a different color, italic or bold;
  - numbered markers (01, 02, 03) on content that is not a sequence;
  - every block as an identical card with the same radius and the same soft shadow;
  - gradient washes used as decoration;
  - meta text joined with middle dots.
- **Structure carries meaning.** Borders, dividers, numbers and labels encode something about the content. If they encode nothing, remove them.

## 2. Component consistency

- **One kind of control, one component, app-wide.** Never a native browser control when the component library has one: checkbox, radio, switch, select, combobox, date, time and date-range pickers, file upload, slider.
- Controls of the same kind have the same height; controls sharing a row share a size.
- Every search field has a search icon inside it.
- **Formatted inputs.** Any input whose value has a format, such as money, plain numbers, percentages, quantities with a unit, phone numbers or dates, works the same way:
  - It shows the value formatted per the profile while typing, and stores the raw value.
  - Any prefix or suffix (`$`, `%`, `kg`, `+1`) sits inside the input.
  - Numeric inputs never keep leading zeros, and an empty input stays empty rather than turning into 0.
  - Each kind is one shared component, e.g. `NumberInput` with `prefix`, `suffix` and `decimals`.
- **Reorderable lists** use a drag handle, plus a keyboard way to move items.
- **Forms that save**, whether a full page, a dialog or inline editing, all behave the same:
  - Submit is disabled until something changed.
  - While saving, the spinner sits inside the button.
  - After saving, the label switches to a saved status until the next change.
  - An "unsaved changes" indicator, and the leave-page warning, appear only while there are real changes.
- **Fix a component, not a page.** When a shared component is wrong, fix it at the source so every screen using it gets the fix.

## 3. Tables and lists

- Number columns and action columns are right-aligned, with enough gap between columns. Action buttons never stack or touch the edge.
- Label–value pairs keep the value right-aligned, at every width. A long value wraps in place, up to two lines, rather than dropping below its label.
- How tables change on small screens: §4.

## 4. Responsive

**Breakpoints** come from the UI profile.
- The default is mobile below 768 px, tablet from 768 to 1279 px, and desktop from 1280 px.
- In Tailwind that is the base styles, then `md:` for tablet, then `xl:` for desktop. Change them in `globals.css` when the profile differs.

**Reference widths** for design and testing are **390, 834 and 1440 px**.

### Basics

- **Mobile first.** Write the base styles for mobile, then add the tablet and desktop rules.
- **No horizontal scroll** at page level. Only a component designed for it, such as a row of filter chips or a carousel, scrolls sideways, inside its own container. A wide table is not one of them; it stacks (below).
- **Check every screen** at all three reference widths before calling it done.
- **Touch targets are at least 44 px**: buttons, checkboxes together with their label, menu items, links and icons.
  - On touch screens, primitives grow through the `pointer-coarse:` variant (setup in `stack.md`). Mouse layouts stay compact.
  - A checkbox or radio is clickable over its whole label.
- **Long text and values wrap** onto the next line. They are not truncated and do not overflow their container. Images and media scale to the container width.

### Mobile

- The primary action sticks to the bottom of the screen. Add and primary buttons are full width.
- Confirmations and menus become a bottom sheet:
  - full width, with a grab handle;
  - the main action on top, cancel below it.
- Long forms use a full-screen sheet with a title, a close button and a scrollable body, never a short drawer.
- Tables become stacked rows. The title and status share the first line, and the remaining fields merge into one meta line.
- Unimportant columns are hidden, but stay visible on the detail page.
- Toolbar controls (search, filter, select, period) take the full width of their container.
  - When there are several, stack them.
  - A wide control gets its own row.
- A stats grid becomes 2 columns, not 4 narrow ones.
- Main navigation moves to a bottom tab bar, or to a drawer opened from a menu icon.

### Tablet

- **Its own layout.** Tablet is neither a shrunken desktop nor a stretched phone. Decide its behaviour on purpose.
- **Sidebar.** Same as desktop: open, and collapsible.
- **Side columns** (summary, decision panel) move below the main content.
- **Long steppers or tab rows** show only the active step's title.
- **Dialogs** stay dialogs, not bottom sheets, unless the content is a long form.

### Desktop

- Content has a maximum width so text lines stay readable. A form may span the content area when the design says so.
- Sidebar is open and collapsible.
- A table row's detail may open as a right-side panel instead of a new page.

### Toasts

- On mobile, toasts appear at the top center.
- On tablet and desktop, they appear at the bottom right.
- `templates/Providers.tsx` switches between the two at the tablet breakpoint.

## 5. Page states and feedback

### Page states

Every screen handles all six. Not only the happy path.

| State | When | Shows |
|---|---|---|
| Loading | first load of content | a skeleton shaped like the content. Spinners are only for actions, inside the button that started them |
| Empty | loaded, nothing there | what is empty and what to do next. "No data yet" and "filter matched nothing" are different messages, and the second offers to clear the filter. Never repeat a CTA already in the header |
| Error | the request failed | what happened, what to do, and a retry |
| Offline | no network (`ApiError.kind === "offline"`) | that the device is offline, plus a retry |
| No access | 401/403 (`kind` `unauthorized` / `forbidden`) | that the user lacks access and who to ask, or a sign-in action. No retry |
| Success | an action finished | a toast for actions. Loads show the content itself, never a toast |

- Use the components in `templates/PageStates.tsx`.

**State size.** Every state (loading, empty, error, offline, no access) fills the space the content would take, with its message centered on both axes:
- **Page state** (the default): the full width, and the full height left on the screen below the header and above any bottom bar. The page does not scroll and the footer does not jump up.
- **Section state** (inside a card or panel): the full width and height of that card or panel, at least 12 rem tall.
- **How:** a flex chain from `<body>` down: `<body className="flex min-h-dvh flex-col">` (create-next-app's `h-full` on `<html>` plus `flex min-h-full flex-col` on `<body>` does the same), then each layout wrapper and `<main>` with `flex flex-1 flex-col`. The state takes the rest with `flex-1`.
- **Never** a fixed height (`h-[60vh]`, `min-h-screen` inside a page with a header), and never `100vh` (the mobile address bar makes it too tall). Use `dvh` where a viewport height is needed.
- Loading uses the same area as the loaded content, so nothing jumps when the data arrives.

### Feedback by urgency

Pick the channel by what the user must do with the message.

| Situation | Channel |
|---|---|
| A field is invalid | Message under the field. Never a toast |
| Data failed to load | The page or section state above. Never a toast |
| A routine action succeeded (save, add) | Success toast. It uses the button's verb: button "Publish" → toast "Published" |
| An action failed and can be retried | Error toast with a "Try again" action. The form keeps its input |
| An action is risky or cannot be undone (delete, cancel an order, pay, bulk change) | **Confirmation before acting**: `ConfirmDialog` (shadcn AlertDialog; a drawer on mobile) |
| An action can be undone (archive, move to trash) | No confirmation. A toast with an "Undo" action instead |
| The user must decide before going on (session expired, data changed elsewhere) | Dialog |

**A confirmation:**
- Its title names the action and its object ("Delete product Jasmine Tea?").
- Its body states the consequence ("This product will be removed from the list and can't be restored.").
- The confirm button repeats the verb ("Delete product", never "OK" or "Yes"). A destructive confirm uses the destructive style.
- Cancel is always available. It is not available while the action runs, and the dialog stays open until the action finishes.

**Never:**
- a toast for something the user must act on;
- a dialog for a routine success;
- a confirmation on every small reversible action. Asking every time trains people to click "Yes" without reading.

Toasts come from Sonner; dialogs and drawers from shadcn (`components.md`).

## 6. UI text

- Follow the profile's language and form of address. Tone is formal and consistent, with no slang.
- Avoid "·", ":" and ";" in UI text. Separate with a new line, layout or a comma.
- No em dash. An en dash only for ranges (`08:00–17:00`).
- Buttons start with a verb and say what they do (`Save product`, not `OK`).
- Error messages say what happened and what to do. Technical text, and backend messages in another language, never reach the screen. `lib/apiClient.ts` maps errors to a `kind` with its own message (see `data-and-state.md`).
- No emoji. An exclamation mark only for a rare success. An ellipsis only for a process in progress (`Saving…`).
- Every input has a visible label, plus helper text when the field has a rule (format, limit).
- Use the profile's glossary: one concept, one term, everywhere.
- One action keeps one name through the whole flow: menu item, button, confirmation and toast.
- Name things the way users understand them, not the way the system is built ("Notifications", not "webhook").
- Errors do not apologise and are never vague about what happened.
- An empty screen invites the next step. It does not set a mood.

## 7. Way of working

- The design is the reference. Never drop a designed feature because the API is not ready; list it as a backend gap in the final message and the PR.
- Do not edit the design source (Figma, pen.dev, …) when the profile says it is read-only.
- **No design source?** Before building a new screen, write a short plan and confirm it with the user:
  - colors as named hex values, within the profile;
  - typefaces and their roles;
  - a layout sketch in ASCII.
  Then check that plan against the generated-look list in §1.
- Review your own screens through screenshots at the three reference widths, not only through code.
- Route folders hold routing only (`structure.md`).
- Motion follows the `motion-rules` skill, applied to this stack through `motion.md`.

## Common mistakes

| Don't | Instead |
|---|---|
| `$1250000`, `1250000.5`, `2026-11-21T03:00:00Z` on screen | `formatCurrency`, `formatNumber`, `formatDate` from `lib/format.ts` |
| An empty value shown as `0`, `null` or blank | The `lib/format.ts` helpers, which show "-" only when the value really is empty |
| A toast for a load error | `ErrorState` on the screen |
| A dialog for "saved" | A toast, or the button's saved label |
| A blocking spinner over the whole page | A skeleton shaped like the content |
| An empty or error state squeezed into the top of the page | It fills the rest of the screen, centered (§5, State size) |
| `h-[60vh]` or `min-h-screen` on a state | `flex-1` in a flex column chain |
| `OK`, `Submit`, `Yes` on buttons | A verb plus the object: `Save product`, `Delete product` |
| "An error occurred. We apologize." | What happened and what to do: "The product wasn't saved. Check your connection, then try again." |
| "Delete" in the menu, "Remove" in the dialog | One action, one name |
| An icon-only sidebar on tablet | The same sidebar as desktop |
| A table squeezed onto a phone | Stacked rows on mobile (§4) |
| A hover-only action | Visible on touch screens too |
| Gradient text, glass cards, an eyebrow above every section | §1 |

## Check

- Each touched screen was seen at 390, 834 and 1440 px, with no horizontal scroll.
- Each data view was seen in loading, error, empty and data states, and each state filled its page or section.
- Every number, money value and date goes through `lib/format.ts`.
- UI text follows §6: no "·", ":" or ";", no em dash, verbs on buttons.
