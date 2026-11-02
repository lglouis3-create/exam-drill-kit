/* quiz-prep-cards: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data: every quiz in COURSE.quizzes covers at least one
 * question and only questions of the topics or modules it names; the page has one
 * card per quiz still ahead and not hidden; the days-left line for a quiz at fixed
 * times (3 days, the day itself, in progress, over) and the end of a quiz at its
 * start plus its minutes (Basic-Pharmacokinetics src/views.js examCountdown, lines
 * 2409-2417, and quizAhead, line 480).
 * The build step: no quizzes, a topic that TOPICS does not have, a module no
 * question carries, a `when` that is not YYYY-MM-DDTHH:MM, two quizzes with one id,
 * a field the module does not read, a tag other than <sub>, <sup>, <b>, <i>, <em> in
 * a said line, and a tag in `covers` each stop the build with that reason.
 * On a scratch copy with Basic-Pharmacokinetics' Quiz 5 and Quiz 4 (src/course.js
 * lines 228-276, at ac2eb73: names, minutes, covers, quote, said and src as written;
 * ids prefixed qpt-; `when` moved to 3 days and 1 day after the test runs; Quiz 5
 * keeps its modules [9, 8], which the copy gives to the course's own questions, and
 * Quiz 4 names the course's first topic in place of its modules [6, 7]) and a quiz
 * already over, in Chromium (src/review_test.py lines 76-108 ported, without the
 * practice paper, which this module does not have): a card per live quiz and none
 * for the one that is over; the card's day, days left, covers, quote and every said
 * line, with <sub> kept and {{frac:a|b}} written (a)/(b) when formulas-in-text is
 * off, stacked when it is on; the quiz's drills hold only the questions it names (concepts only,
 * calculations only, everything, and a straight pass that asks each once); Hide
 * removes the card and the choice survives a reload; Settings puts it back.
 *
 *     node features/quiz-prep-cards/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/quiz-prep-cards/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* Basic-Pharmacokinetics' Quiz 5 and Quiz 4 (src/course.js lines 228-276, ac2eb73), as written. */
const PK = [{"id":"q5","name":"Quiz 5","when":"2026-10-19T08:00","minutes":24,"modules":[9,8],"covers":"Her last quiz, then an in-class review. Scope not stated; this card assumes the two lectures since Exam 2: PK-PD (12 Oct) and nonlinear pharmacokinetics (14 Oct).","quote":"Next session, we have our last quiz, quiz number 5, and then we will do kind of an in-class review.","said":["Nonlinear: with C<sub>p</sub> well below K<sub>M</sub> the drug behaves first order; well above K<sub>M</sub> it behaves zero order. Her poll put it the other way round and the answer was false.","V<sub>max</sub> and K<sub>M</sub> are constants for a given drug and patient; V<sub>max</sub> is a rate (amount per time), K<sub>M</sub> a concentration.","From two dose rates and their steady-state levels, find K<sub>M</sub>, then V<sub>max</sub>, then a dose rate for a target C<sub>ss</sub>: \"brush up on your algebra skills because we're gonna take this equation and rearrange it and solve for every piece of this.\"","Give a dose rate as amount per time, for the patient: 6.62 mg/kg/day for 65 kg is 430 mg/day; \"I don't wanna just see 1000 mg.\"","Half-life and clearance change with concentration: t<sub>½</sub> = V<sub>D</sub>({{frac:0.693|V<sub>max</sub>}})(K<sub>M</sub> + C<sub>p</sub>) and Cl = {{frac:V<sub>max</sub>|K<sub>M</sub> + C<sub>p</sub>}}, so clearance falls as concentration rises.","A nonlinear steady state takes 2 to 3 weeks to reach, not 3 to 5 half-lives.","Rounding: \"Don't panic if I ask you to round to the nearest 10\": 518.4 mg/day to the nearest 10 is 520.","The final: 40 questions, 20 multiple choice and 20 fill in the blank, 25% on PK-PD and nonlinear."],"src":"transcript 10-14 (quiz, review, final format, nonlinear content and her worked examples); transcript 09-23 (8 am start, 24-minute Quiz 3)"},{"id":"q4","name":"Quiz 4","when":"2026-10-05T08:00","minutes":24,"modules":[6,7],"covers":"The 30 September lecture (bioavailability and bioequivalence) and multiple dosing: repeated IV bolus, intermittent IV infusions and multiple oral doses.","quote":"this quiz will really only be today's stuff and the multiple oral dosing or multiple dosing, right? Cause we did multiple IV, multiple infusion, and multiple oral.","said":["Definitions, and the why: why multiple doses are given, why intermittent infusions are used, why F matters.","A few calculations, each meant to take 2 minutes or less: read the question for 30 seconds, decide the approach, then reach for the sheet.","Absolute bioavailability more than relative: \"We're gonna kind of focus more on the absolute bioavailability.\"","F = {{frac:AUC<sub>po</sub>|AUC<sub>IV</sub>}} × {{frac:D<sub>IV</sub>|D<sub>po</sub>}}: the IV AUC goes in the denominator. When the AUCs are to match, F = {{frac:D<sub>IV</sub>|D<sub>po</sub>}}, so the oral dose is {{frac:D<sub>IV</sub>|F}}, rounded to a strength that exists.","Write F as 0.55 or 55%, never .55: \"there should be no leading decimals\".","Multiple IV bolus: the peak at steady state is C<sub>0</sub> times the accumulation factor {{frac:1|1 − e<sup>−kτ</sup>}}; the trough is that peak times e<sup>−kτ</sup>. After the last dose, use the time since that dose in place of τ.","Intermittent infusions: the concentration from each infusion adds to what is left of the earlier ones.","Oral multiple dosing: t<sub>max</sub> at steady state depends on k, k<sub>a</sub> and τ. Know what changing the dose or the interval does to the steady-state level and to the peak-to-trough swing.","Exam 2 is Thursday 8 October. It is cumulative in the sense that a multiple-dose problem needs the single-dose skills; the exams weigh 27%, 27% and 33%.","Her Quizzes 2 and 3 were each 8 questions at 12.5 points: 4 word-only concept items and 4 numeric entries, each with a rounding rule (\"Round to the nearest tenth\") and a margin of error of 2% or 3%. On the Canvas quizzes the units are not typed.","On the exam, every calculated answer carries its units, and each question states how many decimal places it wants, in varying wording. Where the result is a dose, she wants a figure a patient can take: \"we might round it to 200 if there's a 175 or something that makes sense as opposed to 181. blah blah blah\"."],"src":"transcript 09-30 (quiz scope, emphasis, rules, rounding a dose); transcript 09-23 (8 am start, 24-minute Quiz 3); her graded Canvas Quiz 2 and Quiz 3 (format); units and decimal places on the exam as reported from class, 4 Oct"}];

