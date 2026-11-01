# core/: the shared engine and its checks

The engine and checks every course drill runs. A course's own content lives in
`template/` (the skeleton a new course starts from) and, once a course exists, in
that course's repository. Both folders come from the recovered exam-drill template
(`history/exam-drill-template-2026-10-02/`, unchanged there), with the picks in
`review/proposed-core.md` applied to `core/`.

## The split

| File | Folder | Why it is there |
|---|---|---|
| `shell.html` | core | page skeleton, styles, storage, scheduler; reads `COURSE` and nothing else about the course |
| `views.js` | core | every view and the boot code |
| `build.py` | core | assembles the page from the shell, the course files and the views |
| `test.js`, `style_check.js`, `render_test.js`, `explain_check.js`, `stepper_test.js` | core | checks that run on any course's built page |
| `cite_check.py` | core | citation check; its course-specific tables at the top start empty |
| `browser_test.py` | core | browser smoke test |
| `harvest.py`, `harvest_mask.py`, `ingest.py` | core | tools for adding a lecture; `harvest_mask.py` keeps a course-specific table at the top, empty in the kit |
| `STEPPERS.md` | core | the rules step-through figures are written to |
| `course.js` | template | the course manifest: names, `ns`, lectures, exams, skills, pace |
| `q1_topics.js` | template | `TOPICS` and the first question file (samples to replace) |
| `links.js` | template | which reading section explains a question (course-specific table) |
| `reference.js`, `tell.js`, `guide.js` | template | the reading tabs (samples to replace) |
| `diagrams.js` | template | drawn figures and the Diagrams tab list (one sample step-through) |
| `atlas.js` | template | drawn structures; a stub unless the course draws them |
| `glossary.js` | template | term glosses (samples to replace) |
| `images.json` | template | slide crops, base64; empty at the start |
| `STYLE.md` | template | the professor's question formats, verbatim |
| `CHANGELOG.md` | template | the course's change log, embedded by the build |
| `CLAUDE.md` | template | rules for working in the course's source tree |
| `.gitignore` | template | decks, ingest output and build leftovers stay out of git |
| `README.md` | template | the course source tree's README |

`links.js` is content: the engine reads `READ_LINKS` if it is defined and works
without it, and every entry in it names a section of one course's reading tabs.

## Setting up a new course

A new course is the files of `template/` plus the files of `core/`, copied into the
course repository's `src/`. `core/README.md` (this file) stays in the kit; the
course's `src/README.md` comes from `template/`.

    mkdir -p COURSE_REPO/src
    cp -r template/. COURSE_REPO/src/
    find core -maxdepth 1 -type f ! -name README.md -exec cp {} COURSE_REPO/src/ \;

No file name appears in both folders except `README.md`, so the copy order does not
matter for any other file.
