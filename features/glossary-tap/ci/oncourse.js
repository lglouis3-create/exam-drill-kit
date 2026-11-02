/* glossary-tap: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/glossary-tap/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * Writes only inside <courseSrcDir>:
 *   - terms_gtap.js: `const TERMS = [...]`, the terms of the fixture in the kit's
 *     features/glossary-tap/current/test.js (`const FIX`, its `terms`, copied as they
 *     are: Intro to Pharmacology exam1-drill/src/glossary.js at 929cd62, with each
 *     term's lecture and fig left out), nothing added;
 *   - one line appended to course.js: terms_gtap.js added to `files`, and the module
 *     switched on at the version in its module.json, kept beside any module already
 *     on (for example formulas-in-text, whose own script may run first).
 * Prints what it wrote. Stops with a non-zero exit on any failure, including a
 * course that already has terms_gtap.js or already switches the module on (it runs
 * once per course). The module's test adds its own questions in its scratch copies.
 */
const fs = require('fs'), path = require('path');
function fail(msg){ console.error('glossary-tap ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/glossary-tap/ci/oncourse.js <kitDir> <courseSrcDir>');
const here = path.join(kit, 'features', 'glossary-tap', 'current');
let meta, FIX;
try { meta = JSON.parse(fs.readFileSync(path.join(here, 'module.json'), 'utf8')); }
catch(e){ fail('cannot read ' + path.join(here, 'module.json') + ': ' + e.message); }
try {
  const m = fs.readFileSync(path.join(here, 'test.js'), 'utf8').match(/^const FIX = (\{.*\});$/m);
  if(!m) throw new Error('no line `const FIX = {...};` in it');
  FIX = JSON.parse(m[1]);
} catch(e){ fail('cannot read the fixture in ' + path.join(here, 'test.js') + ': ' + e.message); }
if(!Array.isArray(FIX.terms) || !FIX.terms.length) fail('the fixture in test.js has no terms');
const course = path.join(src, 'course.js'), data = path.join(src, 'terms_gtap.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', 'glossary-tap', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'glossary-tap'));
const text = fs.readFileSync(course, 'utf8');
if(text.includes('/* glossary-tap ci */')) fail('course.js already switches glossary-tap on (this script runs once per course)');
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
const body = '/* glossary-tap ci: the terms of the module test\'s fixture (Intro to Pharmacology\n' +
  '   exam1-drill/src/glossary.js at 929cd62; lecture and fig left out) */\n' +
  'const TERMS = ' + JSON.stringify(FIX.terms) + ';\n';
const line = `\n;/* glossary-tap ci */ COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat(['terms_gtap.js']); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {"glossary-tap": ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: ' + data + ' (' + FIX.terms.length + ' terms from the fixture in test.js)');
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
