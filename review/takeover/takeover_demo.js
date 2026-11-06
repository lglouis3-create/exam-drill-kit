/* import_test.js section A, "a writer closes without handing over": the take-over timing, shown on purpose.
 *
 * Tab d writes; tab t2 is read-only; d closes without handing over; t2 runs takeOver(false), which
 * waits for d's writer lock (core/shell.html claimWriter 'wait'). In WebKit job 128009951139 the
 * take-over was still waiting 20 s later ("precondition: the take-over finished" got "other"), and
 * the answer t2 then recorded read-only was not stored (the second failing check).
 *
 * Chromium frees a closed page's lock at once. A third page in the same browser context queues for
 * the same lock before d closes, so it holds the lock after d has gone: a stand-in for a closed page
 * whose lock the browser frees late. Cases:
 *   none      no third page (the lock is freed when d closes)
 *   late      the third page holds the lock 25 s
 *   never     the third page never frees it
 *   broken    no third page, but t2's take-over is broken (claimWriter never settles)
 * For each, the old wait (WRITER 'held' within 20 s) and the new one (import_test.js tookOver: the lock
 * free of every other holder within 60 s, then WRITER 'held' within 6 s) are reported, with whether
 * t2's next answer is stored.
 *
 * Usage: DRILL_PAGE=<built index.html> node takeover_demo.js <kit>/core [case ...]
 */
const path = require('path');
const L = require(path.join(path.resolve(process.argv[2]), 'check_lib.js'));
const CASES = process.argv.slice(3).length ? process.argv.slice(3) : ['none', 'late', 'never', 'broken'];

// the same wait as import_test.js tookOver
const newWait = t => t.evaluate(async () => {
  const name = NS + ':writer:' + PROFILE, t0 = Date.now(), mine = [];
  const q0 = await navigator.locks.query();
  for(const l of q0.pending || []) if(l.name === name) mine.push(l.clientId);
  let freeAt = null;
  for(;;){
    if(WRITER === 'held') return {ok: true, ms: Date.now() - t0, freeMs: freeAt === null ? null : freeAt - t0};
    const q = await navigator.locks.query(), held = (q.held || []).filter(l => l.name === name);
    const free = !mine.length || held.length === 0 || held.every(h => mine.includes(h.clientId));
    if(free && freeAt === null) freeAt = Date.now();
    if(freeAt !== null && Date.now() - freeAt > 6000) return {ok: false, why: 'the lock was free, but the take-over did not finish within 6 s', writer: WRITER, ms: Date.now() - t0};
    if(freeAt === null && Date.now() - t0 > 60000) return {ok: false, why: 'another holder kept the writer lock for 60 s', writer: WRITER, held: held.length, ms: Date.now() - t0};
    await new Promise(res => setTimeout(res, 50));
  }
});

(async () => {
  const {browser} = await L.launch('takeover_demo.js');
  const url = await L.pageUrl(L.PAGE.PAGE);
  for(const kind of CASES) for(const wait of ['old', 'new']){
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const open = async () => { const p = await ctx.newPage(); p.on('dialog', x => x.accept().catch(() => {}));
      await p.goto(url); await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); return p; };
    const d = await open();
    await d.waitForFunction(() => WRITER === 'held', null, {timeout: 5000});
    await d.evaluate(() => { for(let i = 0; i < 2; i++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[i % QUESTIONS.length], 'correct', undefined, 1000); } saveNow(); });
    const t2 = await open();
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    let h = null;
    if(kind === 'late' || kind === 'never'){
      h = await ctx.newPage(); await h.goto(url);
      await h.waitForFunction(() => typeof NS !== 'undefined', null, {timeout: 15000});
      // queued behind d: it holds the lock once d has gone
      await h.evaluate(ms => { const name = NS + ':writer:' + PROFILE;
        navigator.locks.request(name, () => ms === null ? new Promise(() => {}) : new Promise(r => setTimeout(r, ms))); }, kind === 'late' ? 25000 : null);
      await h.waitForTimeout(200);
    }
    if(kind === 'broken') await t2.evaluate(() => { window.claimWriter = () => new Promise(() => {}); });
    const last = await d.evaluate(() => { record(QUESTIONS[6 % QUESTIONS.length], 'correct', undefined, 1000); saveNow(); return DB.answers[DB.answers.length - 1].at; });
    await d.close();
    const t0 = Date.now();
    await t2.evaluate(() => takeOver(false));
    let res;
    if(wait === 'old'){
      await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 20000}).catch(() => {});
      const w = await t2.evaluate(() => WRITER);
      res = {ok: w === 'held', writer: w, ms: Date.now() - t0};
    } else res = await newWait(t2);
    const mine = await t2.evaluate(() => { const n = DB.answers.length; record(QUESTIONS[7 % QUESTIONS.length], 'correct', undefined, 1000); saveNow(); return DB.answers.length > n ? DB.answers[DB.answers.length - 1].at : null; });
    await t2.waitForTimeout(300);
    const stored = await t2.evaluate(([a, b]) => { const s = JSON.parse(localStorage.getItem(keyFor(PROFILE)) || '{"answers":[]}');
      return {last: s.answers.some(x => x.at === a), next: b !== null && s.answers.some(x => x.at === b)}; }, [last, mine]);
    console.log(`${kind.padEnd(7)} ${wait} wait: take-over finished ${res.ok ? 'yes' : 'NO'} ${JSON.stringify(res)}; stored ${JSON.stringify(stored)}`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
