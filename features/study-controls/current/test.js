/* study-controls: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * In node, on the course's own page: the flags are set, cleared and kept in the
 * progress (DB.flags), an id the bank does not have is refused, and a saved
 * progress with flags or a layout of another shape loses that field on load,
 * while a saved progress without them is read back exactly as saved.
 * On a scratch copy with Intro to Pharmacology's Day 1 topic, its lecture and 6 of
 * its questions (FIX below, verbatim from exam1-drill/src at 929cd62: 4 single-answer,
 * 2 select-all; the professor set to the course's own; the course's own copy when
 * ci/oncourse.js wrote it), in Chromium, with
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
 *   keys where the student is doing something else do nothing: typing in a
 *   textarea or a contenteditable, a modal <dialog> open, a panel marked as a
 *   dialog open (the shape of worksheets-ink's Scratch paper) over the quiz and
 *   over the paper, the pointer held down drawing on a canvas (and after it lifts
 *   the letter answers again), and the Import file picker open.
 *   one page: every multiple-choice question of the set on one page; one answer
 *   there records one answer; Not sure is offered on the card answered last only;
 *   back to one at a time, the questions answered on the page are not asked
 *   again; the choice is kept through a reload; the exam paper on one page with
 *   its clock running, a pick saved and kept through a reload, the bar with the
 *   clock in view at the bottom of the page, Submit giving the result page.
 *   strict: the box on the start page with the course's note; a strict paper has
 *   no Back, no flags and no one-page layout, the left arrow does nothing, Next
 *   on a blank question asks first and stays when the answer is Cancel, the
 *   paper stays strict through a reload, the browser Back button leaves the drill
 *   and Forward brings the paper back at the same question with no Back, the left
 *   arrow pressed while the native "Move on without answering?" box is open does
 *   nothing, the ticked box stays ticked when the start page is drawn again, and
 *   the next paper started without the box has Back again.
 *   with paper-picker on (skipped otherwise): on a paper drawn for an earlier exam,
 *   the flags bar and its links, and the strict paper (no Back, no flags, the left
 *   arrow does nothing, strict through a reload).
 * On a copy with every option off: no Flag, no layout chips, no strict box, and
 * the letter keys do nothing.
 * On a copy with 300 more questions (50 copies of the 6, ids suffixed) and
 * calculations on the paper (exams[].typed, drawn from the course's other topics): 300 flags and the layout kept through
 * a reload, Drill flagged 40 to a page; a reload at once after a flag is reported
 * (the core saves 150 ms after the last change), one 300 ms after is kept; Export
 * and Import into a fresh profile; each profile keeps its own; storage denied and
 * storage full (QuotaExceededError): the notice shows, the saved progress is not
 * overwritten, and it loads after storage works again; a paper with a calculation
 * stays one at a time with All on one page chosen.
 *
 *     node features/study-controls/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/study-controls/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* The course data of this test and of ../ci/oncourse.js, verbatim from Intro-Pharmacology-
   exam1-drill/src at 929cd62: the Day 1 topic (q_L01.js line 1), its lecture (course.js
   `lectures`, id L01), 6 of its questions (q_L01.js: L01-002, -004, -005, -006 single-answer;
   L01-003, -007 select-all) and the professor's 10/21 answer on going back to a question
   (app.js line 678), the strict-paper note; every `prof` the source's own. WRITE below says how
   it is written into a course. */
