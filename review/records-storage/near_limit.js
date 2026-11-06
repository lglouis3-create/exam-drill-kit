// Kit #66 review item M2: just below the size at which the per-tab record fits (about 2,621,430
// characters of progress on an empty origin), the minute after a reload can refuse the progress
// save itself, because the earlier page's record still takes its room. This script shows it and
// when it ends. Run from a built scratch course's src/: node <this file> [progress characters]
// Chromium, the kit's check_lib, the browser's own localStorage limit (no forced quota).
'use strict';
const path = require('path');
const L = require(path.join(process.cwd(), 'check_lib.js'));
const P = +(process.argv[2] || 2621000);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const STATE = () => {
  const k = Object.keys(localStorage), d = k.find(x => x.endsWith(':data:' + PROFILE));
  let stored = null; try { stored = JSON.parse(localStorage.getItem(d)).answers.length; } catch(e){}
  const n = document.querySelector('#savewarn, .savewarn');
  return {pageAnswers: DB.answers.length, storedAnswers: stored, records: k.filter(x => x.includes(':pending:')).length,
    failed: [...FAILED], recOff: REC_OFF, notice: n ? n.textContent.replace(/\s+/g, ' ').trim().slice(0, 170) : null};
};
(async () => {
  const {browser} = await L.launch('near_limit');
  const {ctx, page} = await L.openFile(browser);
  const ready = () => page.waitForFunction(() => typeof DB === 'object' && typeof saveNow === 'function' && WRITER === 'held', null, {timeout: 15000});
  await ready();
  const answer = i => page.evaluate(i => { record(QUESTIONS[i % QUESTIONS.length], 'correct', undefined, 1000); try { saveNow(); } catch(e){} }, i);
  await page.evaluate(P => { record(QUESTIONS[0], 'correct', undefined, 1000); record(QUESTIONS[1 % QUESTIONS.length], 'wrong', undefined, 1000);
    DB.ink = ''; DB.ink = 'i'.repeat(Math.max(0, P - JSON.stringify(DB).length)); saveNow(); }, P);
  log('before the reload', JSON.stringify(await page.evaluate(STATE)));
  await page.reload(); await ready();
  await answer(2);
  const t0 = Date.now();
  log('one answer after the reload', JSON.stringify(await page.evaluate(STATE)));
  let n = 3;
  while(Date.now() - t0 < 120000){
    await page.waitForTimeout(10000);
    await answer(n++);
    const s = await page.evaluate(STATE);
    log(`another answer, ${Math.round((Date.now() - t0) / 1000)} s after the first`, JSON.stringify(s));
    if(s.storedAnswers === s.pageAnswers){ log(`SUMMARY ${JSON.stringify({P, savedAgainAfterSeconds: Math.round((Date.now() - t0) / 1000)})}`); break; }
  }
  await ctx.close(); await browser.close();
})().catch(e => { console.log('FAILED: ' + e.stack); process.exit(1); });
