#!/usr/bin/env python3
"""Mutation checks for the stopwatch module (QUALITY.md B).

    python3 mutations.py COURSE_SRC LOG_DIR

COURSE_SRC is a scratch course's src/ with features/stopwatch/ switched on. For each
mutation: put back the original stopwatch.js, apply one exact string replace (it must
match exactly once, or the script stops), rebuild, run the module test, and record its
exit code and the checks that FAILed. The original is restored at the end. Nothing here
touches the port branch.
"""
import os, re, subprocess, sys

SRC, LOGS = sys.argv[1], sys.argv[2]
MOD = os.path.join(SRC, 'features', 'stopwatch', 'stopwatch.js')
ORIG = open(MOD, encoding='utf8').read()

MUTATIONS = [
    ('M1', 'no clock on a quiz calculation',
     "if(!Q.revealed){ if(Q.startedAt) placeIn(head, timerHTML(Q.startedAt)); }",
     "if(!Q.revealed){ }"),
    ('M2', 'the clock does not count (the tick shows 0:00)',
     "const ms = Date.now() - +el.dataset.start, t =",
     "const ms = 0, t ="),
    ('M3', 'the pace is never passed (over at ten times the pace)',
     "const overTxt = ms => PACE && ms > PACE ?",
     "const overTxt = ms => PACE && ms > PACE * 10 ?"),
    ('M4', 'the time taken shown is not the recorded ms (one minute added)',
     "placeIn(head, timerHTML(null, lastTook.ms));",
     "placeIn(head, timerHTML(null, lastTook.ms + 60000));"),
    ('M5', 'an answer within the pace is not shown green',
     "(took > PACE ? ' over' : ' under')",
     "(took > PACE ? ' over' : '')"),
    ('M6', 'multiple-choice questions get a clock too',
     "const isCalc = q => !!q && q.type === 'numeric';",
     "const isCalc = q => !!q;"),
    ('M7', 'time on a paper question is replaced, not added up (Back loses the earlier time)',
     "if(T.idx != null) T.spent[T.idx] += now - T.mark;",
     "if(T.idx != null) T.spent[T.idx] = now - T.mark;"),
    ('M8', 'paper answers do not keep their time',
     "if(i >= 0 && T.spent[i] > 0 && entry.ms == null) entry.ms = Math.round(T.spent[i]);",
     ""),
    ('M9', 'with paceSeconds 0 every time counts as over the pace',
     "const overTxt = ms => PACE && ms > PACE ?",
     "const overTxt = ms => ms > PACE ?"),
    ('M10', 'no clock on a paper calculation',
     "placeIn(pane.querySelector('.qcard .qhead'), timerHTML(now - spent));",
     ""),
]

env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
rows = []
try:
    for mid, what, old, new in MUTATIONS:
        n = ORIG.count(old)
        if n != 1:
            sys.exit(f'{mid}: the text to replace occurs {n} times, not once: {old!r}')
        open(MOD, 'w', encoding='utf8').write(ORIG.replace(old, new))
        b = subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True, text=True)
        r = subprocess.run(['node', 'features/stopwatch/test.js'], cwd=SRC, capture_output=True, text=True, env=env, timeout=900)
        out = b.stdout + b.stderr + '\n' + r.stdout + r.stderr
        open(os.path.join(LOGS, f'mutation_{mid}.log'), 'w', encoding='utf8').write(out)
        failed = re.findall(r'^  FAIL  (.*?)(?:  —|$)', r.stdout, re.M)
        rows.append((mid, what, r.returncode, failed))
        print(f'{mid}\texit {r.returncode}\t{len(failed)} failed\t{"; ".join(failed)}', flush=True)
finally:
    open(MOD, 'w', encoding='utf8').write(ORIG)
    subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True, text=True)

with open(os.path.join(LOGS, 'mutations_table.md'), 'w', encoding='utf8') as f:
    f.write('| Mutation | What it breaks | Exit code | Checks that FAILed |\n|---|---|---|---|\n')
    for mid, what, code, failed in rows:
        f.write(f'| {mid} | {what} | {code} | {"; ".join(failed) or "NONE (not caught)"} |\n')
print('caught', sum(1 for r in rows if r[2] != 0 and r[3]), 'of', len(rows))
