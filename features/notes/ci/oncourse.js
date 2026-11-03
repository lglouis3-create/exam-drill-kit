/* notes: switch the module on in a fresh scratch course, for the kit's CI (the shape agreed
 * in PR #12). Outside current/, so a course never copies it.
 *
 *     node features/notes/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const FIX` (Basic-Pharmacokinetics' topics pkpd and nonlin, their lectures
 * L11 and L12, their skills pkpd and nonlin, and 58 of their questions, from src/ at
 * ac2eb73, every value verbatim, `prof` included: rework 2026-11-03, Louis's policy; the
 * professor is added to COURSE.professors when the course lacks it), written by that file's
 * `const WRITE`, the same writer the test's scratch copies use (its comment says how: one
 * question per line in the kit's form, the two topics of their own after the course's
 * topics, the lectures in the course's literal form), after that file's `const PFX`.
 * Ids (the kit's CI data rule 2): every question, topic, subtopic and lecture id, and every
 * reference to one (dupOf, topic, sub, lecture), is the course's own with the prefix nts-,
 * so another module's copy of the same Basic-Pharmacokinetics question never shares an id:
 *   questions  each question id x of FIX -> nts-x, for example cq5-1 -> nts-cq5-1 (dupOf nts-pd-c20),
 *              cq5-6 -> nts-cq5-6 (dupOf nts-nl-c04), pd-c20 -> nts-pd-c20, nl-ex2a -> nts-nl-ex2a
 *   topics     pkpd -> nts-pkpd, nonlin -> nts-nonlin; each subtopic x -> nts-x
 *   lectures   L11 -> nts-L11, L12 -> nts-L12
 * The script stops if the course already has any of these ids. The test finds them in the
 * course and uses the course's copy. Concepts, skills and every other field are the
 * course's own. Data that names another module's data (rule 4): pd-ex-b, nl-ex1 and nl-ex2a
 * carry plan-the-problem `setup` lines and `asks` keys; a `setup` is written only when the
 * course's EQUATIONS (from the data files the course lists) has every equation it names,
 * and an `asks` only when the course's ASKS has the key; otherwise it is left out and the
 * script prints which. The module reads no course data of its own, so no module data
 * file is written.
 * Files written in <courseSrcDir>:
 *   q90_notes_fixture.js   the two topics and the 58 questions
 * and one line appended to course.js: the file in COURSE.files, the two lectures in
 * COURSE.lectures and the two skills in COURSE.skills (a skill only when the course
 * lacks it), and notes on at the version in its module.json, kept beside any module already on.
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
const RAW = grab('FIX'), PFX = grab('PFX'), WRITE = grab('WRITE');
if(typeof PFX !== 'function') fail('test.js has no PFX');
let FIX;
try { FIX = PFX(RAW); } catch(e){ fail('test.js\'s FIX cannot be prefixed: ' + e.message); }
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
const lids = (COURSE.lectures || []).map(l => l.id);
const taken = FIX.qs.map(q => q.id).filter(id => bank.q.includes(id)).concat(FIX.topics.map(t => t.id).filter(id => bank.t.includes(id)), FIX.lectures.map(l => l.id).filter(id => lids.includes(id)));
if(taken.length) fail('the course already has the id(s) ' + taken.join(', ') + ' (this script runs once per course)');
const own = {profs: COURSE.professors || [], skills: (COURSE.skills || []).map(s => s.id), lectures: COURSE.lectures || [], eq: bank.eq, asks: bank.asks};
if(FIX.qs.concat(FIX.topics, FIX.lectures).some(x => typeof x.prof !== 'string' || !x.prof)) fail('a question, topic or lecture of the fixture has no prof');
let w;
try { w = WRITE(FIX, own, {base: true}); } catch(e){ fail('the fixture cannot be written: ' + e.message); }
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  w.line + `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, w.body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (topics ${FIX.topics.map(t => t.id).join(', ')} and ${w.rows} questions from FIX in test.js)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, lectures ${w.lectures.join(', ')} in COURSE.lectures, ` +
  `skills ${w.skills.join(', ') || 'none (the course has them)'} in COURSE.skills, and ${NAME} ${meta.version} on`);
console.log(`left out: ${w.dropped.setup.length} setup line(s)${w.dropped.setup.length ? ' (' + w.dropped.setup.join(', ') + ')' : ''} naming an equation the course's EQUATIONS lacks, ` +
  `${w.dropped.asks.length} asks key(s)${w.dropped.asks.length ? ' (' + w.dropped.asks.join(', ') + ')' : ''} the course's ASKS lacks`);
