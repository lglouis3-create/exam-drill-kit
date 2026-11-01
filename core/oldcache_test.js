/* course.js `oldCachePrefix`: a drill that had its own service worker before it
 * moved onto the core leaves that worker's caches in the browser (every drill
 * on lglouis3-create.github.io shares one Cache Storage). Medicinal-chemistry's
 * old worker named its caches 'phar4342-drill-v<n>'. The core's worker deletes
 * caches whose names start with the prefix the course names, and nothing else.
 *
 * Checked on scratch copies of this source tree:
 *   - without the field, the worker deletes no other prefix;
 *   - with it, caches starting with that prefix are deleted, and a cache whose
 *     name only resembles it, another site's cache and this course's own cache
 *     are kept;
 *   - the build refuses a prefix that would match this course's own caches or
 *     does not end with '-'.
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'oldcache_test.js';
const OLD = 'old-drill-';

console.log('\n=== Deleting an old worker\'s caches ===');
const build = (prefix) => {
  const repo = L.scratchRepo(__dirname, 'oldcache-test');
  const src = path.join(repo, 'src');
  if(prefix !== null){
    const p = path.join(src, 'course.js'), s = fs.readFileSync(p, 'utf8');
    const out = s.replace(/^(\s*ns:\s*'[^']*',)$/m, `$1\n  oldCachePrefix: '${prefix}',`);
    if(out === s) L.notRun(NAME, 'course.js has no `ns:` line to add oldCachePrefix after');
    fs.writeFileSync(p, out);
  }
  const r = child.spawnSync('python3', ['build.py'], {cwd: src, encoding: 'utf8'});
  return {repo, code: r.status, out: (r.stdout + r.stderr).trim()};
};
const siteOf = repo => { try { return JSON.parse((fs.readFileSync(path.join(repo, 'sw.js'), 'utf8').match(/^const SITE = (\{.*\});$/m) || [])[1]); } catch(e){ return null; } };

const plain = build(null);
if(plain.code !== 0) L.notRun(NAME, 'the build failed in a scratch copy: ' + plain.out.split('\n').pop());
const ns = (siteOf(plain.repo) || {}).prefix;
L.check(siteOf(plain.repo) && siteOf(plain.repo).old === '', 'without oldCachePrefix the worker deletes no other prefix');

const withOld = build(OLD);
L.check(withOld.code === 0 && siteOf(withOld.repo) && siteOf(withOld.repo).old === OLD, `with oldCachePrefix '${OLD}' the build passes it to the worker`, withOld.out.split('\n').pop());
for(const bad of [ns, ns.split('-')[0] + '-', 'nodash']){
  const b = build(bad);
  L.check(b.code !== 0 && /oldCachePrefix/.test(b.out), `the build refuses oldCachePrefix '${bad}'`, b.out.split('\n').pop());
}

(async () => {
  const {browser} = await L.launch(NAME);
  const S = await L.serve(withOld.repo, {other: {'/other-site/index.html': '<!doctype html><title>other site</title><p>other</p>'}});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const page = await ctx.newPage();
    page.on('dialog', d => d.accept());
    const GONE = [OLD + 'v7', OLD + 'images'];
    const KEPT = ['old-drillx-v1', 'bdk-v18', 'other-' + OLD + 'v1'];
    await page.goto(S.origin + '/other-site/index.html');
    await page.evaluate(async names => { for(const n of names) await (await caches.open(n)).put('/' + n, new Response(n)); }, GONE.concat(KEPT));
    await page.goto(S.url + 'index.html');
    const controlled = await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 20000}).then(() => true, () => false);
    L.check(controlled, 'the worker installs and controls the page');
    await page.waitForTimeout(500);
    const keys = await page.evaluate(() => caches.keys());
    for(const n of GONE) L.check(!keys.includes(n), `the old worker's cache ${n} is deleted`, keys);
    for(const n of KEPT) L.check(keys.includes(n), `${n} is kept`, keys);
    L.check(keys.includes(ns + 'v1'), `this course's own cache ${ns}v1 is there`, keys);
  } finally {
    await browser.close();
    await S.close();
  }
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: the test stopped: ${e.message}`); process.exit(1); });
