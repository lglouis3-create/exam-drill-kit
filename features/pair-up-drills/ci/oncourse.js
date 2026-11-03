/* pair-up-drills: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/pair-up-drills/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as
 * it stands: its `const IP` (Intro-Pharmacology- exam1-drill/src at 929cd62: the five
 * Pair up sets of app.js, the 39-row drug table built from drugs.js and the 12-row
 * poisoning table of poison_table.js, written by port_from_ip.js). Its pair sets
 * become PAIR_SETS and its two tables RECALL_TABLES, unchanged, ids and all (the
 * test's own scratch copies replace them with the same data, so no id is shared
 * between two different rows). The module reads no question, topic or lecture, so
 * none is added; the data has no `prof` field, so no professor is written. Files
 * written in <courseSrcDir>:
 *   pud_ci_data.js   `const PAIR_SETS = [...]` and `const RECALL_TABLES = [...]` (each
 *                    pushed when the course already declares it)
 * and one line appended to course.js: the file in COURSE.files, and the module on at
 * the version in its module.json, kept beside any module already on. Writes only
 * inside <courseSrcDir>; stops with a non-zero exit on any failure, including a
 * course that already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'pair-up-drills', TAG = '/* pair-up-drills ci */', FILE = 'pud_ci_data.js';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read ${path.join(cur, 'test.js')}: ${e.message}`); }
// a top-level `const <name> = ...` of test.js (its first line and the indented lines after it), evaluated alone
function grab(name){
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`test.js has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInNewContext(lines.slice(at, end).join('\n') + `\n;${name}`, {}); }
  catch(e){ fail(`test.js's ${name} cannot be read: ${e.message}`); }
}
const IP = grab('IP');
if(!IP || !Array.isArray(IP.pairSets) || !IP.pairSets.length || !Array.isArray(IP.tables) || !IP.tables.length) fail('the fixture in test.js has no pair sets or tables');
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
// a professor's name of the course must not reach the data (the fixture is kept free of personal names)
const names = (COURSE.professors || []).filter(p => typeof p === 'string' && p && p !== 'Professor');
const json = JSON.stringify(IP.pairSets) + JSON.stringify(IP.tables);
const named = names.filter(p => json.includes(p));
if(named.length) fail('the fixture names a professor of the course: ' + named.length + ' name(s)');
const declared = v => (COURSE.files || []).some(f => { try { return new RegExp(`^\\s*(const|let|var)\\s+${v}\\b`, 'm').test(fs.readFileSync(path.join(src, f), 'utf8')); } catch(e){ return false; } });
const decl = (v, list) => declared(v) ? `${v}.push(...${JSON.stringify(list)});` : `const ${v} = ${JSON.stringify(list)};`;
const body = `/* pair-up-drills ci: the Pair up sets and the two tables of the module test's fixture
   (Intro-Pharmacology- exam1-drill/src, 929cd62), as features/pair-up-drills/ci/oncourse.js names them */
${decl('PAIR_SETS', IP.pairSets)}
${decl('RECALL_TABLES', IP.tables)}
`;
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${IP.pairSets.length} pair sets with ${IP.pairSets.map(s => s.pairs.length).join(', ')} pairs; ` +
  `${IP.tables.length} tables with ${IP.tables.map(t => t.rows.length).join(', ')} rows, from the fixture in test.js)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files and ${NAME} ${meta.version} on`);
