/* Persistence of what the stopwatch adds to the saved progress (QUALITY.md C).
 *
 *     NODE_PATH=... node persistence_test.js COURSE_SRC
 *
 * The module itself writes nothing to storage. What it adds to the progress is the
 * `ms` of each exam-paper answer (DB.answers), which the core saves 150 ms after the
 * last change. On a built course page whose exam draws calculations (typed: true),
 * with a long answer history (400 answers) seeded first:
 *   1 a paper submitted and the page reloaded after 400 ms: the paper's answers come
 *     back with their ms, the 400 earlier answers too;
 *   2 the same with the reload 20 ms after submitting (below the core's 150 ms):
 *     reported, not judged (core behaviour);
 *   3 Export progress, then Import into a fresh profile: the same answers and ms;
 *   4 a profile switch: each profile keeps its own paper times;
 *   5 storage denied (setItem throws) and storage full (QuotaExceededError): the notice
 *     shows, the stored progress is not overwritten, and after storage works again the
 *     saved progress loads.
 */
const fs = require('fs'), path = require('path');
const SRC = path.resolve(process.argv[2]);
const L = require(path.join(SRC, 'check_lib'));
const NAME = 'persistence_test.js (stopwatch evidence)';
const {check} = L;
const PAGE = path.join(SRC, '..', 'index.html');

const clockInit = () => { window.__off = 0; const real = Date.now.bind(Date); Date.now = () => real() + window.__off; };
const ready = page => page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});

/* one paper of [calculation, multiple choice]: calc shown `a` ms, then mc `b` ms */
async function paper(page, a, b){
  await page.evaluate(() => { const mc = QUESTIONS.find(q => !q.type && EXAM.pools.some(p => p.test(q)));
    drawPaper = () => [byId('s2-3'), mc]; show('exam'); });
  await page.click('#startExam'); await page.waitForTimeout(100);
  await page.fill('#exNum', '140');
  await page.evaluate(a => { window.__off += a; document.getElementById('exNext').click(); }, a);
  await page.waitForTimeout(100);
  await page.click('#v-exam .opt');
  await page.evaluate(b => { window.__off += b; }, b);
  const n0 = await page.evaluate(() => DB.answers.length);
  await page.click('#exEnd');
  return n0;
}
const paperMs = (page, n0) => page.evaluate(n0 => DB.answers.slice(n0).map(a => a.ms), n0);
const stored = page => page.evaluate(() => localStorage.getItem(keyFor(PROFILE)));

