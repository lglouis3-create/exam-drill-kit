/* quiz-prep-cards: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * The fixture, FIX below, is Basic-Pharmacokinetics' own course data at ac2eb73,
 * copied as it is: COURSE.quizzes (src/course.js, Quiz 5 and Quiz 4, with their real
 * dates and modules), 15 of the 18 questions of the professor's graded Quiz 4 and
 * Quiz 5 (src/q13_quizzes.js) with the 5 questions their dupOf fields name
 * (src/q8_module6b.js, q12_module7.js, q15_module7b.js, q16_module8.js), the 6
 * TOPICS entries and the 5 COURSE.lectures entries those questions name, and the
 * COURSE.skills entries they name. Left out, not changed, because the kit core's bank
 * check refuses them as written: cq4-1 (its cite names no lecture deck), pd-c13 and
 * nl-c01 (true/false items with 2 options; the core asks for 3 or more), and cq5-2,
 * pd-c14, cq5-5 and nl-c09, whose dupOf chains reach those two. The one change: every `prof` is the template's "Professor". The
 * module's course for the kit's checks (ci/oncourse.js) is built from this fixture.
 * The quizzes are in the past, so the test sets the page's clock (an init script
 * that moves `Date` to a fixed local time) and leaves the dates as written.
 *
 * On the course's own data: every quiz in COURSE.quizzes covers at least one
 * question and only questions of the topics or modules it names; the page has one
 * card per quiz still ahead and not hidden.
 * On Quiz 5 of the fixture: the days-left line at 5 fixed times and the end of the
 * quiz at its start plus its minutes (Basic-Pharmacokinetics src/views.js
 * examCountdown, lines 2409-2417, and quizAhead, line 480).
 * The build step: no quizzes, a topic that TOPICS does not have, a module no
 * question carries, a quiz that covers no question, a `when` that is not
 * YYYY-MM-DDTHH:MM, `minutes` below 0, an id with a space, two quizzes with one id,
 * a field the module does not read, `said` that is not a list, a tag other than
 * <sub>, <sup>, <b>, <i>, <em> in a said line, and a tag in `covers` each stop the
 * build with that reason.
 * On a scratch copy with the fixture, in Chromium (src/review_test.py lines 76-108
 * ported, without the practice paper, which this module does not have): with the
 * clock on Fri 2 Oct 2026 a card for each quiz, in the course's order; on 12 Oct
 * none for Quiz 4, which is over; on 19 Oct the quiz-day, in-progress and over
 * states of Quiz 5; the card's day, days left, covers, quote, source and every said
 * line, with <sub> kept and {{frac:a|b}} written (a)/(b) when formulas-in-text is
 * off, stacked when it is on; the quiz's drills hold only its questions (concepts
 * only, calculations only, everything, and a straight pass that asks each once);
 * Hide removes the card and the choice survives a reload; Settings names the hidden
 * quiz, puts it back, and does not list a hidden quiz that is over.
 * Persistence (the hide flag is stored per browser, NS:quizhide:<id>, as in
 * Basic-Pharmacokinetics; the answers are the core's): 18 answers given in the
 * quiz drills come back after Export and Import into a fresh browser, where the
 * hidden card is shown again; a profile switch keeps each profile's answers and the
 * hidden card stays hidden; a reload right after Hide and 400 ms after it keeps
 * the card hidden; with storage full (QuotaExceededError) and with storage denied
 * (SecurityError) a Hide shows the core's notice, the card is hidden for the visit,
 * the flags and answers already saved are unchanged, and after storage works again
 * they load.
 *
 *     node features/quiz-prep-cards/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/quiz-prep-cards/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* Basic-Pharmacokinetics at ac2eb73, as written; prof set to "Professor" (see above). */
/*FIX*/

const Q5 = FIX.quizzes.find(z => z.id === 'q5'), Q4 = FIX.quizzes.find(z => z.id === 'q4');
const idsOf = mods => FIX.qs.filter(q => mods.includes(q.module)).map(q => q.id);

