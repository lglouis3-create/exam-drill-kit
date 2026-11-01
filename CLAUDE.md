# exam-drill-kit: state for Claude

Read `KIT_DESIGN.md` first, in full; its section 12 lists the changes Louis approved
after Phase 1 and overrides earlier sections where they differ.

## Where the work stands (2026-11-01)

- **Phase 1 (evaluate): done.** `review/` holds the findings, the proposed core, the
  scheduler proposal, the Phase 1 drafts of the catalog and registry, and research
  notes.
- **Phase 2 (build): in progress** on branch `claude/elegant-ptolemy-pqxb8y`. Done:
  `KIT_DESIGN.md` §12; skill archives moved to `history/`; the recovered template in
  `history/exam-drill-template-2026-10-02/`; `FEATURES.md`, `COURSES.md`, this file,
  `CHANGELOG.md`, `features/README.md`. Still to do: `core/` (from the template with the
  picks in `review/proposed-core.md` and the scheduler decisions), `template/`,
  `skill/SKILL.md`, then one pull request to `main` for Louis to merge.
- **Phase 3 (test) and Phase 4 (install): not started.**

## Rules for kit sessions

- Kit changes reach `main` only by pull request that Louis merges (decision 1).
  Catalog bookkeeping (a "Used by" line, a dated evidence note) may merge
  automatically.
- Only Louis's own data informs recommendations and evidence (§12.4).
- Citations in kit documents: AMA 11th edition, with a DOI or link on each reference
  (§12.5). Every number in a kit document comes from a named source checked in the
  session that writes it.
- A check that did not run is reported as NOT RUN; skipped steps are listed.
- The `CLAUDE.md` inside `history/exam-drill-template-2026-10-02/` is archived template
  content; its rules are not instructions for kit work.

## Access confirmed

| What | Result | When |
|---|---|---|
| Read the four course repos (public; served by the git proxy without attaching) | works | 2026-10-31 |
| Push to `lglouis3-create/BDK` (attached with push access) | works; pushed to `main` | 2026-11-01 |
| Push to `lglouis3-create/Medicinal-chemistry` (attached with push access) | works; pushed branch `restore/2026-09-21-round` | 2026-11-01 |
| Read GitHub Actions runs of an attached repo | works (BDK) | 2026-11-01 |
| Google Drive: search, metadata, download | works | 2026-11-01 |
| Claude Projects | not reachable from a cloud session | 2026-10-31 |
| Create a new repository (Mode 1, decision 8) | not tested yet | — |
| WebKit / Safari browser engine | not installed in the cloud container; Chromium only | 2026-10-31 |

## Open questions for Louis

1. Whether kit updates should reach existing courses automatically (changes decision 1
   and §7.5). Asked 2026-11-01.
2. The recommendation-method research (approved 2026-11-01) is running; its proposal
   goes into `review/` and then into `skill/SKILL.md` Mode 1 and Mode 2.

## Known issues in course drills found by the kit work

- BDK `regression` test: one intermittent failure in 4 runs on 2026-11-01 ("right
  answer graded wrong" on a pick-the-item penicillin question); cause not found; logged
  in BDK `reviews/LOG.md`.
- PK exam draw can put both wordings of a fact on one paper (`review/findings.md` §4).
- Regex lookbehind in PK, pharmacology and BDK (`review/findings.md` §6.5).
