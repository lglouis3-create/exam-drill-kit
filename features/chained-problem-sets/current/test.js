/* chained-problem-sets: the module's own test. run_checks.sh runs it when the
 * course switches the module on (build.py --list-checks).
 *
 * On the course's own CHAINS (Basic-Pharmacokinetics src/test.js section 5c and
 * lines 760-790): every part resolves, appears once, and each set has at least two
 * parts, a name and a vignette line; the part index agrees with the sets; and every
 * earlier result a part's working uses is stated in that part's stem (an earlier
 * part's numeric answer at 0 to 4 decimals within 0.05%, three or more significant
 * digits, used in the working but not produced there with "=" and not in the stem).
 * The same check finds the unstated result in a copy of a Basic-Pharmacokinetics set
 * whose third part has its carried value taken out of the stem.
 *
 * On a scratch copy with one of Basic-Pharmacokinetics' sets added (m1-first: four
 * parts, its src/q1_module1.js at ac2eb73, ids prefixed cps-), in Chromium (its
 * src/problemset_test.py ported): every set has a Start button on Topics; the set runs
 * in her order, the progress line counts parts, the vignette is above each part, and
 * the closing card names the set; a part met on its own says which set it is in and
 * offers the set, which then starts at part 1; a paper keeps the parts of one set
 * together and in order (its src/test.js lines 798-807). A set naming a question the
 * bank does not have stops the build.
 *
 *     node features/chained-problem-sets/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/chained-problem-sets/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* One of Basic-Pharmacokinetics' problem sets and its four parts (src/q1_module1.js, ac2eb73). */
