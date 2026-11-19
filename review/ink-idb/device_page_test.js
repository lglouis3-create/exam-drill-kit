/* Checks the phone and tablet validation page (device-page/index.html) in Chromium by pressing its buttons:
 *   - the sample sequence of the README (prepare, run 3 rounds of 5 saves, reload, check) for the samples of
 *     0, 69 and 171 pages in order, with no "Clean up" between: every sample ends with exactly its own pages
 *     (0, 69, 171), its own strokes, and a manifest that reads PASS;
 *   - the storage-full test with a planted QuotaExceededError: a refusal passes, a write that ends in another
 *     state fails.
 * Not part of run_checks.sh (it needs the built device page and takes about 4 minutes):
 *     TMPDIR=/dev/shm NODE_PATH=$(npm root -g) node review/ink-idb/device_page_test.js [path of index.html]
 */
const path = require('path');
const L = require('../../core/check_lib');
const NAME = 'device_page_test.js';
const {check} = L;
const DEV = path.resolve(process.argv[2] || path.join(__dirname, 'device-page', 'index.html'));
(async () => {
  const {browser} = await L.launch(NAME);
  const url = await L.pageUrl(DEV);
  const fresh = async init => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    if(init) await ctx.addInitScript(init);
    const page = await ctx.newPage(); page.on('dialog', d => d.accept().catch(() => {}));
    await page.goto(url); await page.waitForSelector('#vpanel'); await page.evaluate(() => outsideReady());
    return {ctx, page};
  };
  const last = page => page.evaluate(() => window.__vres[window.__vres.length - 1]);
  const reloadPage = async page => { await page.reload(); await page.waitForSelector('#vpanel'); await page.evaluate(() => outsideReady()); };
  const statement = await (async () => { const {ctx, page} = await fresh(); const t = await page.evaluate(() => document.querySelector('#vpanel').textContent); await ctx.close(); return t; })();
  check(/does not use a worksheet's draw or erase/.test(statement), 'the panel says that its writes are direct, not a worksheet draw or erase', null);
  // the sample sequence, no Clean up between
  {
    const {ctx, page} = await fresh();
    const expect = {0: {pages: 0, strokes: 0}, 69: {pages: 69, strokes: 69 * 30 + 15}, 171: {pages: 171, strokes: 171 * 30 + 15}};
    for(const n of [0, 69, 171]){
      await page.click(`[data-s="${n}"]`);
      await page.waitForFunction(() => /^prepared/.test(document.querySelector('#vstate').textContent), null, {timeout: 180000});
      await page.click('#vrun');
      await page.waitForFunction(() => /^done/.test(document.querySelector('#vstate').textContent), null, {timeout: 300000});
      await reloadPage(page);
      await page.click('#vcheck');
      await page.waitForFunction(() => window.__vres[window.__vres.length - 1].step === 'after reload', null, {timeout: 20000});
      const r = await last(page), e = expect[n];
      check(r.pages === e.pages && r.strokes === e.strokes, `sample ${n}: after reload exactly ${e.pages} pages and ${e.strokes} strokes (the earlier samples' pages are not carried)`, {pages: r.pages, strokes: r.strokes});
      check(r.manifest && r.manifest.verdict === 'PASS', `sample ${n}: the manifest recorded before the saves matches after the reload`, r.manifest);
      check(/^PASS/.test(await page.evaluate(() => document.querySelector('#vstate').textContent)), `sample ${n}: the panel shows a PASS line`, await page.evaluate(() => document.querySelector('#vstate').textContent));
      check(!r.states.some(s => s !== 'saved'), `sample ${n}: every page is saved`, r.states);
    }
    // a changed answer is reported as FAIL (the manifest holds a hash of the answer list)
    await page.evaluate(() => { DB.answers[5] = Object.assign({}, DB.answers[5], {at: DB.answers[5].at + 1}); save(); saveNow(); });
    await page.waitForTimeout(800); await reloadPage(page);
    await page.click('#vcheck'); await page.waitForFunction(() => window.__vres[window.__vres.length - 1].step === 'after reload', null, {timeout: 20000});
    const ans = await last(page);
    check(ans.manifest && ans.manifest.verdict === 'FAIL' && ans.manifest.answersChanged === true && ans.manifest.expectedAnswers === ans.manifest.foundAnswers, 'a changed answer (same count) is reported as FAIL', ans.manifest);
    // a changed page is reported: change one stored stroke, reload, check
    await page.evaluate(() => { const k = Object.keys(DB.ink)[3]; DB.ink[k] = JSON.parse(JSON.stringify(DB.ink[k])); DB.ink[k].parts.work[0].w = 0.5; save(); saveNow(); });
    await page.waitForTimeout(800); await reloadPage(page);
    await page.click('#vcheck'); await page.waitForFunction(() => window.__vres[window.__vres.length - 1].step === 'after reload', null, {timeout: 20000});
    const bad = await last(page);
    check(bad.manifest && bad.manifest.verdict === 'FAIL' && bad.manifest.changed.length === 1, 'a stroke changed after the manifest was recorded is reported as FAIL with the page named', bad.manifest);
    await ctx.close();
  }
  // storage-full test: a planted QuotaExceededError is a real refusal (PASS); another error is not (FAIL)
  for(const [name, err, want] of [['QuotaExceededError', 'QuotaExceededError', 'PASS'], ['another error', 'DataError', 'FAIL']]){
    const {ctx, page} = await fresh(`(() => { const put = IDBObjectStore.prototype.put; let n = 0;
      IDBObjectStore.prototype.put = function(v, k){ if(this.name === 'parts' && typeof k === 'string' && k.includes('fill') && ++n > 3) throw new DOMException('planted', ${JSON.stringify(err)}); return put.apply(this, arguments); }; })();`);
    await page.click('[data-s="69"]');
    await page.waitForFunction(() => /^prepared/.test(document.querySelector('#vstate').textContent), null, {timeout: 180000});
    await page.click('#vquota');
    await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.querySelector('#vstate').textContent), null, {timeout: 120000});
    const r = await last(page);
    check(r.step === 'storage full' && r.verdict === want, `storage-full test with ${name}: the verdict is ${want}`, {verdict: r.verdict, first: r.firstRefusedState, other: r.otherState});
    if(want === 'PASS'){
      check(r.storedManifestAfterRefusal && r.storedManifestAfterRefusal.verdict === 'PASS', 'storage-full test: the pages stored before the test still match their manifest in the database after the refusal', r.storedManifestAfterRefusal);
      await reloadPage(page); await page.click('#vcheck');
      await page.waitForFunction(() => window.__vres[window.__vres.length - 1].step === 'after reload', null, {timeout: 20000});
      const c = await last(page);
      check(c.manifest && c.manifest.verdict === 'PASS' && c.manifest.mode === 'contains', 'storage-full test: after a reload every page stored before the test is there', c.manifest);
    }
    await ctx.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: ${e && e.stack || e}`); process.exit(1); });
