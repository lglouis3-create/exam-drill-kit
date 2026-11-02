#!/usr/bin/env python3
"""Mutation checks for paper-picker (agent-run). Never committed to the port branch.

    python3 -I mutations.py <course dir> <log dir> [M1 M2 ...]

<course dir> is a scratch course whose src/features/paper-picker/ holds the module (the CI course,
made by mkci.sh). For each mutation: an exact string replacement in the module's file that must
match exactly once, python3 build.py, node features/paper-picker/test.js, the result recorded,
the file restored. The course is rebuilt from the restored files at the end.
"""
import os, subprocess, sys, re, time

M = [
 ('M1', 'paper-picker.js', 'shares without the largest remainder (the split loses its rounding)',
  ".forEach(o => { if(left > 0){ got[o.i]++; left--; } });", ".forEach(o => {});"),
 ('M2', 'paper-picker.js', 'every question put in the first pool',
  "const i = e.pools.findIndex(p => testOf(p)(q));", "const i = 0;"),
 ('M3', 'paper-picker.js', 'an old choice never gives way to the current exam',
  "return over && !chosenAfter && e.id !== EXAM.id ? EXAM : e;", "return e;"),
 ('M4', 'paper-picker.js', 'a choice made after its exam (to review it) is not kept',
  "chosenAfter = typeof s.at === 'number' && s.at > examEnds(e);", "chosenAfter = false;"),
 ('M5', 'paper-picker.js', 'the choice can change while a paper runs',
  "if(!offered(e) || (EX && EX.running)) return false;", "if(!offered(e)) return false;"),
 ('M6', 'paper-picker.js', 'a paper recorded each time its result page is drawn',
  "if(!EX || !EX.done || EX.ppLogged) return;", "if(!EX || !EX.done) return;"),
 ('M7', 'paper-picker.js', 'no limit of 100 papers kept',
  "const MAX_KEPT = 100, SHOWN = 12;", "const MAX_KEPT = 1000, SHOWN = 12;"),
 ('M8', 'paper-picker.js', 'every paper listed, not the 12 newest',
  "const MAX_KEPT = 100, SHOWN = 12;", "const MAX_KEPT = 100, SHOWN = 100;"),
 ('M9', 'paper-picker.js', 'the list oldest first',
  "const papers = (state().papers || []).slice().reverse();", "const papers = (state().papers || []).slice();"),
 ('M10', 'paper-picker.js', 'every paper recorded for the current exam',
  "? d.exam : EXAM.id;", "? EXAM.id : EXAM.id;"),
 ('M11', 'paper-picker.js', 'the draw not recorded',
  "s.drawn = {exam: forId, ids: paper.map(q => q.id)};", ""),
 ('M12', 'paper-picker.js', 'reading the module\'s state creates it in the progress',
  "const state = () => has() ? DB.paperPicker : {};", "const state = () => put();"),
 ('M13', 'paper-picker.js', 'no select-all item asked of a pool',
  "const got = drawMixed(by[i].qs, want[i], s, used);", "const got = drawMixed(by[i].qs, want[i], 0, used);"),
 ('M14', 'paper-picker.js', 'blank items not counted',
  "const blank = EX.qs.filter((q, i) => examBlank(q, EX.picks[i])).length;", "const blank = 0;"),
 ('M15', 'paper-picker.js', 'the other exam\'s paper drawn but not used',
  "if(d){ paper = d; forId = e.id; }", "if(d){ forId = e.id; }"),
 ('M16', 'paper-picker.js', 'no note when the bank is too small',
  "if(have < n) h += `<div class=\"note\" data-pp=\"short\">", "if(false) h += `<div class=\"note\" data-pp=\"short\">"),
 ('M17', 'paper-picker.js', 'a chip for every exam, offered or not',
  "const offered = e => !!e && (e === EXAM || OFFER.has(e.id));", "const offered = e => !!e;"),
 ('M18', 'paper-picker.js', 'no chips in Settings',
  "if(OFFER.size) X.settings({", "if(false) X.settings({"),
 ('M19', 'step.js', 'an exam with another question count offered',
  "if(val(e.questions) !== val(cur.questions)) why.push(", "if(false) why.push("),
 ('M20', 'step.js', 'two exams with one id do not stop the build',
  "if(dup.length) errs.push(", "if(false) errs.push("),
 ('M21', 'paper-picker.js', 'typed items drawn on a paper whose exam does not take them',
  "const drawable = q => !q.lowYield && (!q.type || (typedOn() && EXAM_TYPED.typed(q)));", "const drawable = q => !q.lowYield;"),
 ('M22', 'paper-picker.js', 'an exam ends at its start (its minutes not added)',
  "return isNaN(at) ? Infinity : at + (e.minutes || 0) * 60000;", "return isNaN(at) ? Infinity : at;"),
 ('M23', 'paper-picker.js', 'the result page does not name the exam',
  "This paper was drawn for ${esc(x.name)}.", "This paper."),
 ('M24', 'paper-picker.js', 'the list does not name the exam',
  "<tr><td>${esc(ex ? ex.name : 'Paper')}</td>", "<tr><td>${esc('Paper')}</td>"),
 ('M25', 'paper-picker.js', 'the chosen chip not marked',
  "aria-pressed=\"${x.id === e.id}\"", "aria-pressed=\"false\""),
 ('M26', 'paper-picker.js', 'a pool may not top up from its own select-all items',
  "if(got.length < want[i]) got.push(...drawN(by[i].qs, want[i] - got.length, used));", ""),
 ('M27', 'paper-picker.js', 'the paper shuffled no more (pools in order)',
  "return out.length === n ? shuffle(out) : null;", "return out.length === n ? out : null;"),
]