(async () => {
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, PAGE, {viewport: {width: 1100, height: 1200}, acceptDownloads: true}, clockInit);
    await page.evaluate(() => { window.__first = PROFILE; sessionStorage.setItem('first', PROFILE); });
    // a long history: 400 answers on the bank's questions, with times
    await page.evaluate(() => { const qs = QUESTIONS; for(let i = 0; i < 400; i++){ const q = qs[i % qs.length];
      DB.answers.push({qid: q.id, concept: q.concept, result: i % 3 ? 'correct' : 'wrong', at: Date.now() - (400 - i) * 60000, qn: ++DB.qn, ms: 5000 + i * 37}); }
      store.set(keyFor(PROFILE), JSON.stringify(DB)); });

    console.log('\n=== 1 reload 400 ms after a paper ===');
    let n0 = await paper(page, 40000, 20000);
    const want = await paperMs(page, n0);
    await page.waitForTimeout(400); await page.reload(); await ready(page);
    let got = await page.evaluate(n0 => ({n: DB.answers.length, ms: DB.answers.slice(n0).map(a => a.ms), early: DB.answers.slice(0, 400).every((a, i) => a.ms === 5000 + i * 37)}), n0);
    check(want.length === 2 && want[0] >= 40000 && want[1] >= 20000, 'the paper\'s two answers carry their times', want);
    check(got.n === n0 + 2 && JSON.stringify(got.ms) === JSON.stringify(want) && got.early, 'after the reload: the 400 earlier answers and the paper\'s ms are back', got);

    console.log('\n=== 2 reload 20 ms after a paper (below the core\'s 150 ms; reported) ===');
    n0 = await paper(page, 30000, 10000);
    await page.waitForTimeout(20); await page.reload(); await ready(page);
    got = await page.evaluate(n0 => ({n: DB.answers.length - n0, ms: DB.answers.slice(n0).map(a => a.ms)}), n0);
    console.log(`  report  answers of the paper back after a 20 ms reload: ${got.n} of 2 (ms ${JSON.stringify(got.ms)})`);
    const base = await page.evaluate(() => DB.answers.length);

    console.log('\n=== 3 Export, then Import into a fresh profile ===');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => exportProgress())]);
    const file = path.join(__dirname, 'logs', 'export.json');
    await dl.saveAs(file);
    const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
    const expMs = exp.db.answers.map(a => a.ms === undefined ? null : a.ms);
    check(exp.db.answers.length === base, `the export holds every answer (${exp.db.answers.length})`, exp.db.answers.length);
    await page.evaluate(() => { window.__name = 'fresh'; askProfile(true); show('settings'); });
    check(await page.evaluate(() => PROFILE === 'fresh' && DB.answers.length === 0), 'the fresh profile starts empty');
    await page.setInputFiles('#fileIn', file); await page.waitForTimeout(500);
    got = await page.evaluate(() => DB.answers.map(a => a.ms === undefined ? null : a.ms));
    check(JSON.stringify(got) === JSON.stringify(expMs), `after Import: the same ${got.length} answers with the same ms`, got.length);

    console.log('\n=== 4 a profile switch ===');
    await page.evaluate(() => { window.__name = 'other'; askProfile(true); });
    n0 = await paper(page, 70000, 3000);
    const other = await paperMs(page, n0);
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__name = sessionStorage.getItem('first') || window.__first; askProfile(true); });
    const back = await page.evaluate(() => ({n: DB.answers.length, has70: DB.answers.some(a => a.ms >= 70000 && a.ms < 71000)}));
    await page.evaluate(() => { window.__name = 'other'; askProfile(true); });
    const o2 = await page.evaluate(() => DB.answers.map(a => a.ms));
    check(back.n === base && !back.has70, 'the first profile keeps its own answers, without the other profile\'s paper', back);
    check(JSON.stringify(o2) === JSON.stringify(other), 'the other profile keeps its own paper times', {o2, other});
    await page.evaluate(() => { window.__name = sessionStorage.getItem('first') || window.__first; askProfile(true); });

    for(const [label, make] of [['storage denied (setItem throws)', 'new Error("denied")'], ['storage full (QuotaExceededError)', 'new DOMException("full", "QuotaExceededError")']]){
      console.log(`\n=== 5 ${label} ===`);
      await page.reload(); await ready(page);
      const before = await stored(page), nBefore = await page.evaluate(() => DB.answers.length);
      await page.evaluate(make => { window.__set = Storage.prototype.setItem; Storage.prototype.setItem = function(){ throw eval(make); }; }, make);
      n0 = await paper(page, 50000, 5000);
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({warn: !!document.getElementById('savewarn'), text: (document.getElementById('savewarn') || {}).textContent || '',
        inMem: DB.answers.slice(-2).map(a => a.ms)}));
      check(r.warn && /did not save your progress/.test(r.text), 'the student is told the progress was not saved', r.text.slice(0, 90));
      check(r.inMem.length === 2 && r.inMem[0] >= 50000, 'the paper\'s times are kept in the page for this visit', r.inMem);
      check((await stored(page)) === before, 'the progress already stored is not overwritten');
      await page.evaluate(() => { Storage.prototype.setItem = window.__set; });
      await page.reload(); await ready(page);
      const after = await page.evaluate(() => DB.answers.length);
      check(after === nBefore, `after storage works again, the saved progress loads (${after} answers)`, {after, nBefore});
    }
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally { await browser.close(); }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
