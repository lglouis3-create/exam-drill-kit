/* DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-webkit-diag): offline_test.js's
 * service-worker phases, in the same order and with the same timings, with records
 * added, to find why two WebKit runs failed on 2026-11-02 (jobs 125585950320 and
 * 125585978252). Copied into a scratch course's src/ by .github/diag/run.sh, beside
 * check_lib.js, and run there in the browser DRILL_BROWSER names; sw.js in that course
 * has .github/diag/sw_diag.js appended, which logs what the worker does.
 *
 * It records, per run (one "DIAG {json}" line at the end):
 *   - the server's timeline: every request with its time, the server's mode then
 *     (ok, down, slow), the path and the request's Sec-Fetch-Mode and -Dest;
 *   - every phase change, with its time;
 *   - before the slow reload: the controlling worker (script URL, state), the
 *     registration's active, waiting and installing workers, the saved drill page
 *     (present, ETag) and the page's URL;
 *   - after it: the navigation's timing entry (workerStart, responseStart, type) and
 *     whether the newer page (#deploy-2) is on screen;
 *   - the worker's own log (sw_diag.js): fetch events for navigations, and for the drill
 *     page whether the NET_TIMEOUT timer fired, which side won, what was served;
 *   - in the page: every 'error' and 'unhandledrejection' event, and every fetch of
 *     version.json with its outcome, kept in sessionStorage across reloads;
 *   - every Playwright 'pageerror', with its time and the server's mode then.
 *   - every failed request (Playwright 'requestfailed', with WebKit's reason), every
 *     frame navigation, every console error and a page crash, with the time;
 *   - when the navigation after the server comes back up fails, that error, the
 *     worker's state and the saved copy at that moment; then, for the diagnosis only, one
 *     more navigation (recorded as such), so the rest of the run is still observed;
 *   - DIAG_WAIT_AFTER_UP (ms, default 0): a pause between the server coming back up and
 *     that navigation, to tell a race from a lasting state (offline_test.js has none);
 *   - DIAG_DOWN=503: in mode down the server answers 503 at once instead of dropping
 *     the connection (core/check_lib.js serve() drops it), to tell whether the dropped
 *     connections are the trigger; DIAG_DOWN=refuse: in mode down the server stops
 *     listening (its idle connections closed), so a connection is refused, as for a
 *     stopped server or a phone with no connection; it listens again on the same port
 *     when the mode goes back to ok;
 *   - when that navigation fails, also the number of worker registrations and whether a
 *     localStorage key set earlier in the run is still there (site data kept or wiped).
 * The worker's and the page's logs are read at the end of every run, also one that stops.
 * The checks are offline_test.js's own for these phases; the run's last line is its
 * PASS or FAIL. One difference: before its last check (no page errors) it waits 6 s
 * more, past the page's 5 s update check, so a late update-check error is caught too.
 * Nothing is retried, and every run's output is kept.
 */
const fs = require('fs'), path = require('path'), http = require('http');
const L = require('./check_lib');
const NAME = 'offline_diag.js';
const {check} = L;
L.PAGE.need(NAME);
const FILE = path.basename(L.PAGE.PAGE);
const SLOW = 8000;
const T0 = Date.now(), now = () => Date.now() - T0;
const WAIT_UP = Number(process.env.DIAG_WAIT_AFTER_UP || 0), DOWN503 = process.env.DIAG_DOWN === '503', REFUSE = process.env.DIAG_DOWN === 'refuse';
const D = {browser: L.BROWSER, waitAfterUp: WAIT_UP, down: DOWN503 ? '503' : REFUSE ? 'refuse' : 'drop', downStragglers: 0, server: [], phases: [], pageErrors: [], beforeSlow: null, afterSlow: null, swLog: [], pageLog: [], checks: [],
           requestsFailed: [], navigations: [], consoleErrors: [], crashes: [], afterUpGoto: null};
const phase = p => { D.phases.push({t: now(), phase: p}); console.log(`  [${now()} ms] phase: ${p}`); };

