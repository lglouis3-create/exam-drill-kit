#!/usr/bin/env python3
"""Mutation checks for the notes module (QUALITY.md section B).

Each mutation is an exact string replace in a scratch course's copy of
src/features/notes/notes.js that must match exactly once. For each: apply it,
rebuild, run features/notes/test.js, record its exit code and the checks that
FAILed, restore the file. The scratch course (argument 1) has notes and
study-controls on, so the study-controls paths are exercised. Never applied to
the port branch.

    python3 mutations.py /tmp/port-notes/mut /tmp/port-notes/evidence/mutations
"""
import os, re, subprocess, sys, json

COURSE, OUT = sys.argv[1], sys.argv[2]
SRC = os.path.join(COURSE, 'src')
JS = os.path.join(SRC, 'features', 'notes', 'notes.js')
os.makedirs(OUT, exist_ok=True)
ENV = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')

M = [
 ('M1 a typed note is not saved', "  else if(isObj(DB.notes)) delete DB.notes[id];\n  save();", "  else if(isObj(DB.notes)) delete DB.notes[id];"),
 ('M2 a running paper never hides the key', "const running = id => typeof EX !== 'undefined' && !!EX && !!EX.running && EX.qs.some(q => q.id === id);", "const running = id => false;"),
 ('M3 the converter keeps bad notes', "if(!isObj(n) || typeof n.t !== 'string' || !n.t.trim()) delete db.notes[id];", "if(false) delete db.notes[id];"),
 ('M4 no button on the result cards', "if(cards.length === EX.qs.length) cards.forEach", "if(false) cards.forEach"),
 ('M5 the flag mark never shows', "const flagged = SC && typeof SC.isFlagged === 'function' && SC.isFlagged(id);", "const flagged = false;"),
 ('M6 the flag mark always shows', "const flagged = SC && typeof SC.isFlagged === 'function' && SC.isFlagged(id);", "const flagged = true;"),
 ('M7 notes listed oldest first', ".sort((a, b) => (m[b].at || 0) - (m[a].at || 0)); };", ".sort((a, b) => (m[a].at || 0) - (m[b].at || 0)); };"),
 ('M8 {{frac}} left as written in the text', ".replace(/\\{\\{frac:([^|}]*)\\|([^}]*)\\}\\}/g, '($1)/($2)')\n", "\n"),
 ('M9 Weak spots miscounts', "`✎ You have ${n} note${n === 1 ? '' : 's'}", "`✎ You have ${n + 1} note${n === 1 ? '' : 's'}"),
 ('M10 the button label is not updated as the note is typed', "document.querySelectorAll(`[data-noteq=\"${CSS.escape(id)}\"]`).forEach(c => { c.textContent = chipLabel(id); });", ""),
 ('M11 Delete note deletes nothing', "setNote(b.dataset.notedel, ''); renderNotes(el);", "renderNotes(el);"),
 ('M12 Drill these ignores the topic filter', "r.onclick = () => drillList(ids.map(byId), 'My notes');", "r.onclick = () => drillList(all.map(byId), 'My notes');"),
 ('M13 an emptied note is kept', "if(String(t).trim()){", "if(true){"),
 ('M14 no second look after the pass (one-page cards miss the button)', "  if(view === 'quiz' || view === 'exam') setTimeout(", "  if(false) setTimeout("),
 ('M15 the Notes tab shows the key of a running paper', "if(running(id)) keyH =", "if(false) keyH ="),
 ('M16 the key left out of the text', "if(key) out += `\\n**Key:** ${md(key)}\\n`;", "if(false) out += `\\n**Key:** ${md(key)}\\n`;"),
 ('M17 no button on the quiz card', "if(typeof Q !== 'undefined' && Q && Q.current) addChip(", "if(false) addChip("),
 ('M18 the box does not open', "if(head){ head.insertAdjacentHTML('afterend', noteBox(b.dataset.noteq));", "if(false){ head.insertAdjacentHTML('afterend', noteBox(b.dataset.noteq));"),
 ('M19 a saved progress loses its notes on load', "if(!('notes' in db)) return;", "delete db.notes; return;"),
 ('M20 Download names the file wrongly', "`${COURSE.id}-my-questions.md`", "`my-questions.md`"),
]

orig = open(JS, encoding='utf8').read()
rows = []
try:
    for label, a, b in M:
        n = orig.count(a)
        if n != 1:
            rows.append({'mutation': label, 'error': f'matched {n} times'}); print(label, 'matched', n); continue
        open(JS, 'w', encoding='utf8').write(orig.replace(a, b))
        tag = label.split()[0]
        bl = subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True, text=True)
        if bl.returncode != 0:
            rows.append({'mutation': label, 'exit': 'build failed', 'failed': [bl.stdout[-300:] + bl.stderr[-300:]]}); continue
        r = subprocess.run(['node', 'features/notes/test.js'], cwd=SRC, capture_output=True, text=True, env=ENV, timeout=900)
        out = r.stdout + r.stderr
        open(os.path.join(OUT, tag + '.log'), 'w').write(out)
        failed = [re.sub(r'^\s*FAIL\s+', '', l).split('  — ')[0] for l in out.splitlines() if re.match(r'^\s+FAIL\s', l)]
        rows.append({'mutation': label, 'exit': r.returncode, 'failed': sorted(set(failed)), 'summary': out.strip().splitlines()[-1]})
        print(label, r.returncode, len(set(failed)), flush=True)
finally:
    open(JS, 'w', encoding='utf8').write(orig)
json.dump(rows, open(os.path.join(OUT, 'mutations.json'), 'w'), indent=1, ensure_ascii=False)
with open(os.path.join(OUT, 'mutations.md'), 'w') as f:
    f.write('| Mutation | Exit code | Checks that FAILed |\n|---|---|---|\n')
    for r in rows:
        f.write(f"| {r['mutation']} | {r.get('exit', r.get('error'))} | {'; '.join(r.get('failed', [])) or 'NONE (not caught)'} |\n")
print('caught', sum(1 for r in rows if r.get('failed')), 'of', len(rows))
