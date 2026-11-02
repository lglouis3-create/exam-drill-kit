/* equation-drill: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/equation-drill/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as
 * it stands: its `const FIX` (14 of Basic-Pharmacokinetics' equations, ac2eb73), with
 * each id prefixed `eqc-` (the test's own scratch copies use `eqt-`, so the two never
 * share an id). The module needs formulas-in-text, which core/ci_course.sh switches on
 * first with that module's own script. Files written in <courseSrcDir>:
 *   eqc_equations.js   `const EQUATIONS = [...]` (pushed when the course already has
 *                      EQUATIONS)
 * and one line appended to course.js: the file in COURSE.files, and the module on at
 * the version in its module.json with its default options, kept beside any module
 * already on. Writes only inside <courseSrcDir>; stops with a non-zero exit on any
 * failure, including a course that already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'equation-drill', TAG = '/* equation-drill ci */', FILE = 'eqc_equations.js', PRE = 'eqc-';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read ${path.join(cur, 'test.js')}: ${e.message}`); }
function grab(name){
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`test.js has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInNewContext(lines.slice(at, end).join('\n') + `\n;${name}`, {}); }
  catch(e){ fail(`test.js's ${name} cannot be read: ${e.message}`); }
}
const FIX = grab('FIX');
if(!Array.isArray(FIX) || !FIX.length) fail('the fixture in test.js has no equations');
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
// EQUATIONS already declared by one of the course's files
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const has = (COURSE.files || []).some(f => { try { return /^\s*(const|let|var)\s+EQUATIONS\b/m.test(fs.readFileSync(path.join(src, f), 'utf8')); } catch(e){ return false; } });
const eqs = FIX.map(e => Object.assign({}, e, {id: PRE + e.id}));
const body = `/* equation-drill ci: the equations of the module test's fixture (Basic-Pharmacokinetics, ac2eb73), ids prefixed ${PRE} */\n` +
  (has ? `EQUATIONS.push(...${JSON.stringify(eqs)});` : `const EQUATIONS = ${JSON.stringify(eqs)};`) + '\n';
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${eqs.length} equations from the fixture in test.js${has ? ', added to the course\'s EQUATIONS' : ''})`);
console.log(`wrote: appended to ${course}: the file in COURSE.files and ${NAME} ${meta.version} on`);
