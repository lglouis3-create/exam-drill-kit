/* field-colours: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/field-colours/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * field-colours reads no course data; what it colours are the headings drug-list-tab
 * marks. So the course gets drug-list-tab too, unless it already has it on: its
 * current/ is copied into <courseSrcDir>/features/drug-list-tab/ and its own
 * ci/oncourse.js is run (BDK's drug list from drug-list-tab's test fixture, table ids
 * prefixed dlc-). field-colours does not `need` drug-list-tab: a course may use it with
 * another module that marks its headings (compare-tab, later). Then one line is appended
 * to course.js: field-colours on at the version in its module.json with BDK's fields
 * (its defaults), kept beside any module already on. Writes only inside <courseSrcDir>;
 * stops with a non-zero exit on any failure, including a course that already has it on
 * (it runs once per course).
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const NAME = 'field-colours', TAG = '/* field-colours ci */';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', NAME, 'current', 'module.json'), 'utf8')); }
catch(e){ fail('cannot read its module.json: ' + e.message); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
if(!(COURSE.features || {})['drug-list-tab']){
  const from = path.join(kit, 'features', 'drug-list-tab', 'current'), to = path.join(src, 'features', 'drug-list-tab');
  if(!fs.existsSync(path.join(from, 'module.json'))) fail('the kit has no features/drug-list-tab/current to colour');
  try { fs.mkdirSync(to, {recursive: true}); fs.cpSync(from, to, {recursive: true}); } catch(e){ fail('cannot copy drug-list-tab: ' + e.message); }
  console.log(`wrote: ${to} (drug-list-tab's current/)`);
  const r = child.spawnSync('node', [path.join(kit, 'features', 'drug-list-tab', 'ci', 'oncourse.js'), kit, src], {encoding: 'utf8'});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
  if(r.status !== 0) fail('drug-list-tab\'s ci/oncourse.js stopped');
}
const line = `\n;${TAG} COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: appended to ${course}: ${NAME} ${meta.version} on, with its default fields (BDK's)`);
