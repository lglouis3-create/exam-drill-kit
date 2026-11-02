/* paper-picker: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/paper-picker/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test, read from
 * features/paper-picker/current/test_fixture.js as it stands: Basic-Pharmacokinetics'
 * three exams, its activeExam, its twelve lectures, the skills, topics and questions
 * that file names (ac2eb73), with the course's own first professor as each `prof`
 * (the one change to the data; the file's header says which questions and why).
 * Files written in <courseSrcDir>:
 *   q90_paper_picker_pk.js   the topics (TOPICS.push, after the course's own) and the
 *                            questions, one per line in the kit's question-file form
 *   images.json              the images those questions show, added to the course's own
 *                            (an image already there under the same key with other data
 *                            stops the script)
 * and one line appended to course.js: the file in COURSE.files, the lectures (ids
 * pp-L01 ... pp-L12) in COURSE.lectures, the skills the course lacks in COURSE.skills,
 * COURSE.exams and COURSE.activeExam set to the course's, and the module on at the
 * version in its module.json, kept beside any module already on. Writes only inside
 * <courseSrcDir>; stops with a non-zero exit on any failure, including a course that
 * already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path');
const NAME = 'paper-picker', TAG = '/* paper-picker ci */';
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
let out;
try { out = FX.courseData(prof); } catch(e){ fail(e.message); }
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FX.FILE)}]); ` +
  out.courseLine + ` COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
const imagesFile = path.join(src, 'images.json');
let images;
try { images = FX.withImages(fs.existsSync(imagesFile) ? fs.readFileSync(imagesFile, 'utf8') : '{}'); } catch(e){ fail('images.json: ' + e.message); }
try { fs.writeFileSync(data, out.files[FX.FILE]); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.writeFileSync(imagesFile, images); } catch(e){ fail('cannot write ' + imagesFile + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${FX.PK.topics.length} topics and ${FX.PK.qs.length} questions from features/${NAME}/current/test_fixture.js, prof ${JSON.stringify(prof)})`);
console.log(`wrote: ${imagesFile} (the ${Object.keys(FX.PK.images).length} images those questions show, added to the course's own)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, ${FX.PK.lectures.length} lectures in COURSE.lectures, ` +
  `the skills the course lacks, COURSE.exams (${FX.PK.exams.map(e => e.name).join(', ')}), COURSE.activeExam ${JSON.stringify(FX.PK.activeExam)}, and ${NAME} ${meta.version} on`);
