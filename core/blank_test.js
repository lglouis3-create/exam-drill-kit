/* Fill in the blank: the core item type `type:'blank'` (views.js gradeBlank,
 * blankBody; exam_typed.js on exam papers; build.py and test.js validation).
 *
 * In node, on the course's own engine: every grading rule. Case, spaces at the
 * ends, a run of spaces, hyphens or en dashes, a final period, the Greek letters
 * α β γ δ κ against their names, digits and the percent sign kept; a one-edit
 * miss of an accepted answer of 5 or more characters is wrong with the note "Not
 * accepted: it is close to an accepted answer. Check the exact term.", right with
 * course.js `blank: {typo: 1}` (the note "Counted as right: ..."); an answer under
 * 5 characters gets no leniency; two edits are wrong with no note. A text that is
 * another blank item's accepted answer (IL-17RA typed for IL-17A, cystine for
 * cysteine) is plain wrong with no note in both modes.
 * On scratch copies of this source tree with blank items planted (a file
 * q96_blank_test.js), in the browser:
 *   - Quiz: the item shows a text box; Enter checks; the reveal shows the verdict,
 *     the near-miss note, the answer and the accepted
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
 *     no `accept`, an empty entry, two entries the same once normalized, or no
 *     `why` or `teach`; the build stops on `blanks` without `typed: true` and on
 *     a bad `blank` option;
 *   - length cap (the longest accepted answer plus 100): the text box carries it
 *     as maxlength; a 3 MB value set by script is recorded at the cap in the
 *     Quiz and on a paper, also when it was put in the saved picks;
 *   - one-edit differences that name another thing (a digit, a token of one
 *     character) are plain wrong in both modes; ordinary slips stay near;
 *   - the bank export: a blank item adds `accept` and `why`; every other item
 *     exports with the keys it had.
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
const X = L.engine('({blankNorm, gradeBlank, blankCap, blankClip, COURSE, QUESTIONS})');
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
// a one-edit difference that names another thing is plain wrong, with no note, in both modes
for(const [mode, set] of [['strict', undefined], ['typo: 1', {typo: 1}]]){
  X.COURSE.blank = set;
  wrong('vitamin D', 'vitamin E', `${mode}: "vitamin E" for "vitamin D" (a token of one character) is wrong, no note`);
  wrong('vitamin D', 'vitamin DD', `${mode}: "vitamin DD" for "vitamin D" (a token of one character) is wrong, no note`);
  wrong('5 HT2', '5 HT3', `${mode}: "5 ht3" for "5 ht2" (a digit) is wrong, no note`);
  wrong('CYP3A4', 'CYP3A5', `${mode}: "CYP3A5" for "CYP3A4" (a digit) is wrong, no note`);
  wrong('beta-1', 'beta-2', `${mode}: "beta-2" for "beta-1" (a digit) is wrong, no note`);
  wrong('beta-2 agonist', 'beta-1 agonist', `${mode}: "beta-1 agonist" for "beta-2 agonist" (a digit inside a longer answer) is wrong, no note`);
  wrong('CYP3A4', 'CYP3A45', `${mode}: a digit added to "CYP3A4" is wrong, no note`);
  wrong('CYP3A4', 'CYP3A', `${mode}: a digit left out of "CYP3A4" is wrong, no note`);
  wrong('calcipotriene', 'calcipotrien3', `${mode}: a digit typed for a letter is wrong, no note`);
  // a Roman numeral names another thing when one letter changes
  wrong('type II diabetes', 'type I diabetes', `${mode}: "type I diabetes" for "type II diabetes" (a Roman numeral) is wrong, no note`);
  wrong('type II diabetes', 'type III diabetes', `${mode}: "type III diabetes" for "type II diabetes" (a Roman numeral) is wrong, no note`);
  wrong('type II diabetes', 'type IV diabetes', `${mode}: "type IV diabetes" for "type II diabetes" (a Roman numeral) is wrong, no note`);
  wrong('type I diabetes', 'type II diabetes', `${mode}: "type II diabetes" for "type I diabetes" is wrong, no note`);
  wrong('factor Xa inhibitor', 'factor Xb inhibitor', `${mode}: "factor Xb inhibitor" for "factor Xa inhibitor" (a Roman numeral with a letter) is wrong, no note`);
  wrong('class IA antiarrhythmic', 'class IB antiarrhythmic', `${mode}: "class IB" for "class IA" is wrong, no note`);
  wrong('class IV agent', 'class V agent', `${mode}: "class V" for "class IV" is wrong, no note`);
}
X.COURSE.blank = undefined;
// ordinary slips stay near (wrong in strict mode) and are right with typo: 1
wrong('calcipotriene', 'calcipotrine', 'strict: "calcipotrine" for "calcipotriene" is a near miss, wrong', true);
wrong('tacrolimus', 'tacrolimis', 'strict: "tacrolimis" for "tacrolimus" is a near miss, wrong', true);
wrong('vitamin D receptor', 'vitamin D receptr', 'strict: a letter left out inside a long token of a longer answer is a near miss', true);
wrong('vitamin D', 'vitamind', 'strict: "vitamind" for "vitamin D" (a space left out) is a near miss', true);
wrong('vitamin D', 'vitamn D', 'strict: "vitamn D" for "vitamin D" (a letter left out of a word) is a near miss', true);
wrong('type II diabetes', 'type II diabets', 'strict: a letter left out of "diabetes" next to a Roman numeral is a near miss', true);
wrong('class IV antiarrhythmic', 'class IV antiarrythmic', 'strict: a slip in a long word of an answer that holds a Roman numeral is a near miss', true);
wrong('via the portal vein', 'via the portal vain', 'strict: a slip after the word "via" (which fits the numeral pattern) is a near miss', true);
wrong('mixed function oxidase', 'mixed funtion oxidase', 'strict: a slip in a phrase with "mix"-like words is a near miss', true);
wrong('calcineurin', 'calcineruin', 'strict: two letters swapped is two edits, not a near miss');
X.COURSE.blank = {typo: 1};
for(const [acc, typed] of [['calcipotriene', 'calcipotrine'], ['tacrolimus', 'tacrolimis'], ['vitamin D receptor', 'vitamin D receptr'], ['vitamin D', 'vitamn D'],
                           ['type II diabetes', 'type II diabets'], ['class IV antiarrhythmic', 'class IV antiarrythmic']]){
  const g = G(acc, typed); check(g.ok && g.near, `typo: 1: "${typed}" for "${acc}" is right, with the note`, g);
}
{ const g = G('calcineurin', 'calcineruin'); check(!g.ok && !g.near, 'typo: 1: two letters swapped is still wrong, no note', g); }
{ const g = G('calcineurin', 'calcinurin'); check(g.ok && g.near, 'with blank: {typo: 1} a one-edit near miss is right, with the note', g); }
wrong('calcineurin', 'calcinurim', 'with typo: 1, two edits are still wrong');
wrong('VDR', 'VDE', 'with typo: 1, an answer under 5 characters still gets no leniency');
right('calcineurin', 'Calcineurin', 'with typo: 1, an exact answer is right with no note');
X.COURSE.blank = {typo: 0};
wrong('calcineurin', 'calcinurin', 'with blank: {typo: 0} the near miss is wrong (strict)', true);
X.COURSE.blank = savedBlank;

// the length cap, in node: the longest accepted answer plus 100
{ const q = item('vitamin D', 'VDR', 'vitamin D receptor'), big = 'x'.repeat(3 * 1024 * 1024);
  check(X.blankCap(q) === 'vitamin D receptor'.length + 100, 'the cap is the longest accepted answer plus 100', X.blankCap(q));
  check(X.blankClip(q, big).length === X.blankCap(q), 'a 3 MB text is cut to the cap', X.blankClip(q, big).length);
  check(X.blankClip(q, 'vdr') === 'vdr' && X.blankClip(q, null) === '', 'a text under the cap is kept as it is; null is empty');
  const g = X.gradeBlank(q, 'vitamin D receptor' + ' '.repeat(3 * 1024 * 1024) + 'junk');
  check(g.ok, 'grading reads only the first characters up to the cap (an accepted answer followed by 3 MB of spaces is right)', g);
  const h = X.gradeBlank(q, 'x'.repeat(50) + 'vitamin D receptor');
  check(!h.ok, 'a long text that only ends with an accepted answer is wrong', h); }

// a text that is another blank item's accepted answer is plain wrong, with no note, in both modes
{ const mk = (id, ...accept) => ({id, type: 'blank', accept});
  const il17a = mk('k-a', 'IL-17A'), il17ra = mk('k-ra', 'IL-17RA'), cyse = mk('k-e', 'cysteine'), cyst = mk('k-i', 'cystine');
  // this step runs on a bank of its own: a course whose own bank already has blank items that accept these
  // answers (DEENT's does) would otherwise change what "no other blank item" means. The course's items go back after it.
  const keptQ = X.QUESTIONS.splice(0);
  // before any other blank item is in the bank, the one-edit text is a near miss, as it always was
  for(const [mode, set] of [['strict', undefined], ['typo: 1', {typo: 1}]]){
    X.COURSE.blank = set;
    const g = X.gradeBlank(il17ra, 'IL-17A'), h = X.gradeBlank(cyse, 'cystine');
    check(g.near === true && g.ok === !!set && h.near === true && h.ok === !!set, `${mode}: with no other blank item in the bank, IL-17A for IL-17RA and cystine for cysteine are near misses`, [g, h]);
  }
  X.QUESTIONS.push(il17a, il17ra, cyse, cyst);
  for(const [mode, set] of [['strict', undefined], ['typo: 1', {typo: 1}]]){
    X.COURSE.blank = set;
    for(const [q, typed, label] of [[il17a, 'IL-17RA', 'IL-17RA typed for IL-17A'], [il17ra, 'IL-17A', 'IL-17A typed for IL-17RA'],
                                    [cyse, 'cystine', 'cystine typed for cysteine'], [cyst, 'cysteine', 'cysteine typed for cystine'], [cyse, 'CYSTINE.', 'CYSTINE. typed for cysteine (normalized)']]){
      const g = X.gradeBlank(q, typed);
      check(!g.ok && !g.near, `${mode}: ${label} is another item's answer: wrong, no note`, g);
    }
    const own = X.gradeBlank(cyse, 'Cysteine'); check(own.ok && !own.near, `${mode}: an item's own answer is still right`, own);
    const slip = X.gradeBlank(cyse, 'cystein'); check(slip.near === true && slip.ok === !!set, `${mode}: a slip of one answer that no other item accepts is still a near miss`, slip);
  }
  // an answer two items accept is right for both
  const twin = mk('k-t', 'cystine', 'cystin2'); X.QUESTIONS.push(twin);
  X.COURSE.blank = undefined;
  { const g = X.gradeBlank(twin, 'cystine'); check(g.ok, 'an answer that two items accept is right for each of them', g); }
  X.COURSE.blank = savedBlank;
  X.QUESTIONS.length = 0; X.QUESTIONS.push(...keptQ);
  check(X.QUESTIONS.length === keptQ.length && X.QUESTIONS.every((x, i) => x === keptQ[i]), 'the course\'s own questions are back after the step with its own bank', X.QUESTIONS.length);
}

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
  blank('bt-il17a', T1, 'Secukinumab binds the cytokine ___.', ['IL-17A']);
  blank('bt-il17ra', T1, 'Brodalumab binds the receptor ___.', ['IL-17RA']);
  blank('bt-cyse', T1, 'The amino acid with a thiol side chain is ___.', ['cysteine']);
  blank('bt-cyst', T1, 'The disulfide dimer of that amino acid is ___.', ['cystine']);
  for(let k = 1; k <= 4; k++) for(const [t, n] of [[T0, 'a'], [T1, 'b']])
    QUESTIONS.push(Object.assign(base('bt-m' + n + k, t), {stem: 'Planted multiple-choice item ' + n + k + ': which one is right?',
      options: ${JSON.stringify(OPT('The planted filler item.'))}, teach: 'The planted filler items fill the pools.'}, n + k === 'a1' ? {why: 'A top-level why on a multiple-choice item.'} : {}));
})();\n`;
// course.js runs before the question files, so the two pools name the topics by the ids q1_topics.js gives them
const topicIds = (fs.readFileSync(path.join(L.PAGE.SRC, 'q1_topics.js'), 'utf8').match(/\{\s*id\s*:\s*'[^']+'[^{}]*subs\s*:/g) || [])
  .map(t => t.match(/'([^']+)'/)[1]);
const paperLine = (typed, extra) => `COURSE.activeExam = COURSE.exams[0].id; Object.assign(COURSE.exams[0], {typed: ${typed}, blanks: undefined, questions: 10, sata: 0, blueprint: undefined,
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
    // a copy that did its job is removed at once; one whose check failed is kept for inspection (check_lib.js keeps every
    // scratch folder when the run fails, and removes them all when it passes)
    if(check(r.status === 1 && want.test(r.stdout), `test.js rejects a blank item with ${label}`, (r.stdout || '').split('\n').filter(l => /FAIL/.test(l)).slice(0, 3).join(' | '))) b.rm();
  };
  badCopy('no accept', `delete QUESTIONS.find(q => q.id === 'bt-cal').accept;`, /bt-cal: fill-in-the-blank item needs a non-empty `accept` list/);
  badCopy('an empty accept list', `QUESTIONS.find(q => q.id === 'bt-cal').accept = [];`, /bt-cal: fill-in-the-blank item needs a non-empty `accept` list/);
  badCopy('an empty entry', `QUESTIONS.find(q => q.id === 'bt-cal').accept.push('  ');`, /bt-cal: fill-in-the-blank `accept` holds an empty or non-text entry/);
  badCopy('no why and no teach', `delete QUESTIONS.find(q => q.id === 'bt-cal').why;`, /bt-cal: fill-in-the-blank item needs a non-empty `why` or `teach`/);
  badCopy('an empty why and no teach', `QUESTIONS.find(q => q.id === 'bt-cal').why = '  ';`, /bt-cal: fill-in-the-blank item needs a non-empty `why` or `teach`/);
  { const b = L.scratchBuild('blank-good', {files: {'q96_blank_test.js': QF + `{ const q = QUESTIONS.find(q => q.id === 'bt-sal'); q.teach = 'The planted teach text.'; delete q.why; }\n`}, courseLine: paperLine(true)});
    const r = b.code === 0 ? testJs(b.src) : {status: -1, stdout: b.out};
    if(check(r.status === 0, 'test.js accepts a blank item with `teach` and no `why`', (r.stdout || '').split('\n').filter(l => /FAIL/.test(l)).slice(0, 3).join(' | '))) b.rm(); }
  badCopy('two entries the same once normalized', `QUESTIONS.find(q => q.id === 'bt-vdr').accept.push('Vitamin-D.');`, /bt-vdr: fill-in-the-blank `accept` holds two entries that are the same once normalized/);
  { const b = L.scratchBuild('blank-nobuild', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(false, '{blanks: 2}')});
    if(check(b.code !== 0 && /`blanks` needs `typed: true`/.test(b.out), 'the build stops on `blanks` without `typed: true`', b.out.split('\n').slice(-2).join(' | '))) b.rm(); }
  { const b = L.scratchBuild('blank-nobuild', {files: {'q96_blank_test.js': QF}, courseLine: paperLine(true) + 'COURSE.blank = {typo: 2};'});
    if(check(b.code !== 0 && /course.js `blank` takes only `typo`/.test(b.out), 'the build stops on `blank: {typo: 2}`', b.out.split('\n').slice(-2).join(' | '))) b.rm(); }

  // the old wording is gone from the core's own files (a course may quote it in its own text: DEENT did, before #101),
  // and the new notes are in the page
  { const src = fs.readFileSync(on.page, 'utf8');
    const coreFiles = ['views.js', 'exam_typed.js', 'shell.html'].filter(f => fs.existsSync(path.join(__dirname, f)));
    check(coreFiles.length === 3 && coreFiles.every(f => !/close: check the spelling/i.test(fs.readFileSync(path.join(__dirname, f), 'utf8'))),
      'the old wording "Close: check the spelling" is not in the core\'s views.js, exam_typed.js or shell.html', coreFiles.join(', '));
    check(src.includes('Not accepted: it is close to an accepted answer. Check the exact term.') && src.includes('Counted as right: one letter differs from an accepted answer. Check the spelling.'), 'the two new notes are in the page'); }
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
      check(r.bad && /Not accepted: it is close to an accepted answer\. Check the exact term\./.test(r.verdict) && r.verdict.indexOf('Not accepted') < r.verdict.indexOf('The answer is vitamin D'),
            'Enter checks: a near miss is wrong, and "Not accepted: it is close to an accepted answer. Check the exact term." comes before the answer', r.verdict);
      check(!/spelling/i.test(r.verdict), 'the strict note does not claim a spelling slip', r.verdict);
      check(/you wrote vitamn D/.test(r.verdict) && /Accepted answers: vitamin D · VDR · vitamin D receptor/.test(r.text), 'the reveal shows what was typed and every accepted answer');
      check(/has this explanation/.test(r.text) && /slide 1/.test(r.text), 'the reveal shows the explanation and the citation');
      check(r.n === 1 && r.last.qid === 'bt-vdr' && r.last.result === 'wrong' && r.last.picked === 'vitamn D', 'the answer is recorded once, wrong, with the typed text as what was picked', r.last);
      check(r.log && r.log[6] === 'blank', 'the answer history names the item type blank', r.log);
      await page.waitForTimeout(500);
      await page.reload(); await ready(page); await page.waitForTimeout(500);
      const back = await page.evaluate(() => ({view: VIEW, id: Q && Q.current && Q.current.id, rev: Q && Q.revealed, n: DB.answers.filter(a => a.qid === 'bt-vdr').length,
        verdict: (document.querySelector('#v-quiz .verdict') || {}).textContent || ''}));
      check(back.view === 'quiz' && back.id === 'bt-vdr' && back.rev && back.n === 1 && /Not accepted: it is close/.test(back.verdict),
            'a reload brings the answered question back answered, with nothing recorded twice', back);
      // an exact answer, through the Check button
      check(await L.quizOn(page, 'bt-cal'), 'the quiz opens on a second blank item');
      await page.fill('#blankIn', ' Calcineurin. '); await page.click('#btnCheck');
      const r2 = await page.evaluate(() => ({ok: !!document.querySelector('#v-quiz .verdict.ok'), v: (document.querySelector('#v-quiz .verdict') || {}).textContent || '',
        last: DB.answers[DB.answers.length - 1], next: !!document.getElementById('btnNext')}));
      check(r2.ok && !/Not accepted|Counted as right/.test(r2.v) && r2.last.result === 'correct' && r2.last.picked === 'Calcineurin.' && r2.next,
            'the Check button grades an exact answer right, with no spelling note, and offers Next', r2);
      // Weak spots: the miss with what was typed and the accepted answers
      const gaps = await page.evaluate(() => { show('gaps'); return document.getElementById('v-gaps').textContent; });
      check(/Calcipotriene binds the ___ receptor\./.test(gaps) && /You picked: vitamn D/.test(gaps) && /Answer: vitamin D · VDR · vitamin D receptor/.test(gaps),
            'Weak spots lists the missed blank item with its stem, the typed answer and the accepted answers');
      check(await page.evaluate(() => { const b = bankMarkdown(); return /Answer: vitamin D/.test(b) && /Also accepted: VDR · vitamin D receptor/.test(b); }),
            'the bank export carries the answer and the accepted answers');
      // another item's answer typed for this one: wrong, no note (strict mode)
      for(const [id, typed] of [['bt-il17a', 'IL-17RA'], ['bt-il17ra', 'IL-17A'], ['bt-cyse', 'cystine'], ['bt-cyst', 'cysteine']]){
        await L.quizOn(page, id);
        await page.fill('#blankIn', typed); await page.press('#blankIn', 'Enter');
        const k = await page.evaluate(() => ({bad: !!document.querySelector('#v-quiz .verdict.bad'), v: document.querySelector('#v-quiz .verdict').textContent, last: DB.answers[DB.answers.length - 1]}));
        check(k.bad && !/Not accepted|Counted as right|Close|spelling/i.test(k.v) && k.last.result === 'wrong' && /The answer is|the answer is/.test(k.v),
              `strict: "${typed}" typed for ${id} is another item's answer: wrong, no note, the answer still shown`, k);
      }
      await L.quizOn(page, 'bt-cyse');
      await page.fill('#blankIn', 'cystein'); await page.press('#blankIn', 'Enter');
      const sl0 = await page.evaluate(() => ({bad: !!document.querySelector('#v-quiz .verdict.bad'), v: document.querySelector('#v-quiz .verdict').textContent}));
      check(sl0.bad && /Not accepted: it is close to an accepted answer\. Check the exact term\./.test(sl0.v), 'strict: "cystein" for cysteine (no other item accepts it) is wrong, with the note', sl0);

      // the bank export: a blank item adds accept and why; every other item exports with the keys it had
      const exp = await page.evaluate(() => { const rows = JSON.parse(JSON.stringify(bankJson())), by = id => rows.find(r => r.id === id);
        return {blank: Object.keys(by('bt-vdr')), mc: Object.keys(by('bt-ma1')), mc2: Object.keys(by('bt-mb2')), acc: by('bt-vdr').accept, why: by('bt-vdr').why}; });
      const ORIGINAL = ['id', 'prof', 'exam', 'module', 'topic', 'sub', 'concept', 'skill', 'type', 'multi', 'source', 'stem', 'options', 'teach', 'cite'];
      check(JSON.stringify(exp.blank.filter(k => ['accept', 'why'].includes(k))) === '["accept","why"]' && exp.acc.length === 3 && /has this explanation/.test(exp.why),
            'the export of a blank item carries accept and why', exp.blank);
      check(JSON.stringify(exp.mc) === JSON.stringify(ORIGINAL) && JSON.stringify(exp.mc2) === JSON.stringify(ORIGINAL),
            'an item with options exports with the keys it had, also one with a top-level why (no accept, no why)', exp.mc);

      // the length cap: the text box carries it, and a 3 MB value put in by script is recorded at it
      check(await L.quizOn(page, 'bt-sal'), 'the quiz opens on a blank item with a short answer');
      const cap1 = await page.evaluate(() => ({attr: +document.getElementById('blankIn').getAttribute('maxlength'), cap: blankCap(byId('bt-sal'))}));
      check(cap1.attr === cap1.cap && cap1.cap === 'tretinoin'.length + 100, 'the text box carries maxlength = the longest accepted answer + 100', cap1);
      await page.evaluate(() => { document.getElementById('blankIn').value = 'x'.repeat(3 * 1024 * 1024); });
      await page.click('#btnCheck');
      const big = await page.evaluate(() => ({n: DB.answers.filter(a => a.qid === 'bt-sal').length, len: DB.answers[DB.answers.length - 1].picked.length,
        picked: Q.picked.length, page: document.getElementById('v-quiz').textContent.length, log: JSON.stringify(LOG[LOG.length - 1]).length}));
      check(big.n === 1 && big.len === 'tretinoin'.length + 100 && big.picked === big.len && big.page < 5000,
            'a 3 MB value set by script is recorded once at the cap, kept at the cap on screen and in the answer', big);
      await page.reload(); await ready(page); await page.waitForTimeout(400);
      check(await page.evaluate(() => document.getElementById('v-quiz').textContent.length < 5000 && DB.answers[DB.answers.length - 1].picked.length === 'tretinoin'.length + 100),
            'after a reload the answer is still at the cap');
      check(!errors.length, 'no page error in the quiz', errors.slice(0, 3).join(' | '));
      await ctx.close(); }

    // ---- blank: {typo: 1} ----
    { const {ctx, page, errors} = await L.openPage(browser, typo.page);
      await L.quizOn(page, 'bt-cal');
      await page.fill('#blankIn', 'calcinurin'); await page.press('#blankIn', 'Enter');
      const r = await page.evaluate(() => ({ok: !!document.querySelector('#v-quiz .verdict.ok'), v: (document.querySelector('#v-quiz .verdict') || {}).textContent || '',
        last: DB.answers[DB.answers.length - 1]}));
      check(r.ok && /Counted as right: one letter differs from an accepted answer\. Check the spelling\./.test(r.v) && !/Not accepted/.test(r.v) && r.last.result === 'correct',
            'with blank: {typo: 1} the near miss is recorded right, with the note "Counted as right: ..."', r);
      await L.quizOn(page, 'bt-vdr');
      await page.fill('#blankIn', 'VDE'); await page.press('#blankIn', 'Enter');
      const s = await page.evaluate(() => ({bad: !!document.querySelector('#v-quiz .verdict.bad'), v: document.querySelector('#v-quiz .verdict').textContent}));
      check(s.bad && !/Not accepted|Counted as right/.test(s.v), 'with typo: 1, a slip in a 3-character answer is still wrong, with no note', s);
      // another item's answer is wrong in this mode too, with no note, and nothing is counted right
      for(const [id, typed] of [['bt-il17a', 'IL-17RA'], ['bt-il17ra', 'IL-17A'], ['bt-cyse', 'cystine'], ['bt-cyst', 'cysteine']]){
        await L.quizOn(page, id);
        await page.fill('#blankIn', typed); await page.press('#blankIn', 'Enter');
        const k = await page.evaluate(() => ({bad: !!document.querySelector('#v-quiz .verdict.bad'), v: document.querySelector('#v-quiz .verdict').textContent, last: DB.answers[DB.answers.length - 1]}));
        check(k.bad && !/Not accepted|Counted as right|Close/.test(k.v) && k.last.result === 'wrong', `typo: 1: "${typed}" typed for ${id} is another item's answer: wrong, no note`, k);
      }
      await L.quizOn(page, 'bt-cyse');
      await page.fill('#blankIn', 'cystein'); await page.press('#blankIn', 'Enter');
      const sl = await page.evaluate(() => ({ok: !!document.querySelector('#v-quiz .verdict.ok'), v: document.querySelector('#v-quiz .verdict').textContent}));
      check(sl.ok && /Counted as right/.test(sl.v), 'typo: 1: "cystein" for cysteine (no other item accepts it) is counted right, with the note', sl);
      check(!errors.length, 'no page error with typo: 1', errors.slice(0, 3).join(' | '));
      await ctx.close(); }

    // ---- papers: the draw ----
    const BLANKS = ['bt-vdr', 'bt-cal', 'bt-sal', 'bt-b4', 'bt-b5', 'bt-b6', 'bt-o1'];
    const draws = (page, blanks) => page.evaluate(([blanks, ids]) => {
      if(blanks === 'unset') delete EXAM.blanks; else EXAM.blanks = blanks;
      const out = {sizes: [], counts: [], poolA: [], poolB: [], dup: 0, typesKept: true, short: 0};
      // per pool, the most blank items the paper can hold: the blank families the pool has, up to the marks left once the
      // numeric and matching items drawn into it are counted (those stay as drawn)
      const fam = EXAM.pools.map(p => new Set(requiredQs().filter(q => q.type === 'blank' && !q.lowYield && p.test(q)).map(familyOf)).size);
      for(let k = 0; k < 40; k++){
        const p = drawPaper(), on = new Set(p.map(q => q.id));
        out.sizes.push(p.length); out.counts.push(p.filter(q => q.type === 'blank').length);
        out.poolA.push(p.filter(EXAM.pools[0].test).length); out.poolB.push(p.filter(EXAM.pools[1].test).length);
        if(on.has('bt-b5') && on.has('bt-b6')) out.dup++;
        EXAM.pools.forEach((pl, j) => { const inPool = p.filter(pl.test), typedOther = inPool.filter(q => q.type && q.type !== 'blank').length;
          if(inPool.filter(q => q.type === 'blank').length !== Math.min(fam[j], pl.marks - typedOther)) out.short++; });
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
      // the most a paper can hold: per pool (the two are disjoint, by topic), its blank families, at most its marks
      // (on the template: 5 families in the first topic, a pool of 5 marks, and 1 in the second: 6)
      const most = await page.evaluate(() => EXAM.pools.reduce((n, p) => n + Math.min(p.marks,
        new Set(requiredQs().filter(q => q.type === 'blank' && !q.lowYield && p.test(q)).map(familyOf)).size), 0));
      check(d50.counts.every(n => n <= most) && d50.short === 0 && same(d50.poolA, 5) && same(d50.poolB, 5) && d50.dup === 0,
            `blanks: 50 on a bank with fewer gives, in each pool, every blank family it has (up to ${most} on a paper; numeric and matching items stay as drawn), within the marks and dupOf`, {c: d50.counts.join(), short: d50.short, dup: d50.dup});
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
      check(await page.evaluate(() => +document.getElementById('exBlank').getAttribute('maxlength') === blankCap(EX.qs[0])), 'the paper\'s text box carries the same maxlength');
      await page.evaluate(() => { const n = document.getElementById('exBlank'); n.value = 'x'.repeat(3 * 1024 * 1024); n.dispatchEvent(new Event('input')); });
      check(await page.evaluate(() => EX.picks[0].length === blankCap(EX.qs[0])), 'a 3 MB value set by script is kept on the paper at the cap');
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
      check(/you wrote calcinurin/.test(res.text) && /Not accepted: it is close to an accepted answer/.test(res.text) && /Accepted answers: vitamin D · VDR · vitamin D receptor/.test(res.text)
            && /[Tt]he answer is calcineurin/.test(res.text), 'the result page shows what was typed, the near-miss note and the accepted answers');
      } else L.skip('the fixed paper typed, reloaded, graded and reviewed', 'the paper shows no text box for the blank item');
      check(!errors.length, 'no page error on the paper', errors.slice(0, 3).join(' | '));
      await ctx.close(); }

    // ---- a paper whose saved pick is far over the cap (a value set by script, or an old save) ----
    { const {ctx, page, errors} = await L.openPage(browser, on.page);
      await page.click('#nav button[data-v="exam"]');
      await page.evaluate(() => { drawPaper = () => [byId('bt-sal')]; });
      await page.click('#startExam');
      await page.evaluate(() => { EX.picks[0] = 'y'.repeat(3 * 1024 * 1024); finishExam(false); });
      const r = await page.evaluate(() => ({len: DB.answers[DB.answers.length - 1].picked.length, text: document.getElementById('v-exam').textContent.length,
        log: LOG.length}));
      check(r.len === 'tretinoin'.length + 100 && r.text < 6000 && r.log === 1, 'a 3 MB pick on a paper is recorded at the cap when the paper is submitted, and shown short', r);
      check(!errors.length, 'no page error on the over-long paper', errors.slice(0, 3).join(' | '));
      await ctx.close(); }
  } finally {
    await browser.close();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
