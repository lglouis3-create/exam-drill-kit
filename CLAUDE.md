# exam-drill-kit: state for Claude

Read `KIT_DESIGN.md` first, in full; its section 12 lists the changes Louis approved
after Phase 1 and overrides earlier sections where they differ.

## Where the work stands (2026-11-01)

- **Phase 1 (evaluate): done.** `review/` holds the findings, the proposed core, the
  scheduler proposal, the Phase 1 drafts of the catalog and registry, and research
  notes.
- **Phase 2 (build): merged to `main`** by pull request lglouis3-create/exam-drill-kit#1
  from branch `claude/elegant-ptolemy-pqxb8y` (Louis said yes on 2026-11-01). Done:
  `KIT_DESIGN.md` §12; skill archives moved to `history/`; the recovered template in
  `history/exam-drill-template-2026-10-02/`; `FEATURES.md`, `COURSES.md`, this file,
  `CHANGELOG.md`, `features/README.md`, a first draft of `skill/SKILL.md`; `core/` and
  `template/` from the recovered template with the picks in `review/proposed-core.md`
  (merged in `5014f27`); the approved scheduler changes (merged in `c4be612`); the
  `/preview/` build and the state-file check. On fresh scratch courses with each
  scheduler setting (`concept`, `fsrs`, `concept-fsrs` with `compare`, `preset:'calc'`),
  `run_checks.sh` gave 19 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT
  (`explain_check.js`). What is not in the core yet is listed in `core/README.md` "Not
  in core yet". Still to do:
  - fitting FSRS parameters to Louis's own answers (`review/scheduler-proposal.md`
    4.2.3; findings in `core/README.md`: `@open-spaced-repetition/binding` needs Node 24
    and this container has Node 22; `fsrs-browser` does not confirm FSRS-7);
  - a WebKit (Safari) run of the browser checks: NOT RUN so far; the FSRS page contains
    BigInt syntax;
  - from `core/README.md` "Not in core yet": Intro-Pharmacology's exam-result page after
    a reload and its generator step; `coverage_check.py`, `step_check.js`,
    `sources_check.js`;
  - after Louis approves `review/recommendation-proposal.md` and sets its §6 values:
    `RULES.md` from its §4, rule names on the "Use when" lines of `FEATURES.md`, the
    experiment-file format, and `core/profile.py` (the material-profile script);
  - for §12.9: a kit workflow that runs the core checks on every pull request and is
    required before a `small-fix` or bookkeeping pull request merges itself.
  Each of these goes to `main` in its own pull request, with a plain-terms summary for
  Louis's yes or no.
- **Moving the courses onto the core** (Louis's order, 2026-11-01: Medicinal-chemistry,
  Pharmacokinetics, BDK, Intro to Pharmacology). Medicinal-chemistry: branch
  `kit/move-to-core` in its repo; preview published at `/preview/` on 2026-11-01
  (Louis approved); his name for the course is "Intro to Medicinal Chemistry (P2 Fall
  2026)"; going live waits for the core fixes found by the move (kit PR #3), the slide
  check he asked for, and his approval of the preview.
- **Phase 3 (test) and Phase 4 (install): not started.**

## Rules for kit sessions

- Feature, upgrade, core and `SKILL.md` changes reach `main` only by pull request.
  For each one, tell Louis in plain terms what merging it provides and changes, and
  merge it only after he says yes to that pull request (`KIT_DESIGN.md` §12.9).
  Catalog bookkeeping and `small-fix` pull requests merge themselves once every
  required check passes.
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
| Scheduled task that starts a fresh session each time (first "Kit update run", now deleted) | does not work for this: the fired session started with no repository, `gh` and `git` were refused, and it reported FAILED by push notification | 2026-11-01 |
| `gh api 'repos/<owner>/<repo>/actions/runs?head_sha=<sha>'` for Pages deploys | works through the session proxy without any connector, for repos attached to the session; `gh api …/pages/builds/latest` is refused by the proxy | 2026-11-01 |
| Session "Kit updater" (`session_01LVkWFDAbAtw7kDGwqd43Qg`, started with the kit as its repository) | kit fetch and push dry run work; Python, Node and Chromium work; `mcp__github__*` tools present; `add_repo` for a course repo from a seeded message was blocked by the permission system; after Louis's own message there, all four course repos were attached with push access, and fetch, `git push --dry-run` and `gh api …/actions/runs` worked in each (the session's stored sources list the kit and the four course repos) | 2026-11-01 |
| Scheduled task "Kit update run" (`trig_01QduqhookGDD8HxANEbLq4w`, daily 2:47 AM America/Chicago, fires into "Kit updater") | first run 2026-11-01 08:48 UTC ended "Nothing to update: the kit's main has no core yet" (correct: PR #1 merged at about 12:10 UTC), changed nothing and sent no notification; not yet checked whether a run after the container is replaced still has the repos | 2026-11-01 |
| WebKit / Safari browser engine | not installed in the cloud container; Chromium only | 2026-10-31 |

## Open questions for Louis

1. Open since Phase 1 (`review/findings.md` §9): MC's corrected notes `3b87e8a` into
   MC's `main` (4); one source order when sources conflict (6); BDK's MedlinePlus
   glossary links against decision 3 (7); personal names in state files against §7.9
   (8); agent definitions in `core/agents/` (9); PK's cross-pool `dupOf` defect, which
   matters only if PK's drill is reused (10); searching `Heb-pharmacy-guide` (11).
2. `review/recommendation-proposal.md` (written 2026-11-01) waits for Louis's approval
   and the nine answers in its §6. `skill/SKILL.md` already describes the method and
   says that its in-course comparison starts nowhere until then.

## Known issues in course drills found by the kit work

- BDK `regression` test: one intermittent failure in 4 runs on 2026-11-01 ("right
  answer graded wrong" on a pick-the-item penicillin question); cause not found; logged
  in BDK `reviews/LOG.md`.
- PK exam draw can put both wordings of a fact on one paper (`review/findings.md` §4).
- Regex lookbehind in PK, pharmacology and BDK (`review/findings.md` §6.5).
