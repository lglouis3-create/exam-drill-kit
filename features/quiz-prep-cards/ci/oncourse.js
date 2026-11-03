/* quiz-prep-cards: build the module's own course in a fresh scratch course, for the kit's CI.
 *
 *     node features/quiz-prep-cards/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is Basic-Pharmacokinetics' own, at ac2eb73, read from the fixture
 * of the module's test (`const FIX` in features/quiz-prep-cards/current/test.js),
 * copied as it is:
 *   - COURSE.quizzes (src/course.js): Quiz 5 and Quiz 4, with their real dates;
 *   - 20 questions with their real ids and modules: 15 of the 18 of the professor's
 *     graded Quiz 4 and Quiz 5 (src/q13_quizzes.js) and the 5 questions their dupOf
 *     fields name (src/q8_module6b.js, q12_module7.js, q15_module7b.js,
 *     q16_module8.js); the test's comment names the 7 left out and why;
 *   - the 6 TOPICS entries those questions name (src/q1_module1.js, q15_module7b.js,
 *     q16_module8.js), after the course's own topics;
 *   - the 5 COURSE.lectures entries those questions name (L08 to L12);
 *   - the COURSE.skills entries those questions name that the course does not have.
 * `prof` is the source's own, verbatim (rework 2026-11-03, Louis's policy), and that professor is added
 * to COURSE.professors when the course lacks it. The change: the ids (the kit's CI data rule 2), through that file's `const PFX`:
 * every question, topic, subtopic and lecture id, and every reference to one (dupOf, topic,
 * sub, lecture), is the course's own with the prefix qpc-, so another module's copy of the
 * same Basic-Pharmacokinetics question never shares an id:
 *   questions  cq4-2, cq4-3, m6b-c16, cq4-4, cq4-5, m6b-c14, cq4-6, cq4-7, cq4-8, cq4-9,
 *              cq4-10, m7-c03, cq5-1, pd-c20, cq5-3, cq5-4, cq5-6, nl-c04, cq5-7, cq5-8
 *              -> qpc-cq4-2 ... qpc-cq5-8 (dupOf the same way, e.g. qpc-cq4-3 -> qpc-m6b-c16)
 *   topics     multi, intermit, multoral, bioavail, pkpd, nonlin -> qpc-multi ... qpc-nonlin;
 *              each subtopic x -> qpc-x
 *   lectures   L08, L09, L10, L11, L12 -> qpc-L08 ... qpc-L12
 * The script stops if the course already has any of these ids. The quizzes' ids and
 * modules, the concepts and every other field are the course's own. Data that names another
 * module's data (rule 4): the 9 calculations carry plan-the-problem `setup` lines and `asks`
 * keys; a `setup` is written only when the course's EQUATIONS (from the data files the course
 * lists) has every equation it names, and an `asks` only when the course's ASKS has the key;
 * otherwise it is left out and the script prints which. Nothing is invented. The quizzes' dates are in the past; the
 * module's test sets the page's clock to see the cards, and the course data keeps
 * the real dates.
 * Files written in <courseSrcDir>:
 *   q90_qpc_pk.js   the topics (TOPICS.push) and the questions (QUESTIONS.push), one
 *                   question per line opening `{id:'...'`, the professor as a literal
 * and one line appended to course.js: the file in COURSE.files, the lectures (as
 * `{id:'qpc-L08', ...}` literals) in COURSE.lectures, the skills in COURSE.skills, the
 * quizzes as COURSE.quizzes, and the module on at the version in its module.json,
 * kept beside any module already on. Writes only inside <courseSrcDir>; prints what
 * it wrote; stops with a non-zero exit on any failure, including a course it already
 * ran on (it runs once per fresh course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'quiz-prep-cards', TAG = '/* quiz-prep-cards ci */', FILE = 'q90_qpc_pk.js';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, FIX;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try {
  const test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8');
  const m = test.match(/^const FIX = (\{.*\});$/m);
  if(!m) throw new Error('no line `const FIX = {...};` in it');
  // `const PFX = ...`: its first line and every indented line after it
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith('const PFX = '));
  if(at < 0) throw new Error('no top-level `const PFX = ` in it');
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  const PFX = vm.runInNewContext(lines.slice(at, end).join('\n') + '\n;PFX', {});
  FIX = PFX(JSON.parse(m[1]));
} catch(e){ fail(`cannot read the fixture in ${path.join(cur, 'test.js')}: ${e.message}`); }
for(const k of ['quizzes', 'topics', 'qs', 'lectures', 'skills'])
  if(!Array.isArray(FIX[k]) || (k !== 'skills' && !FIX[k].length)) fail(`the fixture in test.js has no ${k}`);
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
if(COURSE.quizzes) fail('course.js already has quizzes');
const lit = s => { if(!/^[A-Za-z0-9 ._-]+$/.test(String(s))) fail(`"${s}" cannot be written as a literal`); return `'${s}'`; };
// the course's own questions, topics, equations and ASKS keys, read from its data files
// course.js first, as the build runs it, since a data file may read or add to COURSE
const sb = {}; vm.createContext(sb);
try { vm.runInContext(text, sb, {filename: 'course.js'}); } catch(e){ fail('course.js cannot be run: ' + e.message); }
for(const f of (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js'])){
  try { vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8'), sb, {filename: f}); }
  catch(e){ fail(`cannot read the course's ${f}: ${e.message}`); }
}
let bank;
try { bank = vm.runInContext('({q: QUESTIONS.map(q => q.id), t: TOPICS.map(t => t.id),' +
  ' eq: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : [],' +
  ' asks: typeof ASKS !== "undefined" && ASKS && typeof ASKS === "object" ? Object.keys(ASKS) : []})', sb); }
catch(e){ fail('the course has no QUESTIONS or TOPICS: ' + e.message); }
const has = new Set((COURSE.lectures || []).map(l => l.id));
const clash = FIX.qs.map(q => q.id).filter(id => bank.q.includes(id)).concat(FIX.topics.map(t => t.id).filter(id => bank.t.includes(id)), FIX.lectures.map(l => l.id).filter(id => has.has(id)));
if(clash.length) fail('the course already has the id(s) ' + clash.join(', ') + ' (this script runs once per course)');
// rule 4: a `setup` only when EQUATIONS has every equation it names, an `asks` only when ASKS has the key
const EQ = new Set(bank.eq), AK = new Set(bank.asks), dropped = {setup: [], asks: []};
FIX.qs = FIX.qs.map(q => { const r = Object.assign({}, q);
  if(r.setup !== undefined && !(r.setup && (r.setup.eq === 'none' || EQ.has(r.setup.eq)) && (r.setup.pre || []).every(x => EQ.has(x)))){ delete r.setup; dropped.setup.push(q.id); }
  if(r.asks !== undefined && !AK.has(r.asks)){ delete r.asks; dropped.asks.push(q.id); }
  return r; });
// the source's own professor (`prof`, verbatim), added to COURSE.professors when the course lacks it
const bad = FIX.qs.concat(FIX.topics, FIX.lectures).filter(o => typeof o.prof !== 'string' || !o.prof).map(o => o.id);
if(bad.length) fail('the fixture has no prof on: ' + bad.join(', '));
const addProfs = [...new Set(FIX.qs.concat(FIX.topics, FIX.lectures).map(o => o.prof))].filter(p => !(COURSE.professors || []).includes(p));
// one question per line, `{id:'…', [type:'…',] prof:'…', …}`, as browser_test.js counts them
const qLine = q => { const rest = Object.assign({}, q); delete rest.id; delete rest.type; delete rest.prof;
  return `{id:${lit(q.id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` prof:${lit(q.prof)}, ` + JSON.stringify(rest).slice(1) + ','; };
// a lecture as `{id:'qpc-L08', …}`, as state_check.js finds it in course.js
const lLine = l => { const rest = Object.assign({}, l); delete rest.id; return `{id:${lit(l.id)}, ` + JSON.stringify(rest).slice(1); };
const skills = FIX.skills.filter(s => !(COURSE.skills || []).some(x => x.id === s.id));
const body = `/* quiz-prep-cards ci: Basic-Pharmacokinetics (ac2eb73): the topics ${FIX.topics.map(t => t.id).join(', ')} and the
   ${FIX.qs.length} questions of the professor's graded Quiz 4 and Quiz 5 (src/q13_quizzes.js) and those their dupOf names, from the
   fixture in features/quiz-prep-cards/current/test.js; prof as written, ids prefixed qpc-, and a setup or asks the course
   has no equation or ASKS key for left out; nothing else changed */
TOPICS.push(${FIX.topics.map(t => JSON.stringify(t)).join(',\n ')});
QUESTIONS.push(
${FIX.qs.map(qLine).join('\n')}
);
`;
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${FIX.lectures.map(lLine).join(', ')}]); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.professors = (COURSE.professors || []).concat(${JSON.stringify(addProfs)}); ` +
  `COURSE.quizzes = (COURSE.quizzes || []).concat(${JSON.stringify(FIX.quizzes)}); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${FIX.topics.length} topics, ${FIX.qs.length} questions from the fixture in test.js)`);
console.log(`wrote: appended to ${course}: ${FILE} in COURSE.files, lectures ${FIX.lectures.map(l => l.id).join(', ')}, ` +
  `${skills.length} skills (${skills.map(s => s.id).join(', ') || 'none new'}), ${FIX.quizzes.length} quizzes (${FIX.quizzes.map(z => z.id + ' ' + z.when).join(', ')}), and ${NAME} ${meta.version} on`);
console.log(`left out: ${dropped.setup.length} setup line(s)${dropped.setup.length ? ' (' + dropped.setup.join(', ') + ')' : ''} naming an equation the course's EQUATIONS lacks, ` +
  `${dropped.asks.length} asks key(s)${dropped.asks.length ? ' (' + dropped.asks.join(', ') + ')' : ''} the course's ASKS lacks`);
