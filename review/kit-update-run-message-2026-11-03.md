# The "Kit update run" instructions: the message for the "Kit updater" session (2026-11-03)

Louis authorized on 2026-11-03 changing the stored instructions of the scheduled task "Kit
update run" (`trig_01QduqhookGDD8HxANEbLq4w`) so that no preview is promoted to live without
his approval (`review/standing-autonomy-2026-11-03.md`, "Scheduled course work"). The change
can be made only from the session the task posts into, "Kit updater"
(`session_01LVkWFDAbAtw7kDGwqd43Qg`); an `update_trigger` from the main kit session was
refused. Louis pastes everything below the line into that session as his own message.

---

Please update the stored instructions of the scheduled task "Kit update run" (trig_01QduqhookGDD8HxANEbLq4w) with update_trigger, replacing its prompt with exactly the text between the two lines of hyphens below. I authorize this change (Louis, 2026-11-03): no course update goes live without my reply. Change nothing else about the task, then read the task back with get_trigger and tell me the stored prompt matches.

-----
Daily kit-update run (KIT_DESIGN.md §12.9 as amended by §12 decision 10; Louis's standing instruction for this session). Louis's rule of 2026-11-03: no course update goes live without his reply "approve updates for <course>". This run builds and checks previews only; it never promotes a preview to live on its own, whatever kind of kit change is behind it.

First bring the kit checkout up to date with `git fetch origin` and read from `origin/main`. If `origin/main` has no `core/` or no `skill/SKILL.md`, the Phase 2 kit pull request is not merged yet: end with "Nothing to update: the kit's main has no core yet." and change nothing. Otherwise follow `skill/SKILL.md` "Mode 7: update a drill", the part "The kit-update run", on `origin/main`, wherever it is stricter than this message; where it would allow a live update without Louis's reply, this message wins. In brief:
0. Preflight: for the kit and every course repository listed in `COURSES.md`, check that it is attached to this session, `git fetch` works, `git push --dry-run` to a scratch branch name works, and `gh api 'repos/<owner>/<repo>/actions/runs?per_page=1'` answers; and that Node, Python and Chromium start. A course that is not attached is reported by name and skipped (Louis attaches it in this session); do not try to attach it yourself. If any other step fails, nothing is pushed in this run.
1. For each course whose `src/course.js` has a `kit` field and whose pins are behind the kit's `main`: bring in the newer core and feature files, build with `python3 src/build.py --preview`, run `src/run_checks.sh`, and append the result to its `reviews/LOG.md`. The live page stays as it is.
2. Leave every preview waiting and write Louis a summary per course: what the update changes in plain words, the check results (PASS, FAIL, NOT RUN and REPORT as printed), the preview address, and whether an exam is today (America/Chicago, `exams[].when`).
3. Only Louis's reply "approve updates for <course>", given in this session after he has seen that summary, makes that course's preview live: one commit "kit update: <old pins> → <new pins>" with `preview/` removed. After pushing, wait up to 10 minutes for that commit's "pages build and deployment" run (`gh api 'repos/<owner>/<repo>/actions/runs?head_sha=<sha>'`) to complete. On success, log it. On failure or no completed run, revert the update commit, push, confirm that deploy the same way, log both, and report FAILED.
4. Never merge a kit pull request, never change question content, grep for tokens before every commit (`grep -rIEn --exclude-dir=.git 'gh[p]_[A-Za-z0-9]{20,}|github_[p]at_' .`; the brackets keep the line from matching itself), and report a check that did not run as NOT RUN. Send Louis a push notification only when a preview waits for his reply, an update he approved went live or was reverted, or the run failed. A run with nothing behind ends with one line per course and no notification.
-----
