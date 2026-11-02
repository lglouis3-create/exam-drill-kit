# worksheets-ink ci/oncourse.js: a question's `setup` (plan-the-problem's field, which worksheets-ink
# does not read) is left out when it names an equation the course's EQUATIONS does not have, so a
# course with plan-the-problem on still builds. Exact replaces, each must match once.
import sys
p = '/tmp/port-integration/fixwork/b/features/worksheets-ink/ci/oncourse.js'
s = open(p, encoding='utf8').read()
R = [
 ("    ' SOURCES: typeof SOURCES !== \"undefined\", CHAINS: typeof CHAINS !== \"undefined\"})', vm.createContext({}));",
  "    ' SOURCES: typeof SOURCES !== \"undefined\", CHAINS: typeof CHAINS !== \"undefined\",' +\n"
  "    ' EQ: typeof EQUATIONS !== \"undefined\" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : []})', vm.createContext({}));"),
 ("const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), prof, skill}, q.dupOf ? {dupOf: pre(q.dupOf)} : {}));",
  "// a question's `setup` is plan-the-problem's: it is left out when it names an equation the course does not have\n"
  "// (plan-the-problem's build step refuses it, and worksheets-ink does not read it)\n"
  "const EQ = new Set(own.EQ || []), setupOk = st => !!st && (st.eq === 'none' || EQ.has(st.eq)) && (st.pre || []).every(id => EQ.has(id));\n"
  "let dropped = 0;\n"
  "const qs = PK.qs.map(q => { const o = Object.assign({}, q, {id: pre(q.id), prof, skill}, q.dupOf ? {dupOf: pre(q.dupOf)} : {});\n"
  "  if(o.setup !== undefined && !setupOk(o.setup)){ delete o.setup; dropped++; } return o; });"),
 ("console.log(`data: ${sources.length} documents, ${qs.length} questions, ${chains.length} problem sets, ${topics.length} topics`);",
  "console.log(`data: ${sources.length} documents, ${qs.length} questions, ${chains.length} problem sets, ${topics.length} topics; ${dropped} setup lines left out (equations the course does not have)`);"),
]
for old, new in R:
    n = s.count(old)
    if n != 1: sys.exit(f'expected 1 match, found {n}: {old[:70]}')
    s = s.replace(old, new)
open(p, 'w', encoding='utf8').write(s)
print('worksheets-ink ci patched', len(R))
