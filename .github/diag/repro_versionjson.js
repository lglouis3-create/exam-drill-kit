/* DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-webkit-diag): the page's update
 * check (views.js checkForUpdate, a fetch of version.json) made to fail on purpose, to
 * see what the browser reports and whether the page handles the failure itself.
 *
 * The page is opened from the test server with its service worker in control, as in
 * offline_test.js. Each case calls checkForUpdate() once and then:
 *   ok            the server answers at once (the control: nothing should be reported)
 *   down          the server drops the connection
 *   slow-reload   the server is slow (8 s) and the page reloads while the fetch waits
 *   slow-wait     the server is slow and the page waits 9 s for the answer
 * For each case it records the Playwright 'pageerror' messages, the page's own 'error'
 * and 'unhandledrejection' events, and the outcome of the fetch (resolved, rejected).
 * The update check's promise chain ends in .catch(() => {}); a rejection that chain did
 * not catch would raise 'unhandledrejection', so a rejected fetch with no such event
 * means the page handled it. views.js is not changed. One "REPRO {json}" line per case.
 * Nothing is retried.
 */
const path = require('path');
const L = require('./check_lib');
const NAME = 'repro_versionjson.js';
L.PAGE.need(NAME);
const FILE = path.basename(L.PAGE.PAGE);

(async () => {
  const {browser} = await L.launch(NAME);
  const S = await L.serve(L.PAGE.SITE, {slowMs: 8000});
  const out = [];
  for(const kase of ['ok', 'down', 'slow-reload', 'slow-wait']){
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    await ctx.addInitScript(() => {
      const push = r => { try { const a = JSON.parse(sessionStorage.getItem('__repro') || '[]'); a.push(Object.assign({at: Date.now()}, r)); sessionStorage.setItem('__repro', JSON.stringify(a)); } catch(e){} };
      window.addEventListener('error', e => push({kind: 'window-error', message: String(e.message || '')}));
      window.addEventListener('unhandledrejection', e => push({kind: 'unhandledrejection', reason: String(e.reason && (e.reason.message || e.reason))}));
      const realFetch = window.fetch;
      window.fetch = function(input){
        const url = String(input && input.url || input), p = realFetch.apply(this, arguments);
        if(/version\.json/.test(url)) p.then(r => push({kind: 'fetch-resolved', status: r.status}), e => push({kind: 'fetch-rejected', error: String(e && e.message || e)}));
        return p;
      };
    });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    S.mode = 'ok';
    await page.goto(S.url + FILE);
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 20000}).catch(() => {});
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForTimeout(6000);                       // the page's own 5 s check, with the server up
    const before = pageErrors.length;
    S.mode = kase === 'down' ? 'down' : kase.startsWith('slow') ? 'slow' : 'ok';
    await page.evaluate(() => { window.__checkCalled = Date.now(); checkForUpdate(); });
    if(kase === 'slow-reload'){ await page.waitForTimeout(300); S.mode = 'ok'; await page.reload().catch(() => {}); await page.waitForTimeout(3000); }
    else if(kase === 'slow-wait'){ await page.waitForTimeout(9000); S.mode = 'ok'; }
    else { await page.waitForTimeout(3000); S.mode = 'ok'; }
    const log = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__repro') || '[]')).catch(e => [{error: String(e)}]);
    const rec = {browser: L.BROWSER, case: kase, pageErrorsDuringCase: pageErrors.slice(before), pageErrorsBefore: pageErrors.slice(0, before),
      pageEvents: log};
    out.push(rec);
    console.log('REPRO ' + JSON.stringify(rec));
    await ctx.close();
  }
  await S.close();
  await browser.close();
  console.log(`PASS: ${NAME}: ${out.length} cases recorded (a record, not a check)`);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
