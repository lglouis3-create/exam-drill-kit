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
 * The one change: every `prof` is the template's "Professor", so no personal name is
 * in the kit's course. Nothing is invented. The quizzes' dates are in the past; the
 * module's test sets the page's clock to see the cards, and the course data keeps
 * the real dates.
 * Files written in <courseSrcDir>:
 *   q90_qpc_pk.js   the topics (TOPICS.push) and the questions (QUESTIONS.push), one
 *                   question per line opening `{id:'...'`, the professor as a literal
 * and one line appended to course.js: the file in COURSE.files, the lectures (as
 * `{id:'L08', ...}` literals) in COURSE.lectures, the skills in COURSE.skills, the
 * quizzes as COURSE.quizzes, and the module on at the version in its module.json,
 * kept beside any module already on. Writes only inside <courseSrcDir>; prints what
 * it wrote; stops with a non-zero exit on any failure, including a course it already
 * ran on (it runs once per fresh course).
 */
const fs = require('fs'), path = require('path');
const NAME = 'quiz-prep-cards', TAG = '/* quiz-prep-cards ci */', FILE = 'q90_qpc_pk.js', PROF = 'Professor';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, FIX;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try {
  const m = fs.readFileSync(path.join(cur, 'test.js'), 'utf8').match(/^const FIX = (\{.*\});$/m);
  if(!m) throw new Error('no line `const FIX = {...};` in it');
  FIX = JSON.parse(m[1]);
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
if(!(COURSE.professors || []).includes(PROF)) fail(`course.js does not list the professor "${PROF}"`);
if(COURSE.quizzes) fail('course.js already has quizzes');
const lit = s => { if(!/^[A-Za-z0-9 ._-]+$/.test(String(s))) fail(`"${s}" cannot be written as a literal`); return `'${s}'`; };
const has = new Set((COURSE.lectures || []).map(l => l.id));
const clash = FIX.lectures.filter(l => has.has(l.id)).map(l => l.id);
if(clash.length) fail('course.js already has lecture ' + clash.join(', '));
const bad = FIX.qs.concat(FIX.topics, FIX.lectures).filter(o => o.prof !== PROF).map(o => o.id);
if(bad.length) fail(`the fixture has a prof other than "${PROF}": ` + bad.join(', '));
// one question per line, `{id:'…', [type:'…',] prof:'Professor', …}`, as browser_test.js counts them
const qLine = q => { const rest = Object.assign({}, q); delete rest.id; delete rest.type; delete rest.prof;
  return `{id:${lit(q.id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` prof:${lit(PROF)}, ` + JSON.stringify(rest).slice(1) + ','; };
// a lecture as `{id:'L08', …}`, as state_check.js finds it in course.js
const lLine = l => { const rest = Object.assign({}, l); delete rest.id; return `{id:${lit(l.id)}, ` + JSON.stringify(rest).slice(1); };
const skills = FIX.skills.filter(s => !(COURSE.skills || []).some(x => x.id === s.id));
const body = `/* quiz-prep-cards ci: Basic-Pharmacokinetics (ac2eb73): the topics ${FIX.topics.map(t => t.id).join(', ')} and the
   ${FIX.qs.length} questions of the professor's graded Quiz 4 and Quiz 5 (src/q13_quizzes.js) and those their dupOf names, from the
   fixture in features/quiz-prep-cards/current/test.js; prof set to "Professor", nothing else changed */
TOPICS.push(${FIX.topics.map(t => JSON.stringify(t)).join(',\n ')});
QUESTIONS.push(
${FIX.qs.map(qLine).join('\n')}
);
`;
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${FIX.lectures.map(lLine).join(', ')}]); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.quizzes = ${JSON.stringify(FIX.quizzes)}; ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${FIX.topics.length} topics, ${FIX.qs.length} questions from the fixture in test.js)`);
console.log(`wrote: appended to ${course}: ${FILE} in COURSE.files, lectures ${FIX.lectures.map(l => l.id).join(', ')}, ` +
  `${skills.length} skills (${skills.map(s => s.id).join(', ') || 'none new'}), ${FIX.quizzes.length} quizzes (${FIX.quizzes.map(z => z.id + ' ' + z.when).join(', ')}), and ${NAME} ${meta.version} on`);
