# Course registry

One entry per course, in the format of `KIT_DESIGN.md` §6. The Phase 1 version of this
file is `review/COURSES.draft.md`. "Louis's notes" is his to fill in.

Sources: the four repos at `origin/main` and their `claude/drill-notes.md` files
(Medicinal-chemistry's corrected version on branch
`claude/drill-notes-project-sources`), read 2026-10-31. Feature names are the ones
proposed in `FEATURES.draft.md`. No repo has ever had a `/preview/` path (searched
every commit on every branch), so every design change below went live without a
preview; the preview column reads "no preview step existed".

---

## PHAR 4342 PT I: Intro to Medicinal Chemistry (cumulative final drill)   repo: Medicinal-chemistry   site: https://lglouis3-create.github.io/Medicinal-chemistry/   term: Fall 2026 (from the syllabus file name in Drive, `SyllabusF26---PHAR-4342---PT-I-Intro-to--Med-Chem_052126.pdf`; the repo does not state it)
Material profile: structures (functional groups drawn as skeletal structures); two professors with separate pools; slide decks cited by slide number or by title; transcripts; professor polls; documents that define the exam scope (`Final-Review.pdf`, `Ex4-Prep-Work`); Louis's three Quizlet sets. Exam: 50 questions, select-all spread across three pools in a 38:8:4 ratio, 75-minute timer (`src/views.js:370`, `970-982`).
  Bank: 387 questions and 189 images in the published build (MC corrected notes §0, verified there from a clone); the course's Claude Project state doc records 479 questions on 2026-09-21, a round that never reached GitHub.
Features and versions used: structure-atlas v1, structure-compare v1, full-pass v1, glossary v1; core parts from this drill: service worker, Pages layout, exam draw with one blocked set.
Mid-course design changes:
  2026-10-30  app served at the Pages root, `.nojekyll`, install manifest, images re-encoded as WebP (`4a32dad`); why: the Pages root showed the README, and the page was 8.82 MB with 86.4% inline JPEG (MC notes §2); preview approved: no preview step existed.
  2026-10-30  service worker, network-first with a 3.5 s fallback (`ed38dbd`); why: Louis asked for offline use; preview approved: no preview step existed.
  (These two changes came after the exam on Mon 9/21 named at `src/views.js:370`.)
  2026-11-01  moved onto the kit core (Mode 7, kit `main` ff7bd51, `course.js` `kit:{core:'ff7bd51'}`), with the 09/21 round (479 questions: the 387 live ids kept, 92 new), course name "Intro to Medicinal Chemistry (P2 Fall 2026)" (Louis), citations corrected after a slide check against the decks in Louis's Drive, `oldCachePrefix: 'phar4342-drill-'`; why: Louis's order of moves (Medicinal-chemistry first); preview approved: yes, at `/preview/` from 2026-11-01, and Louis approved the switch the same day (live commit `d7331be`).
Proposals declined: none recorded.
Exam outcomes: none recorded in the repo or the notes.
Louis's notes:

---

## PHAR 4221 Basic Pharmacokinetics   repo: Basic-Pharmacokinetics-   site: https://lglouis3-create.github.io/Basic-Pharmacokinetics-/   term: Fall 2026
Material profile: calculation-heavy (534 numeric of 829 questions, PK notes "Sources and conventions"); the professor's equation sheet is given at the exam; graph-reading figures; problem sets asked in parts; homework, quizzes and reviews in her original numbers; textbook chapters; one professor. Exams: three of 40 questions in 120 minutes, pools by module (`src/course.js:107-188`); Exam 3 (final) on 2026-10-27.
Features and versions used: plan-the-problem v1, equation-drill v2, wrong-number-diagnosis v1, chained-problem-sets v2, calc-stopwatch v1, variables-quiz v1, diagrams-tab v2, step-through-figures v1-port, source-registry v1, worksheets-tab v2, ink-layer v2, readings-page v1-pk, recorded-narration v1-pk, guide-walkthroughs v2, most-likely-stars v2, exam-notes v1, weak-spot-marks v1, module-colours v1, exam-countdown v1, whats-new v1-port, explain-more-links v1-port, source-page-viewer v1, break-clip v1, full-pass (engine mode `all`).
Mid-course design changes:
  2026-10-02  engine upgrades ported from Intro-Pharmacology: what's new, session progress, step-through figures, Diagrams tab, countdown (`c01b619`); why: PH's engine-upgrades brief (`f517148`); preview approved: no preview step existed.
  2026-10-17  port of PH shared features R1, R2, R4 to R9 (`30154d4`, `52156ed`); why: Louis approved them, "Initiate R1 & R2 and R3 isn’t a priority for this course so don’t include it. And do R4 to R9" (PK notes §4); preview approved: no preview step existed.
  2026-10-21 to 10-26  Worksheets tab first built on 10-21 (`e839844`), re-laid out twice on 10-26 in ways Louis did not want (`59f1fa6`, `ca436c1`; PK notes §2), then built to his folder layout of 2026-10-26 20:18 (`e6ea184`, `2759b31`); preview approved: no preview step existed.
  2026-10-26  guide walkthroughs (`bc8321d`); why: Louis asked for them built as PH built its walkthroughs; preview approved: no preview step existed.
