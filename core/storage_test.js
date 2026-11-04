/* Saved progress when the browser refuses to save.
 *
 * A visit can start with working storage and then hit a full quota (every drill
 * on the course site's origin shares one). The template's shim probed storage
 * once at load, so a write refused later was kept in memory while every read
 * still went to localStorage and got the old value: within the same visit a
 * dismissed card came back and a profile switched away and back lost its
 * answers, with nothing on screen. `store` keeps each refused key in memory for
 * the visit and shows one notice pointing to Export progress.
 *
 *   1. setItem starts throwing (quota) after the page has loaded: a dismissed
 *      What's new card stays dismissed, an answer survives a profile switch and
 *      back, one notice names Export progress, and a later successful write
 *      clears the key's failure
 *   2. storage works: no notice
 *   3. storage denied outright: the drill runs, answers count, the notice shows
 *   4. the last change before the page goes: an answer followed at once by a reload,
 *      and by closing the tab, is kept (saveNow on pagehide), and so is an answer
 *      when the page is hidden (visibilitychange)
 *
 *     node storage_test.js
 */
const L = require('./check_lib');
const NAME = 'storage_test.js';
const {check} = L;
L.PAGE.need(NAME);

// setItem throws while window.__quota is true, as a full origin quota does
const QUOTA = () => {
  const real = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if(window.__quota) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return real.call(this, k, v);
  };
};
// one answer in the page, by clicking as a student does (window.answerNow, for use inside an evaluate)
const ANSWER_NOW = () => {
  window.answerNow = () => {
    // a question answered with option buttons (choice or select-all): the quiz is started again,
    // topic after topic, until one is on screen (a quiz draws at random, the template also has
    // numeric and matching questions, and a small pool ends instead of repeating)
    for(let i = 0; i < 60; i++){
      startQuiz(TOPICS[i % TOPICS.length].id);
      if(Q.current && document.querySelector('#v-quiz button[data-o]')) break;
    }
    const q = Q.current;
    if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
    else document.querySelector('#v-quiz button[data-o]').click();
    return DB.answers.length;
  };
};
const answerOne = page => page.evaluate(() => {
  startQuiz(TOPICS[0].id);
  const q = Q.current;
  if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
  else document.querySelector('#v-quiz button[data-o]').click();
  return DB.answers.length;
});

