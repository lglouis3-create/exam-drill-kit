#!/usr/bin/env python3
"""Mutation checks for worksheets-ink. Each mutation is an exact string replace
that must match once, applied to a scratch course's copy of the module
(src/features/worksheets-ink/), then the page is rebuilt and the module test run.
The file is restored after each run. Nothing here touches the port branch.

  python3 mutations.py <course src dir> <out dir> [name ...]
"""
import os, re, shutil, subprocess, sys, json, time

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = set(sys.argv[3:])
MOD = os.path.join(SRC, 'features', 'worksheets-ink')
JS, STEP = 'worksheets-ink.js', 'step.js'

M = [
 ('plan-order', JS, "gs.map((g, i) => [g, i]).sort((a, b) => num(a[0]) - num(b[0]) || a[1] - b[1]).map(x => x[0])",
                    "gs.map((g, i) => [g, i]).map(x => x[0])", "sheetPlan: problems in the sheet's numbering"),
 ('plan-changed', JS, "if(/\\(changed numbers\\)/i.test(c.name || '')) return 'changed';", "",
                      "setNumbers: a '(changed numbers)' set is the extra-practice sheet"),
 ('plan-dup', JS, "main = main.filter(g => !dup.includes(g));", "", "sheetPlan: an older copy of a problem already on the sheet is left off"),
 ('solved-by', JS, "if(!s || s.key !== 'instructor') return 'drill';", "if(!s) return 'drill';", "solvedBy: only the professor's own solved sheet is the professor's key"),
 ('solved-spoken', JS, "if(SPOKEN_ONLY && SPOKEN_ONLY.test(a)", "if(false && SPOKEN_ONLY", "solvedBy: working only heard is the drill's"),
 ('carry', JS, "const dropCarry = t => String(t || '').replace(CARRY_RE, '');", "const dropCarry = t => String(t || '');", "dropCarry: carried values left out on paper"),
 ('shared-lead', JS, "if(stems.every(s => s.slice(i).trim().length)) return head.trim().length >= 20 ? i : 0;",
                     "if(stems.every(s => s.slice(i).trim().length)) return 0;", "sharedLead: a set's shared text printed once"),
 ('ws-order', JS, "const j = h % (i + 1);", "const j = i;", "wsOrder: the options' fixed order"),
 ('chain-start', JS, "&& C.startChain(groups[0].chain.id)) return;", "&& false) return;", "startSheetSet: a whole problem set starts that set (chained-problem-sets on)"),
 ('sheet-sweep', JS, "sweep: ids.slice(), i: 0,", "sweep: ids.slice().reverse(), i: 0,", "startSheetSet: the sheet's order"),
 ('room', JS, "(INK.data.room[key] || 0) + INK_ROOM * +b.dataset.inkroom", "(INK.data.room[key] || 0) + INK_ROOM", "More room / Less room"),
 ('eraser', JS, "INK.data.parts[key] = list.filter(s => !hit.includes(s));", "INK.data.parts[key] = list;", "the stroke eraser"),
 ('redo', JS, "const from = redo ? INK.redo : INK.undo, to = redo ? INK.undo : INK.redo,", "const from = INK.undo, to = INK.redo,", "undo and redo"),
 ('pencil-only', JS, "if(INK.pencil && e.pointerType === 'touch'){", "if(false && e.pointerType === 'touch'){", "Pencil only: a finger scrolls"),
 ('snap-box', JS, "if(er < ee && er < 0.12)", "if(false)", "Hold to snap: a box"),
 ('two-finger', JS, "if(quick && INK){ scroll = null;", "if(false){ scroll = null;", "two fingers tapped together undo"),
 ('exam-clear', JS, "if(all) Object.keys(all).forEach(k => { if(k.startsWith('q:')", "if(false) Object.keys(all).forEach(k => { if(k.startsWith('q:')", "a new paper's scratch paper starts clean"),
 ('continue', JS, "? '✍️ Continue writing' : '✍️ Write on it'", "? '✍️ Write on it' : '✍️ Write on it'", "Continue writing on the card"),
 ('print', JS, "im.src = c.toDataURL('image/png'); c.after(im);", "im.src = c.toDataURL('image/png');", "Save as PDF prints the ink"),
 ('no-write', JS, "let state = inkWrite();", "save(); let state = 'ok';", "the writing is written when the pen lifts (not 150 ms later)"),
 ('no-rollback', JS, "if(state === 'full'){", "if(false){", "storage full: the change is refused and the last good progress kept"),
 ('warn-hidden', JS, "w.hidden = INK.saved === 'ok';", "w.hidden = true;", "the not-saved notice is shown"),
 ('warn-fixed', 'worksheets-ink.css', ".inkwarn:not([hidden]){position:fixed;", ".inkwarn:not([hidden]){position:static;", "the notice on screen at 390 px"),
 ('progress-shape', JS, "if(!d || typeof d.parts !== 'object' || !d.parts || Array.isArray(d.parts)) delete db.ink[k];", "", "an imported page in another shape is left out"),
 ('erase-all', JS, "delete DB.ink; save(); renderSettings();", "save(); renderSettings();", "Erase all writing"),
 ('step-dup', STEP, "if(of[it.q] && of[it.q].src !== s.id) errs.push", "if(false) errs.push", "build step: a question on two documents"),
 ('step-lookbehind', STEP, "if(/\\(\\?<[=!]/.test(v)) errs.push", "if(false) errs.push", "build step: an option with a lookbehind"),
]

os.makedirs(OUT, exist_ok=True)
env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
rows = []
for name, f, old, new, what in M:
    if ONLY and name not in ONLY: continue
    p = os.path.join(MOD, f)
    text = open(p, encoding='utf-8').read()
    n = text.count(old)
    if n != 1:
        rows.append({'name': name, 'what': what, 'error': f'the text to replace matches {n} times'}); print(name, 'NO MATCH', n, flush=True); continue
    shutil.copy(p, p + '.orig')
    try:
        open(p, 'w', encoding='utf-8').write(text.replace(old, new))
        b = subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True, text=True)
        t0 = time.time()
        r = subprocess.run(['node', 'features/worksheets-ink/test.js'], cwd=SRC, capture_output=True, text=True, env=env, timeout=1500)
        log = r.stdout + r.stderr
        open(os.path.join(OUT, f'mutation-{name}.log'), 'w').write(log)
        fails = [l.strip()[len('FAIL  '):] for l in log.split('\n') if l.strip().startswith('FAIL  ')]
        last = [l for l in log.split('\n') if re.match(r'^(PASS|FAIL|NOT RUN): ', l)]
        rows.append({'name': name, 'what': what, 'file': f, 'build': b.returncode, 'exit': r.returncode, 'seconds': round(time.time() - t0),
                     'failed': fails, 'summary': last[-1] if last else ''})
        print(name, 'exit', r.returncode, (fails[0][:100] if fails else 'NOT CAUGHT'), flush=True)
    finally:
        shutil.move(p + '.orig', p)
json.dump(rows, open(os.path.join(OUT, 'mutations.json'), 'w'), indent=1)
subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True)
