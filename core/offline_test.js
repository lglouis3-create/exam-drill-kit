/* Offline copy: the service worker, the manifest and the icons.
 *
 * The site folder is served over HTTP under a repository path, the way GitHub
 * Pages serves it, by a server this test can slow down or stop:
 *
 *   1. another site's caches on the same origin survive the worker's cleanup,
 *      including one whose name starts with this course's namespace, while
 *      this course's own old cache is deleted
 *   2. with the server down the page opens from the saved copy, at the site
 *      root and at the old file name
 *   3. with the server slower than NET_TIMEOUT the saved copy opens without
 *      waiting, and when the newer page arrives a reload is offered, never
 *      forced
 *   4. opened from disk, no worker is registered and nothing breaks
 *
 * The approach is BDK's tests/offline.js; the cases follow Medicinal-chemistry's
 * src/sw_test.py.
 *
 *     node offline_test.js
 */
const fs = require('fs'), path = require('path');
const L = require('./check_lib');
const NAME = 'offline_test.js';
const {check} = L;
L.PAGE.need(NAME);
const FILE = path.basename(L.PAGE.PAGE);
const SLOW = 8000;                     // longer than the worker's NET_TIMEOUT of 3500 ms
const NS = L.engine('NS');

console.log('\n=== Files beside the page ===');
const swPath = path.join(L.PAGE.SITE, 'sw.js');
const sw = fs.existsSync(swPath) ? fs.readFileSync(swPath, 'utf8') : '';
check(!!sw, 'sw.js is written beside the page');
const site = (() => { try { return JSON.parse((sw.match(/^const SITE = (\{.*\});$/m) || [])[1]); } catch(e){ return null; } })();
check(site && site.prefix === NS + '-', `the worker's cache prefix comes from the course namespace (${NS}-)`, JSON.stringify(site && site.prefix));
let manifest = null;
try { manifest = JSON.parse(fs.readFileSync(path.join(L.PAGE.SITE, 'manifest.json'), 'utf8')); } catch(e){}
check(manifest && manifest.start_url && manifest.icons && manifest.icons.length >= 2, 'manifest.json is written and names its icons');
const isPng = f => { try { return fs.readFileSync(path.join(L.PAGE.SITE, f)).subarray(0, 8).toString('hex') === '89504e470d0a1a0a'; } catch(e){ return false; } };
const icons = (manifest && manifest.icons || []).map(i => i.src.replace(/^\.\//, '')).concat(['apple-touch-icon.png']);
check(icons.length > 1 && icons.every(isPng), 'every icon the page and manifest name is a PNG on disk', icons.filter(f => !isPng(f)).join(', '));
check(/<link rel="manifest" href="\.\/manifest\.json">/.test(L.PAGE.read()), 'the page links the manifest');

(async () => {
  const {browser} = await L.launch(NAME);
  const S = await L.serve(L.PAGE.SITE, {slowMs: SLOW, other: {'/other-site/index.html': '<!doctype html><title>other site</title><p>other</p>'}});
  const URL_ = S.url + FILE;
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  const appShown = () => page.evaluate(() => document.querySelectorAll('#nav button').length > 3 && typeof QUESTIONS !== 'undefined' && QUESTIONS.length > 0).catch(() => false);
  const waitApp = (ms) => page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3 && typeof QUESTIONS !== 'undefined', null, {timeout: ms}).then(() => true, () => false);
  try {
    console.log('\n=== Caches on a shared origin ===');
    const FOREIGN = ['phar4342-drill-v1', 'bdk-v18', NS + '-extra-v1'];
    await page.goto(S.origin + '/other-site/index.html');
    await page.evaluate(async ([foreign, old]) => {
      for(const n of foreign) await (await caches.open(n)).put('/' + n + '/index.html', new Response('another site'));
      await (await caches.open(old)).put('/old', new Response('old copy'));
    }, [FOREIGN, NS + '-v0']);
    await page.goto(URL_);
    const controlled = await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 20000}).then(() => true, () => false);
    check(controlled, 'the worker installs and controls the page on the first visit');
    let note = null;
    if(controlled){ try { note = await page.waitForSelector('#swbar', {timeout: 8000}); } catch(e){} }
    check(!!note && /offline/i.test(await page.textContent('#swbar').catch(() => '')), 'the student is told the drill now opens offline');
    const keys = await page.evaluate(() => caches.keys());
    for(const n of FOREIGN) check(keys.includes(n), `another site's cache ${n} is kept`, keys);
    check(!keys.includes(NS + '-v0'), `this course's old cache ${NS}-v0 is deleted`, keys);
    check(keys.includes(NS + '-v1'), `this course's cache ${NS}-v1 is there`, keys);
    const saved = await page.evaluate(async ([cache, files]) => {
      const c = await caches.open(cache);
      const out = [];
      for(const f of files) if(!(await c.match(new URL(f, location.href).href))) out.push(f);
      return out;
    }, [NS + '-v1', (site && site.files) || ['index.html']]);
    check(!saved.length, 'the page, the redirect, the manifest and the icons are saved at install', saved.join(', '));
    await page.reload(); await waitApp(10000);
    check(await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)), 'after a reload the page is served by the worker');
    await page.waitForTimeout(1500);
    check(!(await page.$('#swbar')), 'the offline note is shown once, not on every load');

    console.log('\n=== Server down ===');
    S.mode = 'down';
    await page.reload().catch(() => {});
    check(await waitApp(10000) && await appShown(), 'the site opens from the saved copy with the server down');
    if(site && site.aliases && site.aliases.length){
      await page.goto(S.url + site.aliases[0]).catch(() => {});
      check(await waitApp(10000) && await appShown(), `the old file name ${site.aliases[0]} opens it too`);
    }
    const served = await page.evaluate(() => { startQuiz(TOPICS[0].id); return document.querySelectorAll('#v-quiz button[data-o], #numIn, #v-quiz select[data-row]').length; }).catch(() => 0);
    check(served >= 1, 'a quiz starts and serves a question offline');
    S.mode = 'ok';

    console.log('\n=== Server slower than NET_TIMEOUT, with a newer page ===');
    await page.goto(URL_); await waitApp(10000);
    S.indexExtra = '<i id="deploy-2"></i>';
    S.mode = 'slow';
    const t0 = Date.now();
    await page.reload({waitUntil: 'commit', timeout: 30000}).catch(() => {});
    const opened = await waitApp(30000);
    const ms = Date.now() - t0;
    check(opened && ms < SLOW - 1000, `the saved copy opens without waiting for the network (${ms} ms, server ${SLOW} ms)`);
    check(!(await page.$('#deploy-2')), 'that copy is the last one saved');
    let offer = null;
    try { offer = await page.waitForSelector('#swbar [data-reload]', {timeout: SLOW + 8000}); } catch(e){}
    check(!!offer, 'a reload is offered once the newer page arrives');
    check(!(await page.$('#deploy-2')), 'the page never reloads by itself');
    S.mode = 'ok';
    if(offer){
      await Promise.all([page.waitForNavigation().catch(() => {}), page.click('#swbar [data-reload]')]);
      await waitApp(10000);
      check(!!(await page.$('#deploy-2')), 'Reload brings in the newer page');
    }
    S.indexExtra = '';
    check(!errors.length, 'no page errors in the service worker checks', errors.slice(0, 3).join('; '));
  } finally {
    S.mode = 'ok';
    await ctx.close();
    await S.close();
  }

  console.log('\n=== Opened from disk ===');
  {
    const {ctx: c2, page: p2, errors: e2} = await L.openFile(browser);
    // a page from disk cannot hold a registration; Chromium rejects the question itself
    const regs = await p2.evaluate(() => navigator.serviceWorker
      ? navigator.serviceWorker.getRegistrations().then(r => r.length, () => 0) : 0);
    check(regs === 0 && !(await p2.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller))),
      'no worker is registered for a page opened from disk');
    check(await p2.evaluate(() => document.querySelectorAll('#nav button').length > 3), 'the drill opens from disk');
    check(!e2.length, 'no page errors opened from disk', e2.slice(0, 2).join('; '));
    await c2.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
