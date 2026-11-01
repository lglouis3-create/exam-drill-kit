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
  `CHANGELOG.md`, `features/README.md`, a first draft of `skill/SKILL.md`; `core/` and
  `template/` from the recovered template with the picks in `review/proposed-core.md`
  (merged in `5014f27`; on a fresh scratch course `run_checks.sh` gave 15 PASS, 0 FAIL,
  1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT (`explain_check.js`); what is not in it
  yet is listed in `core/README.md` "Not in core yet"). Still to do:
  - the approved scheduler changes (`review/scheduler-proposal.md` §4) in `core/`
    (in progress);
  - a `course.js` field naming a course's old cache prefix, which the core's `sw.js`
    deletes once when the course moves onto the core (Medicinal-chemistry's old prefix
    is `phar4342-drill-`);
  - from `core/README.md` "Not in core yet": Intro-Pharmacology's exam-result page after
    a reload and its generator step; `coverage_check.py`, `step_check.js`,
    `sources_check.js`;
  - two tools `skill/SKILL.md` names that do not exist yet: the check that a course's
    `CLAUDE.md` was updated after its newest lecture, and the `/preview/` build (the
    third, `core/profile.py`, waits for the approval below);
  - after Louis approves `review/recommendation-proposal.md` and sets its §6 values:
    `RULES.md` from its §4, rule names on the "Use when" lines of `FEATURES.md`, the
    experiment-file format, and `core/profile.py` (the material-profile script);
  - for §12.9: a kit workflow that runs the core checks on every pull request and is
    required before a `small-fix` or bookkeeping pull request merges itself; the
    kit-update scheduled task, created once the first course is on the core, at a time
    Louis chooses;
  - one pull request to `main` for Louis to merge.
- **Phase 3 (test) and Phase 4 (install): not started.**

## Rules for kit sessions

- Feature, upgrade, core and `SKILL.md` changes reach `main` only by pull request
  that Louis merges (decision 1). Catalog bookkeeping and `small-fix` pull requests
  merge themselves once every required check passes (`KIT_DESIGN.md` §12.9).
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
| A kit pull request merging itself after required checks (§12.9) | not tested yet | — |
| WebKit / Safari browser engine | not installed in the cloud container; Chromium only | 2026-10-31 |

## Open questions for Louis

1. Open since Phase 1 (`review/findings.md` §9): MC's corrected notes `3b87e8a` into
   MC's `main` (4); one source order when sources conflict (6); BDK's MedlinePlus
   glossary links against decision 3 (7); personal names in state files against §7.9
   (8); agent definitions in `core/agents/` (9); PK's cross-pool `dupOf` defect, which
   matters only if PK's drill is reused (10); searching `Heb-pharmacy-guide` (11).
2. N in `KIT_DESIGN.md` §12.9: how many days before a course's exam no automatic
   update goes live. Louis chose the update split on 2026-11-01 (features and core stop
   at the preview for his reply; catalog bookkeeping and small fixes go live
   automatically); N is not set, so until then small fixes also wait at the preview.
3. `review/recommendation-proposal.md` (written 2026-11-01) waits for Louis's approval
   and the nine answers in its §6. `skill/SKILL.md` already describes the method and
   says that its in-course comparison starts nowhere until then.

## Known issues in course drills found by the kit work

- BDK `regression` test: one intermittent failure in 4 runs on 2026-11-01 ("right
  answer graded wrong" on a pick-the-item penicillin question); cause not found; logged
  in BDK `reviews/LOG.md`.
- PK exam draw can put both wordings of a fact on one paper (`review/findings.md` §4).
- Regex lookbehind in PK, pharmacology and BDK (`review/findings.md` §6.5).
