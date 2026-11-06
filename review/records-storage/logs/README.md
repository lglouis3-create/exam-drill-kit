# Per-tab record storage: logs from the worksheets-ink port (agent-run, 2026-11-06)

Evidence branch, never merged. The files were copied unchanged from the porter session's container
(`/tmp/port-wsi/logs/`).

- `diag-records-new.log`: a diagnostic run made while fixing worksheets-ink F1 (kit PR #17). It ran on
  the module's save-path code before the final commit `0769d14`, in Chromium, on a scratch module
  course: worksheets-ink on, namespace `course-id-drill`, profile `me`. The values are the character
  lengths of each localStorage key:
  - after the bulk save (61 pages, 1,801 strokes): the progress `data:me` 1,475,679 and one per-tab
    record 1,475,714;
  - after a reload and one ink open/close: two per-tab records;
  - 62 s later: one record.
- `worksheets-ink-modtest-new-1.log` and `worksheets-ink-modtest-r2-run2.log`: module test runs with
  the 61 s wait before the Import (test.js lines 614-661 at `0769d14`). Each shows "2 per-tab records
  of this profile after the reload; 1 left after 61 s, before the Import" and the Import succeeding.
- Not here: no saved log shows the Import being refused without the wait. The implementing agent
  reported that refusal, and then added the wait.

The reproduction steps are in `features/worksheets-ink/current/test.js` at `0769d14`, lines 614-661.
