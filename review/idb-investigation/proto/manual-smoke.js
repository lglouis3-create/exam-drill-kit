// Clicks the buttons of manual-plus.html in Chromium, as Louis would, and prints the output lines.
// Usage: node manual-smoke.js   (Chromium only: it caps the quota at 5 MB with the DevTools protocol)
const pw = require('playwright');
const { start } = require('./server2');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await pw.chromium.launch(); const { server, port } = await start(); const origin = 'http://localhost:' + port;
  const ctx = await b.newContext();
  const np = async () => { const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.errs = errs; await p.goto(origin + '/manual-plus.html'); return p; };
  const top = (p) => p.$eval('#out', (e) => e.textContent.split('\n')[0]);
  const click = async (p, id, waitFor) => { await p.click('#' + id); const end = Date.now() + 60000; while (Date.now() < end) { const t = await top(p); if (!waitFor || waitFor.test(t)) return t; await sleep(100); } return 'TIMEOUT ' + await top(p); };
  const p1 = await np();
  const cdp = await ctx.newCDPSession(p1); await cdp.send('Storage.overrideQuotaForOrigin', { origin, quotaSize: 5 * 1048576 });
  console.log('Probe ->', (await click(p1, 'probe', /^Probe/)).slice(0, 160));
  console.log('Fill until refused ->', await click(p1, 'qfill', /^Fill:|^Fill failed/));
  console.log('Both stores at once ->', await click(p1, 'qpair', /^Both stores/));
  console.log('Delete quota test data ->', await click(p1, 'qclean', /^Delete/));
  console.log('Upgrade: prepare v1 ->', await click(p1, 'uprep', /^Prepare/));
  const p2 = await np();
  console.log('Hold v1 (old tab), tab 2 ->', await click(p2, 'uhold', /^Old tab:/));
  await p1.click('#ustart'); await sleep(1500);
  console.log('status in tab 1 while tab 2 holds v1 ->', await p1.$eval('#status', (e) => e.textContent));
  console.log('Old tab: state, tab 2 ->', await click(p2, 'uholdstate', /^Old tab state/));
  await p2.close(); await sleep(4000);
  console.log('status in tab 1 after tab 2 closed ->', await p1.$eval('#status', (e) => e.textContent));
  await p1.close();
  const p3 = await np();
  console.log('Upgrade: check ->', await click(p3, 'ucheck', /^Upgrade check|^Check failed/));
  console.log('Upgrade: finish ->', await click(p3, 'ufinish', /^Upgrade finish|^Finish failed/));
  console.log('Run for 20 s button present ->', !!(await p3.$('#run20')));
  console.log('page errors ->', JSON.stringify([...p1.errs, ...p3.errs]));
  await p3.evaluate(() => deleteDB(UDB));
  await ctx.close(); await b.close(); server.close();
})();
