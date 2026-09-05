# ClassMap — Benchmark Edition

One self-contained HTML file. Host it anywhere (Netlify Drop, Vercel, GitHub Pages, the school intranet) and share the link.

## Before the first lesson: two Firebase switches

The app signs every device in to Firebase **anonymously** so the database can be closed to the open internet. Two things have to be set once, in the Firebase console for your project:

1. **Build → Authentication → Sign-in method → Anonymous → Enable.**
2. **Build → Realtime Database → Rules**, then publish:

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

If anonymous sign-in is off, the teacher's screen shows a red **"Not syncing"** banner naming the cause, and students are told the same thing rather than being told to check their internet. Nothing is silently lost — the app just can't share the class between devices until it's on.

Anonymous sign-in keeps strangers out of the database. It does **not** distinguish one student from another, so the class code remains the only real gate on who joins a lesson.

---

## What's new

CAT4 and NGRT are the school standard and ship switched on. Everything downstream — tiers, groups, task cards, flags, the dashboard — reads from a single benchmark configuration you control in **⚙️ Benchmarks**.

### Benchmark tests available

| Test | Publisher | Fields collected |
|---|---|---|
| **CAT4** *(on by default)* | GL Assessment | Mean SAS, four battery SAS scores, bias/profile |
| **NGRT** *(on by default)* | GL Assessment | Standardised score, reading age, stanine |
| NGST | GL Assessment | Standardised score, spelling age |
| PTE / PTM / PTS | GL Assessment | Standardised score, national percentile |
| MAP Growth | NWEA | RIT score, achievement percentile |
| Baseline (internal) | School | Percentage score |
| *Your own* | School | Any name, scale, range and weight you define |

Scales understood: standardised (100/15), stanine, percentile/NPR, RIT, reading age, raw %. Each converts to a common percentile so different tests can sit side by side.

---

## Setting it up (teacher, five minutes)

1. Log in as teacher with a class code.
2. **⚙️ Benchmarks** → *Benchmark tests*: tick the tests your school actually holds, and inside each one tick only the figures you want students asked for. Set a **weight** (CAT4 and NGRT default to ×2) and mark anything **required**.
3. *Tiers & cut scores*: choose 2–5 tiers and name them. Set the boundaries once as percentiles — every test inherits them. Then, if the school publishes its own cut scores, overtype the values shown in each test's own units (e.g. CAT4 SAS 90 / 110) and that test leads on your numbers.
4. *Flags*: switch on the prompts you want and set their thresholds — reading-age gap, spiky CAT4 profile, bias, priority/stretch, prior-knowledge mismatch, text above reading age, missing data.
5. *Scales & privacy*: set the class's typical chronological age (reading ages are judged against it), MAP RIT mean/SD if used, and who can see raw scores.
6. **Save settings**. Use **⬇ Export config** to hand the same set-up to another teacher, who imports it into their class.

---

## What students see

After entering the class code and their name, students get a **Your Benchmarks** screen generated from your configuration — only the tests you enabled, only the fields you ticked, with ranges validated as they type. If you allowed it, they see the tier their scores put them in; if you didn't, they see nothing. They can skip unless a test is marked required. The prior-learning check, if published, follows straight after.

---

## What the data drives

**Tiers.** Each test yields a tier from its own cut scores; the overall tier is the weighted average, rounded. You can override any student's tier from the dropdown beside their name — your choice always wins and is remembered.

**Groups.** *Profile & Groups* suggests groups by benchmark tier, by prior knowledge, or blended, in similar-ability or deliberately mixed shape. Drag any name into any group to override. Nothing regroups on its own.

**Differentiated task cards.** Edit any station (✎) and write the task once for everyone, then optional versions per tier. Each student is served the version for their tier; the card is marked *your version*. Set a **reading demand** (a reading age) on a station and students reading below it get a quiet prompt to pair up, while you get a flag.

**Class profile.** The dashboard opens with tier distribution, data coverage, mean CAT4 SAS, median reading age, how many read below age, and a *Worth a look* list of every flagged student with the reason.

---

## Privacy

Benchmark scores are self-reported and live only in this class's record. Three switches: hide raw scores on teacher screens (tiers only), hide a student's own tier from them, and hide tiers on the projected clarification board. Use the third one whenever the board goes on the big screen.
