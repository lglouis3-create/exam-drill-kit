#!/usr/bin/env python3
"""F6: make features/module-pages/current/test.js independent of the course's own
module content. Each replacement is exact and must match the stated number of times."""
import sys
P = sys.argv[1]
s = open(P, encoding='utf-8').read()
R = [
# the header comment
(""" * ac2eb73; ids prefixed mpt-, the professor set to the course's own and
 * the professor's name written "the professor"), in Chromium""",
 """ * ac2eb73; ids prefixed mpt-, the professor set to the course's own and
 * the professor's name written "the professor"; its two topics' ids prefixed mpt-
 * and its module number set to one the course does not use, so the course's own
 * modules, topics and documents never mix with it), in Chromium""", 1),
# the fixture: topics prefixed, module moved
("""const pre = id => 'mpt-' + id;
""",
 """const pre = id => 'mpt-' + id;
/* The fixture goes on a module number and topics of its own, so what the course
   itself holds (its own Module 2, its topics bolus1 and bolus2, its documents and
   problem sets) never adds to what the checks count. FM is set once the course is read. */
let FM = 2, FM_BAD = 99;
const preSub = s => pre(s);   // 'bolus1/model' -> 'mpt-bolus1/model'; 'bolus2/calc:skill' likewise
""", 1),
("""const HOMEWORK2 = {id: 'hw-2', title: 'Homework 2', type: 'homework', module: 2, modules: [2],""",
 """const HOMEWORK2 = {id: 'hw-2', title: 'Homework 2', type: 'homework', module: 2, modules: [2],   // module and modules are set to FM below""", 1),
("""  const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), prof: own.prof}, q.dupOf ? {dupOf: pre(q.dupOf)} : {}));
  const objectives = PK.objectives.map(o => Object.assign({}, o));
  const types = PK.types.map(t => Object.assign({}, t, {id: pre(t.id), example: pre(t.example)}));
  const chains = PK.chains.map(c => Object.assign({}, c, {id: pre(c.id), parts: c.parts.map(pre)}));""",
 """  const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), prof: own.prof, module: FM, topic: pre(q.topic)}, q.dupOf ? {dupOf: pre(q.dupOf)} : {}));
  const objectives = PK.objectives.map(o => Object.assign({}, o, {module: FM, subs: o.subs.map(preSub)}));
  const types = PK.types.map(t => Object.assign({}, t, {module: FM, id: pre(t.id), example: pre(t.example), match: t.match.map(preSub)}));
  const chains = PK.chains.map(c => Object.assign({}, c, {module: FM, id: pre(c.id), parts: c.parts.map(pre)}));""", 1),
("""  if(opts.sources) data += decl('SOURCES', [Object.assign({}, HOMEWORK2, {id: pre(HOMEWORK2.id), chains: HOMEWORK2.chains.map(pre),""",
 """  if(opts.sources) data += decl('SOURCES', [Object.assign({}, HOMEWORK2, {id: pre(HOMEWORK2.id), module: FM, modules: [FM], chains: HOMEWORK2.chains.map(pre),""", 1),
("""  const topics = PK.topics.filter(t => !own.topics.includes(t.id));""",
 """  const topics = PK.topics.map(t => Object.assign({}, t, {id: pre(t.id)}));""", 1),
("""  const mp = opts.modules !== undefined ? {modules: opts.modules} : {modules: own.modules.map(m => [m, typeof m === 'string' ? m : 'Module ' + m]).concat([[2, PK.module.name]])};""",
 """  const mp = opts.modules !== undefined ? {modules: opts.modules} : {modules: own.modules.map(m => [m, typeof m === 'string' ? m : 'Module ' + m]).concat([[FM, PK.module.name]])};""", 1),
# the free module numbers, from the course's lectures and questions
("""               modules: [...new Set(X.COURSE.lectures.map(l => l.module).filter(m => m !== undefined && m !== null))]};""",
 """               modules: [...new Set(X.COURSE.lectures.map(l => l.module).filter(m => m !== undefined && m !== null))]};
  { const used = new Set(own.modules.concat(X.QUESTIONS.map(M.modOf)).map(String));
    const free = from => { let n = from; while(used.has(String(n))) n++; return n; };
    FM = free(92); used.add(String(FM)); FM_BAD = free(FM + 1);
    if(X.TOPICS.some(t => /^mpt-/.test(t.id))) L.notRun(NAME, 'the course has topics whose ids start mpt-, the prefix this test gives its own');
    console.log(`  the test's Basic-Pharmacokinetics Module 2 goes on module ${FM}; module ${FM_BAD} stands for a module the course does not have`); }""", 1),
# refusals
("""{mutate: d => { d.objectives[0].subs = ['bolus1/nowhere']; }}, /names the subtopic "bolus1\\/nowhere", which is not a topic\\/sub in TOPICS/],""",
 """{mutate: d => { d.objectives[0].subs = ['mpt-bolus1/nowhere']; }}, /names the subtopic "mpt-bolus1\\/nowhere", which is not a topic\\/sub in TOPICS/],""", 1),
("""    ['an objective of a module the course does not have', {mutate: d => { d.objectives[1].module = 99; }}, /names module 99, which is not one of the course's modules/],""",
 """    ['an objective of a module the course does not have', {mutate: d => { d.objectives[1].module = FM_BAD; }}, new RegExp(`names module ${FM_BAD}, which is not one of the course's modules`)],""", 1),
("""courseLine(own, [], {modules: [[2]]})""", """courseLine(own, [], {modules: [[FM]]})""", 1),
# the module in the page
("""mods().findIndex(r => r[0] === 2)""", """mods().findIndex(r => r[0] === FM)""", 4),
("""    const pk = await ev(() => FX.api""", """    const pk = await ev(fm => FX.api""", 1),
("""    const pk = await ev(fm => FX.api('module-pages').mods().findIndex(r => r[0] === FM));""",
 """    const pk = await ev(fm => FX.api('module-pages').mods().findIndex(r => r[0] === fm), FM);""", 1),
("""        const i = await e(() => FX.api('module-pages').mods().findIndex(r => r[0] === FM));""",
 """        const i = await e(fm => FX.api('module-pages').mods().findIndex(r => r[0] === fm), FM);""", 1),
("""        await o.page.evaluate(() => FX.api('module-pages').open(FX.api('module-pages').mods().findIndex(r => r[0] === FM), 'calcs'));""",
 """        await o.page.evaluate(fm => FX.api('module-pages').open(FX.api('module-pages').mods().findIndex(r => r[0] === fm), 'calcs'), FM);""", 1),
("""        const pk3 = await e3(() => FX.api('module-pages').mods().findIndex(r => r[0] === FM));""",
 """        const pk3 = await e3(fm => FX.api('module-pages').mods().findIndex(r => r[0] === fm), FM);""", 1),
("""    const od = await ev(() => ({view: VIEW, label: Q.label, ok: Q.pool.every(q => FX.api('module-pages').kindOf(q) === 'concept' && FX.api('module-pages').objectivesOf(2)[1].subs.includes(q.topic + '/' + q.sub)), n: Q.pool.length}));""",
 """    const od = await ev(fm => ({view: VIEW, label: Q.label, ok: Q.pool.every(q => FX.api('module-pages').kindOf(q) === 'concept' && FX.api('module-pages').objectivesOf(fm)[1].subs.includes(q.topic + '/' + q.sub)), n: Q.pool.length}), FM);""", 1),
("""    const mixed = await ev(() => FX.api('module-pages').objectivePool({subs: ['bolus1/model', 'bolus1/calc']}, 2).map(q => q.id).sort());""",
 """    const mixed = await ev(fm => FX.api('module-pages').objectivePool({subs: ['mpt-bolus1/model', 'mpt-bolus1/calc']}, fm).map(q => q.id).sort(), FM);""", 1),
("""    check(await ev(() => Q.pool.length === 12 && Q.pool.every(q => q.type === 'numeric' && q.module === 2)), 'All calculations in this module draws its 12 calculations');""",
 """    check(await ev(fm => Q.pool.length === 12 && Q.pool.every(q => q.type === 'numeric' && q.module === fm), FM), 'All calculations in this module draws its 12 calculations');""", 1),
# from the integration fix (fixes/module-pages.patch): the set's own Start, the closed list opened; the Homework row by its id
("""      await page.click('#v-topics [data-mpchain]'); await page.waitForTimeout(80);""",
 """      // the button of this set, inside a closed "In parts" list when its kind has several sets: open the list first
      await ev(() => { const b = document.querySelector('#v-topics [data-mpchain="mpt-hw2-p2"]'), d = b && b.closest('details'); if(d) d.open = true; });
      await page.click('#v-topics [data-mpchain="mpt-hw2-p2"] >> visible=true'); await page.waitForTimeout(80);""", 1),
("""            go: !!document.querySelector('#v-topics [data-mpsheet="mpt-hw-2"]'), text: (document.querySelector('#v-topics .mpage .subrow small') || {}).textContent}));""",
 """            go: !!document.querySelector('#v-topics [data-mpsheet="mpt-hw-2"]'),
            text: (((document.querySelector('#v-topics [data-mpsheet="mpt-hw-2"]') || {closest: () => null}).closest('.subrow') || {querySelector: () => null}).querySelector('small') || {}).textContent}));""", 1),
# labels
("""'the Module 2 card offers Concepts""", """'the card of the test's Module 2 offers Concepts""", 1),
("""'the scratch copy builds with no objectives and no kinds of problem for Module 2'""", """'the scratch copy builds with no objectives and no kinds of problem for the test's Module 2'""", 1),
("""'with worksheets-ink on, the Module 2 card offers Worksheets (1 document)'""", """'with worksheets-ink on, the card of the test's Module 2 offers Worksheets (1 document)'""", 1),
]
for old, new, n in R:
    c = s.count(old)
    if c != n:
        sys.exit(f'expected {n} match(es), found {c}: {old[:90]!r}')
    s = s.replace(old, new)
open(P, 'w', encoding='utf-8').write(s)
print(f'{len(R)} replacements applied to {P}')