// every request the test server answers, with the server's mode at that moment
let S = null, SERVER = null;
const realCreate = http.createServer;
http.createServer = function(handler){
  SERVER = realCreate.call(http, (req, res) => {
    D.server.push({t: now(), mode: S ? S.mode : '?', path: req.url, fm: req.headers['sec-fetch-mode'] || '', fd: req.headers['sec-fetch-dest'] || ''});
    if(DOWN503 && S && S.mode === 'down'){ res.writeHead(503, {'Content-Type': 'text/plain'}); res.end('down'); return; }
    // refuse: a request on a connection that was busy when listening stopped is answered 503 and counted
    if(REFUSE && S && S.mode === 'down'){ D.downStragglers++; res.writeHead(503, {'Connection': 'close'}); res.end('down'); return; }
    handler(req, res);
  });
  return SERVER;
};
// mode down and back; with DIAG_DOWN=refuse the server also stops listening and starts again
async function goDown(){
  S.mode = 'down';
  if(!REFUSE) return;
  await new Promise(r => { const t = setTimeout(r, 2000); SERVER.close(() => { clearTimeout(t); r(); }); SERVER.closeIdleConnections(); });
  D.phases.push({t: now(), phase: 'refusing connections'});
}
async function goUp(){
  if(REFUSE && !SERVER.listening) await new Promise(r => SERVER.listen(S.port, '127.0.0.1', r));
  S.mode = 'ok';
}
const origCheck = check;
const chk = (ok, label, detail) => { D.checks.push({t: now(), ok: !!ok, label, detail: detail === undefined ? '' : String(detail).slice(0, 300)}); return origCheck(ok, label, detail); };