const FIX = {"chain":{"id":"m1-first","src":"practice","module":1,"name":"Decomposition of a drug solution, first order","setup":"One table of six samples over 48 hours, worked through to the time for 90 per cent","parts":["m1-ord-n01","m1-ord-n02","m1-ord-n03","m1-ord-n04"]},"qs":[{"id":"m1-ord-n01","type":"numeric","stem":"In an experiment to study the chemical decomposition, a drug solution was prepared and a sample was obtained at different time points. The drug concentrations in the samples and the results were as follows:\n\nTime (hr) | Concentration (mg/L)\n2 | 294.3\n6 | 208.1\n12 | 123.8\n24 | 43.8\n36 | 15.5\n48 | 5.5\n\nWhat is the rate constant for the decrease in concentration?","answer":0.0866,"tol":0.0015,"units":"hr⁻¹","steps":[{"k":"setup","t":"Ratios over equal intervals are constant: {{frac:123.8|43.8}} = 2.83 across the 12 hours from 12 to 24 hr, and {{frac:43.8|15.5}} = 2.83 across the 12 hours from 24 to 36 hr, so a fixed fraction is lost per unit time and the process is first order.","why":"The order must be settled first, because the two orders give rate constants with different units and equations. Ratios must be compared over equal spans (a 6-hour and a 12-hour ratio are not expected to match), and two consecutive 12-hour spans both giving 2.83 is the first-order condition."},{"k":"setup","t":"For a first-order process, ln C = ln C0 − kt, so k = {{frac:ln(C₁ ÷ C₂)|t₂ − t₁}}.","why":"Writing the integrated first-order equation for two measured points and subtracting cancels ln C0, so the unknown starting concentration drops out and k depends only on values in the table. Dr. Mosley writes this difference of logarithms as the logarithm of the ratio."},{"k":"algebra","t":"Using t₁ = 6 hr with C₁ = 208.1 mg/L and t₂ = 24 hr with C₂ = 43.8 mg/L: Δt = 18 hr, and k = {{frac:ln(208.1 ÷ 43.8)|18}} hr = {{frac:1.55838|18}} hr.","why":"These are the two points in her own key, and the 18-hour separation spans most of the decline, which reduces the effect of measurement scatter. The concentration units cancel inside the logarithm, leaving a pure number divided by hours: reciprocal hours."},{"k":"round","t":"k = 0.08658 hr⁻¹, reported as 0.0866 hr⁻¹.","why":"Dividing a dimensionless logarithm by a time gives reciprocal time, the unit of a first-order rate constant. Dr. Mosley reports rate constants to four decimal places (her key prints 0.0866 per hour), and a leading decimal with no digit before it loses half the marks on her paper."}],"teach":"","cite":"IntroductionandMathReviewSolutions.pdf, problem 1a; Introduction.pdf slide 18"},{"id":"m1-ord-n02","type":"numeric","stem":"A drug solution decomposes by a first-order process with a rate constant of 0.0866 hr⁻¹. The concentration measured 12 hours after the solution was prepared was 123.8 mg/L. What was the initial concentration of the solution?","answer":350,"tol":3,"units":"mg/L","steps":[{"k":"setup","t":"C = C0 e^(−kt), so C0 = C e^(+kt).","why":"The integrated equation runs forward from the start, but the unknown is at the start, so it is rearranged to move backwards: multiplying both sides by e^(+kt) isolates C0. Keeping the minus sign returns a number smaller than the measured concentration, which cannot be a starting value."},{"k":"algebra","t":"kt = 0.0866 hr⁻¹ × 12 hr = 1.0392, which is dimensionless.","why":"Reciprocal hours multiplied by hours cancel, which they must, because an exponent has to be a pure number. Checking that cancellation is the quickest guard against having mixed a rate constant in reciprocal hours with a time in days or minutes. The product itself has no units."},{"k":"algebra","t":"C0 = 123.8 mg/L × e^1.0392 = 349.98 mg/L.","why":"The exponential factor e^1.0392 is 2.8270, which is greater than one because the exponent is positive, so the answer is larger than the measured concentration, as it must be for a concentration that has been falling for 12 hours. Milligrams per litre multiplied by a pure number stay milligrams per litre."},{"k":"round","t":"C0 = 350 mg/L.","why":"Dr. Mosley reports this value as 350 mg/L, to three significant figures, which matches the precision of the tabulated concentrations. The computed 349.98 rounds to that value without any further adjustment."}],"teach":"","cite":"IntroductionandMathReviewSolutions.pdf, problem 1b; Introduction.pdf slide 18"},{"id":"m1-ord-n03","type":"numeric","stem":"A drug solution decomposes by a first-order process with a rate constant of 0.0866 hr⁻¹. How much time is required for exactly half the solution to decompose?","answer":8,"tol":0.2,"units":"hr","steps":[{"k":"setup","t":"t½ = {{frac:0.693|k}} for a first-order process.","why":"Setting the concentration to half its starting value in ln C = ln C0 − kt leaves ln 2, which is 0.693, divided by the rate constant. The starting concentration cancels, so a first-order half-life does not depend on it. This relation is not printed on the exam equation sheet."},{"k":"algebra","t":"t½ = {{frac:0.693|0.0866}} hr⁻¹ = 8.002 hr.","why":"Dividing a pure number by a quantity in reciprocal hours gives hours, which is the unit a half-life must have. The rate constant sits in the denominator because a faster process has a shorter half-life, so the two quantities move in opposite directions."},{"k":"round","t":"t½ = 8 hr.","why":"Dr. Mosley reports this as 8 hours, to the whole hour. The answer is a time and carries no reciprocal unit; hours to the minus one belongs to the rate constant that was given, not to the half-life that was asked for."}],"teach":"Introduction.pdf, slide 19.","cite":"IntroductionandMathReviewSolutions.pdf, problem 1c; Introduction.pdf slide 19"},{"id":"m1-ord-n04","type":"numeric","stem":"A drug solution decomposes by a first-order process with a rate constant of 0.0866 hr⁻¹. How much time is required for the original solution to decompose by 90%?","answer":26.6,"tol":0.5,"units":"hr","steps":[{"k":"setup","t":"Decomposing by 90 per cent leaves 10 per cent, so C = 0.1 C0.","why":"The stem states how much has gone and the equation is written in terms of how much remains, so the percentage has to be turned round before it is used. Reading 90 per cent straight into the equation as the remaining fraction gives {{frac:ln(1 ÷ 0.9)|0.0866}} hr⁻¹ = 1.2 hours instead of 26.6."},{"k":"setup","t":"0.1 C0 = C0 e^(−kt), so t = {{frac:ln(1 ÷ 0.1)|k}}.","why":"The starting concentration cancels from both sides, which is why no concentration value is needed to answer a percentage question for a first-order process. Rearranging for time puts the logarithm of the reciprocal fraction over the rate constant."},{"k":"algebra","t":"t = {{frac:ln(10)|0.0866}} hr⁻¹ = {{frac:2.302585|0.0866}} hr⁻¹.","why":"The logarithm of ten is a pure number, and dividing it by a quantity in reciprocal hours leaves hours. The fraction remaining is not a clean power of one half here, so half-life counting will not reach the answer exactly and the logarithmic route is needed."},{"k":"round","t":"t = 26.589 hr, reported as 26.6 hr.","why":"Dr. Mosley reports this to one decimal place, as 26.6 hours. As a check, 90 per cent decomposition is a little more than three half-lives, which for an 8-hour half-life would be 24 hours, and the answer sits just above that."}],"teach":"","cite":"IntroductionandMathReviewSolutions.pdf, problem 1d; Introduction.pdf slide 18"}]};

