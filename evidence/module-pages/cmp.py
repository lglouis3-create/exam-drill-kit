import re, sys
A, B = '/tmp/port-module-pages/off', '/tmp/port-module-pages/off-main'
mask = lambda s: re.sub(r'20\d\d-\d\d-\d\dT\d\d:\d\d:\d\dZ', 'STAMP', re.sub(r'20\d\d-\d\d-\d\d \d\d:\d\d( UTC)?', 'STAMP', s))
for f in ['index.html', 'sw.js', 'version.json', 'manifest.json']:
    a = mask(open(f'{A}/{f}', encoding='utf-8').read()); b = mask(open(f'{B}/{f}', encoding='utf-8').read())
    print(f, 'same' if a == b else 'DIFFERENT', len(a), len(b))
