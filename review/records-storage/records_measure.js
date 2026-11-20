// Measures what the per-tab record (kit #45) costs in localStorage, and reproduces an Import
// refused while a reloaded tab's earlier record still waits for its 60 s cleanup.
// Run from a built scratch course's src/: node <this file> <progress characters> [forced-quota]
// Chromium, the kit's check_lib. Reads and writes only that scratch course's own origin.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
const src = process.cwd();
const L = require(path.join(src, 'check_lib.js'));
const P = +(process.argv[2] || 1475679);
const FORCED = process.argv[3] ? +process.argv[3] : null;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
// characters per key class, as the browser stores them (key + value)
const SIZES = () => {
  const by = {}; let total = 0;
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i), v = localStorage.getItem(k) || '', n = k.length + v.length;
    total += n;
    const cls = k.includes(':pending-seen:') ? 'pending-seen' : k.includes(':pending:') ? 'pending:' + k.split(':').slice(-1)[0].slice(0, 14) : k.includes(':data:') ? 'data:' + k.split(':data:')[1] : k.includes(':log:') ? 'log' : k.includes(':backup:') ? 'backup' : 'other';
    by[cls] = (by[cls] || 0) + n;
  }
  return {total, by};
};
const QUOTA = q => {
  // a forced quota on the whole origin, the way core/storage_test.js and history_test.js force one
  if(!q) return;
  const real = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    let total = 0;
    for(let i = 0; i < this.length; i++){ const kk = this.key(i); if(kk !== k) total += kk.length + (this.getItem(kk) || '').length; }
    if(total + String(k).length + String(v).length > q) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return real.call(this, k, v);
  };
};
(async () => {
  const {browser} = await L.launch('records_measure');
  const {ctx, page, errors} = await L.openFile(browser, {}, FORCED ? `(${QUOTA.toString()})(${FORCED})` : null);
  await page.waitForFunction(() => typeof DB === 'object' && typeof saveNow === 'function' && WRITER === 'held', null, {timeout: 15000});
  const step = async label => { const s = await page.evaluate(SIZES); log(label, JSON.stringify(s)); return s; };
  // progress of about P characters: two answers and a module-style part (as ink is kept in DB)
  const r = await page.evaluate(P => {
    record(QUESTIONS[0], 'correct', undefined, 1000); record(QUESTIONS[1 % QUESTIONS.length], 'wrong', undefined, 1000);
    DB.ink = ''; const base = JSON.stringify(DB).length;
    DB.ink = 'i'.repeat(Math.max(0, P - base));
    let ok = true; try { saveNow(); } catch(e){ ok = false; }
    return {progressChars: JSON.stringify(DB).length, profile: PROFILE, ok, failed: [...FAILED]};
  }, P);
  log('progress written', JSON.stringify(r));
  const s0 = await step('steady state');
  // reload: the page gets a new tab id, so a new record key; the earlier record waits for cleanup
  await page.reload();
  await page.waitForFunction(() => typeof DB === 'object' && WRITER === 'held', null, {timeout: 15000});
  const r1 = await page.evaluate(() => { record(QUESTIONS[2 % QUESTIONS.length], 'correct', undefined, 1000); let ok = true; try { saveNow(); } catch(e){ ok = false; } return {ok, failed: [...FAILED], recOff: typeof REC_OFF !== 'undefined' ? REC_OFF : null}; });
  log('answer after reload', JSON.stringify(r1));
  const s1 = await step('after reload and one save');
  // Import a file of another profile with progress of the same size, through the page's own Import
  const file = path.join(os.tmpdir(), 'records-import-' + process.pid + '.json');
  const other = await page.evaluate(() => ({app: 'exam-drill', course: COURSE.id, ns: NS, exported: new Date().toISOString(), profile: 'Other', db: JSON.parse(JSON.stringify(DB)), log: []}));
  other.db.answers = other.db.answers.map((a, i) => Object.assign({}, a, {at: a.at - 86400000 * (i + 1)}));   // a different record, not this profile's
  fs.writeFileSync(file, JSON.stringify(other));
  const imp = async label => {
    await page.evaluate(() => show('settings'));
    await page.setInputFiles('#fileIn', file);
    await page.waitForFunction(() => { const b = document.getElementById('importPlan'); return b && b.textContent.trim(); }, null, {timeout: 10000}).catch(() => {});
    const go = await page.$('#importGo');
    if(go){ await go.click(); await page.waitForSelector('#importResult', {timeout: 10000}).catch(() => {}); }
    const txt = await page.evaluate(() => { const b = document.getElementById('importPlan'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
    const stored = await page.evaluate(() => { const k = Object.keys(localStorage).find(k => /:data:Other/.test(k)); return k ? localStorage.getItem(k).length : null; });
    log(label, JSON.stringify({offered: !!go, storedOtherChars: stored, result: txt.slice(0, 260)}));
    return {offered: !!go, stored, txt};
  };
  const i1 = await imp('Import within the minute after the reload');
  await step('after that Import');
  // wait for the earlier record's cleanup (60 s after it was first found proven, then a check)
  const t0 = Date.now();
  let gone = null;
  while(Date.now() - t0 < 100000){
    await page.waitForTimeout(5000);
    const s = await page.evaluate(SIZES);
    const recs = Object.keys(s.by).filter(k => k.startsWith('pending:'));
    if(recs.length <= 1){ gone = Math.round((Date.now() - t0) / 1000); log(`earlier record removed about ${gone} s after the post-reload save`, JSON.stringify(s)); break; }
  }
  if(gone === null) log('earlier record still there after 100 s');
  const i2 = i1.stored ? null : await imp('Import again after the cleanup');
  await step('end');
  log('page errors', JSON.stringify(errors.slice(0, 3)));
  console.log('SUMMARY ' + JSON.stringify({P, forcedQuota: FORCED, progressChars: r.progressChars,
    steady: s0.total, steadyRatio: +(s0.total / r.progressChars).toFixed(2), afterReload: s1.total, afterReloadRatio: +(s1.total / r.progressChars).toFixed(2),
    importInMinute: {stored: i1.stored, refused: !i1.stored}, cleanupSeconds: gone, importAfter: i2 && {stored: i2.stored}}));
  fs.rmSync(file, {force: true});
  await ctx.close(); await browser.close();
})().catch(e => { console.log('FAILED: ' + e.stack); process.exit(1); });
