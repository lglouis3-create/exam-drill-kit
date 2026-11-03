#!/usr/bin/env python3
"""Write fixture.json (pk_fixture.js) into test.js: the PK, EXPECT and PK_TEXT lines.
   python3 put_fixture.py <test.js> <fixture.json>"""
import json, subprocess, sys
p, fx = sys.argv[1], sys.argv[2]
F = json.load(open(fx))
lines = open(p).read().split('\n')
def put(prefix, text):
    n = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(n) == 1, prefix
    lines[n[0]] = text
put('const PK = ', 'const PK = ' + json.dumps(F['PK'], ensure_ascii=False, separators=(',', ':')) + ';')
put('const EXPECT = ', 'const EXPECT = ' + json.dumps(F['EXPECT'], ensure_ascii=False, separators=(',', ':')) + ';')
open(p, 'w').write('\n'.join(lines))
t = subprocess.run(['node', '/tmp/port-rework/worksheets-ink/scripts/pk_expect.js', p], capture_output=True, text=True, check=True).stdout.strip()
put('const PK_TEXT = ', t)
open(p, 'w').write('\n'.join(lines))
print('PK, EXPECT and PK_TEXT written:', len(F['PK']['sources']), 'documents,', len(F['PK']['qs']), 'questions')
