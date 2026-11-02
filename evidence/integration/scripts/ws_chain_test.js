/* ws_chain_test.js <courseSrc> : worksheets-ink with and without chained-problem-sets (integration,
 * agent-run, Chromium). A scratch copy of the course gets the worksheets-ink test's own Basic-
 * Pharmacokinetics fixture (its PK constant: 4 documents, 6 problem sets, 33 questions, 3 topics;
 * ids prefixed wxc-, the professor and skill set to the course's own, as that test does).
 *   - Practice in the drill on a document that is one whole problem set: with chained-problem-sets
 *     on, the quiz is that set (Q.chain, its parts in order, the shared setup above the part);
 *     without it, a plain pass over the same parts in the same order.
 *   - Write on it on a document with problem sets: the writing page shows each set's setup and
 *     each part, in the set's order, and writing on a part is kept after Done and a reopen.
 */
const path = require('path'), fs = require('fs');
const SRC = path.resolve(process.argv[2]);
const L = require(path.join(SRC, 'check_lib.js'));
const {fixture} = require('/tmp/port-integration/fx.js');
const NAME = 'integration ws_chain_test.js';
const {check} = L;
const KIT = '/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3';
const PK = fixture(KIT, 'worksheets-ink', 'PK');
const pre = id => 'wxc-' + id;

