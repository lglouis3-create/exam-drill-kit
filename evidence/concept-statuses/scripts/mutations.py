#!/usr/bin/env python3
"""Mutation checks for concept-statuses (QUALITY B). Never touches the port branch.

    python3 -I mutations.py <course dir with the module on> <out dir>

For each mutation: copy the course to a scratch folder, apply the exact string
replacements to src/features/concept-statuses/concept-statuses.js (each old string
must occur exactly once, or the mutation is reported as not applied), build, run the
module test, and record its exit code and the checks that FAILed. Writes
<out>/mutations.md (the table) and <out>/mut-<id>.log (each run).
"""
import os, re, shutil, subprocess, sys

MUT = [
 ('M1', 'mastery needs 2 sessions -> 1', [("new Set(sol.map(a => a.sid)).size >= 2 && list.slice(-3)", "new Set(sol.map(a => a.sid)).size >= 1 && list.slice(-3)")]),
 ('M2', 'no miss in the last 3 -> in the last 1', [("list.slice(-3).every(solid); };", "list.slice(-1).every(solid); };")]),
 ('M3', '"Not sure" is solid again (PK\'s solid)', [("const solid = a => solidEntry(a);", "const solid = a => a.result === 'correct';")]),
 ('M4', 'struggling under 60% -> under 40%', [("accR < 0.6", "accR < 0.4")]),
 ('M5', 'a session ends after 30 min -> after 50 h', [("a.at - prev >= SESSION_GAP", "a.at - prev >= SESSION_GAP * 100")]),
 ('M6', 'a solid answer after mastery no longer moves the check up a step', [("box = Math.min(top, box + 1); due(a);", "box = Math.min(top, box); due(a);")]),
 ('M7', 'the day steps ignore the pace in Settings', [("d: cram() ? PACES.semester.steps : P.steps", "d: PACES.semester.steps")]),
 ('M8', 'due without the scheduler\'s own record being due', [("(!DB.concepts[c] || _isDue(DB.concepts[c]))", "true")]),
 ('M9', '"Ask everything" makes every mastered concept due (isDue)', [("rec.s === 'mastered' && _isDue(rec)", "rec.s === 'mastered' && isDue(rec)")]),
 ('M10', 'a select-all answer counts its correct options as wrong picks', [(".filter(i => q.options[i] && !q.options[i].correct)", ".filter(i => q.options[i])")]),
 ('M11', 'repeated wrong options: chosen more than 3 times', [("recurring: errs.filter(x => x.n > 1)", "recurring: errs.filter(x => x.n > 3)")]),
 ('M12', 'unfamiliar cards before struggling ones', [("weak: strug.concat(unfam, impr)", "weak: unfam.concat(strug, impr)")]),
 ('M13', '80 cards shown, none folded', [("g.weak.slice(0, 8), rest = g.weak.slice(8)", "g.weak.slice(0, 80), rest = g.weak.slice(80)")]),
 ('M14', 'kind of miss read from PK\'s missKind', [("if(a.miss && MISS_KINDS[a.miss])", "if(a.missKind && MISS_KINDS[a.missKind])")]),
 ('M15', 'section at the end of Weak spots', [("if(at) at.parentNode.insertBefore(box, at); else pane.appendChild(box);", "pane.appendChild(box);")]),
 ('M16', 'drawing creates scheduler records (st)', [("(!DB.concepts[c] || _isDue(DB.concepts[c]))", "_isDue(st(c))")]),
 ('M17', 'option text and why escaped as stored (the code before this fix)', [("${richText(e.t)}${", "${esc(e.t)}${"), ("richText(clip(plainMath(e.why), 400))", "esc(clip(e.why, 400))")]),
 ('M18', 'the words option ignored', [("Object.prototype.hasOwnProperty.call(WORDS, t.toLowerCase()) ? WORDS[t.toLowerCase()] : t", "t")]),
 ('M19', 'the evidence line leaves out "Not sure"', [("if(st.shaky) p.push(", "if(false) p.push(")]),
 ('M20', 'a matching answer counts its right pairs as wrong', [("r !== k && q.pairs[k]", "q.pairs[k]")]),
 ('M21', 'answers to questions no longer in the bank kept', [("const q = byId(a.qid); if(!q) continue;", "const q = byId(a.qid) || {id: a.qid, concept: a.concept, options: []};")]),
 ('M22', 'Check asks 3 questions', [("drillList(conceptPick(c, 1), 'Spaced review: '", "drillList(conceptPick(c, 3), 'Spaced review: '")]),
 ('M23', 'drawing trims the answer log', [("const G = conceptLog(), now = Date.now();", "DB.answers.splice(0, Math.max(0, DB.answers.length - 3)); const G = conceptLog(), now = Date.now();")]),
]

def main():
    course, out = sys.argv[1], sys.argv[2]
    only = sys.argv[3:] or None
    os.makedirs(out, exist_ok=True)
    env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
    rows = []
    for mid, what, reps in MUT:
        if only and mid not in only: continue
        work = os.path.join(out, 'work-' + mid)
        shutil.rmtree(work, ignore_errors=True)
        shutil.copytree(course, work, symlinks=True)
        f = os.path.join(work, 'src', 'features', 'concept-statuses', 'concept-statuses.js')
        t = open(f, encoding='utf-8').read()
        bad = [o for o, n in reps if t.count(o) != 1]
        if bad:
            rows.append((mid, what, 'NOT APPLIED: ' + '; '.join(f'"{o}" found {t.count(o)} times' for o in bad), '-'))
            shutil.rmtree(work, ignore_errors=True); continue
        for o, n in reps: t = t.replace(o, n)
        open(f, 'w', encoding='utf-8').write(t)
        src = os.path.join(work, 'src')
        b = subprocess.run(['python3', 'build.py'], cwd=src, capture_output=True, text=True)
        r = subprocess.run(['node', os.environ.get('CST_TEST', 'features/concept-statuses/test.js')], cwd=src, capture_output=True, text=True, env=env, timeout=900)
        log = (r.stdout or '') + (r.stderr or '')
        open(os.path.join(out, f'mut-{mid}.log'), 'w', encoding='utf-8').write(f'build exit {b.returncode}\n' + log + f'\nexit {r.returncode}\n')
        fails = [m.group(1) for m in re.finditer(r'^  FAIL  (.*?)(?:  — .*)?$', log, re.M)]
        crash = re.search(r'^FAIL: .*crashed.*$', log, re.M)
        nr = re.search(r'^NOT RUN: .*$', log, re.M)
        caught = '; '.join(fails) or (crash.group(0)[:200] if crash else '') or (nr.group(0) if nr else 'NOT CAUGHT')
        rows.append((mid, what, caught, str(r.returncode)))
        print(mid, r.returncode, caught[:160], flush=True)
        shutil.rmtree(work, ignore_errors=True)
    with open(os.path.join(out, 'mutations.md'), 'a', encoding='utf-8') as fh:
        fh.write('| Mutation | What it breaks | Check that FAILed | Exit |\n|---|---|---|---|\n')
        for mid, what, caught, rc in rows:
            fh.write(f'| {mid} | {what} | {caught.replace("|", "/")} | {rc} |\n')

main()