def main():
    course, logdir = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    src = os.path.join(course, 'src')
    mod = os.path.join(src, 'features', 'paper-picker')
    os.makedirs(logdir, exist_ok=True)
    env = dict(os.environ)
    env['NODE_PATH'] = subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()
    rows = []
    for mid, f, what, old, new in M:
        if only and mid not in only: continue
        path = os.path.join(mod, f)
        orig = open(path).read()
        if orig.count(old) != 1:
            rows.append((mid, what, 'NOT RUN: the text to replace occurs %d times' % orig.count(old), '-')); continue
        open(path, 'w').write(orig.replace(old, new))
        try:
            b = subprocess.run(['python3', 'build.py'], cwd=src, capture_output=True, text=True, env=env)
            t0 = time.time()
            t = subprocess.run(['node', 'features/paper-picker/test.js'], cwd=src, capture_output=True, text=True, env=env, timeout=900)
            out = b.stdout + b.stderr + '\n---- test ----\n' + t.stdout + t.stderr
            open(os.path.join(logdir, mid + '.log'), 'w').write(out)
            fails = [re.sub(r'\s+—.*$', '', l.strip()[len('FAIL  '):]) for l in t.stdout.splitlines() if l.strip().startswith('FAIL  ')]
            last = [l for l in t.stdout.splitlines() if l.startswith(('PASS:', 'FAIL:', 'NOT RUN:'))]
            if b.returncode != 0 and not fails: fails = ['(the build stopped: ' + (b.stdout + b.stderr).strip().splitlines()[-1][:160] + ')']
            caught = 'caught' if t.returncode != 0 else 'NOT caught'
            rows.append((mid, what, caught + ': ' + ('; '.join(fails) if fails else (last[-1] if last else '')), str(t.returncode)))
        finally:
            open(path, 'w').write(orig)
        print(rows[-1], flush=True)
    subprocess.run(['python3', 'build.py'], cwd=src, capture_output=True, text=True, env=env)
    with open(os.path.join(logdir, 'mutations.md'), 'w') as o:
        o.write('| Mutation | What it breaks | Result: the checks that failed | Test exit code |\n|---|---|---|---|\n')
        for r in rows: o.write('| %s | %s | %s | %s |\n' % (r[0], r[1], r[2].replace('|', '/'), r[3]))
    print(open(os.path.join(logdir, 'mutations.md')).read())

main()
