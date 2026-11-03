/* DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-import-diag; never merged).
 * Measures, on the course page as import_test.js opens it, what one tab reads from localStorage
 * right after another tab of the same browser saved: the case of import_test.js's checks
 * "a tab whose profile another tab has saved since" and "the other tab saving after the plan
 * was shown". Each trial: a new context; tab 1 opens the page, then tab 2; tab 2 records three
 * answers and saves them with store.set (as import_test.js's answer() does); tab 1 reads the key
 * in the next call. When tab 1 reads anything but what tab 2 wrote, the trial is printed with
 * what tab 1 read and the milliseconds until it read tab 2's value (polled every millisecond).
 * Run from the built course's src folder:  node xtab.js <trials>
 */
const L = require('./check_lib');
const NAME = 'xtab.js';
L.PAGE.need(NAME);
(async () => {
  const {browser} = await L.launch(NAME);
  const url = await L.pageUrl(L.PAGE.PAGE), N = +process.argv[2] || 100;
  const ready = p => p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 30000});
  let late = 0; const ms = [];
  for(let i = 1; i <= N; i++){
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const t1 = await ctx.newPage(); await t1.goto(url); await ready(t1);
    const t2 = await ctx.newPage(); await t2.goto(url); await ready(t2);
    const k = await t1.evaluate(() => keyFor(PROFILE));
    const wrote = await t2.evaluate(() => {
      for(let j = 0; j < 3; j++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[j], 'correct', undefined, 1000); }
      clearTimeout(saveTimer); saveTimer = null; store.set(keyFor(PROFILE), JSON.stringify(DB));
      return {v: localStorage.getItem(keyFor(PROFILE)), k: keyFor(PROFILE)};
    });
    const t0 = Date.now();
    const read = await t1.evaluate(k => localStorage.getItem(k), k);
    if(read !== wrote.v){
      late++;
      await t1.waitForFunction(([k, v]) => localStorage.getItem(k) === v, [k, wrote.v], {timeout: 20000, polling: 1}).catch(() => {});
      const d = Date.now() - t0; ms.push(d);
      console.log(`LATE trial ${i}: tab 1 read ${read === null ? 'nothing (null)' : read.length + ' characters'}, tab 2 had written ${wrote.v.length}` +
                  ` (same key: ${k === wrote.k}); tab 1 read tab 2's value after ${d} ms`);
    }
    await ctx.close();
  }
  console.log(`XTAB ${N} trials: tab 1 read an earlier value right after tab 2's save in ${late}; ms until it read tab 2's value: [${ms.join(', ')}]`);
  await browser.close();
})().catch(e => { console.log('XTAB stopped: ' + e.message); process.exit(1); });
