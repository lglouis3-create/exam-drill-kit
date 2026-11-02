#!/usr/bin/env python3
"""Mutation checks for short-answer-graphs (QUALITY B).

Each mutation breaks one behaviour of the module on purpose, in the copy of the
module inside a scratch course (never in the kit's port branch): an exact string
replacement that must match exactly once. The course is rebuilt, the module test is
run, the exit code and the failing checks are recorded, and the file is restored.

    python3 mutations.py <courseDir>     (a mkcourse.sh course with ci/oncourse.js run on it)
Writes mutations.tsv and mutations/<id>.log next to this script.
"""
import os, subprocess, sys, shutil, time

HERE = os.path.dirname(os.path.abspath(__file__))
COURSE = sys.argv[1]
MOD = os.path.join(COURSE, 'src', 'features', 'short-answer-graphs')
JS, STEP = 'short-answer-graphs.js', 'step.js'
ENV = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')

M = [
 ('M01', 'a typed draft is not saved', JS, "ta.oninput = () => saSave(p.id, {text: ta.value});", "ta.oninput = () => {};"),
 ('M02', 'saSave changes the progress but never writes it', JS, "  all[id] = Object.assign({}, all[id] || {}, patch);\n  save();\n", "  all[id] = Object.assign({}, all[id] || {}, patch);\n"),
 ('M03', 'the ticks are not kept', JS, "saSave(p.id, {ticks: t});", "void t;"),
 ('M04', 'Check my answer does not count the prompt checked', JS, "saSave(p.id, {checked: !!ta.value.trim(), text: ta.value})", "saSave(p.id, {text: ta.value})"),
 ('M05', 'Clear leaves the ticks and checked', JS, "saSave(p.id, {text: '', ticks: [], checked: false})", "saSave(p.id, {text: ''})"),
 ('M06', 'Shuffle keeps the prompt number', JS, "SA.order = shuffle(SA.order.slice()); SA.i = 0;", "SA.order = shuffle(SA.order.slice());"),
 ('M07', 'a key prompt does not say so', JS, "key: \" · the professor's key\"", "key: \"\""),
 ('M08', 'Next is never disabled at the last prompt', JS, "${SA.i < SA_LIST.length - 1 ? '' : 'disabled'}", ""),
 ('M09', 'no cleaning of saved short answers on load', JS, "  X.progress(saClean);\n", ""),
 ('M10', 'the exam\'s own miss wording (tracings) is ignored', JS, "(g && (exOpt(examNo(g)).miss || {})[m]) || MISS[m]", "MISS[m]"),
 ('M11', 'the tracing noun is ignored', JS, "exOpt(examNo(g)).noun || 'figure'", "'figure'"),
 ('M12', 'the tally counts right answers too', JS, "if(!q || e.result === 'correct' || !isPick(q)) return;", "if(!q || !isPick(q)) return;"),
 ('M13', 'the tally is sorted least often first', JS, ".sort((a, b) => b[1] - a[1])", ".sort((a, b) => a[1] - b[1])"),
 ('M14', 'the figure\'s reading is open after a right answer too', JS, "${st.ok ? '' : ' open'}", " open"),
 ('M15', 'a wrong pick does not name the reading question skipped', JS, "if(misses.length) h +=", "if(false) h +="),
 ('M16', 'Redo wrong asks every question of the figure', JS, "if(onlyWrong){ const last = lastMap(); list = list.filter(q => lastOutcome(q, last) === 'wrong'); }", ""),
 ('M17', 'the end of a pass counts every answer ever given on the figure', JS, "e.at >= Q.graphAt && ids.has(e.qid)", "ids.has(e.qid)"),
 ('M18', 'a question counts by its first answer, not its latest', JS, "answers().forEach(e => { last[e.qid] = e.result === 'correct'; });", "answers().forEach(e => { if(!(e.qid in last)) last[e.qid] = e.result === 'correct'; });"),
 ('M19', 'an answer marked guessed counts as right', JS, "last[e.qid] = e.result === 'correct';", "last[e.qid] = e.result !== 'wrong';"),
 ('M20', 'every exam fold is open', JS, "${n === activeNo() ? 'open' : ''}", "open"),
 ('M21', 'the exam\'s group name (Tissue tracings) is not used', JS, "name === 'Other' && exOpt(n).other ? exOpt(n).other : name", "name"),
 ('M22', 'the figure keeps the core\'s alt text', JS, "if(img && q.imgAlt) img.alt = q.imgAlt;", ""),
 ('M23', 'build step: an image in two figures is not refused', STEP, "if(owner[k]) errs.push(", "if(false) errs.push("),
 ('M24', 'build step: a miss tag in no table is not refused', STEP, "if(!o.correct && o.miss !== undefined && !(em[o.miss] || miss[o.miss]))", "if(false)"),
 ('M25', 'build step: a prompt id used twice is not refused', STEP, "else if(seen.has(p.id)) errs.push(", "else if(false) errs.push("),
 ('M26', 'build step: a prompt with no key points is not refused', STEP, "if(!Array.isArray(p.points) || !p.points.length || !strList(p.points))", "if(false)"),
]

def run(cmd, cwd, log):
    with open(log, 'a') as f:
        f.write(f'$ {" ".join(cmd)}  (in {cwd})\n'); f.flush()
        r = subprocess.run(cmd, cwd=cwd, env=ENV, stdout=f, stderr=subprocess.STDOUT, timeout=1800)
        f.write(f'exit={r.returncode}\n')
    return r.returncode

os.makedirs(os.path.join(HERE, 'mutations'), exist_ok=True)
only = set(sys.argv[2:])
rows = []
for mid, what, fname, old, new in M:
    if only and mid not in only: continue
    path = os.path.join(MOD, fname)
    orig = open(path).read()
    n = orig.count(old)
    log = os.path.join(HERE, 'mutations', mid + '.log')
    open(log, 'w').write(f'{mid}: {what}\nfile {fname}; the replacement matches {n} time(s)\n')
    if n != 1:
        rows.append((mid, what, 'NOT RUN', f'the string matches {n} times')); continue
    try:
        open(path, 'w').write(orig.replace(old, new))
        t0 = time.time()
        b = run(['python3', 'build.py'], os.path.join(COURSE, 'src'), log)
        if b != 0:
            rows.append((mid, what, 'build ' + str(b), 'the build stopped')); continue
        code = run(['node', 'features/short-answer-graphs/test.js'], os.path.join(COURSE, 'src'), log)
        text = open(log).read()
        fails = [l.strip()[len('FAIL'):].strip().split('  — ')[0] for l in text.split('\n') if l.strip().startswith('FAIL ') and not l.startswith('FAIL:')]
        summary = [l for l in text.split('\n') if l.startswith(('FAIL:', 'PASS:', 'NOT RUN:'))]
        rows.append((mid, what, str(code), '; '.join(fails) or (summary[-1] if summary else '')))
        print(mid, code, round(time.time() - t0), 's', (fails or summary)[:3], flush=True)
    finally:
        open(path, 'w').write(orig)
run(['python3', 'build.py'], os.path.join(COURSE, 'src'), os.path.join(HERE, 'mutations', 'restore.log'))
with open(os.path.join(HERE, 'mutations.tsv'), 'a') as f:
    for r in rows: f.write('\t'.join(r) + '\n')
print('caught', sum(1 for r in rows if r[2] not in ('0', 'NOT RUN')), 'of', len(rows))
