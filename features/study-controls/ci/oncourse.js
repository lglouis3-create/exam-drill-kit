/* study-controls: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/study-controls/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const FIX` (Intro to Pharmacology's Day 1 topic, its lecture, 6 of its
 * questions and the professor's 10/21 answer on going back to a question, verbatim from
 * Intro-Pharmacology- exam1-drill/src at 929cd62, every `prof` the source's own, and the
 * professors added to COURSE.professors), written by that file's `const WRITE`, the same writer the test's scratch
 * copies use (its comment lists how: one question per line in the kit's form, a topic of
 * its own after the course's topics, the lecture under the first id from L91 on that the
 * course's lectures do not use). The question ids are the course's own (L01-002 and so on);
 * the test finds them in the course and uses the course's copy. The script stops when the
 * course already holds one of them or the topic id (CIDATA rule 2).
 * Lecture id: the source's L01 (Intro to Pharmacology course.js) is written as L91, or, when
 * the course already has L91 (other modules' scripts write L91 and L92), as the next id from
 * L92 on that is free (CIDATA rule 2). The output names the id used.
 * Files written in <courseSrcDir>:
 *   q90_sc_fixture.js   the topic and the 6 questions
 * and one line appended to course.js: the file in COURSE.files, the lecture in
 * COURSE.lectures, and the module on at the version in its module.json with strict: true
 * and strictNote (the professor's answer), kept beside any module already on. Writes only
 * inside <courseSrcDir>; stops with a non-zero exit on any failure, including a course that
 * already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'study-controls', TAG = '/* study-controls ci */', FILE = 'q90_sc_fixture.js';
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
const FIX = grab('FIX'), WRITE = grab('WRITE');
if(!FIX || !FIX.topic || !FIX.lecture || !Array.isArray(FIX.qs) || !FIX.qs.length || typeof WRITE !== 'function') fail('test.js has no FIX with a topic, a lecture and questions, or no WRITE');
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const own = {skills: (COURSE.skills || []).map(s => s.id), lectures: COURSE.lectures || []};
// the question and topic ids are the source's own (L01-002, L01): the course must not hold them yet (CIDATA rule 2)
const held = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).map(f => { try { return fs.readFileSync(path.join(src, f), 'utf8'); } catch(e){ return ''; } }).join('\n');
const taken = [FIX.topic.id].concat(FIX.qs.map(q => q.id)).filter(id => new RegExp(`(^|[{,\\s])["']?id["']?\\s*:\\s*["']${id}["']`).test(held));
if(taken.length) fail('the course already holds the id(s) ' + taken.join(', '));
if(!own.skills.length) fail('course.js lists no skills');
let w;
try { w = WRITE(FIX, own, {base: true}); } catch(e){ fail('the fixture cannot be written: ' + e.message); }
const cfg = {version: meta.version, strict: true, strictNote: FIX.strictNote};
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  (w.lecture ? `COURSE.lectures = (COURSE.lectures || []).concat([${w.lecture}]); ` : '') +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify(cfg)}});\n`;
try { fs.writeFileSync(data, w.body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (topic ${FIX.topic.id} and ${w.rows} questions from FIX in test.js)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, ${w.lecture ? 'the lecture ' + FIX.lecture.deck + ' (id ' + w.lectureId + ', the source\'s ' + FIX.lecture.id + ') in COURSE.lectures' : 'no lecture (the course has the deck)'}, ` +
  `and ${NAME} ${meta.version} on with strict: true and the strict note`);
