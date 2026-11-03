"""DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-pendingsave-diag; never merged).
Adds one report line to core/storage_test.js before the check "an answer followed at once by
closing the tab is kept": what the new tab holds at load (DB and storage), and the milliseconds
until its storage holds the answer (-1: not within 5 s). The checks are not changed.
Usage: python3 -I instrument_storage.py <storage_test.js>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
a = "    check(await p2.evaluate(() => DB.answers.length) === 2, 'an answer followed at once by closing the tab is kept'"
probe = ("    { const k = await p2.evaluate(() => keyFor(PROFILE)), n = k => (JSON.parse(localStorage.getItem(k) || '{}').answers || []).length;"
         " const at = await p2.evaluate(([k, f]) => ({db: DB.answers.length, stored: (0, eval)(f)(k)}), [k, n.toString()]); const t0 = Date.now();"
         " const ms = at.stored >= 2 ? 0 : await p2.waitForFunction(([k, f]) => (0, eval)(f)(k) >= 2, [k, n.toString()], {timeout: 5000, polling: 10}).then(() => Date.now() - t0, () => -1);"
         " console.log(`  DIAG close: the new tab at load ${JSON.stringify(at)}; its storage held 2 answers after ${ms} ms (-1: not within 5 s)`); }\n")
assert s.count(a) == 1, 'anchor not found'
open(p, 'w', encoding='utf-8').write(s.replace(a, probe + a))
print('instrumented', p)
