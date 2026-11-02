/* study-controls: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * In node, on the course's own page: the flags are set, cleared and kept in the
 * progress (DB.flags), an id the bank does not have is refused, and a saved
 * progress with flags or a layout of another shape loses that field on load,
 * while a saved progress without them is read back exactly as saved.
 * On a scratch copy with 6 of Intro to Pharmacology's questions (exam1-drill/src/
 * q_L01.js at 929cd62: 4 single-answer, 2 select-all; ids prefixed sct-, the
 * professor and the skill set to the course's own), in Chromium, with
 * Intro to Pharmacology's own browser checks of these controls ported
 * (exam1-drill/src/browser_test.js lines 41-48, 124-139, 150-156, 243-246,
 * 286-294 and 332-337 at 929cd62):
 *   flags: Flag on the quiz card flags the question; after a mouse click on Flag
 *   a letter key and Enter still drive the quiz and Enter does not unflag; Topics
 *   shows the count and Drill flagged, which drills exactly the flagged questions;
 *   the flags are kept through a reload; Clear flags clears them; on the paper a
 *   flagged question is listed by number on the question bar and its link moves
 *   to it; a flag on the exam result keeps the result page.
 *   keys: a letter picks while a tab button has focus; after a right answer 2
 *   records Not sure and 3 records I guessed, each moving on; 1 and Enter on a
 *   select-all item pick and check; a key typed in a field does nothing; on the
 *   paper a letter picks, the right arrow moves on and the left arrow back.
 *   one page: every multiple-choice question of the set on one page; one answer
 *   there records one answer; Not sure is offered on the card answered last only;
 *   back to one at a time, the questions answered on the page are not asked
 *   again; the choice is kept through a reload; the exam paper on one page with
 *   its clock running, a pick saved and kept through a reload, the bar with the
 *   clock in view at the bottom of the page, Submit giving the result page.
 *   strict: the box on the start page with the course's note; a strict paper has
 *   no Back, no flags and no one-page layout, the left arrow does nothing, Next
 *   on a blank question asks first and stays when the answer is Cancel, the
 *   paper stays strict through a reload, and the next paper started without the
 *   box has Back again.
 * On a copy with every option off: no Flag, no layout chips, no strict box, and
 * the letter keys do nothing.
 *
 *     node features/study-controls/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/study-controls/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* 6 of Intro to Pharmacology's questions (exam1-drill/src/q_L01.js, 929cd62), the fields the controls use */
