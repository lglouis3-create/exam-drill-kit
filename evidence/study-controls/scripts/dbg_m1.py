f = '/tmp/port-study-controls/dbg/src/features/study-controls/study-controls.js'; t = open(f).read()
assert t.count("if(DOWN.size || modalOpen(e.target)) return;") == 1
open(f, 'w').write(t.replace("if(DOWN.size || modalOpen(e.target)) return;", "if(DOWN.size) return;"))
f = '/tmp/port-study-controls/dbg/src/features/study-controls/test.js'; t = open(f).read()
old = "      if(undo) await ev(undo);"
assert t.count(old) == 1
open(f, 'w').write(t.replace(old, "      console.log('DBG', label, JSON.stringify(r), await ev(() => document.activeElement.tagName + '#' + document.activeElement.id));\n" + old))
print('ok')
