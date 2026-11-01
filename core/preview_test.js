/* The /preview/ build: `python3 build.py --preview`.
 *
 * A design change or a kit update is tried at <site>/preview/ before it replaces
 * the live page (decision 6). The preview is served from the same origin as the
 * live drill, so it shares the browser's storage with it: unless it keeps its
 * own namespace, answering a question in the preview changes the live drill's
 * saved progress, and a preview with a new progress format could convert the
 * live data before Louis has approved anything.
 *
 * Checked here, on a scratch copy of this source tree:
 *   - the preview build writes preview/index.html and preview/version.json and
 *     leaves every file of the live site byte for byte as it was;
 *   - it writes no service worker, manifest or icons into preview/, and the page
 *     says it is a preview;
 *   - opened at /preview/, the page copies the live progress once, saves its own
 *     answers under <ns>-preview, never changes a live key, and registers no
 *     service worker.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'preview_test.js';

console.log('\n=== The /preview/ build ===');
const repo = L.scratchRepo(__dirname, 'preview-test');
const src = path.join(repo, 'src');
const run = args => child.spawnSync('python3', ['build.py'].concat(args), {cwd: src, encoding: 'utf8'});
const live = run([]);
if(live.status !== 0) L.notRun(NAME, 'the live build failed in the scratch copy: ' + (live.stderr || live.stdout).trim().split('\n').pop());

const hashes = dir => Object.fromEntries(fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile())
  .map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')]));
const before = hashes(repo);
const pv = run(['--preview']);
L.check(pv.status === 0, 'build.py --preview runs', (pv.stderr || pv.stdout).trim().split('\n').slice(-2).join(' | '));
const after = hashes(repo);
const changed = Object.keys(before).filter(f => before[f] !== after[f]).concat(Object.keys(after).filter(f => !(f in before)));
L.check(!changed.length, `every file of the live site is unchanged (${Object.keys(before).length} files compared)`, changed.join(', '));

const pdir = path.join(repo, 'preview');
const pfiles = fs.existsSync(pdir) ? fs.readdirSync(pdir) : [];
L.check(pfiles.includes('index.html') && pfiles.includes('version.json'), 'preview/ holds index.html and version.json', pfiles.join(', '));
const extra = pfiles.filter(f => !['index.html', 'version.json'].includes(f));
L.check(!extra.length, 'preview/ holds no service worker, manifest, icons or temporary file', extra.join(', '));
const page = pfiles.includes('index.html') ? fs.readFileSync(path.join(pdir, 'index.html'), 'utf8') : '';
L.check(/preview:true/.test(page) && /id="previewnote"/.test(page), 'the preview page is marked as a preview and says so');
L.check(!/rel="manifest"/.test(page), 'the preview page links no web manifest');
const livePage = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
L.check(/preview:false/.test(livePage) && !/id="previewnote"/.test(livePage), 'the live page is not marked as a preview');

(async () => {
  const site = await L.serve(repo);
  const {browser} = await L.launch(NAME);
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    // The live drill first, with an answer saved.
    await page.goto(site.url + 'index.html');
    await page.waitForFunction(() => typeof NS === 'string' && typeof store === 'object' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const ns = await page.evaluate(() => NS);
    await page.evaluate(n => { localStorage.setItem(n + ':data:default', JSON.stringify({marker: 'live progress'})); }, ns);
    const liveKeys = await page.evaluate(n => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith(n + ':')).map(k => [k, localStorage.getItem(k)])), ns);

    // Then the preview.
    await page.goto(site.url + 'preview/index.html');
    await page.waitForFunction(() => typeof NS === 'string' && typeof store === 'object' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const pns = await page.evaluate(() => NS);
    L.check(pns === ns + '-preview', `the preview's namespace is ${ns}-preview`, pns);
    const copied = await page.evaluate(n => localStorage.getItem(n + '-preview:data:default'), ns);
    L.check(copied === JSON.stringify({marker: 'live progress'}), 'the preview starts from a copy of the live progress', copied);

    // Answer in the preview through the page's own store, then compare the live keys.
    await page.evaluate(() => { store.set(NS + ':data:default', JSON.stringify({marker: 'preview answer'})); });
    await page.reload();
    await page.waitForFunction(() => typeof NS === 'string');
    const kept = await page.evaluate(n => localStorage.getItem(n + '-preview:data:default'), ns);
    L.check(kept === JSON.stringify({marker: 'preview answer'}), 'the preview keeps its own answers across a reload (it does not copy the live progress again)', kept);
    const liveNow = await page.evaluate(n => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith(n + ':')).map(k => [k, localStorage.getItem(k)])), ns);
    L.check(JSON.stringify(liveNow) === JSON.stringify(liveKeys), `no live key was written or removed (${Object.keys(liveKeys).length} live keys compared)`,
      {before: Object.keys(liveKeys), after: Object.keys(liveNow)});
    await page.waitForTimeout(1500);
    const regs = await page.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(r => r.map(x => x.scope)) : []);
    L.check(!regs.some(s => s.includes('/preview/')), 'the preview registers no service worker', regs.join(', '));
    L.check(!errors.length, 'no script error on either page', errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await site.close();
  }
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: the test stopped: ${e.message}`); process.exit(1); });
