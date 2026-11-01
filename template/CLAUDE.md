# Working in this repo

This is an exam-drill source tree built with the `exam-drill-builder` skill
from the exam-drill-kit (engine from the kit's `core/`, content started from its
`template/`). Read `README.md` for the layout and `course.js` for the course;
the running state (what has been ingested, verified slide facts, conflicts,
delivery status) is in the repository root's `CLAUDE.md`, `reviews/LOG.md` and
`reviews/OPEN_QUESTIONS.md`; update them at the end of every session.

Standing rules for every question, table and guide written here:

- Every number, name and claim comes from a slide (cite the deck file and slide)
  or the lecture transcript (mark it "(T)" and set `source`). If it cannot be
  pointed at, it is not written; no placeholder figures.
- When two sources disagree, state both and which one an exam written from
  the lectures would key.
- Stems ask the subject, in the professor's own formats from `STYLE.md`; never
  "what does the slide say". Options short and parallel; the correct one is not
  the longest; every option has a `why`; every question a `skill` from
  `course.js`.
- No metaphors, no study advice, no sentence about the drill itself.
- Every update adds its bullets to `CHANGELOG.md` in the same commit, one short
  line each, in the reader's terms. The build embeds the file and the Topics
  page shows what is new since the reader's last visit.
- A figure of a process is drawn in `diagrams.js`, not described in prose; a
  multi-stage one is a step-through, written to the rules in `STEPPERS.md`.
- A new question gets its reading section in `links.js` when one fits, which is
  what the Weak spots review plan groups by.
- Build and run every check before delivering; never report a check that did
  not run as passed.
- Tokens live only in `.git/config`; grep the tree before packaging anything.
- The site is shared with classmates: personal mnemonics stay out of the
  shared build unless asked for.

Checks: `./run_checks.sh` builds and runs every check, one line each: PASS,
FAIL, NOT RUN (with the reason; never a pass) or REPORT (`explain_check.js`, a
report, not a gate). It exits non-zero on any FAIL.
