/* chained-problem-sets: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/chained-problem-sets/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as
 * it stands: its `const FIX` (one of Basic-Pharmacokinetics' problem sets and its four
 * parts, src/q1_module1.js at ac2eb73), with every id prefixed `cpc-` (the test's own
 * scratch copies use `cps-`, so the two never share an id). The parts are written in
 * the kit's question-file format (one question per line opening `{id:'...'`, with the
 * course's professor as a literal), so the core checks read them as they read the
 * course's own questions. The scaffolding around them, which the fixture does not
 * hold, is named here and kept to what the checks need:
 *   - a topic of their own, after the course's topics (id `cpc`, one subtopic `a`), so
 *     the course's first topic is unchanged;
 *   - each part's professor is the course's first professor, its skill the course's
 *     `calc` skill (else its first skill), tier 'new', source 'slide';
 *   - the decks the parts cite (Introduction.pdf, IntroductionandMathReviewSolutions.pdf),
 *     added to COURSE.lectures under exam 1 with the deck's file name as the label.
 * Files written in <courseSrcDir>:
 *   q90_cpc_fixture.js   the topic, the four parts and the problem set (CHAINS, pushed
 *                        when the course already has CHAINS)
 * and one line appended to course.js: the file in COURSE.files, the decks in
 * COURSE.lectures, and the module on at the version in its module.json, kept beside
 * any module already on. Writes only inside <courseSrcDir>; stops with a non-zero exit
 * on any failure, including a course that already has this data (it runs once per
 * course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'chained-problem-sets', TAG = '/* chained-problem-sets ci */', FILE = 'q90_cpc_fixture.js', PRE = 'cpc-';
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
if(!FIX || !FIX.chain || !Array.isArray(FIX.chain.parts) || !Array.isArray(FIX.qs) || !FIX.qs.length) fail('the fixture in test.js has no chain or parts');
const byId = Object.fromEntries(FIX.qs.map(q => [q.id, q]));
const missing = FIX.chain.parts.filter(id => !byId[id]);
if(missing.length) fail('the fixture\'s problem set names parts it does not hold: ' + missing.join(', '));
const course = path.join(src, 'course.js'), data = path.join(src, FILE);
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const prof = (COURSE.professors || [])[0];
if(typeof prof !== 'string' || !prof || /['\\\n]/.test(prof)) fail('course.js has no first professor that can be written as a literal');
const skill = ((COURSE.skills || []).find(s => s.id === 'calc') || (COURSE.skills || [])[0] || {}).id;
if(!skill) fail('course.js lists no skills');
const has = (COURSE.files || []).some(f => { try { return /^\s*(const|let|var)\s+CHAINS\b/m.test(fs.readFileSync(path.join(src, f), 'utf8')); } catch(e){ return false; } });
// the decks the parts cite: the file name before each ", problem" or " slide"
const decks = [...new Set(FIX.qs.flatMap(q => String(q.cite || '').split(';').map(s => (s.trim().match(/^([^,]+?\.pdf)\b/) || [])[1]).filter(Boolean)))];
if(!decks.length) fail('the fixture\'s parts cite no deck');
const known = new Set((COURSE.lectures || []).map(l => l.deck));
const lit = s => `'${s}'`;   // ids and the professor: no quote, backslash or newline (checked above for the professor)
const chain = Object.assign({}, FIX.chain, {id: PRE + FIX.chain.id, parts: FIX.chain.parts.map(id => PRE + id)});
const parts = FIX.chain.parts.map(id => {
  const q = byId[id], rest = Object.assign({}, q); delete rest.id; delete rest.type;
  if(!/^[A-Za-z0-9_-]+$/.test(id) || (q.type && !/^[a-z]+$/.test(q.type))) fail(`part ${id} has an id or type that cannot be written as a literal`);
  return `{id:${lit(PRE + id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` skill:${lit(skill)}, prof:${lit(prof)}, tier:'new', topic:'cpc', sub:'a', ` +
         `concept:${lit(PRE + id)}, source:'slide', tags:[], ${JSON.stringify(rest).slice(1)},`;
});
const body = `/* chained-problem-sets ci: the problem set of the module test's fixture (Basic-Pharmacokinetics
   src/q1_module1.js, ac2eb73), ids prefixed ${PRE}; topic, professor, skill and decks as
   features/chained-problem-sets/ci/oncourse.js names them */
TOPICS.push({id:'cpc', name:${JSON.stringify('Problem set: ' + FIX.chain.name)}, prof:${lit(prof)},
  cite:${JSON.stringify(decks.join('; '))},
  subs:[{id:'a', name:${JSON.stringify(FIX.chain.setup || FIX.chain.name)}, cite:${JSON.stringify(decks.join('; '))}}]});
QUESTIONS.push(
${parts.join('\n')}
);
${has ? `CHAINS.push(${JSON.stringify(chain)});` : `const CHAINS = [${JSON.stringify(chain)}];`}
`;
const lectures = decks.filter(d => !known.has(d)).map((d, i) => ({id: `L9${i + 1}`, deck: d, label: d, prof, exam: 1, module: 'Module 1'}));
if(lectures.some(l => /['\\\n]/.test(l.deck))) fail('a cited deck name cannot be written as a literal');
// in the course's own form, {id:'L91', ...}: state_check.js finds a lecture by its id:'...' entry in course.js
const lectureLit = l => `{id:${lit(l.id)}, deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(l.prof)}, exam:${l.exam}, module:${lit(l.module)}}`;
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lectureLit).join(', ')}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(data, body); } catch(e){ fail('cannot write ' + data + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${data} (topic cpc, ${parts.length} parts and the problem set ${chain.id} from the fixture in test.js)`);
console.log(`wrote: appended to ${course}: the file in COURSE.files, ${lectures.length} deck(s) in COURSE.lectures ` +
  `(${lectures.map(l => l.deck).join(', ') || 'none new'}), and ${NAME} ${meta.version} on`);
