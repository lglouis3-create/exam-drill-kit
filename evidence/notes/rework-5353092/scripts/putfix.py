# put a FIX block (extract2.js output) into features/notes/current/test.js in place of the old one
import sys
p, fx = sys.argv[1], sys.argv[2]
s = open(p).read(); new = open(fx).read()
a = s.index('const FIX = {\n'); b = s.index('  ]};\n', a) + len('  ]};\n')
open(p, 'w').write(s[:a] + new + s[b:])
print('FIX replaced:', new.count('"id"'), 'ids')