(async () => {
  const {browser} = await L.launch(NAME);
  console.log('\n=== Saving refused part-way through a visit ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {}, QUOTA);
    check(await page.evaluate(() => localStorage.getItem(NS + ':profile') === 'me'), 'before the quota fills, the profile is saved (the default, me)');
    await page.evaluate(() => { window.__quota = true; });

    const card = await page.evaluate(() => { show('topics'); return !!document.getElementById('news'); });
    check(card, "the What's new card is on Topics before it is dismissed");
    if(card){
      await page.click('#newsok');
      const back = await page.evaluate(() => { show('settings'); show('topics'); return !!document.getElementById('news'); });
      check(!back, "a dismissed What's new card stays dismissed for the visit when the browser refuses to save");
    }

    check(await answerOne(page) === 1, 'an answer is recorded');
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__name = 'Other'; });
    await page.click('#btnWho');
    const other = await page.evaluate(() => DB.answers.length);
    await page.evaluate(() => { window.__name = 'me'; });
    await page.click('#btnWho');
    const kept = await page.evaluate(() => ({n: DB.answers.length, who: document.getElementById('whoName').textContent}));
    check(other === 0 && kept.n === 1 && kept.who === 'me',
      'the answer is still there after switching to another profile and back', JSON.stringify({other, back: kept}));

    const warns = await page.$$('#savewarn');
    const text = warns.length ? await warns[0].textContent() : '';
    check(warns.length === 1, `one notice, however many writes were refused (${warns.length} shown)`);
    check(/did not save your progress/.test(text) && /Export progress/.test(text), 'the notice says progress was not saved and points to Export progress', text.slice(0, 80));
    const label = await page.evaluate(() => { show('settings'); const b = document.getElementById('btnExport'); return b ? b.textContent.trim() : ''; });
    check(label === 'Export progress', 'Settings has the Export progress button the notice names', label);

    const perKey = await page.evaluate(() => {
      try {
        const k = NS + ':storage-test';
        const refused = store.set(k, '1') === false && store.get(k) === '1';
        window.__quota = false;
        const kept = store.set(k, '2') === true && store.get(k) === '2' && localStorage.getItem(k) === '2';
        localStorage.removeItem(k);
        return {refused, kept};
      } catch(e){ return {err: e.message}; }
    });
    check(perKey.refused, 'a refused write is read back from memory', perKey.err || '');
    check(perKey.kept, 'a later write that succeeds goes to localStorage and is read from there', perKey.err || '');
    if(warns.length){ await page.click('#savewarn button'); }
    check(!(await page.$('#savewarn')), 'OK closes the notice');
    check(!errors.length, 'no page errors with saving refused', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== Saving works ===');
  {
    const {ctx, page, errors} = await L.openFile(browser);
    await answerOne(page);
    await page.waitForTimeout(300);
    check(!(await page.$('#savewarn')), 'no notice when saving works');
    check(await page.evaluate(() => (JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{}').answers || []).length === 1), 'the answer is in localStorage');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== Storage denied outright ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {}, () => {
      Object.defineProperty(window, 'localStorage', {configurable: true, get(){ throw new DOMException('denied', 'SecurityError'); }});
    });
    check(await answerOne(page) === 1, 'the drill runs and records an answer for the visit');
    const t = await page.$('#savewarn');
    check(!!t && /Export progress/.test(await t.textContent()), 'the notice is shown');
    check(!errors.length, 'no page errors with storage denied', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== The last change before the page goes ===');
  {
    // In these pages the 150 ms save timer of save() (shell.html) never fires on its own: its
    // delay is made an hour, so an answer reaches storage here only through saveNow. (Without
    // this, a timer that fired before the close or the read let a check pass without saveNow.)
    // window.__stretched counts the delays made an hour, so a change of save()'s delay shows.
    const NO_TIMER = () => {
      const real = window.setTimeout;
      window.__stretched = 0;
      window.setTimeout = function(f, d, ...a){ if(d === 150) window.__stretched++; return real.call(this, f, d === 150 ? 3600000 : d, ...a); };
    };
    const {ctx, page, errors} = await L.openFile(browser, {}, ANSWER_NOW);
    await ctx.addInitScript(NO_TIMER);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    // an answer, then a reload in the same task
    // the answer and the reload in one task, well inside the 150 ms the save waits; whether a
    // save was waiting goes to sessionStorage, which the reload keeps. The reload destroys the
    // page's context, so evaluate may end with that error (WebKit does; Chromium may return
    // first); only that error is expected here. window.__before marks the page before the reload,
    // so the wait below cannot end on it.
    await page.evaluate(() => { window.__before = 1; answerNow(); sessionStorage.setItem('__waiting', saveTimer && window.__stretched > 0 ? '1' : '0'); location.reload(); })
      .catch(e => { if(!/Execution context was destroyed|navigat/i.test(e.message)) throw e; });
    await page.waitForFunction(() => !window.__before && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const {n, waiting} = await page.evaluate(() => ({n: DB.answers.length, waiting: sessionStorage.getItem('__waiting') === '1'}));
    check(waiting && n === 1, 'an answer followed at once by a reload is kept (it was still waiting to be saved)', {waiting, n});
    // an answer, then the tab closed at once, with page.close(), which waits for the page to close.
    // Not page.close({runBeforeUnload: true}): in WebKit that never closed the page (0 of 10 trials
    // within 10 s, GitHub run 41598578124; an earlier version of this check passed in WebKit only
    // because the 150 ms timer fired while the page stayed open), and it does not wait for the close
    // in Chromium either (Playwright's documentation). page.close() closed the page and the waiting
    // save reached storage in 10 of 10 trials in WebKit and in Chromium, with the timer unable to
    // fire (the same run), so the closing page writes it.
    const before = await page.evaluate(() => { answerNow(); return {n: DB.answers.length, waiting: !!saveTimer, stretched: window.__stretched}; });
    const closed = new Promise(r => page.once('close', r));
    await page.close();
    await closed;
    const p2 = await ctx.newPage();
    p2.on('pageerror', e => errors.push(e.message));
    await p2.goto(await L.pageUrl(L.PAGE.PAGE));
    await p2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const n2 = await p2.evaluate(() => DB.answers.length);
    check(before.waiting && before.stretched > 0 && n2 === before.n, 'an answer followed at once by closing the tab is kept', {before, n2});
    // stored progress against the progress on the page, in one evaluate
    const stored = () => ({timer: !!saveTimer, db: DB.answers.length, stored: (JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{}').answers || []).length, stretched: window.__stretched});
    // an answer, then pagehide alone (no visibilitychange first): written at once
    const ph = await p2.evaluate(f => { answerNow(); const w = !!saveTimer; window.dispatchEvent(new Event('pagehide')); return Object.assign({waiting: w}, (0, eval)(f)()); }, stored.toString());
    check(ph.waiting && ph.stretched > 0 && !ph.timer && ph.stored === ph.db, 'an answer followed by pagehide alone is written at once', ph);
    // an answer, then the page hidden (a phone switching apps): written at once
    const hidden = await p2.evaluate(f => {
      answerNow(); const w = !!saveTimer;
      Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'});
      document.dispatchEvent(new Event('visibilitychange'));
      return Object.assign({waiting: w}, (0, eval)(f)());
    }, stored.toString());
    check(hidden.waiting && hidden.stretched > 0 && !hidden.timer && hidden.stored === hidden.db, 'an answer followed by the page being hidden is written at once', hidden);
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  // The site opens straight to the drill and never asks for a name on its own
  // (Louis, 2026-11-01). With no name stored, it opens the saved progress used
  // most recently, else a profile named "me". The Switch button still asks.
  console.log('\n=== Opening without asking for a name ===');
  const opened = async (seed) => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(([s]) => {
      window.__prompts = 0;
      window.prompt = () => { window.__prompts++; return window.__name || 'Asked'; };
      if(s && !sessionStorage.getItem('__seeded')){
        sessionStorage.setItem('__seeded', '1');
        for(const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
      }
    }, [seed]);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(await L.pageUrl(L.PAGE.PAGE));
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const r = await page.evaluate(() => ({prompts: window.__prompts, who: PROFILE, n: DB.answers.length, stored: localStorage.getItem(NS + ':profile')}));
    return {ctx, page, errors, r};
  };
  const NSV = await (async () => { const o = await opened(null); const ns = await o.page.evaluate(() => NS); await o.ctx.close(); return ns; })();
  {
    const {ctx, r, errors} = await opened(null);
    check(r.prompts === 0, 'a first visit opens the drill without asking for a name', JSON.stringify(r));
    check(r.who === 'me' && r.stored === 'me', 'a first visit uses the profile "me" and remembers it', JSON.stringify(r));
    check(!errors.length, 'no page errors on a first visit', errors.slice(0, 2).join('; '));
    await ctx.close();
  }
  {
    const save = (n, at) => JSON.stringify({v: 2, answers: Array.from({length: n}, (_, i) => ({qid: 'x' + i, concept: 'c', result: 'correct', at: at + i, qn: i + 1})), concepts: {}, created: 1});
    const {ctx, r} = await opened({[NSV + ':data:Louis']: save(3, 1700000000000)});
    check(r.prompts === 0 && r.who === 'Louis' && r.n === 3, 'progress saved under a name, with no name stored, opens without asking', JSON.stringify(r));
    await ctx.close();
    const two = await opened({[NSV + ':data:Older']: save(5, 1600000000000), [NSV + ':data:Newer']: save(2, 1750000000000)});
    check(two.r.prompts === 0 && two.r.who === 'Newer' && two.r.n === 2, 'of two saved profiles, the one answered most recently opens', JSON.stringify(two.r));
    await two.page.evaluate(() => { window.__name = 'Other'; });
    await two.page.click('#btnWho');
    const sw = await two.page.evaluate(() => ({prompts: window.__prompts, who: PROFILE}));
    check(sw.prompts === 1 && sw.who === 'Other', 'the Switch button still asks for a name', JSON.stringify(sw));
    await two.ctx.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
