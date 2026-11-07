/* A running exam paper, quiz session or targeted review belongs to the profile that
 * started it.
 *
 * Found by an independent review of the live DEENT site (core 25c643d), 2026-11-06:
 * profile A starts an exam paper and picks an answer, the student switches to profile
 * B, and A's paper is still on screen with A's pick; submitting it records the pick in
 * B's history. The exam paper (EX) and the quiz session (Q) were page globals that a
 * profile switch left in place.
 *
 *   1. exam: A picks an answer, then a switch to B: B sees no paper and no pick, a click
 *      on the exam view writes nothing under B, B cannot submit A's paper, nothing is
 *      recorded or stored under B; back to A, A's paper comes back with its pick
 *   2. reload with A's paper while B is active: B still has no paper, and A's comes back
 *   3. the clock: A's paper runs out while B is on the Exam tab: nothing is recorded
 *      under B; back to A, the paper is submitted under A
 *   4. a submit run twice records each answer once, and a reload straight after a
 *      submit brings no paper back and keeps the answers once
 *   5. quiz and targeted review: a question A is part-way through, and a review list A
 *      started, are not on B's screen; back to A, they come back as A left them
 *   6. both profiles' saved histories hold only their own answers
 *   7. two tabs: tab 1 on A in a review, tab 2 switches the shared profile to B, tab 1
 *      reloads as B: the place brought back holds none of A's quiz (the review of #58)
 *   8. the steps that put the session away and bring the next back both throw: B still
 *      starts with none of A's
 *   9. a pick that saveExam could not store (the profile saved in another window) is
 *      kept on the page for A across a switch
 *  10. beside this tab's per-tab record (#69): a switch leaves A's record exactly as it was
 *      and gives B no record with A's answers; with storage full, a refused pick survives a
 *      switch and back, and A's record is never removed
 *
 *     node ownership_test.js
 */
const L = require('./check_lib');
const NAME = 'ownership_test.js';
const {check, skip} = L;
L.PAGE.need(NAME);

const switchTo = async (page, name) => {
  await page.evaluate(n => { window.__name = n; }, name);
  await page.click('#btnWho');
  await page.waitForFunction(n => document.getElementById('whoName').textContent === n, name, {timeout: 5000});
  await page.waitForTimeout(300);   // the lock and the 150 ms save
};
// what is stored for profile p: answers in its progress, entries in its history, its paper
const stored = (page, p) => page.evaluate(p => {
  let a = 0, l = 0, exam = null;
  try { const d = JSON.parse(localStorage.getItem(NS + ':data:' + p) || 'null'); a = d && Array.isArray(d.answers) ? d.answers.length : 0; } catch(e){ a = -1; }
  try { const v = JSON.parse(localStorage.getItem(NS + ':log:' + p) || '[]'); l = Array.isArray(v) ? v.length : -1; } catch(e){ l = -1; }
  try { exam = JSON.parse(localStorage.getItem(NS + ':exam:' + p) || 'null'); } catch(e){ exam = 'unreadable'; }
  return {answers: a, log: l, exam};
}, p);
// a paper's pick for one item: an option index, or for a select-all item the list of ticked options
// (the first item of a drawn paper can be either; Medicinal-chemistry's job 128235854299 drew a select-all)
const has = (p, oi) => p === oi || (Array.isArray(p) && p.includes(oi));
// the Exam tab as drawn now. A chosen option is counted by aria-pressed, with the class names the
// engine has used for it (pick-ok, exsel since #59, on for select-all); each button counts once
const examView = page => page.evaluate(() => {
  show('exam');
  const v = document.getElementById('v-exam');
  return {running: !!v.querySelector('#exClock'), start: !!v.querySelector('#startExam'),
          picked: v.querySelectorAll('.opt[aria-pressed="true"], .opt.pick-ok, .opt.exsel, .opt.on').length, submit: !!v.querySelector('#exEnd'),
          result: /Exam simulation —/.test(v.textContent)};
});
// A starts a paper and picks the first option of its first question; returns the option index picked
const startAndPick = page => page.evaluate(() => {
  show('exam');
  const s = document.getElementById('startExam'); if(!s) return null;
  s.click();
  const b = document.querySelector('#v-exam .opt'); if(!b) return null;
  const oi = +b.dataset.o; b.click();
  return oi;
});

