#!/usr/bin/env python3
"""mutations.py COURSE_DIR OUT_DIR [ids...]

For each mutation: a fresh copy of COURSE_DIR/src (a template course with theme on, built),
the mutation applied to src/features/theme/<file> by exact string replacement (each `old`
must occur exactly once, else the mutation is reported as NOT APPLIED and nothing runs),
then `node features/theme/test.js` in that copy. Records the exit code and every FAIL line.
Writes OUT_DIR/<id>.log and OUT_DIR/mutations.tsv (id, file, what it breaks, exit, checks
that failed). Never touches the port branch: it works on copies under OUT_DIR.
"""
import os, re, shutil, subprocess, sys, time

D = 'features/theme'
CORE = '#0B1118; --ink-2:#141D27; --paper:#18212B; --surface:#10161D;\n  --line:#33404F; --line-soft:#26303C;\n  --text:#E4EAF1; --text-dim:#9FAEBE;'
DEV, PICK = ':root:not([data-theme="light"]){--ink:', ':root[data-theme="dark"]{--ink:'
M = [
 ('M01', 'theme.js', 'apply() never sets data-theme (Light and Dark picks do nothing)',
  [("if(valid(t)) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');", "root.removeAttribute('data-theme');")]),
 ('M02', 'theme.js', 'a pick is not stored (lost on reload)',
  [("if(valid(t)) store.set(KEY, t); else store.del(KEY);", "if(!valid(t)) store.del(KEY);")]),
 ('M03', 'theme.js', 'Match device is stored as "device" instead of removing the stored choice',
  [("if(valid(t)) store.set(KEY, t); else store.del(KEY);", "store.set(KEY, t);")]),
 ('M04', 'theme.js', 'any stored value is taken as a theme',
  [("const valid = t => t === 'light' || t === 'dark';", "const valid = t => !!t && t !== 'device';")]),
 ('M05', 'theme.js', 'the choice is also written into the progress (DB)',
  [("if(valid(t)) store.set(KEY, t); else store.del(KEY);", "if(valid(t)) store.set(KEY, t); else store.del(KEY); DB.theme = t; save();")]),
 ('M06', 'theme.js', 'the stored choice is applied 60 ms after load (a light page first)',
  [("apply(current());\n\nX.start", "setTimeout(() => apply(current()), 60);\n\nX.start")]),
 ('M07', 'theme.js', 'sync() leaves the header menu as it was',
  [("if(el.tagName === 'SELECT') el.value = t; else el.checked = el.value === t;", "if(el.tagName !== 'SELECT') el.checked = el.value === t;")]),
 ('M08', 'theme.js', 'the Settings choice is not wired',
  [("r.onchange = () => { if(r.checked) choose(r.value); };", "r.onchange = () => {};")]),
 ('M09', 'theme.js', 'the choice is read from localStorage directly, not through the core store',
  [("function current(){ const t = store.get(KEY);", "function current(){ const t = localStorage.getItem(KEY);")]),
 ('M10', 'theme.js', 'no guard for the engine run in node with no page',
  [("if(!root || typeof root.setAttribute !== 'function') return;", "")]),
 ('M11', 'theme.js', 'the header menu has no Match device entry',
  [("const CHOICES = [['device', 'Match device'], ", "const CHOICES = [")]),
 ('M12', 'theme.js', 'a pick is written to localStorage directly (a refused write throws)',
  [("if(valid(t)) store.set(KEY, t);", "if(valid(t)) localStorage.setItem(KEY, t);")]),
 ('C01', 'theme.css', 'the Match device block applies on a light device instead of a dark one',
  [("@media (prefers-color-scheme: dark){", "@media (prefers-color-scheme: light){")]),
 ('C02', 'theme.css', 'dim text colour too dark in both blocks (#4A5563)',
  [(DEV + CORE, DEV + CORE.replace('--text-dim:#9FAEBE', '--text-dim:#4A5563')), (PICK + CORE, PICK + CORE.replace('--text-dim:#9FAEBE', '--text-dim:#4A5563'))]),
 ('C03', 'theme.css', 'Light picked on a dark device does not win (device block selector :root)',
  [("@media (prefers-color-scheme: dark){\n" + DEV, "@media (prefers-color-scheme: dark){\n:root{--ink:")]),
 ('C04', 'theme.css', 'one rule missing from the Dark-picked block',
  [(':root[data-theme="dark"] .examhead{background:#141D27}\n', '')]),
 ('C05', 'theme.css', 'no dark value for --wash in either block',
  [('  --wash:rgba(242,131,122,.18);\n  color-scheme:dark}\n:root:not', '  color-scheme:dark}\n:root:not'), ('  --wash:rgba(242,131,122,.18);\n  color-scheme:dark}\n:root[data-theme="dark"] .teach', '  color-scheme:dark}\n:root[data-theme="dark"] .teach')]),
 ('C06', 'theme.css', 'no color-scheme:dark in either block (native controls stay light)',
  [('  --wash:rgba(242,131,122,.18);\n  color-scheme:dark}\n:root:not', '  --wash:rgba(242,131,122,.18);}\n:root:not'), ('  --wash:rgba(242,131,122,.18);\n  color-scheme:dark}\n:root[data-theme="dark"] .teach', '  --wash:rgba(242,131,122,.18);}\n:root[data-theme="dark"] .teach')]),
 ('C08', 'theme.css', 'no color-scheme:dark anywhere (page and the select/input/textarea rule, both blocks)',
  [('  --wash:rgba(242,131,122,.18);\n  color-scheme:dark}\n:root:not', '  --wash:rgba(242,131,122,.18);}\n:root:not'), ('  --wash:rgba(242,131,122,.18);\n  color-scheme:dark}\n:root[data-theme="dark"] .teach', '  --wash:rgba(242,131,122,.18);}\n:root[data-theme="dark"] .teach'),
   (':root:not([data-theme="light"]) textarea{color-scheme:dark}', ':root:not([data-theme="light"]) textarea{}'), (':root[data-theme="dark"] textarea{color-scheme:dark}', ':root[data-theme="dark"] textarea{}')]),
 ('C07','theme.css', 'no dark text on the light-coloured buttons in either block',
  [(':root:not([data-theme="light"]) .btn:not(.ghost):not(.amber),', ':root:not([data-theme="light"]) .nosuch,'), (':root[data-theme="dark"] .btn:not(.ghost):not(.amber),', ':root[data-theme="dark"] .nosuch,')]),
]

