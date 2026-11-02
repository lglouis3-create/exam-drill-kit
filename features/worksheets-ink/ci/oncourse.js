/* worksheets-ink: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/worksheets-ink/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is taken from the fixture of the module's own test.js (its
 * `const PK = ...` line, Basic-Pharmacokinetics at ac2eb73, verbatim): the documents
 * its `ci` list names, which are those whose questions meet the kit core's checks
 * (the worked examples of Modules 3 and 6, the in-class activity of Module 7a and
 * Quiz 5), the questions on them and the questions their dupOf names, their problem
 * sets, their topics, the skills those questions use and the lectures their cites
 * name. Ids are prefixed `wsc-` (the test's own scratch copies use `wsi-`, so the two
 * never share an id). The changes to the data: `prof` is the course's own
 * (COURSE.professors[0], the template's "Professor"), as the test does; and a question's
 * `setup` line (plan-the-problem's) is left out when it names an equation the course's
 * EQUATIONS does not have. Files written
 * in <courseSrcDir>:
 *   q90_wsc_fixture.js   the topics (pushed onto TOPICS) and the questions, one per line
 *                        in the template's form ({id:'…', prof:'…', …}), pushed onto QUESTIONS
 *   wsc_data.js          SOURCES and CHAINS (pushed when the course already has them),
 *                        and the skills, pushed onto COURSE.skills (a skill the course
 *                        already has is not added again)
 * and one line appended to course.js: both files in COURSE.files, the lectures added to
 * COURSE.lectures as literals ({id:'wsc-L09', deck:'…', …}), and the module on at
 * the version in its module.json with the test's Basic-Pharmacokinetics options
 * (PK_OPT, prefix wsc-), kept beside any module already on.
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
      PK_OPT = vm.runInNewContext(optM[0].replace(/^const PK_OPT = /, '(').replace(/;$/, ')'), {PRE}); }
catch(e){ fail('the test.js fixture could not be read: ' + e.message); }
if(!Array.isArray(PK.ci) || !PK.ci.length) fail('the test.js fixture names no documents for a course (PK.ci)');

// what the course already declares (course.js and its data files, run as the build runs them)
let own;
try {
  const files = vm.runInNewContext(courseText + '\n;COURSE.files', {}) || [];
  const code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
  own = vm.runInNewContext(courseText + '\n;\n' + code + '\n;({COURSE, TOPICS: typeof TOPICS === "undefined" ? [] : TOPICS, QUESTIONS: typeof QUESTIONS === "undefined" ? [] : QUESTIONS,' +
    ' SOURCES: typeof SOURCES !== "undefined", CHAINS: typeof CHAINS !== "undefined",' +
    ' EQ: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : []})', {});
} catch(e){ fail('the course could not be read: ' + e.message); }
if(typeof own.QUESTIONS.push !== 'function') fail('the course declares no QUESTIONS list');
const prof = (own.COURSE.professors || [])[0];
if(!prof) fail('the course names no professor (COURSE.professors)');

// the documents of PK.ci, with what they need
const docs = PK.ci.map(id => PK.sources.find(s => s.id === id) || fail('the fixture has no document ' + id));
const byQ = Object.fromEntries(PK.qs.map(q => [q.id, q])), want = [];
const add = id => { const q = byQ[id]; if(!q) fail('the fixture has no question ' + id); if(want.includes(id)) return; want.push(id); if(q.dupOf) add(q.dupOf); };
docs.forEach(s => s.items.forEach(it => add(it.q)));
const qsRaw = want.map(id => byQ[id]);
const chainIds = new Set(docs.flatMap(s => s.chains || []));
const chains = PK.chains.filter(c => chainIds.has(c.id)).map(c => Object.assign({}, c, {id: pre(c.id), parts: c.parts.map(pre)}));
const ownTopics = own.TOPICS.map(t => t.id), ownSkills = (own.COURSE.skills || []).map(k => k.id);
const topics = PK.topics.filter(t => qsRaw.some(q => q.topic === t.id) && !ownTopics.includes(t.id)).map(t => Object.assign({}, t, {prof}));
const skills = PK.skills.filter(k => qsRaw.some(q => q.skill === k.id) && !ownSkills.includes(k.id));
const lectures = PK.lectures.filter(l => qsRaw.some(q => (q.cite || '').includes(l.deck))).map(l => Object.assign({}, l, {id: pre(l.id), prof}));
const sources = docs.map(s => Object.assign({}, s, {id: pre(s.id), chains: (s.chains || []).map(pre), items: s.items.map(it => ({q: pre(it.q), label: it.label}))}));
// a question's `setup` is plan-the-problem's (worksheets-ink does not read it): it is left out when it names an
// equation the course's EQUATIONS does not have, since plan-the-problem's build step refuses it
const EQ = new Set(own.EQ || []), setupOk = st => !!st && (st.eq === 'none' || EQ.has(st.eq)) && (st.pre || []).every(id => EQ.has(id));
let dropped = 0;
// one question per line, in the template's form: id and prof first, unquoted
const qLine = q => { const rest = Object.assign({}, q); delete rest.id;
  if(rest.setup !== undefined && !setupOk(rest.setup)){ delete rest.setup; dropped++; }
  if(rest.dupOf) rest.dupOf = pre(rest.dupOf); if(rest.lecture) rest.lecture = pre(rest.lecture);
  const body = JSON.stringify(rest).slice(1, -1);
  return `{id:'${pre(q.id)}', prof:'${prof.replace(/'/g, "\\'")}'${body ? ', ' + body : ''}},`; };
const decl = (n, v, has) => has ? `${n}.push(...${JSON.stringify(v)});` : `const ${n} = ${JSON.stringify(v)};`;
const out = {
  'q90_wsc_fixture.js': `/* ${docs.length} of Basic-Pharmacokinetics' documents' questions (ac2eb73), from the worksheets-ink test fixture, ids prefixed wsc- (ci/oncourse.js) */\n` +
    `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(\n${qsRaw.map(qLine).join('\n')}\n);\n`,
  'wsc_data.js': '/* Basic-Pharmacokinetics\' documents, problem sets, lectures and skills (ac2eb73), from the worksheets-ink test fixture, ids prefixed wsc- (ci/oncourse.js) */\n' +
    decl('CHAINS', chains, own.CHAINS) + '\n' + decl('SOURCES', sources, own.SOURCES) + '\n' +
    `COURSE.skills.push(...${JSON.stringify(skills)});\n`};
// the lectures in the course's own form, {id:'…', deck:'…', …}: state_check.js finds a lecture by its id:'…' entry in course.js
const lit = v => typeof v === 'number' ? String(v) : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const lectureLit = l => '{' + Object.entries(l).map(([k, v]) => `${k}:${lit(v)}`).join(', ') + '}';
if(lectures.some(l => Object.values(l).some(v => typeof v !== 'number' && typeof v !== 'string'))) fail('a lecture holds a value that cannot be written as a literal');
try { for(const [f, t] of Object.entries(out)){ fs.writeFileSync(path.join(src, f), t); console.log(`wrote: ${path.join(src, f)} (${t.length} characters)`); } }
catch(e){ fail('cannot write the data files: ' + e.message); }
const cfg = Object.assign({version: meta.version}, PK_OPT);
const line = `\n;/* worksheets-ink ci */ COURSE.files = (COURSE.files || []).concat(['q90_wsc_fixture.js', 'wsc_data.js']); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lectureLit).join(', ')}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {"worksheets-ink": ${JSON.stringify(cfg)}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
console.log(`data: ${sources.length} documents (${PK.ci.join(', ')}), ${qsRaw.length} questions, ${chains.length} problem sets, ${topics.length} topics, ${skills.length} skills, ${lectures.length} lectures; ${dropped} setup lines left out (equations the course does not have)`);