(async () => {
  const {browser} = await L.launch(NAME);

  console.log('\n=== 1. An exam paper stays with the profile that started it ===');
  let examOn = true;
  {
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    const oi = await startAndPick(page);
    if(oi === null){
      examOn = false;
      skip('the exam cases', 'this course starts no exam paper (no question count, or no paper drawn)');
    } else {
      await page.waitForTimeout(300);
      const a0 = await stored(page, 'A');
      check(a0.exam && Array.isArray(a0.exam.picks) && a0.exam.picks[0] !== null && a0.exam.picks[0] !== undefined,
        "A's paper is stored under A with A's pick", JSON.stringify(a0.exam && a0.exam.picks));
      await switchTo(page, 'B');
      const v = await examView(page);
      check(!v.running && v.picked === 0 && !v.submit, "after the switch to B, B's Exam tab shows no running paper and no pick", JSON.stringify(v));
      check(v.start, "B's Exam tab offers B a paper of its own", JSON.stringify(v));
      // whatever is on B's screen: a click on an option, and a submit, record nothing under B
      await page.evaluate(() => {
        const o = document.querySelector('#v-exam .opt'); if(o) o.click();
        const e = document.getElementById('exEnd'); if(e) e.click();
      });
      await page.waitForTimeout(400);
      const b1 = await stored(page, 'B'), live = await page.evaluate(() => DB.answers.length);
      check(b1.exam === null, "nothing of A's paper is stored under B", JSON.stringify(b1.exam && b1.exam.picks));
      check(live === 0 && b1.answers === 0 && b1.log === 0, "B cannot submit A's paper: B's progress and history hold no answer",
        JSON.stringify({live, b1}));
      await switchTo(page, 'A');
      const back = await examView(page);
      const picks = await page.evaluate(() => EX && EX.picks);
      check(back.running && back.picked === 1, "back on A, A's paper is running again with A's pick on screen", JSON.stringify(back));
      check(Array.isArray(picks) && has(picks[0], oi), "A's pick is the one A made", JSON.stringify({picks, oi}));
      const a1 = await stored(page, 'A');
      check(a1.answers === 0 && a1.log === 0, 'nothing was recorded under A by the switches', JSON.stringify(a1));
    }
    check(!errors.length, 'no page error in case 1', errors.join(' | '));
    await ctx.close();
  }

  if(examOn){
    console.log('\n=== 2. A reload while B is active ===');
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    const oi = await startAndPick(page);
    await page.waitForTimeout(300);
    await switchTo(page, 'B');
    // a student who clicks on whatever the Exam tab shows
    await page.evaluate(() => { show('exam'); const o = document.querySelector('#v-exam .opt'); if(o) o.click(); });
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const who = await page.evaluate(() => document.getElementById('whoName').textContent);
    const v = await examView(page);
    check(who === 'B' && !v.running && v.picked === 0, 'after a reload with B active, B has no paper', JSON.stringify({who, v}));
    check((await stored(page, 'B')).exam === null, 'no paper is stored under B', '');
    await switchTo(page, 'A');
    const back = await examView(page);
    const picks = await page.evaluate(() => EX && EX.picks);
    check(back.running && Array.isArray(picks) && has(picks[0], oi), "back on A after the reload, A's paper and pick are there", JSON.stringify({back, picks, oi}));
    check(!errors.length, 'no page error in case 2', errors.join(' | '));
    await ctx.close();
  }

  if(examOn){
    console.log("\n=== 3. A's clock runs out while B is on the Exam tab ===");
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    await startAndPick(page);
    // the paper ends 1.5 s from now (stored so, as a paper near its end is)
    await page.evaluate(() => { EX.ends = Date.now() + 1500; saveExam(); });
    await switchTo(page, 'B');
    await examView(page);
    await page.waitForTimeout(3000);
    const b = await stored(page, 'B'), live = await page.evaluate(() => DB.answers.length);
    check(b.answers === 0 && b.log === 0 && live === 0, "A's paper running out records nothing under B", JSON.stringify({b, live}));
    await switchTo(page, 'A');
    const v = await examView(page);
    await page.waitForTimeout(400);
    const a = await stored(page, 'A');
    check(v.result && !v.running, "back on A, the paper that ran out is submitted and its result shown", JSON.stringify(v));
    check(a.answers === 1 && a.log === 1 && a.exam === null, "the one answered item is recorded under A, once, and A's paper is cleared", JSON.stringify(a));
    check(!errors.length, 'no page error in case 3', errors.join(' | '));
    await ctx.close();
  }

  if(examOn){
    console.log('\n=== 4. A submit run twice, and a reload straight after a submit ===');
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    await startAndPick(page);
    // the submit button's handler, run twice (a double tap that reaches the handler twice, or a
    // timer that fires as the paper is submitted)
    const n = await page.evaluate(() => {
      const h = document.getElementById('exEnd').onclick;
      h(); try { h(); } catch(e){} try { finishExam(true); } catch(e){}
      return DB.answers.length;
    });
    check(n === 1, 'a paper submitted twice records its one answered item once', 'recorded ' + n);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const v = await examView(page);
    const a = await stored(page, 'A');
    check(!v.running && a.exam === null, 'after a reload straight after the submit, no paper comes back', JSON.stringify({v, exam: a.exam}));
    check(a.answers === 1 && a.log === 1, 'the answers are stored once after the reload', JSON.stringify(a));
    check(!errors.length, 'no page error in case 4', errors.join(' | '));
    await ctx.close();
  }

  console.log('\n=== 5. A quiz question and a targeted review stay with their profile ===');
  {
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    // a select-all question part-way answered (one option ticked, not checked), else a choice question shown
    const q = await page.evaluate(() => {
      const m = QUESTIONS.find(x => isMulti(x) && x.options && x.options.length) || QUESTIONS.find(x => x.options && x.options.length);
      if(!m) return null;
      Q = {pool: [m], label: 'check', sweep: [m.id], i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
      nextQuestion(); show('quiz');
      if(isMulti(m)) document.querySelector('#v-quiz button[data-o]').click();
      return {id: m.id, multi: isMulti(m), picked: Q.picked};
    });
    if(!q){ skip('the quiz case', 'this course has no question answered with option buttons'); }
    else {
      await switchTo(page, 'B');
      const onB = await page.evaluate(() => { show('quiz'); const v = document.getElementById('v-quiz');
        return {current: Q && Q.current ? Q.current.id : null, opts: v.querySelectorAll('button[data-o]').length, text: v.textContent.trim().slice(0, 40)}; });
      check(onB.current === null && onB.opts === 0, "B's Quiz tab does not show the question A was answering", JSON.stringify(onB));
      // whatever B's screen holds: clicking it records nothing under B
      await page.evaluate(() => { const o = document.querySelector('#v-quiz button[data-o]'); if(o) o.click(); const c = document.getElementById('btnCheck'); if(c) c.click(); });
      await page.waitForTimeout(300);
      const b = await stored(page, 'B');
      check(b.answers === 0 && b.log === 0, 'nothing is recorded under B from the quiz', JSON.stringify(b));
      await switchTo(page, 'A');
      const onA = await page.evaluate(() => { show('quiz'); return {current: Q && Q.current ? Q.current.id : null, picked: Q && Q.picked}; });
      check(onA.current === q.id && JSON.stringify(onA.picked) === JSON.stringify(q.picked), "back on A, A's question comes back as A left it", JSON.stringify({onA, q}));
    }
    // a targeted review list (Weak spots' "drill these"), started by A
    const ids = await page.evaluate(() => { const pool = QUESTIONS.filter(x => x.options && x.options.length).slice(0, 2);
      if(!pool.length) return null; drillList(pool, 'Missed concepts'); return pool.map(x => x.id); });
    if(ids){
      await switchTo(page, 'B');
      const onB = await page.evaluate(() => { show('quiz'); return {label: Q && Q.label, current: Q && Q.current ? Q.current.id : null}; });
      check(onB.label !== 'Missed concepts' && onB.current === null, "A's targeted review is not B's session", JSON.stringify(onB));
      await switchTo(page, 'A');
      const onA = await page.evaluate(() => ({label: Q && Q.label, current: Q && Q.current ? Q.current.id : null}));
      check(onA.label === 'Missed concepts' && ids.includes(onA.current), "back on A, A's targeted review is A's session again", JSON.stringify(onA));
      // A answers it: recorded under A only
      await page.evaluate(() => { show('quiz'); const q = Q.current;
        if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
        else document.querySelector('#v-quiz button[data-o]').click(); });
      await page.waitForTimeout(400);
      const a = await stored(page, 'A'), b = await stored(page, 'B');
      check(a.answers === 1 && a.log === 1 && b.answers === 0 && b.log === 0, "A's review answer is in A's history and not in B's", JSON.stringify({a, b}));
    }
    check(!errors.length, 'no page error in case 5', errors.join(' | '));
    await ctx.close();
  }

  if(examOn){
    console.log("\n=== 6. Each profile's own paper and history, both kept ===");
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    await startAndPick(page);
    await switchTo(page, 'B');
    const oiB = await startAndPick(page);
    check(oiB !== null, 'B starts a paper of its own', '');
    await page.evaluate(() => finishExam(true));   // B submits B's paper: one answered item
    await page.waitForTimeout(400);
    await switchTo(page, 'A');
    const v = await examView(page);
    check(v.running && v.picked === 1, "A's paper is untouched by B's paper and submit", JSON.stringify(v));
    await page.evaluate(() => finishExam(true));
    await page.waitForTimeout(400);
    const a = await stored(page, 'A'), b = await stored(page, 'B');
    check(a.answers === 1 && a.log === 1 && b.answers === 1 && b.log === 1 && a.exam === null && b.exam === null,
      'each profile has its own one answer in its progress and history, and no paper left', JSON.stringify({a, b}));
    const modes = await page.evaluate(() => [NS + ':log:A', NS + ':log:B'].map(k => (JSON.parse(localStorage.getItem(k) || '[]')[0] || [])[3]));
    check(modes[0] === 'exam' && modes[1] === 'exam', 'both entries are exam entries', JSON.stringify(modes));
    check(!errors.length, 'no page error in case 6', errors.join(' | '));
    await ctx.close();
  }

  console.log('\n=== 7. A reload after another tab switched the profile (the place before a reload) ===');
  {
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    // tab 1 on A: a review list with a select-all question part-way answered, else a choice question shown
    const q = await page.evaluate(() => {
      const m = QUESTIONS.find(x => isMulti(x) && x.options && x.options.length) || QUESTIONS.find(x => x.options && x.options.length);
      if(!m) return null;
      drillList([m], 'Missed concepts'); show('quiz');
      if(isMulti(m)) document.querySelector('#v-quiz button[data-o]').click();
      placeSave();
      return {id: Q.current.id, picked: Q.picked};
    });
    if(!q) skip('the two-tab reload case', 'this course has no question answered with option buttons');
    else {
      // tab 2 of the same browser switches the profile (shared by every tab) to B
      const p2 = await ctx.newPage(); p2.on('dialog', d => d.accept());
      await p2.goto(page.url());
      await p2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      // tab 2 opened on A, which tab 1 holds, so it shows the stop wall; its Switch profile button switches
      await p2.evaluate(() => { window.__name = 'B'; const w = document.getElementById('stopSwitch'); if(w) w.click(); else { askProfile(true); show(VIEW); } });
      await p2.waitForFunction(() => document.getElementById('whoName').textContent === 'B', null, {timeout: 5000});
      await p2.waitForTimeout(300);
      check(await page.evaluate(() => localStorage.getItem(NS + ':profile')) === 'B', 'tab 2 made B the chosen profile', '');
      await p2.close();
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({who: PROFILE, cur: Q && Q.current ? Q.current.id : null, label: Q && Q.label,
        opts: document.querySelectorAll('#v-quiz:not(.hide) button[data-o]').length}));
      check(r.who === 'B' && r.cur === null && r.label !== 'Missed concepts' && r.opts === 0,
        "tab 1 reloads as B without A's question, ticks or review list", JSON.stringify(r));
      await page.evaluate(() => { const c = document.getElementById('btnCheck'); if(c) c.click(); });
      await page.waitForTimeout(400);
      const b = await stored(page, 'B');
      check(b.answers === 0 && b.log === 0, 'nothing is recorded under B after that reload', JSON.stringify(b));
      // the same reload on the same profile still brings the place back
      await switchTo(page, 'A');
      await page.evaluate(() => { drillList(QUESTIONS.filter(x => x.options && x.options.length).slice(0, 1), 'Missed concepts'); show('quiz'); placeSave(); });
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      await page.waitForTimeout(400);
      const same = await page.evaluate(() => ({who: PROFILE, view: VIEW, label: Q && Q.label}));
      check(same.who === 'A' && same.view === 'quiz' && same.label === 'Missed concepts', "a reload on A itself still brings A's review back", JSON.stringify(same));
    }
    check(!errors.length, 'no page error in case 7', errors.join(' | '));
    await ctx.close();
  }

  console.log('\n=== 8. The steps that put the session away and bring the next one back throw ===');
  {
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    const started = await startAndPick(page);
    // the steps this case replaces must exist: a core without them (main before #58, or a rename) fails
    // here, so the case can never stop probing without a failure; the switch below is checked either way
    const steps = await page.evaluate(() => ({park: typeof parkSession === 'function', resume: typeof resumeSession === 'function'}));
    check(steps.park && steps.resume, 'the core has the switch steps this case makes throw (parkSession, resumeSession)', JSON.stringify(steps));
    await page.evaluate(() => { const m = QUESTIONS.find(x => x.options && x.options.length); if(m) drillList([m], 'Missed concepts');
      if(typeof parkSession === 'function'){ window.__park = parkSession; parkSession = () => { throw new Error('probe: parkSession fails'); }; }
      if(typeof resumeSession === 'function'){ window.__resume = resumeSession; resumeSession = () => { throw new Error('probe: resumeSession fails'); }; } });
    await switchTo(page, 'B');
    const r = await page.evaluate(() => ({ex: !!EX, q: !!Q}));
    await page.evaluate(() => { if(window.__park) parkSession = window.__park; if(window.__resume) resumeSession = window.__resume; });
    const v = await examView(page);
    check(!r.ex && !r.q && !v.running, 'B starts with no paper and no quiz session of A', JSON.stringify({r, v}));
    if(started !== null){
      await page.waitForTimeout(400);
      check((await stored(page, 'B')).exam === null, 'nothing of A is stored under B', '');
      await switchTo(page, 'A');
      const back = await examView(page);
      check(back.running && back.picked === 1, "A's stored paper still comes back on A", JSON.stringify(back));
    }
    await ctx.close();
  }

  if(examOn){
    console.log('\n=== 9. A pick that could not be saved (the profile was saved elsewhere) survives a switch ===');
    const {ctx, page, errors} = await L.openFile(browser);
    await switchTo(page, 'A');
    await startAndPick(page);
    // another window saves A's progress: this page then stores nothing under A (saveExam stops)
    await page.evaluate(() => { const k = NS + ':data:A'; const d = JSON.parse(localStorage.getItem(k) || JSON.stringify(BLANK())); d.elsewhere = Date.now(); localStorage.setItem(k, JSON.stringify(d)); });
    const pick2 = await page.evaluate(() => { const b = document.querySelectorAll('#v-exam .opt')[1]; if(!b) return null; const oi = +b.dataset.o; b.click(); return {oi, savedElsewhere: profileSavedElsewhere()}; });
    const storedPick = ((await stored(page, 'A')).exam || {}).picks;
    check(pick2 && pick2.savedElsewhere && storedPick && !has(storedPick[0], pick2.oi), 'the second pick was not stored (the profile was saved elsewhere)', JSON.stringify({pick2, storedPick}));
    await page.evaluate(() => { window.__name = 'B'; askProfile(true); show(VIEW); });
    await page.waitForTimeout(300);
    const onB = await examView(page);
    check(!onB.running, 'B has no paper', JSON.stringify(onB));
    await page.evaluate(() => { window.__name = 'A'; askProfile(true); show(VIEW); });
    await page.waitForTimeout(300);
    const picks = await page.evaluate(() => EX && EX.picks);
    check(Array.isArray(picks) && pick2 && has(picks[0], pick2.oi), "back on A, the pick this page could not store is still on A's paper", JSON.stringify({picks, pick2}));
    check(!errors.length, 'no page error in case 9', errors.join(' | '));
    await ctx.close();
  }

  if(examOn){
    console.log("\n=== 10. A switch beside this tab's per-tab record (#69), with storage working and with it full ===");
    // the per-tab record (NS:pending:<profile>:<tab>) protects this tab's last save; the switch only
    // saves the paper under its own key and puts the paper and quiz session away, so the record of A
    // stays as it was, and B gets none of A's answers in a record of its own
    const QUOTA = () => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        if(window.__quota) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        return real.call(this, k, v);
      };
    };
    const {ctx, page, errors} = await L.openFile(browser, {}, QUOTA);
    await switchTo(page, 'A');
    // one quiz answer under A: A's progress and A's per-tab record hold it
    await page.evaluate(() => { const m = QUESTIONS.find(x => x.options && x.options.length && !isMulti(x));
      drillList([m], 'Missed concepts'); show('quiz'); document.querySelector('#v-quiz button[data-o]').click(); });
    await page.waitForTimeout(400);
    const recs = p => page.evaluate(p => { const out = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i);
      if(k && k.startsWith(NS + ':pending:' + p + ':')) out[k] = localStorage.getItem(k); } return out; }, p);
    const recA0 = await recs('A');
    const countIn = r => Object.values(r).map(v => { try { return JSON.parse(v).db.answers.length; } catch(e){ return -1; } });
    check(Object.keys(recA0).length === 1 && countIn(recA0)[0] === 1, "A's per-tab record holds A's one answer", JSON.stringify(countIn(recA0)));
    await startAndPick(page);
    await page.waitForTimeout(300);
    await switchTo(page, 'B');
    const recA1 = await recs('A'), recB = await recs('B');
    check(JSON.stringify(recA1) === JSON.stringify(recA0), "the switch leaves A's per-tab record exactly as it was", '');
    check(countIn(recB).every(n => n === 0), "no record under B holds an answer", JSON.stringify(countIn(recB)));
    await switchTo(page, 'A');
    // storage full from here: a pick under A is refused, then a switch to B and back
    await page.evaluate(() => { window.__quota = true; });
    const oi2 = await page.evaluate(() => { show('exam'); const b = document.querySelectorAll('#v-exam .opt')[1]; if(!b) return null; const oi = +b.dataset.o; b.click(); return oi; });
    const refused = await page.evaluate(() => FAILED.has(NS + ':exam:A'));
    check(oi2 !== null && refused, "with storage full, A's pick is refused and held on the page", JSON.stringify({oi2, refused}));
    const recA2 = await recs('A');
    await page.evaluate(() => { window.__name = 'B'; askProfile(true); show(VIEW); });
    await page.waitForTimeout(300);
    const onB = await examView(page);
    check(!onB.running, 'with storage full, B has no paper after the switch', JSON.stringify(onB));
    await page.evaluate(() => { window.__name = 'A'; askProfile(true); show(VIEW); });
    await page.waitForTimeout(300);
    const back = await page.evaluate(() => ({picks: EX && EX.picks, owner: EX && EX.owner}));
    check(Array.isArray(back.picks) && has(back.picks[0], oi2) && back.owner === 'A', "back on A, the refused pick is on A's paper", JSON.stringify({back, oi2}));
    const recA3 = await recs('A');
    check(JSON.stringify(recA3) === JSON.stringify(recA2) && Object.keys(recA3).length === 1,
      "with storage full, A's per-tab record is never removed by the switches", JSON.stringify({before: Object.keys(recA2).length, after: Object.keys(recA3).length}));
    await page.evaluate(() => { window.__quota = false; });
    check(!errors.length, 'no page error in case 10', errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': ' + (e && e.stack || e)); process.exit(1); });
