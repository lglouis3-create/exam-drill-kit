#!/usr/bin/env python3
"""Mutation checks for terms-variables (QUALITY B). Each mutation breaks the module on purpose
in a scratch copy of a built course, by one exact string replacement that must match exactly
once, rebuilds that copy and runs the module's test. Never applied to the port branch.

    python3 mutations.py <course dir (module on)> <course dir (module + equation-drill on)> <out.tsv> [ids...]
"""
import os, re, shutil, subprocess, sys

MUT = [
  ('M1', 'termMask blanks nothing: the term is printed in its own situation and definition',
   "for(const w of words) out = out.replace(new RegExp(reEsc(w), 'gi'), '____');", "for(const w of words) out = out;", 'on'),
  ('M2', 'term wrong options: the look-alikes (confuse) are not taken first',
   "(t.confuse || []).forEach(id => take(TERM_BY[id]));", "", 'on'),
  ('M3', 'variable wrong options: the same family is not taken first',
   "for(const x of shuffle(fam).concat(shuffle(rest))){", "for(const x of shuffle(fam.concat(rest))){", 'on'),
  ('M4', 'twins may be each other\'s wrong option',
   "!twinsOf(k).includes(x) && ", "", 'on'),
  ('M5', 'a question sentence that names its own answer is asked',
   "|| namesSym(k, a)) continue;", ") continue;", 'on'),
  ('M6', 'the question sentence is the first question of the stem, not the last',
   "if(q.length) return q[q.length - 1];", "if(q.length) return q[0];", 'on'),
  ('M7', 'a flashcard mark is recorded as right whatever button is pressed',
   "if(q) record(q, b.dataset.fc, null, 0);", "if(q) record(q, 'correct', null, 0);", 'on'),
  ('M8', 'a variable question is put into the bank',
   "const VAR_QS = varQuestions();", "const VAR_QS = varQuestions(); QUESTIONS.push(...VAR_QS.slice(0, 1));", 'on'),
  ('M9', 'the same sentence for the same symbol is asked twice (no de-duplication)',
   "if(seen.has(key)) continue; seen.add(key);", "seen.add(key);", 'on'),
  ('M10', 'the Equations tab does not offer the variables quiz',
   "if(view !== 'eq' || !VAR_QS.length) return;", "return;", 'eq'),
  ('M11', 'Show the term does not show the term',
   "if(sh) sh.onclick = () => { TV.fc.shown = true; renderTerms(pane); };", "if(sh) sh.onclick = () => { renderTerms(pane); };", 'on'),
  ('M12', 'a term group\'s Start drills every term, not that group',
   "TERM_QS.filter(q => (g === 'all' || q.sub === g) &&", "TERM_QS.filter(q => (true) &&", 'on'),
  ('M13', 'a symbol family\'s Start drills every symbol, not that family',
   "VAR_QS.filter(q => g === 'all' || q.sub === 'Variables: ' + g);", "VAR_QS.filter(q => true);", 'on'),
  ('M14', 'the meaning question of a term has no correct option',
   "options: [{t: gistOf(t), correct: true,", "options: [{t: gistOf(t), correct: false,", 'on'),
  ('M15', 'the variable questions are recorded under the wrong concept',
   "concept: 'var:' + k,", "concept: 'term:' + k,", 'on'),
]

def run(cmd, cwd, log):
    with open(log, 'w') as f:
        r = subprocess.run(cmd, cwd=cwd, stdout=f, stderr=subprocess.STDOUT, timeout=900)
    return r.returncode

def main():
    on, eq, out = sys.argv[1:4]
    want = set(sys.argv[4:])
    work = '/tmp/port-terms-variables/mut'
    logs = '/tmp/port-terms-variables/evidence/mutations'
    os.makedirs(work, exist_ok=True); os.makedirs(logs, exist_ok=True)
    env_rows = []
    for mid, what, old, new, course in MUT:
        if want and mid not in want: continue
        base = on if course == 'on' else eq
        dst = os.path.join(work, mid)
        shutil.rmtree(dst, ignore_errors=True)
        shutil.copytree(base, dst, symlinks=True)
        js = os.path.join(dst, 'src', 'features', 'terms-variables', 'terms-variables.js')
        text = open(js, encoding='utf8').read()
        n = text.count(old)
        if n != 1:
            env_rows.append((mid, what, f'NOT APPLIED: the string matches {n} times', '', course)); continue
        open(js, 'w', encoding='utf8').write(text.replace(old, new))
        b = run(['python3', 'build.py'], os.path.join(dst, 'src'), os.path.join(logs, f'{mid}-build.log'))
        if b != 0:
            env_rows.append((mid, what, 'build failed', str(b), course)); continue
        log = os.path.join(logs, f'{mid}-test.log')
        code = run(['node', 'features/terms-variables/test.js'], os.path.join(dst, 'src'), log)
        fails = [l.strip()[6:].split('  —')[0] for l in open(log, encoding='utf8') if l.lstrip().startswith('FAIL ') or l.startswith('  FAIL')]
        crash = [l.strip() for l in open(log, encoding='utf8') if 'crashed' in l or l.startswith('NOT RUN')]
        caught = '; '.join(fails) if fails else ('; '.join(crash) if crash else 'NOT CAUGHT')
        env_rows.append((mid, what, caught, str(code), course))
        shutil.rmtree(dst, ignore_errors=True)
        print(mid, code, caught[:300], flush=True)
    with open(out, 'a') as f:
        for r in env_rows: f.write('\t'.join(r) + '\n')

main()
