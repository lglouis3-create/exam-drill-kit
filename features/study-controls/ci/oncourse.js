/* study-controls: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/study-controls/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module reads no course data, so no data file is written. One line is appended
 * to <courseSrcDir>/course.js: the module at the version in its module.json, with
 * strict: true (the option its test.js turns on, so the course's page has the
 * strict-paper box as well), kept beside any module already on. The module's test
 * adds its own questions, from Intro to Pharmacology, in its scratch copies.
 * Writes only inside <courseSrcDir>; stops with a non-zero exit on any failure,
 * including a course.js that already switches the module on (run once per course).
 */
const fs = require('fs'), path = require('path');
function fail(msg){ console.error('study-controls ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/study-controls/ci/oncourse.js <kitDir> <courseSrcDir>');
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', 'study-controls', 'current', 'module.json'), 'utf8')); }
catch(e){ fail('cannot read the kit\'s features/study-controls/current/module.json: ' + e.message); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', 'study-controls', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'study-controls'));
const text = fs.readFileSync(course, 'utf8');
if(text.includes('/* study-controls ci */')) fail('course.js already switches study-controls on (this script runs once per course)');
const cfg = {version: meta.version, strict: true};
const line = `\n;/* study-controls ci */ COURSE.features = Object.assign({}, COURSE.features, {"study-controls": ${JSON.stringify(cfg)}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
console.log('wrote: no data files (the module reads no course data)');