const pad = n => String(n).padStart(2, '0');
const localISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(8, 0, 0, 0); return localISO(d); };

/* The scratch course's quizzes: Quiz 5 (modules [9, 8]) in 3 days, Quiz 4 (the
   first topic) tomorrow, and one that is over. `topic9` is the topic whose
   questions get module 9; the first question of the first topic gets module 8. */
function fixture(own, mutate){
  const q5 = Object.assign({}, PK[0], {id: 'qpt-q5', when: inDays(3)});
  const q4 = Object.assign({}, PK[1], {id: 'qpt-q4', when: inDays(1), topics: [own.topic1]});
  delete q4.modules;
  const past = {id: 'qpt-past', name: 'A quiz already sat', when: '2000-01-01T08:00', minutes: 24, topics: [own.topic1]};
  const list = [q5, q4, past];
  if(mutate) mutate(list);
  return list;
}
const dataFile = own => '/* the quiz-prep-cards test: modules 9 and 8 given to the course\'s own questions (scratch copy only) */\n' +
  `QUESTIONS.forEach(q => { if(q.topic === ${JSON.stringify(own.topic9)}) q.module = 9; });\n` +
  `QUESTIONS.find(q => q.id === ${JSON.stringify(own.first8)}).module = 8;\n`;
const courseLine = (own, list) =>
  "COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).filter(f => f !== 'qp_test_data.js').concat(['qp_test_data.js']);" +
  `COURSE.quizzes = ${JSON.stringify(list)};`;
const build = (label, own, list) => L.scratchBuild(label, {files: {'qp_test_data.js': dataFile(own)}, courseLine: courseLine(own, list)});

