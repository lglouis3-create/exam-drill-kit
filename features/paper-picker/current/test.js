/* paper-picker: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * Basic-Pharmacokinetics has no test of its own for the paper choice or the
 * paper history (src/test.js, src/browser_test.py, src/review_test.py and
 * src/notes_test.py only call chooseExam to set up other checks, at ac2eb73), so
 * these checks are written from what its code does (src/shell.html lines
 * 1108-1128, src/views.js lines 3108-3168).
 *
 * On the course's own data: every exam's split of a paper adds up to the paper
 * and follows its marks, the largest remainders taking the rounding; the module puts in each pool exactly the questions the
 * core's pool filter puts there (no lowYield item, no typed item unless the exam
 * takes them); a paper drawn for each exam has the paper's length, no question
 * twice, every question from that exam's pools, each pool's share, its
 * select-all count, no two wordings of one fact, shuffled; a pool with one
 * single-answer question too few gives its share with one select-all question
 * more, from its own questions; an exam whose pools cannot fill a paper gets none; a paper longer than the pools can fill is not drawn.
 * The build step: an exam with another question count, another time limit, a
 * `blueprint`, a pool without marks, or another `typed` setting is left off the
 * chips and named on the Exam view with that reason; a course with one exam shows
 * no chips; an exam without an id and two exams with one id stop the build.
 * In Chromium, on a scratch copy with Basic-Pharmacokinetics' own data
 * (test_fixture.js: its three exams, activeExam, lectures, and the questions,
 * topics, skills and images that file names, from ac2eb73, every field as the course
 * has it; on a course that already holds that data, such as
 * the CI course, the course's own copy of it): the chips on the Exam view with
 * the current exam (Exam 3) chosen; choosing Exam 2 shows its four pools, their
 * 7/7/20/6 split and what the bank holds, its blurb, and the note that the other
 * views follow the current exam; its 40-question paper is drawn from Modules 4-7
 * in that split, with its select-all count and the current exam's clock; the
 * choice cannot change while the paper runs; a reload during the paper keeps it a
 * paper for Exam 2; the result names the exam, and drawing the result page again
 * records the paper once; the paper is listed with its score; the choice and the list survive a reload; a second paper, for Exam 3, is
 * listed first with its 39 blank items; a choice made before its exam gives way
 * to the current exam, one made after it is kept; Exam 1's paper is drawn for it from
 * its pools; with its Module 2 pool emptied in the page (a set-up shortage), it says its
 * pools are short and its paper is drawn for the current exam; Settings
 * changes the choice; an exam left off cannot be chosen; opening the Exam view and Settings before any choice adds
 * nothing to the saved progress.
 * Persistence, in a fresh profile: 101 papers submitted keep the 100 newest and
 * show the 12 newest, through a reload; a reload made at once after a choice is
 * reported (the core saves 150 ms after the last change), one made 300 ms after
 * keeps it; Export, then Import into a fresh profile (the plan says the file replaces
 * that profile, which has no progress; Import is pressed) brings the choice and the
 * 100 papers back; each profile keeps its own; storage denied and storage full
 * (QuotaExceededError): the student is told, nothing saved is overwritten, and
 * what was saved loads once storage works again.
 *
 *     node features/paper-picker/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const FIX = require(path.join(__dirname, 'test_fixture.js'));
const NAME = 'features/paper-picker/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;
const sameIds = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

(async () => {
  console.log('\n=== the course\'s own exams ===');
  L.PAGE.need(NAME);
  const X = L.engine('({COURSE, QUESTIONS, EXAM, FX: typeof FX === "undefined" ? null : FX, lecOf, familyOf, poolFilter, isMulti})');
  const S = X.FX && X.FX.api('paper-picker');
  if(!check(!!S, 'the page carries paper-picker, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const n = X.EXAM.questions;
  for(const e of X.COURSE.exams){
    const sh = S.shares(e, n), total = e.pools.reduce((s, p) => s + p.marks, 0);
    check(sh.reduce((a, b) => a + b, 0) === n && sh.every((k, i) => Math.abs(k - n * e.pools[i].marks / total) < 1),
          `${e.name}: a paper of ${n} split by marks ${e.pools.map(p => p.marks).join('/')} gives ${sh.join('/')}`, sh);
    // a paper size the marks do not divide: the largest remainders take the rounding, and the split still adds up
    for(const k of [7, n + 1]){
      const sk = S.shares(e, k), raw = e.pools.map(p => k * p.marks / total);
      const byFrac = raw.map((r, i) => i).sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])));
      const want = raw.map(Math.floor), extra = k - want.reduce((a, b) => a + b, 0);
      byFrac.slice(0, extra).forEach(i => { want[i]++; });
      check(sameIds(sk, want), `${e.name}: a paper of ${k} is split ${want.join('/')} (the largest remainders take the rounding)`, sk);
    }
    const tests = e.pools.map(p => X.poolFilter(p.filter));
    const inPool = q => tests.findIndex(t => t(q));
    // the questions each pool holds for a paper, as the core's pool filter reads them (the first pool a question matches)
    if(!X.EXAM.typed){
      const held = X.QUESTIONS.filter(q => !q.lowYield && !q.type && inPool(q) >= 0).length;
      check(S.room(e, 1e6) === held, `${e.name}: the module's pools hold the ${held} questions the core's pool filter puts in them (no lowYield, no typed item)`, S.room(e, 1e6));
    }
    const room = S.room(e, n);
    const d = S.drawFor(e, n);
    if(room < n){ check(d === null, `${e.name}: its pools fill ${room} of ${n}, so no paper is drawn for it`, d && d.length); continue; }
    if(!check(Array.isArray(d), `${e.name}: a paper is drawn for it`)) continue;
    const per = e.pools.map((p, i) => d.filter(q => inPool(q) === i).length);
    const fams = new Set(d.map(q => X.familyOf(q)));
    check(d.length === n && new Set(d.map(q => q.id)).size === n && d.every(q => inPool(q) >= 0 && !q.lowYield && (!q.type || X.EXAM.typed)),
          `${e.name}: ${n} questions, none twice, each from one of its pools`, d.map(q => q.id));
    check(sameIds(per, sh), `${e.name}: each pool supplies its share (${per.join('/')})`, {per, sh});
    check(fams.size === n, `${e.name}: no two wordings of one fact on the paper`, fams.size);
    // the select-all count: split by marks, the pool with the most marks taking the rounding, each pool giving what it holds
    const ok = q => !q.lowYield && !q.type;
    const order = e.pools.map((p, i) => i).sort((a, b) => e.pools[a].marks - e.pools[b].marks);
    // a family can hold both a select-all and a single-answer wording: once its select-all wording is drawn, its
    // single-answer wordings cannot be, so only single-answer families with no select-all wording count as certain
    let left = e.sata || 0, want = 0, extra = 0;
    const sOf = [];
    order.forEach((i, k) => {
      const s = k === order.length - 1 ? Math.max(0, left) : Math.round((e.sata || 0) * e.pools[i].marks / total); left -= s;
      sOf[i] = s;
      const qs = X.QUESTIONS.filter(q => ok(q) && inPool(q) === i);
      const mf = new Set(qs.filter(X.isMulti).map(X.familyOf));
      const m = Math.min(s, mf.size);
      want += m;
      const solo = new Set(qs.filter(q => !X.isMulti(q)).map(X.familyOf).filter(f => !mf.has(f))).size;
      extra += Math.max(0, Math.min(mf.size - m, sh[i] - m - solo));
    });
    const got = d.filter(X.isMulti).length;
    if(!extra) check(got === want, `${e.name}: the paper carries ${want} select-all item(s) (its sata ${e.sata || 0}, split by marks, as many as each pool holds)`, got);
    else check(got >= want && got <= want + extra, `${e.name}: the paper carries ${want} to ${want + extra} select-all item(s) (its sata ${e.sata || 0}, split by marks; a pool whose single-answer families can run short is topped up with up to ${extra} of its own select-all items)`, got);
    // the paper is shuffled: over five papers, at least one does not hold its pools one after another
    let mixed = false;
    for(let t = 0; t < 5 && !mixed; t++){ const p = S.drawFor(e, n) || [], at = p.map(inPool); mixed = at.some((x, j) => j && at[j - 1] !== x && at.slice(0, j - 1).includes(x)); }
    if(e.pools.length > 1) check(mixed, `${e.name}: the paper is shuffled, not drawn pool by pool`);
    // a pool short of single-answer questions is topped up from its own select-all questions, not from another pool:
    // a pool holding more select-all families than its select-all share has single-answer questions set aside (lowYield,
    // in this run only) until one select-all question more is needed, and still gives its share
    // (single-answer questions of a family that also has a select-all question are set aside too, so the two counts are apart)
    const multiFams = i => new Set(X.QUESTIONS.filter(q => ok(q) && inPool(q) === i && X.isMulti(q)).map(X.familyOf));
    const soloFams = i => new Set(X.QUESTIONS.filter(q => ok(q) && inPool(q) === i && !X.isMulti(q) && !multiFams(i).has(X.familyOf(q))).map(X.familyOf));
    const ti = e.pools.findIndex((p, i) => multiFams(i).size > sOf[i] && sh[i] > sOf[i] + 1 && soloFams(i).size >= sh[i] - sOf[i] - 1);
    if(ti < 0){ L.skip(`${e.name}: a pool short of single-answer questions`, 'no pool holds more select-all questions than its share'); continue; }
    const mf = multiFams(ti), singles = X.QUESTIONS.filter(q => ok(q) && inPool(q) === ti && !X.isMulti(q));
    const keepFams = new Set(), off = [];
    for(const q of singles){ const f = X.familyOf(q);
      if(!mf.has(f) && (keepFams.has(f) || keepFams.size < sh[ti] - sOf[ti] - 1)) keepFams.add(f); else { q.lowYield = true; off.push(q); } }
    const dt = S.drawFor(e, n);
    off.forEach(q => { delete q.lowYield; });
    const perT = dt ? e.pools.map((p, i) => dt.filter(q => inPool(q) === i).length) : null;
    check(!!dt && sameIds(perT, sh) && dt.filter(q => inPool(q) === ti && X.isMulti(q)).length === sOf[ti] + 1,
          `${e.name}: a pool with one single-answer question too few gives its share with one select-all question more, from its own questions`, {perT, sh});
  }
  check(S.drawFor(X.EXAM, X.QUESTIONS.length + 1) === null, 'a paper longer than the pools can fill is not drawn');

  console.log('\n=== the build step: which exams get a chip ===');
  const two = "COURSE.exams = [COURSE.exams.find(e => e.id === COURSE.activeExam) || COURSE.exams[0]]; COURSE.exams.push(Object.assign(JSON.parse(JSON.stringify(COURSE.exams[0])), {id: 'pp-other', name: 'Other paper'}));";
  // the step output in the module's FX.load call of a built page
  const stepOf = html => { const m = html.match(/FX\.load\("paper-picker", "v1", (\{.*?\}), (\{.*?\}), function/); return m ? JSON.parse(m[2]) : null; };
  const leftOff = [
    ['an exam with another question count', two + "COURSE.exams[1].questions = (COURSE.exams[0].questions || 0) + 1;", /questions, and the current exam has/],
    ['an exam with another time limit', two + "COURSE.exams[1].minutes = (COURSE.exams[0].minutes || 0) + 5;", /minutes, and the current exam has/],
    ['an exam with a blueprint', two + "COURSE.exams[1].blueprint = {parts: [{key: 'other', rest: true}]};", /counts per topic \(blueprint\)/],
    ['a pool without marks', two + "COURSE.exams[1].pools[0].marks = null;", /a pool without marks or a filter/],
    ['an exam with another typed setting', two + "COURSE.exams[1].typed = !COURSE.exams[0].typed;", /typed/]];
  let keepLeft = null;           // the first of these is opened in Chromium below
  for(const [label, courseLine, want] of leftOff){
    const r = L.scratchBuild('pp-left', {courseLine});
    const st = r.code === 0 ? stepOf(fs.readFileSync(r.page, 'utf8')) : null;
    check(!!st && !st.offer.includes('pp-other') && st.left.length === 1 && st.left[0][0] === 'pp-other' && want.test(st.left[0][1]),
          `${label} is left off the chips, with the reason`, st || r.out.split('\n').slice(-2).join(' '));
    if(!keepLeft && st) keepLeft = r; else r.rm();
  }
  {
    const r = L.scratchBuild('pp-two', {courseLine: two});
    const st = r.code === 0 ? stepOf(fs.readFileSync(r.page, 'utf8')) : null;
    check(!!st && st.offer.join() === 'pp-other' && !st.left.length, 'an exam like the current one gets a chip', st || r.out.split('\n').slice(-2).join(' '));
    r.rm();
    const o = L.scratchBuild('pp-one', {courseLine: "COURSE.exams = [COURSE.exams.find(e => e.id === COURSE.activeExam) || COURSE.exams[0]];"});
    const so = o.code === 0 ? stepOf(fs.readFileSync(o.page, 'utf8')) : null;
    check(!!so && !so.offer.length && !so.left.length, 'a course with one exam builds, with nothing to choose', so || o.out.split('\n').slice(-2).join(' '));
    o.rm();
  }
  const refusals = [
    ['an exam without an id', two + "delete COURSE.exams[1].id;", /has no id/],
    ['two exams with one id', two + "COURSE.exams[1].id = COURSE.exams[0].id;", /share the id/]];
  for(const [label, courseLine, want] of refusals){
    const r = L.scratchBuild('pp-refuse', {courseLine});
    check(r.code !== 0 && want.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' own data (Chromium) ===');
  // The fixture's questions (ids with the prefix FIX.PRE): the course's own copy of them (the CI course), or the
  // fixture added to a scratch copy. Either way the scratch copy is set to the fixture's own exams and current exam
  // (a course may hold the questions with other exams: a 1-exam course, or a course where another module's script
  // set COURSE.exams after this one). Exam 1's pools take only the fixture's topics in the copy, so the checks that
  // Exam 1's pools are filled (and, once narrowed, short) read the fixture's own bank, whatever other modules add; Exam 2's and
  // Exam 3's pools take every question, as in a course. Where another lecture with one of the fixture's decks and
  // another exam or module comes before the fixture's own lectures (the core reads a question's exam and module
  // from the first lecture naming its deck), the fixture's lectures are moved ahead in the copy, all lectures kept.
  const pre = FIX.PRE, ids = new Set(X.QUESTIONS.map(q => q.id));
  const have = FIX.PK.qs.filter(q => ids.has(pre + q.id)).length;
  if(have && have < FIX.PK.qs.length){ check(false, `the course holds ${have} of the ${FIX.PK.qs.length} questions of test_fixture.js (ids ${pre}...), so neither its own copy nor a new one can be used`); L.finish(NAME); }
  const ppTopics = FIX.PK.topics.map(t => pre + t.id), ppLecs = FIX.PK.lectures.map(l => pre + l.id);
  const ahead = FIX.PK.lectures.filter(l => { const f = X.COURSE.lectures.find(x => x.deck === l.deck); return f && !ppLecs.includes(f.id) && (f.exam !== l.exam || f.module !== l.module); }).map(l => l.deck);
  const setUp = `COURSE.exams = ${JSON.stringify(FIX.PK.exams)}; COURSE.activeExam = ${JSON.stringify(FIX.PK.activeExam)}; ` +
    `COURSE.exams.find(e => e.id === 1).pools.forEach(p => { p.filter = Object.assign({}, p.filter, {topic: ${JSON.stringify(ppTopics)}}); });` +
    (ahead.length ? ` { const pp = COURSE.lectures.filter(l => ${JSON.stringify(ppLecs)}.includes(l.id)); COURSE.lectures = pp.concat(COURSE.lectures.filter(l => !pp.includes(l))); }` : '');
  let opts;
  if(have) opts = {courseLine: setUp};
  else {
    const d = FIX.courseData();
    opts = {files: d.files, courseLine: d.courseLine + ' ' + setUp, edit: src => {
      const f = path.join(src, 'images.json');
      fs.writeFileSync(f, FIX.withImages(fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '{}'));
    }};
  }
  const sameExams = JSON.stringify(X.COURSE.exams) === JSON.stringify(FIX.PK.exams) && X.COURSE.activeExam === FIX.PK.activeExam;
  console.log(`  (${have ? 'the course\'s own copy of the fixture' : 'the fixture added to a scratch copy'}: ${FIX.PK.qs.length} questions; ` +
    `${sameExams ? 'the course has the fixture\'s ' + FIX.PK.exams.length + ' exams' : 'the course has ' + X.COURSE.exams.length + ' exam(s), set to the fixture\'s ' + FIX.PK.exams.length + ' in the copy'}; ` +
    `${X.QUESTIONS.length - have} other question(s) in the course, kept out of Exam 1's pools by topic` +
    `${ahead.length ? '; the fixture\'s lectures moved ahead of the earlier lectures of ' + [...new Set(ahead)].join(', ') : ''})`);
  const s = L.scratchBuild('pp', opts);
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').slice(-3).join(' '));
  const [E1, E2, E3] = [1, 2, 3].map(id => FIX.PK.exams.find(e => e.id === id));
  const N = E3.questions;
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}});
    const ev = (f, a) => page.evaluate(f, a);
    const settle = () => page.waitForTimeout(150);
    const ready = () => page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    // what a pool of an exam holds and supplies, read with the core's own pool filter (not the module's)
    const bank = id => ev(id => { const e = COURSE.exams.find(x => x.id === id), tests = e.pools.map(p => poolFilter(p.filter));
      const per = e.pools.map((p, i) => QUESTIONS.filter(q => !q.lowYield && !q.type && tests.findIndex(t => t(q)) === i).length);
      const total = e.pools.reduce((a, p) => a + p.marks, 0);
      return {per, room: per.reduce((a, k, i) => a + Math.min(k, Math.round(EXAM.questions * e.pools[i].marks / total)), 0)}; }, id);
    await page.click('#nav button[data-v="settings"]');
    await page.waitForSelector('#v-settings [data-feature="paper-picker"]', {timeout: 5000}).catch(() => {});
    await page.click('#nav button[data-v="exam"]');
    await page.waitForSelector('#v-exam [data-pp="picker"]', {timeout: 5000}).catch(() => {});
    await settle();
    check(await ev(() => !('paperPicker' in DB) && !JSON.parse(store.get(keyFor(PROFILE)) || '{}').paperPicker),
          'opening Settings and the Exam view before any choice adds nothing to the progress');
    const p0 = await ev(() => ({chips: [...document.querySelectorAll('#v-exam .chip[data-ppexam]')].map(b => b.textContent),
      on: [...document.querySelectorAll('#v-exam .chip[data-ppexam][aria-pressed="true"]')].map(b => b.dataset.ppexam),
      hist: !!document.querySelector('#v-exam [data-pp="history"]')}));
    check(p0.chips.join('|') === [E1, E2, E3].map(e => e.name).join('|') && p0.on.join() === '3' && !p0.hist,
          `the Exam view offers one chip per exam, the current exam (${E3.name}) chosen, and no list before a paper`, p0);
    await page.click('#v-exam .chip[data-ppexam="2"]');
    await page.waitForSelector('#v-exam [data-pp="other"]', {timeout: 5000}).catch(() => {});
    const b2 = await bank(2);
    const p1 = await ev(() => ({kept: DB.paperPicker && DB.paperPicker.exam, on: [...document.querySelectorAll('#v-exam .chip[data-ppexam][aria-pressed="true"]')].map(b => b.dataset.ppexam),
      text: document.getElementById('v-exam').textContent, rows: document.querySelectorAll('#v-exam [data-pp="other"] tbody tr').length,
      cells: [...document.querySelectorAll('#v-exam [data-pp="other"] tbody tr')].map(r => r.children[1].textContent).join('/'),
      inBank: [...document.querySelectorAll('#v-exam [data-pp="other"] tbody tr')].map(r => r.children[2].textContent).join('/'),
      start: !!document.getElementById('startExam')}));
    check(p1.kept === 2 && p1.on.join() === '2', `choosing ${E2.name} keeps the choice in the progress and marks its chip`, {kept: p1.kept, on: p1.on});
    check(new RegExp(`${N} questions drawn at the blueprint of ${E2.name}`).test(p1.text) && p1.rows === E2.pools.length &&
          p1.cells === E2.pools.map(p => p.marks).join('/') && p1.inBank === b2.per.join('/') && p1.start,
          `the page says the paper is drawn at ${E2.name}'s blueprint, with its ${E2.pools.length} pools, their ${E2.pools.map(p => p.marks).join('/')} split and what the bank holds (${b2.per.join('/')})`,
          {rows: p1.rows, cells: p1.cells, inBank: p1.inBank, bank: b2.per});
    check(p1.text.includes(E2.blurb.slice(0, 60)), `and shows ${E2.name}'s own blurb`);
    check(p1.text.includes(`follow ${E3.name}, the course's current exam`), 'and says Topics, Weak spots and the weighted pass follow the current exam');
    await page.click('#startExam');
    const r1 = await ev(() => ({n: EX.qs.length, ids: EX.qs.map(q => q.id), mods: EX.qs.map(q => (lecOf(q) || {}).module), running: EX.running,
      sata: EX.qs.filter(isMulti).length, mins: Math.round((EX.ends - Date.now()) / 60000)}));
    const cnt = m => r1.mods.filter(x => x === m).length;
    const mods = E2.pools.map(p => p.filter.module);
    check(r1.running && r1.n === N && r1.mods.every(m => mods.includes(m)) && mods.every((m, i) => cnt(m) === E2.pools[i].marks),
          `its paper is ${N} questions from Modules ${mods.join(', ')}: ${E2.pools.map(p => p.marks).join(', ')} of them`, r1.mods.join(','));
    check(r1.mins === E3.minutes, `the paper keeps the current exam's clock (${E3.minutes} minutes)`, r1.mins);
    const before = await ev(() => DB.paperPicker.exam);
    const blocked = await ev(() => FX.api('paper-picker').choose(1));
    check(blocked === false && before === 2 && await ev(() => DB.paperPicker.exam) === 2, 'the choice cannot change while a paper runs');
    // answer three questions, reload during the paper, then answer the rest and submit
    for(let i = 0; i < 3; i++){ await page.click('#v-exam .opt'); await page.click('#exNext'); }
    await page.waitForTimeout(300);
    await page.reload(); await ready();
    await page.click('#nav button[data-v="exam"]'); await settle();
    const back = await ev(() => ({running: !!EX && EX.running, ids: EX ? EX.qs.map(q => q.id) : [], i: EX ? EX.i : -1,
      drawn: DB.paperPicker && DB.paperPicker.drawn && DB.paperPicker.drawn.exam}));
    check(back.running && sameIds(back.ids, r1.ids) && back.i === 3 && back.drawn === 2,
          `after a reload during the paper it is the same paper, at question 4, still recorded as drawn for ${E2.name}`, {running: back.running, i: back.i, drawn: back.drawn});
    for(let i = back.i; i < N; i++){ await page.click('#v-exam .opt'); await page.click('#exNext'); }
    // since kit #59 the last question's "Review answers" opens the overview, which grades and records nothing;
    // the student submits from it (the page's confirm is accepted, line 142)
    check(await ev(() => !!document.getElementById('exRevSubmit') && !!EX && EX.running && !EX.done), 'the last question\'s Review answers opens the overview, the paper still running');
    await page.click('#exRevSubmit');
    await page.waitForSelector('#v-exam [data-pp="result"]', {timeout: 5000}).catch(() => {});
    const r2 = await ev(() => ({done: EX && EX.done, right: EX.qs.filter((q, i) => examRight(q, EX.picks[i])).length,
      line: (document.querySelector('#v-exam [data-pp="result"]') || {}).textContent || '', papers: JSON.parse(JSON.stringify(DB.paperPicker.papers || []))}));
    check(r2.done && r2.line.includes(`This paper was drawn for ${E2.name}.`), 'the result page names the exam the paper was drawn for', r2.line);
    check(r2.papers.length === 1 && r2.papers[0].exam === 2 && r2.papers[0].total === N && r2.papers[0].right === r2.right && r2.papers[0].blank === 0 && r2.papers[0].partial === false,
          `the paper is kept in the progress: ${E2.name}, ${r2.right} of ${N}, none blank`, r2.papers);
    // the result page drawn again (another tab, then back to the Exam view) records nothing more
    await page.click('#nav button[data-v="settings"]'); await settle();
    await page.click('#nav button[data-v="exam"]'); await page.waitForTimeout(300);
    const again = await ev(() => ({n: (DB.paperPicker.papers || []).length, result: !!document.querySelector('#v-exam [data-pp="result"]')}));
    check(again.n === 1 && again.result, 'the result page drawn again after a visit to another tab keeps one record of the paper', again);
    await page.click('#v-exam #exAgain');
    await page.waitForSelector('#v-exam [data-pp="history"]', {timeout: 5000}).catch(() => {});
    const h1 = await ev(() => [...document.querySelectorAll('#v-exam [data-pp="history"] tbody tr')].map(r => [...r.children].map(c => c.textContent.trim())));
    const pc = Math.round(100 * r2.right / N);
    check(h1.length === 1 && h1[0][0] === E2.name && h1[0][2] === `${r2.right} / ${N}` && h1[0][3] === '0' && h1[0][4] === `${pc}%`,
          `"Your papers so far" lists it: ${E2.name}, the score, 0 blank, ${pc}%`, h1);
    await page.waitForTimeout(300);
    await page.reload(); await ready();
    await page.click('#nav button[data-v="exam"]');
    await page.waitForSelector('#v-exam [data-pp="history"]', {timeout: 5000}).catch(() => {});
    const k = await ev(() => ({on: [...document.querySelectorAll('#v-exam .chip[data-ppexam][aria-pressed="true"]')].map(b => b.dataset.ppexam),
      rows: document.querySelectorAll('#v-exam [data-pp="history"] tbody tr').length}));
    check(k.on.join() === '2' && k.rows === 1, 'after a reload the choice and the list are kept', k);
    // a second paper, for the current exam, submitted with blank items
    await page.click('#v-exam .chip[data-ppexam="3"]');
    await page.waitForSelector('#startExam', {timeout: 5000});
    check(await ev(t => !document.querySelector('#v-exam [data-pp="other"]') && document.getElementById('v-exam').textContent.includes(t), `${N} questions drawn at the blueprint of ${E3.name}`),
          'with the current exam chosen, the engine\'s own opening page is shown');
    await page.click('#startExam');
    const r3 = await ev(() => EX.qs.map(q => q.id));
    const drew = await ev(() => DB.paperPicker.drawn && DB.paperPicker.drawn.exam);
    check(drew === 3 && r3.length === N, `a paper for the current exam is the engine's own draw of ${N}, recorded for ${E3.name}`, {drew, n: r3.length});
    await page.click('#v-exam .opt');
    await page.click('#exEnd');
    await page.waitForSelector('#exAgain', {timeout: 5000}).catch(() => {});
    await settle();
    const r4 = await ev(() => ({papers: JSON.parse(JSON.stringify(DB.paperPicker.papers)), result: !!document.querySelector('#v-exam [data-pp="result"]')}));
    const last = r4.papers[r4.papers.length - 1] || {};
    check(r4.papers.length === 2 && last.exam === 3 && last.blank === N - 1 && last.partial === true && !r4.result,
          `a paper submitted with ${N - 1} blank is kept for ${E3.name} with its blank count, and its result page names no other exam`, last);
    await page.click('#exAgain');
    await page.waitForSelector('#v-exam [data-pp="history"]', {timeout: 5000}).catch(() => {});
    const h2 = await ev(() => [...document.querySelectorAll('#v-exam [data-pp="history"] tbody tr')].map(r => [r.children[0].textContent, r.children[3].textContent]));
    check(h2.length === 2 && h2[0][0] === E3.name && h2[0][1] === String(N - 1) && h2[1][0] === E2.name, 'the list shows the newest paper first', h2);
    // the rule for an old choice (Basic-Pharmacokinetics pickExam)
    const rule = await ev(() => { const A = FX.api('paper-picker'), s = A.state(), was = Object.assign({}, s);
      const e1 = COURSE.exams.find(e => e.id === 1);
      s.exam = 1; s.at = A.examEnds(e1) - 86400000; const beforeIt = A.chosen().id;
      s.at = A.examEnds(e1) + 60000; const afterIt = A.chosen().id;
      const future = {id: 'x', when: '2999-01-01T08:00', minutes: 60};
      Object.keys(s).forEach(k => { delete s[k]; }); Object.assign(s, was);
      return {beforeIt, afterIt, never: A.examEnds({id: 'y', date: 'TBA'}) === Infinity, fut: A.examEnds(future) === Date.parse('2999-01-01T08:00') + 3600000,
        e1: A.examEnds(e1) === Date.parse(e1.when) + e1.minutes * 60000}; });
    check(rule.beforeIt === 3 && rule.afterIt === 1, `${E1.name} chosen before it was sat gives way to ${E3.name} now it is over; chosen after it (to review it), it is kept`, rule);
    check(rule.never && rule.fut && rule.e1, 'an exam ends at its `when` plus its minutes; one with no date in ISO form never ends', rule);
    // Exam 1: the fixture's bank fills its pools, so its paper is drawn for it
    const b1 = await bank(1);
    await page.click('#v-exam .chip[data-ppexam="1"]');
    await page.waitForSelector('#v-exam [data-pp="other"]', {timeout: 5000}).catch(() => {});
    const e1v = await ev(() => ({short: !!document.querySelector('#v-exam [data-pp="short"]'), kept: DB.paperPicker.exam}));
    check(b1.room === N && !e1v.short && e1v.kept === 1, `${E1.name}'s pools hold enough questions (${b1.per.join('/')}): no shortage note, and ${E1.name} is chosen`, {room: b1.room, e1v});
    await page.click('#startExam');
    const r1e = await ev(() => { const e = COURSE.exams.find(x => x.id === 1), tests = e.pools.map(p => poolFilter(p.filter));
      return {drawn: DB.paperPicker.drawn.exam, n: EX.qs.length, all: EX.qs.every(q => tests.some(t => t(q)))}; });
    check(r1e.drawn === 1 && r1e.n === N && r1e.all, `the paper started then is drawn for ${E1.name}, ${N} questions from its pools`, r1e);
    await ev(() => { finishExam(true); EX = null; renderExam(); });
    // a pool the bank cannot fill (set up here: Exam 1's Module 2 pool narrowed, in the page, to a topic no question has)
    await ev(() => { const p = COURSE.exams.find(x => x.id === 1).pools[1]; p.ppWas = p.filter; p.filter = Object.assign({}, p.filter, {topic: ['pp-no-such-topic']}); delete p.test; renderExam(); });
    await page.click('#v-exam .chip[data-ppexam="1"]');
    await page.waitForSelector('#v-exam [data-pp="short"]', {timeout: 5000}).catch(() => {});
    const b1s = await bank(1);
    const sh = await ev(() => (document.querySelector('#v-exam [data-pp="short"]') || {}).textContent || '');
    check(b1s.room < N && sh.includes(`its pools can supply ${b1s.room} of the ${N}`) && sh.includes(`drawn for ${E3.name}`),
          `with ${E1.name}'s Module 2 pool emptied (${b1s.per.join('/')}): the page says its pools supply ${b1s.room} of the ${N}, and that the paper is drawn for the current exam`, sh);
    await page.click('#startExam');
    const r5 = await ev(() => ({drawn: DB.paperPicker.drawn.exam, n: EX.qs.length}));
    check(r5.drawn === 3 && r5.n === N, 'the paper started then is the current exam\'s', r5);
    await ev(() => { const p = COURSE.exams.find(x => x.id === 1).pools[1]; p.filter = p.ppWas; delete p.ppWas; delete p.test; });
    await ev(() => { finishExam(true); EX = null; renderExam(); });
    // Settings
    await page.click('#nav button[data-v="settings"]');
    await page.waitForSelector('#v-settings [data-feature="paper-picker"] .chip', {timeout: 5000}).catch(() => {});
    await page.click('#v-settings [data-feature="paper-picker"] .chip[data-ppexam="2"]');
    const st = await ev(() => ({kept: DB.paperPicker.exam, on: [...document.querySelectorAll('#v-settings [data-feature="paper-picker"] .chip[data-ppexam][aria-pressed="true"]')].map(b => b.dataset.ppexam)}));
    check(st.kept === 2 && st.on.join() === '2', 'Settings offers the same chips and changes the choice', st);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();

    /* ---- persistence: 101 papers, reloads, Export and Import, profiles, storage denied and full ---- */
    // sessionStorage '__ppfail' = 'deny' or 'full' makes every localStorage write throw, as blocked or full storage does
    const CTL = () => { const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){ const m = this === window.localStorage ? sessionStorage.getItem('__ppfail') : null;
        if(m === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        if(m === 'deny') throw new DOMException('The operation is insecure.', 'SecurityError');
        return real.call(this, k, v); }; };
    const m = await L.openPage(browser, s.page, {viewport: {width: 1000, height: 900}, acceptDownloads: true}, CTL);
    const P = m.page, pe = (f, a) => P.evaluate(f, a), wait = t => P.waitForTimeout(t);
    const pready = () => P.waitForFunction(() => typeof VIEW === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const tab = async v => { await P.click(`#nav button[data-v="${v}"]`); await wait(60); };
    const mine = () => pe(() => JSON.parse(JSON.stringify(DB.paperPicker || null)));
    const raw = p => pe(p => (JSON.parse(localStorage.getItem(keyFor(p)) || '{}').paperPicker || null), p);
    const warned = () => pe(() => !!document.getElementById('savewarn') && document.getElementById('savewarn').getClientRects().length > 0);
    const submit = (ids, exams) => pe(({ids, exams}) => { const A = FX.api('paper-picker'), at = [];
      for(let i = 0; i < ids; i++){
        A.choose(exams[i % exams.length]); renderExam();
        document.getElementById('startExam').click();
        finishExam(true); A.logPaper();   // what the module's X.rendered hook does when the result page is drawn (a MutationObserver, after this script)
        at.push(DB.paperPicker.papers[DB.paperPicker.papers.length - 1].at);
        EX = null;
      }
      renderExam(); return at; }, {ids, exams});
    await tab('exam');
    // 101 papers, for Exam 2 and Exam 3 in turn: the 100 newest are kept, the 12 newest shown
    await submit(101, [2, 3]);
    await tab('exam');
    const g0 = await mine();
    const g0h = await pe(() => ({rows: document.querySelectorAll('#v-exam [data-pp="history"] tbody tr').length,
      sub: (document.querySelector('#v-exam [data-pp="history"] p.sub') || {}).textContent || ''}));
    await wait(400);
    await P.reload(); await pready(); await tab('exam');
    const g1 = await mine();
    const g1h = await pe(() => document.querySelectorAll('#v-exam [data-pp="history"] tbody tr').length);
    check(g0.papers.length === 100 && g0.papers[0].exam === 3 && g0.papers[99].exam === 2 && g0.papers.every(x => x.total === N && x.blank === N && x.partial) &&
          g0h.rows === 12 && /the 12 newest of 100/.test(g0h.sub) && JSON.stringify(g1) === JSON.stringify(g0) && g1h === 12,
          '101 papers submitted: the 100 newest are kept (the first one dropped), the 12 newest are listed, and all 100 come back after a reload',
          {kept: g0.papers.length, first: g0.papers[0] && g0.papers[0].exam, rows: g0h.rows, sub: g0h.sub, same: JSON.stringify(g1) === JSON.stringify(g0)});
    // a reload soon after a change: the core writes the progress 150 ms after the last change
    await pe(() => FX.api('paper-picker').choose(1));
    await P.reload(); await pready();
    const fast = (await mine()).exam;
    console.log(`  note  a reload at once (under 150 ms) after a choice: the choice was ${fast === 1 ? 'kept' : 'lost'} (the core saves 150 ms after the last change; agent-run report, not a check)`);
    await pe(() => FX.api('paper-picker').choose(3));
    await wait(300);
    await P.reload(); await pready();
    check((await mine()).exam === 3, 'a choice is kept through a reload made 300 ms after it');
    // Export, then Import into a fresh profile
    const me = await pe(() => PROFILE), mineAll = await mine();
    await tab('settings');
    const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 10000}), P.click('#btnExport')]);
    const file = await dl.path();
    const ex = JSON.parse(fs.readFileSync(file, 'utf8'));
    await pe(() => { window.__name = 'SecondProfile'; });
    await P.click('#btnWho'); await wait(100);
    const fresh = await pe(() => ({p: PROFILE, pp: DB.paperPicker || null}));
    await tab('settings');
    // Import as a student does since kit PR #32: choose the file, wait for the plan (#importPlan),
    // press Import (#importGo) when the plan offers it, and wait for the outcome (#importResult)
    await P.setInputFiles('#fileIn', file);
    await P.waitForFunction(() => { const b = document.getElementById('importPlan'); return b && b.textContent.trim(); }, null, {timeout: 15000}).catch(() => {});
    const plan = await pe(() => { const w = document.getElementById('importWhat');
      return {go: !!document.getElementById('importGo'), what: w ? w.textContent.replace(/\s+/g, ' ').trim() : ''}; });
    check(fresh.p === 'SecondProfile' && fresh.pp === null && plan.go && /this profile has no progress yet\. Import replaces the progress of "SecondProfile"/.test(plan.what),
          'Import into a fresh profile: the plan says the file replaces "SecondProfile", which has no progress, and offers Import', plan);
    if(plan.go){ await P.click('#importGo', {timeout: 5000}); await P.waitForSelector('#importResult', {timeout: 15000}).catch(() => {}); }
    const result = await pe(() => { const r = document.getElementById('importResult'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; });
    await wait(500);
    const imp = await pe(() => ({p: PROFILE, pp: JSON.parse(JSON.stringify(DB.paperPicker || null))}));
    check(!!result && JSON.stringify(ex.db.paperPicker) === JSON.stringify(mineAll) && fresh.p === 'SecondProfile' && fresh.pp === null &&
          imp.p === 'SecondProfile' && JSON.stringify(imp.pp) === JSON.stringify(mineAll),
          `Export carries the choice and the ${mineAll.papers.length} papers; Import into a fresh profile brings them back`,
          {exported: ex.db.paperPicker && ex.db.paperPicker.papers.length, fresh, result, imported: imp.pp && imp.pp.papers.length});
    // each profile keeps its own
    await pe(() => FX.api('paper-picker').choose(1)); await wait(400);
    await pe(n => { window.__name = n; }, me);
    await P.click('#btnWho'); await wait(100);
    const backMe = await pe(() => ({p: PROFILE, pp: JSON.parse(JSON.stringify(DB.paperPicker || null))}));
    const other = await raw('SecondProfile');
    check(backMe.p === me && JSON.stringify(backMe.pp) === JSON.stringify(mineAll) && other && other.exam === 1 && other.papers.length === 100,
          'a profile switch: each profile keeps its own choice and papers', {me: backMe.pp && backMe.pp.exam, other: other && other.exam});
    // storage denied: the failure shows; what was saved is not overwritten; once storage works the change is saved
    await tab('exam');
    const saved0 = await raw(me);
    await pe(() => sessionStorage.setItem('__ppfail', 'deny'));
    const [deniedAt] = await submit(1, [2]);
    await wait(400);
    const d1 = {warn: await warned(), mem: await mine(), saved: await raw(me)};
    check(d1.warn && JSON.stringify(d1.saved) === JSON.stringify(saved0) && d1.mem.exam === 2 && d1.mem.papers[99].at === deniedAt,
          'storage denied: the student is told, the saved choice and papers are not overwritten, the new paper and choice hold for the visit',
          {warn: d1.warn, savedSame: JSON.stringify(d1.saved) === JSON.stringify(saved0), mem: d1.mem.exam});
    await pe(() => sessionStorage.removeItem('__ppfail'));
    await pe(() => FX.api('paper-picker').choose(2)); await wait(400);
    await P.reload(); await pready();
    const d3 = await mine();
    check(d3.exam === 2 && d3.papers.length === 100 && d3.papers[99].at === deniedAt,
          'once storage works again the next save writes the paper made while it was denied, and a reload loads it', {exam: d3.exam, last: d3.papers[99].at === deniedAt});
    // storage full: the same, and a reload before storage works again loads the progress saved before
    await tab('exam');
    const full0 = await raw(me);
    await pe(() => sessionStorage.setItem('__ppfail', 'full'));
    await submit(1, [3]);
    await wait(400);
    const f1 = {warn: await warned(), mem: await mine(), saved: await raw(me)};
    await pe(() => sessionStorage.removeItem('__ppfail'));
    await P.reload(); await pready();
    const f2 = await mine();
    check(f1.warn && f1.mem.exam === 3 && JSON.stringify(f1.saved) === JSON.stringify(full0) && JSON.stringify(f2) === JSON.stringify(full0),
          'storage full (QuotaExceededError): the student is told, nothing saved is overwritten, and the saved choice and papers load after storage works again',
          {warn: f1.warn, savedSame: JSON.stringify(f1.saved) === JSON.stringify(full0), loaded: JSON.stringify(f2) === JSON.stringify(full0)});
    check(!m.errors.length, 'no page error in the persistence checks', m.errors.slice(0, 3).join(' | '));
    await m.ctx.close();

    if(!keepLeft) check(false, 'the copy with an exam left off builds');
    else {
      const b = await L.openPage(browser, keepLeft.page, {viewport: {width: 1100, height: 1300}});
      await b.page.click('#nav button[data-v="exam"]');
      await b.page.waitForSelector('#v-exam [data-pp="left"]', {timeout: 5000}).catch(() => {});
      const lt = await b.page.evaluate(() => ({left: (document.querySelector('#v-exam [data-pp="left"]') || {}).textContent || '',
        chips: document.querySelectorAll('#v-exam .chip[data-ppexam]').length, start: !!document.getElementById('startExam'),
        chose: FX.api('paper-picker').choose('pp-other'), now: FX.api('paper-picker').chosen().id, cur: EXAM.id}));
      check(/Not offered as a practice paper here/.test(lt.left) && /Other paper \(\d+ questions, and the current exam has \d+ questions\)/.test(lt.left) && !lt.chips && lt.start,
            'the Exam view names the exam left off and why, offers no chips, and keeps its start button', lt);
      check(lt.chose === false && lt.now === lt.cur, 'the exam left off cannot be chosen: the paper stays the current exam\'s', lt);
      check(!b.errors.length, 'no page error with an exam left off', b.errors.slice(0, 3).join(' | '));
      await b.ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); if(keepLeft) keepLeft.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
