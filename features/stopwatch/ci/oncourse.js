/* stopwatch: build the module's own course in a fresh scratch course, for the kit's CI.
 *
 *     node features/stopwatch/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is Basic-Pharmacokinetics' own, at ac2eb73, read from the fixture of
 * the module's test (features/stopwatch/current/test_fixture.js) as it stands: its
 * Exam 3 (the course's activeExam, every field), the 5 numeric questions of the
 * professor's Canvas Quiz 4 and the single-answer and select-all questions that fill
 * Exam 3's pools, their topics, lectures, skills and images. That file's header says
 * which questions and why. The one change to the data: every `prof` is the course's own
 * first professor (the template's "Professor"), so the kit holds no personal name.
 * Every question, topic, subtopic and lecture id carries the prefix sw- with the course's
 * id kept inside it (cq4-2 -> sw-cq4-2; dupOf, topic, sub and lecture rewritten the same
 * way; test_fixture.js's header has the mapping), and a course that already has one of
 * these ids stops the script (kit rule 2). A calculation's `setup` line (plan-the-problem
 * equations) and `asks` (an ASKS key) are written only when the course, as it stands when
 * this script runs, has those equations and that key; otherwise they are left out and the
 * script says so (kit rule 4; the module reads neither). The module is on with paceSeconds 120, Basic-Pharmacokinetics'
 * pace (its course.js line 264: "A few calculations, each meant to take 2 minutes or
 * less"). Exam 3 has no `typed` in the course, so it is written without one.
 * Files written in <courseSrcDir>:
 *   q90_stopwatch_pk.js   the topics (TOPICS.push, after the course's own) and the
 *                         questions (QUESTIONS.push), one per line in the kit's
 *                         question-file form
 *   images.json           the images those questions show, added to the course's own (an
 *                         image already there under the same key with other data stops it)
 * and one line appended to course.js: the file in COURSE.files, the lectures (sw-L01 ...)
 * in COURSE.lectures, the skills the course lacks in COURSE.skills, COURSE.exams and
 * COURSE.activeExam set to Exam 3, and the module on at the version in its module.json,
 * kept beside any module already on. Writes only inside <courseSrcDir>; prints what it
 * wrote; stops with a non-zero exit on any failure, including a course it already ran on
 * (it runs once per fresh course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'stopwatch', TAG = '/* stopwatch ci */', PACE = 120;
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, FX;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { FX = require(path.join(cur, 'test_fixture.js')); }
catch(e){ fail(`cannot read ${path.join(cur, 'test_fixture.js')}: ${e.message}`); }
const course = path.join(src, 'course.js'), data = path.join(src, FX.FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const prof = (COURSE.professors || [])[0];
if(prof !== 'Professor') fail(`the course's first professor is ${JSON.stringify(prof)}, not the template's "Professor"`);
const F0 = FX.FIX;
const clash = (COURSE.lectures || []).filter(l => FX.FIX.lectures.some(x => FX.pre(x.id) === l.id)).map(l => l.id);
if(clash.length) fail('course.js already has lecture ' + clash.join(', '));
// what the course already holds (course.js and its data files, run as the build runs them)
let own;
try {
  const files = vm.runInNewContext(text + '\n;COURSE.files', {}) || [];
  const code = files.filter(f => fs.existsSync(path.join(src, f))).map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
  own = vm.runInNewContext(text + '\n;\n' + code + '\n;({T: typeof TOPICS === "undefined" ? [] : TOPICS.map(t => t.id), Q: typeof QUESTIONS === "undefined" ? [] : QUESTIONS.map(q => q.id),' +
    ' eq: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : [],' +
    ' asks: typeof ASKS !== "undefined" && ASKS && typeof ASKS === "object" ? Object.keys(ASKS) : []})', {});
} catch(e){ fail('the course could not be read: ' + e.message); }
const taken = [...F0.qs.map(q => FX.pre(q.id)).filter(id => own.Q.includes(id)), ...F0.topics.map(t => FX.pre(t.id)).filter(id => own.T.includes(id))];
if(taken.length) fail('the course already has the id(s) ' + taken.slice(0, 8).join(', ') + ' this script writes');
let out;
try { out = FX.courseData(prof, {eq: own.eq, asks: own.asks}); } catch(e){ fail(e.message); }
const imagesFile = path.join(src, 'images.json');
let images;
try { images = FX.withImages(fs.existsSync(imagesFile) ? fs.readFileSync(imagesFile, 'utf8') : '{}'); } catch(e){ fail('images.json: ' + e.message); }
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FX.FILE)}]); ` +
  out.courseLine + ` COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version, paceSeconds: PACE})}});\n`;
try { fs.writeFileSync(data, out.files[FX.FILE]); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.writeFileSync(imagesFile, images); } catch(e){ fail('cannot write ' + imagesFile + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
const F = FX.FIX;
console.log(`wrote: ${data} (${F.topics.length} topics and ${F.qs.length} questions: the calculations ${F.calc.map(FX.pre).join(', ')} and ` +
  `${F.qs.length - F.calc.length} single-answer and select-all questions for ${F.exam.name}; prof ${JSON.stringify(prof)})`);
console.log(`wrote: ${imagesFile} (the ${Object.keys(F.images).length} images those questions show, added to the course's own)`);
console.log(`wrote: appended to ${course}: ${FX.FILE} in COURSE.files, ${F.lectures.length} lectures (${F.lectures.map(l => FX.pre(l.id)).join(', ')}), ` +
  `the skills the course lacks, COURSE.exams = [${F.exam.name}] (no typed, as in the course), COURSE.activeExam ${JSON.stringify(F.activeExam)}, ` +
  `and ${NAME} ${meta.version} on with paceSeconds ${PACE}`);
if(out.left.setup.length) console.log(`left out: the setup line of ${out.left.setup.join(', ')} (it names equations the course's EQUATIONS does not have)`);
if(out.left.asks.length) console.log(`left out: asks of ${out.left.asks.join(', ')} (the course's ASKS does not have that key)`);
