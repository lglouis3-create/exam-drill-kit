f = '/tmp/port-study-controls/dbg/src/features/study-controls/test.js'; t = open(f).read()
old = "await ev(() => document.activeElement.tagName + '#' + document.activeElement.id));"
assert t.count(old) == 1
new = "await ev(() => [document.activeElement.tagName + '#' + document.activeElement.id, Q.current && Q.current.id, document.querySelectorAll('#v-quiz .qbody button.opt[data-o]').length, !!document.querySelector('#v-quiz .scall'), DB.layout, FX.errors.length, FX.on('study-controls')]));"
open(f, 'w').write(t.replace(old, new)); print('ok')
