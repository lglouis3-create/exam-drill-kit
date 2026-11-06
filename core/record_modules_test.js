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
 *   empty, key order  an empty module part in the record, and the same part in another key
 *            order, count as held (placed and removed as before)
 *   switch   a record of another profile, placed when this page switches to that profile
 *   continues  a later record that continues the stored answers but lacks the stored DB.eq
 *            (the stored progress changed it without an answer) does not replace the
 *            progress: it is a copy (the review of #69, M1)
 *   retire   Delete the copies, Put back, Erase or a replacing Import meeting a record not yet
 *            placed with a module part the stored progress lacks: the record becomes a copy;
 *            when the browser refuses the copy, the record stays in storage unchanged (never
 *            removed to make room; Louis, 2026-11-06), a notice says so, and a later check
 *            makes the copy; every write refused, the record is still there after a reload
 *            (the review of #69, M2)
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
    const raw = JSON.stringify(Object.assign({at: Date.now(), db, log: []}, extra || {}));
    localStorage.setItem(k, raw);
    const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
    const where = placeOf(JSON.parse(localStorage.getItem(k)), st);
    settlePending();
    const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}');
    if(v[k]) v[k].t -= 61000;
    localStorage.setItem(sk, JSON.stringify(v));
    settlePending();
    const copies = JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]');
    return {where, kept: localStorage.getItem(k) === raw, inCopy: copies.some(c => c && c.data === JSON.stringify(db)), copies: copies.length};
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
  // zero answers, other settings: a record with no answers whose ordinary settings differ from the
  // stored ones (a tab opened, a setting changed, closed) is kept as a copy, as the settings-only
  // case behind the stored answers is (Louis, 2026-11-06)
  {
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem(keyFor(PROFILE))));
    const r = await place(Object.assign({}, st, {answers: [], qn: 0, settings: Object.assign({}, st.settings, {goal: 97})}));
    check(st.answers.length > 0 && r.where === 'apart' && safe(r), 'a record with no answers and other settings, against stored answers, is kept as a copy ("apart")', Object.assign({stored: st.answers.length}, r));
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
      other.answers = st.answers.concat([Object.assign({}, last, {at: last.at + 5000, qid: QUESTIONS[7 % QUESTIONS.length].id, concept: QUESTIONS[7 % QUESTIONS.length].concept})]);
      return {k, data: keyFor(PROFILE), hasInk: !!(rec && rec.db && rec.db.ink), other: JSON.stringify(other),
              recRaw: localStorage.getItem(k), recDb: JSON.stringify(rec.db), ink: JSON.stringify(ink)};
    }, Object.assign({}, INK, {tag: 'reload-case'}));
    check(before.hasInk, 'the page\'s record holds its DB.ink after its save', {k: before.k, hasInk: before.hasInk});
    await q.close({runBeforeUnload: false});
    const p2 = await e.ctx.newPage();
    p2.on('pageerror', x => e.errors.push(x.message));
    p2.on('dialog', x => x.accept().catch(() => {}));
    await p2.addInitScript(([k, v]) => { if(!sessionStorage.getItem('__w')){ sessionStorage.setItem('__w', '1'); localStorage.setItem(k, v); } }, [before.data, before.other]);
    await p2.goto(await L.pageUrl(L.PAGE.PAGE));
    await p2.waitForFunction(() => typeof WRITER !== 'undefined' && WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await p2.waitForTimeout(1800);   // the check 1.5 s after the lock is taken
    const r = await p2.evaluate(([k, recRaw, recDb, ink]) => {
      const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}');
      if(v[k]) v[k].t -= 61000;
      localStorage.setItem(sk, JSON.stringify(v));
      settlePending();
      const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      const copies = JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]');
      // the copy's progress is exactly the record's, and each of the record's history entries is in the copy
      // or already in the stored history (a copy carries only the entries the stored history lacks)
      const entries = (JSON.parse(recRaw).log || []).filter(Array.isArray), m = copies.find(c => c && c.data === recDb);
      let hist = []; try { hist = JSON.parse(localStorage.getItem(logKey()) || '[]'); } catch(e){}
      let inCopy = []; try { inCopy = m && m.log ? JSON.parse(m.log) : []; } catch(e){}
      const have = new Set(hist.concat(inCopy).map(x => JSON.stringify(x)));
      const missing = entries.filter(x => !have.has(JSON.stringify(x))).length;
      return {stored: st.answers.length, storedInk: JSON.stringify(st.ink) === ink, recordLeft: localStorage.getItem(k) === recRaw,
              copyExact: !!m && missing === 0, entries: entries.length, missing, copies: copies.length};
    }, [before.k, before.recRaw, before.recDb, before.ink]);
    check(r.storedInk || r.recordLeft || r.copyExact, 'after a reload, the closed page\'s own writing (its DB.ink) is still in the browser: in the progress, its record unchanged, or a copy of exactly that record\'s progress and history', r);
    check(!e.errors.length, 'no page errors in the reload case', e.errors);
    await e.ctx.close();
  }
  // empty module part, and the same part in another key order: held (placed as "in", removed)
  {
    const st = await p.evaluate(() => { DB.ink = {a: 1, b: {c: 2, d: 3}}; save(); saveNow(); return JSON.parse(localStorage.getItem(keyFor(PROFILE))); });
    await answer(1, 9);
    const r = await place(Object.assign({}, st, {ink: {b: {d: 3, c: 2}, a: 1}}));
    check(r.where === 'in' && !r.kept && !r.inCopy, 'a record behind with the stored DB.ink in another key order is placed as "in" and removed', r);
    await p.evaluate(() => { delete DB.ink; save(); saveNow(); });
    const st2 = await p.evaluate(() => JSON.parse(localStorage.getItem(keyFor(PROFILE))));
    for(const [lab, v] of [['{}', {}], ['[]', []], ['null', null], ['0', 0]]){
      const r2 = await place(Object.assign({}, st2, {answers: st2.answers.slice(0, -1), eq: v}));
      check(r2.where === 'in' && !r2.kept && !r2.inCopy, `a record behind with an empty module part (DB.eq = ${lab}) is placed as "in" and removed, as before`, r2);
    }
  }

  // a fresh page on a stored progress it has not changed (as a tab that just opened)
  const fresh = async (setup) => {
    const a = await device();
    const keys = await a.page.evaluate(setup);
    await a.ctx.close();
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    await ctx.addInitScript(([s]) => { if(sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1'); for(const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, [keys]);
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', x => x.accept().catch(() => {}));
    await page.goto(await L.pageUrl(L.PAGE.PAGE));
    await page.waitForFunction(() => typeof WRITER !== 'undefined' && WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await page.waitForTimeout(1800);
    return {ctx, page, errors};
  };
  const seedOf = () => { const o = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(!/:(pending|pending-seen|writer):/.test(k + ':')) o[k] = localStorage.getItem(k); } return o; };

  // continues: the stored progress has 4 answers and DB.eq (changed without an answer); a later record
  // has those 4 answers and a 5th, and no DB.eq
  {
    const f = await fresh(`(() => { for(let i = 0; i < 4; i++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[i % QUESTIONS.length], 'correct', undefined, 1000); }
      DB.eq = ${JSON.stringify(EQ)}; save(); saveNow(); return (${seedOf.toString()})(); })()`);
    const r = await f.page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem(keyFor(PROFILE))), last = st.answers[st.answers.length - 1];
      const later = Object.assign({}, st, {answers: st.answers.concat([Object.assign({}, last, {at: last.at + 5000, qid: QUESTIONS[5 % QUESTIONS.length].id, concept: QUESTIONS[5 % QUESTIONS.length].concept})])});
      delete later.eq;
      const k = pendingKey(PROFILE, 'gone-late');
      localStorage.setItem(k, JSON.stringify({at: Date.now(), db: later, log: []}));
      const where = placeOf(JSON.parse(localStorage.getItem(k)), st);
      const unchanged = !WROTE_SINCE_CLAIM;
      settlePending();
      const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}'); if(v[k]) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v));
      settlePending();
      const now = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      const copies = JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]');
      const eqWas = JSON.stringify(st.eq);
      return {where, unchanged, storedEq: JSON.stringify(now.eq) === eqWas, storedAnswers: now.answers.length, laterInCopy: copies.some(c => c.data === JSON.stringify(later)),
              copyEq: copies.some(c => c.data === JSON.stringify(st))};
    });
    check(r.where === 'continues' && r.unchanged, 'the later record continues the stored answers, on a page that has written nothing', r);
    check(r.storedEq || r.copyEq, 'a later record without DB.eq does not take away the stored DB.eq: it stays in the progress unchanged, or a copy of exactly that progress', r);
    check(r.storedEq && r.laterInCopy, 'the stored progress (with DB.eq) stays, and the later record is kept as a copy', r);
    check(!f.errors.length, 'no page errors (continues)', f.errors);
    await f.ctx.close();
  }

  // switch: a record of another profile, placed when this page switches to it
  {
    const r = await p.evaluate(async ink => {
      const back = PROFILE;
      useProfile('Second'); await new Promise(res => setTimeout(res, 400));
      for(let i = 0; i < 3; i++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[i], 'correct', undefined, 1000); }
      save(); saveNow();
      const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      useProfile(back); await new Promise(res => setTimeout(res, 400));
      const k = pendingKey('Second', 'gone-sw'), recDb = Object.assign({}, st, {answers: st.answers.slice(0, 2), ink: Object.assign({}, ink, {tag: 'switch-case'})});
      const recRaw = JSON.stringify({at: Date.now(), db: recDb, log: []}), recDbStr = JSON.stringify(recDb);
      localStorage.setItem(k, recRaw);
      useProfile('Second'); await new Promise(res => setTimeout(res, 2200));
      const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}'); if(v[k]) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v));
      settlePending();
      const copies = JSON.parse(localStorage.getItem(NS + ':backup:Second') || '[]');
      const out = {profile: PROFILE, writer: WRITER, kept: localStorage.getItem(k) === recRaw, copyExact: copies.some(c => c && c.data === recDbStr)};
      useProfile(back); await new Promise(res => setTimeout(res, 400));
      return out;
    }, INK);
    check(r.profile === 'Second' && (r.kept || r.copyExact), 'a record of another profile, placed on switching to it, keeps its DB.ink (its record unchanged, or a copy of exactly that record)', r);
  }

  // retire: a record not placed yet, with DB.ink the stored progress lacks, then "Delete the copies"
  {
    const f = await fresh(`(() => { for(let i = 0; i < 3; i++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[i], 'correct', undefined, 1000); } save(); saveNow(); return (${seedOf.toString()})(); })()`);
    // each planted record has its own tag in its DB.ink and its history entry, so a check can tell its
    // copy from any other copy (the ChatGPT review of #69, comment 6694359286)
    const plant = (ink, noLog) => f.page.evaluate(([ink, noLog]) => {
      const tag = 'gone-' + Math.random().toString(36).slice(2, 9);
      const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
      const db = Object.assign({}, st, {answers: st.answers.slice(0, 2), ink: Object.assign({}, ink, {tag})});
      const k = pendingKey(PROFILE, tag);
      const e = [Math.round(Date.now() / 1000), 'feedc0de', 1, 'quiz', 'from the closed tab ' + tag, 'knew', 'mc', 'concept', '', null];
      const log = noLog ? [] : [e], raw = JSON.stringify({at: Date.now(), db, log});
      localStorage.setItem(k, raw);
      return {k, data: JSON.stringify(db), raw, log: JSON.stringify(log), noLog};
    }, [ink, !!noLog]);
    // two later checks, each after the 60 s wait: the first proves the copy, the second removes the record
    // what is stored for THIS planted record: the record unchanged, and the copy whose progress is exactly
    // the record's and whose history is exactly its entries
    const exact = p => f.page.evaluate(([k, data, raw, log, noLog]) => {
      let copies = []; try { copies = JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]') || []; } catch(e){}
      const m = copies.find(c => c && c.data === data);
      const fp = t => { let h = 5381; for(let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return t.length + ':' + h; };
      return {kept: localStorage.getItem(k) === raw, recordGone: localStorage.getItem(k) === null, copies: copies.length,
              copyExact: !!m, logExact: !!m && (noLog ? !m.log : m.log === log), match: m ? fp(m.data) : null, want: fp(data)};
    }, [p.k, p.data, p.raw, p.log, p.noLog]);
    const after = p => f.page.evaluate(([k]) => {
      for(let pass = 0; pass < 2; pass++){
        const sk = NS + ':pending-seen:' + PROFILE, v = JSON.parse(localStorage.getItem(sk) || '{}'); if(v[k]) v[k].t -= 61000;
        try { localStorage.setItem(sk, JSON.stringify(v)); } catch(e){}
        settlePending();
      }
    }, [p.k]).then(() => exact(p));
    // no copies yet: one plain copy first so Delete the copies has something to delete
    await f.page.evaluate(() => { localStorage.setItem(NS + ':backup:' + PROFILE, JSON.stringify([{at: Date.now() - 1000, data: localStorage.getItem(keyFor(PROFILE)), why: 'import'}])); });
    const a = await plant(INK);
    await f.page.evaluate(() => { window.confirm = () => true; show('settings'); deleteCopies(); });
    const r1 = await after(a);
    check(r1.copyExact && r1.logExact, 'Delete the copies meeting a record not yet placed with DB.ink: that record becomes a copy of exactly its progress, with exactly its history entries', r1);
    check(r1.recordGone, 'that record is removed once its copy is stored and the wait has passed', r1);
    // Erase meets one too
    const b = await plant(INK);
    await f.page.evaluate(() => { window.confirm = () => true; window.alert = () => {}; show('settings'); document.getElementById('btnReset').click(); });
    const r2 = await after(b);
    check(r2.copyExact && r2.logExact && r2.recordGone, 'Erase meeting a record not yet placed with DB.ink: that record becomes a copy of exactly its progress and history, and goes after the wait', r2);

    // a full storage, with real quota filler: the record stays; the copy is made only if the browser stores it
    await f.page.evaluate(() => { localStorage.removeItem(NS + ':backup:' + PROFILE); });
    const big = {pages: {}}; for(let i = 0; i < 400; i++) big.pages['p' + i] = {strokes: Array.from({length: 40}, (_, j) => [[i, j], [i + 1, j + 2], [i + 3, j + 5]])};
    const c = await plant(big);
    const fill = await f.page.evaluate(k => {
      // the room left: more than the copy needs beyond the record's own size, less than the copy
      // itself (the copy holds the progress as an escaped string, so it is a little larger than the record)
      const rec = localStorage.getItem(k), db = JSON.parse(rec).db;
      const copy = JSON.stringify([{at: 1, data: JSON.stringify(db), why: 'another tab\'s last save', log: JSON.stringify(JSON.parse(rec).log)}]);
      const margin = (copy.length + (NS + ':backup:' + PROFILE).length) - (rec.length + k.length) + 4000;
      let lo = 0, hi = 6e6;
      while(hi - lo > 16){ const m = (lo + hi) >> 1; try { localStorage.setItem('__filler', 'x'.repeat(m)); lo = m; } catch(e){ hi = m; } }
      localStorage.setItem('__filler', 'x'.repeat(lo - margin));
      let refusedAlongside = false; try { localStorage.setItem('__probe', copy); localStorage.removeItem('__probe'); } catch(e){ refusedAlongside = true; }
      return {record: rec.length, copy: copy.length, margin, refusedAlongside};
    }, c.k);
    // every write and removal the core makes during the retire, as the browser answered it (diagnostics)
    const writes = await f.page.evaluate(() => {
      const real = Storage.prototype.setItem, rm = Storage.prototype.removeItem, log = [];
      Storage.prototype.setItem = function(key, v){ try { real.call(this, key, v); log.push([key, String(v).length, 'ok']); } catch(e){ log.push([key, String(v).length, e && e.name]); throw e; } };
      Storage.prototype.removeItem = function(key){ log.push([key, null, 'removed']); return rm.call(this, key); };
      try { pendingRetire(); } finally { Storage.prototype.setItem = real; Storage.prototype.removeItem = rm; }
      return log;
    });
    const r3 = await exact(c);   // straight after the retire, before any later check or wait
    const sizes = await f.page.evaluate(k => ({rec: (localStorage.getItem(k) || '').length}), c.k);
    check(fill.refusedAlongside, 'the filler leaves too little room for the copy beside the record (the copy alone is refused)', fill);
    // whether the browser accepts the copy here depends on its own quota accounting (WebKit stored it in
    // job 128109291119 although the probe beside the record was refused); either way the record stays
    check(r3.kept, 'storage full (real quota filler): straight after the retire, the record, the only stored copy of its DB.ink, is still in storage unchanged (whether or not the browser accepted its copy)', {r3, fill, sizes, writes});
    // the copy refused for certain (only the copy list's write is refused): no copy, the record stays, the notice says so
    {
      const q = await plant(INK);
      const rq = await f.page.evaluate(k => {
        // the copy list's write is refused while the record is stored, as when only the record's own room
        // would let the copy fit: code that removed the record first would then store the copy and fail here
        const real = Storage.prototype.setItem, get = Storage.prototype.getItem, bk = NS + ':backup:' + PROFILE;
        Storage.prototype.setItem = function(key, v){ if(key === bk && get.call(this, k) !== null) throw new DOMException('full', 'QuotaExceededError'); return real.call(this, key, v); };
        const before = localStorage.getItem(bk), raw = localStorage.getItem(k);
        try { pendingRetire(); } finally { Storage.prototype.setItem = real; }
        const n = document.getElementById('pendingnote');
        return {kept: localStorage.getItem(k) === raw, listUnchanged: localStorage.getItem(bk) === before, note: n ? n.textContent : ''};
      }, q.k);
      check(rq.kept && rq.listUnchanged, 'the copy refused while the record is stored: the record stays in storage unchanged and no copy is written', rq);
      check(/storage is full or blocked/.test(rq.note) && /stays stored in this browser/.test(rq.note) && /Export progress does not include it/.test(rq.note) && /next time this drill opens/.test(rq.note),
        'the copy refused: the notice says the work is still stored in this browser, that Export does not include it, and when it becomes a copy', rq.note);
      const rq2 = await after(q);
      check(rq2.copyExact && rq2.logExact && rq2.recordGone, 'the copy refused, then accepted at a later check: that record becomes a copy of exactly its progress and history, and goes after the wait', rq2);
    }
    await f.page.evaluate(() => { localStorage.removeItem('__filler'); for(let n = 0; n < 500; n++) localStorage.removeItem('__f' + n); });
    await after(c);
    const r3b = await after(c);
    check(r3b.copyExact && r3b.logExact && r3b.recordGone, 'storage full, then room again: a later check makes the record a copy with its DB.ink, and the record goes after the wait', r3b);
    // one that still does not fit: a record of many short strings (each quote is escaped in the copy)
    await f.page.evaluate(() => { localStorage.removeItem(NS + ':backup:' + PROFILE); });
    const quoted = {pages: {}}; for(let i = 0; i < 2000; i++) quoted.pages['p' + i] = {tags: Array.from({length: 30}, (_, j) => 'a' + j)};
    await f.page.evaluate(() => { localStorage.removeItem('__filler'); for(let n = 0; n < 500; n++) localStorage.removeItem('__f' + n); });
    // the stored progress has answers again (Erase above emptied it), so this record is behind it
    await f.page.evaluate(() => { for(let i = 0; i < 3; i++){ const t = Date.now(); while(Date.now() === t){} record(QUESTIONS[i], 'correct', undefined, 1000); } save(); saveNow(); });
    const e = await plant(quoted, true);   // no history entries: only its progress decides whether it is held
    // about 3,000 characters left: room for the small "first seen" mark, not for the copy
    await f.page.evaluate(() => {
      let lo = 0, hi = 6e6;
      while(hi - lo > 16){ const m = (lo + hi) >> 1; try { localStorage.setItem('__filler', 'x'.repeat(m)); lo = m; } catch(e){ hi = m; } }
      localStorage.setItem('__filler', 'x'.repeat(lo - 3000));
    });
    await f.page.evaluate(() => { pendingRetire(); });
    const marked = await f.page.evaluate(k => { const v = JSON.parse(localStorage.getItem(NS + ':pending-seen:' + PROFILE) || '{}'); return !!(v[k] && v[k].done && !v[k].proven); }, e.k);
    check(marked, 'the record that could not become a copy is marked as retired (the mark fits)', marked);
    const r4 = await after(e);
    check(r4.kept && !r4.copyExact, 'storage full, the copy larger than the room the record frees: the record is written back, and stays through later checks while storage is full', r4);
    await f.page.evaluate(() => { localStorage.removeItem('__filler'); for(let n = 0; n < 500; n++) localStorage.removeItem('__f' + n); });
    const r5 = await after(e);
    check(r5.copyExact && r5.logExact, 'once there is room, a later check makes that record a copy of exactly its progress (no history entries)', r5);
    // Put back meeting a record not yet placed with DB.ink: Put back writes the copy list itself, so
    // the record's copy must be on the list it leaves (the review of #69, N1)
    const putBack = () => f.page.evaluate(() => { window.confirm = () => true; window.alert = () => {}; show('settings'); restoreBackup(); });
    const oneCopy = () => f.page.evaluate(() => { localStorage.setItem(NS + ':backup:' + PROFILE, JSON.stringify([{at: Date.now() - 1000, data: localStorage.getItem(keyFor(PROFILE)), why: 'import'}])); });
    await f.page.evaluate(() => { localStorage.removeItem('__filler'); for(let n = 0; n < 500; n++) localStorage.removeItem('__f' + n); localStorage.removeItem(NS + ':backup:' + PROFILE); });
    await oneCopy();
    const pb1 = await plant(INK);
    await putBack();
    const now1 = await exact(pb1);
    check(now1.copyExact && now1.logExact, 'Put back meeting a record not yet placed with DB.ink: right after Put back, a copy of exactly that record\'s progress and history is on the list', now1);
    const r7 = await after(pb1);
    check(r7.copyExact && r7.logExact && r7.recordGone, 'Put back with room: the DB.ink copy stays on the list and the record is removed after the wait', r7);
    // Put back with the record's copy refused for certain: only a copy-list write holding this record's
    // tag is refused, and only while the record is stored; Put back's own writes go through
    {
      await f.page.evaluate(() => { localStorage.removeItem(NS + ':backup:' + PROFILE); });
      await oneCopy();
      const pq = await plant(INK);
      const tag = JSON.parse(pq.data).ink.tag;
      const rpq = await f.page.evaluate(([k, tag]) => {
        const real = Storage.prototype.setItem, get = Storage.prototype.getItem, bk = NS + ':backup:' + PROFILE;
        const list = JSON.parse(localStorage.getItem(bk) || '[]'), want = list.length ? list[list.length - 1].data : null;
        let refused = 0;
        Storage.prototype.setItem = function(key, v){ if(key === bk && String(v).includes(tag) && get.call(this, k) !== null){ refused++; throw new DOMException('full', 'QuotaExceededError'); } return real.call(this, key, v); };
        try { window.confirm = () => true; window.alert = () => {}; show('settings'); restoreBackup(); } finally { Storage.prototype.setItem = real; }
        return {refused, putBackDone: want !== null && localStorage.getItem(keyFor(PROFILE)) === want};
      }, [pq.k, tag]);
      const now3 = await exact(pq);
      check(rpq.putBackDone && rpq.refused >= 1, 'Put back with the record\'s copy refused: Put back itself took effect, and the record\'s copy write was refused', rpq);
      check(now3.kept && !now3.copyExact, 'Put back with the record\'s copy refused: the record stays in storage unchanged and no copy of it is written', {now3, rpq});
      const r9b = await after(pq);
      check(r9b.copyExact && r9b.logExact && r9b.recordGone, 'Put back with the copy refused, then accepted at a later check: that record becomes a copy of exactly its progress and history, and goes after the wait', r9b);
    }
    // the same with a full storage: room for Put back's own writes, not for the DB.ink copy beside the record
    await f.page.evaluate(() => { localStorage.removeItem(NS + ':backup:' + PROFILE); });
    await oneCopy();
    const pb2 = await plant(big);
    const fill2 = await f.page.evaluate(k => {
      const rec = localStorage.getItem(k), db = JSON.parse(rec).db;
      const copy = JSON.stringify([{at: 1, data: JSON.stringify(db), why: 'another tab\'s last save', log: JSON.stringify(JSON.parse(rec).log)}]);
      const list = localStorage.getItem(NS + ':backup:' + PROFILE), prog = localStorage.getItem(keyFor(PROFILE));
      // Put back's own writes: the list with the progress on screen added, then the progress put back
      const own = list.length + prog.length + 200;
      const margin = (copy.length + (NS + ':backup:' + PROFILE).length) - (rec.length + k.length) + own + 4000;
      let lo = 0, hi = 6e6;
      while(hi - lo > 16){ const m = (lo + hi) >> 1; try { localStorage.setItem('__filler', 'x'.repeat(m)); lo = m; } catch(e){ hi = m; } }
      localStorage.setItem('__filler', 'x'.repeat(lo - margin));
      let refusedAlongside = false; try { localStorage.setItem('__probe', copy); localStorage.removeItem('__probe'); } catch(e){ refusedAlongside = true; }
      return {record: rec.length, copy: copy.length, margin, refusedAlongside};
    }, pb2.k);
    await putBack();
    const now2 = await exact(pb2);
    check(fill2.refusedAlongside, 'Put back, storage full: the filler leaves too little room for the DB.ink copy beside the record', fill2);
    check(now2.kept, 'Put back, storage full (real quota filler): the record, the only stored copy of its DB.ink, stays in storage (whether or not the browser accepted its copy)', {now2, fill2});
    await f.page.evaluate(() => { localStorage.removeItem('__filler'); for(let n = 0; n < 500; n++) localStorage.removeItem('__f' + n); });
    await after(pb2);
    const r8 = await after(pb2);
    check(r8.copyExact && r8.logExact && r8.recordGone, 'Put back, storage full, then room again: a later check makes the record a copy with its DB.ink, and the record goes after the wait', r8);
    // no answers, a device-only setting of its own (views.js IMPORT_DEVICE): every per-tab record is on this
    // device, so another tab's choice is this device's own and is kept as a copy, not dropped (the review of fd2aea1)
    {
      const r9 = await f.page.evaluate(() => {
        const st = JSON.parse(localStorage.getItem(keyFor(PROFILE)));
        const dev = Object.assign({}, st, {answers: [], settings: Object.assign({}, st.settings, {eqPick: 'this-device-' + Date.now()})});
        const own = Object.assign({}, st, {answers: [], settings: Object.assign({}, st.settings, {goal: 4242})});
        return {device: placeOf({at: Date.now(), db: dev}, st, false), own: placeOf({at: Date.now(), db: own}, st, false)};
      });
      check(r9.device === 'apart', 'no answers, only a device setting differs (IMPORT_DEVICE): kept as a copy, since it was this device\'s own choice in another tab', r9);
      check(r9.own === 'apart', 'control: no answers, an ordinary setting of its own: kept apart as a copy', r9);
    }
    // both refused (every write refused): the copy is kept on the page and the notice shows
    const g = await plant(INK);
    const r6 = await f.page.evaluate(([k, raw]) => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function(){ throw new DOMException('full', 'QuotaExceededError'); };
      try { pendingRetire(); } finally { Storage.prototype.setItem = real; }
      const mem = store.get(NS + ':backup:' + PROFILE);
      return {recordStays: localStorage.getItem(k) === raw, onPage: mem !== localStorage.getItem(NS + ':backup:' + PROFILE)};
    }, [g.k, g.raw]);
    check(r6.recordStays && !r6.onPage, 'every write refused: the record stays in storage as it is, and no copy is kept only on this page', r6);
    // the copy refused and every later write refused, through a reload: the record is still in storage
    {
      const h = await plant(INK);
      await f.ctx.addInitScript(() => { Storage.prototype.setItem = function(){ throw new DOMException('full', 'QuotaExceededError'); }; });
      await f.page.evaluate(() => { Storage.prototype.setItem = function(){ throw new DOMException('full', 'QuotaExceededError'); }; pendingRetire(); settlePending(); });
      const before = await f.page.evaluate(k => localStorage.getItem(k), h.k);
      check(before === h.raw, 'the copy refused and every later write refused: straight after the retire, the record is unchanged', {same: before === h.raw});
      await f.page.reload();
      await f.page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      await f.page.waitForTimeout(0);
      const r10 = await f.page.evaluate(k => { try { settlePending(); } catch(e){} return localStorage.getItem(k); }, h.k);
      check(r10 === h.raw, 'the copy refused and every later write refused: after a reload the original record is still in storage, unchanged', {before: before && before.length, after: r10 && r10.length});
    }
    check(!f.errors.length, 'no page errors (retire)', f.errors);
    await f.ctx.close();
  }
  check(!d.errors.length, 'no page errors', d.errors);
  await d.ctx.close();
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.error(e); process.exit(1); });
