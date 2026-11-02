import re, sys
p = sys.argv[1]
t = open(p, encoding='utf-8').read()
m = re.search(r'<<<<<<< HEAD\n(.*?)=======\n(.*?)>>>>>>> origin/main\n', t, re.S)
assert m and t.count('<<<<<<<') == 1
t = t[:m.start()] + m.group(2) + m.group(1) + t[m.end():]
open(p, 'w', encoding='utf-8').write(t)
print('resolved: main lines first, then the branch entry')
