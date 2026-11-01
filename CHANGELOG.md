# Changelog

Dated kit changes, newest first.

## 2026-11-01
- `core/` and `template/`: the recovered template split into the shared engine and the
  new-course skeleton, with the build writing to the repository root, `store` for
  refused writes, the offline copy scoped to each course's own caches, the exam draw
  keeping dupOf families off one paper across pools, the update offer and place after
  a reload, check exit codes with `run_checks.sh` and the Safari lint, the answer
  history and the Home Screen card. Each change has a test shown failing on the
  template first.
- `KIT_DESIGN.md` §12.9: how kit updates reach courses (Louis's choice). Feature and core
  updates are built to each course's preview automatically and go live on his reply;
  catalog bookkeeping and `small-fix` changes go live automatically when every check
  passes, the progress format is unchanged, and no exam is within N days (N not set).
  `skill/SKILL.md` Mode 7 and the phrase table describe the kit-update run and undo.
- `review/recommendation-proposal.md`: how the kit recommends features (material-profile
  signals, a rule table with evidence levels, a within-course random comparison of
  concept clusters, decision rules), with nine questions for Louis; research notes in
  `review/research-notes/recommendation-2026-11-01.md`. `skill/SKILL.md` "Recommending
  features" and `KIT_DESIGN.md` §12.7 describe it, pending approval.
- `KIT_DESIGN.md` §12: design changes Louis approved after Phase 1.
- Skill archives moved to `history/`; recovered template kept in
  `history/exam-drill-template-2026-10-02/` (from Medicinal-chemistry's unpushed `baed236`).
- `FEATURES.md` (50 entries), `COURSES.md` (4 courses), `CLAUDE.md`, `features/README.md`
  created from the Phase 1 drafts.
- `review/scheduler-proposal.md` approved: concept scheduler default with exam-date
  spacing, confident-error check, calculation preset and answer log; FSRS-7 option;
  off-by-default combination with a built-in comparison.

## 2026-10-31
- Phase 1 evaluation: `review/findings.md`, `review/proposed-core.md`,
  `review/FEATURES.draft.md`, `review/COURSES.draft.md`.

## 2026-10-30
- `KIT_DESIGN.md` (design brief) and the two skill archives added.
