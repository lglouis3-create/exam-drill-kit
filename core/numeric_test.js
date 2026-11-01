/* course.js `numeric`: how a typed number is read and graded (numeric.js).
 * run_checks.sh runs it when course.js sets `numeric` (build.py --list-checks).
 *
 * On the course's own page:
 *   - the readings of Basic-Pharmacokinetics src/test.js lines 205-211: a number
 *     with its unit after it reads as the number (2.6 hr, 188.2 (mg/L)hr, 55%,
 *     0.17 hr-1, 0.17 1/hr, 1,000 mg ...), and anything else reads as no number
 *     (=3.13, 3..13, 2.6 hr 3, abc, blank): two numbers are never joined;
 *   - every numeric item of the bank (that file's lines 213-222): its key is
 *     right, alone and with its unit after it; the key plus the graded margin is
 *     right; well outside it is wrong; the margin is never tighter than the item's
 *     own `tol`, and with `numeric.margin` it is max(tol, margin x |key|); a blank,
 *     an unreadable entry and the key followed by a second number are wrong.
 * On scratch copies, in Chromium: with `numeric: {margin: 0.02}`, an answer 1.5%
 * off the key, typed with its unit, is right and the verdict names the margin it
 * was graded to; the key followed by " 5" is wrong. Without `numeric` the page
 * holds none of numeric.js. A `numeric` the build cannot use stops the build.
 *
 *     node numeric_test.js
 */
const fs = require('fs'), path = require('path');
const L = require('./check_lib');
const NAME = 'numeric_test.js';
const {check} = L;
L.PAGE.need(NAME);

// Basic-Pharmacokinetics src/test.js lines 205-207, at ac2eb73
const READS = [['2.6 hr', 2.6], ['188.2 (mg/L)hr', 188.2], ['3.13 L/hr', 3.13], ['55%', 55], ['0.17325 hr⁻¹', 0.17325],
  ['1,000 mg', 1000], ['2.6e3', 2600], ['-0.2', -0.2], ['0.17 hr-1', 0.17], ['0.17 h-1', 0.17], ['0.17 hr^-1', 0.17],
  ['0.17 /hr', 0.17], ['0.17 1/hr', 0.17], ['12 mg/L*hr', 12], ['=3.13', NaN], ['3..13', NaN], ['2.6 hr 3', NaN], ['abc', NaN], ['', NaN]];
// a calculation from Basic-Pharmacokinetics src/q8_module6b.js (m6b-n01, ac2eb73), for the browser checks
const PKQ = `QUESTIONS.push({id:'nt-m6b-n01', type:'numeric', prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id,
  sub:TOPICS[0].subs[0].id, concept:'nt-m6b-n01', skill:COURSE.skills[0].id, source:'slide', tags:[],
  stem:'A 300-mg dose of an antibiotic is administered as an intravenous (IV) infusion over a period of 2 hours. What is the infusion rate?',
  answer:150, tol:0.5, units:'mg/hr', steps:[{k:'setup', t:'R = {{frac:dose|infusion time}}'}, {k:'algebra', t:'R = {{frac:300 mg|2 hr}} = 150 mg/hr'}, {k:'round', t:'R = 150 mg/hr'}],
  teach:'An infusion rate is the dose divided by the time it runs.', cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'});\n`;

console.log('\n=== reading a typed number ===');
const X = L.engine('({parseNum, gradeNumeric, QUESTIONS, COURSE, NUMERIC: typeof NUMERIC === "undefined" ? null : NUMERIC})');
const wrong = READS.filter(([t, want]) => { const got = X.parseNum(t); return Number.isNaN(want) ? !Number.isNaN(got) : got !== want; })
  .map(([t, want]) => `${JSON.stringify(t)} read ${X.parseNum(t)}, wanted ${want}`);
check(!wrong.length, `${READS.length} typed entries read as Basic-Pharmacokinetics reads them`, wrong.slice(0, 4).join('; '));
check(!!X.NUMERIC, 'the page carries numeric.js (course.js sets `numeric`)');

