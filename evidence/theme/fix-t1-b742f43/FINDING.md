# Fault T1: a stored Dark shows light for a moment on a large page (agent-run, 2026-11-03)

Every result here is **agent-run**: run by a kit session in Chromium (Playwright), not verified by the
coordinator. Branch `port/theme`: start `c85f386`, this fix's commit `b742f43`. No change to `core/` or
`template/`; `features/theme/current/theme.js` is unchanged.

## 1. What happens

A student who picked Dark opens a large course page and sees the light colours first, then the page
turns dark. `theme.js` line 39 (`apply(current())`) sets `data-theme` on `<html>` when the module's code
runs. The module's code is inside the page's one script block, which `build.py` places at the end of
`<body>`, after the data files. The tabs (`#nav` buttons) are markup before that script. On a large page
the browser paints a frame while it is still reading the script, so that frame has the tabs and the
light colours.

## 2. Reproduction before any change (`logs/first-frame-before.json`)

Course: the everything-on scratch course, built with the patched scratch kit
`/tmp/port-integration-3/kitpatch` (integration branch `9acfe9d` plus `evidence/integration-3`
`patches/all-patched-kit.patch`), all 18 modules in the order of `evidence/integration-3` (build only,
`scripts/build_course.sh`, which is `core/ci_course.sh` up to the checks). `index.html` is 1,879,886 bytes.

Probe `scripts/first_frame.js`: Chromium, light device, Dark picked in the header, then 5 reloads. Per
reload: `data-theme` in the first animation frame whose `#nav` holds a button (the theme test's measure),
the body background in that frame, when `#nav` first held a button, when `data-theme="dark"` was set,
and first-contentful-paint.

| reload | tabs in the DOM | data-theme set | first frame with the tabs | first contentful paint | light frame shown |
|---|---|---|---|---|---|
| 1 | 62.3 ms | 111.7 ms | dark, 113.4 ms | 136 ms | no |
| 2 | 46.5 ms | 95.2 ms | **light** (rgb(242, 244, 247)), 47.4 ms | 56 ms | **yes** |
| 3 | 44.8 ms | 91.0 ms | dark, 92.7 ms | 120 ms | no |
| 4 | 43.1 ms | 93.4 ms | **light**, 52.5 ms | 60 ms | **yes** |
| 5 | 40.2 ms | 89.5 ms | **light**, 41.2 ms | 48 ms | **yes** |

Result: **3 of 5** reloads painted the first frame with the tabs light. In every reload the tabs were in
the DOM while `document.readyState` was `loading`, about 45-50 ms before `data-theme` was set.

The new test (section 4) gave the same result on this course's scratch copy (1.89 MB with the test's
fixture): 3 of 5 light (`logs/theme-test-everything-on.log`).

## 3. Can a module put a script or style early in `<head>`? No

- `core/build.py` line 215: `META_FIELDS = {'name', 'version', 'does', 'js', 'css', 'step', 'needs',
  'types', 'options', 'test', 'source'}`; any other field stops the build (lines 245-247).
- `js` files go into `FX.load(...)` inside the one script block at the end of `<body>` (`feature_block`, lines 526-551,
  and lines 588-592). `step` output becomes that module's `DATA` argument in the same place.
- `css` files go into the `<style>` in `<head>` (lines 556-561). That is early, but CSS cannot read the
  browser's storage, so it cannot apply a stored choice. (It could hide the page until the module's
  script has run, but that is not "apply the stored choice"; it delays the first paint for every student,
  and a module that fails to load would leave the page hidden unless a timed fallback is added. Not done.)
- `build.py` lines 595-597 stop the build unless the page holds exactly one script block, so a second
  `<script>` (in `<head>`) is refused even if a module's CSS tried to carry one.
- `features/README.md` hooks (`X.tab`, `X.type`, `X.after`, `X.rendered`, `X.reading`, `X.paper`,
  `X.settings`, `X.start`, `X.progress`, `X.api`) all run from that same script.

So the module was left as it is.

## 4. What changed on `port/theme` (`b742f43`)

`features/theme/current/test.js`:
- a page under 1.5 MB (1,500,000 bytes): the first-frame check runs on 3 reloads and must be dark in
  all 3 (it was 1 reload);
- a page of 1.5 MB or more: the course's scratch copy if it is that large, otherwise a second scratch
  copy that adds `zz_theme_pad.js`, the fixture's Basic-Pharmacokinetics records (ac2eb73) repeated as
  inert data (a `const` the page never reads; not questions) until the page is 1.5 MB or more. Checks:
  the copy builds, it is 1.5 MB or more, the first frame with the tabs is found in each of 5 reloads.
  Then the measurement is printed (`measure ...: N of 5 first frames light: ...`). All 5 dark: PASS. Any
  light while the page has no `<script>` in `<head>`: reported as `skip ... KNOWN LIMIT (fault T1)` with
  the measurement (it shows in the PASS line's skipped list). Any light when the page has a script in
  `<head>`: FAIL.
- FEATURES.md (theme: Known issues, Test) and CHANGELOG.md (the theme entry) record the limit and its
  measurement.

Mutation (scratch only): with `theme.js` line 39 changed to `setTimeout(() => apply(current()), 300)`,
the small-page check fails (3 of 3 light) and the test exits 1 (8 of 44 checks failed). Moving the line
into `X.start(...)` is not caught, because `X.start` also runs inside the same script before the first
frame on a small page (no flash on a small page either).

## 5. Core change needed (finding for a core proposal)

A module.json field for a small script that `build.py` places in `<head>`, before `<body>`, for example
`"head": "head.js"`:
- `build.py`: add `head` to `META_FIELDS`; read the file; put it in its own `<script>` just before
  `</head>`; change the "exactly 1 script block" check (lines 595-597) to allow one head script per
  module that declares one, and syntax-check each; `device_lint.js` should read the file too.
- The head script runs before `store`, `NS` and `COURSE` exist, so the build has to give it the storage
  key: replace a placeholder (for example `__NS__`) with `COURSE.ns`, plus `-preview` in a preview build
  (shell.html: `const NS = COURSE.ns + (BUILD.preview ? '-preview' : '')`).
- It must be small, wrapped in try/catch (storage can throw), and only set attributes.
- theme's head script would be:
  `try{var t=localStorage.getItem('__NS__:theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`
  and theme.js line 39 stays (it repeats the same value; it also covers storage kept in memory only).

Prototype measurement (scratch copy only, never committed): that snippet added by hand before `</head>`
of the same 1,879,886-byte everything-on page (`ns` `course-id-drill`). 5 of 5 reloads dark; `data-theme`
set at 27.4-30.6 ms, before the tabs were in the DOM (38.2-43.9 ms); first contentful paint 44-92 ms
(`logs/first-frame-prototype.json`).

## 6. Checks (agent-run)

See `INDEX.md` in this folder for the commands, exit codes and the GitHub run.
