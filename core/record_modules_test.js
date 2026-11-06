/* A tab's last save (the per-tab record, `<ns>:pending:<profile>:<tab>`) keeps a feature module's
 * part of the progress: the worksheets-ink writing (DB.ink), the equation drill's records (DB.eq)
 * or any other key a module keeps outside the core's own parts (views.js NOT_COMPARED and
 * ENTRY_MAPS, the same rule Import uses). A module changes its part without an answer, so a
 * record whose answers the stored progress went on from can still hold a module part the stored
 * progress lacks. Such a record is kept as a copy (Settings, "Put back the progress from …")
 * and is never removed while its module part is in neither the stored progress nor a copy.
 * Found by the independent review of kit PR #66 (2026-11-06); before this check, placeOf
 * compared only the settings and a mark, and the record was removed 60 s later.
 *
 * Cases, each with the record planted as another tab's (a tab that closed or reloaded):
 *   behind   the record's answers are behind the stored progress, its module part differs
 *   empty    the record has no answers and a module part; the stored progress has answers
 *   same     the record has the stored answers and a different module part (a copy already)
 *   reload   the page's own save, written over by a save without the module part, placed by
 *            the page that opens after a reload
 *   controls the same module part in both: placed and removed as before; a setting alone:
 *            kept as a copy, as before; this tab's own record under a full storage is still
 *            removed when the stored progress continues it (its module part is this tab's newer one)
 *
 *     node record_modules_test.js
 */
const L = require('./check_lib');
const NAME = 'record_modules_test.js';
const {check} = L;
L.PAGE.need(NAME);

