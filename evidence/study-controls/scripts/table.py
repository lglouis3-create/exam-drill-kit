import sys
for line in open('/tmp/port-study-controls/evidence/commands.tsv', encoding='utf8'):
    p = line.rstrip('\n').split('\t')
    if len(p) < 4: continue
    print(f'| {p[0]} | {p[2]} | `{p[3]}` | `logs/{p[1]}.log` |')
