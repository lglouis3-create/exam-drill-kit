/* A module part kept in IndexedDB (shell.html "PARTS OF THE PROGRESS KEPT IN INDEXEDDB";
 * Louis, 2026-11-08: "use IndexedDB for worksheet ink"). Every check reads the data back
 * after a reload, from a fresh page, not from the write call's answer.
 *
 * The template course switches on no module, so the check serves a copy of the built page
 * with one line added where a module would register its part: registerOutside('ink')
 * (outside-test.html beside index.html, removed at the end). The unchanged page is the
 * "earlier core" of the migration and mixed-version cases: it keeps DB.ink inside the stored
 * progress, as worksheets-ink did before this layer.
 *
 * Cases:
 *   none        a page with no registered part opens no database and stores the progress as before
 *   basic       a page written, saved (the transaction completed), left out of localStorage, back after a reload
 *   large       171 generated pages (the size the per-tab record could not hold, #66) saved and back after a reload
 *   migrate     a progress with DB.ink inside it (the earlier format): every page is in the database, and
 *               only then left out of localStorage; nothing is lost
 *   interrupted the database refuses every write during the move: localStorage keeps every page; the next
 *               visit moves them; each stroke once
 *   quota       the database refuses a write (Chromium: the origin's quota capped through the DevTools
 *               protocol; both engines: a refusal planted on put): state 'refused', never 'saved', the notice
 *               with Export, the earlier pages and the progress still stored after a reload; a later write
 *               after the refusal ends is saved
 *   unavailable IndexedDB cannot be opened: every page stays inside the stored progress, back after a reload
 *   profiles    two profiles keep their own pages; Erase removes only that profile's
 *   two tabs    without Web Locks two tabs write the same page: both tabs' strokes are kept; with Web Locks
 *               the read-only tab writes nothing
 *   mixed       an earlier-core tab writes DB.ink inside the progress after the move: the next load of a
 *               new page keeps both
 *   export      Export carries every page; the file imported into an empty browser brings them back
 *               after a reload; an earlier core's backup (DB.ink in the file) imports the same way
 *   closing     a change written by saveNow on pagehide: reported, not required (see the PR)
 *
 * OUTSIDE_BREAK=<name> runs the same checks on a page with one deliberate fault (the names are in
 * BREAKS below), to show the checks catch it; such a run must FAIL.
 *
 *     node outside_test.js
 */
const L = require('./check_lib');
const fs = require('fs'), path = require('path');
const NAME = 'outside_test.js';
const {check} = L;
L.PAGE.need(NAME);

const ANCHOR = "/* What this page last read under the profile's own progress and history keys, or wrote";
const BREAKS = {
  // the stored progress leaves out a moved page before its copy is in the database
  'no-inline': ["const keep = OUT.inline[p] && OUT.inline[p][part];", "const keep = null;"],
  // a write replaces what another tab wrote since
  'no-rev': ["if(cur && (!base || (cur.rev | 0) !== base.rev)){", "if(false){"],
  // a refused write is reported as saved
  'saved-on-fail': ["OUT.status[k] = err && err.name === 'QuotaExceededError' ? 'refused' : 'failed';", "OUT.status[k] = 'saved'; OUT.known[k] = {v: OUT.sent[k], rev: 0};"],
  // Import into a new profile does not write the file's pages
  'no-import': ["  return outsideRead(p).then(m => {\n    if(OUT.state !== 'ready') return false;", "  return Promise.resolve(true); return outsideRead(p).then(m => {\n    if(OUT.state !== 'ready') return false;"],
  // the pages are not kept per profile
  'no-profile': ["const outKey = (p, part, page) => p + '\\u0001' + part + '\\u0001' + page;", "const outKey = (p, part, page) => 'x' + '\\u0001' + part + '\\u0001' + page;"],
  // a load does not read the stored pages back
  'no-attach': ["LOADED_DB = progText(db); outsideAttachSoon(PROFILE);", "LOADED_DB = progText(db);"],
  // the database unavailable: the pages are left out of the stored progress all the same
  'drop-unavailable': ["if(!OUT.parts.size || OUT.state === 'unavailable' || !isPlainObj(db)) return JSON.stringify(db);", "if(!OUT.parts.size || !isPlainObj(db)) return JSON.stringify(db);"],
};
const BREAK = process.env.OUTSIDE_BREAK || '';
if(BREAK && !BREAKS[BREAK]){ console.log(`unknown OUTSIDE_BREAK ${BREAK}; known: ${Object.keys(BREAKS).join(', ')}`); process.exit(2); }

