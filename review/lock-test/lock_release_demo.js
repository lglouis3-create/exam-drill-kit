/* The timing of import_test.js "a profile switch frees the old profile's lock", shown on purpose.
 *
 * claimProfile (core/shell.html) frees the old profile's writer lock by resolving the promise the
 * lock callback returned (writerRelease()). The browser's lock manager frees the lock after that,
 * and a request from another tab is answered by the lock manager, not by the page. So a request
 * with ifAvailable made straight after useProfile() depends on how soon the browser frees it.
 *
 * Three cases, each in a fresh browser context with a drill tab d and a second tab t2:
 *   as is      the core unchanged; N switches, each followed at once by the old immediate request
 *   later      d's release is held back 300 ms (a stand-in for a browser that frees it later;
 *              in job 127949917972 the lock was still held at the single request)
 *   never      d's release never happens (a lock that never frees)
 * For each, both the old check (one immediate ifAvailable request) and the new check (retry
 * ifAvailable until it is granted or 2000 ms have passed, the core's own 'brief' window) are run.
 *
 * Usage: DRILL_PAGE=<built index.html> node lock_release_demo.js <kit>/core [trials]
 */
const path = require('path');
const L = require(path.join(path.resolve(process.argv[2]), 'check_lib.js'));
const TRIALS = +(process.argv[3] || 30);

// the same wait as import_test.js waitWriterFree (there the name is passed in and the field is named stillHeld)
const waitFree = (t, ms) => t.evaluate(async ms => {
  const name = NS + ':writer:' + PROFILE, t0 = Date.now();
  for(;;){
    if(await navigator.locks.request(name, {ifAvailable: true}, l => !!l)) return {free: true, ms: Date.now() - t0};
    if(Date.now() - t0 >= ms){
      const q = await navigator.locks.query();
      return {free: false, ms: Date.now() - t0, held: (q.held || []).filter(l => l.name === name).length};
    }
    await new Promise(r => setTimeout(r, 20));
  }
}, ms);
const immediate = t => t.evaluate(() => navigator.locks.request(NS + ':writer:' + PROFILE, {ifAvailable: true}, l => !!l));

(async () => {
  const {browser} = await L.launch('lock_release_demo.js');
  const pair = async () => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const url = await L.pageUrl(L.PAGE.PAGE);
    const open = async () => { const p = await ctx.newPage(); p.on('dialog', x => x.accept().catch(() => {}));
      await p.goto(url); await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); return p; };
    const d = await open();
    await d.waitForFunction(() => WRITER === 'held', null, {timeout: 5000});
    const t2 = await open();
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    return {ctx, d, t2};
  };
  const hold = (d, how) => d.evaluate(how => {
    const real = writerRelease;
    writerRelease = () => { writerRelease = null; if(how === 'later') setTimeout(real, 300); };   // 'never': real is not called
  }, how);

  // as is: N switches away and back, each followed at once by the old request
  {
    const {ctx, d, t2} = await pair();
    let held = 0, done = 0;
    for(let i = 0; i < TRIALS; i++){
      await d.evaluate(() => useProfile('elsewhere'));
      const free = await immediate(t2);
      if(!free) held++;
      done++;
      await d.evaluate(() => useProfile('TestUser'));
      await d.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    }
    console.log(`as is (${L.BROWSER_NAME}): the old immediate request found the lock still held in ${held} of ${done} switches`);
    await ctx.close();
  }
  for(const how of ['later', 'never']){
    {
      const {ctx, d, t2} = await pair();
      await hold(d, how);
      await d.evaluate(() => useProfile('elsewhere'));
      const free = await immediate(t2);
      console.log(`${how} (${L.BROWSER_NAME}): old check (one immediate request): ${free ? 'passes' : 'FAILS'} (free: ${free})`);
      await ctx.close();
    }
    {
      const {ctx, d, t2} = await pair();
      await hold(d, how);
      await d.evaluate(() => useProfile('elsewhere'));
      const r = await waitFree(t2, 2000);
      console.log(`${how} (${L.BROWSER_NAME}): new check (wait for the release until 2000 ms have passed): ${r.free ? 'passes' : 'FAILS'} ${JSON.stringify(r)}`);
      await ctx.close();
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
