#!/usr/bin/env python3
"""Mutation checks for features/study-controls (QUALITY B). agent-run.

    python3 mutations.py <course_dir> [name ...]

Third pass (2026-11-02 v3): the same 20 mutations against the test on 54f6d3c, on the module's own course
(modcourse.sh: mkcourse, then ci/oncourse.js). <course_dir> is a scratch course (/tmp/port-tools/mkcourse.sh ... study-controls, module switched on).
Each mutation is applied to <course_dir>/src/features/study-controls/study-controls.js by exact
string replacement (each old string must occur exactly once), the course is built, the module test
runs, and the failing checks are recorded. The file is restored after every mutation. Nothing here
touches the port branch.
"""
import os, re, subprocess, sys, json

M = [
  ("M1 no dialog guard on keys", [("if(DOWN.size || modalOpen(e.target)) return;", "if(DOWN.size) return;")]),
  ("M2 no pointer-down guard on keys", [("if(DOWN.size || modalOpen(e.target)) return;", "if(modalOpen(e.target)) return;")]),
  ("M3 a pointer down on a canvas is not noted", [("DOWN.add(e.pointerId)", "void 0")]),
  ("M4 contenteditable is a shortcut", [("|| (e.target && e.target.isContentEditable)) return;", ") return;")]),
  ("M5 a textarea is a shortcut", [("/^(INPUT|SELECT|TEXTAREA)$/", "/^(INPUT|SELECT)$/")]),
  ("M6 strict paper keeps Back", [("if(back) back.remove();", "if(back) void 0;")]),
  ("M7 strict paper not recorded (lost on reload)", [("if(PENDING) store.set(STRICT_KEY(), paperKey());", "if(PENDING) void 0;")]),
  ("M8 strict Next on a blank question does not ask", [("if(t.closest('#exNext') && strictPaper() && blankAt(EX.i)){", "if(false){")]),
  ("M9 strict box kept only on Start (lost on a redraw)", [("if(STRICT && e.target && e.target.id === 'scStrict')", "if(false)")]),
  ("M10 ArrowLeft allowed on a strict paper", [("EX.i > 0 && !strictPaper()", "EX.i > 0")]),
  ("M11 ArrowLeft allowed and Back kept on a strict paper", [("EX.i > 0 && !strictPaper()", "EX.i > 0"), ("if(back) back.remove();", "if(back) void 0;")]),
  ("M12 a flag is not saved", [("m[id] = m[id] || Date.now(); save();", "m[id] = m[id] || Date.now();")]),
  ("M13 the layout is not saved", [("DB.layout = k === 'all' ? 'all' : 'one'; save();", "DB.layout = k === 'all' ? 'all' : 'one';")]),
  ("M14 an id the bank does not have is flagged", [("if(!FLAGS || !byId(id)) return false;", "if(!FLAGS) return false;")]),
  ("M15 flags of another shape kept on load", [("if('flags' in db && !isObj(db.flags)) delete db.flags;", "")]),
  ("M16 a paper with calculations drawn on one page", [("!strict && !typed && layout()", "!strict && layout()")]),
  ("M17 the paper's flag bar is not refreshed", [("  refreshPaperFlags();\n  const row", "  const row")]),
  ("M18 Drill flagged leaves one out", [("if(pool.length) drillList(pool, 'Flagged questions');", "if(pool.length) drillList(pool.slice(1), 'Flagged questions');")]),
  ("M19 Show the next 40 shows no more", [("ALL.n += 40", "ALL.n += 0")]),
  ("M20 Clear flags clears nothing", [("if(confirm('Remove every flag?')){ DB.flags = {}; save(); flagChanged(null); }", "if(confirm('Remove every flag?')){ flagChanged(null); }")]),
]

def main():
  course = sys.argv[1]; only = set(sys.argv[2:])
  src = os.path.join(course, 'src'); f = os.path.join(src, 'features', 'study-controls', 'study-controls.js')
  orig = open(f, encoding='utf8').read()
  env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
  rows = []
  try:
    for name, reps in M:
      if only and name.split()[0] not in only: continue
      text = orig
      for old, new in reps:
        n = text.count(old)
        if n != 1: raise SystemExit(f'{name}: the string to replace occurs {n} times, not once: {old!r}')
        text = text.replace(old, new)
      open(f, 'w', encoding='utf8').write(text)
      b = subprocess.run(['python3', 'build.py'], cwd=src, capture_output=True, text=True)
      if b.returncode != 0: rows.append((name, b.returncode, 'BUILD FAILED')); continue
      r = subprocess.run(['node', 'features/study-controls/test.js'], cwd=src, capture_output=True, text=True, env=env, timeout=900)
      out = r.stdout + r.stderr
      log = os.path.join('/tmp/port-study-controls/v3/logs', 'mut3-' + name.split()[0] + '.log')
      open(log, 'w', encoding='utf8').write(out)
      fails = [l[8:].split('  — ')[0] for l in out.splitlines() if l.startswith('  FAIL  ')]
      crash = [l for l in out.splitlines() if 'crashed' in l]
      rows.append((name, r.returncode, '; '.join(fails) if fails else (crash[0][:200] if crash else 'NOT CAUGHT')))
      print(json.dumps(rows[-1]), flush=True)
  finally:
    open(f, 'w', encoding='utf8').write(orig)
    subprocess.run(['python3', 'build.py'], cwd=src, capture_output=True, text=True)
  with open('/tmp/port-study-controls/v3/mutations.md', 'a', encoding='utf8') as o:
    o.write('| Mutation | Test exit code | Checks that failed (agent-run) |\n|---|---|---|\n')
    for name, rc, what in rows: o.write(f'| {name} | {rc} | {what} |\n')
  print('done', len(rows))

main()
