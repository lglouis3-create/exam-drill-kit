/* An exam paper whose save the browser refuses (storage full), Louis, 2026-11-05: the notice says so,
 * Export keeps the paper, the app's Reload, a profile switch and closing the tab ask first while it is
 * not exported, exporting one kind of work does not clear the protection of another, new answers after
 * an export bring the protection back, and a reload of the same tab brings the paper back from the
 * tab's own copy (sessionStorage). Before this change a refused paper counted as nothing unsaved.
 *
 *     node exam_save_test.js
 */
const fs = require('fs');
const L = require('./check_lib');
const NAME = 'exam_save_test.js';
const {check} = L;
L.PAGE.need(NAME);
const REFUSE = () => {
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){ if(this === window.localStorage && window.__refuse && window.__refuse.some(r => String(k).includes(r))) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return set.call(this, k, v); };
};
(async () => {
  const {browser} = await L.launch(NAME);
  const {ctx, page: o, errors} = await L.openFile(browser, {}, REFUSE);
  const said = []; o.removeAllListeners('dialog');
  let ok = new Set(); o.on('dialog', d => { said.push(d.type() + ': ' + d.message()); (ok.has(d.type()) ? d.accept() : d.dismiss()).catch(() => {}); });
  await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
  const hasExam = await o.evaluate(() => typeof EXAM !== 'undefined' && !!EXAM);
  if(!hasExam){ L.notRun(NAME, 'this course has no exam paper'); }
  // a paper, its first answer stored
  // a course whose exam starts no paper (nullexam.js: the question count not set, a time limit set)
  if(!(await o.evaluate(() => { show('exam'); return !!document.getElementById('startExam'); }))){ await browser.close(); L.notRun(NAME, 'this course starts no exam paper (its question count is not set)'); }
  await o.evaluate(() => document.getElementById('startExam').click());
  await o.waitForFunction(() => EX && EX.running, null, {timeout: 5000});
  const pick = (i, v) => o.evaluate(([i, v]) => { const q = EX.qs[i]; EX.picks[i] = isMulti(q) ? [v] : (q.type === 'numeric' ? String(v) : v); saveExam(); return JSON.stringify(EX.picks[i]); }, [i, v]);
  await pick(0, 0);
  const none = await o.evaluate(() => ({risk: atRiskAll(), notice: !!document.getElementById('savewarn')}));
  check(!none.risk && !none.notice, 'a paper saved normally: nothing at risk, no notice', none);
  // the browser refuses the paper's key only
  await o.evaluate(() => { window.__refuse = [':exam:']; });
  const p1 = await pick(1, 1);
  const st = await o.evaluate(() => ({failed: FAILED.has(NS + ':exam:' + PROFILE), risk: atRiskAll(), copy: !!sessionStorage.getItem(NS + ':exam-copy:' + PROFILE),
    text: (document.getElementById('savewarn') || {}).textContent || '', exportBtn: !!document.getElementById('savewarnExport')}));
  check(st.failed && st.risk && /did not save your exam paper in progress/.test(st.text) && /brings them back after a reload of this tab; closing the tab loses them/.test(st.text) && !/reloading it loses it/.test(st.text) && !/Import progress adds it back/.test(st.text) && /Import does not read a paper back/.test(st.text) && st.exportBtn && st.copy,
    'a refused paper save: at risk, the notice names the exam paper and says what a reload and a close do, with Export; this tab keeps a copy', Object.assign({}, st, {text: st.text.slice(0, 140)}));
  // the app's Reload asks; cancelled, the paper stays
  let n = said.length;
  await o.evaluate(() => { offerReload('A new version is ready.'); document.querySelector('#swbar [data-reload]').click(); });
  await o.waitForTimeout(300);
  check(said.slice(n).some(x => /^confirm: .*lost on reload unless you export/.test(x)) && await o.evaluate(() => !!(EX && EX.running)), 'a refused paper: the new-version bar\'s Reload asks first; cancelled, the paper stays', said.slice(n));
  // a profile switch asks (both questions cancelled: stays)
  n = said.length;
  await o.evaluate(() => useProfile('zz-other'));
  check(said.slice(n).some(x => /^confirm: This browser did not save/.test(x)) && await o.evaluate(() => PROFILE !== 'zz-other'), 'a refused paper: switching profile asks first and offers the export; cancelled, the page stays', said.slice(n));
  // Export keeps the paper with its latest answer; then Reload asks nothing; a new answer brings the question back
  const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => document.getElementById('savewarnExport').click())]);
  const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
  check(ex.exam && Array.isArray(ex.exam.picks) && JSON.stringify(ex.exam.picks[1]) === p1 && ex.db && Array.isArray(ex.log), 'Export holds the exam paper with its latest answer, beside the progress and history', ex.exam && {picks: ex.exam.picks.slice(0, 2)});
  check(await o.evaluate(() => !atRiskAll()), 'after that export: nothing at risk');
  await pick(2, 0);
  check(await o.evaluate(() => atRiskAll()), 'a new answer on the paper after the export: at risk again');
  // exporting one kind of work does not clear another's protection
  await o.evaluate(() => { window.__refuse = [':exam:', ':data:other-away', ':log:other-away']; });
  const away = await o.evaluate(() => { const p = PROFILE; LOG.push([Math.round(Date.now() / 1000), 'x', 1, 'quiz', 'c', '', 'mc', 'concept', '', null]);
    // a second profile with refused work, held for it by this page
    const dk = NS + ':data:other-away', lk = NS + ':log:other-away'; MEM[dk] = JSON.stringify(BLANK()); MEM[lk] = '[]'; FAILED.add(dk); FAILED.add(lk);
    exportProgress(); EXPORTED_SNAP = snapHere();   // this profile exported (progress, history and the paper)
    return {here: atRisk(), all: atRiskAll(), away: awayRefused()}; });
  check(!away.here && away.all && away.away.includes('other-away'), 'exporting this profile (with its paper) does not clear the protection of another profile\'s refused work', away);
  const away2 = await o.evaluate(() => { exportAway('other-away'); return {all: atRiskAll()}; });
  await pick(3, 1);
  const away3 = await o.evaluate(() => ({all: atRiskAll(), here: atRisk()}));
  check(!away2.all && away3.here && away3.all, 'exporting the other profile clears only its protection; a new answer on this paper is at risk again', {away2, away3});
  await o.evaluate(() => { for(const k of [...FAILED]) if(k.includes('other-away')) FAILED.delete(k); });
  // closing the tab: the browser's question (Chromium)
  if(L.BROWSER === 'chromium'){
    n = said.length;
    await o.close({runBeforeUnload: true}); await new Promise(r => setTimeout(r, 500));
    check(said.slice(n).some(x => /^beforeunload/.test(x)) && !o.isClosed(), 'a refused paper not exported: closing the tab gets the browser\'s leave question', said.slice(n));
  } else L.skip('closing the tab with a refused paper', 'WebKit\'s page close with runBeforeUnload does not finish here (#39)');
  // a reload of this tab brings the paper back from the tab's own copy, with its latest answer
  const last = await o.evaluate(() => JSON.stringify(EX.picks));
  // the app's Reload, its question accepted: it never claims the refused paper "is saved"; the reload follows
  ok = new Set(['beforeunload', 'confirm']); n = said.length;
  await Promise.all([o.waitForNavigation({timeout: 15000}).catch(() => {}), o.evaluate(() => { offerReload('A new version is ready.'); document.querySelector('#swbar [data-reload]').click(); })]);
  await o.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  check(said.slice(n).some(x => /lost on reload unless you export/.test(x)) && !said.slice(n).some(x => /It is saved/.test(x)), 'a refused paper: the Reload question asks, and never says the paper is saved', said.slice(n));
  await o.waitForTimeout(500);
  const back = await o.evaluate(() => ({running: !!(EX && EX.running), picks: EX ? JSON.stringify(EX.picks) : null}));
  check(back.running && back.picks === last, 'a reload of this tab brings the paper back from its own copy, with every answer', {running: back.running, same: back.picks === last});
  // ...and it is still protected (the review of 383ba7d, M1): at risk, the notice, Export holds it
  const after = await o.evaluate(() => ({risk: atRiskAll(), failed: FAILED.has(NS + ':exam:' + PROFILE), notice: !!document.getElementById('savewarn')}));
  const [dl2] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => exportProgress())]);
  const ex2 = dl2 ? JSON.parse(fs.readFileSync(await dl2.path(), 'utf8')) : {};
  check(after.risk && after.failed && after.notice && ex2.exam && JSON.stringify(ex2.exam.picks) === last,
    'after that reload the paper is still not stored: at risk, the notice shown, and Export holds its latest answers', Object.assign({}, after, {exported: ex2.exam && JSON.stringify(ex2.exam.picks) === last}));
  n = said.length; ok = new Set();
  await o.evaluate(() => { EXPORTED_SNAP = null; offerReload('A new version is ready.'); document.querySelector('#swbar [data-reload]').click(); });
  await o.waitForTimeout(300);
  check(said.slice(n).some(x => /lost on reload unless you export/.test(x)) && !said.slice(n).some(x => /It is saved/.test(x)), 'after that reload, the Reload question asks again and never says the paper is saved', said.slice(n));
  check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
  await ctx.close();
  {
    // M4: a duplicated tab (its sessionStorage copied) does not bring back a paper submitted since
    const {ctx: c3, page: a, errors: e3} = await L.openFile(browser, {}, REFUSE);
    a.on('dialog', d => d.accept().catch(() => {}));
    await a.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    // refused from its first save, so no paper was ever stored (the copy's "over" is null, the reviewer's case)
    await a.evaluate(() => { window.__refuse = [':exam:']; show('exam'); document.getElementById('startExam').click(); });
    await a.waitForFunction(() => EX && EX.running, null, {timeout: 5000});
    const copy = await a.evaluate(() => { EX.picks[0] = isMulti(EX.qs[0]) ? [0] : 0; saveExam(); const c = sessionStorage.getItem(NS + ':exam-copy:' + PROFILE); return c && JSON.parse(c).over === null ? c : null; });
    await a.evaluate(() => { finishExam(false); });
    // a second paper, also refused, then submitted: the first must still not come back (the review of 8ff9351)
    const first = await a.evaluate(() => paperId({ends: EX.ends, started: EX.started, ids: EX.qs.map(q => q.id)}));
    await a.evaluate(() => { EX = null; show('exam'); renderExam(); const b = document.getElementById('startExam'); if(b) b.click(); });
    await a.waitForFunction(() => EX && EX.running, null, {timeout: 5000}).catch(() => {});
    const second = await a.evaluate(f => { if(!(EX && EX.running)) return {started: false}; const id = paperId({ends: EX.ends, started: EX.started, ids: EX.qs.map(q => q.id)});
      EX.picks[0] = isMulti(EX.qs[0]) ? [0] : 0; saveExam(); finishExam(false); window.__refuse = null; return {started: true, different: id !== f}; }, first);
    check(second.started && second.different, 'precondition: a second, different paper was started and submitted after the first', second);
    const b = await c3.newPage(); b.on('dialog', d => d.accept().catch(() => {}));
    await b.addInitScript(([k, v]) => { if(!sessionStorage.getItem('__dup')){ sessionStorage.setItem('__dup', '1'); sessionStorage.setItem(k, v); } }, [await a.evaluate(() => NS + ':exam-copy:' + PROFILE), copy]);
    await b.goto(a.url()); await b.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await b.evaluate(() => show('exam')); await b.waitForTimeout(300);
    const dup = await b.evaluate(() => ({running: !!(EX && EX.running), copyLeft: !!sessionStorage.getItem(NS + ':exam-copy:' + PROFILE)}));
    check(!!copy && !dup.running, 'a duplicated tab holding a copy of a paper submitted since does not bring that paper back', dup);
    check(!e3.length, 'duplicated tab: no page errors', e3.slice(0, 2).join('; '));
    await c3.close();
  }
  {
    // M2: "Use it here" with only the paper refused makes no copy of the (saved) progress, and asks about the paper
    const {ctx: c4, page: a, errors: e4} = await L.openFile(browser, {}, REFUSE);
    const asked = []; a.on('dialog', d => { asked.push(d.message()); d.accept().catch(() => {}); });
    await a.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    if(await a.evaluate(() => HAS_LOCKS)){
      await a.evaluate(() => { record(QUESTIONS[0], 'correct', 0, 4000); saveNow(); show('exam'); document.getElementById('startExam').click(); });
      await a.waitForFunction(() => EX && EX.running, null, {timeout: 5000});
      await a.evaluate(() => { window.__refuse = [':exam:']; EX.picks[0] = isMulti(EX.qs[0]) ? [0] : 0; saveExam(); });
      const b = await c4.newPage(); b.on('dialog', d => d.accept().catch(() => {}));
      await b.goto(a.url()); await b.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      await b.waitForFunction(() => WRITER === 'other', null, {timeout: 8000}).catch(() => {});
      await b.evaluate(() => takeOver(false)); await b.waitForFunction(() => WRITER === 'held', null, {timeout: 20000}).catch(() => {});
      await a.waitForFunction(() => WRITER === 'other', null, {timeout: 8000}).catch(() => {});
      await b.close();
      await a.evaluate(() => takeOver(false)); await a.waitForFunction(() => WRITER === 'held', null, {timeout: 20000}).catch(() => {});
      const r = await a.evaluate(() => ({w: WRITER, copies: (JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]')).length, copyLeft: !!sessionStorage.getItem(NS + ':exam-copy:' + PROFILE)}));
      check(r.w === 'held' && r.copies === 0 && !r.copyLeft && asked.some(m => /exam paper in progress on this page was not saved/.test(m)) && !asked.some(m => /kept as a copy/.test(m)),
        '"Use it here" with only the paper refused: it asks about the paper, makes no copy of the saved progress, and drops the tab\'s paper copy', Object.assign({}, r, {asked}));
    } else L.skip('"Use it here" with only the paper refused', 'no Web Locks here');
    check(!e4.length, 'Use it here: no page errors', e4.slice(0, 2).join('; '));
    await c4.close();
  }
  {
    // a profile switch puts the running paper away: it is not carried onto the next profile
    const {ctx: c5, page: a, errors: e5} = await L.openFile(browser, {}, REFUSE);
    a.on('dialog', d => d.accept().catch(() => {}));
    await a.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    await a.evaluate(() => { show('exam'); document.getElementById('startExam').click(); });
    await a.waitForFunction(() => EX && EX.running, null, {timeout: 5000});
    const me = await a.evaluate(() => { window.__refuse = [':exam:']; EX.picks[0] = isMulti(EX.qs[0]) ? [0] : 0; saveExam(); return {p: PROFILE, picks: JSON.stringify(EX.picks)}; });
    await a.evaluate(() => { let n = 0; window.confirm = () => n++ > 0; useProfile('paper-other'); });
    await a.waitForTimeout(500);
    const sw = await a.evaluate(m => ({on: PROFILE, ex: !!EX, away: awayRefused().includes(m.p), otherKey: localStorage.getItem(NS + ':exam:paper-other') === null && !FAILED.has(NS + ':exam:paper-other')}), me);
    const [dl] = await Promise.all([a.waitForEvent('download', {timeout: 5000}).catch(() => null), a.evaluate(p => exportAway(p), me.p)]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    check(sw.on === 'paper-other' && !sw.ex && sw.away && sw.otherKey && ex.exam && JSON.stringify(ex.exam.picks) === me.picks,
      'a profile switch puts the paper away: none on the next profile, the first profile\'s refused paper protected and in its export', Object.assign({}, sw, {exported: !!ex.exam}));
    check(!e5.length, 'profile switch with a paper: no page errors', e5.slice(0, 2).join('; '));
    await c5.close();
  }
  // real browser storage: with localStorage full, sessionStorage still takes a write (separate quota)
  {
    const c2 = await browser.newContext(); const p = await c2.newPage();
    await p.goto(await L.pageUrl(L.PAGE.PAGE));
    const q = await p.evaluate(() => { const chunk = 'x'.repeat(256 * 1024); let i = 0, full = false;
      try { for(; i < 200; i++) localStorage.setItem('fill-' + i, chunk); } catch(e){ full = e.name; }
      let sess = false; try { sessionStorage.setItem('copy-check', 'y'.repeat(50000)); sess = sessionStorage.getItem('copy-check').length === 50000; } catch(e){ sess = e.name; }
      for(let j = 0; j <= i; j++) localStorage.removeItem('fill-' + j); sessionStorage.removeItem('copy-check'); return {full, chunks: i, sess}; });
    console.log(`  note  ${L.BROWSER_NAME}: localStorage refused after ${q.chunks} chunks of 262,144 characters (${q.full}); sessionStorage then took 50,000 characters: ${q.sess}`);
    check(q.full && q.sess === true, `${L.BROWSER_NAME}: with localStorage full, sessionStorage still takes the paper's copy`, q);
    await c2.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
