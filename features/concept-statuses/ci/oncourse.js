/* concept-statuses: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/concept-statuses/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const FIX` (7 of Basic-Pharmacokinetics' questions of the topic "infusion",
 * inf-c4, inf-c5, inf-c11, cq2-4, inf-n1, inf-n2 and inf-n4, from src/q3_module3.js and
 * src/q13_quizzes.js, the topic from src/q1_module1.js, and lecture L04 and the skills recall,
 * apply and infusion from src/course.js, at ac2eb73; `prof` set to the template's
 * "Professor", `teachImg` left out) and its `const WORDS`
 * (Basic-Pharmacokinetics' CONCEPT_WORDS, src/views.js line 2634), written by that file's
 * `const WRITE`, the same writer the test's scratch copies use: one question per line in
 * the kit's form, with the course's own ids; the topics pushed after the course's topics;
 * the lecture under id L91 when the course has no entry for its deck; the skills the
 * course lacks.
 * Files written in <courseSrcDir>:
 *   q90_cst_fixture.js   the topic and the 7 questions
 * and one line appended to course.js: the file in COURSE.files, the lecture in
 * COURSE.lectures, the skills in COURSE.skills, and the module on at the version in its
 * module.json with `words` set to WORDS, kept beside any module already on. Writes only
 * inside <courseSrcDir>; stops with a non-zero exit on any failure, including a course
 * that already has this data (it runs once per course).
 * Known limit: inf-n1, inf-n2 and inf-n4 keep their `setup` lines, which name the equations
 * "css" and "cp-infusing". A course that also has plan-the-problem on, without those in its
 * EQUATIONS, does not build (plan-the-problem's build step stops it). The module's own test switches
 * plan-the-problem off in its scratch copies for that reason.
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'concept-statuses', TAG = '/* concept-statuses ci */', FILE = 'q90_cst_fixture.js';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read ${path.join(cur, 'test.js')}: ${e.message}`); }
// a top-level `const NAME = ...` of test.js: its first line and every indented line after it
function grab(name){
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`test.js has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInNewContext(lines.slice(at, end).join('\n') + `\n;${name}`, {}); }
  catch(e){ fail(`test.js's ${name} cannot be read: ${e.message}`); }
}
const FIX = grab('FIX'), WORDS = grab('WORDS'), WRITE = grab('WRITE');
if(!FIX || !Array.isArray(FIX.qs) || !FIX.qs.length || !Array.isArray(FIX.topics) || !FIX.lecture || !Array.isArray(FIX.skills) ||
   !WORDS || typeof WORDS !== 'object' || typeof WRITE !== 'function') fail('test.js has no FIX with questions, topics, a lecture and skills, no WORDS, or no WRITE');
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const prof = (COURSE.professors || [])[0];
if(typeof prof !== 'string' || !prof) fail('course.js has no first professor');
// the course's own questions and topics, read from its data files, so nothing is written twice
const sb = {}; vm.createContext(sb);
for(const f of (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js'])){
  try { vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8'), sb, {filename: f}); }
  catch(e){ fail(`cannot read the course's ${f}: ${e.message}`); }
}
let bank;
try { bank = vm.runInContext('({q: QUESTIONS.map(q => q.id), t: TOPICS.map(t => t.id)})', sb); } catch(e){ fail('the course has no QUESTIONS or TOPICS: ' + e.message); }
const own = {prof, qids: bank.q, topics: bank.t, skills: (COURSE.skills || []).map(s => s.id), decks: (COURSE.lectures || []).map(l => l.deck)};
let w;
try { w = WRITE(FIX, own); } catch(e){ fail('the fixture cannot be written: ' + e.message); }
if(!w.rows) fail('the course already has every question of the fixture');
const cfg = {version: meta.version, words: WORDS};
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` + w.line +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify(cfg)}});\n`;
try { fs.writeFileSync(data, w.body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${w.topics} topics and ${w.rows} questions from FIX in test.js)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, ${w.lecture ? `the lecture ${FIX.lecture.deck} (id L91) in COURSE.lectures` : 'no lecture (the course has the deck)'}, ` +
  `${w.skills} skill(s) in COURSE.skills, and ${NAME} ${meta.version} on with words (${Object.keys(WORDS).length} entries)`);