const FIX = {
  topic: {"id":"L01","name":"Day 1: drugs, receptors, potency","prof":"Gottlieb","lecture":"L01","cite":"Day 1 (9/22) — Pharmacodynamics-Day-1-2026s.pdf","subs":[{"id":"intro","name":"Must know vs should know","cite":"slides ~7–~12"},{"id":"nds","name":"Drug discovery and supplements","cite":"slides ~13–~20"},{"id":"potency","name":"Affinity, efficacy and potency","cite":"slides ~21–~27, ~37–~38"},{"id":"theory","name":"Receptor theories and the two-state model","cite":"slides ~28–~29"},{"id":"drugs","name":"Drugs, selectivity and drug classes","cite":"slides ~29–~33"},{"id":"receptors","name":"Receptor classes","cite":"slides ~34–~36"},{"id":"ion","name":"Ion channels","cite":"slides ~39–~48"},{"id":"gpcr","name":"G protein–coupled receptors","cite":"slides ~49–~55"}]},
  lecture: {"id":"L01","deck":"Pharmacodynamics-Day-1-2026s.pdf","label":"Day 1 (9/22): Course intro, drugs & receptors","prof":"Gottlieb","exam":1,"module":1},
  strictNote: "10/21 (asked whether you can go back to a question): \"No, there will not, yeah, no backwards nav, OK, yes.\"",
  qs: [
    {"id":"L01-002","lecture":"L01","prof":"Gottlieb","tier":"new","topic":"L01","sub":"intro","skill":"apply","concept":"metoprolol-predict-effect","tags":["metoprolol","beta1"],"source":"both","stem":"What effect would metoprolol have on heart rate?","options":[{"t":"Slower heart rate","correct":true,"why":"Blocking the heart’s β1 receptors slows the heart rate; this is the prediction he asked the class to make."},{"t":"Faster heart rate","correct":false,"why":"Treats an antagonist as if it were an agonist at β1."},{"t":"No change in heart rate","correct":false,"why":"Ignores that the blocked receptor is located in the heart."},{"t":"Increased urination","correct":false,"why":"Confuses the β1 blocker with the thiazide diuretic example."}],"teach":"If you know the mechanism of action (β1-selective antagonist) and the site of action (β1 receptors in the heart), the effect follows: the heart rate slows. The same reasoning predicts side effects such as bradycardia.","quote":"If I give you metoprolol, which is a beta 1 selective antagonist, and beta ones are in the heart, what kind of effect is it going to produce? ... Slow down the heart rate.","reading":[{"src":"Katzung 16e, Ch. 6","sec":"Table 6–2 Major autonomic receptor types; Table 6–5","t":"β1 adrenoceptors are located especially in the heart, where sympathetic activity accelerates the sinoatrial node through them. A β-blocker binds β receptors and prevents their activation, removing that acceleration."}],"cite":"Pharmacodynamics-Day-1-2026s.pdf slide ~9; transcript 9/22"},
    {"id":"L01-004","lecture":"L01","prof":"Gottlieb","tier":"new","topic":"L01","sub":"intro","skill":"recall","concept":"drugs-alter-ongoing-system","tags":["definition","poll"],"source":"both","stem":"Which statement is CORRECT about what drugs do to a biological system?","options":[{"t":"Drugs alter an ongoing physiological or pathological function","correct":true,"why":"Drugs change an ongoing physiological or pathological function; they initiate, inhibit or modulate."},{"t":"Drugs create a new physiological pathway in the body","correct":false,"why":"He states drugs do not create anything new."},{"t":"Drugs can only block receptors","correct":false,"why":"Drugs can also initiate or modulate a signal."},{"t":"Drugs can only mimic hormones and neurotransmitters the body already makes","correct":false,"why":"Some drugs mimic body products; others are unique. Either way they alter an existing system."},{"t":"All of the above","correct":false,"why":"Only the first statement is correct; drugs do not create new pathways, and they can initiate or modulate as well as block."}],"teach":"Drugs are chemical substances that alter an ongoing physiological or pathological function by interacting with components of the biological system. They can initiate, inhibit or modulate a signal, but they do not create a new pathway.","quote":"drugs don’t create anything new, they just change whatever is happening in the body.","reading":[{"src":"Katzung 16e, Ch. 1","sec":"The Nature of Drugs; Pharmacology (opening definition)","t":"A drug is any substance that brings about a change in biologic function through its chemical actions. In most cases the drug molecule acts as an agonist or antagonist on a target molecule that already plays a regulatory role in the biologic system."}],"cite":"Pharmacodynamics-Day-1-2026s.pdf slides ~11, ~31; transcript 9/22"},
    {"id":"L01-005","lecture":"L01","prof":"Gottlieb","tier":"new","topic":"L01","sub":"intro","skill":"recall","concept":"receptor-message-physiological-response","tags":["receptor"],"source":"both","stem":"Norepinephrine binds β1 receptors and cardiac output increases. In receptor terms, what is the increase in cardiac output?","options":[{"t":"The physiological response","correct":true,"why":"The message a drug–receptor interaction creates is seen as the physiological response."},{"t":"The affinity of norepinephrine for β1","correct":false,"why":"Affinity is how well the drug binds, not the response produced."},{"t":"The site of action","correct":false,"why":"The site of action is where the receptor is (the heart), not the response."},{"t":"The apparent potency","correct":false,"why":"Apparent potency concerns how much drug reaches the site; it is not the response itself."}],"teach":"Receptors sense signals such as hormones, neurotransmitters and drugs. The message the receptor creates after binding is what we observe as the physiological response, for example increased cardiac output when norepinephrine binds β1.","quote":"the message that a drug receptor interaction creates is what we see as a physiological response ... norepinephrine to the beta 1 receptor increases your cardiac output. That’s the physiological response.","reading":[{"src":"Katzung 16e, Ch. 1","sec":"Pharmacodynamic Principles","t":"Drug binding is only the first step: the drug–receptor complex acts through coupling and effector molecules, and the final change in function is accomplished by that effector mechanism. The rise in cardiac output is that altered function, the effect, not the binding itself."}],"cite":"Pharmacodynamics-Day-1-2026s.pdf slide ~11; transcript 9/22"},
    {"id":"L01-006","lecture":"L01","prof":"Gottlieb","tier":"new","topic":"L01","sub":"nds","skill":"apply","concept":"curare-not-absorbed","tags":["curare","absorption"],"source":"both","stem":"Curare (Strychnos toxifera) is a very large, positively charged molecule used as a paralytic agent. Why does eating the plant produce no effect?","options":[{"t":"It cannot be absorbed","correct":true,"why":"A large, charged molecule is not absorbed, so eating it does nothing."},{"t":"It has no affinity","correct":false,"why":"Curare paralyzes fish through the gills, so it does act once it reaches its target."},{"t":"It is a partial agonist","correct":false,"why":"Its lack of oral effect is about absorption, not intrinsic activity."},{"t":"Stomach acid adds a charge","correct":false,"why":"The charge is a property of the molecule itself."}],"teach":"Curare is a large molecule with a positive charge, so it is not absorbed when eaten. It was discovered when fish, whose gills are outside the body, became paralyzed and floated up. It was later used as a paralyzing agent for surgery.","quote":"What does that tell you to be large and have a charge to it, positive or negative? You can’t absorb, right?","reading":[{"src":"Katzung 16e, Ch. 1","sec":"Drug Size; Ionization of Weak Acids and Weak Bases","t":"Molecules much larger than about 1000 molecular weight do not diffuse readily between body compartments. The charge of an ionized molecule makes it water-soluble and lipid-insoluble, so a permanently charged molecule permeates membranes poorly."}],"cite":"Pharmacodynamics-Day-1-2026s.pdf slide ~14; transcript 9/22"},
    {"id":"L01-003","lecture":"L01","prof":"Gottlieb","tier":"new","topic":"L01","sub":"intro","skill":"apply","multi":true,"concept":"metoprolol-predict-adr","tags":["metoprolol","adr"],"source":"both","stem":"Which adverse drug reactions (ADRs) would metoprolol be expected to produce? Select all that apply.","options":[{"t":"Bradycardia","correct":true,"why":"Blocking β1 in the heart can slow it too much; bradycardia is listed as an ADR."},{"t":"Fatigue","correct":true,"why":"Fatigue is listed as an ADR and he ties it to β1 receptors in the brain."},{"t":"Tachycardia","correct":false,"why":"A β1 antagonist slows the heart; tachycardia reverses the effect."},{"t":"Hyponatremia","correct":false,"why":"Hyponatremia was the thiazide diuretic example, from losing sodium."}],"teach":"Metoprolol blocks β1 receptors. In the heart that slows the rate, and too much slowing is bradycardia. β1 receptors are also in the brain, which he links to fatigue and patients forgetting things.","quote":"severe bradycardia that can be a side effect if you get to the brain or the beta ones are as well, it may cause fatigue. Patients may forget things.","reading":[{"src":"Katzung 16e, Ch. 6","sec":"Table 6–2 Major autonomic receptor types","t":"β1 adrenoceptors are on postsynaptic effector cells, especially heart, lipocytes and brain. Because the sinoatrial node is accelerated through β1 receptors, blocking them slows the heart, and slowing it too far is bradycardia."}],"cite":"Pharmacodynamics-Day-1-2026s.pdf slide ~9; transcript 9/22"},
    {"id":"L01-007","lecture":"L01","prof":"Gottlieb","tier":"new","topic":"L01","sub":"nds","skill":"recall","multi":true,"concept":"nds-regulation","tags":["nds"],"source":"both","stem":"Which statements about natural dietary supplements (NDS) are correct? Select all that apply.","options":[{"t":"They are regulated as food","correct":true,"why":"NDS are regulated as food, not as drugs."},{"t":"They have less FDA oversight","correct":true,"why":"Because they are not drugs, the FDA oversees them less; they stay on the market until they cause harm."},{"t":"Labels cannot claim they cure","correct":true,"why":"Labels cannot state that the product treats, cures, diagnoses or prevents a disease."},{"t":"They are tested like Rx drugs","correct":false,"why":"The label states the claims have not been evaluated by the FDA."},{"t":"Being natural makes them safe","correct":false,"why":"He answered this with cyanide and lead: natural does not mean safe."}],"teach":"NDS are regulated as food, so they receive less FDA oversight and remain on the market until they cause harm. Their labels cannot claim to treat, cure, diagnose or prevent disease. Natural does not mean safe.","quote":"when we look at natural dietary supplements, they are treated as food, which means they have less oversight by the FDA. Which means that until they cause harm, they’re still in the market","reading":[{"src":"Katzung 16e, Ch. 1","sec":"Table 1–6 Some major legislation pertaining to drugs in the USA; The History of Pharmacology","t":"Under the Dietary Supplement Health and Education Act, supplements are part of the food supply and are not fully reviewed by the FDA as drugs. All substances can be toxic, and botanical chemicals are no different from manufactured drug chemicals except for more impurities."}],"cite":"Pharmacodynamics-Day-1-2026s.pdf slides ~15–~16; transcript 9/22"}
  ]};
