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
  await o.evaluate(() => { show('exam'); document.getElementById('startExam').click(); });
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
  check(st.failed && st.risk && /did not save your exam paper in progress/.test(st.text) && /after a reload of this tab, but not after the tab is closed/.test(st.text) && st.exportBtn && st.copy,
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
  check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
  await ctx.close();
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
