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
  Storage.prototype.setItem = function(k, v){
    if(this === window.localStorage && window.__refuse && window.__refuse.some(r => String(k).includes(r))) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    if(this === window.sessionStorage && window.__refuseSess && window.__refuseSess.some(r => String(k).includes(r))) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return set.call(this, k, v); };
  const rem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function(k){ if(this === window.sessionStorage && window.__refuseRemove && window.__refuseRemove.some(r => String(k).includes(r))) throw new DOMException('refused', 'SecurityError'); return rem.call(this, k); };
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
  if(!(await o.evaluate(() => { show('exam'); return !!document.getElementById('startExam'); }))){
    // nothing here can be refused: no paper is written and nothing counts as at risk
    const st0 = await o.evaluate(() => ({key: localStorage.getItem(NS + ':exam:' + PROFILE), copy: sessionStorage.getItem(NS + ':exam-copy:' + PROFILE), risk: atRiskAll(), ex: !!EX}));
    check(st0.key === null && st0.copy === null && !st0.risk && !st0.ex, 'a course whose exam starts no paper (its question count is not set): no paper is written, nothing is at risk; the paper cases do not apply', st0);
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close(); await browser.close(); L.finish(NAME); return;
  }
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
  {
    // the review of b6de043: a later copy write refused too. The tab's copy then holds an earlier answer;
    // a return to the profile must keep the latest one, and a reload must not bring the earlier copy back
    const {ctx: c6, page: a, errors: e6} = await L.openFile(browser, {}, REFUSE);
    a.on('dialog', d => d.accept().catch(() => {}));
    await a.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    await a.evaluate(() => { show('exam'); document.getElementById('startExam').click(); });
    await a.waitForFunction(() => EX && EX.running, null, {timeout: 5000});
    const set = (i, v) => a.evaluate(([i, v]) => { const q = EX.qs[i]; EX.picks[i] = isMulti(q) ? [v] : (q.type === 'numeric' ? String(v) : v); saveExam(); return JSON.stringify(EX.picks); }, [i, v]);
    const stored0 = await set(0, 0);                                   // stored normally
    await a.evaluate(() => { window.__refuse = [':exam:']; });
    const mid = await set(1, 0);                                       // refused; the tab's copy holds it
    const pre = await a.evaluate(m => { const c = JSON.parse(sessionStorage.getItem(NS + ':exam-copy:' + PROFILE) || 'null'); return {copy: !!c && JSON.stringify(c.paper.picks) === m}; }, mid);
    await a.evaluate(() => { window.__refuseSess = [':exam-copy:']; });
    const latest = await set(1, 1);                                    // refused, and its copy refused too
    check(pre.copy && latest !== mid, 'precondition: the first refused save left a tab copy, and the second answer differs', Object.assign({}, pre, {latest, mid}));
    const w = await a.evaluate(m => { const raw = sessionStorage.getItem(NS + ':exam-copy:' + PROFILE); const c = raw ? JSON.parse(raw) : null;
      return {text: (document.getElementById('savewarn') || {}).textContent || '', copyOk: typeof examCopyCurrent === 'function' ? examCopyCurrent(PROFILE) : EXAM_COPY_OK, staleCopy: !!c && JSON.stringify(c.paper.picks) === m}; }, mid);
    check(/did not save your exam paper in progress/.test(w.text) && /Closing or reloading this page loses them/.test(w.text) && !/brings them back after a reload/.test(w.text) && !w.copyOk && !w.staleCopy,
      'a refused paper whose tab copy is refused too: the notice says closing or reloading loses its answers, and no earlier copy is left for a reload', Object.assign({}, w, {text: w.text.slice(0, 220)}));
    const me = await a.evaluate(() => PROFILE);
    await a.evaluate(() => { let n = 0; window.confirm = () => n++ > 0; useProfile('copy-other'); });
    await a.waitForTimeout(500);
    const awayOk = await a.evaluate(() => PROFILE === 'copy-other');
    await a.evaluate(p => { window.confirm = () => true; useProfile(p); }, me);
    await a.waitForTimeout(500);
    await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const ret = await a.evaluate(p => ({on: PROFILE === p, running: !!(EX && EX.running), picks: EX ? JSON.stringify(EX.picks) : null, risk: atRiskAll()}), me);
    const [dl] = await Promise.all([a.waitForEvent('download', {timeout: 5000}).catch(() => null), a.evaluate(() => exportProgress())]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    check(awayOk && ret.on && ret.running && ret.picks === latest && ret.risk && ex.exam && JSON.stringify(ex.exam.picks) === latest,
      'that paper, after a switch to another profile and back: the latest answer is on screen, still at risk, and in Export', Object.assign({}, ret, {awayOk, exported: ex.exam ? JSON.stringify(ex.exam.picks) : null, latest}));
    // a real reload: what the notice said. The answers after the stored save are lost; the stored paper comes back,
    // not the earlier copy as if it were the latest
    await a.evaluate(() => { window.__refuse = null; window.__refuseSess = null; });
    await a.reload(); await a.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const rl = await a.evaluate(() => ({running: !!(EX && EX.running), picks: EX ? JSON.stringify(EX.picks) : null, failed: FAILED.has(NS + ':exam:' + PROFILE)}));
    check(rl.running && rl.picks === stored0 && rl.picks !== mid && !rl.failed,
      'after a real reload in that state: the stored paper comes back (the refused answers lost, as the notice said), not the earlier tab copy', Object.assign({}, rl, {stored0, mid}));
    check(!e6.length, 'a refused tab copy: no page errors', e6.slice(0, 2).join('; '));
    await c6.close();
  }
  // the review of 213331a: profiles and tabs. Helpers for one page: answer question i of the running paper,
  // switch profile (every question accepted), the notice's text, an export's paper
  const H = {
    set: (a, i, v) => a.evaluate(([i, v]) => { const q = EX.qs[i]; EX.picks[i] = isMulti(q) ? [v] : (q.type === 'numeric' ? String(v) : v); saveExam(); return JSON.stringify(EX.picks); }, [i, v]),
    start: async a => { await a.evaluate(() => { show('exam'); const b = document.getElementById('startExam'); if(b) b.click(); }); await a.waitForFunction(() => EX && EX.running, null, {timeout: 5000}); },
    to: async (a, p) => { await a.evaluate(p => { window.confirm = () => true; useProfile(p); }, p); await a.waitForFunction(p => PROFILE === p, p, {timeout: 8000}).catch(() => {});
      await a.waitForFunction(() => typeof WRITER === 'undefined' || (WRITER === 'held' && WRITER_FOR === PROFILE) || WRITER === 'none', null, {timeout: 20000}).catch(() => {}); await a.waitForTimeout(300); },
    text: a => a.evaluate(() => (document.getElementById('savewarn') || {}).textContent || ''),
    exported: async a => { const [dl] = await Promise.all([a.waitForEvent('download', {timeout: 5000}).catch(() => null), a.evaluate(() => exportProgress())]); const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {}; return ex.exam ? JSON.stringify(ex.exam.picks) : null; },
    open: async () => { const o = await L.openFile(browser, {}, REFUSE); o.page.on('dialog', d => d.accept().catch(() => {}));
      await o.page.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {}); return o; },
  };
  const SAYS_COPY = /brings them back after a reload of this tab/, SAYS_LOSES = /Closing or reloading this page loses them/;
  {
    // M1: the copy text is worked out per profile. "me": its copy refused; "qq": its copy kept
    const {ctx: c7, page: a, errors: e7} = await H.open();
    const me = await a.evaluate(() => PROFILE);
    await H.start(a); const q1 = await H.set(a, 0, 0);                // stored
    await a.evaluate(p => { window.__refuse = [':exam:']; window.__refuseSess = [':exam-copy:' + p]; }, me);
    await H.set(a, 1, 1);                                              // refused, its copy refused too
    const t0 = await H.text(a);
    await H.to(a, 'qq'); await H.start(a); await H.set(a, 0, 1);       // qq: refused, its copy kept
    const tq = await H.text(a);
    await H.to(a, me); await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const t1 = await H.text(a);
    check(SAYS_LOSES.test(t0) && SAYS_COPY.test(tq) && SAYS_LOSES.test(t1) && !SAYS_COPY.test(t1),
      'per profile: back on a profile whose copy was refused, after another profile\'s copy was kept, the notice still says closing or reloading loses its answers', {t0: t0.slice(100, 220), tq: tq.slice(100, 220), t1: t1.slice(100, 220)});
    // what a reload does in that state: the answers after the stored save are lost, as the notice said
    await a.evaluate(() => { window.__refuse = null; window.__refuseSess = null; });
    await a.reload(); await a.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const rl = await a.evaluate(p => ({on: PROFILE === p, picks: EX ? JSON.stringify(EX.picks) : null}), me);
    check(rl.on && rl.picks === q1, 'and after a real reload the paper as stored comes back, without the refused answer, as the notice said', Object.assign({}, rl, {q1}));
    check(!e7.length, 'per profile (copy refused here, kept there): no page errors', e7.slice(0, 2).join('; '));
    await c7.close();
  }
  {
    // M1, the other order: "me" keeps its copy, "qq"'s copy is refused; back on "me" the notice says its copy brings the answers back
    const {ctx: c8, page: a, errors: e8} = await H.open();
    const me = await a.evaluate(() => PROFILE);
    await H.start(a); await H.set(a, 0, 0);
    await a.evaluate(() => { window.__refuse = [':exam:']; window.__refuseSess = [':exam-copy:qq']; });
    const latest = await H.set(a, 1, 1);                               // refused, its copy kept
    await H.to(a, 'qq'); await H.start(a); await H.set(a, 0, 1);       // qq: refused, its copy refused
    const tq = await H.text(a);
    await H.to(a, me); await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const t1 = await H.text(a);
    check(SAYS_LOSES.test(tq) && SAYS_COPY.test(t1), 'per profile: back on a profile whose copy was kept, after another profile\'s copy was refused, the notice says this tab\'s copy brings its answers back', {tq: tq.slice(100, 220), t1: t1.slice(100, 220)});
    await a.evaluate(() => { window.__refuse = null; window.__refuseSess = null; });
    await a.reload(); await a.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const rl = await a.evaluate(() => EX ? JSON.stringify(EX.picks) : null);
    check(rl === latest, 'and a real reload brings that paper back from the copy, with the latest answer', {rl, latest});
    check(!e8.length, 'per profile (copy kept here, refused there): no page errors', e8.slice(0, 2).join('; '));
    await c8.close();
  }
  // M2 and M3: tab A holds a refused answer on "me" and leaves the profile; tab B opens "me", then either
  // submits the stored paper (M2) or answers another question on it (M3), and closes; A comes back
  const twoTabs = async bAct => {
    const {ctx, page: a, errors} = await H.open();
    const me = await a.evaluate(() => PROFILE);
    await H.start(a); const q1 = await H.set(a, 0, 0);                 // stored
    await a.evaluate(() => { window.__refuse = [':exam:']; });
    const mine = await H.set(a, 1, 1);                                 // refused; A's copy kept
    await H.to(a, 'qq');
    const b = await ctx.newPage(); b.on('dialog', d => d.accept().catch(() => {}));
    await b.goto(a.url()); await b.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    if(await b.evaluate(p => PROFILE !== p, me)) await H.to(b, me);
    await b.waitForFunction(() => typeof WRITER === 'undefined' || (WRITER === 'held' && WRITER_FOR === PROFILE) || WRITER === 'none', null, {timeout: 20000}).catch(() => {});
    await b.evaluate(() => show('exam')); await b.waitForTimeout(300);
    const bState = await b.evaluate(() => ({running: !!(EX && EX.running), picks: EX ? JSON.stringify(EX.picks) : null}));
    const bOut = await bAct(b);
    await b.close();
    // A comes back to "me" once B's lock is free (a closed tab frees it a moment later): switched again until A holds it
    let held = false;
    for(let t = 0; t < 6 && !held; t++){
      if(t){ await H.to(a, 'qq'); await a.waitForTimeout(500); }
      await H.to(a, me);
      held = await a.evaluate(p => typeof WRITER === 'undefined' || WRITER === 'none' || (WRITER === 'held' && WRITER_FOR === p), me);
    }
    check(held, 'precondition: tab A holds the profile again after tab B closed');
    await a.evaluate(() => show('exam')); await a.waitForTimeout(500);
    return {ctx, a, errors, me, q1, mine, bState, bOut};
  };
  {
    const r = await twoTabs(b => b.evaluate(() => { finishExam(false); return LOG.filter(e => e[3] === 'exam').length; }));
    check(r.bState.running && r.bState.picks === r.q1 && r.bOut > 0, 'precondition: tab B opened the stored paper and submitted it', {bState: r.bState, examEntries: r.bOut});
    const st = await r.a.evaluate(() => ({running: !!(EX && EX.running), logged: LOG.filter(e => e[3] === 'exam').length, risk: atRiskAll(), text: (document.getElementById('savewarn') || {}).textContent || ''}));
    check(!st.running && st.logged === r.bOut, 'a paper submitted in another tab does not run again here, and its answers are recorded once', Object.assign({}, st, {text: undefined, bLogged: r.bOut}));
    const ex = await H.exported(r.a);
    check(st.risk && /submitted in another tab/.test(st.text) && ex === r.mine,
      'this page\'s refused answers on that submitted paper are not lost silently: still at risk, the notice says it was submitted in another tab, and Export holds them', {risk: st.risk, text: st.text.slice(100, 300), exported: ex, mine: r.mine});
    // a new paper asks first while they are not exported (here: just exported, so it starts; then nothing is at risk)
    const asked = []; r.a.removeAllListeners('dialog'); r.a.on('dialog', d => { asked.push(d.message()); d.dismiss().catch(() => {}); });
    await r.a.evaluate(() => { EXPORTED_SNAP = null; window.confirm = m => { window.__asked = m; return false; }; const b = document.getElementById('startExam'); if(b) b.click(); });
    const nw = await r.a.evaluate(() => ({asked: window.__asked || '', running: !!(EX && EX.running)}));
    check(/submitted in another tab are lost when a new paper starts/.test(nw.asked) && !nw.running, 'a new paper on that profile asks first while those answers are not exported; declined, they stay', nw);
    check(!r.errors.length, 'a paper submitted in another tab: no page errors', r.errors.slice(0, 2).join('; '));
    await r.ctx.close();
  }
  {
    const r = await twoTabs(async b => { const v = await H.set(b, 2, 1); return {v, stored: await b.evaluate(() => localStorage.getItem(NS + ':exam:' + PROFILE))}; });
    check(r.bState.running && r.bState.picks === r.q1 && r.bOut.stored && JSON.parse(r.bOut.stored).picks && JSON.stringify(JSON.parse(r.bOut.stored).picks) === r.bOut.v, 'precondition: tab B opened the stored paper and stored another answer on it', {bState: r.bState, b: r.bOut.v});
    const st = await r.a.evaluate(() => ({wall: !!(document.getElementById('stalewarn') || document.getElementById('stopwall')), running: !!(EX && EX.running), risk: atRiskAll()}));
    // the page tries to write anyway (its next save): nothing over B's paper
    await r.a.evaluate(() => { window.__refuse = null; if(EX){ EX.picks[3] = EX.picks[3]; saveExam(); } else { try { const raw = MEM[NS + ':exam:' + PROFILE]; const p = JSON.parse(raw); EX = {qs: p.ids.map(byId), i: 0, picks: p.picks, orders: p.orders, running: true, done: false, ends: p.ends}; saveExam(); EX = null; } catch(e){} } });
    const after = await r.a.evaluate(() => localStorage.getItem(NS + ':exam:' + PROFILE));
    const ex = await H.exported(r.a);
    check(st.wall && !st.running && after === r.bOut.stored, 'another tab\'s newer stored paper: this page stops with the saved-elsewhere wall and never writes over it', Object.assign({}, st, {unchanged: after === r.bOut.stored}));
    check(st.risk && ex === r.mine, 'this page\'s own refused paper stays at risk and in Export', {risk: st.risk, exported: ex, mine: r.mine});
    check(!r.errors.length, 'another tab\'s newer paper: no page errors', r.errors.slice(0, 2).join('; '));
    await r.ctx.close();
  }
  {
    // M3, at the save itself: another writer (a tab without Web Locks, or one that wrote while this page was not
    // looking) stores a different paper while this page's paper runs; this page's next answer writes nothing over it
    const {ctx: c10, page: a, errors: e10} = await H.open();
    await H.start(a); await H.set(a, 0, 0);
    const other = await a.evaluate(() => { const k = NS + ':exam:' + PROFILE, p = JSON.parse(localStorage.getItem(k)); p.picks[2] = isMulti(EX.qs[2]) ? [1] : 1; const v = JSON.stringify(p); localStorage.setItem(k, v); return v; });
    await H.set(a, 1, 1);
    const r = await a.evaluate(() => ({stored: localStorage.getItem(NS + ':exam:' + PROFILE), wall: !!(document.getElementById('stalewarn') || document.getElementById('stopwall'))}));
    check(r.stored === other && r.wall, 'a different paper stored by another writer while this paper runs: the next save writes nothing over it and the page stops with the saved-elsewhere wall', {unchanged: r.stored === other, wall: r.wall});
    check(!e10.length, 'another writer\'s paper at save time: no page errors', e10.slice(0, 2).join('; '));
    await c10.close();
  }
  {
    // S1: a refused paper stored at last: the notice goes at once. S2: the earlier copy cannot even be removed:
    // a return to the profile keeps this page's latest paper
    const {ctx: c9, page: a, errors: e9} = await H.open();
    const me = await a.evaluate(() => PROFILE);
    await H.start(a); await H.set(a, 0, 0);
    await a.evaluate(() => { window.__refuse = [':exam:']; });
    await H.set(a, 1, 0);                                               // refused, copy kept
    await a.evaluate(() => { window.__refuseSess = [':exam-copy:']; window.__refuseRemove = [':exam-copy:']; });
    const latest = await H.set(a, 1, 1);                               // refused; copy neither updated nor removed
    const stale = await a.evaluate(l => { const c = JSON.parse(sessionStorage.getItem(NS + ':exam-copy:' + PROFILE) || 'null'); return !!c && JSON.stringify(c.paper.picks) !== l; }, latest);
    await H.to(a, 'qq'); await H.to(a, me); await a.evaluate(() => show('exam')); await a.waitForTimeout(300);
    const back = await a.evaluate(() => EX ? JSON.stringify(EX.picks) : null);
    check(stale && back === latest && SAYS_LOSES.test(await H.text(a)), 'an earlier copy that cannot be removed: a return to the profile keeps the latest paper, and the notice does not count on the copy', {stale, back, latest});
    await a.evaluate(() => { window.__refuse = null; window.__refuseSess = null; window.__refuseRemove = null; });
    await H.set(a, 2, 1);                                              // stored at last
    const s1 = await a.evaluate(() => ({failed: FAILED.has(NS + ':exam:' + PROFILE), notice: !!document.getElementById('savewarn'), risk: atRiskAll()}));
    check(!s1.failed && !s1.notice && !s1.risk, 'the refused paper stored at last: the notice goes at once and nothing is at risk', s1);
    check(!e9.length, 'stored at last: no page errors', e9.slice(0, 2).join('; '));
    await c9.close();
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
