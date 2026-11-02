/* stopwatch: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/stopwatch/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module reads no course data, so no data file is written. One line is appended
 * to <courseSrcDir>/course.js: the module at the version in its module.json, with
 * paceSeconds 120 (the value its test.js and Basic-Pharmacokinetics use, its course.js
 * line 264), kept beside any module already on. The module's test adds its own
 * question and switches on calculations on the paper in its scratch copies.
 * Writes only inside <courseSrcDir>; stops with a non-zero exit on any failure,
 * including a course.js that already switches the module on (run once per course).
 */
const fs = require('fs'), path = require('path');
function fail(msg){ console.error('stopwatch ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/stopwatch/ci/oncourse.js <kitDir> <courseSrcDir>');
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', 'stopwatch', 'current', 'module.json'), 'utf8')); }
catch(e){ fail('cannot read the kit\'s features/stopwatch/current/module.json: ' + e.message); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', 'stopwatch', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'stopwatch'));
const text = fs.readFileSync(course, 'utf8');
if(text.includes('/* stopwatch ci */')) fail('course.js already switches stopwatch on (this script runs once per course)');
const cfg = {version: meta.version, paceSeconds: 120};
const line = `\n;/* stopwatch ci */ COURSE.features = Object.assign({}, COURSE.features, {"stopwatch": ${JSON.stringify(cfg)}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
console.log('wrote: no data files (the module reads no course data)');