const IP = [{"id": "L01-002", "concept": "metoprolol-predict-effect", "stem": "What effect would metoprolol have on heart rate?", "options": [{"t": "Slower heart rate", "correct": true, "why": "Blocking the heart’s β1 receptors slows the heart rate; this is the prediction he asked the class to make."}, {"t": "Faster heart rate", "correct": false, "why": "Treats an antagonist as if it were an agonist at β1."}, {"t": "No change in heart rate", "correct": false, "why": "Ignores that the blocked receptor is located in the heart."}, {"t": "Increased urination", "correct": false, "why": "Confuses the β1 blocker with the thiazide diuretic example."}], "teach": "If you know the mechanism of action (β1-selective antagonist) and the site of action (β1 receptors in the heart), the effect follows: the heart rate slows. The same reasoning predicts side effects such as bradycardia.", "cite": "Pharmacodynamics-Day-1-2026s.pdf slide ~9; transcript 9/22"}, {"id": "L01-004", "concept": "drugs-alter-ongoing-system", "stem": "Which statement is CORRECT about what drugs do to a biological system?", "options": [{"t": "Drugs alter an ongoing physiological or pathological function", "correct": true, "why": "Drugs change an ongoing physiological or pathological function; they initiate, inhibit or modulate."}, {"t": "Drugs create a new physiological pathway in the body", "correct": false, "why": "He states drugs do not create anything new."}, {"t": "Drugs can only block receptors", "correct": false, "why": "Drugs can also initiate or modulate a signal."}, {"t": "Drugs can only mimic hormones and neurotransmitters the body already makes", "correct": false, "why": "Some drugs mimic body products; others are unique. Either way they alter an existing system."}, {"t": "All of the above", "correct": false, "why": "Only the first statement is correct; drugs do not create new pathways, and they can initiate or modulate as well as block."}], "teach": "Drugs are chemical substances that alter an ongoing physiological or pathological function by interacting with components of the biological system. They can initiate, inhibit or modulate a signal, but they do not create a new pathway.", "cite": "Pharmacodynamics-Day-1-2026s.pdf slides ~11, ~31; transcript 9/22"}, {"id": "L01-005", "concept": "receptor-message-physiological-response", "stem": "Norepinephrine binds β1 receptors and cardiac output increases. In receptor terms, what is the increase in cardiac output?", "options": [{"t": "The physiological response", "correct": true, "why": "The message a drug–receptor interaction creates is seen as the physiological response."}, {"t": "The affinity of norepinephrine for β1", "correct": false, "why": "Affinity is how well the drug binds, not the response produced."}, {"t": "The site of action", "correct": false, "why": "The site of action is where the receptor is (the heart), not the response."}, {"t": "The apparent potency", "correct": false, "why": "Apparent potency concerns how much drug reaches the site; it is not the response itself."}], "teach": "Receptors sense signals such as hormones, neurotransmitters and drugs. The message the receptor creates after binding is what we observe as the physiological response, for example increased cardiac output when norepinephrine binds β1.", "cite": "Pharmacodynamics-Day-1-2026s.pdf slide ~11; transcript 9/22"}, {"id": "L01-006", "concept": "curare-not-absorbed", "stem": "Curare (Strychnos toxifera) is a very large, positively charged molecule used as a paralytic agent. Why does eating the plant produce no effect?", "options": [{"t": "It cannot be absorbed", "correct": true, "why": "A large, charged molecule is not absorbed, so eating it does nothing."}, {"t": "It has no affinity", "correct": false, "why": "Curare paralyzes fish through the gills, so it does act once it reaches its target."}, {"t": "It is a partial agonist", "correct": false, "why": "Its lack of oral effect is about absorption, not intrinsic activity."}, {"t": "Stomach acid adds a charge", "correct": false, "why": "The charge is a property of the molecule itself."}], "teach": "Curare is a large molecule with a positive charge, so it is not absorbed when eaten. It was discovered when fish, whose gills are outside the body, became paralyzed and floated up. It was later used as a paralyzing agent for surgery.", "cite": "Pharmacodynamics-Day-1-2026s.pdf slide ~14; transcript 9/22"}, {"id": "L01-003", "concept": "metoprolol-predict-adr", "stem": "Which adverse drug reactions (ADRs) would metoprolol be expected to produce? Select all that apply.", "multi": true, "options": [{"t": "Bradycardia", "correct": true, "why": "Blocking β1 in the heart can slow it too much; bradycardia is listed as an ADR."}, {"t": "Fatigue", "correct": true, "why": "Fatigue is listed as an ADR and he ties it to β1 receptors in the brain."}, {"t": "Tachycardia", "correct": false, "why": "A β1 antagonist slows the heart; tachycardia reverses the effect."}, {"t": "Hyponatremia", "correct": false, "why": "Hyponatremia was the thiazide diuretic example, from losing sodium."}], "teach": "Metoprolol blocks β1 receptors. In the heart that slows the rate, and too much slowing is bradycardia. β1 receptors are also in the brain, which he links to fatigue and patients forgetting things.", "cite": "Pharmacodynamics-Day-1-2026s.pdf slide ~9; transcript 9/22"}, {"id": "L01-007", "concept": "nds-regulation", "stem": "Which statements about natural dietary supplements (NDS) are correct? Select all that apply.", "multi": true, "options": [{"t": "They are regulated as food", "correct": true, "why": "NDS are regulated as food, not as drugs."}, {"t": "They have less FDA oversight", "correct": true, "why": "Because they are not drugs, the FDA oversees them less; they stay on the market until they cause harm."}, {"t": "Labels cannot claim they cure", "correct": true, "why": "Labels cannot state that the product treats, cures, diagnoses or prevents a disease."}, {"t": "They are tested like Rx drugs", "correct": false, "why": "The label states the claims have not been evaluated by the FDA."}, {"t": "Being natural makes them safe", "correct": false, "why": "He answered this with cyanide and lead: natural does not mean safe."}], "teach": "NDS are regulated as food, so they receive less FDA oversight and remain on the market until they cause harm. Their labels cannot claim to treat, cure, diagnose or prevent disease. Natural does not mean safe.", "cite": "Pharmacodynamics-Day-1-2026s.pdf slides ~15–~16; transcript 9/22"}];
const NOTE = 'Strict-paper note set by the study-controls test.';
const pre = id => 'sct-' + id;

