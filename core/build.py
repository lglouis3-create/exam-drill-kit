#!/usr/bin/env python3
"""Assemble the single-file quiz app from shell + data + views.

Every JavaScript source is syntax-checked before anything is assembled, and the
assembled script is checked again before the output file is replaced. A source
with a stray comma or bracket therefore stops the build with the offending file
and line named, instead of producing an HTML file that loads to a blank screen.
"""
import html as htmlmod, json, re, io, os, subprocess, sys, tempfile

# This file lives in the course repository's src/; the repository root above it
# is what GitHub Pages serves. Every path below is relative to src/, so the
# build runs the same from any working directory.
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
os.chdir(HERE)

# What the build writes into the repository root. index.html is the app itself,
# so the site root opens the drill rather than the README. The file name in
# course.js `output` is kept as a redirect to it, so a link or bookmark made to
# that name still opens the drill.
OUTPUT_NAME = 'index.html'

# The course's data files, in the order they are concatenated into the page,
# are listed in course.js `files`, which belongs to the course: a core update
# copies this file over the course's build.py and never touches course.js, so
# the list cannot be lost in an update. TOPICS and QUESTIONS are declared at
# the top of the first question file, so it precedes the other question files;
# atlas.js precedes any question file that draws on it. A course.js without
# `files` gets the template's list below. Question files are named
# q<N>_<topic>.js; a file of that form in src/ that is not in the list stops
# the build, because its questions would silently be left out of the page.
DEFAULT_FILES = ['atlas.js', 'diagrams.js', 'q1_topics.js']
QUESTION_FILE = re.compile(r'q[0-9][A-Za-z0-9._-]*\.js')
# The sources every course has, after the data files; they cannot be listed in
# `files` as well, or they would be put into the page twice.
FIXED_SOURCES = ['glossary.js', 'links.js', 'reference.js', 'tell.js', 'guide.js', 'views.js']

# The home-screen and install icons. A course supplies its own as PNG files
# under src/icons/ with these names; any it does not supply is written as a
# plain square in the page's accent colour, so the manifest is complete from
# the first build and a course replaces the placeholders when it has artwork.
ICONS = [('icon-192.png', 192), ('icon-512.png', 512), ('icon-maskable-512.png', 512),
         ('apple-touch-icon.png', 180)]
ACCENT = (0x2F, 0x5F, 0xA8)

# `python3 build.py --preview` builds the same page into preview/ under the
# repository root, which Pages serves at <site>/preview/, so a design change or a
# kit update can be tried before it replaces the live page (decision 6). The
# preview keeps its progress under its own namespace (shell.html, NS), writes no
# service worker, manifest or icons, and leaves every file of the live site as it
# was.
PREVIEW = '--preview' in sys.argv
OUT = os.path.join(ROOT, 'preview') if PREVIEW else ROOT


def changelog():
    """CHANGELOG.md -> [{'date': '2026-10-02 (title)', 'items': [...]}], newest first.

    The file is the one place an update is written down; the page reads it for
    the What's new card and the Settings list, so there is no second copy to
    keep in step. A missing file is not an error: the card simply never shows.
    """
    if not os.path.exists('CHANGELOG.md'):
        print('  note: no CHANGELOG.md, so the page will not show a What\'s new card')
        return []
    out = []
    for line in open('CHANGELOG.md', encoding='utf-8').read().splitlines():
        h = re.match(r'##\s+(.+?)\s*$', line)
        if h:
            out.append({'date': h.group(1), 'items': []})
        elif line.startswith('- ') and out:
            out[-1]['items'].append(line[2:].strip())
    return [e for e in out if e['items']]


def node_check(path, label):
    """Run node --check and stop the build on a syntax error."""
    r = subprocess.run(['node', '--check', path], capture_output=True, text=True)
    if r.returncode != 0:
        msg = (r.stderr or r.stdout).strip()
        sys.exit(f'ERROR: {label} has a JavaScript syntax error\n{msg}')


