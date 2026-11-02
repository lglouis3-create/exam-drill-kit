/* wrong-number-diagnosis: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/wrong-number-diagnosis/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module reads no course data file: it reads the course's own calculations
 * (questions of type 'numeric') after a wrong typed number, and its test.js brings
 * its own probe question (Basic-Pharmacokinetics src/test.js line 368, ac2eb73) into
 * its own scratch copies. One line is appended to <courseSrcDir>/course.js: the
 * module on at the version in its module.json, kept beside any module already on.
 * Writes only inside <courseSrcDir>; stops with a non-zero exit on any failure,
 * including a course.js that already switches the module on (it runs once per course).
 */
const fs = require('fs'), path = require('path');
const NAME = 'wrong-number-diagnosis', TAG = '/* wrong-number-diagnosis ci */';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', NAME, 'current', 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read the kit's features/${NAME}/current/module.json: ${e.message}`); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
if(fs.readFileSync(course, 'utf8').includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
const line = `\n;${TAG} COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: appended to ${course}: ${NAME} ${meta.version} on`);
console.log('wrote: no data files (the module reads the course\'s own calculations)');
