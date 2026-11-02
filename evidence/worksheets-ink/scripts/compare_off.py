#!/usr/bin/env python3
"""Compare the no-module template course built from port/worksheets-ink with the same
course built from origin/main, with build stamps masked.
   python3 compare_off.py <port course> <main course>"""
import re, sys
a, b = sys.argv[1], sys.argv[2]
def mask(p):
    t = open(p, encoding='utf-8').read()
    t = re.sub(r'20\d\d-\d\d-\d\d[T ]\d\d:\d\d(:\d\d)?(\.\d+)?Z?', 'STAMP', t)
    t = re.sub(r'-v\d{6,}', '-vSTAMP', t)
    return t
rc = 0
for f in ['index.html', 'sw.js', 'version.json', 'manifest.json']:
    x, y = mask(f'{a}/{f}'), mask(f'{b}/{f}')
    if x == y: print('same:', f)
    else:
        rc = 1; i = next(i for i in range(min(len(x), len(y))) if x[i] != y[i]) if x[:len(y)] != y[:len(x)] else min(len(x), len(y))
        print('DIFFERENT:', f, 'at', i, repr(x[i-60:i+60]), '|', repr(y[i-60:i+60]))
sys.exit(rc)
