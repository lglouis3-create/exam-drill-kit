/* worksheets-ink: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/worksheets-ink/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js (its `const PK = ...`
 * line: four of Basic-Pharmacokinetics' documents, their 33 questions, 6 problem
 * sets and 3 topics, verbatim from ac2eb73), written the way that test's
 * fixtureFiles writes it, with the ids prefixed `wsc-` (the test's own scratch
 * copies use `wsi-`, so the two never share an id) and each question's professor
 * and skill set to the course's own (COURSE.professors[0], and the skill of the
 * course's first calculation question, else its first skill). Files written in
 * <courseSrcDir>:
 *   q90_wsc_fixture.js   the topics and questions (pushed onto TOPICS and QUESTIONS)
 *   wsc_data.js          SOURCES and CHAINS (pushed when the course already has them)
 * and one line appended to course.js: both files in COURSE.files, and the module
 * on at the version in its module.json with the test's Basic-Pharmacokinetics
 * options (PK_OPT, prefix wsc-), kept beside any module already on.
 * Writes only inside <courseSrcDir>; stops with a non-zero exit on any failure,
 * including a course that already has this data (run once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
function fail(msg){ console.error('worksheets-ink ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/worksheets-ink/ci/oncourse.js <kitDir> <courseSrcDir>');
const cur = path.join(kit, 'features', 'worksheets-ink', 'current');
let meta, testText;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); testText = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail('cannot read the kit\'s features/worksheets-ink/current/module.json or test.js: ' + e.message); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', 'worksheets-ink', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'worksheets-ink'));
const courseText = fs.readFileSync(course, 'utf8');
if(courseText.includes('/* worksheets-ink ci */') || fs.existsSync(path.join(src, 'wsc_data.js'))) fail('this course already has the worksheets-ink ci data (this script runs once per course)');

// the test's fixture and options, as the test declares them
const pkLine = testText.split('\n').find(l => l.startsWith('const PK = '));
const optM = /^const PK_OPT = \{[\s\S]*?\};$/m.exec(testText);
if(!pkLine || !optM) fail('the test.js fixture (const PK = ...) or its options (const PK_OPT = ...) were not found');
const PRE = 'wsc-', pre = id => PRE + id;
let PK, PK_OPT;
try { PK = JSON.parse(pkLine.slice('const PK = '.length).replace(/;\s*$/, ''));
      PK_OPT = vm.runInNewContext(optM[0].replace(/^const PK_OPT = /, '(') .replace(/;$/, ')'), {PRE}); }
catch(e){ fail('the test.js fixture could not be read: ' + e.message); }

// what the course already declares (course.js and its data files, run as the build runs them)
let own;
try {
  const ctx = {};
  vm.createContext(ctx);
  const files = vm.runInContext(courseText + '\n;COURSE.files', ctx) || [];
  const code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
  own = vm.runInContext(courseText + '\n;\n' + code + '\n;({COURSE, TOPICS: typeof TOPICS === "undefined" ? [] : TOPICS, QUESTIONS: typeof QUESTIONS === "undefined" ? [] : QUESTIONS,' +
    ' SOURCES: typeof SOURCES !== "undefined", CHAINS: typeof CHAINS !== "undefined"})', vm.createContext({}));
} catch(e){ fail('the course could not be read: ' + e.message); }
if(typeof own.QUESTIONS.push !== 'function') fail('the course declares no QUESTIONS list');
const prof = (own.COURSE.professors || [])[0], skill = (own.QUESTIONS.find(q => q.type === 'numeric') || {}).skill || ((own.COURSE.skills || [])[0] || {}).id;
if(!prof || !skill) fail('the course names no professor (COURSE.professors) or no skill');
const ownTopics = own.TOPICS.map(t => t.id);

// the test's fixtureFiles, with the prefix wsc-
const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), prof, skill}, q.dupOf ? {dupOf: pre(q.dupOf)} : {}));
const chains = PK.chains.map(c => Object.assign({}, c, {id: pre(c.id), parts: c.parts.map(pre)}));
const sources = PK.sources.map(s => Object.assign({}, s, {id: pre(s.id), chains: (s.chains || []).map(pre), items: s.items.map(it => ({q: pre(it.q), label: it.label}))}));
const topics = PK.topics.filter(t => !ownTopics.includes(t.id)).map(t => Object.assign({}, t, {prof}));
const decl = (n, v, has) => has ? `${n}.push(...${JSON.stringify(v)});` : `const ${n} = ${JSON.stringify(v)};`;
const out = {
  'q90_wsc_fixture.js': '/* four of Basic-Pharmacokinetics\' documents\' questions (ac2eb73), from the worksheets-ink test fixture, ids prefixed wsc- (ci/oncourse.js) */\n' +
    `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`,
  'wsc_data.js': '/* Basic-Pharmacokinetics\' documents and problem sets (ac2eb73), from the worksheets-ink test fixture, ids prefixed wsc- (ci/oncourse.js) */\n' +
    decl('CHAINS', chains, own.CHAINS) + '\n' + decl('SOURCES', sources, own.SOURCES) + '\n'};
try { for(const [f, t] of Object.entries(out)){ fs.writeFileSync(path.join(src, f), t); console.log(`wrote: ${path.join(src, f)} (${t.length} characters)`); } }
catch(e){ fail('cannot write the data files: ' + e.message); }
const cfg = Object.assign({version: meta.version}, PK_OPT);
const line = `\n;/* worksheets-ink ci */ COURSE.files = (COURSE.files || []).concat(['q90_wsc_fixture.js', 'wsc_data.js']); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {"worksheets-ink": ${JSON.stringify(cfg)}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
console.log(`data: ${sources.length} documents, ${qs.length} questions, ${chains.length} problem sets, ${topics.length} topics`);
