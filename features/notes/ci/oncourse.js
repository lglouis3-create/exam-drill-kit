/* notes: switch the module on in a fresh scratch course, for the kit's CI (the shape agreed
 * in PR #12). Outside current/, so a course never copies it.
 *
 *     node features/notes/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const FIX` (Basic-Pharmacokinetics' topics pkpd and nonlin, their lectures
 * L11 and L12, their skills pkpd and nonlin, and 16 of their questions, from src/ at
 * ac2eb73, with `prof` set to the template's "Professor"), written by that file's
 * `const WRITE`, the same writer the test's scratch copies use (its comment says how: one
 * question per line in the kit's form, the two topics of their own after the course's
 * topics, the lectures in the course's literal form). The question ids are the course's
 * own (cq5-5, nl-c01 and so on); the test finds them in the course and uses the course's
 * copy. The module reads no course data of its own, so no module data file is written.
 * Files written in <courseSrcDir>:
 *   q90_notes_fixture.js   the two topics and the 16 questions
 * and one line appended to course.js: the file in COURSE.files, the two lectures in
 * COURSE.lectures and the two skills in COURSE.skills (each only when the course lacks
 * it), and notes on at the version in its module.json, kept beside any module already on.
 * The module must already be copied into <courseSrcDir>/features/notes/. Writes only
 * inside <courseSrcDir>; stops with a non-zero exit on any failure, including a course
 * that already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'notes', TAG = '/* switched on by features/notes/ci/oncourse.js */', FILE = 'q90_notes_fixture.js';
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
if(!FIX || !Array.isArray(FIX.topics) || !FIX.topics.length || !Array.isArray(FIX.lectures) || !Array.isArray(FIX.skills) || !Array.isArray(FIX.qs) || !FIX.qs.length || typeof WRITE !== 'function')
  fail('test.js has no FIX with topics, lectures, skills and questions, or no WRITE');
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const own = {prof: (COURSE.professors || [])[0], skills: (COURSE.skills || []).map(s => s.id), lectures: COURSE.lectures || []};
if(typeof own.prof !== 'string' || !own.prof) fail('course.js has no first professor');
let w;
try { w = WRITE(FIX, own, {base: true}); } catch(e){ fail('the fixture cannot be written: ' + e.message); }
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  w.line + `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, w.body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (topics ${FIX.topics.map(t => t.id).join(', ')} and ${w.rows} questions from FIX in test.js)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, lectures ${w.lectures.join(', ') || 'none (the course has them)'} in COURSE.lectures, ` +
  `skills ${w.skills.join(', ') || 'none (the course has them)'} in COURSE.skills, and ${NAME} ${meta.version} on`);
