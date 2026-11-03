"""DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-import-diag; never merged).
Adds two report lines to a course copy of import_test.js, after each answer() of the second tab
in "Another tab of the same browser": what this tab and the writing tab read from the progress key
at that moment (beside the read the check uses), and the milliseconds until this tab reads the writing tab's value. The checks
themselves are not changed. Usage: python3 -I instrument.py <import_test.js>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
probe = ("{ const c = %s, w = await stored(tab2, di.data), r = await stored(d.page, di.data), t0 = Date.now();"
         " if(r !== w) await d.page.waitForFunction(([k, v]) => localStorage.getItem(k) === v, [di.data, w], {timeout: 20000, polling: 1}).catch(() => {});"
         " console.log(`  DIAG %s: the check's read ${c === null ? 'null' : c.length + ' chars'} (equal to the writer's: ${c === w}); this tab, read again,  ${r === null ? 'null' : r.length + ' chars'}, the writing tab ${w === null ? 'null' : w.length + ' chars'}; equal: ${r === w}; this tab read the writer's value after ${r === w ? 0 : Date.now() - t0} ms`); }\n")
for a, var, label in [("    await answer(tab2, 3, 0);\n    const theirs = await stored(d.page, di.data);\n", "theirs", "after the first save"),
                      ("    await answer(tab2, 1, 3);\n    const theirs2 = await stored(d.page, di.data);\n", "theirs2", "after the second save")]:
    assert s.count(a) == 1, a
    first, second = a.split('\n')[0] + '\n', '\n'.join(a.split('\n')[1:])
    # the probe goes after the read the check uses, so the check reads exactly as before
    s = s.replace(a, first + second + '    ' + probe % (var, label))
open(p, 'w', encoding='utf-8').write(s)
print('instrumented', p)