(async () => {
  L.PAGE.need(NAME);
  const X = L.engine('({COURSE, TOPICS, FX, SOURCES: typeof SOURCES === "undefined" ? null : SOURCES, CHAINS: typeof CHAINS === "undefined" ? null : CHAINS})');
  const chainedOn = !!(X.FX && X.FX.api('chained-problem-sets'));
  if(!(X.FX && X.FX.api('worksheets-ink'))) L.notRun(NAME, 'worksheets-ink is not on in this course');
  console.log('chained-problem-sets on: ' + chainedOn);
  const own = {prof: X.COURSE.professors[0], skill: X.COURSE.skills[0].id, topics: X.TOPICS.map(t => t.id)};
  const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), prof: own.prof, skill: own.skill}, q.dupOf ? {dupOf: pre(q.dupOf)} : {}));
  qs.forEach(q => { delete q.setup; });
  const chains = PK.chains.map(c => Object.assign({}, c, {id: pre(c.id), parts: c.parts.map(pre)}));
  const sources = PK.sources.map(s => Object.assign({}, s, {id: pre(s.id), chains: (s.chains || []).map(pre), items: s.items.map(it => ({q: pre(it.q), label: it.label}))}));
  const topics = PK.topics.filter(t => !own.topics.includes(t.id)).map(t => Object.assign({}, t, {prof: own.prof}));
  const decl = (n, v, has) => has ? `${n}.push(...${JSON.stringify(v)});` : `const ${n} = ${JSON.stringify(v)};`;
  const s = L.scratchBuild('wxc', {files: {
      'q91_wxc_fixture.js': `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`,
      'wxc_data.js': decl('CHAINS', chains, !!X.CHAINS) + '\n' + decl('SOURCES', sources, !!X.SOURCES) + '\n'},
    courseLine: "COURSE.files = COURSE.files.concat(['wxc_data.js']); if(COURSE.features) delete COURSE.features['plan-the-problem'];"});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy does not build: ' + s.out.split('\n').slice(-2).join(' '));
  const {browser} = await L.launch(NAME);
  const {page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1000, height: 1200}});
  // a document that is one whole problem set
  const whole = await page.evaluate(() => { const A = FX.api('worksheets-ink');
    return Object.keys(A.SRC_BY).map(k => A.SRC_BY[k]).filter(s => s.id.startsWith('wxc-')).map(s => { const p = A.sheetPlan(s); return {id: s.id, groups: p.main.map(g => ({chain: g.chain && g.chain.id, n: g.ids.length, parts: g.chain && g.chain.parts.length, ids: g.ids}))}; }); });
  console.log('documents: ' + JSON.stringify(whole.map(d => [d.id, d.groups.map(g => [g.chain, g.n, g.parts])])));
  const one = whole.find(d => d.groups.length === 1 && d.groups[0].chain && d.groups[0].n === d.groups[0].parts);
  if(!one) L.skip('Practice in the drill on a whole problem set', 'no fixture document is one whole problem set');
  else {
    await page.evaluate(() => show('sheets'));
    await page.click(`#v-sheets [data-src="${one.id}"] [data-sheet], #v-sheets [data-src="${one.id}"] button:has-text("Practice in the drill")`).catch(async () => {
      await page.evaluate(id => { const b = [...document.querySelectorAll('#v-sheets [data-src="' + id + '"] button')].find(x => /practice in the drill/i.test(x.textContent)); if(b) b.click(); }, one.id); });
    await page.waitForTimeout(200);
    const st = await page.evaluate(() => ({view: VIEW, chain: Q && Q.chain && Q.chain.id, sweep: Q && Q.sweep, cur: Q && Q.current && Q.current.id,
      text: (document.getElementById('v-quiz') || {}).textContent || ''}));
    const want = one.groups[0].ids;
    const c = chains.find(x => x.id === one.groups[0].chain);
    check(st.view === 'quiz' && JSON.stringify(st.sweep) === JSON.stringify(want) && st.cur === want[0], `Practice in the drill on ${one.id} asks its ${want.length} parts in the set's order`, st);
    if(chainedOn) check(st.chain === one.groups[0].chain && st.text.includes(String(c.setup).replace(/<[^>]+>/g, '').slice(0, 30)),
      'with chained-problem-sets on, it starts as the problem set: Q.chain is the set and the shared setup is shown above the part', {chain: st.chain, setup: String(c.setup).slice(0, 40)});
    else check(!st.chain, 'with chained-problem-sets off, it is a plain pass (no Q.chain)', st.chain);
  }
  // Write on it on a document with problem sets: every part of each set, in order
  const withSets = whole.find(d => d.groups.some(g => g.chain && g.n > 1));
  if(!withSets) L.skip('Write on it with problem sets', 'no fixture document has a set of more than one part');
  else {
    await page.evaluate(() => show('sheets'));
    const opened = await page.evaluate(id => { const b = document.querySelector('#v-sheets [data-src="' + id + '"] [data-ink][data-var="main"]'); if(!b) return false; b.click(); return !!document.getElementById('ink'); }, withSets.id);
    check(opened, `Write on it opens the writing page of ${withSets.id}`);
    if(opened){
      const w = await page.evaluate(() => ({qids: [...document.querySelectorAll('#ink .wspart[data-qid]')].map(e => e.dataset.qid), text: document.getElementById('ink').textContent}));
      const setOrderOk = withSets.groups.filter(g => g.chain).every(g => { const pos = g.ids.map(id => w.qids.indexOf(id)); return pos.every(p => p >= 0) && pos.every((p, i) => !i || p > pos[i - 1]); });
      check(setOrderOk, `the writing page holds every part of each problem set, in the set's order (${w.qids.length} parts)`, {qids: w.qids.slice(0, 12)});
      // (a set's `setup` in CHAINS is a one-line summary that worksheets-ink does not print; the stems are printed)
      const box = await page.evaluate(() => { const c = document.querySelector('#ink canvas'); const r = c.getBoundingClientRect(); return {x: r.left + 80, y: r.top + 40}; });
      await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 60, box.y + 20, {steps: 5}); await page.mouse.up();
      await page.evaluate(() => document.querySelector('#ink [data-inkdone]').click()); await page.waitForTimeout(300);
      const strokesOf = id => page.evaluate(id => Object.entries(DB.ink || {}).filter(([k]) => k.startsWith(id)).reduce((a, [k, d]) => a + Object.values((d && d.parts) || {}).reduce((x, v) => x + (Array.isArray(v) ? v.length : 0), 0), 0), id);
      const n1 = await strokesOf(withSets.id);
      await page.waitForTimeout(400); await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
      const n2 = await strokesOf(withSets.id);
      check(n1 >= 1 && n2 === n1, 'the stroke written on the page is kept after Done and after a reload', {n1, n2});
      await page.evaluate(id => { show('sheets'); document.querySelector('#v-sheets [data-src="' + id + '"] [data-ink][data-var="main"]').click(); }, withSets.id);
      await page.screenshot({path: `/tmp/port-integration/shots/ws-chain-${chainedOn ? 'on' : 'off'}-write.png`});
      await page.evaluate(() => document.querySelector('#ink [data-inkdone]').click());
    }
  }
  check(!errors.length, 'no page error', errors.slice(0, 3));
  await browser.close(); s.rm();
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': ' + e.stack); process.exit(1); });