const built = fs.readFileSync(L.PAGE.PAGE, 'utf8');
if(!built.includes(ANCHOR) || !built.includes('function registerOutside(')) L.notRun(NAME, 'the built page has no outside-part layer (registerOutside)');
let withPart = built.replace(ANCHOR, "registerOutside('ink');\n" + ANCHOR);
if(BREAK){
  const [a, b] = BREAKS[BREAK];
  if(!withPart.includes(a)) { console.log(`OUTSIDE_BREAK ${BREAK}: its target text is not in the page`); process.exit(2); }
  withPart = withPart.replace(a, b);
  console.log(`  (deliberately broken page: ${BREAK})`);
}
const SITE = path.dirname(L.PAGE.PAGE);
const PART_PAGE = path.join(SITE, 'outside-test.html');
fs.writeFileSync(PART_PAGE, withPart);
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'outside-test-'));
const cleanup = () => { try { fs.unlinkSync(PART_PAGE); } catch(e){} try { fs.rmSync(TMP, {recursive: true, force: true}); } catch(e){} };

// the generated ink of review/records-storage/latency_measure.js (#66): 30 strokes of 60 points a page
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const walk = pages => { const ink = {};
  for(let g = 0; g < pages; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
    ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  return ink; };
const stroke = n => ({t: 'pen', c: '#111111', w: 0.003, p: [0.1 * n, 0.2, 0.3, 0.4 + 0.01 * n]});

(async () => {
  const {browser} = await L.launch(NAME);
  const ready = p => p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000})
    .then(() => p.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {}))
    .then(() => p.evaluate(() => typeof outsideReady === 'function' ? Promise.race([outsideReady(), new Promise(r => setTimeout(r, 8000))]) : null));
  const open = async (ctx, file, init) => {
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept().catch(() => {}));
    if(init) await page.addInitScript(init);
    await page.goto(await L.pageUrl(file || PART_PAGE));
    await ready(page);
    return {page, errors};
  };
  const newCtx = async (init) => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => (window.__name || 'TestUser'); });
    if(init) await ctx.addInitScript(init);
    return ctx;
  };
  const reload = async p => { await p.reload(); await ready(p); };
  // put pages into DB.ink, save through the core's save path, and wait until each is saved or not
  const put = (p, pages) => p.evaluate(pages => {
    if(!DB.ink || typeof DB.ink !== 'object') DB.ink = {};
    for(const k of Object.keys(pages)) DB.ink[k] = pages[k];
    save(); saveNow();
  }, pages);
  const settled = (p, keys) => p.waitForFunction(keys => keys.every(k => ['saved', 'refused', 'failed'].includes(outsideState('ink', k))), keys, {timeout: 20000, polling: 20})
    .then(() => p.evaluate(keys => keys.map(k => outsideState('ink', k)), keys), () => p.evaluate(keys => keys.map(k => outsideState('ink', k)), keys));
  const storedProg = p => p.evaluate(() => { const v = localStorage.getItem(keyFor(PROFILE)); return v === null ? null : JSON.parse(v); });
  const idbPages = p => p.evaluate(() => new Promise(res => {
    const r = indexedDB.open('exam-drill:' + NS); r.onerror = () => res(null);
    r.onupgradeneeded = () => { try { r.transaction.abort(); } catch(e){} };
    r.onsuccess = () => { const d = r.result; if(!d.objectStoreNames.contains('parts')){ d.close(); res({}); return; }
      const t = d.transaction('parts', 'readonly'), s = t.objectStore('parts'); const out = {};
      const ks = s.getAllKeys(), vs = s.getAll();
      t.oncomplete = () => { ks.result.forEach((k, i) => { out[k] = vs.result[i]; }); d.close(); res(out); }; };
  }));
  const inkNow = p => p.evaluate(() => JSON.parse(JSON.stringify(DB.ink || {})));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const strokesOf = (ink, k) => (ink[k] && ink[k].parts && ink[k].parts.work || []).map(s => JSON.stringify(s));

  try {
    // none: the unchanged page (no part registered) opens no database and keeps DB.ink inside the progress
    {
      const ctx = await newCtx();
      const {page: p, errors} = await open(ctx, L.PAGE.PAGE);
      await put(p, {pg1: {parts: {work: [stroke(1)]}, room: {}, at: 1}});
      const st = await storedProg(p);
      const info = await p.evaluate(() => ({state: OUT.state}));
      const dbs = await p.evaluate(() => indexedDB.databases ? indexedDB.databases().then(l => l.map(d => d.name)) : []);
      check(info.state === 'off' && !dbs.some(n => n.startsWith('exam-drill:')) && st && st.ink && same(st.ink.pg1.parts.work, [stroke(1)]),
        'none: with no part registered no database is opened and DB.ink stays inside the stored progress, as before', {state: info.state, dbs, stored: !!(st && st.ink)});
      check(!errors.length, 'none: no page error', errors);
      await ctx.close();
    }
    // basic
    {
      const ctx = await newCtx();
      const {page: p, errors} = await open(ctx);
      const pg = {parts: {work: [stroke(1), stroke(2)]}, room: {work: 40}, at: 10};
      await put(p, {pg1: pg});
      const states = await settled(p, ['pg1']);
      const st = await storedProg(p);
      check(states[0] === 'saved', 'basic: the page is saved once its transaction completed', states);
      check(st && !('ink' in st) && Array.isArray(st.answers), 'basic: the stored progress in localStorage holds no ink', st && Object.keys(st));
      await reload(p);
      check(same((await inkNow(p)).pg1, pg), 'basic: after a reload the page is back in DB.ink as written', await inkNow(p));
      const rec = (await idbPages(p)) || {};
      const k = Object.keys(rec).find(x => x.endsWith('\u0001ink\u0001pg1'));
      check(!!k && k.startsWith((await p.evaluate(() => PROFILE)) + '\u0001') && rec[k].rev >= 1 && same(rec[k].v, pg), 'basic: the database holds the page under its profile, with a revision', {keys: Object.keys(rec)});
      check(!(await p.evaluate(() => unsavedHere())), 'basic: after the reload the page reports nothing unsaved', null);
      check(!errors.length, 'basic: no page error', errors);
      // large: the size the per-tab record could not hold
      const big = walk(171), chars = JSON.stringify(big).length;
      await put(p, big);
      const bs = await settled(p, Object.keys(big));
      check(bs.every(s => s === 'saved'), `large: 171 generated pages (${chars} characters) are all saved`, bs.filter(s => s !== 'saved').length);
      const st2 = await storedProg(p);
      check(st2 && !('ink' in st2) && JSON.stringify(st2).length < 20000, 'large: the stored progress in localStorage stays small (no ink in it)', st2 && JSON.stringify(st2).length);
      await reload(p);
      const back = await inkNow(p);
      check(Object.keys(big).every(k => same(back[k], big[k])), 'large: after a reload every one of the 171 pages is back as written', Object.keys(back).length);
      console.log(`  info  large sample: ${chars} characters over 171 pages`);
      await ctx.close();
    }
    // migrate and interrupted: the earlier format, DB.ink inside the stored progress
    {
      const old = {a: {parts: {work: [stroke(3)]}, room: {}, at: 3}, b: {parts: {work: [stroke(4), stroke(5)]}, room: {}, at: 4}};
      const plant = (p, ink) => p.evaluate(ink => { const k = keyFor(PROFILE); const v = JSON.parse(localStorage.getItem(k) || JSON.stringify(BLANK())); v.ink = ink; localStorage.setItem(k, JSON.stringify(v)); }, ink);
      // interrupted: every put refused for one visit (a page closed or broken mid-move behaves the same for storage)
      const ctx = await newCtx();
      const {page: o} = await open(ctx, L.PAGE.PAGE);
      await put(o, {}); await plant(o, old); await o.close();
      const refuse = () => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(){ if(this.name === 'parts') throw new DOMException('planted refusal', 'QuotaExceededError'); return put.apply(this, arguments); }; };
      const {page: q} = await open(ctx, PART_PAGE, refuse);
      await q.evaluate(() => { save(); saveNow(); });
      await q.waitForTimeout(500);
      const st = await storedProg(q);
      check(st && st.ink && same(st.ink, old), 'interrupted: while the database refuses every write, localStorage keeps every page of the earlier format', st && st.ink && Object.keys(st.ink));
      const qs = await q.evaluate(() => ['a', 'b'].map(k => outsideState('ink', k)));
      check(qs.every(s => s !== 'saved'), 'interrupted: no page refused by the database is reported saved', qs);
      await q.close();
      // the next visit moves them
      const {page: r} = await open(ctx);
      await settled(r, ['a', 'b']);
      await r.waitForFunction(() => { const v = JSON.parse(localStorage.getItem(keyFor(PROFILE)) || '{}'); return !('ink' in v); }, null, {timeout: 10000}).catch(() => {});
      const st2 = await storedProg(r);
      check(st2 && !('ink' in st2), 'migrate: once every page is in the database, the stored progress in localStorage leaves the ink out', st2 && Object.keys(st2));
      await reload(r);
      const back = await inkNow(r), rec = (await idbPages(r)) || {};
      check(same(back.a, old.a) && same(back.b, old.b), 'migrate: after a reload every moved page is back, each stroke once', back);
      check(Object.keys(rec).filter(k => k.includes('\u0001ink\u0001')).length === 2, 'migrate: the database holds the two pages', Object.keys(rec));
      // mixed: an earlier-core tab (the unchanged page) writes inside the progress after the move
      await r.close();
      const {page: e} = await open(ctx, L.PAGE.PAGE);
      const eInk = await inkNow(e);
      check(!eInk.a, 'mixed: an earlier-core tab does not see the moved pages (expected: they are in the database)', Object.keys(eInk));
      await put(e, {a: {parts: {work: [stroke(9)]}, room: {}, at: 9}});
      await e.close();
      const {page: n} = await open(ctx);
      await settled(n, ['a']);
      const nInk = await inkNow(n);
      check(strokesOf(nInk, 'a').includes(JSON.stringify(stroke(3))) && strokesOf(nInk, 'a').includes(JSON.stringify(stroke(9))),
        'mixed: the next new page keeps both the moved stroke and the earlier-core tab\'s stroke', strokesOf(nInk, 'a'));
      await reload(n);
      check(strokesOf(await inkNow(n), 'a').length === 2, 'mixed: after a reload both strokes are there, once each', strokesOf(await inkNow(n), 'a'));
      await ctx.close();
    }
    // quota: a refusal planted on put (both engines), then the real quota in Chromium
    {
      const ctx = await newCtx(() => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(){ if(window.__refuse && this.name === 'parts') throw new DOMException('planted refusal', 'QuotaExceededError'); return put.apply(this, arguments); }; });
      const {page: p} = await open(ctx);
      const keep = {parts: {work: [stroke(1)]}, room: {}, at: 1};
      await put(p, {k1: keep}); await settled(p, ['k1']);
      await p.evaluate(() => { record(QUESTIONS[0], 'correct', undefined, 1000); saveNow(); });
      await p.evaluate(() => { window.__refuse = true; });
      await put(p, {k1: {parts: {work: [stroke(1), stroke(2)]}, room: {}, at: 2}, k2: {parts: {work: [stroke(7)]}, room: {}, at: 2}});
      const s = await settled(p, ['k1', 'k2']);
      check(s.every(x => x === 'refused'), 'quota: a write the database refuses reports refused, never saved', s);
      const warn = await p.evaluate(() => { const d = document.getElementById('outwarn'); return d ? {text: d.textContent, exp: !!d.querySelector('#outwarnExport')} : null; });
      check(!!warn && /did not save your latest writing/.test(warn.text) && warn.exp, 'quota: a notice says the writing was not saved and offers Export', warn);
      check(await p.evaluate(() => unsavedHere()), 'quota: the page counts the refused writing as unsaved (asked about before it is left)', null);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#outwarnExport')]);
      const file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
      check(file.db && file.db.ink && strokesOf(file.db.ink, 'k1').length === 2 && strokesOf(file.db.ink, 'k2').length === 1, 'quota: the notice\'s Export carries the writing the database refused', file.db && file.db.ink && Object.keys(file.db.ink));
      // the refusal ends: the next change is saved
      await p.evaluate(() => { window.__refuse = false; });
      await put(p, {k2: {parts: {work: [stroke(7), stroke(8)]}, room: {}, at: 3}});
      const s2 = await settled(p, ['k1', 'k2']);
      check(s2.every(x => x === 'saved'), 'quota: once the database takes writes again, the next save stores every page held here', s2);
      check(!(await p.evaluate(() => !!document.getElementById('outwarn'))), 'quota: the notice goes once everything is saved', null);
      await reload(p);
      const back = await inkNow(p), st = await storedProg(p);
      check(strokesOf(back, 'k1').length === 2 && strokesOf(back, 'k2').length === 2 && st.answers.length === 1, 'quota: after a reload the pages and the answer are stored', {k1: strokesOf(back, 'k1').length, k2: strokesOf(back, 'k2').length, answers: st.answers.length});
      await ctx.close();
      if(L.BROWSER === 'chromium'){
        const c2 = await newCtx();
        const {page: q} = await open(c2);
        await put(q, {small: keep}); await settled(q, ['small']);
        const PF = await q.evaluate(() => PROFILE), origin = new URL(q.url()).origin;
        const cdp = await c2.newCDPSession(q);
        let capped = true;
        let why = 'the DevTools protocol refused Storage.overrideQuotaForOrigin';
        try { await cdp.send('Storage.overrideQuotaForOrigin', {origin, quotaSize: 2 * 1048576}); } catch(e){ capped = false; }
        // Chromium 153 accepts the command and leaves the quota as it was (navigator.storage.estimate)
        const est = capped ? await q.evaluate(() => navigator.storage.estimate().then(e => e.quota, () => null)) : null;
        if(capped && !(est !== null && est <= 4 * 1048576)){ capped = false; why = `the browser accepted Storage.overrideQuotaForOrigin but reports a quota of ${est} bytes`; }
        if(capped){
          const big = walk(171);
          await put(q, big);
          const bs = await settled(q, Object.keys(big));
          const refused = bs.filter(x => x === 'refused').length, saved = bs.filter(x => x === 'saved').length;
          check(refused > 0, `quota (Chromium, origin capped at 2 MB): the database refuses some of 171 pages (${refused} refused, ${saved} saved)`, bs.filter(x => x !== 'saved' && x !== 'refused'));
          const truth = await idbPages(q);
          const wrong = Object.keys(big).filter((k, i) => bs[i] === 'saved' && !(truth && truth[PF + '\u0001ink\u0001' + k] && same(truth[PF + '\u0001ink\u0001' + k].v, big[k])));
          check(!wrong.length, 'quota (Chromium): every page reported saved is in the database as written', wrong.length);
          check(!!(truth && truth[PF + '\u0001ink\u0001small'] && same(truth[PF + '\u0001ink\u0001small'].v, keep)), 'quota (Chromium): the page saved before the quota ran out is still stored', null);
          await cdp.send('Storage.overrideQuotaForOrigin', {origin});
        } else L.skip('quota (Chromium): a real quota of 2 MB for the origin', why + '; the planted refusal above ran instead');
        await c2.close();
      }
    }
    // unavailable: IndexedDB cannot be opened
    {
      const ctx = await newCtx(() => { const o = IDBFactory.prototype.open; IDBFactory.prototype.open = function(name){ if(String(name).startsWith('exam-drill:')) throw new DOMException('planted', 'InvalidStateError'); return o.apply(this, arguments); }; });
      const {page: p, errors} = await open(ctx);
      const pg = {parts: {work: [stroke(6)]}, room: {}, at: 6};
      await put(p, {u1: pg});
      const st = await storedProg(p);
      check(await p.evaluate(() => OUT.state) === 'unavailable' && st && st.ink && same(st.ink.u1, pg), 'unavailable: with no database the page stays inside the stored progress', st && st.ink);
      await reload(p);
      check(same((await inkNow(p)).u1, pg), 'unavailable: after a reload the page is back', await inkNow(p));
      check(!errors.length, 'unavailable: no page error', errors);
      await ctx.close();
    }
    // profiles and Erase
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const P0 = await p.evaluate(() => PROFILE);
      const A = {parts: {work: [stroke(1)]}, room: {}, at: 1}, B = {parts: {work: [stroke(2)]}, room: {}, at: 2};
      await put(p, {pa: A}); await settled(p, ['pa']);
      await p.evaluate(() => { useProfile('Other'); });
      await ready(p);
      check(!(await inkNow(p)).pa, 'profiles: another profile does not see the first profile\'s page', Object.keys(await inkNow(p)));
      await put(p, {pb: B}); await settled(p, ['pb']);
      await p.evaluate(P0 => { useProfile(P0); }, P0); await ready(p);
      const a1 = await inkNow(p);
      check(same(a1.pa, A) && !a1.pb, 'profiles: back on the first profile, its own page only', Object.keys(a1));
      await reload(p);
      check(same((await inkNow(p)).pa, A), 'profiles: after a reload the first profile\'s page is there', null);
      // Erase my history on the first profile removes its pages only
      await p.evaluate(() => show('settings'));
      const er = await p.$('button:has-text("Erase my history")');
      if(er){ await er.click(); await p.waitForTimeout(800); }
      await reload(p);
      check(!(await inkNow(p)).pa, 'profiles: Erase my history removes that profile\'s pages (after a reload)', Object.keys(await inkNow(p)));
      await p.evaluate(() => { useProfile('Other'); }); await ready(p);
      check(same((await inkNow(p)).pb, B), 'profiles: Erase on one profile leaves another profile\'s page', Object.keys(await inkNow(p)));
      await ctx.close();
    }
    // two tabs
    {
      // no Web Locks: both tabs write
      const ctx = await newCtx(() => { try { Object.defineProperty(navigator, 'locks', {value: undefined, configurable: true}); } catch(e){} });
      const {page: t1} = await open(ctx);
      await put(t1, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(t1, ['s']);
      const {page: t2} = await open(ctx);
      check(await t2.evaluate(() => WRITER) === 'none', 'two tabs: the planted page has no Web Locks (both tabs may write)', await t2.evaluate(() => WRITER));
      await put(t1, {s: {parts: {work: [stroke(1), stroke(2)]}, room: {}, at: 2}}); await settled(t1, ['s']);
      await put(t2, {s: {parts: {work: [stroke(1), stroke(3)]}, room: {}, at: 3}}); await settled(t2, ['s']);
      const {page: t3} = await open(ctx);
      const got = strokesOf(await inkNow(t3), 's');
      check([1, 2, 3].every(n => got.includes(JSON.stringify(stroke(n)))) && got.length === 3, 'two tabs: a tab that wrote over another tab\'s newer page keeps both tabs\' strokes (read back in a third tab)', got);
      check(strokesOf(await inkNow(t2), 's').length === 3, 'two tabs: the tab whose write was merged shows the merged page', strokesOf(await inkNow(t2), 's'));
      await ctx.close();
      // with Web Locks: the second tab opens read-only and writes nothing
      const c2 = await newCtx();
      const {page: w1} = await open(c2);
      await put(w1, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(w1, ['s']);
      const {page: w2} = await open(c2);
      const locked = await w2.evaluate(() => WRITER), PF = await w2.evaluate(() => PROFILE);
      if(locked === 'other'){
        await put(w2, {s: {parts: {work: [stroke(4)]}, room: {}, at: 4}});
        await w2.waitForTimeout(400);
        const truth = await idbPages(w2);
        check(same(truth[PF + '\u0001ink\u0001s'].v.parts.work, [stroke(1)]), 'two tabs (Web Locks): the tab that does not hold the profile writes no page', truth[PF + '\u0001ink\u0001s'].v.parts.work.length);
        check(await w2.evaluate(() => outsideState('ink', 's')) === 'unsaved', 'two tabs (Web Locks): its change is reported unsaved, not saved', await w2.evaluate(() => outsideState('ink', 's')));
      } else L.skip('two tabs (Web Locks): the second tab', `it opened as ${locked}, not read-only`);
      await c2.close();
    }
    // export and import
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const pages = {e1: {parts: {work: [stroke(1)]}, room: {}, at: 1}, e2: {parts: {work: [stroke(2), stroke(3)]}, room: {}, at: 2}};
      await put(p, pages); await settled(p, ['e1', 'e2']);
      await p.evaluate(() => { record(QUESTIONS[0], 'correct', undefined, 1000); saveNow(); });
      await reload(p);
      await p.evaluate(() => show('settings'));
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnExport')]);
      const file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
      check(file.db && same(file.db.ink, pages), 'export: the file carries every page kept in the database', file.db && file.db.ink && Object.keys(file.db.ink));
      await ctx.close();
      const imp = async (obj, what, own) => {
        const c = await newCtx();
        const {page: q} = await open(c);
        // own: this browser's profile holds other answers, so Import puts the file into a new profile ("separate")
        if(own) await q.evaluate(() => { record(QUESTIONS[1], 'wrong', undefined, 1000); record(QUESTIONS[2], 'correct', undefined, 1000); saveNow(); });
        const f = path.join(TMP, what.replace(/\W+/g, '_') + '.json');
        fs.writeFileSync(f, JSON.stringify(obj));
        await q.evaluate(() => show('settings'));
        await q.setInputFiles('#fileIn', f);
        await q.waitForSelector('#importGo', {timeout: 5000}).catch(() => {});
        const go = await q.$('#importGo');
        if(go){ await go.click(); await q.waitForSelector('#importResult', {timeout: 5000}).catch(() => {}); }
        const result = await q.evaluate(() => { const b = document.getElementById('importPlan'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
        await q.waitForTimeout(800);
        // the file's profile may be this one (replace) or a new one (separate): open whichever has the answer
        await reload(q);
        let ink = await inkNow(q);
        if(!ink.e1){ const others = await q.evaluate(() => { const out = []; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k.startsWith(NS + ':data:')) out.push(k.slice((NS + ':data:').length)); } return out; });
          for(const o of others){ await q.evaluate(o => useProfile(o), o); await ready(q); ink = await inkNow(q); if(ink.e1) break; } }
        const where = await q.evaluate(() => PROFILE);
        await c.close();
        return {ink, result, where};
      };
      const r1 = await imp(file, 'new export');
      check(same(r1.ink.e1, pages.e1) && same(r1.ink.e2, pages.e2), 'export: the file imported into an empty browser brings every page back after a reload', {result: r1.result, keys: Object.keys(r1.ink)});
      const r3 = await imp(file, 'into a new profile', true);
      check(/is now the profile/.test(r3.result) && r3.where !== "me" && same(r3.ink.e1, pages.e1) && same(r3.ink.e2, pages.e2), 'export: a file Import puts into a new profile (this browser holds other answers) has its pages there after a reload', {result: r3.result, where: r3.where, keys: Object.keys(r3.ink)});
      // an earlier core's backup: the same shape (DB.ink inside db), made by the unchanged page
      const c3 = await newCtx();
      const {page: oldp} = await open(c3, L.PAGE.PAGE);
      await put(oldp, pages);
      await oldp.evaluate(() => { record(QUESTIONS[0], 'correct', undefined, 1000); saveNow(); show('settings'); });
      const [dl2] = await Promise.all([oldp.waitForEvent('download'), oldp.click('#btnExport')]);
      const oldFile = JSON.parse(fs.readFileSync(await dl2.path(), 'utf8'));
      await c3.close();
      const r2 = await imp(oldFile, 'earlier core backup');
      check(same(r2.ink.e1, pages.e1) && same(r2.ink.e2, pages.e2), 'export: an earlier core\'s backup (DB.ink in the file) imports and its pages are back after a reload', {result: r2.result, keys: Object.keys(r2.ink)});
    }
    // closing: a change still on save()'s 150 ms timer when the page is reloaded (pagehide writes it)
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      await p.evaluate(() => { function stroke(n){ return {t: 'pen', c: '#111111', w: 0.003, p: [0.1 * n, 0.2, 0.3, 0.4 + 0.01 * n]}; } DB.ink = {c1: {parts: {work: [stroke(1)]}, room: {}, at: 1}}; save(); });
      await reload(p);
      const kept = !!(await inkNow(p)).c1;
      console.log(`  info  closing: a page changed and the page reloaded at once (the write starts in save(), the progress in saveNow on pagehide): ${kept ? 'kept' : 'not kept'} after the reload (${L.BROWSER_NAME}); not a requirement, see the PR`);
      await ctx.close();
    }
  } finally { cleanup(); }
  await browser.close();
  L.finish(NAME);
})().catch(e => { cleanup(); console.log(`FAIL: ${NAME}: ${e && e.stack || e}`); process.exit(1); });