(async () => {
  const {browser} = await L.launch(NAME);
  S = await L.serve(L.PAGE.SITE, {slowMs: SLOW, other: {'/other-site/index.html': '<!doctype html><title>other site</title><p>other</p>'}});
  http.createServer = realCreate;
  const URL_ = S.url + FILE;
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  // the page's own record, kept in sessionStorage across reloads
  await ctx.addInitScript(() => {
    const push = r => { try { const a = JSON.parse(sessionStorage.getItem('__diag') || '[]'); a.push(Object.assign({at: Date.now(), href: location.href}, r)); sessionStorage.setItem('__diag', JSON.stringify(a)); } catch(e){} };
    window.addEventListener('error', e => push({kind: 'window-error', message: String(e.message || e.error || ''), file: e.filename || ''}));
    window.addEventListener('unhandledrejection', e => push({kind: 'unhandledrejection', reason: String(e.reason && (e.reason.message || e.reason))}));
    const realFetch = window.fetch;
    window.fetch = function(input){
      const url = String(input && input.url || input);
      const p = realFetch.apply(this, arguments);
      if(/version\.json/.test(url)){
        push({kind: 'fetch-start', url});
        p.then(r => push({kind: 'fetch-resolved', url, status: r.status}), e => push({kind: 'fetch-rejected', url, error: String(e && e.message || e)}));
      }
      return p;
    };
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); D.pageErrors.push({t: now(), mode: S.mode, message: e.message}); });
  page.on('dialog', d => d.accept());
  page.on('requestfailed', r => D.requestsFailed.push({t: now(), mode: S.mode, url: r.url(), type: r.resourceType(), nav: r.isNavigationRequest(), failure: (r.failure() || {}).errorText || ''}));
  page.on('framenavigated', f => { if(f === page.mainFrame()) D.navigations.push({t: now(), mode: S.mode, url: f.url()}); });
  page.on('console', m => { if(m.type() === 'error') D.consoleErrors.push({t: now(), mode: S.mode, text: m.text()}); });
  page.on('crash', () => D.crashes.push({t: now(), mode: S.mode}));
  const appShown = () => page.evaluate(() => document.querySelectorAll('#nav button').length > 3 && typeof QUESTIONS !== 'undefined' && QUESTIONS.length > 0).catch(() => false);
  const waitApp = (ms) => page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3 && typeof QUESTIONS !== 'undefined', null, {timeout: ms}).then(() => true, () => false);
  const workerState = () => page.evaluate(async () => {
    const sw = navigator.serviceWorker, reg = sw && await sw.getRegistration();
    const w = x => x ? {url: x.scriptURL, state: x.state} : null;
    let saved = null;
    try {
      for(const n of await caches.keys()){
        if(n === 'diag-log') continue;
        const hit = await (await caches.open(n)).match(new URL('index.html', location.href).href);
        if(hit){ saved = {cache: n, etag: hit.headers.get('etag')}; break; }
      }
    } catch(e){ saved = {error: String(e)}; }
    return {href: location.href, controller: w(sw && sw.controller), active: w(reg && reg.active), waiting: w(reg && reg.waiting), installing: w(reg && reg.installing), saved};
  }).catch(e => ({error: String(e.message || e)}));
  try {
    phase('first visit');
    // as offline_test.js: another site's page on the same origin first, with caches of its own
    const NS = await (async () => { const sw = fs.readFileSync(path.join(L.PAGE.SITE, 'sw.js'), 'utf8'); try { return JSON.parse(sw.match(/^const SITE = (\{.*\});$/m)[1]).prefix.slice(0, -1); } catch(e){ return 'drill'; } })();
    await page.goto(S.origin + '/other-site/index.html');
    await page.evaluate(async (names) => { for(const n of names) await (await caches.open(n)).put('/' + n + '/index.html', new Response('another site')); },
      ['phar4342-drill-v1', 'bdk-v18', 'other-drill-v2', NS + '-extra-v1']);
    await page.goto(URL_);
    const controlled = await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 20000}).then(() => true, () => false);
    chk(controlled, 'the worker installs and controls the page on the first visit');
    await page.evaluate(() => localStorage.setItem('__diag-marker', String(Date.now())));
    if(controlled){ try { await page.waitForSelector('#swbar', {timeout: 8000}); } catch(e){} }
    phase('reload');
    await page.reload(); await waitApp(10000);
    chk(await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)), 'after a reload the page is served by the worker');
    await page.waitForTimeout(1500);

    phase('server down');
    await goDown();
    await page.reload().catch(() => {});
    chk(await waitApp(10000) && await appShown(), 'the site opens from the saved copy with the server down');
    const served = await page.evaluate(() => { startQuiz(TOPICS[0].id); return document.querySelectorAll('#v-quiz button[data-o], #numIn, #v-quiz select[data-row]').length; }).catch(() => 0);
    chk(served >= 1, 'a quiz starts and serves a question offline');
    await goUp();
    phase('server ok');

    if(WAIT_UP) await page.waitForTimeout(WAIT_UP);
    try { await page.goto(URL_); D.afterUpGoto = {t: now(), ok: true}; }
    catch(e){
      D.afterUpGoto = Object.assign({t: now(), ok: false, error: String(e.message || e).split('\n')[0]}, await workerState(),
        await page.evaluate(async () => ({registrations: navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : null,
          marker: localStorage.getItem('__diag-marker'), cacheNames: await caches.keys()})).catch(e => ({stateError: String(e.message || e)})));
      chk(false, 'the navigation after the server comes back up works', D.afterUpGoto.error);
      phase('diagnosis only: one more navigation');
      try { await page.goto(URL_); D.afterUpGoto.second = {t: now(), ok: true}; }
      catch(e2){ D.afterUpGoto.second = {t: now(), ok: false, error: String(e2.message || e2).split('\n')[0]}; }
    }
    await waitApp(10000);
    S.indexExtra = '<i id="deploy-2"></i>';
    D.beforeSlow = Object.assign({t: now()}, await workerState());
    phase('server slow, reload');
    S.mode = 'slow';
    const t0 = Date.now();
    await page.reload({waitUntil: 'commit', timeout: 30000}).catch(() => {});
    const opened = await waitApp(30000);
    const ms = Date.now() - t0;
    D.afterSlow = Object.assign({t: now(), ms, opened, deploy2: !!(await page.$('#deploy-2'))}, await workerState(),
      {nav: await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? {type: n.type, workerStart: n.workerStart, fetchStart: n.fetchStart,
        responseStart: n.responseStart, responseEnd: n.responseEnd, transferSize: n.transferSize} : null; }).catch(() => null)});
    chk(opened && ms < SLOW - 1000, `the saved copy opens without waiting for the network (${ms} ms, server ${SLOW} ms)`);
    chk(!(await page.$('#deploy-2')), 'that copy is the last one saved');
    let offer = null;
    try { offer = await page.waitForSelector('#swbar [data-reload]', {timeout: SLOW + 8000}); } catch(e){}
    chk(!!offer, 'a reload is offered once the newer page arrives');
    chk(!(await page.$('#deploy-2')), 'the page never reloads by itself');
    S.mode = 'ok';
    phase('server ok');
    if(offer){
      await Promise.all([page.waitForNavigation().catch(() => {}), page.click('#swbar [data-reload]')]);
      await waitApp(10000);
      chk(!!(await page.$('#deploy-2')), 'Reload brings in the newer page');
    }
    S.indexExtra = '';
    await page.waitForTimeout(6000);   // past the update check's 5 s, with the server up
    chk(!errors.length, 'no page errors in the service worker checks', errors.slice(0, 3).join('; '));
  } finally {
    S.mode = 'ok';
    // the worker's log and the page's, read in every run, also one that stopped
    D.swLog = await page.evaluate(async () => {
      const c = await caches.open('diag-log'), out = [];
      for(const k of await c.keys()) out.push(JSON.parse(await (await c.match(k)).text()));
      return out.sort((a, b) => (a.at || 0) - (b.at || 0));
    }).catch(e => [{error: String(e.message || e)}]);
    D.pageLog = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__diag') || '[]')).catch(e => [{error: String(e.message || e)}]);
    // times on one clock: the worker's and the page's `at` are epoch ms; T0 is the test's start
    D.T0 = T0;
    console.log('DIAG ' + JSON.stringify(D));
    await ctx.close();
    await S.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); console.log('DIAG ' + JSON.stringify(D)); process.exit(1); });