/* The page's clock: `Date` moved to a fixed local time when the page loads; it runs
   on from there. window.__qpSetNow(iso) moves it again in the page. */
const clockAt = iso => `(() => { const D = Date; let o = new D(${JSON.stringify(iso)}).getTime() - D.now();
  function F(...a){ if(!new.target) return new D(D.now() + o).toString(); return a.length ? new D(...a) : new D(D.now() + o); }
  F.prototype = D.prototype; F.now = () => D.now() + o; F.parse = D.parse; F.UTC = D.UTC;
  window.Date = F; window.__qpSetNow = s => { o = new D(s).getTime() - D.now(); }; })();`;
/* setItem throws while window.__deny is 'quota' (a full origin) or 'denied' (blocked site data). */
const DENY = `(() => { const real = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if(window.__deny === 'quota') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    if(window.__deny === 'denied') throw new DOMException('The operation is insecure.', 'SecurityError');
    return real.call(this, k, v); }; })();`;

/* The scratch copy: the fixture's topics, questions, lectures and skills that the
   course does not already have, and COURSE.quizzes set to the fixture's quizzes. */
const dataFile = () => '/* the quiz-prep-cards test: Basic-Pharmacokinetics data (scratch copy only) */\n{ const F = ' + JSON.stringify({topics: FIX.topics, qs: FIX.qs}) + ';\n' +
  'F.topics.forEach(t => { if(!TOPICS.some(x => x.id === t.id)) TOPICS.push(t); });\n' +
  'F.qs.forEach(q => { if(!QUESTIONS.some(x => x.id === q.id)) QUESTIONS.push(q); }); }\n';
const courseLine = list =>
  "COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).filter(f => f !== 'qp_test_data.js').concat(['qp_test_data.js']);" +
  `{ const F = ${JSON.stringify({lectures: FIX.lectures, skills: FIX.skills})};` +
  ' COURSE.lectures = (COURSE.lectures || []).concat(F.lectures.filter(l => !(COURSE.lectures || []).some(x => x.id === l.id)));' +
  ' COURSE.skills = (COURSE.skills || []).concat(F.skills.filter(s => !(COURSE.skills || []).some(x => x.id === s.id))); }' +
  `COURSE.quizzes = ${JSON.stringify(list)};`;
