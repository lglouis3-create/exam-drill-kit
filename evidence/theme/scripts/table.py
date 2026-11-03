import json, re
heads = dict(l.split() for l in open('/tmp/port-theme/tools/heads.txt'))
rows = ['| module | commit | needs | build | contrast sweep exit | dark device: views / low | Dark picked: views / low | views not reached (dark device) | theme test in that course |', '|---|---|---|---|---|---|---|---|---|']
for line in open('/tmp/port-theme/evidence/sweep/sweep.tsv'):
    f = line.rstrip('\n').split('\t')
    m, needs, build, contrast, rep, tt = f[0], f[1], f[2], f[3], f[4], f[5]
    r = json.loads(rep)
    d, p = r[0], r[1]
    tline = re.sub(r'^theme test (\d+): ', r'exit \1: ', tt)
    rows.append(f"| {m} | {heads[m]} | {needs or '-'} | {build.replace('build ', 'exit ')} | {contrast.replace('contrast ', '')} | {d['views']} / {d['low']} | {p['views']} / {p['low']} | {len(d['skipped'])} | {tline} |")
print('\n'.join(rows))
