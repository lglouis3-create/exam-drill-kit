/* int_data.js <kit> <courseSrc> mod ...
 * Writes the course data the named modules need to build on a template scratch course, in
 * one non-question data file per module (ic_*.js, listed in course.js `files`), and the
 * course.js line for COURSE.quizzes. Every row is taken verbatim from the fixture that
 * module's own test.js uses (read from its `const X = ...;` line), with these adaptations,
 * each needed to fit the template course and listed in INDEX.md:
 *   - ids get the prefix "ic-" so they never equal the ids the test's own fixture adds;
 *   - SOURCES: the document's `items` and `chains` are emptied (its questions are not in
 *     the template bank, and the step refuses an item that names no bank question);
 *   - COURSE.quizzes: the quiz's `modules` [9, 8] become `topics: ['topic1','topic2']`
 *     (the template's questions have no module) and `when` is set to 2026-12-01T08:00
 *     so the card is shown (the fixture's date is past);
 *   - equation-drill / plan-the-problem: the coordinator's example_oncourse_plan.js
 *     data (the equation-drill test's 14 equations with ids eqc-, one equation for the
 *     template's numeric sample s2-3 and its setup line).
 * Writes only inside <courseSrc>.
 */
const fs = require('fs'), path = require('path');
const {fixture} = require('/tmp/port-integration/fx.js');
const [KIT, SRC, ...mods] = process.argv.slice(2);
const on = new Set(mods);
const P = 'ic-';
const HEAD = '/* Course data for the integration scratch course (never shipped): rows taken from the\n   modules\' own test fixtures, see /tmp/port-integration/int_data.js */\n';
const wrote = [], files = [];
let out = '';
const flush = name => { if(!out) return; fs.writeFileSync(path.join(SRC, name), HEAD + out); files.push(name); out = ''; };
if (!on.has('glossary-tap') && on.has('terms-variables')) {   // with glossary-tap on, its ci/oncourse.js writes TERMS
  const T = fixture(KIT, 'glossary-tap', 'FIX').terms.map(t => Object.assign({}, t, {id: P + t.id, confuse: (t.confuse || []).map(c => P + c)}));
  out += `const TERMS = ${JSON.stringify(T)};\n`; wrote.push(`TERMS (${T.length}, glossary-tap FIX.terms)`);
}
flush('ic_terms.js');
if (on.has('pair-up-drills')) {
  const S = fixture(KIT, 'pair-up-drills', 'IP').pairSets.slice(0, 1).map(s => Object.assign({}, s, {id: P + s.id}));
  out += `const PAIR_SETS = ${JSON.stringify(S)};\n`; wrote.push(`PAIR_SETS (${S.length}, pair-up-drills IP.pairSets[0])`);
}
flush('ic_pairs.js');
if (on.has('short-answer-graphs')) {
  const S = fixture(KIT, 'short-answer-graphs', 'IP').sa.slice(0, 2).map(s => Object.assign({}, s, {id: P + s.id}));
  out += `const SHORT_ANSWERS = ${JSON.stringify(S)};\n`; wrote.push(`SHORT_ANSWERS (${S.length}, short-answer-graphs IP.sa[0..1])`);
}
flush('ic_sa.js');
if (on.has('worksheets-ink') && !fs.existsSync(path.join(KIT, 'features/worksheets-ink/ci/oncourse.js'))) {
  const S = fixture(KIT, 'worksheets-ink', 'PK').sources.slice(0, 1).map(s => Object.assign({}, s, {id: P + s.id, items: [], chains: []}));
  out += `const SOURCES = ${JSON.stringify(S)};\n`; wrote.push(`SOURCES (${S.length}, worksheets-ink PK.sources[0], items emptied)`);
}
flush('ic_sources.js');
if (on.has('equation-drill') || on.has('plan-the-problem')) {
  const eqt = fs.readFileSync(path.join(KIT, 'features/equation-drill/current/test.js'), 'utf8');
  const FIX = JSON.parse(eqt.match(/^const FIX = (\[.*\]);$/m)[1]).map(e => Object.assign({}, e, {id: 'eqc-' + e.id}));
  const dose = {id:'eqc-dose',module:1,name:'Dose from body weight',sheet:'yes',lhs:'Dose',tokens:['W','&times;','d'],typed:'Dose = W*d',
    lures:['/','+'],symbols:[['Dose','the dose, mg'],['W','body weight, kg'],['d','the dose per kilogram, mg/kg']],
    holds:'A dose stated per kilogram of body weight.',cite:'Lecture 1 (Lecture01.pdf) slide 25'};
  out += `const EQUATIONS = ${JSON.stringify([dose].concat(FIX))};\n` +
    "Object.assign(QUESTIONS.find(q => q.id === 's2-3'), {module: 1, setup: {eq: 'eqc-dose', why: 'The stem gives a weight and a dose per kilogram and asks for the dose, so Dose = W × d.'}});\n";
  wrote.push(`EQUATIONS (${FIX.length + 1}, example_oncourse_plan.js) and s2-3 setup`);
}
flush('ic_eq.js');
let line = `\n;/* integration int_data */ COURSE.files = COURSE.files.concat(${JSON.stringify(files)});`;
if (on.has('quiz-prep-cards')) {
  const q = fixture(KIT, 'quiz-prep-cards', 'PK')[0];
  const qz = Object.assign({}, q, {id: P + q.id, when: '2026-12-01T08:00', topics: ['topic1', 'topic2']}); delete qz.modules;
  line += ` COURSE.quizzes = ${JSON.stringify([qz])};`; wrote.push('COURSE.quizzes (1, quiz-prep-cards PK[0], modules -> topics, when moved)');
}
if (on.has('paper-picker') && process.env.PPEX) {
  // paper-picker's own fixture, written as its test's fixtureFiles writes it (prefix icpp-): 18
  // Basic-Pharmacokinetics questions, 10 topics and lectures, its 3 exams (current: Exam 3)
  const PK = fixture(KIT, 'paper-picker', 'PK'), pre = s => 'icpp-' + s;
  const c = require('vm').runInNewContext(fs.readFileSync(path.join(SRC, 'course.js'), 'utf8') + ';COURSE');
  const own = {prof: c.professors[0], skills: c.skills.map(s => s.id)};
  const skills = new Set(own.skills);
  const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), topic: pre(q.topic), lecture: pre(q.lecture), prof: own.prof, skill: skills.has(q.skill) ? q.skill : own.skills[0]}));
  const topics = PK.topics.map(t => Object.assign({}, t, {id: pre(t.id), prof: own.prof}));
  const lectures = PK.lectures.map(l => Object.assign({}, l, {id: pre(l.id), prof: own.prof}));
  const scaled = {1: null, 2: null, 3: [2, 2, 1, 1]};
  const exams = PK.exams.map(e => Object.assign({}, e, {questions: 6, sata: 1, pools: e.pools.map((p, i) => Object.assign({}, p, scaled[e.id] ? {marks: scaled[e.id][i]} : {}))}));
  fs.writeFileSync(path.join(SRC, 'q92_icpp.js'), '/* paper-picker test fixture (Basic-Pharmacokinetics ac2eb73), prefix icpp- */\n' +
    `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`);
  line += ` COURSE.files = COURSE.files.concat(['q92_icpp.js']); COURSE.lectures = COURSE.lectures.concat(${JSON.stringify(lectures)}); COURSE.exams = ${JSON.stringify(exams)}; COURSE.activeExam = ${JSON.stringify(PK.activeExam)};`;
  wrote.push(`paper-picker exams (${exams.length}), ${qs.length} questions, ${topics.length} topics (paper-picker PK)`);
}
fs.appendFileSync(path.join(SRC, 'course.js'), line + '\n');
console.log('int_data wrote ' + files.join(', ') + ': ' + (wrote.join('; ') || 'nothing'));