/* Basic-Pharmacokinetics src/test.js lines 760-790: every earlier result a part's
   working uses, but does not produce with "=", is stated in that part's stem. */
function unstated(chains, byIdQ){
  const plain = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g, '($1)/($2)');
  const forms = v => [0, 1, 2, 3, 4].map(d => (+v).toFixed(d))
    .filter((t, i, a) => a.indexOf(t) === i && Math.abs(+t - v) <= Math.abs(v) * 0.0005 + 1e-12 && t.replace(/\D/g, '').replace(/^0+/, '').length >= 3);
  const reEsc = t => t.replace(/\./g, '\\.');
  const out = [];
  for(const c of chains){
    const parts = (c.parts || []).map(id => byIdQ[id]).filter(Boolean);
    parts.forEach((q, i) => {
      const work = (q.steps || []).map(s => plain(s.t)).join(' ; ');
      const stemNums = (plain(q.stem).match(/\d[\d,]*\.?\d*/g) || []).map(n => +n.replace(/,/g, ''));
      for(const p of parts.slice(0, i)){
        if(p.type !== 'numeric') continue;
        const t = forms(p.answer).find(t => new RegExp('(^|[^0-9.])' + reEsc(t) + '(?![0-9])').test(work)
          && !new RegExp('[=≈]\\s*' + reEsc(t) + '(?![0-9])').test(work)
          && !stemNums.some(x => x.toFixed((t.split('.')[1] || '').length) === t));
        if(t) out.push(`${q.id} uses ${p.id} = ${t}`);
      }
    });
  }
  return out;
}

const pre = 'cps-';
const fixChain = Object.assign({}, FIX.chain, {id: pre + FIX.chain.id, parts: FIX.chain.parts.map(id => pre + id)});
const fixFile = hasChains => '/* one of Basic-Pharmacokinetics\' problem sets (ac2eb73), added by the chained-problem-sets test */\n' +
  FIX.qs.map(q => `QUESTIONS.push(Object.assign({prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id,
  concept:${JSON.stringify(pre + q.id)}, skill:COURSE.skills[0].id, source:'slide', tags:[]}, ${JSON.stringify(Object.assign({}, q, {id: pre + q.id}))}));`).join('\n') +
  '\n' + (hasChains ? `CHAINS.push(${JSON.stringify(fixChain)});` : `const CHAINS = [${JSON.stringify(fixChain)}];`) + '\n';

