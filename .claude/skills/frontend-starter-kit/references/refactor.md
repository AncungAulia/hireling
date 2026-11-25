# Tidy mode: restructure without changing behaviour

Only when the user asked for it. The output is the same app, in the shape from `structure.md`, with proof that nothing changed.

## Steps

1. **Map.** List current folders, the largest files, duplicated blocks, unused files and exports, direct fetch/axios calls in components, fallback or sample data. Show the user the map and the proposed target tree before moving anything.
2. **Lock behaviour.** Run the existing typecheck, lint, tests and build, and record the results. Where a screen you will touch has no test, add a small test of its current behaviour first.
3. **One concern per PR.** Typical order:
   1. Move files into the target folders (`git mv` + import rewrite; no code edits).
   2. Delete unused files and exports, verified by search and by build.
   3. Split giant files by responsibility (hook / view / sub-components).
   4. Extract repeated code that meets the rule of three.
   5. Introduce the data chain (api function → hook) where components fetch directly.
4. **Re-verify after each step.** Typecheck, lint, tests and build must match step 2. Open the touched screens in a browser.
5. **Report behaviour you found but did not change.** Fallback or sample data shown on failure, wrong labels, bugs. Fixing them changes behaviour, so it is a separate fix PR the user approves.

## Moving files safely

- Use `git mv` so history follows the file.
- Rewrite imports with a script (TypeScript compiler API or codemod), not by hand; then grep for the old paths.
- Update route-dependent config (route names, `next.config`, test globs).
- Run the steps on a clean working tree; commit before any branch switch.

## What counts as a behaviour change

Any difference a user or the backend could notice: rendered text, requests sent, timing of requests, URLs, error handling, default values. Those do not belong in a Tidy PR.

## Common mistakes

| Don't | Instead |
|---|---|
| Moving files and changing code in one commit | Moves first, with no code edits; changes in the next step |
| Fixing a bug found while tidying | List it in the report; it becomes its own fix PR |
| Removing `?? []` fallbacks during Tidy | List them; removing one changes what users see |
| Renaming exports "while we're here" | Only renames from the agreed target tree |
| Rewriting imports by hand | A script, then grep for the old paths |
| Deleting a file because search found no import | Also check dynamic imports, route files and config, then build |
| "Looks the same" with no proof | The step 2 results, matched after every step |

## Check

- Typecheck, lint, tests and build match the step 2 results.
- The touched screens look and behave the same in a browser.
- The report lists every behaviour found but not changed.
