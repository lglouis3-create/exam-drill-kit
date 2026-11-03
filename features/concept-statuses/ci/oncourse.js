/* concept-statuses: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/concept-statuses/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const FIX` (10 of Basic-Pharmacokinetics' questions of the topic "infusion",
 * inf-c4, inf-c5, inf-c11, cq2-4, inf-n1, inf-n2, inf-n4, inf-c12, inf-c13 and inf-c16, from
 * src/q3_module3.js and src/q13_quizzes.js, the topic from src/q1_module1.js, and lecture L04
 * and the skills recall, apply and infusion from src/course.js, at ac2eb73; verbatim, `prof`
 * and `teachImg` included) and its `const WORDS`
 * (Basic-Pharmacokinetics' CONCEPT_WORDS, src/views.js line 2634), written by that file's
 * `const WRITE`, the same writer the test's scratch copies use, after that file's `const PFX`:
 * one question per line in the kit's form; the topic pushed after the course's topics; the
 * lecture in COURSE.lectures; the skills the course lacks.
 * Ids (the kit's CI data rule 2): every question, topic, subtopic and lecture id, and every
 * reference to one (dupOf, topic, sub, lecture), is the course's own with the prefix cst-,
 * so another module's copy of the same Basic-Pharmacokinetics question never shares an id:
 *   questions  inf-c4 -> cst-inf-c4   inf-c5 -> cst-inf-c5   inf-c11 -> cst-inf-c11
 *              cq2-4 -> cst-cq2-4 (dupOf inf-c11 -> cst-inf-c11)
 *              inf-n1 -> cst-inf-n1  inf-n2 -> cst-inf-n2  inf-n4 -> cst-inf-n4
 *              inf-c12 -> cst-inf-c12  inf-c13 -> cst-inf-c13  inf-c16 -> cst-inf-c16
 *   topic      infusion -> cst-infusion; subtopics basics, css, pre, rate, time, stop, load
 *              -> cst-basics, cst-css, cst-pre, cst-rate, cst-time, cst-stop, cst-load
 *   lecture    L04 -> cst-L04 (the script stops if the course already has that id)
 * Concepts, skills, teachImg keys and every other field are the course's own.
 * Files written in <courseSrcDir>:
 *   q90_cst_fixture.js   the topic and the 10 questions
 *   images.json          the slide image the concept questions' teachImg fields name, when the course lacks it,
 *                        added from features/concept-statuses/current/fixture-images/ (copied
 *                        byte for byte from the course's src/images.json)
 * and one line appended to course.js: the file in COURSE.files, the professor's name in
 * COURSE.professors when the course lacks it, the lecture in
 * COURSE.lectures, the skills in COURSE.skills, and the module on at the version in its
 * module.json with `words` set to WORDS, kept beside any module already on. Writes only
 * inside <courseSrcDir>; stops with a non-zero exit on any failure, including a course
 * that already has this data (it runs once per course).
 * Data that names another module's data (rule 4): inf-n1, inf-n2 and inf-n4 carry
 * plan-the-problem `setup` lines (equations "css", "cp-infusing", "thalf-first", "cl-k-vd")
 * and `asks` keys. A `setup` is written only when the course's EQUATIONS (from the data
 * files the course lists) has every equation it names, and an `asks` only when the course's
 * ASKS has the key; otherwise it is left out and the script prints which.
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
const RAW = grab('FIX'), PFX = grab('PFX'), WORDS = grab('WORDS'), WRITE = grab('WRITE');
if(typeof PFX !== 'function') fail('test.js has no PFX');
let FIX;
try { FIX = PFX(RAW); } catch(e){ fail('test.js\'s FIX cannot be prefixed: ' + e.message); }
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
// the course's own questions and topics, read from its data files, so nothing is written twice
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
const taken = FIX.qs.map(q => q.id).filter(id => bank.q.includes(id)).concat(FIX.topics.map(t => t.id).filter(id => bank.t.includes(id)), lids.includes(FIX.lecture.id) ? [FIX.lecture.id] : []);
if(taken.length) fail('the course already has the id(s) ' + taken.join(', ') + ' (this script runs once per course)');
let imgs;
try { imgs = JSON.parse(fs.readFileSync(path.join(src, 'images.json'), 'utf8')); } catch(e){ fail('the course\'s images.json cannot be read: ' + e.message); }
const own = {profs: COURSE.professors || [], images: Object.keys(imgs), qids: bank.q, topics: bank.t, skills: (COURSE.skills || []).map(s => s.id), lids, eq: bank.eq, asks: bank.asks};
let w;
try { w = WRITE(FIX, own); } catch(e){ fail('the fixture cannot be written: ' + e.message); }
if(!w.rows) fail('the course already has every question of the fixture');
const cfg = {version: meta.version, words: WORDS};
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` + w.line +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify(cfg)}});\n`;
const idir = path.join(cur, 'fixture-images');
for(const k of w.images){
  let file;
  try { file = fs.readdirSync(idir).find(n => n.startsWith(k + '.')); } catch(e){ fail('cannot read ' + idir + ': ' + e.message); }
  if(!file) fail(idir + ' has no image ' + k);
  imgs[k] = `data:image/${path.extname(file).slice(1)};base64,` + fs.readFileSync(path.join(idir, file)).toString('base64');
}
try { fs.writeFileSync(data, w.body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
if(w.images.length){ try { fs.writeFileSync(path.join(src, 'images.json'), JSON.stringify(imgs)); } catch(e){ fail('cannot write images.json: ' + e.message); } }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${w.topics} topics and ${w.rows} questions from FIX in test.js)`);
console.log(`wrote: ${w.images.length} slide image(s) added to images.json (${w.images.join(', ') || 'none'})`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, ${w.profs.length ? `the professor(s) ${w.profs.join(', ')} in COURSE.professors, ` : ''}${w.lecture ? `the lecture ${FIX.lecture.deck} (id ${FIX.lecture.id}) in COURSE.lectures` : 'no lecture'}, ` +
  `${w.skills} skill(s) in COURSE.skills, and ${NAME} ${meta.version} on with words (${Object.keys(WORDS).length} entries)`);
console.log(`left out: ${w.dropped.teachImg.length} teachImg field(s) on calculations (${w.dropped.teachImg.join(', ') || 'none'}; core fault C7, kit PR #30), ${w.dropped.setup.length} setup line(s)${w.dropped.setup.length ? ' (' + w.dropped.setup.join(', ') + ')' : ''} naming an equation the course's EQUATIONS lacks, ` +
  `${w.dropped.asks.length} asks key(s)${w.dropped.asks.length ? ' (' + w.dropped.asks.join(', ') + ')' : ''} the course's ASKS lacks`);
