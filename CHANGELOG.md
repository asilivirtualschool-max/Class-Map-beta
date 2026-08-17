# Changelog

## Beta — August 2026

### Benchmark layer
- CAT4 and NGRT as the school standard, switched on by default.
- NGST, PTE, PTM, PTS, MAP Growth, an internal baseline, and unlimited school-defined benchmarks.
- Scale conversion for standardised scores, stanines, percentiles, RIT, reading ages and raw percentages.
- 2–5 configurable tiers with school-set names, percentile boundaries, and per-test cut-score overrides.
- Teacher tier overrides, remembered per class.
- Flags: reading-age gap, spiky CAT4 profile, bias, priority support, needs stretch, prior-knowledge mismatch, task text above reading age, missing data — each switchable with its own threshold.
- Configuration export and import, so one set-up can be shared across classes.
- Privacy switches for raw scores on teacher screens, a student's own tier, and the projected board.

### Differentiation
- Per-tier task card versions on every station; students are served their own.
- Per-station reading demand, with a quiet prompt to the student and a flag to the teacher.

### Interface
- Sports-stadium map replaced with a top-down room floor plan; tables are draggable to match the real room and positions persist.
- Dashboard rebuilt as a command strip: KPI row, a triage queue that leads on who needs you first, tier profile, station load, movement ticker.
- Eight interface concepts kept in `docs/ui-concepts.html` for reference.

### Fixes
- Student benchmark data was being wiped when leaving a station.
- The first tap on a station could serve the untiered task version before the tier resolved.
- Benchmark coverage under-counted students who had a reading age but no standardised score.
