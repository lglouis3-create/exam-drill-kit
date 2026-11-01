#!/usr/bin/env python3
"""Assemble the single-file quiz app from shell + data + views.

Every JavaScript source is syntax-checked before anything is assembled, and the
assembled script is checked again before the output file is replaced. A source
with a stray comma or bracket therefore stops the build with the offending file
and line named, instead of producing an HTML file that loads to a blank screen.
"""
import json, re, io, os, subprocess, sys, tempfile

# The data files, in the order they are concatenated into the page. TOPICS is
# declared at the top of the first question file, so it has to precede the
# other question files; atlas.js precedes any question file that draws on it.
DATA_FILES = ['atlas.js', 'diagrams.js',
              'q1_topics.js']          # add each new question file here, in order

# Everything that has to parse before a build is allowed to proceed. Derived
# from DATA_FILES rather than listed again, so adding a question file cannot
# leave it syntax-checked in one place and unchecked in the other.
SOURCES = ['course.js'] + DATA_FILES + ['glossary.js', 'links.js', 'reference.js', 'tell.js', 'guide.js', 'views.js']


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


print('checking sources...')
for f in SOURCES:
    node_check(f, f)
print(f'  {len(SOURCES)} sources parse cleanly')

shell = open('shell.html', encoding='utf-8').read()
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
n_q = sum(len(re.findall(r"(?m)^\s*\{id:'", open(f, encoding='utf-8').read())) for f in DATA_FILES if f.startswith('q'))
stamp = datetime.datetime.now(zoneinfo.ZoneInfo('America/Chicago')).strftime('%Y-%m-%d %H:%M CT')
build_old = "const BUILD = /*__BUILD__*/{stamp:'', questions:0, images:0, changelog:[]};"
if build_old not in shell:
    sys.exit('ERROR: build stamp placeholder not found in shell.html')
log = changelog()
shell = shell.replace(build_old, "const BUILD = {stamp:%s, questions:%d, images:%d, changelog:%s};"
                      % (json.dumps(stamp), n_q, len(images), json.dumps(log)))
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

# write to a temporary file first, so a failed build never leaves a half-written
# or truncated HTML in place of the last good one
m = re.search(r"output:\s*'([^']+)'", course_src)
out = os.path.join('/mnt/user-data/outputs', m.group(1) if m else 'exam_drill.html')
os.makedirs('/mnt/user-data/outputs', exist_ok=True)
tmp_out = out + '.tmp'
with open(tmp_out, 'w', encoding='utf-8') as fh:
    fh.write(shell)
os.replace(tmp_out, out)
print(f'wrote {out}  ({len(shell)/1024/1024:.2f} MB)')
