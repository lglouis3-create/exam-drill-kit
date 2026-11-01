/* A newer version is offered, and a reload comes back to the same place.
 *
 * The site folder is served over HTTP the way Pages serves it. Two things are
 * checked, in Chromium at phone (390 px) and desktop (1200 px) widths:
 *
 *   the update notice  version.json is written by the build and matches the
 *                      page; when a newer one is published, the page offers
 *                      Reload when its tab comes back and, with the tab left
 *                      open, at 15 minutes and not before
 *   the place          after a reload: the same tab, the same open sections,
 *                      the same line at the same height (within 4 px), the
 *                      same question, an answered question still answered,
 *                      and no answer recorded twice
 *
 * A port of Basic-Pharmacokinetics' src/place_test.py to Node Playwright, on
 * this engine's tabs. The line on screen is found by this test's own copy of
 * the rule, so it does not depend on the code it checks.
 *
 *     node update_test.js
 */
const fs = require('fs'), path = require('path');
const L = require('./check_lib');
const NAME = 'update_test.js';
const {check} = L;
L.PAGE.need(NAME);
const FILE = path.basename(L.PAGE.PAGE);

// the first element whose top is on screen in the open tab, and where it is
const TOP = () => {
  const pane = document.querySelector('main > section:not(.hide)');
  const SEL = '[id], h2, h3, h4, summary, p, li, tr, figure, .opt, .subrow';
  const txt = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  for(const el of pane.querySelectorAll(SEL)){
    const r = el.getBoundingClientRect(); if(!r.height || r.top < 0) continue;
    if(el.id) return {pane: pane.id, id: el.id, top: Math.round(r.top), y: Math.round(scrollY)};
    const t = txt(el); if(!t) continue;
    return {pane: pane.id, tag: el.tagName, txt: t, n: [...pane.querySelectorAll(el.tagName)].filter(x => txt(x) === t).indexOf(el),
            top: Math.round(r.top), y: Math.round(scrollY)};
  }
  return {pane: pane.id, y: Math.round(scrollY)};
};
const WHERE = want => {
  const pane = document.querySelector('main > section:not(.hide)');
  const txt = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if(!want.id && !want.tag) return {pane: pane.id, top: null};
  const el = want.id ? document.getElementById(want.id) : [...pane.querySelectorAll(want.tag)].filter(x => txt(x) === want.txt)[want.n];
  return {pane: pane.id, top: el ? Math.round(el.getBoundingClientRect().top) : null};
};
const openKeys = () => [...document.querySelectorAll('main > section:not(.hide) details')].map(d => d.open);

async function sameLine(page, before, label){
  await page.waitForTimeout(1600);   // the second placement runs after images load
  const now = await page.evaluate(WHERE, before);
  check(now.pane === before.pane && now.top !== null && Math.abs(now.top - before.top) <= 4,
    `${label}: the same line comes back at the same height`, JSON.stringify({before, after: now}));
}

