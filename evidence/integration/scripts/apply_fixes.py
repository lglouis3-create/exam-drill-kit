# Apply the integration fixes to the copies under b/ (exact string replace, each must match once).
import sys
B = '/tmp/port-integration/fixwork/b/features/'
FIXES = {
 'glossary-tap': [(
  "    const nav = await page.evaluate(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));\n"
  "    check(nav.includes('glossary') && nav.indexOf('glossary') === nav.indexOf('settings') - 1, 'the Glossary tab is in the nav, before Settings', nav);",
  "    // other modules may put their own tabs before Settings too: only module tabs (FX.tabs()) may stand between\n"
  "    const navx = await page.evaluate(() => ({v: [...document.querySelectorAll('#nav button')].map(b => b.dataset.v), mods: FX.tabs()}));\n"
  "    const gi = navx.v.indexOf('glossary'), si = navx.v.indexOf('settings');\n"
  "    check(gi >= 0 && gi < si && navx.v.slice(gi + 1, si).every(v => navx.mods.includes(v)), 'the Glossary tab is in the nav, before Settings (only other modules\\' tabs between them)', navx);\n    const nav = navx.v;")],
 'glossary-tap-2': [(
  "        check(JSON.stringify(quiz.modules) === JSON.stringify(names), `${label}: the page runs ${names.join(', then ')}`, quiz.modules);",
  "        // the course may have other modules on: only the order of these two is compared\n"
  "        check(JSON.stringify(quiz.modules.filter(n => ['formulas-in-text', 'glossary-tap'].includes(n))) === JSON.stringify(names), `${label}: the page runs ${names.join(', then ')}`, quiz.modules);")],
 'paper-picker': [
  ("    const p1 = await ev(() => ({kept: DB.paperPicker && DB.paperPicker.exam, on: [...document.querySelectorAll('#v-exam .chip[aria-pressed=\"true\"]')].map(b => b.dataset.ppexam),",
   "    const p1 = await ev(() => ({kept: DB.paperPicker && DB.paperPicker.exam, on: [...document.querySelectorAll('#v-exam .chip[data-ppexam][aria-pressed=\"true\"]')].map(b => b.dataset.ppexam),"),
  ("    const k = await ev(() => ({on: [...document.querySelectorAll('#v-exam .chip[aria-pressed=\"true\"]')].map(b => b.dataset.ppexam),",
   "    const k = await ev(() => ({on: [...document.querySelectorAll('#v-exam .chip[data-ppexam][aria-pressed=\"true\"]')].map(b => b.dataset.ppexam),")],
 'module-pages': [
  ("            go: !!document.querySelector('#v-topics [data-mpsheet=\"mpt-hw-2\"]'), text: (document.querySelector('#v-topics .mpage .subrow small') || {}).textContent}));\n"
   "          check(w.h3.join() === 'Homework' && w.ink && w.go && w.text === '4 problems in the drill', 'the Worksheets page lists Homework 2 with its 4 problems, Write on it and Practice in the drill', w);",
   "            go: !!document.querySelector('#v-topics [data-mpsheet=\"mpt-hw-2\"]'),\n"
   "            text: (((document.querySelector('#v-topics [data-mpsheet=\"mpt-hw-2\"]') || {closest: () => null}).closest('.subrow') || {querySelector: () => null}).querySelector('small') || {}).textContent}));\n"
   "          // the course's own documents of Module 2, when it has any, are listed beside the test's Homework 2\n"
   "          check(w.h3.includes('Homework') && w.ink && w.go && w.text === '4 problems in the drill', 'the Worksheets page lists Homework 2 with its 4 problems, Write on it and Practice in the drill', w);"),
  ("      await page.click('#v-topics [data-mpchain]'); await page.waitForTimeout(80);",
   "      // the course's own problem sets may have Start buttons too (with several sets for one kind): click this set's, shown\n"
   "      // with several sets for the kind they are listed under a closed \"In parts\" list: open it first\n"
   "      await ev(() => { const b = document.querySelector('#v-topics [data-mpchain=\"mpt-hw2-p2\"]'), d = b && b.closest('details'); if(d) d.open = true; });\n"
   "      await page.click('#v-topics [data-mpchain=\"mpt-hw2-p2\"] >> visible=true'); await page.waitForTimeout(80);")],
 'worksheets-ink': [
  ("  'COURSE.exams.forEach(e => { e.typed = true; });' + L.featureOn(__dirname, Object.assign({}, PK_OPT, opt || {}));",
   "  'COURSE.exams.forEach(e => { e.typed = true; });' + L.featureOn(__dirname, Object.assign({}, PK_OPT, opt || {})) +\n"
   "  // plan-the-problem, when the course has it on, is switched off in these copies: the fixture's questions keep\n"
   "  // their `setup` lines, which name equations the course's EQUATIONS need not have (its build step refuses them)\n"
   "  \"if(COURSE.features) delete COURSE.features['plan-the-problem'];\";")],
 'worksheets-ink-2': [(
  "        const named = CHAINS.filter(c => /\(changed numbers\)/.test(c.name)), names = named.map(c => c.name);",
  "        // the test's own sets only (prefix P): a course with its own copies of these documents has its own sets\n"
  "        const named = CHAINS.filter(c => String(c.id).startsWith(P) && /\(changed numbers\)/.test(c.name)), names = named.map(c => c.name);")],
 'study-controls': [
  ("check(p1.cards === p1.n && /^\\d\\d:\\d\\d$/.test(p1.clock) && c2 !== p1.clock,",
   "check(p1.cards === p1.n && /^\\d+:\\d\\d$/.test(p1.clock) && c2 !== p1.clock,   // a paper of 100 minutes or more shows 119:59\n   "),
  ("      check(g1.drawn === other && g2.join() === '1' && g3 === 0,",
   "      // an exam id may be a number (Basic-Pharmacokinetics: 1, 2, 3); the chip's data-ppexam is text\n      check(String(g1.drawn) === other && g2.join() === '1' && g3 === 0,"),
  ("      check(g4.box && g4.drawn === other && g5.i === 1",
   "      check(g4.box && String(g4.drawn) === other && g5.i === 1")],
 'terms-variables': [
  ("  \"if(COURSE.features) delete COURSE.features['glossary-tap'];\";",
   "  \"if(COURSE.features) delete COURSE.features['glossary-tap'];\" +\n"
   "  // plan-the-problem likewise: the fixture's questions keep their `setup` lines, naming equations the course need not have\n"
   "  \"if(COURSE.features) delete COURSE.features['plan-the-problem'];\";")],
 'terms-variables-2': [(
  "const gotT = made.term.filter(id => /^term-tvt-/.test(id)), gotV = made.vars.filter(id => own.ASKS ? /-ask-tvt-/.test(id) : true);",
  "// questions of the course's own (other prefixes) with `asks` give their own stem questions: only the test's (tvt-) are compared\n"
  "    const gotT = made.term.filter(id => /^term-tvt-/.test(id)), gotV = made.vars.filter(id => own.ASKS ? /-ask-tvt-/.test(id) : (!/-ask-/.test(id) || /-ask-tvt-/.test(id)));")],
 'concept-statuses': [
  ("  const s = L.scratchBuild('cstat', {files: fixtureFiles(own), courseLine: L.featureOn(__dirname, {words: WORDS})});",
   "  // plan-the-problem, when the course has it on, is switched off in this copy: the fixture's questions keep their\n"
   "  // `setup` lines, which name equations the course's EQUATIONS need not have (its build step refuses them)\n"
   "  const s = L.scratchBuild('cstat', {files: fixtureFiles(own), courseLine: L.featureOn(__dirname, {words: WORDS}) +\n"
   "    \"if(COURSE.features) delete COURSE.features['plan-the-problem'];\"});")],
}
only = sys.argv[1:]
for m, reps in FIXES.items():
    if only and m not in only: continue
    p = B + m.replace('-2', '') + '/current/test.js'
    s = open(p, encoding='utf8').read()
    for old, new in reps:
        n = s.count(old)
        if n != 1: sys.exit(f'{m}: expected 1 match, found {n}: {old[:80]}')
        s = s.replace(old, new)
    open(p, 'w', encoding='utf8').write(s)
    print(m, 'patched', len(reps))