(async () => {
  console.log('\n=== the course\'s own quizzes ===');
  L.PAGE.need(NAME);
  const X = L.engine('({QUESTIONS, TOPICS, COURSE, FX})');
  const A = X.FX && X.FX.api('quiz-prep-cards');
  if(!check(!!A, 'the page carries quiz-prep-cards, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const list = A.quizzes();
  const bad = list.filter(qz => { const p = A.scopeOf(qz);
    return !p.length || p.some(q => !(qz.topics || []).includes(q.topic) && !(qz.modules || []).includes(q.module)); }).map(qz => qz.id);
  check(list.length && !bad.length, `every quiz covers at least one question, and only questions of the topics or modules it names (${list.length} quizzes)`, bad.join(', '));
  const liveN = list.filter(A.live).length, cardsN = (A.cardsHTML().match(/class="topic qpcard"/g) || []).length;
  check(cardsN === liveN, `one card per quiz still ahead and not hidden (${liveN} of ${list.length})`, {cardsN, liveN});
  const qz = {id: 'x', name: 'x', when: '2026-10-19T08:00', minutes: 24}, at = s => new Date(s).getTime();
  const said = [['2026-10-16T12:00', '3 days until the quiz.'], ['2026-10-18T23:59', '1 day until the quiz.'], ['2026-10-19T07:00', 'Quiz day is today.'],
                ['2026-10-19T08:10', 'The quiz is in progress.'], ['2026-10-19T08:30', 'This quiz is over.']];
  const wrong = said.filter(([t, want]) => A.countdown(qz, at(t)) !== want).map(([t, want]) => `${t}: "${A.countdown(qz, at(t))}", wanted "${want}"`);
  check(!wrong.length, `the days-left line at ${said.length} fixed times`, wrong.join('; '));
  check(A.ahead(qz, at('2026-10-19T08:23')) && !A.ahead(qz, at('2026-10-19T08:24')) && !A.ahead({when: ''}, 0),
        'a quiz is ahead until its start plus its minutes, and a quiz without a time is never shown');

  const T = X.TOPICS, kinds = t => new Set(X.QUESTIONS.filter(q => q.topic === t.id).map(q => q.type === 'numeric' ? 'calc' : 'concept'));
  const mixed = T.find(t => kinds(t).size === 2);
  const topic9 = (mixed || T[T.length - 1]).id, topic1 = T.find(t => t.id !== topic9 && X.QUESTIONS.some(q => q.topic === t.id)) || T[0];
  const own = {topic9, topic1: topic1.id, first8: X.QUESTIONS.find(q => q.topic === topic1.id).id, mixed: !!mixed};

  console.log('\n=== the build step stops on bad quiz data ===');
  const refusals = [
    ['no quizzes', l => l.splice(0), /reads COURSE\.quizzes/],
    ['a topic that TOPICS does not have', l => { l[1].topics = ['qpt-nowhere']; }, /topics names "qpt-nowhere", which TOPICS does not have/],
    ['a module no question carries', l => { l[0].modules = [9, 77]; }, /modules names 77, which no question carries/],
    ['a when that is not YYYY-MM-DDTHH:MM', l => { l[0].when = 'Monday 8 am'; }, /when is not a date and time/],
    ['two quizzes with one id', l => { l[2].id = l[1].id; }, /two quizzes have this id/],
    ['a field the module does not read', l => { l[1].module = [1]; }, /the field "module" is not one the module reads/],
    ['a tag other than sub, sup, b, i, em in a said line', l => { l[0].said = ['See <a href="x">this</a>.']; }, /carries the tag <a href="x">/],
    ['a tag in covers', l => { l[1].covers = 'Lectures <b>6</b> and 7'; }, /covers carries an HTML tag/]];
  for(const [label, mutate, want] of refusals){
    const r = build('qp-refuse', own, fixture(own, mutate));
    check(r.code !== 0 && want.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' Quiz 5 and Quiz 4 (Chromium) ===');
  const s = build('qp', own, fixture(own));
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test quizzes does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}});
    const ev = (f, a) => page.evaluate(f, a);
    await page.click('#nav button[data-v="topics"]');
    await page.waitForSelector('#v-topics .qpcard', {timeout: 5000}).catch(() => {});
    const cards = await ev(() => [...document.querySelectorAll('#v-topics .qpcard')].map(c => c.dataset.qp));
    check(JSON.stringify(cards) === JSON.stringify(['qpt-q5', 'qpt-q4']), 'a card for each of the two quizzes ahead, in the course\'s order, and none for the one already sat', cards);
    const c5 = await ev(() => { const c = document.querySelector('#v-topics .qpcard[data-qp="qpt-q5"]');
      return c && {head: c.querySelector('.qpname').textContent, quote: (c.querySelector('.qpquote') || {}).textContent || '',
        lis: [...c.querySelectorAll('.qpsaid li')].map(li => ({text: li.textContent, sub: li.querySelectorAll('sub').length, frac: li.querySelectorAll('.frac').length})),
        fit: !!FX.api('formulas-in-text'),
        src: (c.querySelector('.qpsrc') || {}).textContent || '', above: !!c.closest('#qpCards') && !!document.querySelector('#v-topics #qpCards + .filters, #v-topics #qpCards ~ .filters')}; });
    check(c5 && /^Quiz 5 — \w+day, /.test(c5.head) && c5.head.includes('3 days until the quiz.') && c5.head.includes(PK[0].covers),
          'the card names the quiz, its day and time, the days left and what it covers', c5 && c5.head);
    check(c5 && c5.quote === `“${PK[0].quote}”` && c5.src === PK[0].src, 'the card carries the professor\'s words and the source', c5 && [c5.quote, c5.src]);
    check(c5 && c5.lis.length === PK[0].said.length && c5.lis[0].sub === 3, `every said line is listed (${PK[0].said.length}), with <sub> kept`, c5 && c5.lis.length);
    if(c5 && c5.fit) check(c5.lis[4].frac === 2 && !c5.lis.some(l => l.text.includes('{{')), 'formulas-in-text is on: the two {{frac:a|b}} of said line 5 are stacked', c5.lis[4]);
    else check(c5 && c5.lis[4].text.includes('(0.693)/(Vmax)') && !c5.lis.some(l => l.text.includes('{{')), '{{frac:a|b}} is written (a)/(b) when formulas-in-text is off', c5 && c5.lis[4].text);
    check(c5 && c5.above, 'the cards sit above the Topics filters');

    const drill = async (how, k) => {
      await page.click('#nav button[data-v="topics"]');
      await page.click(`#v-topics button[data-qpquiz="qpt-q5"][data-how="${how}"][data-k="${k}"]`);
      return ev(() => ({view: VIEW, label: Q.label, ids: Q.pool.map(q => q.id), types: Q.pool.map(q => q.type || ''), mods: Q.pool.map(q => q.module),
        sweep: Q.sweep || null, stem: !!document.querySelector('#v-quiz .stem'), scope: FX.api('quiz-prep-cards').scopeOf(COURSE.quizzes[0]).map(q => q.id)}));
    };
    const all = await drill('adaptive', '');
    check(all.view === 'quiz' && all.stem && all.label === 'Quiz 5 prep' && all.ids.length === all.scope.length && all.mods.every(m => m === 9 || m === 8),
          `Everything on this quiz starts the drill on the quiz's ${all.scope.length} questions, of modules 9 and 8 only`, all);
    if(own.mixed){
      const con = await drill('adaptive', 'concept'), calc = await drill('adaptive', 'calc');
      check(con.ids.length && con.types.every(t => t !== 'numeric') && calc.ids.length && calc.types.every(t => t === 'numeric') &&
            con.ids.length + calc.ids.length === all.scope.length && calc.label === 'Quiz 5 prep — calculations',
            `the concepts drill (${con.ids.length}) has no typed number and the calculations drill (${calc.ids.length}) only typed numbers`, {con, calc});
    } else L.skip('the concepts and calculations drills', 'no topic of the course has both kinds');
    const sw = await drill('sweep', '');
    check(sw.sweep && sw.sweep.length === sw.scope.length && new Set(sw.sweep).size === sw.sweep.length && sw.sweep.every(id => sw.scope.includes(id)),
          'the straight pass queues each of the quiz\'s questions once', sw.sweep);

    await page.click('#nav button[data-v="topics"]');
    await page.click('#v-topics button[data-qphide="qpt-q5"]');
    const afterHide = await ev(() => [...document.querySelectorAll('#v-topics .qpcard')].map(c => c.dataset.qp));
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.click('#nav button[data-v="topics"]');
    const afterReload = await ev(() => [...document.querySelectorAll('#v-topics .qpcard')].map(c => c.dataset.qp));
    check(JSON.stringify(afterHide) === '["qpt-q4"]' && JSON.stringify(afterReload) === '["qpt-q4"]', 'Hide removes the card and the choice survives a reload', {afterHide, afterReload});
    await page.click('#nav button[data-v="settings"]');
    const set = await ev(() => { const b = document.querySelector('#v-settings [data-feature="quiz-prep-cards"]'); return b ? b.textContent : ''; });
    check(/Show the hidden quiz card again/.test(set) && /Quiz 5/.test(set), 'Settings offers to put the hidden card back, by name', set.slice(0, 200));
    await page.click('#v-settings #qpUnhide');
    const set2 = await ev(() => document.querySelector('#v-settings [data-feature="quiz-prep-cards"]').textContent);
    await page.click('#nav button[data-v="topics"]');
    const back = await ev(() => [...document.querySelectorAll('#v-topics .qpcard')].map(c => c.dataset.qp));
    check(JSON.stringify(back) === '["qpt-q5","qpt-q4"]' && /No card is hidden/.test(set2), 'the card is back on Topics and Settings says no card is hidden', {back, set2: set2.slice(0, 120)});
    check(!errors.length && !(await ev(() => FX.errors.length)), 'no page error and no module error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
