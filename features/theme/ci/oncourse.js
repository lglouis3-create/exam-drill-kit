/* theme: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/theme/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module reads no course data and has no options, so no data file is written.
 * One line is appended to <courseSrcDir>/course.js: the module on at the version in
 * its module.json, kept beside any module already on. The module's own test adds its
 * fixture (Basic-Pharmacokinetics questions, at ac2eb73) in its own scratch copies, so
 * its colour and contrast checks run on the course's pages and on real course pages.
 * Writes only inside <courseSrcDir>; stops with a non-zero exit on any failure,
 * including a course.js that already switches the module on (it runs once per course).
 */
const fs = require('fs'), path = require('path');
const NAME = 'theme', TAG = '/* theme ci */';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', NAME, 'current', 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read the kit's features/${NAME}/current/module.json: ${e.message}`); }
if(meta.name !== NAME || !/^v[0-9]+$/.test(String(meta.version))) fail('module.json does not name the module or a version like v1');
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
const line = `\n;${TAG} COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
console.log('wrote: no data files (the module reads no course data)');
