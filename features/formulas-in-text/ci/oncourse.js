/* formulas-in-text: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/formulas-in-text/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module reads no course data file: it sets the formulas in whatever question
 * text the course has, with the course's options. The options are the ones the
 * module's own test.js switches it on with, read from that file as it stands:
 * `PK_SYMBOLS` and `PK_RATES` (Basic-Pharmacokinetics src/views.js lines 16-38 and 43,
 * ac2eb73) and halfLife, times, minus and powers on. The test brings its own
 * Basic-Pharmacokinetics questions into its own scratch copies. One line is appended
 * to <courseSrcDir>/course.js: the module on at the version in its module.json with
 * those options, kept beside any module already on. Writes only inside
 * <courseSrcDir>; stops with a non-zero exit on any failure, including a course.js
 * that already switches the module on (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'formulas-in-text', TAG = '/* formulas-in-text ci */';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read ${path.join(cur, 'test.js')}: ${e.message}`); }
// a top-level `const <name> = ...` of test.js (its first line and the indented lines
// after it), evaluated alone
function grab(name){
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`test.js has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInNewContext(lines.slice(at, end).join('\n') + `\n;${name}`, {}); }
  catch(e){ fail(`test.js's ${name} cannot be read: ${e.message}`); }
}
const SYMBOLS = grab('PK_SYMBOLS'), RATES = grab('PK_RATES');
if(!Array.isArray(SYMBOLS) || !SYMBOLS.length || !Array.isArray(RATES) || !RATES.length) fail('test.js has no symbols or rates');
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
if(fs.readFileSync(course, 'utf8').includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
const opts = {version: meta.version, symbols: SYMBOLS, rates: RATES, halfLife: true, times: true, minus: true, powers: true};
const line = `\n;${TAG} COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify(opts)}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: appended to ${course}: ${NAME} ${meta.version} on with ${SYMBOLS.length} symbols, ${RATES.length} rates, ` +
  'halfLife, times, minus and powers (the options of its test.js)');
console.log('wrote: no data files (the module reads no course data file)');
