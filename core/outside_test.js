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
  // the read-back after a moved page's write always succeeds
  'readback-true': ["return outReq(t.objectStore('parts').get(k)).then(r => !!r && sameVal(r.v, v), () => false);", "return Promise.resolve(true);"],
  // writing not yet stored is not kept on the page when DB is replaced (both places that keep it)
  'no-hold': [["  try { if(LOADED) outsideHold(LOADED); } catch(e){}", ""], ["  OUT.sent[k] = undefined;   // the next save tries again; the value stays in OUT.held", "  OUT.sent[k] = undefined; delete OUT.held[k];"]],
  'drop-unavailable': ["if(!OUT.parts.size || OUT.state === 'unavailable' || !isPlainObj(db)) return JSON.stringify(db);", "if(!OUT.parts.size || !isPlainObj(db)) return JSON.stringify(db);"],
};
const BREAK = process.env.OUTSIDE_BREAK || '';
if(BREAK && !BREAKS[BREAK]){ console.log(`unknown OUTSIDE_BREAK ${BREAK}; known: ${Object.keys(BREAKS).join(', ')}`); process.exit(2); }

const built = fs.readFileSync(L.PAGE.PAGE, 'utf8');
if(!built.includes(ANCHOR) || !built.includes('function registerOutside(')) L.notRun(NAME, 'the built page has no outside-part layer (registerOutside)');
let withPart = built.replace(ANCHOR, "registerOutside('ink');\n" + ANCHOR);
if(BREAK){
  const pairs = Array.isArray(BREAKS[BREAK][0]) ? BREAKS[BREAK] : [BREAKS[BREAK]];
  for(const [a, b] of pairs){
    if(!withPart.includes(a)) { console.log(`OUTSIDE_BREAK ${BREAK}: its target text is not in the page`); process.exit(2); }
    withPart = withPart.replace(a, b);
  }
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
      const locks = await p.evaluate(() => navigator.locks && navigator.locks.query ? navigator.locks.query().then(q => (q.held || []).concat(q.pending || []).map(l => l.name)) : []);
      check(!locks.some(n => n.startsWith('exam-drill-tab:')), 'none: with no part registered the page holds no tab lock (the ninth review of #81, C1)', locks);
      await ctx.close();
    }
    {
      const ctx = await newCtx("try { Object.defineProperty(navigator, 'locks', {value: undefined, configurable: true}); } catch(e){}");
      const {page: p} = await open(ctx, L.PAGE.PAGE);
      await put(p, {pg1: {parts: {work: [stroke(1)]}, room: {}, at: 1}});
      const keys = await p.evaluate(() => Object.keys(localStorage).filter(k => k.includes(':tab-alive:')));
      check(!keys.length, 'none, without Web Locks: with no part registered the page writes no tab-alive heartbeat (C1)', keys);
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
      await p.waitForSelector('#outwarn', {timeout: 3000}).catch(() => {});
      const un = await p.evaluate(() => { const d = document.getElementById('outwarn'); return d ? ('[' + d.outerHTML.slice(0, 200) + ']') : 'none; problem: ' + OUT.problem + '; state: ' + OUT.state; });
      check(/could not be used/.test(un), 'unavailable: a notice says the database could not be used and the writing is kept in the other storage', un.slice(0, 300) || 'empty');
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
    // ---- the review of #81 at d0da191 (M1-M5) and its test gaps ----
    const refuseInit = () => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(){ if(window.__refuse && this.name === 'parts') throw new DOMException('planted refusal', 'QuotaExceededError'); return put.apply(this, arguments); }; };
    const noLocks = () => { try { Object.defineProperty(navigator, 'locks', {value: undefined, configurable: true}); } catch(e){} };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    // M1: a refused page kept through a profile switch, named by the notice, written when the profile is opened again.
    // The writer lock is granted 300 ms late (as WebKit on GitHub granted it after the database read), so the
    // page must be written when the lock comes, not only when the read finishes.
    {
      const lateLock = () => { try { const r = LockManager.prototype.request; LockManager.prototype.request = function(){ const a = arguments; return new Promise(res => setTimeout(res, 300)).then(() => r.apply(this, a)); }; } catch(e){} };
      const ctx = await newCtx(() => {});
      await ctx.addInitScript(refuseInit); await ctx.addInitScript(lateLock);
      const {page: p} = await open(ctx);
      const P0 = await p.evaluate(() => PROFILE);
      const R = {parts: {work: [stroke(1)]}, room: {}, at: 1};
      await p.evaluate(() => { window.__refuse = true; });
      await put(p, {r: R}); await settled(p, ['r']);
      await p.evaluate(() => { useProfile('Other'); }); await ready(p);
      const away = await p.evaluate(P0 => { const d = document.getElementById('outwarn'); return {unsaved: unsavedHere(), notice: d ? d.textContent : ''}; }, P0);
      check(away.unsaved && away.notice.includes('"' + P0 + '"'), 'M1: after a switch to another profile, the refused writing of the first counts as unsaved and the notice names that profile', away);
      await p.evaluate(() => { window.__refuse = false; });
      await p.evaluate(P0 => useProfile(P0), P0); await ready(p);
      await settled(p, ['r']);
      await reload(p);
      check(same((await inkNow(p)).r, R), 'M1: back on the first profile the refused page is written; after a reload it is stored', await inkNow(p));
      await ctx.close();
    }
    // M2: "Use it here" in another tab while a page is refused, then taken back: the page is kept and stored
    {
      const ctx = await newCtx(refuseInit);
      const {page: a} = await open(ctx);
      if(await a.evaluate(() => WRITER) !== 'held') L.skip('M2: the take-over', 'no Web Locks in this browser');
      else {
        const R = {parts: {work: [stroke(5)]}, room: {}, at: 5};
        await a.evaluate(() => { window.__refuse = true; });
        await put(a, {r: R}); await settled(a, ['r']);
        const {page: b} = await open(ctx);
        await b.evaluate(() => takeOver(false));
        await b.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
        await a.waitForFunction(() => WRITER === 'other', null, {timeout: 8000}).catch(() => {});
        await a.evaluate(() => { window.__refuse = false; takeOver(false); });
        await a.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
        await ready(a); await settled(a, ['r']);
        await b.close();
        await reload(a);
        check(same((await inkNow(a)).r, R), 'M2: a page refused in a tab whose profile another tab took, then taken back, is stored (after a reload)', await inkNow(a));
      }
      await ctx.close();
    }
    // M3: a merged write with a later change waiting: no moment in which the database lacks the other tab's stroke
    {
      const ctx = await newCtx(noLocks);
      const {page: t1} = await open(ctx);
      await put(t1, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(t1, ['s']);
      const {page: t2} = await open(ctx);
      await put(t1, {s: {parts: {work: [stroke(1), stroke(2)]}, room: {}, at: 2}}); await settled(t1, ['s']);
      const trace = await t2.evaluate(s => new Promise(res => {
        DB.ink.s = {parts: {work: [s[0], s[2]]}, room: {}, at: 3}; save(); DB.ink.s = {parts: {work: [s[0], s[2], s[3]]}, room: {}, at: 4}; save();
        const out = [], t0 = performance.now();
        const poll = () => { const t = OUT.db.transaction('parts'); const g = t.objectStore('parts').get(PROFILE + '\u0001ink\u0001s');
          g.onsuccess = () => { out.push({rev: g.result.rev, w: g.result.v.parts.work.map(x => JSON.stringify(x))}); if(performance.now() - t0 < 400) setTimeout(poll, 3); else res(out); }; };
        poll(); }), [stroke(1), stroke(2), stroke(3), stroke(4)]);
      const s2 = JSON.stringify(stroke(2)), s3 = JSON.stringify(stroke(3));
      const lost = trace.filter(x => x.w.includes(s3) && !x.w.includes(s2));
      check(!lost.length && trace.length > 5, `M3: in ${trace.length} reads of the database during a merged write with a later change waiting, none lacks the other tab's stroke`, lost.slice(0, 2).map(x => x.rev));
      await t1.close(); await t2.close();
      const {page: t3} = await open(ctx);
      const got = strokesOf(await inkNow(t3), 's');
      check([1, 2, 3, 4].every(n => got.includes(JSON.stringify(stroke(n)))), 'M3: after both tabs closed, a new tab reads every stroke of both', got.length);
      await ctx.close();
    }
    // M4: with no database, a tab that does not hold the profile, and a change on the 150 ms wait, are not "saved"
    {
      const ctx = await newCtx(() => { const o = IDBFactory.prototype.open; IDBFactory.prototype.open = function(name){ if(String(name).startsWith('exam-drill:')) throw new DOMException('planted', 'InvalidStateError'); return o.apply(this, arguments); }; });
      const {page: a} = await open(ctx);
      const st = await a.evaluate(() => { DB.ink = {w: {parts: {work: [{t: 'pen', p: [1]}]}, room: {}, at: 1}}; save(); return outsideState('ink', 'w'); });
      check(st === 'saving', 'M4: with no database, right after save() (before the 150 ms write) the page is "saving", not "saved"', st);
      await a.waitForTimeout(400);
      check(await a.evaluate(() => outsideState('ink', 'w')) === 'saved', 'M4: with no database, after the progress write the page is "saved"', await a.evaluate(() => outsideState('ink', 'w')));
      const {page: b} = await open(ctx);
      if(await b.evaluate(() => WRITER) === 'other'){
        await b.evaluate(() => { DB.ink = {z: {parts: {work: [{t: 'pen', p: [2]}]}, room: {}, at: 2}}; save(); });
        await b.waitForTimeout(400);
        check(await b.evaluate(() => outsideState('ink', 'z')) === 'unsaved', 'M4: with no database, a tab that does not hold the profile reports its change "unsaved"', await b.evaluate(() => outsideState('ink', 'z')));
      } else L.skip('M4: the read-only tab', 'no Web Locks in this browser');
      const {page: c} = await open(ctx);
      check(same((await inkNow(c)).w, {parts: {work: [{t: 'pen', p: [1]}]}, room: {}, at: 1}) && !(await inkNow(c)).z, 'M4: a new tab reads the saved page and not the read-only tab\'s change', Object.keys(await inkNow(c)));
      await ctx.close();
    }
    // M5: an Erase with a write still running, and an Erase in another tab: the page does not come back
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const P0 = await p.evaluate(() => PROFILE);
      await put(p, {x: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(p, ['x']);
      await p.evaluate(s => { DB.ink = {x: {parts: {work: [s[0], s[1]]}, room: {}, at: 2}}; save(); outsideClear(PROFILE); DB = BLANK(); save(); }, [stroke(1), stroke(2)]);
      await p.waitForTimeout(600);
      await p.evaluate(() => useProfile('Other')); await ready(p);
      await p.evaluate(P0 => useProfile(P0), P0); await ready(p);
      const back = await p.evaluate(() => ({keys: Object.keys(DB.ink || {}), state: outsideState('ink', 'x')}));
      check(!back.keys.includes('x') && back.state !== 'saved', 'M5: an erased page whose write was still running does not come back after a switch away and back, and is not reported saved', back);
      await put(p, {y: {parts: {work: [stroke(9)]}, room: {}, at: 9}}); await settled(p, ['y']);
      await reload(p);
      const after = Object.keys(await inkNow(p)), rec = (await idbPages(p)) || {};
      check(!after.includes('x') && after.includes('y') && !Object.keys(rec).some(k => k.endsWith('\u0001ink\u0001x')), 'M5: after one more change and a reload, the erased page is in neither the page nor the database', {after, keys: Object.keys(rec)});
      await ctx.close();
      const c2 = await newCtx(noLocks);
      const {page: a} = await open(c2);
      const PA = await a.evaluate(() => PROFILE);
      await put(a, {x: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(a, ['x']);
      const {page: b} = await open(c2);
      await a.evaluate(() => { outsideClear(PROFILE); DB = BLANK(); save(); });
      await a.waitForTimeout(600);
      await b.evaluate(() => useProfile('Other')); await ready(b);
      await b.evaluate(PA => useProfile(PA), PA); await ready(b);
      const bk = await b.evaluate(() => ({keys: Object.keys(DB.ink || {}), state: outsideState('ink', 'x')}));
      check(!bk.keys.includes('x') && bk.state !== 'saved', 'M5: a page erased in another tab does not come back in a tab that switches away and back', bk);
      await c2.close();
    }
    // the read-back: a copy that reads back different keeps the page in localStorage
    {
      const old = {a: {parts: {work: [stroke(3), stroke(4)]}, room: {}, at: 3}};
      const ctx = await newCtx(() => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(val, key){ if(window.__corrupt && this.name === 'parts' && val && val.v && val.v.parts){ val = Object.assign({}, val, {v: Object.assign({}, val.v, {parts: {work: val.v.parts.work.slice(0, 1)}})}); } return put.call(this, val, key); }; });
      const {page: o} = await open(ctx, L.PAGE.PAGE);
      await put(o, {}); await o.evaluate(ink => { const k = keyFor(PROFILE); const v = JSON.parse(localStorage.getItem(k)); v.ink = ink; localStorage.setItem(k, JSON.stringify(v)); }, old);
      await o.close();
      const {page: q} = await open(ctx, PART_PAGE, () => { window.__corrupt = true; });
      await q.waitForTimeout(800);
      const st = await storedProg(q);
      check(st && st.ink && same(st.ink.a, old.a), 'read-back: a database copy that reads back different from the page leaves the page in localStorage', st && st.ink);
      await q.close();
      const {page: r} = await open(ctx);
      await settled(r, ['a']);
      await reload(r);
      check(strokesOf(await inkNow(r), 'a').length === 2, 'read-back: the next visit (copies read back equal) has both strokes after a reload', strokesOf(await inkNow(r), 'a'));
      // interrupted between the write and the read-back
      const c2 = await newCtx(() => { const g = IDBObjectStore.prototype.get; IDBObjectStore.prototype.get = function(){ if(window.__stall && this.transaction.mode === 'readonly' && this.name === 'parts') return {}; return g.apply(this, arguments); }; });
      const {page: o2} = await open(c2, L.PAGE.PAGE);
      await put(o2, {}); await o2.evaluate(ink => { const k = keyFor(PROFILE); const v = JSON.parse(localStorage.getItem(k)); v.ink = ink; localStorage.setItem(k, JSON.stringify(v)); }, old);
      await o2.close();
      const {page: q2} = await open(c2, PART_PAGE, () => { window.__stall = true; });
      await q2.waitForTimeout(800);
      const st2 = await storedProg(q2);
      check(st2 && st2.ink && same(st2.ink.a, old.a), 'read-back: a page closed between the database write and its read-back leaves the page in localStorage', st2 && st2.ink);
      await q2.close();
      const {page: r2} = await open(c2);
      await settled(r2, ['a']);
      await r2.waitForFunction(() => !('ink' in JSON.parse(localStorage.getItem(keyFor(PROFILE)) || '{}')), null, {timeout: 10000}).catch(() => {});
      await reload(r2);
      check(same((await inkNow(r2)).a, old.a) && !('ink' in (await storedProg(r2))), 'read-back: the next visit moves it (in the database, out of localStorage, back after a reload)', null);
      await c2.close(); await ctx.close();
    }
    // a quota refusal that arrives as the transaction's abort (as a full disk does), not a thrown put
    {
      const ctx = await newCtx(() => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(){ const r = put.apply(this, arguments);
        if(window.__abortQuota && this.name === 'parts'){ const t = this.transaction; try { Object.defineProperty(t, 'error', {get: () => new DOMException('planted quota abort', 'QuotaExceededError'), configurable: true}); } catch(e){} t.abort(); }
        return r; }; });
      const {page: p} = await open(ctx);
      const K = {parts: {work: [stroke(1)]}, room: {}, at: 1};
      await put(p, {k: K}); await settled(p, ['k']);
      await p.evaluate(() => { window.__abortQuota = true; });
      await put(p, {k: {parts: {work: [stroke(1), stroke(2)]}, room: {}, at: 2}});
      const s = await settled(p, ['k']);
      check(s[0] === 'refused' && await p.evaluate(() => !!document.getElementById('outwarn')), 'quota abort: a transaction aborted with QuotaExceededError reports refused, with the notice', s);
      await p.evaluate(() => { window.__abortQuota = false; });
      await reload(p);
      check(same((await inkNow(p)).k, K), 'quota abort: after a reload the page as saved before the refusal is stored', await inkNow(p));
      await ctx.close();
    }
    // a crash after the commit: the page closed without unload handlers once "saved"
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const C = {parts: {work: [stroke(7)]}, room: {}, at: 7};
      await put(p, {c: C}); const s = await settled(p, ['c']);
      await p.close({runBeforeUnload: false});
      const {page: q} = await open(ctx);
      check(s[0] === 'saved' && same((await inkNow(q)).c, C), 'closing: a page reported saved is stored after its tab is closed without unload handlers', s);
      await ctx.close();
    }
    // ---- the second review of #81 at 8790d8c (N1, V2, V3) ----
    // N1: leaving or reloading asks about writing that is refused, or kept for another profile
    {
      const ctx = await newCtx(refuseInit);
      const {page: p} = await open(ctx);
      // the leave question (a cancelable beforeunload the page prevents), and the in-app Reload's question
      const leave = () => p.evaluate(() => { const e = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(e); return e.defaultPrevented; });
      // the Reload button's question is answered "no"; a Reload that does not ask is stopped before it reloads
      // (placeSave, which it calls just before location.reload, throws), so the check reports instead of reloading
      const reloadAsks = () => p.evaluate(() => { let asked = ''; const c = window.confirm, ps = placeSave; window.confirm = m => { asked = m; return false; };
        placeSave = () => { throw new Error('stopped before the reload'); };
        try { offerReload('test'); const b = document.querySelector('#swbar [data-reload]'); if(b) b.click(); } finally { window.confirm = c; placeSave = ps; }
        const bar = document.getElementById('swbar'); if(bar) bar.remove(); return asked; });
      check(!(await leave()), 'N1: with nothing unsaved, leaving is not asked about', null);
      await p.evaluate(() => { window.__refuse = true; });
      await put(p, {r: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(p, ['r']);
      check(await leave(), 'N1: with a refused page, leaving the page is asked about (beforeunload prevented)', null);
      check(/not saved/.test(await reloadAsks()), 'N1: with a refused page, the in-app Reload asks first', null);
      await p.evaluate(() => { useProfile('Other'); }); await ready(p);
      check(await leave(), 'N1: with writing kept for another profile, leaving the page is asked about', await p.evaluate(() => Object.keys(OUT.held).length));
      check(/not saved/.test(await reloadAsks()), 'N1: with writing kept for another profile, the in-app Reload asks first', null);
      await ctx.close();
    }
    // V2: a kept value equal to the stored page does not stay unsaved
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const P0 = await p.evaluate(() => PROFILE);
      await put(p, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(p, ['s']);
      await p.evaluate(() => { DB.ink.s = JSON.parse(JSON.stringify(DB.ink.s)); });   // the same content in a new object
      await p.evaluate(() => useProfile('Other')); await ready(p);
      await p.evaluate(P0 => useProfile(P0), P0); await ready(p); await p.waitForTimeout(500);
      const v2 = await p.evaluate(() => ({state: outsideState('ink', 's'), held: Object.keys(OUT.held).length, unsaved: unsavedHere()}));
      check(v2.state === 'saved' && v2.held === 0 && !v2.unsaved, 'V2: a page kept with the same content as the stored page is saved, not kept unsaved', v2);
      await ctx.close();
    }
    // ---- the third review of #81 at 75b016b (Q1 and its should-fixes) ----
    // a read-only tab B keeps writing of page s; tab A erases (the scope given); A closes; B takes the profile
    const v3 = async (opts) => {
      const ctx = await newCtx();
      // a suppressed dialog: every confirm() answers false with no question shown (V5)
      await ctx.addInitScript(() => { window.confirm = () => false; });
      const {page: a} = await open(ctx);
      if(await a.evaluate(() => WRITER) !== 'held'){ await ctx.close(); return null; }
      await put(a, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}, u: {parts: {work: [stroke(5)]}, room: {}, at: 1}}); await settled(a, ['s', 'u']);
      const {page: b} = await open(ctx);
      // B behaves as a module that keeps its own copy of the page (worksheets-ink's INK.data.parts) and
      // follows the core's contract: on 'parked' and 'released' it reloads that copy from DB.ink.s (V12)
      await b.evaluate(() => { window.__ev = []; onOutside(e => { if(e && e.event){ window.__ev.push(e.page + ':' + e.event);
        if(e.page === 's') window.__parts = DB.ink && DB.ink.s ? JSON.parse(JSON.stringify(DB.ink.s.parts)) : {work: []}; } }); });
      // opts.inPlace: B keeps one strokes array and pushes into it, as worksheets-ink does; otherwise a new array each time
      await b.evaluate(s => { window.__parts = {work: [s[0], s[1]]}; DB.ink.s = {parts: window.__parts, room: {}, at: 2}; save(); }, [stroke(1), stroke(2)]);
      await b.waitForTimeout(300);
      if(opts.ownLaterMark){ await a.waitForTimeout(20); }
      await a.evaluate(how => { if(how === 'profile'){ outsideClear(PROFILE); DB = BLANK(); save(); saveNow(); LOG = []; LOG_OK = true; saveLog(); pendingRetire(); }
        else if(how === 'part') outsideClear(PROFILE, 'ink'); else if(how === 'mark-free') pendingMark(); }, opts.erase);
      await a.waitForTimeout(400);
      // the writer tab writes the page again after its Erase (S1: another tab writes the flagged page)
      if(opts.afterWrite){ await put(a, {s: {parts: {work: [stroke(7)]}, room: {}, at: 7}}); await settled(a, ['s']); }
      // B's own later mark (it erases another page itself) must not hide A's earlier one
      if(opts.ownLaterMark) await b.evaluate(() => outsideRemove('ink', 'zz'));
      await a.close();
      // V13: B draws on the page after the Erase, before it takes the profile
      if(opts.lateStroke){
        if(opts.inPlace){ const n = opts.lateStroke === true ? 1 : opts.lateStroke;
          for(let i = 0; i < n; i++) await b.evaluate(i => { window.__parts.work.push({t: 'pen', c: '#111111', w: 0.003, p: [0.3 + i / 1000, 0.2, 0.3, 0.43]}); DB.ink.s = {parts: window.__parts, room: {}, at: 3 + i}; save(); }, i);
          await b.waitForTimeout(300); }
        else { await b.evaluate(s => { window.__parts = {work: window.__parts.work.concat([s])}; DB.ink.s = {parts: window.__parts, room: {}, at: 3}; save(); }, stroke(3)); await b.waitForTimeout(300); }
      }
      await b.evaluate(() => takeOver(false));
      await b.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
      await ready(b); await b.waitForTimeout(800);
      return {ctx, b};
    };
    // a notice button that is not there fails the checks that follow instead of stopping the run
    const clickIf = async (pg, sel) => { for(let i = 0; i < 5; i++){ const el = await pg.$(sel); if(!el) return false; try { await el.click(); return true; } catch(e){ await pg.waitForTimeout(100); } } return false; };   // the notice may be redrawn between finding and clicking
    const staleNotice = b => b.evaluate(() => { const d = document.querySelector('#outwarn .outstale'); return d ? {text: d.textContent, add: !!d.querySelector('[data-outadd]'), exp: !!d.querySelector('[data-outexp]'), drop: !!d.querySelector('[data-outdrop]')} : null; });
    {
      const r = await v3({erase: 'profile'});
      if(!r) L.skip('Q1', 'no Web Locks in this browser');
      else {
        const {ctx, b} = r;
        const n = await staleNotice(b);
        check(!!n && n.add && n.exp && n.drop && /"s" \(2 strokes\)/.test(n.text) && await b.evaluate(() => unsavedHere()),
          'Q1: with dialogs suppressed, writing kept from before another tab\'s Erase is kept, counted unsaved, and named on the notice with Add it back, Export it and Leave it out', n);
        check(!(await inkNow(b)).s, 'Q1: it is not written into the erased profile on its own', Object.keys(await inkNow(b)));
        let file = {db: {}};
        if(await b.$('#outwarn [data-outexp]')){ const [dl] = await Promise.all([b.waitForEvent('download'), b.click('#outwarn [data-outexp]')]); file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); }
        check(strokesOf(file.db.ink || {}, 's').length === 2, 'Q1: Export it gives a file with the kept writing', file.db.ink && Object.keys(file.db.ink));
        await clickIf(b, '#outwarn [data-outadd]');
        await settled(b, ['s']);
        await reload(b);
        check(strokesOf(await inkNow(b), 's').length === 2, 'Q1: Add it back writes it; after a reload the page has both strokes', strokesOf(await inkNow(b), 's'));
        await ctx.close();
      }
    }
    {
      const r = await v3({erase: 'profile'});
      if(r){
        const {ctx, b} = r;
        // a page made after the erase is not named and not discarded
        await put(b, {t: {parts: {work: [stroke(8)]}, room: {}, at: 8}}); await settled(b, ['t']);
        const n = await staleNotice(b);
        check(!!n && /"s"/.test(n.text) && !/"t"/.test(n.text), 'Leave it out: the notice names only the page kept from before the Erase', n && n.text.slice(0, 160));
        await clickIf(b, '#outwarn [data-outdrop]');
        // its recovery record is deleted in a transaction the click starts; the reload follows its commit
        await b.waitForFunction(() => !Object.keys(OUT.recLast).length, null, {timeout: 3000}).catch(() => {});
        await reload(b);
        const ink = await inkNow(b);
        await b.waitForFunction(() => !unsavedHere(), null, {timeout: 3000}).catch(() => {});   // the load's own read and writes settle first
        const un = await b.evaluate(() => ({u: unsavedHere(), o: outsideUnsaved(), p: progUnsavedHere(), l: logUnsavedHere(), held: Object.keys(OUT.held).length, parked: Object.keys(OUT.parked).length, amb: Object.keys(OUT.amb).length, busy: Object.keys(OUT.busy).filter(k => OUT.busy[k]).length}));
        check(!ink.s && strokesOf(ink, 't').length === 1 && !un.u, 'Leave it out: discards the named page only; the later page is stored (after a reload)', {keys: Object.keys(ink), un});
        await ctx.close();
      }
    }
    // S1: writing on the page whose earlier writing is set apart, here and from another tab
    {
      const r = await v3({erase: 'profile'});
      if(r){
        const {ctx, b} = r;
        await put(b, {s: {parts: {work: [stroke(9)]}, room: {}, at: 9}}); await settled(b, ['s']);
        await b.waitForTimeout(300);
        const n = await staleNotice(b);
        check(!!n && /"s" \(2 strokes\)/.test(n.text) && await b.evaluate(() => unsavedHere()), 'S1: after the student writes on the page, the writing from before the Erase is still set apart and named (2 strokes), and counts unsaved', n && n.text.slice(0, 140));
        await clickIf(b, '#outwarn [data-outadd]'); await settled(b, ['s']);
        await reload(b);
        const got = strokesOf(await inkNow(b), 's');
        check([1, 2, 9].every(x => got.includes(JSON.stringify(stroke(x)))) && got.length === 3, 'S1: Add it back then keeps both: after a reload the page has the 2 kept strokes and the new one', got.length);
        await ctx.close();
      }
    }
    {
      const r = await v3({erase: 'profile', afterWrite: true});
      if(r){
        const {ctx, b} = r;
        const n = await staleNotice(b);
        check(!!n && /"s" \(2 strokes\)/.test(n.text), 'S1: when the other tab wrote the page after its Erase, the writing kept here from before it is still set apart and named (2 strokes)', n && n.text.slice(0, 140));
        await clickIf(b, '#outwarn [data-outadd]'); await settled(b, ['s']);
        await reload(b);
        const got = strokesOf(await inkNow(b), 's');
        check([1, 2, 7].every(x => got.includes(JSON.stringify(stroke(x)))) && got.length === 3, 'S1: Add it back then keeps both: after a reload the page has the kept strokes and the other tab\'s new one', got.length);
        await ctx.close();
      }
    }
    // an Erase whose mark the browser refuses (storage full) says so
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const said = await p.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if(String(k).includes(':outside-mark:')) throw new DOMException('full', 'QuotaExceededError'); return set.apply(this, arguments); };
        try { outsideClear(PROFILE); } finally { Storage.prototype.setItem = set; }
        const d = document.getElementById('outwarn'); return d ? d.textContent : ''; });
      check(/were not told of this erase/.test(said), 'marks: an Erase whose mark the browser refuses tells the student the other tabs were not told', said.slice(0, 120));
      await ctx.close();
    }
    // the fifth review of #81 at 7f359e7: V12 (module events), V13 (late strokes named), V11 (Export carries set-apart writing)
    {
      const r = await v3({erase: 'profile'});
      if(r){
        const {ctx, b} = r;
        const ev1 = await b.evaluate(() => window.__ev.slice());
        check(ev1.includes('s:parked'), 'V12: a page set apart sends the module an event ("parked") so it reloads its own copy of the page', ev1);
        await b.evaluate(() => show('settings'));
        let file = {db: {}};
        if(await b.$('#btnExport')){ const [dl] = await Promise.all([b.waitForEvent('download'), b.click('#btnExport')]); file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); }
        check(strokesOf(file.db.ink || {}, 's').length === 2, 'V11: Export progress for the profile on screen carries the writing set apart from before the Erase', file.db.ink && Object.keys(file.db.ink));
        await clickIf(b, '#outwarn [data-outadd]'); await settled(b, ['s']);
        const ev2 = await b.evaluate(() => window.__ev.slice());
        check(ev2.includes('s:released'), 'V12: Add it back sends the module a "released" event for the page', ev2);
        await reload(b);
        check(strokesOf(await inkNow(b), 's').length === 2, 'V12: after Add it back and a reload, the page has both strokes', strokesOf(await inkNow(b), 's'));
        await ctx.close();
      }
    }
    {
      const r = await v3({erase: 'profile', lateStroke: true});
      if(r){
        const {ctx, b} = r;
        const n = await staleNotice(b);
        check(!!n && /"s" \(2 strokes\)/.test(n.text) && /restores the writing from before the erase/.test(n.text) && /(recovery copy of it is saved|in this tab's memory)/.test(n.text),
          'V13: only the writing from before the Erase is set apart and named (2 strokes); Add it back says it restores writing from before the erase; the notice says it is only in memory', n && n.text.slice(0, 260));
        await clickIf(b, '#outwarn [data-outdrop]');
        await settled(b, ['s']);
        await reload(b);
        const got = strokesOf(await inkNow(b), 's');
        check(got.length === 1 && got[0] === JSON.stringify(stroke(3)), 'V13: Leave it out deletes only the named writing: the stroke drawn after the Erase is stored (after a reload)', got);
        await ctx.close();
      }
    }
    // A1: strokes changed in place, as worksheets-ink changes them, cannot reach what is set apart
    for(const late of [1, 25]){
      const r = await v3({erase: 'profile', lateStroke: late, inPlace: true});
      if(r){
        const {ctx, b} = r;
        const n = await staleNotice(b);
        check(!!n && /"s" \(2 strokes\)/.test(n.text), `A1: with strokes pushed in place (${late} after the Erase${late > 20 ? ', more than 20 changes' : ''}), only the 2 strokes from before it are set apart and named`, n && n.text.slice(0, 200));
        await clickIf(b, '#outwarn [data-outdrop]'); await settled(b, ['s']);
        await reload(b);
        const got = strokesOf(await inkNow(b), 's');
        check(got.length === late && !got.includes(JSON.stringify(stroke(1))) && !got.includes(JSON.stringify(stroke(2))), `A1: Leave it out deletes only those 2; the ${late} stroke${late === 1 ? '' : 's'} drawn after the Erase ${late === 1 ? 'is' : 'are'} stored (after a reload)`, got.length);
        await ctx.close();
      }
    }
    // Export it removes nothing
    {
      const r = await v3({erase: 'profile'});
      if(r){
        const {ctx, b} = r;
        if(await b.$('#outwarn [data-outexp]')){ await Promise.all([b.waitForEvent('download'), b.click('#outwarn [data-outexp]')]); }
        await b.waitForTimeout(300);
        const after = await b.evaluate(() => ({parked: Object.keys(OUT.parked).length, notice: !!document.querySelector('#outwarn .outstale')}));
        check(after.parked === 1 && after.notice, 'Export it removes nothing: the writing stays set apart and named after the export', after);
        await clickIf(b, '#outwarn [data-outadd]'); await settled(b, ['s']); await reload(b);
        check(strokesOf(await inkNow(b), 's').length === 2, 'Export it removes nothing: Add it back afterwards still restores both strokes (after a reload)', strokesOf(await inkNow(b), 's'));
        await ctx.close();
      }
    }
    // ---- Louis's decisions of 2026-11-08 and the seventh review of #81 at fb659a6 ----
    const holdInit = () => {   // window.__hold keeps a write of page "A" waiting inside its transaction; __puts counts writes of A
      window.__puts = 0;
      const g = IDBObjectStore.prototype.get, put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function(val, key){ if(String(key).endsWith('\u0001ink\u0001A')) window.__puts++; return put.apply(this, arguments); };
      IDBObjectStore.prototype.get = function(key){
        if(!(window.__hold && String(key).endsWith('\u0001ink\u0001A') && this.transaction.mode === 'readwrite')) return g.apply(this, arguments);
        const store = this, fake = {};
        const spin = () => { const r = g.call(store, key); r.onsuccess = () => { if(window.__hold) spin(); else { fake.result = r.result; if(fake.onsuccess) fake.onsuccess(); } }; };
        spin(); return fake;
      };
    };
    // ChatGPT, comment 6723699881: erasing page B does not discard page A's waiting save
    {
      const ctx = await newCtx(holdInit);
      const {page: p} = await open(ctx);
      await put(p, {A: {parts: {work: [stroke(1)]}, room: {}, at: 1}, B: {parts: {work: [stroke(5)]}, room: {}, at: 1}}); await settled(p, ['A', 'B']);
      await p.evaluate(s => { window.__hold = true; DB.ink.A = {parts: {work: [s[0], s[1]]}, room: {}, at: 2}; save(); DB.ink.A = {parts: {work: [s[0], s[1], s[2]]}, room: {}, at: 3}; save(); }, [stroke(1), stroke(2), stroke(3)]);
      await p.waitForTimeout(200);
      await p.evaluate(() => { outsideRemove('ink', 'B'); });
      await p.waitForTimeout(200);
      await p.evaluate(() => { window.__hold = false; });
      await settled(p, ['A']);
      check(!(await p.evaluate(() => typeof outsideAtRisk === 'function' && outsideAtRisk())), 'race: erasing B while A\'s save waits leaves nothing of A at risk once it settles', null);
      await reload(p);
      const ink = await inkNow(p);
      check(strokesOf(ink, 'A').length === 3 && !ink.B, 'race: after a reload A has all 3 strokes and B stays erased', {A: strokesOf(ink, 'A').length, B: !!ink.B});
      // a real erase of A while its save waits still keeps A from coming back
      await p.evaluate(s => { window.__hold = true; DB.ink.A = {parts: {work: [s[0], s[1], s[2], s[3]]}, room: {}, at: 4}; save(); }, [stroke(1), stroke(2), stroke(3), stroke(4)]);
      await p.waitForTimeout(200);
      await p.evaluate(() => { outsideRemove('ink', 'A'); });
      await p.evaluate(() => { window.__hold = false; });
      await p.waitForTimeout(800);
      await reload(p);
      check(!(await inkNow(p)).A, 'race: erasing A itself while its save waits keeps A erased (after a reload)', Object.keys(await inkNow(p)));
      await ctx.close();
    }
    // B1: erase a stroke and draw during a write: a few writes, 'saved', the erased stroke stays erased
    {
      const ctx = await newCtx(holdInit);
      const {page: p} = await open(ctx);
      const P0 = await p.evaluate(() => PROFILE);
      await put(p, {A: {parts: {work: [stroke(1), stroke(2)]}, room: {}, at: 1}}); await settled(p, ['A']);
      await p.evaluate(s => { window.__hold = true; DB.ink.A = {parts: {work: [s[0], s[1], s[2]]}, room: {}, at: 2}; save();
        DB.ink.A = {parts: {work: [s[0], s[2]]}, room: {}, at: 3}; save();          // the eraser removes stroke 2
        DB.ink.A = {parts: {work: [s[0], s[2], s[3]]}, room: {}, at: 4}; save(); }, [stroke(1), stroke(2), stroke(3), stroke(4)]);
      await p.waitForTimeout(150);
      const before = await p.evaluate(() => window.__puts);
      await p.evaluate(() => { window.__hold = false; });
      await settled(p, ['A']); await p.waitForTimeout(600);
      const after = await p.evaluate(() => ({puts: window.__puts, state: outsideState('ink', 'A')}));
      check(after.puts - before <= 4 && after.state === 'saved', `B1: erasing and drawing during a write ends in a few writes (${after.puts - before}) and "saved"`, after);
      await p.evaluate(() => useProfile('Other')); await ready(p);
      await p.evaluate(P0 => useProfile(P0), P0); await ready(p);
      const sw = strokesOf(await inkNow(p), 'A');
      await reload(p);
      const rl = strokesOf(await inkNow(p), 'A');
      const want = [1, 3, 4].map(n => JSON.stringify(stroke(n)));
      check([sw, rl].every(g => g.length === 3 && want.every(w => g.includes(w)) && !g.includes(JSON.stringify(stroke(2)))), 'B1: after a profile switch and after a reload, the page is strokes 1, 3 and 4; the erased stroke 2 does not come back', {switch: sw.length, reload: rl.length});
      await ctx.close();
    }
    // X4: a page changed in place, same outer object, is not shown saved and is written
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      await put(p, {A: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(p, ['A']);
      const st = await p.evaluate(s => { DB.ink.A.parts.work.push(s); save(); return outsideState('ink', 'A'); }, stroke(2));
      check(st !== 'saved', 'X4: a page changed in place under the same object is not reported saved', st);
      await settled(p, ['A']); await p.waitForTimeout(300);
      await reload(p);
      check(strokesOf(await inkNow(p), 'A').length === 2, 'X4: it is written: after a reload the page has both strokes', strokesOf(await inkNow(p), 'A').length);
      await ctx.close();
    }
    // should-fix 2: a write that finds its page erased by another tab before the mark arrived keeps the writing apart
    {
      const ctx = await newCtx(() => { try { Object.defineProperty(navigator, 'locks', {value: undefined, configurable: true}); } catch(e){} });
      const {page: a} = await open(ctx);
      await put(a, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(a, ['s']);
      const {page: b} = await open(ctx, PART_PAGE, () => { const ae = window.addEventListener; window.addEventListener = function(type){ if(type === 'storage') return; return ae.apply(this, arguments); }; });
      await a.evaluate(() => outsideRemove('ink', 's'));
      await a.waitForTimeout(300);
      await b.evaluate(s => { DB.ink.s = {parts: {work: [s[0], s[1]]}, room: {}, at: 2}; save(); }, [stroke(1), stroke(2)]);
      await b.waitForTimeout(500);
      const v = await b.evaluate(() => ({amb: Object.keys(OUT.amb || {}).length, notice: (document.querySelector('#outwarn .outstale') || {}).textContent || ''}));
      const truth = await idbPages(b);
      check(v.amb === 1 && /not known whether drawn before or after/.test(v.notice) && !Object.keys(truth || {}).some(k => k.endsWith('\u0001ink\u0001s')), 'mark race: a write that finds the page erased elsewhere writes nothing and keeps the writing apart, named as unsure', {v, keys: Object.keys(truth || {})});
      await ctx.close();
    }
    // the 20-snapshot boundary: a tab that missed the mark, 25 changes after it: nothing ambiguous is offered for deletion
    {
      const ctx = await newCtx();
      const {page: a} = await open(ctx);
      if(await a.evaluate(() => WRITER) === 'held'){
        await put(a, {s: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(a, ['s']);
        const {page: b} = await open(ctx, PART_PAGE, () => { const ae = window.addEventListener; window.addEventListener = function(type){ if(type === 'storage') return; return ae.apply(this, arguments); }; });
        await b.evaluate(s => { window.__parts = {work: [s[0], s[1]]}; DB.ink.s = {parts: window.__parts, room: {}, at: 2}; save(); }, [stroke(1), stroke(2)]);
        await b.waitForTimeout(300);
        await a.evaluate(() => { outsideClear(PROFILE); DB = BLANK(); save(); saveNow(); });
        await a.waitForTimeout(400); await a.close();
        for(let i = 0; i < 25; i++) await b.evaluate(i => { window.__parts.work.push({t: 'pen', c: '#111111', w: 0.003, p: [0.5 + i / 1000, 0.2, 0.3, 0.4]}); DB.ink.s = {parts: window.__parts, room: {}, at: 10 + i}; save(); }, i);
        await b.waitForTimeout(300);
        await b.evaluate(() => { window.__ev = []; onOutside(e => { if(e && e.event && e.page === 's') window.__parts = DB.ink && DB.ink.s ? JSON.parse(JSON.stringify(DB.ink.s.parts)) : {work: []}; }); takeOver(false); });
        await b.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
        await ready(b); await b.waitForTimeout(1000);
        const n = await staleNotice(b);
        check(!!n && /"s" \(2 strokes\)/.test(n.text) && /not known whether drawn before or after/.test(n.text), '20 snapshots: with 25 changes after a missed mark, only the 2 strokes proven from before it can be left out; the rest in between is named as unsure', n && n.text.slice(0, 260));
        await clickIf(b, '#outwarn [data-outdrop]'); await settled(b, ['s']);
        const mid = await b.evaluate(() => ({amb: Object.keys(OUT.amb || {}).length, page: (DB.ink && DB.ink.s ? DB.ink.s.parts.work.length : 0)}));
        await clickIf(b, '#outwarn [data-outadd]'); await settled(b, ['s']);
        await reload(b);
        const got = strokesOf(await inkNow(b), 's');
        check(mid.amb === 1 && got.length === 25 && !got.includes(JSON.stringify(stroke(1))) && !got.includes(JSON.stringify(stroke(2))), '20 snapshots: Leave it out deletes only the 2; the unsure writing stays until Add it back; after a reload all 25 later strokes are stored', {mid, got: got.length});
      } else L.skip('20 snapshots', 'no Web Locks');
      await ctx.close();
    }
    // recovery records: set-apart writing survives a reload; refused and profile-switch writing survive a killed browser
    {
      const r = await v3({erase: 'profile'});
      if(r){
        const {ctx, b} = r;
        await b.waitForFunction(() => Object.keys(OUT.parked).every(k => (OUT.recState || {})[k] === 'saved'), null, {timeout: 5000}).catch(() => {});
        const n1 = await staleNotice(b);
        check(!!n1 && /recovery copy of it is saved/.test(n1.text) && !(await b.evaluate(() => typeof outsideAtRisk === 'function' && outsideAtRisk())), 'recovery: set-apart writing is saved as a recovery record (only after its transaction), and leaving is then not at risk', n1 && n1.text.slice(0, 200));
        await reload(b); await b.waitForTimeout(800);
        const n2 = await staleNotice(b);
        check(!!n2 && /"s" \(2 strokes\)/.test(n2.text) && !(await inkNow(b)).s, 'recovery: after a reload the set-apart writing is back, still set apart (not active ink)', n2 && n2.text.slice(0, 120));
        await clickIf(b, '#outwarn [data-outadd]'); await settled(b, ['s']); await reload(b);
        check(strokesOf(await inkNow(b), 's').length === 2 && !(await b.evaluate(() => Object.keys(OUT.parked).length)), 'recovery: Add it back after the reload moves it into the page (after another reload)', strokesOf(await inkNow(b), 's').length);
        const recs = await b.evaluate(() => new Promise(res => { const t = OUT.db.transaction('parts'); const r = t.objectStore('parts').getAllKeys(IDBKeyRange.bound('\u0002', '\u0003')); r.onsuccess = () => res(r.result.length); }));
        check(recs === 0, 'recovery: once added back and written, no recovery record is left', recs);
        await ctx.close();
      }
    }
    {
      const fsx = require('fs'), os = require('os'), cp = require('child_process');
      const dir = fsx.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'outside-kill-'));
      const type = L.browserType(NAME);
      const start = async init => { const c = await type.launchPersistentContext(dir, Object.assign({}, L.OPEN_CTX)); await c.addInitScript(() => { window.prompt = () => 'TestUser'; }); if(init) await c.addInitScript(init); return c; };
      const kill = () => { try { cp.execSync(`pkill -9 -f ${JSON.stringify(dir)}`); } catch(e){} };
      let c = await start(() => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(val, key){ if(window.__refuse && this.name === 'parts' && !String(key).startsWith('\u0002')) throw new DOMException('planted', 'QuotaExceededError'); return put.apply(this, arguments); }; });
      let {page: p} = await open(c);
      const P0 = await p.evaluate(() => PROFILE);
      await p.evaluate(() => { window.__refuse = true; });
      await put(p, {r: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(p, ['r']);
      await p.evaluate(() => useProfile('Other')); await ready(p);
      await put(p, {o: {parts: {work: [stroke(2)]}, room: {}, at: 2}}); await settled(p, ['o']);
      await p.waitForFunction(() => Object.keys(OUT.held).length >= 2 && Object.keys(OUT.held).every(k => (OUT.recState || {})[k] === 'saved'), null, {timeout: 5000}).catch(() => {});
      const saved = await p.evaluate(() => Object.keys(OUT.held).map(k => OUT.recState[k]));
      kill();
      await c.close().catch(() => {});
      c = await start();
      ({page: p} = await open(c));
      await p.waitForTimeout(500);
      await p.evaluate(() => { if(PROFILE !== 'Other') useProfile('Other'); }); await ready(p); await p.waitForTimeout(1000);
      await settled(p, ['o']);
      const oNow = strokesOf(await inkNow(p), 'o').length;
      await p.evaluate(P0 => useProfile(P0), P0); await ready(p); await p.waitForTimeout(1000);
      await settled(p, ['r']);
      await p.reload(); await ready(p);
      const rNow = strokesOf(await inkNow(p), 'r').length;
      check(saved.every(x => x === 'saved') && oNow === 1 && rNow === 1, 'recovery: refused writing and writing kept for another profile survive a killed browser and are written when opened again', {saved, oNow, rNow});
      await c.close().catch(() => {});
      try { fsx.rmSync(dir, {recursive: true, force: true}); } catch(e){}
    }
    // ---- the eighth review of #81 at f92b886: R5 (a live tab's recovery records are not taken over) ----
    {
      // an init script is sent to the page as source text, so the choice is written into it (a closure's variable would not reach the page)
      const refuse = noLocks => '(' + (() => {
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function(val, key){ if(window.__refuse && this.name === 'parts' && !String(key).startsWith('\u0002')) throw new DOMException('planted', 'QuotaExceededError'); return put.apply(this, arguments); };
      }).toString() + ')();' + (noLocks ? "try { Object.defineProperty(navigator, 'locks', {value: undefined, configurable: true}); } catch(e){}" : '');
      const recKeys = pg => pg.evaluate(() => new Promise(res => { const t = OUT.db.transaction('parts'); const r = t.objectStore('parts').getAllKeys(IDBKeyRange.bound('\u0002', '\u0003')); r.onsuccess = () => res(r.result.map(String)); }));
      for(const noLocks of [false, true]){
        const label = noLocks ? 'without Web Locks' : 'with Web Locks';
        const hasLocks = await (async () => { const c = await newCtx(); const {page} = await open(c); const v = await page.evaluate(() => !!(navigator.locks && navigator.locks.query)); await c.close(); return v; })();
        if(!noLocks && !hasLocks){ L.skip('R5 ' + label, 'no Web Locks'); continue; }
        const ctx = await newCtx(refuse(noLocks));
        const {page: a} = await open(ctx);
        await a.evaluate(() => { window.__refuse = true; });
        await put(a, {r: {parts: {work: [stroke(1)]}, room: {}, at: 1}}); await settled(a, ['r']);
        await a.waitForFunction(() => Object.keys(OUT.held).length === 1 && Object.keys(OUT.held).every(k => (OUT.recState || {})[k] === 'saved'), null, {timeout: 5000}).catch(() => {});
        const aTab = await a.evaluate(() => TAB_ID);
        if(noLocks) check(await a.evaluate(() => navigator.locks === undefined), 'R5 without Web Locks: the page runs with navigator.locks absent', null);
        const {page: b} = await open(ctx); await b.waitForTimeout(800);
        const keys = await recKeys(b), bHeld = await b.evaluate(() => Object.keys(OUT.held).length);
        check(keys.some(k => k.endsWith('\u0001' + aTab)) && bHeld === 0, 'R5 ' + label + ': a tab that loads while another open tab keeps refused writing leaves that tab\'s recovery record alone', {keys: keys.length, mine: keys.some(k => k.endsWith('\u0001' + aTab)), bHeld});
        if(noLocks){
          const r = await b.evaluate(() => typeof outRecOrphan === 'function' && {old: outRecOrphan({tab: 'x', at: Date.now() - 6 * 60000}, null, Date.now()), fresh: outRecOrphan({tab: 'x', at: Date.now() - 1000}, null, Date.now())});
          check(r && r.old === true && r.fresh === false, 'R5 without Web Locks: only a record whose tab has written neither it nor a heartbeat for 5 minutes counts as left behind', r);
          // a record taken over all the same (here deleted, as a takeover does): the owning tab notices, asks before leaving, and writes it again
          await b.evaluate(tab => new Promise(res => { const t = OUT.db.transaction('parts', 'readwrite'); const st = t.objectStore('parts'); const r = st.getAllKeys(IDBKeyRange.bound('\u0002', '\u0003')); r.onsuccess = () => { r.result.filter(k => String(k).endsWith('\u0001' + tab)).forEach(k => st.delete(k)); }; t.oncomplete = res; }), aTab);
          const mid = await a.evaluate(() => new Promise(res => { if(typeof outsideRecCheck !== 'function') return res(null); outsideRecCheck(); setTimeout(() => res({risk: outsideAtRisk(), notice: ((document.getElementById('outwarn') || {}).textContent || '')}), 0); }));
          await a.waitForFunction(() => Object.keys(OUT.held).every(k => (OUT.recState || {})[k] === 'saved' && OUT.recLast[k] !== undefined), null, {timeout: 5000}).catch(() => {});
          const back = (await recKeys(a)).some(k => k.endsWith('\u0001' + aTab));
          check(!!mid && back && !(await a.evaluate(() => outsideAtRisk())), 'R5: a tab whose recovery record was taken over finds it gone, and writes it again (then leaving is not at risk)', {mid: mid && {risk: mid.risk}, back});
          // H1: the record taken over and its writing written as the page by the other tab (here put straight into the store,
          // as that tab's write does): the returning tab drops its copy instead of writing it again
          await b.evaluate(([tab, k, v]) => new Promise(res => { const t = OUT.db.transaction('parts', 'readwrite'); const st = t.objectStore('parts');
            const r = st.getAllKeys(IDBKeyRange.bound('\u0002', '\u0003')); r.onsuccess = () => { r.result.filter(x => String(x).endsWith('\u0001' + tab)).forEach(x => st.delete(x)); };
            st.put({v, rev: 7, at: Date.now(), tab: 'other'}, k); t.oncomplete = res; }), [aTab, await a.evaluate(() => Object.keys(OUT.held)[0]), {parts: {work: [stroke(1), stroke(9)]}, room: {}, at: 9}]);
          await a.evaluate(() => typeof outsideRecCheck === 'function' && outsideRecCheck()); await a.waitForTimeout(600);
          const h1 = await a.evaluate(() => ({held: Object.keys(OUT.held).length, risk: outsideAtRisk(), screen: (DB.ink && DB.ink.r && DB.ink.r.parts.work.length) || 0}));
          const h1rec = (await recKeys(a)).some(k => k.endsWith('\u0001' + aTab));
          check(h1.held === 0 && !h1rec && !h1.risk && h1.screen === 2, 'H1: a returning tab whose kept writing the stored page already holds drops its copy, writes no record, and shows the stored page', {h1, h1rec});
        }
        await ctx.close();
      }
    }
    // the tenth review of #81: a tab lock granted while the page is in the back/forward cache is let go at once
    // (pagehide is dispatched here as the browser does; headless Chromium runs with that cache switched off)
    {
      const gate = () => {
        if(!(navigator.locks && navigator.locks.request)) return;
        const orig = navigator.locks.request.bind(navigator.locks);
        window.__tabGate = new Promise(r => { window.__grant = r; });
        navigator.locks.request = function(name, ...rest){ if(String(name).startsWith('exam-drill-tab:') && !window.__tabPassed) return window.__tabGate.then(() => orig(name, ...rest)); return orig(name, ...rest); };
      };
      const ctx = await newCtx(gate);
      const {page: p} = await open(ctx);
      if(await p.evaluate(() => !!(navigator.locks && navigator.locks.query))){
        const mine = () => p.evaluate(() => navigator.locks.query().then(q => (q.held || []).some(l => l.name === 'exam-drill-tab:' + TAB_ID)));
        await p.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true})); window.__tabPassed = true; window.__grant(); });
        await p.waitForTimeout(400);
        const whileCached = await mine();
        await p.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); });
        await p.waitForFunction(() => navigator.locks.query().then(q => (q.held || []).some(l => l.name === 'exam-drill-tab:' + TAB_ID)), null, {timeout: 3000}).catch(() => {});
        const shown = await mine();
        check(!whileCached && shown, 'bfcache: a tab lock granted after the page went into the back/forward cache is let go at once, and taken again when the page is shown', {whileCached, shown});
      } else L.skip('bfcache tab lock', 'no Web Locks');
      await ctx.close();
    }
    // the mark list stays bounded: past 100 marks the oldest become one whole-profile mark, which still sets apart
    {
      const ctx = await newCtx();
      const {page: p} = await open(ctx);
      const r = await p.evaluate(() => { const k = NS + ':outside-mark:' + PROFILE; const list = []; for(let i = 0; i < 100; i++) list.push({at: 1000 + i, tab: 'other-' + i, part: 'ink', page: 'pg' + i});
        localStorage.setItem(k, JSON.stringify(list)); outsideMarkErased(PROFILE, 'ink', 'new'); const v = JSON.parse(localStorage.getItem(k));
        return {n: v.length, first: v[0]}; });
      check(r.n <= 100 && r.first.tab === '*' && !r.first.page && r.first.at === 1049, 'marks: past 100, the oldest 50 become one whole-profile mark at the latest of their times', r);
      await ctx.close();
    }
    {
      const r = await v3({erase: 'mark-free'});
      if(r){
        const {ctx, b} = r;
        const marks = await b.evaluate(() => localStorage.getItem(NS + ':outside-mark:' + PROFILE));
        await settled(b, ['s']); await reload(b);
        check(!marks && strokesOf(await inkNow(b), 's').length === 2, 'V6: Put back and a replacing Import (pendingMark) set no mark; kept writing is merged and stored (after a reload)', {marks, s: strokesOf(await inkNow(b), 's').length});
        await ctx.close();
      }
    }
    {
      const r = await v3({erase: 'part'});
      if(r){
        const {ctx, b} = r;
        const n = await staleNotice(b);
        check(!!n && /"s"/.test(n.text) && !(await inkNow(b)).s, 'a module\'s erase of its part (outsideClear(p, part)) is marked: the kept writing waits for the student', n && n.text.slice(0, 120));
        await clickIf(b, '#outwarn [data-outdrop]'); await reload(b);
        check(!(await inkNow(b)).s, 'after Leave it out and a reload, the erased part stays erased', Object.keys(await inkNow(b)));
        await ctx.close();
      }
    }
    {
      const r = await v3({erase: 'profile', ownLaterMark: true});
      if(r){
        const {ctx, b} = r;
        const n = await staleNotice(b);
        check(!!n && /"s"/.test(n.text), 'two tabs\' marks: this tab\'s own later mark does not hide the other tab\'s earlier Erase', n && n.text.slice(0, 120));
        await clickIf(b, '#outwarn [data-outdrop]'); await reload(b);
        check(!(await inkNow(b)).s, 'two tabs\' marks: after Leave it out and a reload, the Erase stands', Object.keys(await inkNow(b)));
        await ctx.close();
      }
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
