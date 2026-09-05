# Class Map — beta

A live map of a classroom during a station-based lesson, with CAT4 and NGRT wired into what each student is actually handed.

One self-contained HTML file. No build step, no install, no accounts. Host it anywhere static and share the link.

> **Beta.** In active use for action research at GEMS Education. See [Known limitations](#known-limitations) before putting it in front of a class you care about.

---

## What it does

**Students** join with a class code and their name, enter whatever benchmark scores the school collects, and see a plan of the room. They tap the table they're working at, ask for clarification, request a card, or mark themselves finished.

**Teachers** see the whole room live — who is where, who is stuck, who has finished — plus a dashboard that leads with the one question worth answering: *who needs me first?*

The part nothing else does: **the benchmark data reaches the task card.** A student's CAT4 SAS and NGRT reading age set a tier, and the tier decides which version of the station task they're given. Set a station's reading demand and the students who read below it get flagged before they struggle, not after.

## Screens

| | |
|---|---|
| **Room plan** | Top-down plan of the actual classroom — whiteboard, door, teacher desk, a table per station. Students appear as seats in their tier colour. Teachers drag tables to match the real furniture. |
| **Dashboard** | KPI strip, a triage queue sorted clarification → card request → red flag, tier profile, station load, movement ticker. |
| **Profile & Groups** | Per-student benchmark profile with flags, and group suggestions by tier, prior knowledge, or blended — every one overridable by dragging. |
| **Benchmarks** | The school's configuration: which tests, which fields, tier names, cut scores, flag thresholds, privacy. |

## Benchmarks supported

CAT4 and NGRT are the standard and ship switched on. Also available:

| Test | Publisher | Fields |
|---|---|---|
| **CAT4** | GL Assessment | Mean SAS, four battery scores, bias |
| **NGRT** | GL Assessment | Standardised score, reading age, stanine |
| NGST | GL Assessment | Standardised score, spelling age |
| PTE / PTM / PTS | GL Assessment | Standardised score, national percentile |
| MAP Growth | NWEA | RIT, achievement percentile |
| Baseline | School | Percentage |
| *Anything you define* | School | Any name, scale, range, weight |

Scales understood: standardised (mean 100, SD 15), stanine, percentile/NPR, RIT, reading age, raw %. Each converts to a common percentile so different tests sit side by side.

## How a tier is decided

```
raw score  →  percentile (via the test's scale)
           →  tier (from that test's cut scores)
           →  overall tier (weighted mean across enabled tests)
```

Cut scores are seeded from percentile boundaries you set once, then each test can be overtyped with the school's own published figures. A teacher override always wins and is remembered.

Nothing regroups or re-tiers students on its own. The app produces suggestions with the evidence attached; the teacher decides.

## Getting started

1. **Firebase** — the config in `index.html` points at the project used for the trial. Swap it for your own: Firebase console → new project → Realtime Database → copy the web config into `FB_CONFIG` near the bottom of the file.
2. **Turn on anonymous sign-in** — Firebase console → Build → Authentication → Sign-in method → Anonymous → Enable. The app signs every device in anonymously; students never see a login. Without this the app will tell you it can't sync.
3. **Lock the database rules** — Realtime Database → Rules:

   ```json
   {
     "rules": {
       "classmap": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```
4. **Host it** — drag `index.html` onto [Netlify Drop](https://app.netlify.com/drop), or turn on GitHub Pages for this repo (Settings → Pages → deploy from `main`, root). `index.html` is the whole app.
5. **Teach** — open the link, choose *I'm the teacher*, pick a class code, set up **⚙️ Benchmarks**, and share the link and code.

Full walkthrough: [`docs/setup-guide.md`](docs/setup-guide.md).

## Repository layout

```
index.html                              the entire application
docs/setup-guide.md                     teacher-facing set-up walkthrough
docs/ui-concepts.html                   eight interface concepts, live and clickable
docs/comparison-nearpod-classkick.md    where this sits against Nearpod, Classkick, Class Charts
tests/                                  Playwright suites (31 checks)
```

## Tests

```bash
npm install playwright
node tests/benchmarks.test.js    # benchmark engine, student flow, differentiation
node tests/config.test.js        # alternate school configs, prior-knowledge check, privacy
node tests/interface.test.js     # room plan, table dragging, dashboard
node tests/auth.test.js          # what the user sees when Firebase sign-in fails
```

Each suite runs against a copy of `index.html` with the Firebase key stubbed, so tests never write to a live classroom database. Create it with:

```bash
sed 's/apiKey: .*/apiKey: "PASTE_TEST_LOCAL_ONLY",/' index.html > /tmp/test.html
```

## Known limitations

- **Benchmark scores are self-reported.** Students type their own figures. There's no roster import and no MIS integration, so check the dashboard in the first few minutes of a lesson and use the tier override freely.
- **Access control is anonymous, not per-user.** Anonymous sign-in keeps the database closed to the open internet, but it does not tell one student from another — anyone who can load the page can sign in. Treat class codes as the only real gate, and don't put anything in here you wouldn't put on a classroom wall.
- **No student work is captured.** This tracks where students are and what they need, not what they produced. Pair it with something that does if you need evidence of learning.
- **Nothing persists across lessons.** Each class is a code and a session; there's no progress history.
- **One lesson at a time.** This is deliberately not a platform.

## Licence

MIT — see [`LICENSE`](LICENSE).
