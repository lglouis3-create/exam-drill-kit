/* One screenshot of "Plan the problem" written out, on the module's own course (agent-run). */
const path = require('path');
const L = require(path.join(process.argv[2], 'check_lib'));
(async () => {
  const {browser} = await L.launch('shot');
  const {ctx, page} = await L.openPage(browser, path.join(path.dirname(process.argv[2]), 'index.html'), {viewport: {width: 900, height: 1500}});
  await page.click('#nav button[data-v="eq"]'); await page.waitForTimeout(200);
  await page.screenshot({path: process.argv[3] + '/eq-card.png'});
  await page.evaluate(() => { const A = FX.api('plan-the-problem'); A.suStart('plan:all');
    const SU = A.state(); SU.queue = SU.queue.filter(q => q.id === 'plc-m4-n-clt'); SU.i = 0; A.render();
    const q = SU.queue[0], st = SU.page[q.id], el = s => document.querySelector('#v-eq ' + s).click();
    el(`[data-suask="${q.asks}"]`); el(`[data-suunit="${CSS.escape(st.unitOpts.find(u => A.normUnit(u) === A.normUnit(q.units)))}"]`);
    el(`[data-sumodel="${A.planModels(q).main}"]`); el(`[data-suopt="${st.options.findIndex(o => o.id === q.setup.eq)}"]`);
    el('[data-susheet="no"]'); A.planNeeded(q).forEach(i => el(`[data-sugiv="${i}"]`)); el('[data-sugivcheck]'); });
  await page.waitForTimeout(200);
  await page.screenshot({path: process.argv[3] + '/plan-written-out.png', fullPage: false});
  await ctx.close(); await browser.close();
})().catch(e => { console.log(e); process.exit(1); });
