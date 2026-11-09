/* compare-tab: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/compare-tab/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const FIX` (BDK's drug list, data/decks.json at 05c36c3: 26 pages, 300
 * drugs), with every table id prefixed `ctc-` (drug-list-tab's script uses `dlc-`, so a
 * course with both never has an id twice). Files written in <courseSrcDir>:
 *   ctc_drug_tables.js   `const DRUG_TABLES = [...]` (pushed when the course already has
 *                        DRUG_TABLES, as it does when drug-list-tab was switched on first)
 * and one line appended to course.js: the file in COURSE.files, and the module on at the
 * version in its module.json with its default options (BDK's), kept beside any module
 * already on. Writes only inside <courseSrcDir>; stops with a non-zero exit on any
 * failure, including a course that already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'compare-tab', TAG = '/* compare-tab ci */', FILE = 'ctc_drug_tables.js', PRE = 'ctc-';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); } catch(e){ fail('cannot read its module.json: ' + e.message); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); } catch(e){ fail('cannot read its test.js: ' + e.message); }
const at = test.split('\n').find(l => l.startsWith('const FIX = '));
if(!at) fail('test.js has no top-level `const FIX = `');
let FIX;
try { FIX = vm.runInNewContext(at + '\n;FIX', {}); } catch(e){ fail('test.js\'s FIX cannot be read: ' + e.message); }
if(!FIX || !Array.isArray(FIX.tables) || !FIX.tables.length) fail('the fixture in test.js has no tables');
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const has = (COURSE.files || []).some(f => { try { return /^\s*(const|let|var)\s+DRUG_TABLES\b/m.test(fs.readFileSync(path.join(src, f), 'utf8')); } catch(e){ return false; } });
const tables = FIX.tables.map(t => Object.assign({}, t, {id: PRE + t.id}));
const body = `/* compare-tab ci: BDK's drug list from the module test's fixture (data/decks.json, 05c36c3), table ids prefixed ${PRE} */\n` +
  (has ? `DRUG_TABLES.push(...${JSON.stringify(tables)});` : `const DRUG_TABLES = ${JSON.stringify(tables)};`) + '\n';
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (${tables.length} tables, ${tables.reduce((n, t) => n + t.rows.length, 0)} rows from the fixture in test.js${has ? ', added to the course\'s DRUG_TABLES' : ''})`);
console.log(`wrote: appended to ${course}: the file in COURSE.files and ${NAME} ${meta.version} on`);
