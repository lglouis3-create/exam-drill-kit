/* DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-pendingsave-diag; never merged).
 * storage_test.js's check "an answer followed at once by closing the tab is kept" failed once in
 * WebKit (run 41593159353, cf9096b): the tab opened right after the close showed 1 answer, not 2.
 * Each trial here: a new context; the page opens; one answer (answerNow, as storage_test.js);
 * the tab is closed at once (runBeforeUnload, as the test); a new tab opens at once. Printed for a
 * trial whose new tab does not show the answer at load: what it showed, and the milliseconds until
 * its localStorage holds the answer (polled every 10 ms for 5 s) or "never".
 * Run from the built course's src folder:  node close_diag.js <trials>
 */
const L = require('./check_lib');
const NAME = 'close_diag.js';
L.PAGE.need(NAME);
const ANSWER_NOW = () => {
  window.answerNow = () => {
    startQuiz(TOPICS[0].id);
    const q = Q.current;
    if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
    else document.querySelector('#v-quiz button[data-o]').click();
    return DB.answers.length;
  };
};
(async () => {
  const {browser} = await L.launch(NAME);
  const url = await L.pageUrl(L.PAGE.PAGE), N = +process.argv[2] || 50;
  let missedAtLoad = 0, late = 0, never = 0; const ms = [];
  for(let i = 1; i <= N; i++){
    const {ctx, page} = await L.openFile(browser, {}, ANSWER_NOW);
    const k = await page.evaluate(() => keyFor(PROFILE));
    const before = await page.evaluate(() => { answerNow(); return {n: DB.answers.length, waiting: !!saveTimer}; });
    await page.close({runBeforeUnload: true});
    const p2 = await ctx.newPage();
    await p2.goto(url);
    await p2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const t0 = Date.now();
    const atLoad = await p2.evaluate(k => ({db: DB.answers.length, stored: (JSON.parse(localStorage.getItem(k) || '{}').answers || []).length}), k);
    if(atLoad.db !== before.n){
      missedAtLoad++;
      const got = await p2.waitForFunction(([k, n]) => (JSON.parse(localStorage.getItem(k) || '{}').answers || []).length >= n, [k, before.n], {timeout: 5000, polling: 10})
        .then(() => Date.now() - t0, () => null);
      if(got === null) never++; else { late++; ms.push(got); }
      console.log(`MISSED trial ${i}: before the close ${JSON.stringify(before)}; the new tab at load ${JSON.stringify(atLoad)}; ` +
                  (got === null ? 'its storage never held the answer within 5 s' : `its storage held the answer ${got} ms after load`));
    }
    await ctx.close();
  }
  console.log(`CLOSE ${L.BROWSER_NAME} ${N} trials: the new tab lacked the answer at load in ${missedAtLoad}; it arrived later in ${late} (ms: [${ms.join(', ')}]); never in ${never}`);
  await browser.close();
})().catch(e => { console.log('CLOSE stopped: ' + e.message); process.exit(1); });
