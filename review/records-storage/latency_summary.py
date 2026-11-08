#!/usr/bin/env python3
"""Kit #66: one row per (sample, rate, mode) from latency_measure.js logs: the range over runs
(min-max) of the save's median main-thread work, the longest task, the p75 and slowest
click-to-paint delay, and the compression time; records refused. Usage: latency_summary.py <log>..."""
import json, sys

rows = {}
for path in sys.argv[1:]:
    for line in open(path):
        line = line.strip()
        if not line.startswith('{') or '"mode"' not in line:
            continue
        r = json.loads(line)
        k = (r['sample'], r['chars'], r['rate'], r['mode'])
        rows.setdefault(k, []).append(r)

def rng(vals):
    vals = [v for v in vals if v is not None]
    if not vals:
        return '-'
    return str(min(vals)) if min(vals) == max(vals) else f'{min(vals)}-{max(vals)}'

print('| sample | chars | rate | mode | runs | save work median ms | longest task ms | click p75 ms | slowest click ms | compress ms | compressed saves | records refused |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for k in sorted(rows, key=lambda k: (k[1], k[2], 'AFTW'.index(k[3]))):
    rs = rows[k]
    print('| ' + ' | '.join([k[0], f'{k[1]:,}', str(k[2]), k[3], str(len(rs)),
        rng([r['saveWorkMs']['median'] for r in rs]), rng([r['longTasks']['maxMs'] for r in rs]),
        rng([r['clicks']['p75Ms'] for r in rs]), rng([r['clicks']['maxMs'] for r in rs]),
        rng([r.get('compressMs') for r in rs]), rng([r['compressedSaves'] for r in rs]),
        rng([r['refused']['record'] for r in rs])]) + ' |')
