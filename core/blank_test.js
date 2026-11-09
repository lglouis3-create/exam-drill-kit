/* Fill in the blank: the core item type `type:'blank'` (views.js gradeBlank,
 * blankBody; exam_typed.js on exam papers; build.py and test.js validation).
 *
 * In node, on the course's own engine: every grading rule. Case, spaces at the
 * ends, a run of spaces, hyphens or en dashes, a final period, the Greek letters
 * α β γ δ κ against their names, digits and the percent sign kept; a one-edit
 * miss of an accepted answer of 5 or more characters is wrong with the spelling
 * note, right with course.js `blank: {typo: 1}`; an answer under 5 characters
 * gets no leniency; two edits are wrong with no note.
 * On scratch copies of this source tree with blank items planted (a file
 * q96_blank_test.js), in the browser:
 *   - Quiz: the item shows a text box; Enter checks; the reveal shows the verdict,
 *     "Close: check the spelling" on a near miss, the answer and the accepted
 *     answers, and the explanation; the answer is recorded once with the typed
 *     text, in the answer history as item type 'blank'; a reload brings the
 *     answered question back answered with nothing recorded twice; Weak spots
 *     lists it with the typed answer and the accepted answers;
 *   - with `blank: {typo: 1}` the near miss is recorded right, with the note;
 *   - an exam with `typed: true`: blank items reach papers; on a fixed paper the
 *     answers are typed, kept through a reload, graded on submit, recorded with
 *     the typed text and shown on the result page with the accepted answers;
 *   - `blanks: n`: 40 papers each hold exactly n where the pools allow, every
 *     pool keeps its marks, dupOf partners never share a paper, and a bank with
 *     fewer gives all it can; `typed: false` keeps blank items off every paper;
 *   - validation: test.js passes the copy, and fails a copy whose blank item has
 *     no `accept`, an empty entry, or two entries the same once normalized; the
 *     build stops on `blanks` without `typed: true` and on a bad `blank` option.
 *
 *     node blank_test.js
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'blank_test.js';
const {check} = L;
L.PAGE.need(NAME);
const childEnv = Object.assign({}, process.env); delete childEnv.DRILL_PAGE;

console.log('\n=== grading (node) ===');
const X = L.engine('({blankNorm, gradeBlank, COURSE})');
const item = (...accept) => ({id: 'g', type: 'blank', accept});
const G = (acc, typed) => X.gradeBlank(item(...[].concat(acc)), typed);
const right = (acc, typed, label) => { const g = G(acc, typed); return check(g.ok && !g.near, label, g); };
const wrong = (acc, typed, label, near) => { const g = G(acc, typed); return check(!g.ok && g.near === !!near, label, g); };
const savedBlank = X.COURSE.blank;
X.COURSE.blank = undefined;
right('vitamin D', 'VITAMIN d', 'case does not matter');
right('vitamin D', '   vitamin D   ', 'spaces at either end are dropped');
right('vitamin D receptor', 'vitamin    D\treceptor', 'a run of spaces counts as one');
right('vitamin D', 'vitamin-D', 'a hyphen counts as a space');
right('vitamin D', 'vitamin–D', 'an en dash counts as a space');
right('vitamin-D', 'vitamin  -  D', 'spaces around a hyphen count as one space');
right('calcineurin', 'calcineurin.', 'a final period is dropped');
right('beta blocker', 'β-blocker', 'β reads as beta');
right('beta blocker', 'Β-blocker', 'capital Β reads as beta');
right('alpha1', 'α1', 'α reads as alpha');
right('gamma aminobutyric acid', 'γ-aminobutyric acid', 'γ reads as gamma');
right('delta opioid', 'δ opioid', 'δ reads as delta');
right('NF-kappaB', 'NF-κB', 'κ reads as kappa');
right('10%', '10%', 'the percent sign is kept and matches');
wrong('10%', '10', 'a missing percent sign is wrong');
wrong('10%', '11%', 'a different digit is wrong (the answer is under 5 characters)');
right(['vitamin D', 'VDR', 'vitamin D receptor'], 'vdr', 'any accepted entry matches');
wrong('calcineurin', '', 'an empty answer is wrong');
wrong('calcineurin', 'calcinurin', 'one letter left out of an answer of 5 or more: wrong, near miss', true);
wrong('calcineurin', 'calcineurim', 'one letter changed: wrong, near miss', true);
wrong('calcineurin', 'calcineeurin', 'one letter added: wrong, near miss', true);
wrong('calcineurin', 'calcinurim', 'two edits: wrong, no near miss');
wrong('VDR', 'VDE', 'an answer of 3 characters gets no near-miss leniency');
wrong('FKBP', 'FKBQ', 'an answer of 4 characters gets no near-miss leniency');
wrong('abcde', 'abcdf', 'an answer of exactly 5 characters gets the near miss', true);
X.COURSE.blank = {typo: 1};
{ const g = G('calcineurin', 'calcinurin'); check(g.ok && g.near, 'with blank: {typo: 1} a one-edit near miss is right, with the note', g); }
wrong('calcineurin', 'calcinurim', 'with typo: 1, two edits are still wrong');
wrong('VDR', 'VDE', 'with typo: 1, an answer under 5 characters still gets no leniency');
right('calcineurin', 'Calcineurin', 'with typo: 1, an exact answer is right with no note');
X.COURSE.blank = {typo: 0};
wrong('calcineurin', 'calcinurin', 'with blank: {typo: 0} the near miss is wrong (strict)', true);
X.COURSE.blank = savedBlank;

// the planted items: blank items in both topics, plain multiple-choice filler so two pools fill
const OPT = why => [{t: 'The right one', correct: true, why: why + ' This is the keyed answer.'},
  {t: 'A second option', correct: false, why: 'This option names something else in the planted bank.'},
  {t: 'A third option', correct: false, why: 'This option names something else in the planted bank too.'},
  {t: 'A fourth option', correct: false, why: 'This option names another thing in the planted bank.'}];
const QF = `;(() => {
  const T0 = TOPICS[0], T1 = TOPICS[1] || TOPICS[0], cite = 'Test (' + COURSE.lectures[0].deck + ') slide 1';
  const base = (id, t) => ({id, prof: COURSE.professors[0], tier: 'new', topic: t.id, sub: t.subs[0].id, concept: id, skill: COURSE.skills[0].id, source: 'slide', tags: [], cite});
  const blank = (id, t, stem, accept, extra) => QUESTIONS.push(Object.assign(base(id, t), {type: 'blank', stem, accept,
    why: 'The planted fill-in-the-blank item ' + id + ' has this explanation.'}, extra || {}));
  blank('bt-vdr', T0, 'Calcipotriene binds the ___ receptor.', ['vitamin D', 'VDR', 'vitamin D receptor']);
  blank('bt-cal', T0, 'Tacrolimus binds FKBP12, and the complex inactivates ___.', ['calcineurin']);
  blank('bt-sal', T0, 'Planted item three: the answer is ___.', ['tretinoin']);
  blank('bt-b4', T0, 'Planted item four: the answer is ___.', ['isotretinoin']);
  blank('bt-b5', T0, 'Planted item five: the answer is ___.', ['adapalene']);
  blank('bt-b6', T0, 'Planted item five, another wording: the answer is ___.', ['adapalene'], {dupOf: 'bt-b5'});
  blank('bt-o1', T1, 'Planted item in the second topic: the answer is ___.', ['tazarotene']);
  for(let k = 1; k <= 4; k++) for(const [t, n] of [[T0, 'a'], [T1, 'b']])
    QUESTIONS.push(Object.assign(base('bt-m' + n + k, t), {stem: 'Planted multiple-choice item ' + n + k + ': which one is right?',
      options: ${JSON.stringify(OPT('The planted filler item.'))}, teach: 'The planted filler items fill the pools.'}));
})();\n`;
// course.js runs before the question files, so the two pools name the topics by the ids q1_topics.js gives them
const topicIds = (fs.readFileSync(path.join(L.PAGE.SRC, 'q1_topics.js'), 'utf8').match(/\{\s*id\s*:\s*'[^']+'[^{}]*subs\s*:/g) || [])
  .map(t => t.match(/'([^']+)'/)[1]);
const paperLine = (typed, extra) => `COURSE.activeExam = COURSE.exams[0].id; Object.assign(COURSE.exams[0], {typed: ${typed}, questions: 10, sata: 0, blueprint: undefined,
  pools: [{key: 'a', name: 'First topic', marks: 5, filter: {topic: ${JSON.stringify(topicIds[0])}}}, {key: 'b', name: 'Second topic', marks: 5, filter: {topic: ${JSON.stringify(topicIds[1])}}}]}, ${extra || '{}'});`;

const testJs = src => child.spawnSync('node', ['test.js'], {cwd: src, encoding: 'utf8', env: childEnv, timeout: 300000});

(async () => {
  console.log('\n=== on scratch copies ===');
  if(topicIds.length < 2) L.notRun(NAME, 'the course has fewer than two topics in q1_topics.js, so the two-pool paper cannot be set up');
  const on = L.scratchBuild('blank-on', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(true, '{blanks: 3}')});
  const typo = L.scratchBuild('blank-typo', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(true) + 'COURSE.blank = {typo: 1};'});
  const off = L.scratchBuild('blank-off', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(false)});
  for(const [b, l] of [[on, 'typed: true, blanks: 3'], [typo, 'blank: {typo: 1}'], [off, 'typed: false']])
    if(!check(b.code === 0, `the scratch copy with ${l} builds`, b.out.split('\n').slice(-3).join(' | '))) L.finish(NAME);

  // validation, in node
  { const r = testJs(on.src);
    check(r.status === 0 && /fill-in-the-blank grading accepts every accepted answer/.test(r.stdout), 'test.js passes the copy with blank items on its papers', (r.stdout || '').split('\n').filter(l => /FAIL/.test(l)).slice(0, 4).join(' | ')); }
  const badCopy = (label, mutate, want) => {
    const b = L.scratchBuild('blank-bad', {files: {'q96_blank_test.js': QF + mutate + '\n'}, courseLine: paperLine(true)});
    if(!check(b.code === 0, `the copy with ${label} builds (test.js is what rejects it)`, b.out.split('\n').slice(-2).join(' | '))) return;
    const r = testJs(b.src);
    check(r.status === 1 && want.test(r.stdout), `test.js rejects a blank item with ${label}`, (r.stdout || '').split('\n').filter(l => /FAIL/.test(l)).slice(0, 3).join(' | '));
  };
  badCopy('no accept', `delete QUESTIONS.find(q => q.id === 'bt-cal').accept;`, /bt-cal: fill-in-the-blank item needs a non-empty `accept` list/);
  badCopy('an empty accept list', `QUESTIONS.find(q => q.id === 'bt-cal').accept = [];`, /bt-cal: fill-in-the-blank item needs a non-empty `accept` list/);
  badCopy('an empty entry', `QUESTIONS.find(q => q.id === 'bt-cal').accept.push('  ');`, /bt-cal: fill-in-the-blank `accept` holds an empty or non-text entry/);
  badCopy('two entries the same once normalized', `QUESTIONS.find(q => q.id === 'bt-vdr').accept.push('Vitamin-D.');`, /bt-vdr: fill-in-the-blank `accept` holds two entries that are the same once normalized/);
  { const b = L.scratchBuild('blank-nobuild', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(false, '{blanks: 2}')});
    check(b.code !== 0 && /`blanks` needs `typed: true`/.test(b.out), 'the build stops on `blanks` without `typed: true`', b.out.split('\n').slice(-2).join(' | ')); }
  { const b = L.scratchBuild('blank-nobuild', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(true) + 'COURSE.blank = {typo: 2};'});
    check(b.code !== 0 && /course.js `blank` takes only `typo`/.test(b.out), 'the build stops on `blank: {typo: 2}`', b.out.split('\n').slice(-2).join(' | ')); }

  const {browser} = await L.launch(NAME);
  const ready = page => page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  try {
    // ---- Quiz ----
    { const {ctx, page, errors} = await L.openPage(browser, on.page);
      check(await L.quizOn(page, 'bt-vdr'), 'the quiz opens on the blank item');
      const shown = await page.evaluate(() => ({input: !!document.getElementById('blankIn'), opts: document.querySelectorAll('#v-quiz button[data-o]').length,
        stem: (document.querySelector('#v-quiz .stem') || {}).textContent || ''}));
      check(shown.input && shown.opts === 0 && /___/.test(shown.stem), 'it shows the stem with its blank and a text box, no options', shown);
      await page.fill('#blankIn', 'vitamn D');
      await page.press('#blankIn', 'Enter');
      const r = await page.evaluate(() => ({verdict: (document.querySelector('#v-quiz .verdict') || {}).textContent || '', bad: !!document.querySelector('#v-quiz .verdict.bad'),
        text: document.getElementById('v-quiz').textContent, n: DB.answers.filter(a => a.qid === 'bt-vdr').length,
        last: DB.answers[DB.answers.length - 1], log: LOG[LOG.length - 1]}));
      check(r.bad && /Close: check the spelling/.test(r.verdict) && r.verdict.indexOf('Close') < r.verdict.indexOf('the answer is vitamin D'),
            'Enter checks: a near miss is wrong, and "Close: check the spelling" comes before the answer', r.verdict);
      check(/you wrote vitamn D/.test(r.verdict) && /Accepted answers: vitamin D · VDR · vitamin D receptor/.test(r.text), 'the reveal shows what was typed and every accepted answer');
      check(/has this explanation/.test(r.text) && /slide 1/.test(r.text), 'the reveal shows the explanation and the citation');
      check(r.n === 1 && r.last.qid === 'bt-vdr' && r.last.result === 'wrong' && r.last.picked === 'vitamn D', 'the answer is recorded once, wrong, with the typed text as what was picked', r.last);
      check(r.log && r.log[6] === 'blank', 'the answer history names the item type blank', r.log);
      await page.waitForTimeout(500);
      await page.reload(); await ready(page); await page.waitForTimeout(500);
      const back = await page.evaluate(() => ({view: VIEW, id: Q && Q.current && Q.current.id, rev: Q && Q.revealed, n: DB.answers.filter(a => a.qid === 'bt-vdr').length,
        verdict: (document.querySelector('#v-quiz .verdict') || {}).textContent || ''}));
      check(back.view === 'quiz' && back.id === 'bt-vdr' && back.rev && back.n === 1 && /Close: check the spelling/.test(back.verdict),
            'a reload brings the answered question back answered, with nothing recorded twice', back);
      // an exact answer, through the Check button
      check(await L.quizOn(page, 'bt-cal'), 'the quiz opens on a second blank item');
      await page.fill('#blankIn', ' Calcineurin. '); await page.click('#btnCheck');
      const r2 = await page.evaluate(() => ({ok: !!document.querySelector('#v-quiz .verdict.ok'), v: (document.querySelector('#v-quiz .verdict') || {}).textContent || '',
        last: DB.answers[DB.answers.length - 1], next: !!document.getElementById('btnNext')}));
      check(r2.ok && !/Close/.test(r2.v) && r2.last.result === 'correct' && r2.last.picked === 'Calcineurin.' && r2.next,
            'the Check button grades an exact answer right, with no spelling note, and offers Next', r2);
      // Weak spots: the miss with what was typed and the accepted answers
      const gaps = await page.evaluate(() => { show('gaps'); return document.getElementById('v-gaps').textContent; });
      check(/Calcipotriene binds the ___ receptor\./.test(gaps) && /You picked: vitamn D/.test(gaps) && /Answer: vitamin D · VDR · vitamin D receptor/.test(gaps),
            'Weak spots lists the missed blank item with its stem, the typed answer and the accepted answers');
      check(await page.evaluate(() => { const b = bankMarkdown(); return /Answer: vitamin D/.test(b) && /Also accepted: VDR · vitamin D receptor/.test(b); }),
            'the bank export carries the answer and the accepted answers');
      check(!errors.length, 'no page error in the quiz', errors.slice(0, 3).join(' | '));
      await ctx.close(); }

    // ---- blank: {typo: 1} ----
    { const {ctx, page, errors} = await L.openPage(browser, typo.page);
      await L.quizOn(page, 'bt-cal');
      await page.fill('#blankIn', 'calcinurin'); await page.press('#blankIn', 'Enter');
      const r = await page.evaluate(() => ({ok: !!document.querySelector('#v-quiz .verdict.ok'), v: (document.querySelector('#v-quiz .verdict') || {}).textContent || '',
        last: DB.answers[DB.answers.length - 1]}));
      check(r.ok && /Close: check the spelling/.test(r.v) && r.last.result === 'correct', 'with blank: {typo: 1} the near miss is recorded right, with the spelling note', r);
      await L.quizOn(page, 'bt-vdr');
      await page.fill('#blankIn', 'VDE'); await page.press('#blankIn', 'Enter');
      const s = await page.evaluate(() => ({bad: !!document.querySelector('#v-quiz .verdict.bad'), v: document.querySelector('#v-quiz .verdict').textContent}));
      check(s.bad && !/Close/.test(s.v), 'with typo: 1, a slip in a 3-character answer is still wrong, with no note', s);
      check(!errors.length, 'no page error with typo: 1', errors.slice(0, 3).join(' | '));
      await ctx.close(); }

    // ---- papers: the draw ----
    const BLANKS = ['bt-vdr', 'bt-cal', 'bt-sal', 'bt-b4', 'bt-b5', 'bt-b6', 'bt-o1'];
    const draws = (page, blanks) => page.evaluate(([blanks, ids]) => {
      if(blanks === 'unset') delete EXAM.blanks; else EXAM.blanks = blanks;
      const out = {sizes: [], counts: [], poolA: [], poolB: [], dup: 0, typesKept: true};
      for(let k = 0; k < 40; k++){
        const p = drawPaper(), on = new Set(p.map(q => q.id));
        out.sizes.push(p.length); out.counts.push(p.filter(q => q.type === 'blank').length);
        out.poolA.push(p.filter(EXAM.pools[0].test).length); out.poolB.push(p.filter(EXAM.pools[1].test).length);
        if(on.has('bt-b5') && on.has('bt-b6')) out.dup++;
        if(on.size !== p.length) out.dup += 100;
      }
      out.typesKept = ids.every(id => byId(id).type === 'blank' && byId(id)._paperType === undefined);
      return out;
    }, [blanks, BLANKS]);
    const same = (a, v) => a.every(x => x === v);
    { const o = await L.openPage(browser, off.page);
      const d = await draws(o.page, 'unset');
      check(same(d.counts, 0) && same(d.sizes, 10), 'typed: false keeps blank items off 40 papers', d.counts.join(','));
      await o.ctx.close(); }
    { const {ctx, page, errors} = await L.openPage(browser, on.page);
      const d3 = await draws(page, 3);
      check(same(d3.counts, 3), 'blanks: 3 gives exactly 3 blank items on each of 40 papers', d3.counts.join(','));
      check(same(d3.sizes, 10) && same(d3.poolA, 5) && same(d3.poolB, 5), 'each paper keeps its size and both pools their 5 marks', {s: d3.sizes.join(), a: d3.poolA.join(), b: d3.poolB.join()});
      check(d3.dup === 0 && d3.typesKept, 'no paper holds two wordings of one fact (dupOf) or a question twice, and the items keep their type', d3);
      const d50 = await draws(page, 50);
      // 5 families of blank items in the first topic (pool of 5 marks) and 1 in the second: 6 at most
      check(same(d50.counts, 6) && same(d50.poolA, 5) && same(d50.poolB, 5) && d50.dup === 0,
            'blanks: 50 on a bank with 6 blank families gives the 6 it has, within the pools\' marks and dupOf', {c: d50.counts.join(), dup: d50.dup});
      const d0 = await draws(page, 0);
      check(same(d0.counts, 0) && same(d0.sizes, 10), 'blanks: 0 keeps them off the paper', d0.counts.join(','));
      const du = await draws(page, 'unset');
      check(du.counts.some(n => n > 0) && same(du.sizes, 10), `without blanks the draw takes blank items like other items (${du.counts.reduce((a, b) => a + b, 0)} on 40 papers)`);

      // ---- a fixed paper: typed, kept through a reload, graded, recorded, shown ----
      await page.evaluate(() => { EXAM.blanks = 3; });
      await page.click('#nav button[data-v="exam"]');
      check(await page.evaluate(() => /fill-in-the-blank/.test((document.getElementById('exTypedNote') || {}).textContent || '')), 'the exam page says the paper draws fill-in-the-blank items');
      await page.evaluate(() => { drawPaper = () => [byId('bt-vdr'), byId('bt-cal'), byId('bt-ma1')]; });
      await page.click('#startExam');
      if(check(await page.evaluate(() => !!document.getElementById('exBlank') && /fill in the blank/.test(document.querySelector('#v-exam .qhead').textContent)),
            'a blank item on the paper has a text box and is marked fill in the blank')){
      await page.fill('#exBlank', 'vitamin-D receptor');
      await page.waitForTimeout(200);
      await page.reload(); await ready(page); await page.waitForTimeout(400);
      check(await page.evaluate(() => VIEW === 'exam' && (document.getElementById('exBlank') || {}).value === 'vitamin-D receptor'), 'what was typed is kept through a reload');
      await page.press('#exBlank', 'Enter');
      await page.fill('#exBlank', 'calcinurin');
      await page.click('#exNext');
      await page.evaluate(() => { const q = EX.qs[2]; const k = EX.orders[2].indexOf(q.options.findIndex(o => o.correct)); document.querySelectorAll('#v-exam .opt')[k].click(); });
      await page.click('#exEnd');
      await page.waitForTimeout(300);
      const res = await page.evaluate(() => ({h: (document.querySelector('#v-exam h2') || {}).textContent || '', text: document.getElementById('v-exam').textContent,
        ans: DB.answers.slice(-3).map(a => [a.qid, a.result, a.picked]), log: LOG.slice(-3).map(e => [e[3], e[6]])}));
      check(/2 \/ 3/.test(res.h), 'the paper scores 2 of 3 (the exact answer and the multiple-choice item)', res.h);
      const v = res.ans.find(a => a[0] === 'bt-vdr'), c = res.ans.find(a => a[0] === 'bt-cal');
      check(v && v[1] === 'correct' && v[2] === 'vitamin-D receptor', 'the right blank answer is recorded right, with what was typed', res.ans);
      check(c && c[1] === 'wrong' && c[2] === 'calcinurin', 'the near miss is recorded wrong on the paper (strict by default)', res.ans);
      check(res.log.filter(e => e[1] === 'blank').every(e => e[0] === 'exam') && res.log.filter(e => e[1] === 'blank').length === 2, 'both are in the answer history as exam answers of type blank', res.log);
      check(/you wrote calcinurin/.test(res.text) && /Close: check the spelling/.test(res.text) && /Accepted answers: vitamin D · VDR · vitamin D receptor/.test(res.text)
            && /the answer is calcineurin/.test(res.text), 'the result page shows what was typed, the spelling note and the accepted answers');
      } else L.skip('the fixed paper typed, reloaded, graded and reviewed', 'the paper shows no text box for the blank item');
      check(!errors.length, 'no page error on the paper', errors.slice(0, 3).join(' | '));
      await ctx.close(); }
  } finally {
    await browser.close();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
