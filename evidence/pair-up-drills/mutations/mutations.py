"""pair-up-drills mutation checks (QUALITY B).

    python3 mutations.py <course-repo> <work-dir> <out-dir>

<course-repo> is a scratch course with the module on (built by mkcourse.sh and
features/pair-up-drills/ci/oncourse.js, committed). For each mutation it copies the
course to <work-dir>/m, applies one exact string replacement (it must match exactly
once) in src/features/pair-up-drills/<file>, runs build.py and the module test, and
records which checks FAIL and the exit code. M0 puts back the module file as it was at
a0ff3d4 (before this hardening). Nothing is written to the kit's port branch.
"""
import os, shutil, subprocess, sys, json, re, time

COURSE, WORK, OUT = sys.argv[1:4]
HERE = os.path.dirname(os.path.abspath(__file__))
JS, STEP = 'pair-up-drills.js', 'step.js'
MUT = [
 ('M1', JS, 'one chip per box: a second chip no longer sends the first back',
  "if(!setOf(PR.set).bins){ for(const k of Object.keys(PR.placed)) if(PR.placed[k] === target) delete PR.placed[k]; } ", ""),
 ('M2', JS, 'Check counts any placed chip as right',
  "res[p[0]] = PR.placed[p[0]] === p[1];", "res[p[0]] = !!PR.placed[p[0]];"),
 ('M3', JS, 'Retry the wrong ones returns every chip',
  "if(!PR.result[p[0]]) delete PR.placed[p[0]];", "delete PR.placed[p[0]];"),
 ('M4', JS, 'wholeUpTo ignored: a small set is cut to pairRound',
  "all.length <= OPT.wholeUpTo ? all.length : OPT.pairRound", "OPT.pairRound"),
 ('M5', JS, 'binRound ignored: a set with shared boxes is served whole',
  "all.length > OPT.binRound ? shuffle(all).slice(0, OPT.binRound) : shuffle(all)", "shuffle(all)"),
 ('M6', JS, 'the row\'s alts (the flipped twin) are not offered',
  "if(m.alts) [].concat(it.row[m.alts] || []).forEach(add);", ""),
 ('M7', JS, 'rows with another right answer (same `distinct`) are not left out',
  "if(m.distinct) pool = pool.filter(x => x.row[m.distinct] !== it.row[m.distinct]);", ""),
 ('M8', JS, '`near` ignored: answers are not taken from the same section first',
  "const near = m.near ? shuffle(pool.filter(x => x.row[m.near] === it.row[m.near])) : [];", "const near = [];"),
 ('M9', JS, 'the saved misses do not lead the next round',
  "const first = shuffle(all.filter(x => miss.has(x.id))), rest = ids ? [] : shuffle(all.filter(x => !miss.has(x.id)));",
  "const first = ids ? shuffle(all.filter(x => miss.has(x.id))) : [], rest = ids ? [] : shuffle(all);"),
 ('M10', JS, 'a redo round can change the best score',
  "if(S.round === 1 && (!b || frac(b) < S.right / S.queue.length))", "if((!b || frac(b) < S.right / S.queue.length))"),
 ('M11', JS, 'the misses are not kept at the end of a round',
  "P.miss[k] = [...new Set(S.redo.map(x => x.id))];", "P.miss[k] = [];"),
 ('M12', JS, 'Check keeps the new best score but does not save it',
  "PD().best[k] = `${right}/${PR.round.length}`; save(); }", "PD().best[k] = `${right}/${PR.round.length}`; }"),
 ('M13', JS, 'no 350 ms guard on an answer tap',
  "if(S.result || Date.now() - (S.t0 || 0) < GUARD) return;", "if(S.result) return;"),
 ('M14', JS, 'no 350 ms guard on Skip',
  "    if(Date.now() - S.t0 < GUARD) return;   // the second tap of a double tap on Next lands here\n", ""),
 ('M15', JS, 'a saved miss list in another shape is used as it is',
  "return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];", "return v || [];"),
 ('M16', JS, 'Enter does not go on to the next row',
  "const b = pane(tabOf(t)).querySelector('[data-ptnext]'); if(b) b.click();", "const b = pane(tabOf(t)).querySelector('[data-ptnext]');"),
 ('M17', JS, 'Hide again does not cover the shown cells',
  "if(hd) hd.onclick = () => { S.shown = {}; vTable(t); };", "if(hd) hd.onclick = () => { vTable(t); };"),
 ('M18', JS, 'a chip dropped on a box is not placed',
  "if(t) pairPlace(d.name, t.dataset.pt); else if(tray)", "if(false) pairPlace(d.name, t.dataset.pt); else if(tray)"),
 ('M19', JS, 'the wrong chips are not listed first',
  "rows = PR.round.slice().sort((a, b) => (PR.result[a[0]] ? 1 : 0) - (PR.result[b[0]] ? 1 : 0));", "rows = PR.round.slice();"),
 ('M20', STEP, 'the build step lets an HTML tag in a cell through',
  "else if([].concat(v).some(x => TAG.test(x)))", "else if(false)"),
 ('M21', STEP, 'the build step lets a box twice in a one-chip-per-box set through',
  "if(!s.bins && boxes.has(p[1]))", "if(false)"),
]
env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
rows = []
def run(mid, fname, about, apply):
    m = os.path.join(WORK, 'm')
    shutil.rmtree(m, ignore_errors=True)
    shutil.copytree(COURSE, m, symlinks=True)
    src = os.path.join(m, 'src')
    target = os.path.join(src, 'features', 'pair-up-drills', fname)
    apply(target)
    t0 = time.time()
    b = subprocess.run(['python3', 'build.py'], cwd=src, capture_output=True, text=True, timeout=600)
    log = os.path.join(OUT, f'{mid}.log')
    if b.returncode != 0:
        out = b.stdout + b.stderr; code = 'build ' + str(b.returncode); fails = ['build.py: ' + out.strip().split('\n')[-1]]
    else:
        r = subprocess.run(['node', 'features/pair-up-drills/test.js'], cwd=src, capture_output=True, text=True, timeout=900, env=env)
        out = r.stdout + r.stderr; code = r.returncode
        fails = [l.strip()[6:].strip() for l in out.split('\n') if l.startswith('  FAIL  ')]
        if not fails: fails = [l for l in out.split('\n') if l.startswith('FAIL') or 'NOT RUN' in l][:2]
    open(log, 'w').write(out)
    rows.append({'id': mid, 'file': fname, 'mutation': about, 'exit': code, 'failed': fails, 'caught': code != 0, 'secs': round(time.time() - t0)})
    print(mid, code, len(fails), fails[:2], flush=True)

def repl(old, new):
    def f(target):
        s = open(target).read()
        n = s.count(old)
        if n != 1: raise SystemExit(f'mutation string found {n} times in {target}: {old[:60]}')
        open(target, 'w').write(s.replace(old, new))
    return f

only = sys.argv[4:]
if not only or 'M0' in only:
    run('M0', JS, 'the module as it was at a0ff3d4 (before this hardening)', lambda t: shutil.copyfile(os.path.join(HERE, 'pair-up-drills.a0ff3d4.js'), t))
for mid, f, about, old, new in MUT:
    if only and mid not in only: continue
    run(mid, f, about, repl(old, new))
json.dump(rows, open(os.path.join(OUT, 'results.json'), 'w'), indent=1, ensure_ascii=False)
with open(os.path.join(OUT, 'table.md'), 'w') as t:
    t.write('| Mutation | File | What it breaks | Exit code | Checks that FAIL |\n|---|---|---|---|---|\n')
    for r in rows:
        t.write(f"| {r['id']} | {r['file']} | {r['mutation']} | {r['exit']} | {'; '.join(r['failed']) if r['caught'] else 'NOT CAUGHT'} |\n")
print('caught', sum(r['caught'] for r in rows), 'of', len(rows))