def course_fields():
    """The COURSE fields the build itself needs, from course.js evaluated by
    node, so the file is read the way the page reads it whatever its quoting."""
    node_check('course.js', 'course.js')
    js = ("const fs=require('fs');"
          "const C=new Function(fs.readFileSync('course.js','utf8')+';return COURSE;')();"
          "process.stdout.write(JSON.stringify({title:C.title,short:C.short,ns:C.ns,output:C.output,"
          "oldCachePrefix:C.oldCachePrefix||'',files:C.files===undefined?null:C.files,"
          "manifest:C.manifest===undefined?null:C.manifest,tools:C.tools===undefined?null:C.tools}))")
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit('ERROR: course.js could not be evaluated\n' + (r.stderr or r.stdout).strip())
    c = json.loads(r.stdout)
    if not c.get('ns'):
        sys.exit('ERROR: course.js has no `ns`; storage and the offline cache are named from it')
    return c


def data_files(c):
    """The data files in build order: course.js `files`, or DEFAULT_FILES when
    the field is absent. Stops the build on a list that would leave questions
    out of the page or put a file in twice."""
    files = c.get('files')
    given = files is not None
    if not given:
        files = list(DEFAULT_FILES)
    where = 'course.js `files`' if given else f'the default file list {DEFAULT_FILES} (course.js has no `files`)'
    if not isinstance(files, list) or not files or not all(isinstance(f, str) for f in files):
        sys.exit('ERROR: course.js `files` must be a non-empty list of file names, in build order')
    bad = [f for f in files if not re.fullmatch(r'[A-Za-z0-9._-]+\.js', f)]
    if bad:
        sys.exit(f'ERROR: {where} names {bad}: each entry is a .js file name in src/, with no folder')
    twice = sorted({f for f in files if files.count(f) > 1})
    if twice:
        sys.exit(f'ERROR: {where} lists {twice} more than once')
    fixed = [f for f in files if f in ['course.js', 'sw.js'] + FIXED_SOURCES]
    if fixed:
        sys.exit(f'ERROR: {where} lists {fixed}, which the build already includes; list only the data files')
    missing = [f for f in files if not os.path.isfile(f)]
    if missing:
        sys.exit(f'ERROR: {where} lists {missing}, which are not in src/')
    if not any(QUESTION_FILE.fullmatch(f) for f in files):
        sys.exit(f'ERROR: {where} lists no question file (q<N>_<topic>.js); the first one declares TOPICS and QUESTIONS')
    unlisted = sorted((f for f in os.listdir('.') if QUESTION_FILE.fullmatch(f) and f not in files),
                      key=lambda f: [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', f)])
    if unlisted:
        sys.exit(f'ERROR: {unlisted} {"is" if len(unlisted) == 1 else "are"} in src/ but not in {where}, so '
                 f'{"its" if len(unlisted) == 1 else "their"} questions would be left out of the page; '
                 'list every question file in course.js `files`, in build order')
    return files


def manifest_extra(c):
    """course.js `manifest`: the two optional web-manifest members a course had
    in its own manifest before the core (Medicinal-chemistry's: description and
    orientation). orientation takes the values the Web Application Manifest
    names for it. Checked before anything is written."""
    extra = c.get('manifest')
    if extra is None:
        return {}
    if not isinstance(extra, dict) or set(extra) - {'description', 'orientation'}:
        sys.exit('ERROR: course.js `manifest` takes only `description` and `orientation`')
    if 'description' in extra and not (isinstance(extra['description'], str) and extra['description'].strip()):
        sys.exit('ERROR: course.js `manifest.description` must be a non-empty string')
    if 'orientation' in extra and extra['orientation'] not in ORIENTATIONS:
        sys.exit(f"ERROR: course.js `manifest.orientation` is {extra['orientation']!r}; it must be one of {ORIENTATIONS}")
    return extra


ORIENTATIONS = ['any', 'natural', 'landscape', 'portrait', 'portrait-primary', 'portrait-secondary',
                'landscape-primary', 'landscape-secondary']

# course.js `tools`: the course's own tables for three core tools, kept in
# course.js because a core update copies the tools over the course's copies
# (cite_check.py: citeAliases, citeLectures, citeBareMap; explain_check.js:
# explainTerms; harvest_mask.py: harvestMasks). Each tool reads only its own
# fields, so a misspelt field would leave a tool without its table and nothing
# would say so; the build stops on one instead.
TOOL_TABLES = {'citeAliases': 'files', 'citeLectures': 'files', 'citeBareMap': 'files',
               'explainTerms': 'terms', 'harvestMasks': 'masks'}


def tool_tables(c):
    """Check course.js `tools` before anything is written."""
    t = c.get('tools')
    if t is None:
        return
    if not isinstance(t, dict):
        sys.exit('ERROR: course.js `tools` must be an object')
    unknown = [k for k in t if k not in TOOL_TABLES]
    if unknown:
        sys.exit(f'ERROR: course.js `tools` has {unknown}, which no tool reads; its fields are {list(TOOL_TABLES)}')
    strs = lambda xs: isinstance(xs, list) and all(isinstance(x, str) for x in xs)
    shape = {
        'files': (lambda v: isinstance(v, dict) and all(f is None or isinstance(f, str) for f in v.values()),
                  'an object of how a citation names a deck -> its file name (or null)'),
        'terms': (lambda v: isinstance(v, list) and all(strs(e) and len(e) == 2 for e in v),
                  "a list of ['gloss key', 'regex source'] pairs"),
        'masks': (lambda v: isinstance(v, list) and all(isinstance(e, list) and len(e) == 2 and
                                                        isinstance(e[0], str) and strs(e[1]) for e in v),
                  "a list of ['images.json key', ['phrase', ...]] entries"),
    }
    for k, v in t.items():
        ok, what = shape[TOOL_TABLES[k]]
        if v is not None and not ok(v):
            sys.exit(f'ERROR: course.js `tools.{k}` must be {what}')


COURSE_FIELDS = course_fields()
DATA_FILES = data_files(COURSE_FIELDS)
MANIFEST_EXTRA = manifest_extra(COURSE_FIELDS)
tool_tables(COURSE_FIELDS)
QUESTION_FILES = [f for f in DATA_FILES if QUESTION_FILE.fullmatch(f)]
# Everything that has to parse before a build is allowed to proceed. Derived
# from DATA_FILES rather than listed again, so adding a question file cannot
# leave it syntax-checked in one place and unchecked in the other.
SOURCES = ['course.js'] + DATA_FILES + FIXED_SOURCES
# Every source file that ends up on the student's device. device_lint.js reads
# this list (python3 build.py --list-sources) rather than keeping its own copy.
# sw.js is not part of the page; the build fills it in and writes it beside it.
SHIPPED = SOURCES + ['shell.html', 'sw.js']
if '--list-sources' in sys.argv:
    print(json.dumps(SHIPPED))
    sys.exit(0)
# The data files and, of those, the question files, in build order, for the
# checks that need them (scheduler_test.js, browser_test.js, files_test.js).
if '--list-files' in sys.argv:
    print(json.dumps({'files': DATA_FILES, 'questions': QUESTION_FILES}))
    sys.exit(0)


def plain_png(size, rgb):
    """A square PNG of one colour, written with the standard library only."""
    import struct, zlib
    raw = (b'\x00' + bytes(rgb) * size) * size
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def scheduler_library(shell):
    """Put the FSRS library into the page only when the course's scheduler needs it.

    course.js `scheduler.model` is 'concept' (the default; no library), 'fsrs' or
    'concept-fsrs' (both run ts-fsrs). The library is ts-fsrs 6.0.0's own UMD
    bundle from npm, unchanged, in vendor/; the licence texts of everything in
    that bundle go in a comment above it, because they must travel with the
    code. Any other model name stops the build rather than running the default.
    """
    mark = '/*__SCHEDULER_LIB__*/'
    if mark not in shell:
        sys.exit('ERROR: scheduler library placeholder not found in shell.html')
    js = ("const fs=require('fs');"
          "const C=new Function(fs.readFileSync('course.js','utf8')+';return COURSE;')();"
          "process.stdout.write(JSON.stringify((C.scheduler&&C.scheduler.model)||'concept'))")
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit('ERROR: course.js could not be evaluated\n' + (r.stderr or r.stdout).strip())
    model = json.loads(r.stdout)
    if model not in ('concept', 'fsrs', 'concept-fsrs'):
        sys.exit(f"ERROR: course.js scheduler.model is {model!r}; it must be 'concept', 'fsrs' or 'concept-fsrs'")
    if model == 'concept':
        print('  scheduler: concept (no library)')
        return shell.replace(mark, '')
    lib_name = 'ts-fsrs-6.0.0.umd.js'
    notices = [('ts-fsrs 6.0.0', 'LICENSE-ts-fsrs'), ('@open-spaced-repetition/srs-kit 1.0.0, bundled in it', 'LICENSE-srs-kit'),
               ('@oxc-project/runtime 0.154.0 helpers, bundled in it', 'LICENSE-oxc-runtime'),
               ('the rolldown runtime at the top of the bundle', 'LICENSE-rolldown')]
    for f in [lib_name] + [n for _, n in notices]:
        if not os.path.exists(os.path.join('vendor', f)):
            sys.exit(f'ERROR: vendor/{f} is missing; the {model} scheduler needs it')
    lib = open(os.path.join('vendor', lib_name), encoding='utf-8').read()
    head = ('/* ts-fsrs 6.0.0 (npm, dist/index.umd.js, unchanged), the FSRS scheduler for\n'
            f'   course.js scheduler.model "{model}". Licences of the code in it:\n\n'
            + '\n'.join(f'   ---- {what} ----\n' + open(os.path.join('vendor', n), encoding='utf-8').read().replace('*/', '* /')
                        for what, n in notices) + '\n*/\n')
    block = head + lib + '\n'
    print(f'  scheduler: {model}; ts-fsrs 6.0.0 inlined ({len(block.encode("utf-8")) / 1024:.0f} KB with its licences)')
    return shell.replace(mark, block)


print('checking sources...')
for f in SOURCES + ['sw.js']:
    node_check(f, f)
print(f'  {len(SOURCES)} sources and sw.js parse cleanly')

shell = scheduler_library(open('shell.html', encoding='utf-8').read())
images = json.load(open('images.json'))

# the course manifest goes first, then a build stamp so the page can say which
# build it is; the question count is filled in after the data is assembled
import datetime, zoneinfo
course_src = open('course.js', encoding='utf-8').read()
if '/*__COURSE__*/' not in shell:
    sys.exit('ERROR: course placeholder not found in shell.html')
shell = shell.replace('/*__COURSE__*/', course_src + '\n')

parts = []
parts.append('const IMAGES = ' + json.dumps(images) + ';\n')
# rings.json is no longer inlined: the ring questions draw from the atlas, and
# the atlas structures are verified. rings.py is kept, corrected, for reference.
for f in DATA_FILES:
    parts.append(open(f, encoding='utf-8').read() + '\n')
parts.append(open('glossary.js', encoding='utf-8').read() + '\n')
parts.append(open('links.js', encoding='utf-8').read() + '\n')
parts.append(open('reference.js', encoding='utf-8').read() + '\n')
parts.append(open('tell.js', encoding='utf-8').read() + '\n')
parts.append(open('guide.js', encoding='utf-8').read() + '\n')
DATA = ''.join(parts)

# replace the three placeholder declarations in the shell with the real data
old = """const IMAGES = /*__IMAGES__*/{};
const QUESTIONS = /*__QUESTIONS__*/[];
const TOPICS = /*__TOPICS__*/[];"""
if old not in shell:
    sys.exit('ERROR: data placeholder block not found in shell.html')
shell = shell.replace(old, DATA)


def bank_size(data):
    """QUESTIONS.length and TOPICS.length, from course.js and the data files run
    in node in the order the page runs them, so the count the page shows is the
    number of questions it holds. (Counting `{id:'` lines in the question files
    also counted the TOPICS entries: 551 for Medicinal-chemistry's 479.)"""
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
        t.write(course_src + '\n' + data + '\n;JSON.stringify({questions: QUESTIONS.length, topics: TOPICS.length});\n')
        tmp = t.name
    js = ("const vm=require('vm'),fs=require('fs');const sb={console};vm.createContext(sb);"
          "process.stdout.write(String(vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),sb,{filename:'data'})))")
    try:
        r = subprocess.run(['node', '-e', js, tmp], capture_output=True, text=True)
    finally:
        os.unlink(tmp)
    if r.returncode != 0:
        sys.exit('ERROR: course.js and the data files did not run in node, so the questions cannot be counted\n'
                 + (r.stderr or r.stdout).strip()[-1500:])
    return json.loads(r.stdout)


BANK = bank_size(DATA)
n_q = BANK['questions']
print(f'  {n_q} questions in {BANK["topics"]} topics, from {len(QUESTION_FILES)} question file'
      f'{"" if len(QUESTION_FILES) == 1 else "s"}: {", ".join(QUESTION_FILES)}')
now = datetime.datetime.now(datetime.timezone.utc)
stamp = now.astimezone(zoneinfo.ZoneInfo('America/Chicago')).strftime('%Y-%m-%d %H:%M CT')
# `built` is the same moment in UTC, written so that a later build sorts after
# an earlier one as plain text; the page compares it with version.json.
built = now.strftime('%Y-%m-%dT%H:%M:%SZ')
build_old = "const BUILD = /*__BUILD__*/{stamp:'', built:'', questions:0, images:0, changelog:[], preview:false};"
if build_old not in shell:
    sys.exit('ERROR: build stamp placeholder not found in shell.html')
log = changelog()
shell = shell.replace(build_old, "const BUILD = {stamp:%s, built:%s, questions:%d, images:%d, changelog:%s, preview:%s};"
                      % (json.dumps(stamp), json.dumps(built), n_q, len(images), json.dumps(log),
                         'true' if PREVIEW else 'false'))
if PREVIEW:
    # no manifest link (a preview is not installed), and a line saying what it is
    manifest_link = '<link rel="manifest" href="./manifest.json">\n'
    if manifest_link not in shell or shell.count('<body>') < 1:
        sys.exit('ERROR: manifest link or <body> not found in shell.html')
    shell = shell.replace(manifest_link, '', 1)
    shell = shell.replace('<body>', '<body>\n<div id="previewnote" role="note" style="background:#FFF4D6;'
                          'border-bottom:1px solid #C9A227;padding:6px 12px;font:14px/1.4 system-ui,sans-serif">'
                          'Preview of the next version of this drill. Answers here are saved to a copy of '
                          'your progress; the live drill is unchanged.</div>', 1)
if log:
    print(f'  change log: {len(log)} entries, newest "{log[0]["date"]}"')

# append the views/runtime just before the closing script tag
views = open('views.js', encoding='utf-8').read()
marker = '</script>\n</body>'
if marker not in shell:
    sys.exit('ERROR: closing script marker not found')
shell = shell.replace(marker, '\n' + views + '\n</script>\n</body>')

# check the assembled script as one unit, so an assembly-level fault is caught too
scripts = re.findall(r'<script>([\s\S]*?)</script>', shell)
if len(scripts) != 1:
    sys.exit(f'ERROR: expected exactly 1 script block in the output, got {len(scripts)}')
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
    t.write(scripts[0])
    tmp_js = t.name
try:
    node_check(tmp_js, 'the assembled app script')
finally:
    os.unlink(tmp_js)
print('  assembled script parses cleanly')

def write_root(name, data):
    """Write a file into the repository root through a temporary file, so a
    failed build never leaves a half-written or truncated file in place of the
    last good one."""
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    tmp = path + '.tmp'
    with open(tmp, 'wb') as fh:
        fh.write(data if isinstance(data, bytes) else data.encode('utf-8'))
    os.replace(tmp, path)
    return path


write_root(OUTPUT_NAME, shell)
print(f'wrote {"preview/" if PREVIEW else ""}{OUTPUT_NAME}  ({len(shell)/1024/1024:.2f} MB)')

if PREVIEW:
    write_root('version.json', json.dumps({'built': built}) + '\n')
    print(f'wrote preview/version.json  (built {built}); the live site is unchanged')
    sys.exit(0)

# Pages runs Jekyll over the repository unless this file exists, and Jekyll
# leaves out files and folders whose names start with an underscore.
write_root('.nojekyll', '')

legacy = COURSE_FIELDS.get('output') or ''
legacy = legacy if legacy != OUTPUT_NAME else ''
title = htmlmod.escape(COURSE_FIELDS.get('title') or 'Exam drill')
if legacy:
    write_root(legacy, (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        f'<title>{title}</title>'
        '<link rel="canonical" href="./index.html">'
        '<meta http-equiv="refresh" content="0; url=./index.html">'
        '</head><body><p>This drill is at <a href="./index.html">index.html</a>.</p>'
        '<script>location.replace("./index.html" + location.hash);</script>'
        '</body></html>\n'))
    print(f'wrote {legacy}  (redirect to {OUTPUT_NAME})')

# Beside the page, the build time alone (Basic-Pharmacokinetics src/build.py):
# an open page reads it every 15 minutes and when its tab comes back, and offers
# a reload when a newer build is published. Written by the build, not by hand,
# so it cannot fall out of step with the page.
write_root('version.json', json.dumps({'built': built}) + '\n')
print(f'wrote version.json  (built {built})')

# ---- installing and working offline -------------------------------------------
# The web manifest and icons let a phone add the drill to its Home Screen or
# install it; the service worker keeps a copy for opening with no connection.
placeholders = []
for name, size in ICONS:
    own = os.path.join(HERE, 'icons', name)
    if os.path.exists(own):
        write_root(name, open(own, 'rb').read())
    else:
        write_root(name, plain_png(size, ACCENT))
        placeholders.append(name)
if placeholders:
    print(f'  note: placeholder icons (a plain square) for {", ".join(placeholders)}; '
          'put the course\'s own PNGs under src/icons/ to replace them')
extra = MANIFEST_EXTRA
man = {'name': COURSE_FIELDS.get('title') or 'Exam drill',
       'short_name': COURSE_FIELDS.get('short') or COURSE_FIELDS.get('title') or 'Drill'}
if 'description' in extra:
    man['description'] = extra['description']
man.update({'start_url': './index.html', 'scope': './', 'display': 'standalone'})
if 'orientation' in extra:
    man['orientation'] = extra['orientation']
man.update({'background_color': '#F2F4F7', 'theme_color': '#2F5FA8',
            'icons': [{'src': './icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                      {'src': './icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                      {'src': './icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]})
write_root('manifest.json', json.dumps(man, ensure_ascii=False, indent=1) + '\n')
print('wrote manifest.json and the icons')

# The worker's cache names start with the course's storage namespace, so its
# cleanup can tell this course's old caches from every other drill's on the
# shared origin. What it saves at install is exactly what this build wrote.
# A course that had its own service worker before it moved onto the core names
# that worker's cache prefix in course.js `oldCachePrefix` (Medicinal-chemistry:
# 'phar4342-drill-'), and this worker deletes those caches once. The prefix must
# end with '-' and must not match this course's own cache names, so a mistyped
# value cannot delete the cache the worker is about to use.
old_prefix = COURSE_FIELDS.get('oldCachePrefix') or ''
own_prefix = COURSE_FIELDS['ns'] + '-'
if old_prefix:
    if not re.fullmatch(r'[A-Za-z0-9._-]+-', old_prefix):
        sys.exit(f'ERROR: oldCachePrefix {old_prefix!r} must be letters, digits, ".", "_" or "-", ending with "-"')
    if (own_prefix + 'v1').startswith(old_prefix) or old_prefix.startswith(own_prefix):
        sys.exit(f'ERROR: oldCachePrefix {old_prefix!r} would match this course\'s own caches ({own_prefix}v<n>)')
site = {'prefix': own_prefix,
        'files': [OUTPUT_NAME] + ([legacy] if legacy else []) + ['manifest.json'] + [n for n, _ in ICONS],
        'aliases': [legacy] if legacy else [],
        'old': old_prefix}
sw = open('sw.js', encoding='utf-8').read()
sw_old = "const SITE = /*__SITE__*/{prefix:'drill-', files:['index.html'], aliases:[], old:''};"
if sw_old not in sw:
    sys.exit('ERROR: SITE placeholder not found in sw.js')
sw = sw.replace(sw_old, 'const SITE = ' + json.dumps(site) + ';')
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
    t.write(sw)
    tmp_sw = t.name
try:
    node_check(tmp_sw, 'the filled-in sw.js')
finally:
    os.unlink(tmp_sw)
write_root('sw.js', sw)
print(f'wrote sw.js  (caches named {site["prefix"]}v<n>; {len(site["files"])} files saved at install'
      + (f'; deletes caches named {old_prefix}*' if old_prefix else '') + ')')