(async () => {
  const {browser} = await L.launch(NAME);
  // a page with the browser's Web Locks (records are kept only with them), holding the profile
  const device = async () => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept().catch(() => {}));
    await page.goto(await L.pageUrl(L.PAGE.PAGE));
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    return {ctx, page, errors};
  };
  const d = await device();
  const p = d.page;
  if(!(await p.evaluate(() => HAS_LOCKS && WRITER === 'held'))){
    L.notRun(NAME, 'this browser gives the page no Web Locks, so no per-tab record is kept');
  }
  // n answers, each at its own millisecond, saved; returns the stored progress
  const answer = (n, start) => p.evaluate(([n, start]) => {
    for(let i = 0; i < n; i++){
      const t = Date.now(); while(Date.now() === t){ /* the next millisecond */ }
      record(QUESTIONS[(start + i) % QUESTIONS.length], 'correct', undefined, 1000);
    }
    saveNow();
    return JSON.parse(localStorage.getItem(keyFor(PROFILE)));
  }, [n, start || 0]);
  const INK = {pages: {p1: {strokes: [[[10, 10], [40, 42], [80, 90]]], color: '#1E56C8'}}, head: [[[1, 1], [5, 5]]]};
  const EQ = {done: {'eq-1': {t: 1730000000, ok: 1}}, pick: 'all'};
  // plant another tab's record of this profile, place it, then age its first-found time past
  // the 60 s wait and check again, as the later check does; what is stored afterwards
  const place = (db, extra) => p.evaluate(([db, extra]) => {
    const k = pendingKey(PROFILE, 'gone-' + Math.random().toString(36).slice(2, 8));
    localStorage.setItem(k, JSON.stringify(Object.assign({at: Date.now(), db, log: []}, extra || {})));
    const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
    const where = placeOf(JSON.parse(localStorage.getItem(k)), st);
    settlePending();
    const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}');
    if(v[k]) v[k].t -= 61000;
    localStorage.setItem(sk, JSON.stringify(v));
    settlePending();
    const copies = JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]');
    return {where, kept: localStorage.getItem(k) !== null, inCopy: copies.some(c => c && c.data === JSON.stringify(db)), copies: copies.length};
  }, [db, extra || null]);
  const safe = r => r.kept || r.inCopy;   // the record's progress is still in the browser

  // the stored progress: 3 answers, no module part
  const st3 = await answer(3, 0);
  check(st3.answers.length === 3 && !('ink' in st3) && !('eq' in st3), 'the stored progress has 3 answers and no module part', Object.keys(st3));
  const behind = Object.assign({}, st3, {answers: st3.answers.slice(0, 2)});

  // behind: the stored progress went on from the record's last answer; the record holds a module part it lacks
  for(const [part, val] of [['ink', INK], ['eq', EQ], ['anyModule', {n: 1}]]){
    const r = await place(Object.assign({}, behind, {[part]: val}));
    check(r.where !== 'in' && safe(r), `a record 1 answer behind with DB.${part} the stored progress lacks is not placed as "in"; its progress stays (kept or a copy) after the 60 s check`, r);
  }
  // behind, the module part differs from the stored one (not only missing)
  {
    await p.evaluate(ink => { DB.ink = ink; save(); saveNow(); }, {pages: {p1: {strokes: [[[1, 2], [3, 4]]]}}});
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem(keyFor(PROFILE))));
    const r = await place(Object.assign({}, st, {answers: st.answers.slice(0, 2), ink: INK}));
    check(r.where !== 'in' && safe(r), 'a record behind with other DB.ink than the stored one is not placed as "in"; its writing stays', r);
    await p.evaluate(() => { delete DB.ink; save(); saveNow(); });
  }
  // empty: the record has no answers but a module part; the stored progress has answers
  {
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem(keyFor(PROFILE))));
    const r = await place(Object.assign({}, st, {answers: [], qn: 0, eq: EQ}));
    check(r.where !== 'in' && safe(r), 'a record with no answers and DB.eq, against stored answers, is not placed as "in"; its records stay', r);
  }
  // same: the stored answers with another module part: a copy (this already held)
  {
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem(keyFor(PROFILE))));
    const r = await place(Object.assign({}, st, {ink: INK}));
    check(r.where === 'conflict' && r.inCopy, 'a record with the stored answers and its own DB.ink is kept as a copy', r);
  }
  // controls
  {
    const st = await p.evaluate(() => { DB.ink = {pages: {p9: {strokes: [[[7, 7], [8, 8]]]}}}; save(); saveNow(); return JSON.parse(localStorage.getItem(keyFor(PROFILE))); });
    await answer(1, 5);
    const r = await place(Object.assign({}, st));   // the stored progress went on from it, with the same module part
    check(r.where === 'in' && !r.kept && !r.inCopy, 'control: a record behind whose module part the stored progress holds unchanged is placed as "in" and removed after the 60 s check, as before', r);
    const st2 = await p.evaluate(() => JSON.parse(localStorage.getItem(keyFor(PROFILE))));
    const r2 = await place(Object.assign({}, st2, {answers: st2.answers.slice(0, -1), settings: Object.assign({}, st2.settings, {goal: 99})}));
    check(r2.where === 'apart' && r2.inCopy, 'control: a record behind that differs only in a setting is kept as a copy, as before', r2);
    // a record behind with no module part, while the stored progress has one: the stored one is newer: "in"
    const r3 = await place(Object.assign({}, st2, {answers: st2.answers.slice(0, -1), ink: undefined}));
    check(r3.where === 'in' && !r3.kept, 'control: a record behind that lacks a module part the stored progress holds is placed as "in", as before', r3);
    await p.evaluate(() => { delete DB.ink; save(); saveNow(); });
  }
  // this tab's own record, storage full: removed when the stored progress continues it, even with
  // an older module part (the stored one is this tab's newer write), as kit #47 decided
  {
    const r = await p.evaluate(() => {
      const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      const own = Object.assign({}, st, {answers: st.answers.slice(0, -1), ink: {pages: {old: {strokes: [[[0, 0], [1, 1]]]}}}});
      DB.ink = {pages: {old: {strokes: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]]}}};
      store.set(keyFor(PROFILE), JSON.stringify(DB));
      localStorage.setItem(myPendingKey(), JSON.stringify({at: Date.now(), db: own, log: []}));
      const gone = dropOwnRecordIfStored();
      return {gone, left: localStorage.getItem(myPendingKey()) !== null};
    });
    check(r.gone && !r.left, 'control: this tab\'s own record is still removed under a full storage when the stored progress continues it', r);
    await p.evaluate(() => { delete DB.ink; save(); saveNow(); });
  }

  // reload: the page saves its writing; the page closes; a save without the writing (a tab that had
  // not received that save) is written over the progress before the next page opens; the page that
  // opens after it takes the profile and places the closed page's record
  {
    const e = await device(), q = e.page;
    await q.evaluate(() => { for(let i = 0; i < 3; i++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[i], 'correct', undefined, 1000); } save(); saveNow(); });
    const before = await q.evaluate(ink => {
      DB.ink = ink; save(); saveNow();
      const k = myPendingKey(), rec = JSON.parse(localStorage.getItem(k)), st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      const other = Object.assign({}, st); delete other.ink;
      const last = st.answers[st.answers.length - 1];
      other.answers = st.answers.concat([Object.assign({}, last, {t: last.t + 5000, qid: QUESTIONS[7 % QUESTIONS.length].id, concept: QUESTIONS[7 % QUESTIONS.length].concept})]);
      return {k, data: keyFor(PROFILE), hasInk: !!(rec && rec.db && rec.db.ink), other: JSON.stringify(other)};
    }, INK);
    check(before.hasInk, 'the page\'s record holds its DB.ink after its save', {k: before.k, hasInk: before.hasInk});
    await q.close({runBeforeUnload: false});
    const p2 = await e.ctx.newPage();
    p2.on('pageerror', x => e.errors.push(x.message));
    p2.on('dialog', x => x.accept().catch(() => {}));
    await p2.addInitScript(([k, v]) => { if(!sessionStorage.getItem('__w')){ sessionStorage.setItem('__w', '1'); localStorage.setItem(k, v); } }, [before.data, before.other]);
    await p2.goto(await L.pageUrl(L.PAGE.PAGE));
    await p2.waitForFunction(() => typeof WRITER !== 'undefined' && WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await p2.waitForTimeout(1800);   // the check 1.5 s after the lock is taken
    const r = await p2.evaluate(k => {
      const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}');
      if(v[k]) v[k].t -= 61000;
      localStorage.setItem(sk, JSON.stringify(v));
      settlePending();
      const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      const copies = JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]');
      return {stored: st.answers.length, storedInk: !!st.ink, recordLeft: localStorage.getItem(k) !== null,
              copyInk: copies.some(c => { try { return !!JSON.parse(c.data).ink; } catch(e){ return false; } })};
    }, before.k);
    check(r.storedInk || r.recordLeft || r.copyInk, 'after a reload, the closed page\'s writing (DB.ink) is still in the browser: in the progress, its record or a copy', r);
    check(!e.errors.length, 'no page errors in the reload case', e.errors);
    await e.ctx.close();
  }
  check(!d.errors.length, 'no page errors', d.errors);
  await d.ctx.close();
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.error(e); process.exit(1); });