function fixtureFiles(own){
  const topic = {id: 'sct-L01', name: 'Day 1: drugs, receptors, potency', prof: own.prof, cite: 'Day 1 (9/22) \u2014 Pharmacodynamics-Day-1-2026s.pdf',
    subs: [{id: 'a', name: 'Must know vs should know', cite: 'slides ~7\u2013~12'}]};
  const qs = IP.map(q => Object.assign({}, q, {id: pre(q.id), concept: 'sct-' + q.concept, prof: own.prof, tier: 'new', topic: 'sct-L01', sub: 'a', skill: own.skill, tags: []}));
  return {'q90_sc_fixture.js': '/* 6 of Intro to Pharmacology\'s questions (exam1-drill/src/q_L01.js, 929cd62), added by the study-controls test */\n' +
    `TOPICS.push(${JSON.stringify(topic)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`};
}

(async () => {
  console.log('\n=== the course\'s own page (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX: typeof FX === "undefined" ? null : FX, DB: () => DB, upgradeDB, QUESTIONS, COURSE})');
  const S = X.FX && X.FX.api('study-controls');
  if(!check(!!S, 'the page carries study-controls, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const id0 = X.QUESTIONS[0].id, id1 = X.QUESTIONS[1].id;
  if(S.options.flags){
    S.set(id0, true); S.toggle(id1);
    const a = {f: S.flagged().slice(), db: Object.keys(X.DB().flags).sort(), is: S.isFlagged(id0)};
    S.toggle(id0);
    const b = {f: S.flagged().slice(), is: S.isFlagged(id0), nowhere: S.set('sct-nowhere-id', true), kept: Object.keys(X.DB().flags)};
    S.set(id1, false);
    check(a.f.length === 2 && a.db.join() === [id0, id1].sort().join() && a.is && b.f.join() === id1 && !b.is && b.nowhere === false && !b.kept.includes('sct-nowhere-id'),
      'flags are set, toggled and cleared in the progress (DB.flags); an id the bank does not have is refused', {a, b});
  } else L.skip('flags are set, toggled and cleared in the progress', 'the course sets flags: false');
  const up = [X.upgradeDB({v: 2, flags: ['x'], layout: 'grid'}), X.upgradeDB({v: 2, flags: {[id0]: 5}, layout: 'all'})];
  const up2 = X.upgradeDB({v: 2});
  check(!('flags' in up[0]) && !('layout' in up[0]) && !('flags' in up2) && !('layout' in up2) && up[1].flags[id0] === 5 && up[1].layout === 'all',
    'a saved progress with flags or a layout of another shape loses that field on load; a good one is kept, and one without them is left as saved', up.map(d => ({flags: d.flags, layout: d.layout})));
  const own = {prof: X.COURSE.professors[0], skill: X.COURSE.skills[0].id};

  console.log('\n=== on a scratch copy with Intro to Pharmacology\'s questions (Chromium) ===');
  const dir = __dirname;
  const s = L.scratchBuild('sc', {files: fixtureFiles(own), courseLine: L.featureOn(dir, {flags: true, layout: true, keys: true, strict: true, strictNote: NOTE})});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').pop());
  const s2 = L.scratchBuild('sc-off', {files: fixtureFiles(own), courseLine: L.featureOn(dir, {flags: false, layout: false, keys: false, strict: false})});
  const ids = IP.map(q => pre(q.id)), single = IP.filter(q => !q.multi).map(q => pre(q.id)), multi = IP.filter(q => q.multi).map(q => pre(q.id));
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1000, height: 900}});
    const ev = (f, a) => page.evaluate(f, a);
    const settle = () => page.waitForTimeout(60);
    const goTab = async v => { await page.click(`#nav button[data-v="${v}"]`); await settle(); };
    // the letter of the right option of the question on screen
    const rightKey = () => ev(() => 'abcdefghij'[Q.order.findIndex(oi => Q.current.options[oi].correct)]);

    /* ---- flags ---- */
    const p0 = await ev(() => ({row: !!document.getElementById('scRow'), keys: Object.keys(DB).filter(k => k === 'flags' || k === 'layout')}));
    check(p0.row && !p0.keys.length, 'Topics shows the row, and the progress gains no field before a flag or a layout is chosen', p0);
    await L.quizOn(page, single.slice(0, 3)); await settle();
    const f0 = await ev(() => Q.current.id);
    await page.click('#v-quiz .qcard .qhead [data-scflag]'); await settle();
    const fb = await ev(id => ({db: !!(DB.flags || {})[id], b: document.querySelector('#v-quiz [data-scflag]').textContent, p: document.querySelector('#v-quiz [data-scflag]').getAttribute('aria-pressed')}), f0);
    check(fb.db && /Flagged/.test(fb.b) && fb.p === 'true', 'Flag on the quiz card flags the question and the button says Flagged', fb);
    await page.keyboard.press(await rightKey()); await settle();
    const k1 = await ev(() => Q.revealed);
    await page.keyboard.press('Enter'); await settle();
    const k2 = await ev(id => ({moved: Q.current && Q.current.id !== id, flagged: !!(DB.flags || {})[id]}), f0);
    check(k1 && k2.moved && k2.flagged, 'after a mouse click on Flag, a letter key answers and Enter moves on; Enter does not unflag', {k1, k2});
    await goTab('topics');
    const t1 = await ev(() => ({n: (document.getElementById('scFlagN') || {}).textContent, drill: !!document.getElementById('scDrillFlag'), clear: !!document.getElementById('scClearFlag')}));
    check(t1.n === '1' && t1.drill && t1.clear, 'Topics shows the flagged count with Drill flagged and Clear flags', t1);
    await ev(id => FX.api('study-controls').set(id, true), single[3]);
    await page.click('#scDrillFlag'); await settle();
    const t2 = await ev(() => ({view: VIEW, pool: Q.pool.map(q => q.id).sort(), label: Q.label}));
    check(t2.view === 'quiz' && t2.pool.join() === [f0, single[3]].sort().join(), 'Drill flagged drills exactly the flagged questions', t2);
    await page.waitForTimeout(400);
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); await settle();
    const t3 = await ev(() => Object.keys(DB.flags || {}).sort());
    check(t3.join() === [f0, single[3]].sort().join(), 'the flags are kept through a reload', t3);

    /* ---- keys ---- */
    await L.quizOn(page, single.slice(0, 3)); await settle();
    await ev(() => document.querySelector('#nav button').focus());
    await page.keyboard.press(await rightKey()); await settle();
    const k3 = await ev(() => ({rev: Q.revealed, ok: Q.lastRight}));
    await page.keyboard.press('2'); await settle();
    const k4 = await ev(() => { const a = DB.answers[DB.answers.length - 1]; return {conf: a.conf, result: a.result, i: Q.i}; });
    await page.keyboard.press(await rightKey()); await settle();
    await page.keyboard.press('3'); await settle();
    const k5 = await ev(() => { const a = DB.answers[DB.answers.length - 1]; return {result: a.result, i: Q.i}; });
    check(k3.rev && k3.ok, 'a letter key picks an option while a tab button has focus', k3);
    check(k4.conf === 'shaky' && k4.result === 'correct' && k4.i === 2, 'after a right answer 2 records Not sure and moves on', k4);
    check(k5.result === 'guessed' && k5.i === 3, 'after a right answer 3 records I guessed and moves on', k5);
    await L.quizOn(page, [multi[0]]); await settle();
    await ev(() => document.activeElement && document.activeElement.blur());   // Enter on a focused tab button keeps its own meaning
    await page.keyboard.press('1'); await settle();
    const k6 = await ev(() => ({picked: (Q.picked || []).length, rev: Q.revealed}));
    await page.keyboard.press('Enter'); await settle();
    const k7 = await ev(() => Q.revealed);
    check(k6.picked === 1 && !k6.rev && k7, 'on a select-all item 1 ticks an option and Enter checks', {k6, k7});
    await L.quizOn(page, [single[0]]); await settle();
    await ev(() => { const i = document.createElement('input'); i.id = 'scTypeHere'; document.getElementById('v-quiz').prepend(i); i.focus(); });
    await page.keyboard.press('a'); await settle();
    check(!(await ev(() => Q.revealed)), 'a key typed in a field is not a shortcut');

    /* ---- the quiz on one page ---- */
    await L.quizOn(page, ids); await settle();
    await page.click('#v-quiz [data-sclayout="all"]'); await settle();
    const a1 = await ev(() => ({cards: document.querySelectorAll('#v-quiz .scq').length, layout: DB.layout}));
    check(a1.cards === ids.length && a1.layout === 'all', `All on one page shows every question of the set (${ids.length} cards)`, a1);
    const n0 = await ev(() => DB.answers.length);
    await ev(id => document.querySelector(`#v-quiz .scq[data-scq="${id}"] [data-sco]`).click(), single[0]); await settle();
    await ev(id => document.querySelector(`#v-quiz .scq[data-scq="${id}"] [data-sco]`).click(), single[1]); await settle();
    const a2 = await ev(([x, y]) => ({n: DB.answers.length, count: document.getElementById('scAllCount').textContent,
      downX: !!document.querySelector(`#v-quiz .scq[data-scq="${x}"] [data-scdown], #v-quiz .scq[data-scq="${x}"] [data-scsure]`),
      downY: !!document.querySelector(`#v-quiz .scq[data-scq="${y}"] [data-scdown], #v-quiz .scq[data-scq="${y}"] [data-scsure]`),
      verdict: !!document.querySelector(`#v-quiz .scq[data-scq="${x}"] .verdict`)}), [single[0], single[1]]);
    check(a2.n === n0 + 2 && /2 of 6 answered/.test(a2.count) && a2.verdict, 'each answer on the page is graded and recorded once (2 answers, count "2 of 6 answered")', a2);
    check(!a2.downX && a2.downY, 'the confidence buttons are on the card answered last only', a2);
    await ev(id => { const c = document.querySelector(`#v-quiz .scq[data-scq="${id}"]`); c.querySelector('[data-sco]').click(); }, multi[0]); await settle();
    await ev(id => document.querySelector(`#v-quiz [data-sccheck="${id}"]`).click(), multi[0]); await settle();
    const a3 = await ev(id => ({n: DB.answers.length, last: DB.answers[DB.answers.length - 1].qid, v: !!document.querySelector(`#v-quiz .scq[data-scq="${id}"] .verdict`)}), multi[0]);
    check(a3.n === n0 + 3 && a3.last === multi[0] && a3.v, 'a select-all card on the page ticks, then Check grades and records it', a3);
    const ok1 = await ev(id => { const c = document.querySelector(`#v-quiz .scq[data-scq="${id}"]`); return !!c.querySelector('[data-scdown="unsure"]'); }, multi[0]);
    if(ok1){
      await ev(id => document.querySelector(`#v-quiz .scq[data-scq="${id}"] [data-scdown="unsure"]`).click(), multi[0]); await settle();
      check(await ev(() => DB.answers[DB.answers.length - 1].conf === 'shaky'), 'Not sure on the page records the answer as not sure');
    } else {
      await ev(id => { const b = document.querySelector(`#v-quiz .scq[data-scq="${id}"] [data-scsure]`); if(b) b.click(); }, multi[0]); await settle();
      check(await ev(() => DB.answers[DB.answers.length - 1].conf === 'sure'), 'I was sure of that on the page records the miss as sure');
    }
    await page.waitForTimeout(400);
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); await settle();
    check(await ev(() => DB.layout === 'all'), 'the layout is kept through a reload');
    await L.quizOn(page, ids); await settle();
    const done = [single[0], single[1]];
    for(const id of done) await ev(i => document.querySelector(`#v-quiz .scq[data-scq="${i}"] [data-sco]`).click(), id);
    await settle();
    await page.click('#v-quiz [data-sclayout="one"]'); await settle();
    const a4 = await ev(d => ({one: !!document.querySelector('#v-quiz > .qcard'), cur: Q.current && Q.current.id, rest: Q.sweep.slice(Q.i), again: Q.sweep.slice(Q.i).filter(x => d.includes(x))}), done);
    check(a4.one && !done.includes(a4.cur) && !a4.again.length, 'back to one at a time, the questions answered on the page are not asked again', a4);

    /* ---- the exam paper, one at a time: flags and keys ---- */
    await goTab('exam');
    const x0 = await ev(() => ({box: !!document.getElementById('scStrict'), note: (document.querySelector('.scstart') || {}).textContent || '', chips: !!document.querySelector('.scstart [data-sclayout]')}));
    check(x0.box && x0.note.includes(NOTE) && x0.chips, 'the exam start page has the layout chips and the strict-paper box with the course\'s note', x0);
    await page.click('.scstart [data-sclayout="one"]'); await settle();
    await page.click('#startExam'); await settle();
    const nq = await ev(() => EX.qs.length);
    if(nq < 2) L.skip('the paper\'s flags and keys', 'the paper has fewer than 2 questions');
    else {
      await page.keyboard.press('a'); await settle();
      const x1 = await ev(() => EX.picks[0] !== null && !(Array.isArray(EX.picks[0]) && !EX.picks[0].length));
      await page.keyboard.press('ArrowRight'); await settle();
      const x2 = await ev(() => EX.i);
      await page.keyboard.press('ArrowLeft'); await settle();
      const x3 = await ev(() => EX.i);
      check(x1 && x2 === 1 && x3 === 0, 'on the paper a letter picks, the right arrow moves on and the left arrow back', {x1, x2, x3});
      await page.click('#v-exam .qcard .qhead [data-scflag]'); await settle();
      await page.click('#exNext'); await settle();
      const x4 = await ev(() => ({links: [...document.querySelectorAll('#v-exam .scxflags [data-scjump]')].map(b => b.textContent), i: EX.i}));
      await page.click('#v-exam .scxflags [data-scjump="0"]'); await settle();
      const x5 = await ev(() => EX.i);
      check(x4.links.join() === '1' && x4.i === 1 && x5 === 0, 'a flagged question is listed by number on the paper\'s bar and its link moves to it', {x4, x5});
    }

    /* ---- the exam paper on one page ---- */
    await page.click('#v-exam .examhead [data-sclayout="all"]'); await settle();
    const p1 = await ev(() => ({cards: document.querySelectorAll('#v-exam .scxq').length, n: EX.qs.length, clock: document.getElementById('exClock').textContent}));
    await page.waitForTimeout(2200);   // the clock shows whole seconds, so two ticks
    const c2 = await ev(() => document.getElementById('exClock').textContent);
    check(p1.cards === p1.n && /^\d\d:\d\d$/.test(p1.clock) && c2 !== p1.clock, `All on one page shows every question of the paper (${p1.n}) with its clock running`, {p1, c2});
    await ev(() => document.querySelector('#v-exam [data-scxk="1"]').click()); await settle();
    const p2 = await ev(() => ({pick: EX.picks[1], saved: JSON.parse(store.get(EXAM_KEY())).picks[1]}));
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await goTab('exam');
    const p3 = await ev(() => ({cards: document.querySelectorAll('#v-exam .scxq').length, pick: EX.picks[1]}));
    check(JSON.stringify(p2.pick) === JSON.stringify(p2.saved) && p2.pick !== null && JSON.stringify(p3.pick) === JSON.stringify(p2.pick) && p3.cards === p1.n,
      'a pick on the one-page paper is saved and the paper comes back on one page after a reload', {p2, p3});
    await ev(() => window.scrollTo(0, document.body.scrollHeight)); await settle();
    const p4 = await ev(() => { const r = document.querySelector('#v-exam .scxhead').getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight}; });
    check(p4.top >= 0 && p4.bottom < p4.h, 'at the bottom of the one-page paper the bar with the clock is in view', p4);
    await page.click('#scxSubmit2'); await settle();
    const p5 = await ev(() => ({done: !!(EX && EX.done), h2: (document.querySelector('#v-exam h2') || {}).textContent || '', flags: document.querySelectorAll('#v-exam > .qcard [data-scflag]').length, n: EX.qs.length}));
    check(p5.done && /Exam simulation/.test(p5.h2) && p5.flags === p5.n, 'Submit on the one-page paper gives the result page, with a Flag on every question', p5);
    await page.click('#v-exam > .qcard [data-scflag]'); await settle();
    check(/Exam simulation/.test(await ev(() => (document.querySelector('#v-exam h2') || {}).textContent || '')), 'a flag on the exam result keeps the result page');

    /* ---- the strict paper ---- */
    await page.click('#exAgain'); await settle();
    await page.check('#scStrict');
    await page.click('#startExam'); await settle();
    const r1 = await ev(() => ({layout: DB.layout, all: !!document.querySelector('#v-exam .scxall'), prev: !!document.getElementById('exPrev'), note: !!document.querySelector('.scnoback'),
      flag: !!document.querySelector('#v-exam [data-scflag]'), chips: !!document.querySelector('#v-exam [data-sclayout]'), strict: FX.api('study-controls').strictPaper()}));
    check(r1.layout === 'all' && !r1.all && !r1.prev && r1.note && !r1.flag && !r1.chips && r1.strict,
      'a strict paper is one question at a time with no Back, no flags and no layout chips (with All on one page chosen)', r1);
    await ev(() => { window.confirm = () => false; });
    await page.click('#exNext'); await settle();
    const r2 = await ev(() => EX.i);
    await ev(() => { window.confirm = () => true; });
    await page.click('#exNext'); await settle();
    const r3 = await ev(() => EX.i);
    await page.keyboard.press('ArrowLeft'); await settle();
    const r4 = await ev(() => EX.i);
    check(r2 === 0 && r3 === 1 && r4 === 1, 'on a strict paper Next on a blank question asks first (Cancel stays, OK moves on), and the left arrow does nothing', {r2, r3, r4});
    await page.waitForTimeout(300);
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await goTab('exam');
    const r5 = await ev(() => ({run: !!(EX && EX.running), prev: !!document.getElementById('exPrev'), all: !!document.querySelector('#v-exam .scxall'), i: EX && EX.i}));
    check(r5.run && !r5.prev && !r5.all && r5.i === 1, 'the strict paper stays strict through a reload', r5);
    await ev(() => finishExam(true)); await settle();
    await page.click('#exAgain'); await settle();
    await page.uncheck('#scStrict');
    await page.click('.scstart [data-sclayout="one"]'); await settle();
    await page.click('#startExam'); await settle();
    const r6 = await ev(() => ({prev: !!document.getElementById('exPrev'), strict: FX.api('study-controls').strictPaper(), flag: !!document.querySelector('#v-exam [data-scflag]')}));
    check(r6.prev && !r6.strict && r6.flag, 'the next paper started without the box has Back and flags again', r6);
    await ev(() => finishExam(true));

    /* ---- clear flags ---- */
    await goTab('topics');
    await page.click('#scClearFlag'); await settle();
    const c1 = await ev(() => ({db: Object.keys(DB.flags || {}).length, n: (document.getElementById('scFlagN') || {}).textContent}));
    check(c1.db === 0 && c1.n === '0', 'Clear flags removes every flag', c1);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    check(!(await ev(() => FX.errors.length)), 'no module error (FX.errors)', await ev(() => FX.errors));
    await ctx.close();

    /* ---- every option off ---- */
    if(s2.code !== 0) check(false, 'the copy with every option off builds', s2.out.split('\n').pop());
    else {
      const b = await L.openPage(browser, s2.page, {viewport: {width: 1000, height: 900}});
      await b.page.waitForTimeout(60);
      const o1 = await b.page.evaluate(() => ({row: !!document.getElementById('scRow')}));
      await L.quizOn(b.page, [single[0]]); await b.page.waitForTimeout(60);
      await b.page.keyboard.press('a'); await b.page.waitForTimeout(60);
      const o2 = await b.page.evaluate(() => ({flag: !!document.querySelector('[data-scflag]'), chips: !!document.querySelector('[data-sclayout]'), kbd: !!document.querySelector('.sckbd'), rev: Q.revealed}));
      await b.page.click('#nav button[data-v="exam"]'); await b.page.waitForTimeout(60);
      const o3 = await b.page.evaluate(() => ({box: !!document.getElementById('scStrict'), chips: !!document.querySelector('[data-sclayout]')}));
      check(!o1.row && !o2.flag && !o2.chips && !o2.kbd && !o2.rev && !o3.box && !o3.chips, 'with every option off: no Flag, no layout chips, no strict box, and the letter keys do nothing', {o1, o2, o3});
      check(!b.errors.length, 'no page error with every option off', b.errors.slice(0, 3).join(' | '));
      await b.ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); s2.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