const fixture = mutate => { const list = JSON.parse(JSON.stringify(FIX.quizzes)); if(mutate) mutate(list); return list; };
const build = (label, list) => L.scratchBuild(label, {files: {'qp_test_data.js': dataFile()}, courseLine: courseLine(list)});

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

  console.log('\n=== Quiz 5 of the fixture: the days left and the end of the quiz ===');
  const at = s => new Date(s).getTime();
  const said = [['2026-10-16T12:00', '3 days until the quiz.'], ['2026-10-18T23:59', '1 day until the quiz.'], ['2026-10-19T07:00', 'Quiz day is today.'],
                ['2026-10-19T08:10', 'The quiz is in progress.'], ['2026-10-19T08:30', 'This quiz is over.']];
  const wrong = said.filter(([t, want]) => A.countdown(Q5, at(t)) !== want).map(([t, want]) => `${t}: "${A.countdown(Q5, at(t))}", wanted "${want}"`);
  check(!wrong.length, `the days-left line for Quiz 5 (${Q5.when}, ${Q5.minutes} minutes) at ${said.length} fixed times`, wrong.join('; '));
  check(A.ahead(Q5, at('2026-10-19T08:23')) && !A.ahead(Q5, at('2026-10-19T08:24')),
        `Quiz 5 is ahead until its start plus its ${Q5.minutes} minutes (08:24), and not after`);

  console.log('\n=== the build step stops on bad quiz data ===');
  const refusals = [
    ['no quizzes', l => l.splice(0), /reads COURSE\.quizzes/],
    ['a topic that TOPICS does not have', l => { l[1].topics = ['qpt-nowhere']; }, /topics names "qpt-nowhere", which TOPICS does not have/],
    ['a module no question carries', l => { l[0].modules = [9, 77]; }, /modules names 77, which no question carries/],
    ['a quiz that covers no question', l => { l[1].modules = []; }, /q4: the bank holds no question on the topics or modules it names/],
    ['a when that is not YYYY-MM-DDTHH:MM', l => { l[0].when = 'Monday 8 am'; }, /when is not a date and time/],
    ['minutes below 0', l => { l[0].minutes = -24; }, /minutes is not a number of 0 or more/],
    ['an id with a space', l => { l[0].id = 'quiz 5'; }, /id is not letters, digits, - or _/],
    ['two quizzes with one id', l => { l[1].id = l[0].id; }, /two quizzes have this id/],
    ['a field the module does not read', l => { l[1].module = [6]; }, /the field "module" is not one the module reads/],
    ['said that is not a list', l => { l[0].said = l[0].said[0]; }, /said is not a list of text/],
    ['a tag other than sub, sup, b, i, em in a said line', l => { l[0].said = ['See <a href="x">this</a>.']; }, /carries the tag <a href="x">/],
    ['a tag in covers', l => { l[1].covers = 'Lectures <b>6</b> and 7'; }, /covers carries an HTML tag/]];
  for(const [label, mutate, want] of refusals){
    const r = build('qp-refuse', fixture(mutate));
    check(r.code !== 0 && want.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' Quiz 5 and Quiz 4 (Chromium) ===');
  const s = build('qp', fixture());
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the fixture does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  const VIEW = {viewport: {width: 1100, height: 1300}, acceptDownloads: true};
  const open = (iso, more) => L.openPage(browser, s.page, VIEW, clockAt(iso) + (more || ''));
  const cardIds = page => page.evaluate(async () => { show('topics'); await new Promise(r => setTimeout(r, 30)); return [...document.querySelectorAll('#v-topics .qpcard')].map(c => c.dataset.qp); });
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'qp-test-'));
  try {
    const {ctx, page, errors} = await open('2026-10-02T12:00');
    const ev = (f, a) => page.evaluate(f, a);
    const cards = await cardIds(page);
    check(JSON.stringify(cards) === '["q5","q4"]', 'Fri 2 Oct 2026: a card for each of the two quizzes ahead, in the course\'s order', cards);
    const card = id => ev(id => { const c = document.querySelector(`#v-topics .qpcard[data-qp="${id}"]`);
      return c && {head: c.querySelector('.qpname').textContent, quote: (c.querySelector('.qpquote') || {}).textContent || '',
        lis: [...c.querySelectorAll('.qpsaid li')].map(li => ({text: li.textContent, sub: li.querySelectorAll('sub').length, sup: li.querySelectorAll('sup').length, frac: li.querySelectorAll('.frac').length})),
        rows: [...c.querySelectorAll('.subrow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()),
        hideTitle: (c.querySelector('[data-qphide]') || {}).title || '',
        fit: !!FX.api('formulas-in-text'), src: (c.querySelector('.qpsrc') || {}).textContent || '',
        prev: (() => { const b = c.closest('#qpCards'), p = b && b.previousElementSibling; return p ? (p.id || p.className) : ''; })(),
        filtersAfter: !!document.querySelector('#v-topics #qpCards ~ .filters')}; }, id);
    const c5 = await card('q5'), c4 = await card('q4');
    check(c5 && /^Quiz 5 — Monday, Oct 19, 8:00\sAM/.test(c5.head) && c5.head.includes('17 days until the quiz. ' + Q5.covers),
          'the Quiz 5 card names the quiz, its day and time, the days left (17) and what it covers', c5 && c5.head);
    check(c4 && /^Quiz 4 — Monday, Oct 5, 8:00\sAM/.test(c4.head) && c4.head.includes('3 days until the quiz. ' + Q4.covers),
          'the Quiz 4 card says 3 days until the quiz', c4 && c4.head);
    check(c5 && c5.quote === `“${Q5.quote}”` && c5.src === Q5.src, 'the card carries the professor\'s words and the source', c5 && [c5.quote, c5.src]);
    const subs = t => (t.match(/<sub>/g) || []).length, sups = t => (t.match(/<sup>/g) || []).length;
    check(c5 && c4 && c5.lis.length === Q5.said.length && c4.lis.length === Q4.said.length &&
          c5.lis.every((l, i) => l.sub === subs(Q5.said[i])) && c4.lis.every((l, i) => l.sub === subs(Q4.said[i]) && l.sup === sups(Q4.said[i])),
          `every said line is listed (${Q5.said.length} and ${Q4.said.length}), with each <sub> and <sup> kept`, c5 && c5.lis.map(l => l.sub));
    if(c5 && c5.fit) check(c5.lis[4].frac === 2 && !c5.lis.some(l => l.text.includes('{{')), 'formulas-in-text is on: the two {{frac:a|b}} of said line 5 are stacked', c5.lis[4]);
    else check(c5 && c5.lis[4].text.includes('VD((0.693)/(Vmax))') && c4.lis[3].text.includes('(DIV)/(F)') && !c5.lis.concat(c4.lis).some(l => l.text.includes('{{')),
               '{{frac:a|b}} is written (a)/(b) when formulas-in-text is off', c5 && c5.lis[4].text);
    check(c5 && c5.filtersAfter && /^(news|stamp)$/.test(c5.prev), 'the cards sit under the build stamp or the What\'s new card, above the Topics filters', c5 && c5.prev);
    check(c5 && c5.hideTitle === 'Hide the Quiz 5 prep card on this browser until the quiz is over', 'the Hide button says what it hides', c5 && c5.hideTitle);
    const k5 = await ev(() => { const A = FX.api('quiz-prep-cards'), p = A.scopeOf(COURSE.quizzes.find(z => z.id === 'q5'));
      return {all: p.length, calc: p.filter(q => q.type === 'numeric').length}; });
    k5.con = k5.all - k5.calc;
    const qs = n => `${n} question${n === 1 ? '' : 's'}`;
    check(c5 && k5.con && k5.calc && c5.rows.length === 4 && c5.rows[0].startsWith(`Concepts on this quiz, adaptive${qs(k5.con)}, no arithmetic`) &&
          c5.rows[1].startsWith(`Calculations on this quiz, adaptive${qs(k5.calc)}, each worked to a number`) &&
          c5.rows[2].startsWith(`Everything on this quiz, adaptive${qs(k5.all)} — `) && c5.rows[3].startsWith(`Straight pass${qs(k5.all)}, each asked once`),
          `the Quiz 5 card offers concepts (${k5.con}), calculations (${k5.calc}), everything (${k5.all}) and a straight pass (${k5.all})`, c5 && c5.rows);

    const drill = async (quiz, how, k) => {
      await page.click('#nav button[data-v="topics"]');
      await page.click(`#v-topics button[data-qpquiz="${quiz}"][data-how="${how}"][data-k="${k}"]`);
      return ev(quiz => ({view: VIEW, label: Q.label, ids: Q.pool.map(q => q.id), types: Q.pool.map(q => q.type || ''), mods: Q.pool.map(q => q.module),
        sweep: Q.sweep || null, stem: !!document.querySelector('#v-quiz .stem'), cur: Q.current && Q.current.id,
        scope: FX.api('quiz-prep-cards').scopeOf(COURSE.quizzes.find(z => z.id === quiz)).map(q => q.id)}), quiz);
    };
    const want5 = idsOf(Q5.modules), want4 = idsOf(Q4.modules);
    const all = await drill('q5', 'adaptive', '');
    check(all.view === 'quiz' && all.stem && all.label === 'Quiz 5 prep' && all.ids.length === all.scope.length && all.mods.every(m => Q5.modules.includes(m)) &&
          want5.every(id => all.ids.includes(id)) && all.ids.includes(all.cur),
          `Everything on this quiz starts the drill on Quiz 5's ${all.scope.length} questions: every fixture question of modules ${Q5.modules.join(' and ')}, and only those modules`, all);
    const con = await drill('q5', 'adaptive', 'concept'), calc = await drill('q5', 'adaptive', 'calc');
    check(con.ids.length && con.types.every(t => t !== 'numeric') && calc.ids.length && calc.types.every(t => t === 'numeric') &&
          con.ids.length + calc.ids.length === all.scope.length && con.label === 'Quiz 5 prep — concepts' && calc.label === 'Quiz 5 prep — calculations',
          `the concepts drill (${con.ids.length}) has no typed number and the calculations drill (${calc.ids.length}) only typed numbers`, {con, calc});
    const sw = await drill('q4', 'sweep', '');
    check(sw.sweep && sw.sweep.length === sw.scope.length && new Set(sw.sweep).size === sw.sweep.length && sw.sweep.every(id => sw.scope.includes(id)) &&
          want4.every(id => sw.sweep.includes(id)) && sw.label === 'Quiz 4 prep',
          `the Quiz 4 straight pass queues each of its ${sw.scope.length} questions once`, sw.sweep);

    await page.click('#nav button[data-v="topics"]');
    await page.click('#v-topics button[data-qphide="q5"]');
    const afterHide = await cardIds(page);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const afterReload = await cardIds(page);
    check(JSON.stringify(afterHide) === '["q4"]' && JSON.stringify(afterReload) === '["q4"]', 'Hide removes the card and the choice survives a reload', {afterHide, afterReload});
    await page.click('#nav button[data-v="settings"]');
    const set = await ev(() => { const b = document.querySelector('#v-settings [data-feature="quiz-prep-cards"]'); return b ? b.textContent : ''; });
    check(/Show the hidden quiz card again/.test(set) && /Topics: Quiz 5\./.test(set), 'Settings offers to put the hidden card back, by name', set.slice(0, 240));
    await page.click('#v-settings #qpUnhide');
    const set2 = await ev(() => document.querySelector('#v-settings [data-feature="quiz-prep-cards"]').textContent);
    const back = await cardIds(page);
    check(JSON.stringify(back) === '["q5","q4"]' && /No card is hidden/.test(set2), 'the card is back on Topics and Settings says no card is hidden', {back, set2: set2.slice(0, 120)});
    check(!errors.length && !(await ev(() => FX.errors.length)), 'no page error and no module error', errors.slice(0, 3).join(' | '));
    await ctx.close();

    // a quiz that is over has no card, and Settings does not offer a hidden card of a quiz that is over
    {
      const {ctx, page, errors} = await open('2026-10-12T12:00');
      const ids = await cardIds(page);
      const head = await page.evaluate(() => (document.querySelector('#v-topics .qpcard .qpname') || {}).textContent || '');
      check(JSON.stringify(ids) === '["q5"]' && head.includes('7 days until the quiz.'), 'Mon 12 Oct: no card for Quiz 4, which is over; Quiz 5 is 7 days away', {ids, head});
      const set = await page.evaluate(() => { localStorage.setItem(NS + ':quizhide:q4', '1'); show('settings');
        return document.querySelector('#v-settings [data-feature="quiz-prep-cards"]').textContent; });
      check(/No card is hidden/.test(set), 'a hidden card of a quiz that is over is not offered back in Settings', set.slice(0, 160));
      const states = [];
      for(const t of ['2026-10-19T07:00', '2026-10-19T08:10', '2026-10-19T08:24'])
        states.push(await page.evaluate(async t => { window.__qpSetNow(t); show('settings'); show('topics'); await new Promise(r => setTimeout(r, 30));
          const n = document.querySelector('#v-topics .qpcard[data-qp="q5"] .qpname'); return n ? n.textContent : 'no card'; }, t));
      check(states[0].includes('Quiz day is today.') && states[1].includes('The quiz is in progress.') && states[2] === 'no card',
            'Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes', states);
      check(!errors.length, 'no page error with the clock moved', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }

    console.log('\n=== persistence: Export and Import, a profile switch, reloads ===');
    const answerAll = (page, quiz) => page.evaluate(async quiz => {
      show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector(`#v-topics button[data-qpquiz="${quiz}"][data-how="sweep"]`).click();
      for(let i = 0; i < 40 && Q.current; i++){
        const q = Q.current;
        if(q.type === 'numeric'){ const inp = document.getElementById('numIn'); inp.value = String(i % 3 ? q.answer : q.answer * 2); document.getElementById('btnCheck').click(); }
        else if(isMulti(q)){ for(const j of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${j}"]`).click(); document.getElementById('btnCheck').click(); }
        else document.querySelectorAll('#v-quiz button[data-o]')[i % 2].click();
        const nx = document.getElementById('btnNext'); if(!nx) break; nx.click();
        if(Q.sweep && Q.i >= Q.sweep.length && !Q.current) break;
      }
      return DB.answers.length;
    }, quiz);
    const snap = page => page.evaluate(() => ({who: PROFILE, answers: DB.answers.map(a => a.qid + ':' + a.result), concepts: Object.keys(DB.concepts).sort()}));
    {
      const {ctx, page, errors} = await open('2026-10-02T12:00');
      const n5 = await answerAll(page, 'q5'), n = await answerAll(page, 'q4');
      await page.waitForTimeout(400);
      await page.evaluate(async () => { show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector('#v-topics button[data-qphide="q4"]').click(); });
      const mine = await snap(page);
      check(n5 === want5.length && n === want5.length + want4.length && mine.answers.every(a => FIX.qs.some(q => a.startsWith(q.id + ':'))),
            `the two straight passes record ${n} answers (${n5} on Quiz 5, ${n - n5} on Quiz 4), all on the quizzes' questions`, {n5, n});
      await page.click('#nav button[data-v="settings"]');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
      const file = path.join(tmp, 'progress.json');
      await dl.saveAs(file);
      const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
      check(exp.db && exp.db.answers.length === n && !JSON.stringify(exp).includes('quizhide'),
            `Export writes the ${n} answers; the hide flag is not in it (it is kept per browser)`, {answers: exp.db && exp.db.answers.length});
      // a profile switch: each profile keeps its own answers; the hide flag is the browser's, so it holds for both
      await page.evaluate(() => { window.__name = 'Other'; });
      await page.click('#btnWho');
      const other = await snap(page), otherCards = await cardIds(page);
      await page.evaluate(who => { window.__name = who; }, mine.who);
      await page.click('#btnWho');
      const again = await snap(page), againCards = await cardIds(page);
      check(other.answers.length === 0 && JSON.stringify(again.answers) === JSON.stringify(mine.answers) && again.who === mine.who,
            `a profile switch: the other profile has no answers, and switching back brings the ${n} answers back`, {other: other.answers.length, back: again.answers.length});
      check(JSON.stringify(otherCards) === '["q5"]' && JSON.stringify(againCards) === '["q5"]', 'the hidden Quiz 4 card stays hidden in both profiles (one browser)', {otherCards, againCards});
      // reloads right after a change
      await page.evaluate(async () => { show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector('#v-topics button[data-qphide="q5"]').click(); location.reload(); });
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const fast = await cardIds(page);
      await page.evaluate(async () => { show('settings'); document.getElementById('qpUnhide').click(); show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector('#v-topics button[data-qphide="q5"]').click(); });
      await page.waitForTimeout(400);
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const slow = await cardIds(page);
      check(JSON.stringify(fast) === '[]' && JSON.stringify(slow) === '["q4"]', 'a reload at once (under 150 ms) and 400 ms after Hide keeps the hidden card hidden (Quiz 5 both times; Quiz 4 shows again after Show again)', {fast, slow});
      // the core's 150 ms save: an answer and a reload at once, then one 400 ms later
      const before = (await snap(page)).answers.length;
      await page.evaluate(async () => { show('settings'); document.getElementById('qpUnhide').click(); show('topics'); await new Promise(r => setTimeout(r, 30));
        document.querySelector('#v-topics button[data-qpquiz="q5"][data-how="sweep"]').click();
        const q = Q.current; if(q.type === 'numeric'){ document.getElementById('numIn').value = String(q.answer); document.getElementById('btnCheck').click(); }
        else if(isMulti(q)){ for(const j of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${j}"]`).click(); document.getElementById('btnCheck').click(); }
        else document.querySelector('#v-quiz button[data-o]').click();
        location.reload(); });
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const quick = (await snap(page)).answers.length;
      await page.evaluate(async () => { show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector('#v-topics button[data-qpquiz="q5"][data-how="sweep"]').click();
        const q = Q.current; if(q.type === 'numeric'){ document.getElementById('numIn').value = String(q.answer); document.getElementById('btnCheck').click(); }
        else if(isMulti(q)){ for(const j of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${j}"]`).click(); document.getElementById('btnCheck').click(); }
        else document.querySelector('#v-quiz button[data-o]').click(); });
      await page.waitForTimeout(400);
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const late = (await snap(page)).answers.length;
      console.log(`  note  an answer followed at once by a reload: ${quick - before} of 1 kept (the core saves 150 ms after the last change); 400 ms later: ${late - quick} of 1 kept`);
      check(late === quick + 1, 'an answer in a quiz drill is saved 400 ms later and survives a reload', {before, quick, late});
      check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
      await ctx.close();

      // Import into a fresh browser: the answers come back; the hide flag does not travel
      const fresh = await open('2026-10-02T12:00', 'window.__name = "Fresh";');
      await fresh.page.click('#nav button[data-v="settings"]');
      await fresh.page.setInputFiles('#fileIn', file);
      await fresh.page.waitForFunction(n => DB.answers.length === n, n, {timeout: 5000}).catch(() => {});
      const got = await snap(fresh.page), freshCards = await cardIds(fresh.page);
      check(JSON.stringify(got.answers) === JSON.stringify(mine.answers) && JSON.stringify(got.concepts) === JSON.stringify(mine.concepts),
            `Import into a fresh browser brings the same ${mine.answers.length} answers and ${mine.concepts.length} concepts back`, {got: got.answers.length, concepts: got.concepts.length});
      check(JSON.stringify(freshCards) === '["q5","q4"]', 'in the fresh browser both cards show: a hidden card is hidden on its own browser only', freshCards);
      await fresh.ctx.close();
    }

    console.log('\n=== persistence: storage full and storage denied ===');
    for(const mode of ['quota', 'denied']){
      const {ctx, page, errors} = await open('2026-10-02T12:00', DENY);
      await page.evaluate(async () => { show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector('#v-topics button[data-qphide="q4"]').click(); });
      const n = await answerAll(page, 'q5');
      await page.waitForTimeout(400);
      const saved = await page.evaluate(() => ({flag: localStorage.getItem(NS + ':quizhide:q4'), answers: JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE)).answers.length}));
      await page.evaluate(async m => { window.__deny = m; show('topics'); await new Promise(r => setTimeout(r, 30)); document.querySelector('#v-topics button[data-qphide="q5"]').click(); }, mode);
      const during = await page.evaluate(() => ({cards: [...document.querySelectorAll('#v-topics .qpcard')].map(c => c.dataset.qp),
        warn: (document.getElementById('savewarn') || {}).textContent || '', flag4: localStorage.getItem(NS + ':quizhide:q4'), flag5: localStorage.getItem(NS + ':quizhide:q5'),
        answers: JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE)).answers.length}));
      check(/did not save your progress/.test(during.warn) && JSON.stringify(during.cards) === '[]',
            `${mode}: Hide shows the notice that nothing was saved, and the card is hidden for this visit`, during);
      check(saved.flag === '1' && during.flag4 === '1' && during.flag5 === null && during.answers === saved.answers && saved.answers === n,
            `${mode}: the saved Quiz 4 flag and the ${n} saved answers are unchanged`, {saved, during});
      await page.evaluate(() => { window.__deny = null; });
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const after = await cardIds(page), left = await page.evaluate(() => DB.answers.length);
      check(JSON.stringify(after) === '["q5"]' && left === n, `${mode}: with storage working again, the saved flag and the ${n} answers load; the Hide that was not saved is not applied`, {after, left});
      check(!errors.length, `${mode}: no page error`, errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
  } finally {
    await browser.close();
    s.rm();
    fs.rmSync(tmp, {recursive: true, force: true});
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