console.log('\n=== the bank\'s numeric items ===');
const items = X.QUESTIONS.filter(q => q.type === 'numeric');
const margin = X.COURSE.numeric && typeof X.COURSE.numeric.margin === 'number' ? X.COURSE.numeric.margin : null;
const tolOf = q => margin === null ? (q.tol !== undefined ? q.tol : Math.abs(q.answer) * 0.01) : Math.max(q.tol || 0, margin * Math.abs(q.answer || 0));
if(!items.length) L.skip('the bank\'s numeric items', 'the bank has none');
else {
  const bad = {key: [], unit: [], edge: [], out: [], tight: [], blank: [], two: [], rule: []};
  for(const q of items){
    const t = X.NUMERIC ? X.NUMERIC.tol(q) : NaN;
    if(!(t === tolOf(q))) bad.rule.push(q.id);
    if(q.tol !== undefined && t < q.tol) bad.tight.push(q.id);
    if(!X.gradeNumeric(q, String(q.answer))) bad.key.push(q.id);
    if(q.units && !X.gradeNumeric(q, String(q.answer) + ' ' + q.units)) bad.unit.push(q.id);
    if(!X.gradeNumeric(q, String(q.answer + tolOf(q)))) bad.edge.push(q.id);
    if(X.gradeNumeric(q, String(q.answer + tolOf(q) * 2 + 1))) bad.out.push(q.id);
    if(X.gradeNumeric(q, '') || X.gradeNumeric(q, 'abc')) bad.blank.push(q.id);
    if(X.gradeNumeric(q, String(q.answer) + ' 5')) bad.two.push(q.id);
  }
  const say = k => bad[k].slice(0, 5).join(', ');
  check(!bad.rule.length, `the margin is ${margin === null ? 'the item\'s tol, or 1% of the key' : `max(tol, ${margin} x |key|)`} for all ${items.length}`, say('rule'));
  check(!bad.tight.length, 'no item is graded tighter than its own tol', say('tight'));
  check(!bad.key.length, 'every key is graded right', say('key'));
  check(!bad.unit.length, 'every key typed with its unit after it is right', say('unit'));
  check(!bad.edge.length, 'an answer exactly at the margin is right', say('edge'));
  check(!bad.out.length, 'an answer well outside the margin is wrong', say('out'));
  check(!bad.blank.length, 'a blank or unreadable entry is wrong', say('blank'));
  check(!bad.two.length, 'the key followed by a second number is wrong (no two numbers joined)', say('two'));
}

(async () => {
  console.log('\n=== in the browser (scratch copies) ===');
  const on = L.scratchBuild('numeric-on', {files: {'q96_numeric_test.js': PKQ}, courseLine: 'COURSE.numeric = {margin: 0.02};'});
  const off = L.scratchBuild('numeric-off', {courseLine: 'delete COURSE.numeric;'});
  const refused = [['{margin: 2}', /margin/], ['{grade: 1}', /takes only `margin`/], ["'0.02'", /takes only `margin`/]].map(([v, re]) => {
    const s = L.scratchBuild('numeric-bad', {courseLine: `COURSE.numeric = ${v};`});
    const ok = s.code !== 0 && re.test(s.out); s.rm(); return ok ? null : v; }).filter(Boolean);
  check(!refused.length, 'a `numeric` the build cannot use stops the build ({margin: 2}, {grade: 1}, a string)', refused.join(', '));
  if(off.code !== 0 || on.code !== 0) L.notRun(NAME, 'a scratch copy does not build: ' + (off.code ? off.out : on.out).split('\n').pop());
  check(!/const NUMERIC = /.test(fs.readFileSync(off.page, 'utf8')), 'without `numeric` the page holds none of numeric.js');
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, on.page);
    await L.quizOn(page, ['nt-m6b-n01', 'nt-m6b-n01']);
    await page.fill('#numIn', '152.25 mg/hr'); await page.click('#btnCheck');
    const a = await page.evaluate(() => ({v: document.querySelector('#v-quiz .verdict').textContent, last: DB.answers[DB.answers.length - 1]}));
    check(/✓ Correct/.test(a.v) && a.last.result === 'correct' && a.last.picked === '152.25 mg/hr', '152.25 mg/hr against a key of 150 with tol 0.5 (1.5% off, within 2%) is right, and kept as typed', a);
    check(/\(accepted within ±3 mg\/hr\)/.test(a.v), 'the verdict names the margin it was graded to: max(0.5, 2% of 150) = 3', a.v);
    await page.click('#btnNext');
    await page.fill('#numIn', '150 5'); await page.click('#btnCheck');
    const b = await page.evaluate(() => ({v: document.querySelector('#v-quiz .verdict').textContent, last: DB.answers[DB.answers.length - 1]}));
    check(/✗ Not correct/.test(b.v) && b.last.result === 'wrong', '"150 5" is wrong: two numbers are not joined into 1505', b.v);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    on.rm(); off.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