const NOTE = FIX.strictNote;

/* How FIX is written into a course, as a question file in the kit's form: one question per line,
   opening {id:'...', skill:'...', prof:'...' (browser_test.js counts the bank that way), in a topic
   of its own after the course's topics. Each question, the topic and the lecture keep their own
   `prof`, and the professors FIX names are added to COURSE.professors when the course lacks them.
   own = {skills, lectures} of the course: a question's own skill is kept when the course has it
   (the template has both of FIX's, recall and apply), else the course's first skill. The source's `lecture` field
   (the source's lecture id) is left out: the kit finds a question's lecture from the deck its
   `cite` names. The topic keeps the subtopics FIX's questions are in (intro, nds). The lecture
   (L01 in the source) is added under the first id from L91 on that the course's lectures do not
   use (L91 on the template, which has its own L01; other modules' data may already hold L91 or
   L92: CIDATA rule 2), unless the course already has its deck.
   opt.base writes the topic and the 6 questions; opt.copies writes that many more copies of the 6
   (ids and concepts suffixed -c<n>, content unchanged; test pages only). ../ci/oncourse.js reads
   FIX and WRITE from this file, so the CI course and the test's copies hold the same data. */
const WRITE = (fix, own, opt) => {
  const lit = v => { if(!/^[^'\\\n]*$/.test(String(v))) throw new Error('cannot be written as a literal: ' + v); return `'${v}'`; };
  const skill = q => own.skills.includes(q.skill) ? q.skill : own.skills[0];
  const row = (q, c) => { const r = Object.assign({}, q); ['id', 'skill', 'prof', 'lecture'].forEach(k => delete r[k]);
    if(c) r.concept = q.concept + c;
    return `{id:${lit(q.id + c)}, skill:${lit(skill(q))}, prof:${lit(q.prof)}, ${JSON.stringify(r).slice(1)},`; };
  const topic = Object.assign({}, fix.topic, {subs: fix.topic.subs.filter(t => fix.qs.some(q => q.sub === t.id))});
  delete topic.lecture;
  const rows = [];
  if(opt.base) fix.qs.forEach(q => rows.push(row(q, '')));
  for(let c = 1; c <= (opt.copies || 0); c++) fix.qs.forEach(q => rows.push(row(q, '-c' + c)));
  let body = `/* study-controls: Intro to Pharmacology's Day 1 topic and 6 of its questions (exam1-drill/src/q_L01.js,\n   929cd62)${opt.copies ? `, ${opt.copies} copies of the 6 (ids suffixed -c<n>)` : ''}; written from FIX in features/study-controls/test.js */\n`;
  const profs = [...new Set(fix.qs.map(q => q.prof).concat([fix.topic.prof, fix.lecture.prof]))];
  body += `${JSON.stringify(profs)}.forEach(n => { if(!COURSE.professors.includes(n)) COURSE.professors.push(n); });\n`;
  if(opt.base) body += `TOPICS.push(${JSON.stringify(topic)});\n`;
  if(rows.length) body += `QUESTIONS.push(\n${rows.join('\n')}\n);\n`;
  const l = fix.lecture;
  const usedIds = new Set((own.lectures || []).map(x => String(x.id)));
  let n = 91; while(usedIds.has('L' + n)) n++;
  const lectureId = 'L' + n;
  const lecture = (own.lectures || []).some(x => x.deck === l.deck) ? '' :
    `{id:${lit(lectureId)}, deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(l.prof)}, exam:${JSON.stringify(l.exam)}, module:${JSON.stringify(l.module)}}`;
  return {body, lecture, lectureId: lecture ? lectureId : '', rows: rows.length};
  };

/* The test's scratch copies: the course's own copy of FIX when it has one (a course made by
   ../ci/oncourse.js), else FIX written in; `copies` more copies for the persistence checks. */
function fixtureFiles(own, have, copies){
  const w = WRITE(FIX, own, {base: !have, copies});
  const files = w.rows ? {[have ? 'q91_sc_copies.js' : 'q90_sc_fixture.js']: w.body} : {};
  return {files, line: w.lecture ? `COURSE.lectures = (COURSE.lectures || []).concat([${w.lecture}]);` : ''};
}

(async () => {
  console.log('\n=== the course\'s own page (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX: typeof FX === "undefined" ? null : FX, DB: () => DB, upgradeDB, QUESTIONS, TOPICS, COURSE})');
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
  const own = {prof: X.COURSE.professors[0], skills: X.COURSE.skills.map(k => k.id), lectures: X.COURSE.lectures};
  // a course made by ci/oncourse.js has FIX already: the copies use the course's own
  const have = FIX.qs.every(q => X.QUESTIONS.some(x => x.id === q.id));
  const otherTopics = X.TOPICS.map(t => t.id).filter(t => t !== FIX.topic.id);

  console.log('\n=== on a scratch copy with Intro to Pharmacology\'s questions (Chromium) ===');
  const dir = __dirname;
  const f1 = fixtureFiles(own, have), f3 = fixtureFiles(own, have, 50);
  const s = L.scratchBuild('sc', {files: f1.files, courseLine: f1.line + L.featureOn(dir, {flags: true, layout: true, keys: true, strict: true, strictNote: NOTE})});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').pop());
  const s2 = L.scratchBuild('sc-off', {files: f1.files, courseLine: f1.line + L.featureOn(dir, {flags: false, layout: false, keys: false, strict: false})});
  const COPIES = 50;   // 300 more questions, for hundreds of flags (f3 above)
  // calculations on the paper (exams[].typed); the papers drawn from the course's other topics, so the 300 copies do not crowd out its calculations
  const s3 = L.scratchBuild('sc-many', {files: f3.files, courseLine: f3.line + `COURSE.exams.forEach(e => { e.typed = true; e.pools.forEach(p => { p.filter = Object.assign({}, p.filter, {topic: ${JSON.stringify(otherTopics)}}); }); });` + L.featureOn(dir, {flags: true, layout: true, keys: true, strict: true})});
  const ids = FIX.qs.map(q => q.id), single = FIX.qs.filter(q => !q.multi).map(q => q.id), multi = FIX.qs.filter(q => q.multi).map(q => q.id);
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

    /* ---- keys where the student is doing something else ---- */
    const noKey = async (label, setup, keys, undo) => {
      await L.quizOn(page, [single[0]]); await settle();
      const n0 = await ev(() => DB.answers.length);
      await ev(setup);
      for(const k of keys) await page.keyboard.press(k);
      await settle();
      // an answer followed by Enter would move past the only question: the question must still be on screen, unanswered
      const r = await ev(id => ({revealed: Q.revealed, picked: Q.picked, view: VIEW, current: Q.current && Q.current.id === id}), single[0]);
      r.answers = (await ev(() => DB.answers.length)) - n0;
      if(undo) await ev(undo);
      return check(!r.revealed && r.current && !r.answers && (r.picked === null || r.picked === undefined), label, r);
    };
    await noKey('typing in a textarea is not a shortcut (a, Enter)',
      () => { const t = document.createElement('textarea'); t.id = 'scTA'; document.getElementById('v-quiz').prepend(t); t.focus(); }, ['a', 'Enter']);
    await noKey('typing in a contenteditable is not a shortcut (a, 1, Enter)',
      () => { const d = document.createElement('div'); d.contentEditable = 'true'; d.id = 'scCE'; document.getElementById('v-quiz').prepend(d); d.focus(); }, ['a', '1', 'Enter']);
    await noKey('a key pressed while a modal <dialog> is open does not answer the question under it',
      () => { const d = document.createElement('dialog'); d.id = 'scDlg'; d.innerHTML = '<p>a dialog</p>'; document.body.appendChild(d); d.showModal(); }, ['a', 'Enter'],
      () => { const d = document.getElementById('scDlg'); d.close(); d.remove(); });
    // the shape of worksheets-ink's Scratch paper: a panel marked as a dialog, focused, with a canvas on it
    const PANEL = () => { const p = document.createElement('div'); p.id = 'scPanel'; p.setAttribute('role', 'dialog'); p.tabIndex = -1;
      p.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99'; p.innerHTML = '<canvas width="400" height="300" style="width:400px;height:300px"></canvas>';
      document.body.appendChild(p); p.focus(); };
    await noKey('a key pressed while a panel marked as a dialog is open (as Scratch paper) does not answer the question under it', PANEL, ['a', 'Enter'],
      () => document.getElementById('scPanel').remove());
    await L.quizOn(page, [single[0]]); await settle();
    const cvKey = await rightKey();
    await ev(() => { const c = document.createElement('canvas'); c.id = 'scCv'; c.width = 300; c.height = 120; c.style.cssText = 'display:block;width:300px;height:120px';
      document.getElementById('v-quiz').prepend(c); window.scrollTo(0, 0); });
    const cb = await page.locator('#scCv').boundingBox();
    await page.mouse.move(cb.x + 20, cb.y + 20); await page.mouse.down(); await page.mouse.move(cb.x + 90, cb.y + 60);
    const cvN = await ev(() => DB.answers.length);
    await page.keyboard.press(cvKey); await page.keyboard.press('Enter'); await settle();
    const cv1 = await ev(([id, n]) => ({revealed: Q.revealed || !Q.current || Q.current.id !== id || DB.answers.length !== n}), [single[0], cvN]);
    await page.mouse.up(); await settle();
    await ev(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press(cvKey); await settle();
    const cv2 = await ev(() => ({revealed: Q.revealed}));
    await ev(() => { const c = document.getElementById('scCv'); if(c) c.remove(); });   // the answer redraws the card, which can take it away
    check(!cv1.revealed && cv2.revealed, 'no key acts while the pointer is held down drawing on a canvas; after it lifts the letter key answers again', {cv1, cv2});
    await L.quizOn(page, [single[0]]); await settle();
    const fpN = await ev(() => DB.answers.length);
    await goTab('settings');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser', {timeout: 5000}).catch(() => null), page.click('#btnImport')]);
    for(const k of ['a', '1', 'Enter', 'ArrowRight']) await page.keyboard.press(k);
    await settle();
    const fp = await ev(([id, n]) => ({view: VIEW, revealed: Q.revealed, picked: Q.picked, current: !!Q.current && Q.current.id === id, answers: DB.answers.length - n}), [single[0], fpN]);
    check(!!chooser && fp.view === 'settings' && !fp.revealed && fp.current && !fp.answers && (fp.picked === null || fp.picked === undefined),
      'keys pressed while the Import file picker is open do not answer the quiz left open behind it', Object.assign({chooser: !!chooser}, fp));

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
    // the paper can carry the questions flagged above (FIX's questions are in the exam's pools): start with none flagged
    await ev(() => { const S = FX.api('study-controls'); S.flagged().slice().forEach(id => S.set(id, false)); });
    await goTab('exam');
    const x0 = await ev(() => ({box: !!document.getElementById('scStrict'), note: (document.querySelector('.scstart') || {}).textContent || '', chips: !!document.querySelector('.scstart [data-sclayout]')}));
    check(x0.box && x0.note.includes(NOTE) && x0.chips, 'the exam start page has the layout chips and the strict-paper box with the course\'s note', x0);
    await page.click('.scstart [data-sclayout="one"]'); await settle();
    await page.click('#startExam'); await settle();
    // a course with calculations on its papers (exams[].typed): the lettered items first, so the keys below have options to pick
    const toFront = () => ev(() => { const k = EX.qs.map((q, i) => i).sort((a, b) => (EX.qs[a].type ? 1 : 0) - (EX.qs[b].type ? 1 : 0));
      ['qs', 'picks', 'orders'].forEach(f => { EX[f] = k.map(i => EX[f][i]); }); EX.i = 0; saveExam(); renderExamQ(); });
    await toFront(); await settle();
    const nq = await ev(() => EX.qs.filter(q => !q.type).length);
    if(nq < 2) L.skip('the paper\'s flags and keys', 'the paper has fewer than 2 questions');
    else {
      await page.keyboard.press('a'); await settle();
      const x1 = await ev(() => EX.picks[0] !== null && !(Array.isArray(EX.picks[0]) && !EX.picks[0].length));
      await page.keyboard.press('ArrowRight'); await settle();
      const x2 = await ev(() => EX.i);
      await page.keyboard.press('ArrowLeft'); await settle();
      const x3 = await ev(() => EX.i);
      check(x1 && x2 === 1 && x3 === 0, 'on the paper a letter picks, the right arrow moves on and the left arrow back', {x1, x2, x3});
      const xp0 = JSON.stringify(await ev(() => EX.picks[0]));
      await ev(PANEL);
      for(const k of ['ArrowRight', 'Enter', 'b', '2']) await page.keyboard.press(k);
      await settle();
      const xp = await ev(() => ({i: EX.i, pick: JSON.stringify(EX.picks[0]), saved: JSON.parse(store.get(EXAM_KEY())).i}));
      await ev(() => document.getElementById('scPanel').remove());
      check(xp.i === 0 && xp.saved === 0 && xp.pick === xp0,
        'on the paper, keys pressed while a panel marked as a dialog is open neither move the paper nor change the pick', Object.assign({before: xp0}, xp));
      await page.click('#v-exam .qcard .qhead [data-scflag]'); await settle();
      const x3b = await ev(() => [...document.querySelectorAll('#v-exam .scxflags [data-scjump]')].map(b => b.textContent));
      check(x3b.join() === '1', 'a flag on the paper is listed on the question bar at once, before moving on', x3b);
      await page.click('#exNext'); await settle();
      const x4 = await ev(() => ({links: [...document.querySelectorAll('#v-exam .scxflags [data-scjump]')].map(b => b.textContent), i: EX.i}));
      await page.click('#v-exam .scxflags [data-scjump="0"]'); await settle();
      const x5 = await ev(() => EX.i);
      check(x4.links.join() === '1' && x4.i === 1 && x5 === 0, 'a flagged question is listed by number on the paper\'s bar and its link moves to it', {x4, x5});
    }

    /* ---- the exam paper on one page ---- */
    // calculation or matching items stay one at a time (checked on the copy with calculations below): leave them off this paper
    await ev(() => { const k = EX.qs.map((q, i) => i).filter(i => !EX.qs[i].type);
      ['qs', 'picks', 'orders'].forEach(f => { EX[f] = k.map(i => EX[f][i]); }); EX.i = Math.min(EX.i, EX.qs.length - 1); saveExam(); renderExamQ(); });
    await settle();
    await page.click('#v-exam .examhead [data-sclayout="all"]'); await settle();
    const p1 = await ev(() => ({cards: document.querySelectorAll('#v-exam .scxq').length, n: EX.qs.length, clock: document.getElementById('exClock').textContent}));
    await page.waitForTimeout(2200);   // the clock shows whole seconds, so two ticks
    const c2 = await ev(() => document.getElementById('exClock').textContent);
    check(p1.cards === p1.n && /^\d+:\d\d$/.test(p1.clock) && c2 !== p1.clock,   // a paper of 100 minutes or more shows 119:59
    `All on one page shows every question of the paper (${p1.n}) with its clock running (${p1.clock}, then ${c2})`, {p1, c2});
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
    await ev(() => renderExam()); await settle();
    check(await ev(() => !!(document.getElementById('scStrict') || {}).checked),
      'the ticked strict box stays ticked when the start page is drawn again (as a paper-picker chip does)');
    await page.click('#startExam'); await settle();
    await toFront(); await settle();
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
    const here = page.url();
    await page.goBack(); await page.waitForTimeout(300);
    const away = page.url();
    await page.goForward(); await page.waitForFunction(() => typeof VIEW === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await goTab('exam');
    const r7 = await ev(() => ({i: EX && EX.i, prev: !!document.getElementById('exPrev'), strict: FX.api('study-controls').strictPaper()}));
    check(away !== here && r7.i === 1 && !r7.prev && r7.strict,
      'the browser Back button leaves the drill (it keeps no history of its own); Forward brings the strict paper back at the same question with no Back', Object.assign({away}, r7));
    page.removeAllListeners('dialog');
    let asked = null;
    // The left arrow is pressed while the native box is open and is not awaited before Cancel.
    // Playwright's Dialog note: while a dialog is open the page is blocked and actions do not
    // finish until it is handled; a handler that awaited the key before dismiss never reached
    // dismiss in WebKit (the WebKit job of 2026-11-04, run 41787939006, hung here for 900 s).
    // The engines differ in where that key goes: Chromium drops it (the page gets 0 left-arrow
    // keydowns, measured 2026-11-04), WebKit may hand it to the page once the box is closed. Either
    // way the paper must stay where it was. The page counts the left-arrow keydowns it got and the
    // count is printed as an observation (kit PR #16 review of 4b8748e).
    await ev(() => { window.__scLeft = 0; document.addEventListener('keydown', e => { if(e.key === 'ArrowLeft') window.__scLeft++; }, true); });
    let leftErr = null;
    page.on('dialog', async d => { asked = d.message(); const left = page.keyboard.press('ArrowLeft').catch(e => { leftErr = String(e.message || e).split('\n')[0]; }); await page.waitForTimeout(150); await d.dismiss(); await left; });
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
    page.removeAllListeners('dialog'); page.on('dialog', d => d.accept().catch(() => {}));
    const r8 = await ev(() => ({i: EX.i, prev: !!document.getElementById('exPrev'), left: window.__scLeft}));
    // An observation, not a check: whether a key pressed while the native box is open reaches the
    // page is up to the engine, and this test does not show that the module blocks it (no module
    // code runs while the box is open). The strict paper's own left-arrow check is the one above
    // ("... and the left arrow does nothing").
    console.log(`  note  observation only: the left arrow pressed while the native box was open reached the page ${r8.left} time(s) in ${L.BROWSER_NAME}${leftErr ? '; the key press was refused: ' + leftErr : ''}`);
    check(/cannot come back/.test(asked || '') && r8.i === 1 && !r8.prev,
      'on a blank strict question the right arrow opens the native "cannot come back" box, and Cancel keeps the paper on the same question with no Back', Object.assign({asked}, r8));
    await ev(() => finishExam(true)); await settle();
    await page.click('#exAgain'); await settle();
    await page.uncheck('#scStrict');
    await page.click('.scstart [data-sclayout="one"]'); await settle();
    await page.click('#startExam'); await settle();
    const r6 = await ev(() => ({prev: !!document.getElementById('exPrev'), strict: FX.api('study-controls').strictPaper(), flag: !!document.querySelector('#v-exam [data-scflag]')}));
    check(r6.prev && !r6.strict && r6.flag, 'the next paper started without the box has Back and flags again', r6);
    await ev(() => finishExam(true)); await settle();

    /* ---- with paper-picker on: a paper drawn for an earlier exam ---- */
    if(await page.locator('#exAgain').count()){ await page.click('#exAgain'); await settle(); }
    const pp = await ev(() => FX.api('paper-picker') ? [...document.querySelectorAll('#v-exam [data-ppexam]')].map(b => b.dataset.ppexam).filter(id => id !== String(EXAM.id)) : null);   // data-ppexam is text; an exam id may be a number
    // an earlier exam the bank can draw a paper for: paper-picker says on the start page when its pools hold too few ([data-pp="short"])
    let other = null;
    const short = [];
    for(const id of pp || []){
      await page.click(`#v-exam [data-ppexam="${id}"]`); await settle();
      if(await ev(() => !!document.querySelector('#v-exam [data-pp="short"]'))) short.push(id); else { other = id; break; }
    }
    if(pp && pp.length && !other) await page.click(`#v-exam [data-ppexam="${await ev(() => String(EXAM.id))}"]`).catch(() => {});
    if(!pp) L.skip('the flags bar and the strict paper on a paper drawn for an earlier exam', 'paper-picker is not on in this course');
    else if(!pp.length) L.skip('the flags bar and the strict paper on a paper drawn for an earlier exam', 'paper-picker offers no exam other than the current one');
    else if(!other) L.skip('the flags bar and the strict paper on a paper drawn for an earlier exam', `the bank holds too few questions for a paper of any earlier exam (${short.join(', ')}), as paper-picker says on the start page`);
    else {
      if(short.length) console.log(`  note  earlier exam(s) ${short.join(', ')} left out: paper-picker says the bank holds too few questions for a paper of it`);
      const startFor = async strict => {
        if(await page.locator('#exAgain').count()){ await page.click('#exAgain'); await settle(); }
        await page.click(`#v-exam [data-ppexam="${other}"]`); await settle();
        if(strict) await page.check('#scStrict'); else await page.uncheck('#scStrict');
        await page.click(`#v-exam [data-ppexam="${other}"]`); await settle();   // the start page is drawn again
        const box = await ev(() => !!document.getElementById('scStrict').checked);
        await page.click('.scstart [data-sclayout="one"]'); await page.click('#startExam'); await settle();
        const drawn = await ev(() => (FX.api('paper-picker').state().drawn || {}).exam);
        await toFront(); await settle();
        return {box, drawn};
      };
      const g1 = await startFor(false);
      await page.click('#v-exam .qcard .qhead [data-scflag]'); await settle();
      const fl = await ev(() => EX.qs[0].id);
      await page.click('#exNext'); await settle();
      const g2 = await ev(() => [...document.querySelectorAll('#v-exam .scxflags [data-scjump]')].map(b => b.textContent));
      await page.click('#v-exam .scxflags [data-scjump="0"]'); await settle();
      const g3 = await ev(() => EX.i);
      // an exam id may be a number (Basic-Pharmacokinetics: 1, 2, 3); the chip's data-ppexam is text
      check(String(g1.drawn) === other && g2.join() === '1' && g3 === 0,
        `on a paper drawn for an earlier exam (${other}) a flagged question is listed on the bar and its link moves to it`, {g1, g2, g3});
      await ev(id => FX.api('study-controls').set(id, false), fl);
      await ev(() => finishExam(true)); await settle();
      const g4 = await startFor(true);
      await page.keyboard.press('a'); await settle();
      await page.keyboard.press('ArrowRight'); await settle();
      await page.keyboard.press('ArrowLeft'); await settle();
      const g5 = await ev(() => ({i: EX.i, prev: !!document.getElementById('exPrev'), strict: FX.api('study-controls').strictPaper(), flag: !!document.querySelector('#v-exam [data-scflag]')}));
      await page.waitForTimeout(300);
      await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      await goTab('exam');
      const g6 = await ev(() => ({i: EX.i, prev: !!document.getElementById('exPrev'), strict: FX.api('study-controls').strictPaper()}));
      check(g4.box && String(g4.drawn) === other && g5.i === 1 && !g5.prev && g5.strict && !g5.flag && g6.i === 1 && !g6.prev && g6.strict,
        `a strict paper drawn for an earlier exam (${other}): the box stays ticked when a paper is chosen, no Back, no flags, the left arrow does nothing, strict through a reload`, {g4, g5, g6});
      await ev(() => finishExam(true)); await settle();
    }

    /* ---- clear flags ---- */
    await ev(ids => { const S = FX.api('study-controls'); ids.forEach(id => S.set(id, true)); }, [single[0], single[3]]);   // two flags at least, whatever the papers above left
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

    /* ---- persistence: hundreds of flags, Export and Import, profiles, reloads, storage denied and full ---- */
    if(s3.code !== 0) check(false, 'the copy with 300 more questions builds', s3.out.split('\n').pop());
    else {
      // sessionStorage '__scfail' = 'deny' or 'full' makes every localStorage write throw, as a blocked or full storage does
      const CTL = () => { const real = Storage.prototype.setItem;
        Storage.prototype.setItem = function(k, v){ const m = this === window.localStorage ? sessionStorage.getItem('__scfail') : null;
          if(m === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
          if(m === 'deny') throw new DOMException('The operation is insecure.', 'SecurityError');
          return real.call(this, k, v); }; };
      const m = await L.openPage(browser, s3.page, {viewport: {width: 1000, height: 900}, acceptDownloads: true}, CTL);
      const P = m.page, pe = (f, a) => P.evaluate(f, a), wait = t => P.waitForTimeout(t);
      const ready = () => P.waitForFunction(() => typeof VIEW === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const tab = async v => { await P.click(`#nav button[data-v="${v}"]`); await wait(60); };
      const nFlags = () => pe(() => Object.keys(DB.flags || {}).length);
      const rawFlags = p => pe(p => { const d = JSON.parse(localStorage.getItem(NS + ':data:' + p) || '{}'); return {n: Object.keys(d.flags || {}).length, layout: d.layout || null, flags: d.flags || {}}; }, p);
      const many = await pe(base => QUESTIONS.filter(q => /-c\d+$/.test(q.id) && base.includes(q.id.replace(/-c\d+$/, ''))).map(q => q.id), ids);
      await pe(ids => { const S = FX.api('study-controls'); ids.forEach(id => S.set(id, true)); }, many);
      await tab('topics');
      await P.click('#scRow [data-sclayout="all"]'); await wait(60);
      const h0 = await pe(() => ({n: document.getElementById('scFlagN').textContent, db: Object.keys(DB.flags).length}));
      await wait(400);
      await P.reload(); await ready(); await tab('topics');
      const h1 = await pe(() => ({n: document.getElementById('scFlagN').textContent, db: Object.keys(DB.flags || {}).length, layout: DB.layout}));
      await P.click('#scDrillFlag'); await wait(100);
      const h2 = await pe(() => ({pool: Q.pool.length, cards: document.querySelectorAll('#v-quiz .scq').length, more: !!document.getElementById('scMore')}));
      await P.click('#scMore'); await wait(100);
      const h3 = await pe(() => document.querySelectorAll('#v-quiz .scq').length);
      check(many.length === 6 * COPIES && h0.n === String(many.length) && h1.db === many.length && h1.n === String(many.length) && h1.layout === 'all' &&
        h2.pool === many.length && h2.cards === 40 && h2.more && h3 === 80,
        `${many.length} flags and the layout are kept through a reload; Drill flagged drills all ${many.length}, 40 to a page`, {n: many.length, h0, h1, h2, h3});

      // a reload soon after a change: the core writes the progress 150 ms after the last change
      await pe(id => FX.api('study-controls').set(id, true), single[0]);
      await P.reload(); await ready();
      const fast = await pe(id => !!(DB.flags || {})[id], single[0]);
      console.log(`  note  a reload at once (under 150 ms) after a flag: the flag was ${fast ? 'kept' : 'lost'} (the core saves 150 ms after the last change; agent-run report, not a check)`);
      await pe(id => FX.api('study-controls').set(id, true), single[1]);
      await wait(300);
      await P.reload(); await ready();
      check(await pe(id => !!(DB.flags || {})[id], single[1]), 'a flag is kept through a reload made 300 ms after it');

      // Export, then Import into a fresh profile
      const me = await pe(() => PROFILE), mine = await nFlags();
      await tab('settings');
      const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 10000}), P.click('#btnExport')]);
      const file = await dl.path();
      const ex = JSON.parse(fs.readFileSync(file, 'utf8'));
      await pe(() => { window.__name = 'SecondProfile'; });
      await P.click('#btnWho'); await wait(100);
      const fresh = await pe(() => ({p: PROFILE, n: Object.keys(DB.flags || {}).length, layout: DB.layout || null}));
      await tab('settings');
      // Import as a student does it since kit PR #32: the file is read, a plan is shown
      // (#importPlan), and it is imported only on #importGo; the outcome is #importResult.
      // SecondProfile holds no progress, so the plan is to replace it (button "Import",
      // not "Import into a new profile") and the flags come back in this same profile.
      const runImport = async f => {
        await P.setInputFiles('#fileIn', f);
        await P.waitForFunction(() => { const b = document.getElementById('importPlan'); return b && b.textContent.trim(); }, null, {timeout: 5000}).catch(() => {});
        const plan = await pe(() => { const g = document.getElementById('importGo'), w = document.getElementById('importWhat');
          return {go: g ? g.textContent.trim() : null, what: w ? w.textContent.replace(/\s+/g, ' ').trim() : null}; });
        if(plan.go) await P.click('#importGo');
        await P.waitForSelector('#importResult', {timeout: 3000}).catch(() => {});
        const result = await pe(() => { const r = document.getElementById('importResult'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
        await wait(200);
        return {plan, result};
      };
      const ir = await runImport(file);
      const imp = await pe(() => ({p: PROFILE, n: Object.keys(DB.flags || {}).length, layout: DB.layout}));
      const impRaw = await rawFlags('SecondProfile');
      check(Object.keys(ex.db.flags || {}).length === mine && ex.db.layout === 'all' && fresh.p === 'SecondProfile' && fresh.n === 0 && fresh.layout !== 'all' &&
        ir.plan.go === 'Import' && !!ir.result && imp.p === 'SecondProfile' && imp.n === mine && imp.layout === 'all' && impRaw.n === mine && impRaw.layout === 'all',
        `Export carries the ${mine} flags and the layout; Import into a fresh profile (the plan: replace it) brings them back into that profile, on the page and stored`, {exported: Object.keys(ex.db.flags || {}).length, fresh, ir, imp, stored: {n: impRaw.n, layout: impRaw.layout}});
      // each profile keeps its own
      await tab('topics');
      await P.click('#scClearFlag'); await wait(400);
      await P.click('#scRow [data-sclayout="one"]'); await wait(400);
      await pe(n => { window.__name = n; }, me);
      await P.click('#btnWho'); await wait(100);
      const back = await pe(() => ({p: PROFILE, n: Object.keys(DB.flags || {}).length, layout: DB.layout}));
      const other = await rawFlags('SecondProfile');
      check(back.p === me && back.n === mine && back.layout === 'all' && other.n === 0 && other.layout === 'one',
        'a profile switch: each profile keeps its own flags and layout', {back, other: {n: other.n, layout: other.layout}});

      // storage denied: the failure shows; what was saved is not overwritten; once storage works the change is saved
      const before = await rawFlags(me);
      await pe(() => sessionStorage.setItem('__scfail', 'deny'));
      await L.quizOn(P, [single[2]]); await wait(60);
      await P.click('#v-quiz .qcard .qhead [data-scflag]'); await wait(400);
      const d1 = await pe(id => ({warn: !!document.getElementById('savewarn') && document.getElementById('savewarn').getClientRects().length > 0, mem: !!(DB.flags || {})[id]}), single[2]);
      const d1raw = await rawFlags(me);
      // a strict paper started while storage is denied is strict for the visit
      await tab('exam');
      if(await P.locator('#exAgain').count()){ await P.click('#exAgain'); await wait(60); }
      await P.check('#scStrict'); await P.click('#startExam'); await wait(100);
      const d2 = await pe(() => ({strict: FX.api('study-controls').strictPaper(), prev: !!document.getElementById('exPrev')}));
      await pe(() => finishExam(true)); await wait(60);
      check(d1.warn && d1.mem && d1raw.n === before.n && JSON.stringify(d1raw.flags) === JSON.stringify(before.flags) && d2.strict && !d2.prev,
        'storage denied: the student is told, the saved flags are not overwritten, the new flag and a strict paper hold for the visit', {d1, saved: d1raw.n, before: before.n, d2});
      await pe(() => sessionStorage.removeItem('__scfail'));
      await pe(id => FX.api('study-controls').set(id, true), single[3]); await wait(400);
      await P.reload(); await ready();
      const d3 = await pe(ids => ids.map(id => !!(DB.flags || {})[id]), [single[2], single[3]]);
      check(d3[0] && d3[1] && (await nFlags()) === before.n + 2, 'once storage works again the next save writes the flag made while it was denied, and a reload loads all of them', {d3, n: await nFlags()});

      // storage full: the same, and a reload before storage works again loads the progress saved before
      const full0 = await rawFlags(me);
      await pe(() => sessionStorage.setItem('__scfail', 'full'));
      await L.quizOn(P, [single[0]]); await wait(60);
      await P.click('#v-quiz .qcard .qhead [data-scflag]'); await wait(60);
      await P.click('#v-quiz [data-sclayout="one"]'); await wait(400);
      const f1 = await pe(() => ({warn: !!document.getElementById('savewarn') && document.getElementById('savewarn').getClientRects().length > 0, layout: DB.layout}));
      const f1raw = await rawFlags(me);
      await pe(() => sessionStorage.removeItem('__scfail'));
      await P.reload(); await ready();
      const f2 = await pe(() => ({n: Object.keys(DB.flags || {}).length, layout: DB.layout}));
      check(f1.warn && f1.layout === 'one' && JSON.stringify(f1raw.flags) === JSON.stringify(full0.flags) && f1raw.layout === 'all' && f2.n === full0.n && f2.layout === 'all',
        'storage full (QuotaExceededError): the student is told, nothing saved is overwritten, and the saved flags and layout load after storage works again', {f1, saved: f1raw.n, f2, full0: full0.n});

      // a paper with calculations on it (exams[].typed) stays one at a time with All on one page chosen
      await pe(() => { DB.layout = 'all'; save(); });
      let tp = null;
      for(let t = 0; t < 40 && !tp; t++){
        await tab('exam');
        if(await P.locator('#exAgain').count()){ await P.click('#exAgain'); await wait(60); }
        await P.uncheck('#scStrict'); await P.click('#startExam'); await wait(100);
        const k = await pe(() => EX.qs.findIndex(q => q.type === 'numeric'));
        if(k >= 0){
          await pe(k => { EX.i = k; saveExam(); renderExamQ(); }, k); await wait(100);
          tp = await pe(() => ({all: !!document.querySelector('#v-exam .scxall'), note: !!document.querySelector('#v-exam .sctyped'), box: !!document.getElementById('exNum')}));
        }
        await pe(() => finishExam(true)); await wait(60);
      }
      if(!tp) L.skip('a paper with a calculation stays one at a time', 'no calculation was drawn on 40 papers');
      else check(!tp.all && tp.note && tp.box, 'with All on one page chosen, a paper with a calculation on it is shown one at a time, with the answer box, and says why', tp);
      check(!m.errors.length, 'no page error in the persistence checks', m.errors.slice(0, 3).join(' | '));
      check(!(await pe(() => FX.errors.length)), 'no module error in the persistence checks', await pe(() => FX.errors));
      await m.ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); s2.rm(); s3.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