def main():
    course, out = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    env = dict(os.environ, NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
    env.pop('DRILL_PAGE', None)
    tsv = open(os.path.join(out, 'mutations.tsv'), 'a')
    for mid, f, what, reps in M:
        if only and mid not in only: continue
        work = os.path.join(out, 'work-' + mid)
        shutil.rmtree(work, ignore_errors=True)
        shutil.copytree(course, work, symlinks=True)
        p = os.path.join(work, 'src', D, f)
        text = open(p, encoding='utf8').read()
        bad = [o for o, _ in reps if text.count(o) != 1]
        if bad:
            tsv.write(f'{mid}\t{f}\t{what}\tNOT APPLIED\t{len(bad)} replacement(s) did not match exactly once\n'); tsv.flush()
            print(mid, 'NOT APPLIED'); shutil.rmtree(work, ignore_errors=True); continue
        for o, n in reps: text = text.replace(o, n)
        open(p, 'w', encoding='utf8').write(text)
        t0 = time.time()
        r = subprocess.run(['node', os.path.join(D, 'test.js')], cwd=os.path.join(work, 'src'), env=env, capture_output=True, text=True, timeout=900)
        log = r.stdout + r.stderr
        open(os.path.join(out, mid + '.log'), 'w').write(log)
        fails = [re.sub(r'\s+—.*$', '', l.strip()[len('FAIL'):].strip()) for l in log.splitlines() if l.strip().startswith('FAIL  ')]
        stop = [l for l in log.splitlines() if 'the test stopped' in l]
        summary = '; '.join(fails) + (' | ' + stop[0] if stop else '')
        tsv.write(f'{mid}\t{f}\t{what}\t{r.returncode}\t{summary}\n'); tsv.flush()
        print(mid, r.returncode, f'{time.time() - t0:.0f}s', len(fails), 'FAIL', summary[:200])
        shutil.rmtree(work, ignore_errors=True)

main()