Proposals declined: 2026-10-17, R3 "Mark verbatim items and test them against STYLE.md" (`notes/PORT_EVALUATION_2026-10-17.md:71`); Louis's reason: "R3 isn’t a priority for this course".
Exam outcomes: none recorded in the repo or the notes.
Louis's notes:

---

## PHAR 4344 Pharmacotherapeutics II: Introduction to Pharmacology   repo: Intro-Pharmacology-   site: https://lglouis3-create.github.io/Intro-Pharmacology-   term: Fall 2026
Material profile: lecture course taught by two professors in sequence; drug tables (Exam 1 drug list, drug ↔ receptor); pathways and processes (step-through figures, scenes); the professor's polls, quizzes and Jeopardy items kept verbatim; assigned readings (chapters and articles) tested as discussed; four exams (50, 50, 54 questions; Exam 4 count `null`, "about 55" per the professor on 10/28, `exam1-drill/src/course.js:55-111`). Exam 4 is Mon Nov 2 (`exam1-drill/src/course.js:100`).
Features and versions used: exam-groups v1, focus-switch v1, explain-more-links v2, whats-new v1, question-map v1, pair-up v1, explain-one-cards v1, step-through-figures v1, diagrams-tab v1, scenes v1, graphs-drill v1, readings-page v1, listen-deck v1, recorded-narration v1, guide-walkthroughs v1, break-clip v2, most-likely-stars v1, strict-exam-mode v1, short-answer-page v1, glossary v2, table-recall-drill v1 and v1-b, standalone-diagram-pages v1.
Mid-course design changes:
  2026-10-20  Smith focus switch (`96e33bf`); why: Exams 3 and 4 are one professor's only; preview approved: no preview step existed.
  2026-10-22  Exam 3 bank rewritten to her quiz format with "Most likely" buttons (`b41039d` (branch)); why: her format (4 options, no absolute words, no length cue; PH notes §1); preview approved: no preview step existed.
  2026-10-23  Exam 3 guide rewritten to teach the reasoning (`a243a93` (branch)); why: Louis: "Make it isn't just reiterated what was said but giving the student a proper explanation" (PH notes §4); preview approved: no preview step existed.
  2026-10-26  focus switch states what it hides (`54a3c4a` (branch)); why: Louis asked why Exam 3 material disappeared; preview approved: no preview step existed.
Proposals declined: 2026-11-01, moving this drill onto the kit core (options A, a full move of about 42 kit pull requests, and C, a minimal move that drops many tabs and the audio, in the move assessment of 2026-11-01); Louis chose option B, the drill stays as it is and its features are ported into the kit from its code: "Lets do what you recommend that will result in the least mistakes". UX review items R2 to R9 of 2026-10-17 are recorded as waiting on Louis, not declined (PH notes §5).
Exam outcomes: Quiz 4: "quiz 4 is correct as i got a 100" (Louis, PH notes §4; a quiz, not an exam). No exam score recorded.
Louis's notes:

---

