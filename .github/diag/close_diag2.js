/* DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-pendingsave-diag; never merged).
 * In run 41596257855 (WebKit, ab7df8b) page.close({runBeforeUnload: true}) returned but the page's
 * 'close' event did not come within 900 s. This tries four ways of leaving the page, N trials each,
 * with the 150 ms save timer unable to fire (its delay made an hour, as storage_test.js does), and
 * records for each: whether 'close' came within 10 s, and whether the answer reached storage
 * (read from a second page of the same context opened beforehand, polled for 5 s).
 *   A  page.close({runBeforeUnload: true})      B  page.close()
 *   C  page.goto('about:blank'), then close()   D  A, with the timer left as it is
 *   E  A, then ctx.newPage() and a load of the drill in it, each within 15 s ("opened")
 * Run from the built course's src folder:  node close_diag2.js <trials>
 */
const L = require('./check_lib');
L.PAGE.need('close_diag2.js');
const NO_TIMER = () => { const real = window.setTimeout; window.setTimeout = function(f, d, ...a){ return real.call(this, f, d === 150 ? 3600000 : d, ...a); }; };
const ANSWER = () => { window.answerNow = () => {
  for(let i = 0; i < 60; i++){ startQuiz(TOPICS[i % TOPICS.length].id); if(Q.current && document.querySelector('#v-quiz button[data-o]')) break; }
  const q = Q.current;
  if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
  else document.querySelector('#v-quiz button[data-o]').click();
  return DB.answers.length; }; };
(async () => {
  const {browser} = await L.launch('close_diag2.js');
  const url = await L.pageUrl(L.PAGE.PAGE), N = +process.argv[2] || 10;
  const ready = p => p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 30000});
  const res = {};
  for(const way of ['A', 'B', 'C', 'D', 'E']){
    res[way] = {closed: 0, stored: 0, trials: 0, ms: [], opened: 0};
    for(let i = 0; i < N; i++){
      const ctx = await browser.newContext(L.OPEN_CTX);
      await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
      await ctx.addInitScript(ANSWER);
      if(way !== 'D') await ctx.addInitScript(NO_TIMER);
      const page = await ctx.newPage(); await page.goto(url); await ready(page);
      const watch = await ctx.newPage(); await watch.goto('about:blank');   // same context, never loads the drill
      await watch.goto(url.replace(/[^/]*$/, '') + 'version.json').catch(() => {});   // same origin, no drill code
      const k = await page.evaluate(() => keyFor(PROFILE));
      const n = await page.evaluate(() => { answerNow(); return DB.answers.length; });
      const closed = new Promise(r => page.once('close', () => r(true)));
      const t0 = Date.now();
      if(way === 'A' || way === 'D' || way === 'E') await page.close({runBeforeUnload: true});
      else if(way === 'B') await page.close();
      else { await page.goto('about:blank'); await page.close(); }
      const c = await Promise.race([closed, new Promise(r => setTimeout(() => r(false), 10000))]);
      const s = await watch.waitForFunction(([k, n]) => (JSON.parse(localStorage.getItem(k) || '{}').answers || []).length >= n, [k, n], {timeout: 5000, polling: 20})
        .then(() => true, () => false);
      res[way].trials++; if(c) res[way].closed++; if(s){ res[way].stored++; res[way].ms.push(Date.now() - t0); }
      if(way === 'E'){
        const within = (p, ms) => Promise.race([p.then(() => true, () => false), new Promise(r => setTimeout(() => r(false), ms))]);
        let p3 = null;
        const o1 = await within(ctx.newPage().then(p => { p3 = p; }), 15000);
        const o2 = o1 && await within(p3.goto(url).then(() => ready(p3)), 15000);
        if(o1 && o2) res[way].opened++;
        else console.log(`  E trial ${i + 1}: newPage ${o1 ? 'opened' : 'did not open within 15 s'}${o1 ? (o2 ? '' : '; the drill did not load within 15 s') : ''}`);
      }
      await ctx.close().catch(() => {});
    }
    console.log(`CLOSE2 ${L.BROWSER_NAME} way ${way}: ${JSON.stringify(res[way])}`);
  }
  await browser.close();
})().catch(e => { console.log('CLOSE2 stopped: ' + e.message); process.exit(1); });
