# BDK onto the kit core: move plan

Louis decided on 2026-11-01 that the BDK move starts now ("BDK can be moved already
since thats a good month away"). This plan orders the work from the read-only
assessment `review/assessments/bdk-move-2026-11-01.md` (cited below as "assessment").

## Dates the move works around

| What | When | Source |
|---|---|---|
| Week 14 BDK/calcs quiz, pages 5 and 9 (CV1 and Pulm), nutritional calculations | Tue-Thu 11/17-11/19/2026, in the 2-5 PM lab | BDK `assets/app.js` `QUIZZES` lines 42-53 at `c2f87ae`; syllabus "Syllabus-PHAR-4232---APC-III-Final-8.20.26.pdf" (Louis's Drive, last updated 08/20/26), course schedule week 14 |
| Cumulative BDK/Calcs Assessment, all pages | Mon 11/30/2026, 1-3 PM | same two sources, week 16 |

The syllabus says the quizzes "may consist of several question types (e.g., multiple
choice, fill-in-the-blank, matching)" and that equations are not provided. It gives no
number of questions and no time limit for a quiz.

The next quiz is 16 days after 2026-11-01 and the cumulative is 29 days after it. The
assessment judged the whole move (about 33 kit pull requests plus a preview review)
unlikely to finish in 16 days.

## How the live site is protected

The live BDK site (`main`, `c2f87ae`, v18) does not change during the work. The course
work happens on a BDK branch and is shown at `/BDK/preview/`, which keeps its own copy of
the saved progress (`bdk2-preview:*`). BDK goes live on the core only when all of these
hold:
1. the preview has every feature Louis uses today (decision 6);
2. progress exported from each place Louis studies (Safari and the Home Screen copy keep
   separate storage) converts correctly in the preview;
3. every check passes, and the BDK daily review's changes to `main` since the branch was
   cut are in the branch;
4. Louis approves the preview and picks the day. The switch never happens on
   11/17, 11/18, 11/19 or 11/30.

## Decisions before code (assessment §5)

Each recommendation keeps what BDK does today, so the move changes as little as possible
in how Louis studies. Louis answered on 2026-11-01: "Yes to all but its okay to switch to
FSRS-7".

| # | Decision | Recommended | Louis |
|---|---|---|---|
| 1 | When | now (the work); the live switch as above | now (2026-11-01) |
| 2 | Wrong choices fixed, or drawn fresh at each showing | drawn fresh, as today (pull request K9) | yes |
| 3 | Question ids: BDK's text ids, or short ids with an id map | short ids: 2,481,498 characters stored after 8,000 answers against 4,947,038 with text ids (assessment §3), on a storage quota every drill on the origin shares | yes |
| 4 | How cards with FSRS-4.5 history start | keep BDK's FSRS-4.5 scheduler on the core for BDK, so every card keeps its stability, difficulty and due date exactly; move to FSRS-7 later by replaying the answer history kept since v18. The assessment's two options both change due dates before the quizzes: start every card answered before 11/01 as new, or seed FSRS-7 from S and D with a `stabilityFast` value that has no source (assessment §3). Keeping FSRS-4.5 is a scheduler design change and needs Louis's approval (§12.3 names FSRS-7 as the FSRS option) | FSRS-7 ("its okay to switch to FSRS-7"); see below |
| 5 | Quiz lengths and minutes for the exam simulator | no simulator until Louis gives the numbers; the syllabus states none | yes |
| 6 | Features that must exist before go-live | every feature in assessment §1 that BDK has today | yes |
| 7 | The MedlinePlus link in the glossary (open question 7) | unchanged during the move; the open question stays open | yes |

**Decision 4 as built.** BDK moves to FSRS-7 (ts-fsrs 6.0.0 in the core). A card whose
whole answer history is in BDK's answer log (kept since v18, `c2f87ae`, 2026-11-01) is
rebuilt by replaying that history. A card with earlier answers starts as a new FSRS-7
card, because seeding FSRS-7 from FSRS-4.5's S and D needs a `stabilityFast` value that
has no source (assessment §3). Its counts (right, wrong, streak, lapses) carry over for
Progress. After the switch those cards are shown again as new until they are answered;
from the first answer on, FSRS-7 schedules them.

**Checks each pull request reports:** `core/run_checks.sh` on a fresh template course, on
a scratch course with the change switched on, and on a copy of Medicinal-chemistry's
live course; each new test shown failing before the change; and the checks that cannot
run in the cloud container named as NOT RUN (`cite_check.py` without decks;
Safari/WebKit).

BDK's rule 1 ("flag, don't decide") also applies at the preview: the generated `why`
text for each wrong choice and any change in how a card is asked are shown to Louis for
approval there (assessment §2).

## Kit pull requests, in order

Each is one pull request with a plain summary for Louis's yes (`KIT_DESIGN.md` §12.9).
K and F numbers are the assessment's.

| Order | Pull request | Kind | Status |
|---|---|---|---|
| 1 | K13 a paper for pools with `questions:null` or `marks:null` (crashes today) | small fix | |
| 2 | K10 `test.js` "missed concept resurfaced" check under `fsrs` | small fix | |
| 3 | K11 `scheduler_test.js` preset cases use the course's own skill names | small fix | |
| 4 | K12 `browser_test.js`: ids with an apostrophe; the tab crash in the full sweep | small fix | |
| 5 | K5 converter hook for an older progress format, on first load and on Import | core | |
| 6 | K3 multi-day quizzes and the next quiz by date; no automatic update on any day of a quiz | core | |
| 7 | K7 select-all with more than 10 options | core | |
| 8 | K8 typed and self-check item kinds | core | |
| 9 | K2 course files beside the page, saved offline (page images, Quizlet zip) | core | |
| 10 | K6 FSRS-7 start for cards with earlier history: replay where the log is complete, otherwise new (decision 4) | core | |
| 11 | K4 exam-date cap under the FSRS scheduler (scheduler design approval) | core | |
| 12 | K9 wrong choices drawn at each showing (decision 2) | core | |
| 13 | K14 `SKILL.md` Mode 7 for a course with its own engine | SKILL.md | |
| 14-25 | F1-F12: learn-mode, Scroll, Flashcards, Written, match-game, cram-mode with Last look, compare-tab, field-colours, glossary v3, source-page-viewer v1-bdk, exam-countdown v2, back-navigation | feature | |
| 26-31 | F13-F18: themes, today's plan with predicted recall, Progress dashboard, drug List tab, page colours, keyboard shortcuts | feature | |
| 32 | `COURSES.md` and `FEATURES.md` updates | bookkeeping | |

K1 (the core reads `course.js` `features`) merged in pull request #6. The port queue's
BDK items 11-17 are covered by F1-F18 and are marked `BDK move` there, so the nightly
porter does not port them a second time.

## Course work in the BDK repository (assessment §5)

On a branch, then at `/BDK/preview/`:
1. a generator from `data/decks.json` to `src/q*.js` (3,510 questions; the run-time card
   generation moves to build time, without regex lookbehind);
2. `course.js`: `ns:'bdk2'`, `oldCachePrefix:'bdk-'`, the scheduler from decision 4, 26
   pages, 10 quizzes with page pools, skills;
3. `glossary.js` (198 terms), the List content, icons, `CHANGELOG.md`;
4. the converter's content, tried on Louis's exported progress in the preview;
5. the 8 test suites rewritten for the core page;
6. BDK's `CLAUDE.md`, `docs/daily-review.md` and the "BDK daily review" task updated
   (it runs `tests/run-all.sh` today);
7. Louis tries the preview in Safari and in the Home Screen copy, approves, it goes live,
   and `preview/` is deleted.

## Not run so far

WebKit/Safari (not installed in the cloud container); a converter on Louis's real
progress (it exists only in his browsers); Safari's storage quota (assessment, NOT
DETERMINED).