## PHAR 4232 APC III, Basic Drug Knowledge (BDK) quizzes   repo: BDK   site: https://lglouis3-create.github.io/BDK/   term: Fall 2026
Material profile: drug tables only: the BDK list PDF, 300 drugs on 26 pages (BDK notes §1); weekly quizzes on set pages (`QUIZZES`, `assets/app.js:42`); no lecture decks, transcripts or professor questions supplied (BDK notes §3); Louis also studies in Quizlet. Built from Louis's "BDK QUIZLET DECK SPEC", not from the skill.
  Note on the name: the BDK notes and `assets/app.js:41` call the course "APC III" / "PHAR 4232 APC III"; the full course name is not stated in the repo.
Features and versions used: table-deck-generator v1, quizlet-export v1, single-fact-questions v1, learn-mode v2, card-modes v1, match-game v1, cram-mode v2, compare-tab v1, memory-model-fsrs v1, field-colours v1, glossary v3, source-page-viewer v1-bdk, exam-countdown v2, back-navigation v1.
Mid-course design changes:
  2026-10-21  rebuilt on the 2026-2027 list with page-based decks (`87d17e5` → `f32c87a`); why: Louis supplied the new list and the deck spec; preview approved: no preview step existed.
  2026-10-22  FSRS scheduling, Match, Compare (`0fab858`); why: Louis asked for research on improving memory and for side-by-side comparisons; preview approved: no preview step existed.
  2026-10-25  single-fact questions (`71da38b`); why: Louis approved the formulations ("Let’s follow you suggestions, and what’s you recommend approve all"); preview approved: Louis approved a written proposal, not a preview page.
  2026-10-28  Select ALL as one checkbox per item in Learn (`577d5b6`); why: Louis's concern about bundled answers, approved "Yes make the changes 1-3"; preview approved: approved a written proposal, not a preview page.
  2026-11-01  offline cache cleanup scoped to `bdk-*`, slow-network fallback, progress kept when saving fails (`c78e78d`, v16); why: the old cleanup deleted other drill sites' offline copies on the shared origin; approved by Louis in chat; no preview step existed.
  2026-11-01  Home Screen card (`080d5fa`, v17); why: Safari deletes a site's data after 7 days without use unless it is on the Home Screen, and a Home Screen copy keeps separate storage; approved by Louis ("a neat tool to utilize"); no preview step existed.
  2026-11-01  answer history for fitting FSRS-7 later (`c2f87ae`, v18); why: BDK keeps only the last 10 results per card, without times; approved by Louis ("Whatever you recommend"); no preview step existed.
Proposals declined: none recorded. Two offers have no decision (per-column colour in Compare; the daily review reading an exported progress file; both from session memory, unverified, BDK notes §5).
Exam outcomes: none recorded.
Louis's notes:

---

## PHAR 4346 DEENT   repo: DEENT   site: https://lglouis3-create.github.io/DEENT/   term: Fall 2026
Material profile: two professors (Dr. Smith, pharmacology; Dr. Sikazwe, medicinal chemistry); slide decks and recorded lectures; drug structures (Atlas of 91 structures drawn with RDKit from SMILES and checked against PubChem and ChEMBL); four exams: Exam 1 Mon 11/09 9:00-10:30 am (50 questions, 90 minutes, unweighted), Exam 2 11/16, Exam 3 11/23, Final 12/07 (dates of Exams 2-4 from Louis, 2026-11-06; times not recorded). Only Exam 1 is released on the site; the others are known to the coordinator (`coordinator/courses.json`) and not shown (DEENT `src/course.js`, `CLAUDE.md` at `fb54cf0`).
  Bank: 555 questions (DEENT `CLAUDE.md`, 2026-11-06).
Features and versions used: kit core at `25c643d`, no feature modules; Atlas built in the course's own files (`src/atlas_ui.js`, `src/gen_atlas.py`).
Mid-course design changes:
  2026-11-05  first releases at the Pages root, Lectures 1-4 (DEENT `CLAUDE.md`); preview approval as recorded in that course's log.
  2026-11-06  Atlas refinement and the sun-exposure lecture on the working branch; preview approved: waiting for Louis.
Proposals declined: none recorded; the `structure-compare` and `most-likely-stars` ports deferred by Louis on 2026-11-05.
Exam outcomes: none yet.
Louis's notes:
