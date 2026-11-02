#!/usr/bin/env python3
"""Puts the mutation table (from mutations.tsv) and the behaviour map into INDEX.md."""
import os
E = '/tmp/port-short-answer-graphs/evidence'
rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(E, 'mutations.tsv')) if l.strip()]
t = ['| Mutation | Test exit | Checks that failed (agent-run, on 800b229) |', '|---|---|---|']
for mid, what, code, fails in rows:
    r = 'not caught (equivalent: see above)' if code == '0' else fails.replace('|', '/')
    t.append(f'| {mid} {what} | {code} | {r} |')
open(os.path.join(E, 'mutation-table.md'), 'w').write('\n'.join(t) + '\n')
p = os.path.join(E, 'INDEX.md'); s = open(p).read()
a = 'See the table in the PR text (`/tmp/port-tools/pr-20-v2.md`, "Mutation checks"), copied from `mutations.tsv`.'
assert s.count(a) == 1
s = s.replace(a, '\n'.join(t)) + '\n' + open(os.path.join(E, 'behaviour-map.md')).read()
open(p, 'w').write(s)
print(len(rows), 'mutations')