(async () => {
  console.log('\n=== the course\'s own problem sets ===');
  L.PAGE.need(NAME);
  const X = L.engine('({CHAINS: typeof CHAINS === "undefined" ? null : CHAINS, QUESTIONS, FX})');
  const own = X.CHAINS || [];
  const byIdQ = Object.fromEntries(X.QUESTIONS.map(q => [q.id, q]));
  if(!own.length) L.skip('the course\'s own problem sets', 'course.js lists no data file that declares CHAINS');
  else {
    const seen = new Map(), bad = [];
    for(const c of own){
      const miss = c.parts.filter(id => !byIdQ[id]);
      if(miss.length) bad.push(`"${c.id}" names ${miss.join(', ')}`);
      if(c.parts.length < 2) bad.push(`"${c.id}" has ${c.parts.length} part`);
      if(!c.name || !c.setup) bad.push(`"${c.id}" has no name or vignette line`);
      for(const id of c.parts){ if(seen.has(id)) bad.push(`${id} is in "${seen.get(id)}" and "${c.id}"`); seen.set(id, c.id); }
    }
    check(!bad.length, `${own.length} problem sets: every part resolves and appears once, each set has two or more parts, a name and a vignette`, bad.slice(0, 4).join('; '));
    const api = X.FX && X.FX.api('chained-problem-sets');
    const wrong = api ? own.filter(c => c.parts.some((id, i) => !api.CHAIN_OF[id] || api.CHAIN_OF[id].chain.id !== c.id || api.CHAIN_OF[id].step !== i + 1)) : own;
    check(!wrong.length, 'every part knows which set it belongs to and its place in it', wrong.map(c => c.id).join(', '));
    const un = unstated(own, byIdQ);
    check(!un.length, 'every earlier result a part\'s working uses is stated in that part\'s stem', `${un.length}: ${un.slice(0, 5).join(', ')}`);
  }
  // the check itself, on the fixture as she wrote it and with part c's carried value taken out of its stem
  const fixById = Object.fromEntries(FIX.qs.map(q => [q.id, q]));
  check(!unstated([FIX.chain], fixById).length, `the stated-results check passes ${FIX.chain.id} as written`);
  const cut = JSON.parse(JSON.stringify(fixById));
  const b = cut[FIX.chain.parts[2]];
  b.stem = b.stem.replace(/with a rate constant of [\d.]+ hr⁻¹/, 'with the rate constant found above');
  const found = unstated([FIX.chain], cut);
  check(found.length && found[0].startsWith(FIX.chain.parts[2] + ' uses ' + FIX.chain.parts[0]), 'and finds the result a part uses when its stem does not state it', found.join(', ') || 'nothing found');

  console.log('\n=== a set naming a question the bank does not have ===');
  const broken = L.scratchBuild('chains-broken', {files: {'q93_chains_test.js': fixFile(!!X.CHAINS).replace(JSON.stringify(fixChain), JSON.stringify(Object.assign({}, fixChain, {parts: fixChain.parts.concat(['cps-nowhere'])})))}});
  check(broken.code !== 0 && /names cps-nowhere, which is not a question in the bank/.test(broken.out) && !fs.existsSync(broken.page), 'stops the build, naming the set and the question', broken.out.split('\n').pop());
  broken.rm();

  console.log('\n=== worked in the browser (scratch copy) ===');
  const s = L.scratchBuild('chains', {files: {'q93_chains_test.js': fixFile(!!X.CHAINS)}});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test set does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page);
    await page.evaluate(() => show('topics'));
    const t = await page.evaluate(() => ({ids: CHAINS.map(c => c.id),
      shown: [...document.querySelectorAll('#v-topics #chainSets button[data-chain]')].map(b => b.dataset.chain)}));
    check(t.ids.length && t.ids.every(id => t.shown.includes(id)), `all ${t.ids.length} sets have a Start button on Topics (${t.shown.length} shown)`, t);
    await page.click(`#v-topics button[data-chain="${fixChain.id}"]`);
    const seen = [], labels = [], cset = [];
    for(let step = 0; step <= fixChain.parts.length; step++){
      const cur = await page.evaluate(() => Q && Q.current && Q.current.id);
      if(!cur) break;
      seen.push(cur);
      labels.push(await page.evaluate(() => document.querySelector('#v-quiz .qprog span').textContent));
      cset.push(await page.evaluate(() => { const c = document.querySelector('#v-quiz .cset'), s = document.querySelector('#v-quiz .stem');
        return !!c && !!s && !!(c.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) && c.textContent.trim(); }));
      await page.fill('#numIn', String(await page.evaluate(() => Q.current.answer)));
      await page.click('#btnCheck'); await page.click('#btnNext');
    }
    check(JSON.stringify(seen) === JSON.stringify(fixChain.parts), `the set ran in her order (${seen.length} parts)`, seen);
    check(labels[0] === `part 1 of ${fixChain.parts.length}` && labels.every((l, i) => l === `part ${i + 1} of ${fixChain.parts.length}`), 'the progress line counts parts', labels);
    check(cset.length === fixChain.parts.length && cset.every(c => c === FIX.chain.setup), 'the vignette is printed above each part\'s stem', cset);
    const done = await page.evaluate(() => document.getElementById('v-quiz').textContent);
    check(done.includes(`That is every part of ${FIX.chain.name}`), 'the closing card names the set', done.slice(0, 120));

    const part = fixChain.parts[2];
    await L.quizOn(page, part);
    await page.fill('#numIn', '0.78'); await page.click('#btnCheck');
    const alone = await page.evaluate(() => ({text: document.getElementById('v-quiz').textContent, n: document.querySelectorAll('#v-quiz [data-chainlink]').length}));
    check(alone.text.includes(`part 3 of ${fixChain.parts.length} of one problem`), 'a part answered alone says which set it belongs to', alone.text.slice(-200));
    check(alone.n === 1, 'and offers to work the set', alone.n);
    await page.click('#v-quiz [data-chainlink]');
    check(await page.evaluate(id => Q.chain && Q.chain.id === id && Q.current.id === CHAINS.find(c => c.id === id).parts[0], fixChain.id),
          'that button starts the set at part 1');

    const order = await page.evaluate(ids => { const A = FX.api('chained-problem-sets');
      const loose = QUESTIONS.find(q => !A.CHAIN_OF[q.id]);
      return {got: A.paperOrder([byId(ids[3]), loose, byId(ids[0]), byId(ids[2])]).map(q => q.id), loose: loose.id}; }, fixChain.parts);
    check(JSON.stringify(order.got) === JSON.stringify([fixChain.parts[0], fixChain.parts[2], fixChain.parts[3], order.loose]),
          'a paper puts the parts of one set together, in her order, where the first was drawn', order.got);
    const papers = await page.evaluate(() => { const A = FX.api('chained-problem-sets'); let withParts = 0, bad = 0;
      for(let k = 0; k < 30; k++){ const p = drawPaper().map(q => q.id);
        const sets = {}; p.forEach((id, i) => { const c = A.CHAIN_OF[id]; if(c) (sets[c.chain.id] ||= []).push([i, c.step]); });
        for(const at of Object.values(sets)){ withParts++; if(at.some(([i, st], k) => k && (i !== at[k - 1][0] + 1 || st < at[k - 1][1]))) bad++; } }
      return {withParts, bad}; });
    if(papers.withParts) check(!papers.bad, `on 30 drawn papers every set's parts sit together and in order (${papers.withParts} sets on papers)`, papers);
    else L.skip('parts on drawn papers', 'no part reached a paper (the papers draw no calculations: exams[].typed is off)');
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