(async () => {
  const {browser} = await L.launch(NAME);

  console.log('\n=== version.json ===');
  const vfile = path.join(L.PAGE.SITE, 'version.json');
  const v = fs.existsSync(vfile) ? JSON.parse(fs.readFileSync(vfile, 'utf8')) : null;
  const pageBuilt = (L.PAGE.read().match(/const BUILD = \{stamp:"[^"]*", built:"([^"]+)"/) || [])[1];
  check(!!v, 'the build writes version.json beside the page');
  check(v && pageBuilt && v.built === pageBuilt, 'version.json carries the same build time as the page', JSON.stringify({version: v, page: pageBuilt}));

  const S = await L.serve(L.PAGE.SITE);
  const URL_ = S.url + FILE;
  const newer = () => { S.overrides['version.json'] = JSON.stringify({built: '9999-12-31T00:00:00Z'}); };
  const current = () => { delete S.overrides['version.json']; };
  async function openSite(width, opts){
    const ctx = await browser.newContext({viewport: {width, height: 640}});
    await ctx.addInitScript(() => { window.prompt = () => 'PlaceTest'; });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if(m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('dialog', d => d.accept());
    // Playwright's fake clock, once installed, also runs on with real time; paused,
    // it moves only in runFor. The 15-minute check counts on that: running on, the
    // test's own waits (600 + 500 + 800 ms) and the load of a large page used up all
    // but 7 to 22 ms of its 2000 ms margin on Medicinal-chemistry (6.86 MB), and in
    // 4 of 20 runs the 15-minute check came before the "not before" one did.
    if(opts && opts.clock){ await page.clock.install(); await page.clock.pauseAt(Date.now() + 1000); }
    await page.goto(URL_);
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    await page.waitForTimeout(600);
    return {ctx, page, errors};
  }
  const offered = page => page.$('#swbar [data-reload]');

  try {
    console.log('\n=== a newer version is published ===');
    {
      const {ctx, page, errors} = await openSite(390);
      newer();
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      let bar = null;
      try { bar = await page.waitForSelector('#swbar [data-reload]', {timeout: 5000}); } catch(e){}
      const text = bar ? await page.textContent('#swbar') : '';
      check(!!bar, 'when the tab comes back, a newer version.json brings a Reload offer');
      check(/newer version/.test(text) && /progress is kept/.test(text), 'the offer says a newer version is published and progress is kept', text);
      current();
      await page.evaluate(() => { show('settings'); });
      await page.mouse.wheel(0, 500); await page.waitForTimeout(700);
      const before = await page.evaluate(TOP);
      check(before.y > 0, 'Settings is scrolled before Reload', JSON.stringify(before));
      if(bar){
        await Promise.all([page.waitForNavigation(), page.click('#swbar [data-reload]')]);
        await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await page.evaluate(() => typeof VIEW !== 'undefined' && VIEW === 'settings'), 'Reload comes back to the same tab');
        await sameLine(page, before, 'Reload');
      }
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
    {
      const {ctx, page, errors} = await openSite(1200, {clock: true});
      const t0 = await page.evaluate(() => performance.now());
      await page.clock.runFor(6000);              // the check made 5 s after load finds nothing new
      await page.waitForTimeout(500);
      newer();
      await page.clock.runFor(15 * 60000 - 6000 - 2000);
      await page.waitForTimeout(800);
      const moved = Math.round(await page.evaluate(() => performance.now()) - t0);
      check(moved === 15 * 60000 - 2000, `the page's clock moved only by the test's own steps (${moved} ms; 898000 wanted, 2 s before the 15-minute check)`);
      check(!(await offered(page)), 'with the tab left open, nothing is offered before 15 minutes');
      await page.clock.runFor(3000);
      let bar = null;
      try { bar = await page.waitForSelector('#swbar [data-reload]', {timeout: 5000}); } catch(e){}
      check(!!bar, 'at 15 minutes the open page reads version.json again and offers Reload');
      current();
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }

    for(const width of [390, 1200]){
      console.log(`\n=== reloads at ${width} px ===`);
      const {ctx, page, errors} = await openSite(width);
      const reload = async () => { await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3); await page.waitForTimeout(300); };
      const view = () => page.evaluate(() => typeof VIEW !== 'undefined' ? VIEW : null);

      // 1. Topics with the second topic opened, scrolled
      await page.evaluate(() => { show('topics'); const d = document.querySelectorAll('#v-topics details.topic')[1]; if(d) d.open = true; });
      await page.mouse.wheel(0, 300); await page.waitForTimeout(700);
      let before = await page.evaluate(TOP), open = await page.evaluate(openKeys);
      check(before.y > 0 && open.filter(Boolean).length >= 1, 'Topics is scrolled with a topic open before the reload', JSON.stringify({before, open}));
      await reload();
      check(await view() === 'topics' && JSON.stringify(await page.evaluate(openKeys)) === JSON.stringify(open), 'Topics: the tab and the same open topics come back',
        JSON.stringify({view: await view(), open: await page.evaluate(openKeys), want: open}));
      await sameLine(page, before, 'Topics');

      // 2. Settings, scrolled
      await page.evaluate(() => show('settings'));
      await page.mouse.wheel(0, 700); await page.waitForTimeout(700);
      before = await page.evaluate(TOP);
      check(before.y > 0, 'Settings is scrolled before the reload', JSON.stringify(before));
      await reload();
      check(await view() === 'settings', 'Settings: the tab comes back', String(await view()));
      await sameLine(page, before, 'Settings');

      // 3. Reference with its jump list open
      await page.evaluate(() => { show('ref'); const d = document.querySelector('#v-ref details'); if(d) d.open = true; });
      await page.mouse.wheel(0, 200); await page.waitForTimeout(700);
      before = await page.evaluate(TOP); open = await page.evaluate(openKeys);
      check(open.some(Boolean), 'Reference has a section open before the reload', JSON.stringify(open));
      await reload();
      check(await view() === 'ref' && JSON.stringify(await page.evaluate(openKeys)) === JSON.stringify(open), 'Reference: the open section stays open',
        JSON.stringify({view: await view(), open: await page.evaluate(openKeys), want: open}));
      await sameLine(page, before, 'Reference');

      // 4. a question on screen, not yet answered
      const qid = await page.evaluate(() => { startQuiz(TOPICS[1].id); return Q && Q.current && Q.current.id; });
      await page.waitForTimeout(500);
      await reload();
      let got = await page.evaluate(() => [typeof VIEW !== 'undefined' ? VIEW : null, Q && Q.current && Q.current.id, Q && Q.revealed]);
      check(qid && got[0] === 'quiz' && got[1] === qid && got[2] === false, 'Drill: the same question comes back, unanswered', JSON.stringify({qid, got}));

      // 5. the same question answered: it comes back answered, and nothing is recorded twice
      await page.evaluate(() => {
        const q = Q.current;
        if(q.type === 'numeric'){ document.getElementById('numIn').value = String(q.answer); document.getElementById('btnCheck').click(); }
        else if(q.type === 'match'){
          document.querySelectorAll('#v-quiz select[data-row]').forEach((s, i) => { s.value = String(i); s.dispatchEvent(new Event('change')); });
          document.getElementById('btnCheck').click();
        }
        else if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
        else document.querySelector('#v-quiz button[data-o]').click();
      });
      await page.waitForTimeout(500);
      const n = await page.evaluate(() => DB.answers.length);
      await reload();
      got = await page.evaluate(() => [typeof VIEW !== 'undefined' ? VIEW : null, Q && Q.current && Q.current.id, Q && Q.revealed,
                                       DB.answers.length, !!document.querySelector('#v-quiz .why')]);
      check(got[0] === 'quiz' && got[1] === qid && got[2] === true && got[4], 'Drill: an answered question comes back with its explanation', JSON.stringify(got));
      check(n >= 1 && got[3] === n, 'a reload records no answer twice', `${n} before, ${got[3]} after`);
      check(!errors.length, `no page or console errors at ${width} px`, errors.slice(0, 3).join('; '));
      await ctx.close();
    }
  } finally {
    await S.close();
    await browser.close();
  }
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
