# Tests

Playwright suites covering the benchmark engine, the school configuration, the interface, and
Firebase sign-in failures. 31 checks across four files.

## Running them

```bash
npm install playwright
npx playwright install chromium
sed 's/apiKey: .*/apiKey: "PASTE_TEST_LOCAL_ONLY",/' ../index.html > /tmp/test.html
node benchmarks.test.js
node config.test.js
node interface.test.js
node auth.test.js
```

Stubbing the API key matters: with a real key the suites would write test classes into a live
classroom database. With it stubbed the app falls back to localStorage, which is enough to drive
the whole teacher → student → teacher flow in one browser context.

If Chromium sits somewhere non-standard, set the launch path at the top of each file.

## What each suite covers

**benchmarks.test.js** — default CAT4 + NGRT set-up, cut scores seeded from percentiles, turning on
extra tests, adding a school benchmark, 2–5 tiers, custom cut-score overrides, per-tier task
versions, reading demand, the generated student form, range validation, the live tier preview,
tier-correct task delivery, the class profile, grouping, and config round-tripping.

**config.test.js** — a school running MAP only on two tiers, required benchmarks, RIT anchored to a
school mean, the prior-knowledge check running after the benchmark step, blended grouping, mixed
group shape, and the privacy switch that strips raw scores.

**auth.test.js** — stubs a project where anonymous sign-in has not been enabled, and checks that the
teacher gets a standing "Not syncing" banner naming both cause and consequence, that a student on a
*separate* device (no localStorage cache to mask it) is told the real reason rather than to check
their internet, and that the banner clears once sign-in succeeds.

**interface.test.js** — room furniture, four seats per table, dragging a table and its position
persisting through a re-render, drags not opening the edit modal, layout reset, and the dashboard
KPI strip rendering at full height.
