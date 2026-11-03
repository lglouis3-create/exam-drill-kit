/* plan-the-problem: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/plan-the-problem/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as
 * it stands: its `const PK` (10 of Basic-Pharmacokinetics' calculation questions with
 * their set-up data, ASKS, the topics, skills and lectures they belong to, and the plan
 * tables, src/ at ac2eb73), and the equations those questions name, from
 * equation-drill's test.js `const FIX` (Basic-Pharmacokinetics' equations, ac2eb73).
 * Nothing is written for the test: the one change made to the data is the professor's
 * name, "Professor" in `prof` and "the professor" in the text of three worked steps
 * (done in the fixture itself). Scaffolding, named here and kept to what the core
 * checks need:
 *   - question and equation ids are prefixed `plc-` (the test's own scratch copies use
 *     `plt-` and `eqt-`, equation-drill's course `eqc-`, so no two share an id);
 *   - the questions are written one per line in the kit's question-file format, opening
 *     `{id:'...'`, then type and skill, then `prof:'Professor'`;
 *   - the topics are pushed after the course's own, a topic the course already has is
 *     not pushed again;
 *   - the lectures are Basic-Pharmacokinetics' own entries for the questions' lectures
 *     (one is written only when the course has no lecture with its deck), each with its
 *     own id prefixed `plc-` (L04 -> plc-L04); a question whose citation names none of the
 *     course's decks (a practice-solutions file) gets an entry for the file it cites, with
 *     its own lecture's label, exam and module, id `plc-<its lecture>-p<n>` (the n-th such
 *     file of that lecture, from 1: IV-Bolus-Practice-3---Solutions.pdf of L02 ->
 *     plc-L02-p1). Other modules' scripts take ids such as L91 and L92 (kit rule 2,
 *     /tmp/port-tools/CIDATA.md); the script stops only when the course already has one of
 *     these plc- ids (a real clash);
 *   - the skills the questions use are added to COURSE.skills when the course lacks them;
 *   - a line the course's EQUATIONS already holds in the same form (the same left side
 *     and typed form, as equation-drill's own course writes the same equations) is
 *     counted as one relation with this script's copy in PLAN.same, so neither is
 *     offered as a wrong choice against the other.
 * The module needs formulas-in-text and equation-drill: their own ci/oncourse.js
 * scripts switch them on first (core/ci_course.sh); this script stops when they are not on.
 * Files written in <courseSrcDir>:
 *   plc_plan_data.js     the equations (pushed onto EQUATIONS when the course has it),
 *                        ASKS and PLAN (assigned onto the course's own when it has them)
 *   q90_plc_fixture.js   the topics and the 10 questions
 * and one line appended to course.js: both files in COURSE.files, the lectures and
 * skills, and the module on at the version in its module.json, kept beside any module
 * already on. Writes only inside <courseSrcDir>; stops with a non-zero exit on any
 * failure, including a course that already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'plan-the-problem', TAG = '/* plan-the-problem ci */', DATA = 'plc_plan_data.js', QFILE = 'q90_plc_fixture.js', PRE = 'plc-';
const PROF = 'Professor';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
const readText = f => { try { return fs.readFileSync(f, 'utf8'); } catch(e){ fail(`cannot read ${f}: ${e.message}`); } };
let meta;
try { meta = JSON.parse(readText(path.join(cur, 'module.json'))); } catch(e){ fail('module.json cannot be read: ' + e.message); }
// a top-level `const <name> = ...` of a test.js (its first line and the indented lines after it), evaluated alone
function grab(file, name){
  const lines = readText(file).split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`${file} has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInNewContext(lines.slice(at, end).join('\n') + `\n;${name}`, {}); }
  catch(e){ fail(`${file}'s ${name} cannot be read: ${e.message}`); }
}
const PK = grab(path.join(cur, 'test.js'), 'PK');
const EQF = grab(path.join(kit, 'features', 'equation-drill', 'current', 'test.js'), 'FIX');
for(const f of ['qs', 'topics', 'skills', 'lectures']) if(!Array.isArray(PK[f]) || !PK[f].length) fail(`the fixture in test.js has no ${f}`);
if(!PK.asks || !PK.plan || !PK.lectureOf) fail('the fixture in test.js has no asks, plan or lectureOf');
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = readText(course);
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
for(const f of [DATA, QFILE]) if(fs.existsSync(path.join(src, f))) fail(path.join(src, f) + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const on = Object.keys(COURSE.features || {});
const off = (meta.needs || []).filter(n => !on.includes(n));
if(off.length) fail(`${off.join(' and ')} must be switched on first, by ${off.map(n => `features/${n}/ci/oncourse.js`).join(' and ')}`);
if(!(COURSE.professors || []).includes(PROF)) fail(`course.js professors does not list "${PROF}", the name the fixture's questions carry`);
const declares = name => (COURSE.files || []).some(f => { try { return new RegExp(`^\\s*(const|let|var)\\s+${name}\\b`, 'm').test(fs.readFileSync(path.join(src, f), 'utf8')); } catch(e){ return false; } });

// the equations the questions name, verbatim from equation-drill's fixture
const named = [...new Set(PK.qs.flatMap(q => [q.setup.eq, ...(q.setup.pre || [])]).filter(id => id !== 'none'))];
const missing = named.filter(id => !EQF.some(e => e.id === id));
if(missing.length) fail(`the fixture's questions name equations equation-drill's fixture does not hold: ${missing.join(', ')}`);
const eqs = named.map(id => Object.assign({}, EQF.find(e => e.id === id), {id: PRE + id}));
const plan = Object.assign({}, PK.plan, {same: (PK.plan.same || []).map(g => g.map(id => PRE + id))});
const lit = s => { if(typeof s !== 'string' || !/^[A-Za-z0-9 ._-]+$/.test(s)) fail(`"${s}" cannot be written as a literal`); return `'${s}'`; };
const data = `/* plan-the-problem ci: the equations the questions name, ASKS and the plan tables of the module
   test's fixture (Basic-Pharmacokinetics, ac2eb73), ids prefixed ${PRE}; see features/plan-the-problem/ci/oncourse.js */
const PLC_EQUATIONS = ${JSON.stringify(eqs)};
${declares('EQUATIONS') ? 'EQUATIONS.push(...PLC_EQUATIONS);' : 'const EQUATIONS = PLC_EQUATIONS.slice();'}
${declares('ASKS') ? `Object.assign(ASKS, ${JSON.stringify(PK.asks)});` : `const ASKS = ${JSON.stringify(PK.asks)};`}
${declares('PLAN') ? `Object.assign(PLAN, ${JSON.stringify(plan)});` : `const PLAN = ${JSON.stringify(plan)};`}
/* a line already in EQUATIONS in the same form as one of these is the same relation */
PLAN.same = (PLAN.same || []).concat(PLC_EQUATIONS.map(e => [e.id, ...EQUATIONS.filter(x => x !== e && x.lhs === e.lhs && x.typed === e.typed).map(x => x.id)]).filter(g => g.length > 1));
`;
const qline = q => {
  const rest = Object.assign({}, q, {setup: Object.assign({}, q.setup, {eq: q.setup.eq === 'none' ? 'none' : PRE + q.setup.eq, pre: (q.setup.pre || []).map(id => PRE + id)})});
  for(const k of ['id', 'type', 'skill', 'prof']) delete rest[k];
  if(q.prof !== PROF) fail(`question ${q.id} carries prof "${q.prof}", not "${PROF}"`);
  return `{id:${lit(PRE + q.id)}, type:${lit(q.type)}, skill:${lit(q.skill)}, prof:${lit(PROF)}, ${JSON.stringify(rest).slice(1)},`;
};
const qfile = `/* plan-the-problem ci: 10 of Basic-Pharmacokinetics' calculation questions (ac2eb73) from the module
   test's fixture, ids prefixed ${PRE}, and the topics they belong to, after the course's own */
${PK.topics.map(t => `  if(!TOPICS.some(t => t.id === ${JSON.stringify(t.id)})) TOPICS.push(${JSON.stringify(t)});`).join('\n')}
QUESTIONS.push(
${PK.qs.map(qline).join('\n')}
);
`;
// lectures: the questions' own, then one for each practice file a question cites instead
const decks = new Set((COURSE.lectures || []).map(l => l.deck));
const lectures = PK.lectures.filter(l => !decks.has(l.deck)).map(l => Object.assign({}, l, {id: PRE + l.id}));
lectures.forEach(l => decks.add(l.deck));
const nth = {};
for(const q of PK.qs){
  if([...decks].some(d => String(q.cite).includes(d))) continue;
  const own = PK.lectures.find(l => l.id === PK.lectureOf[q.id]), file = (String(q.cite).match(/^([^,;]+?\.pdf)\b/) || [])[1];
  if(!own || !file) fail(`question ${q.id} cites no deck of its lectures and no file a lecture can be written for`);
  nth[own.id] = (nth[own.id] || 0) + 1;
  lectures.push(Object.assign({}, own, {id: `${PRE}${own.id}-p${nth[own.id]}`, deck: file})); decks.add(file);
}
const used = new Set((COURSE.lectures || []).map(l => String(l.id)));
const clash = lectures.filter(l => used.has(l.id)).map(l => l.id);
if(clash.length) fail('course.js already has the lecture id(s) ' + clash.join(', ') + ' this script writes');
const lecLit = l => `{id:${lit(l.id)}, deck:${lit(l.deck)}, label:${JSON.stringify(l.label)}, prof:${lit(l.prof)}, exam:${+l.exam}, module:${+l.module}}`;
const skills = PK.skills.filter(s => !(COURSE.skills || []).some(x => x.id === s.id));
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(DATA)}, ${JSON.stringify(QFILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lecLit).join(', ')}]); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
try { fs.writeFileSync(path.join(src, DATA), data); } catch(e){ fail(`cannot write ${DATA}: ${e.message}`); }
try { fs.writeFileSync(path.join(src, QFILE), qfile); } catch(e){ fail(`cannot write ${QFILE}: ${e.message}`); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${path.join(src, DATA)} (${eqs.length} equations${declares('EQUATIONS') ? ', added to the course\'s EQUATIONS' : ''}, ` +
  `${Object.keys(PK.asks).length} ASKS, PLAN with ${plan.models.length} models)`);
console.log(`wrote: ${path.join(src, QFILE)} (${PK.topics.length} topics, ${PK.qs.length} questions from the fixture in test.js)`);
console.log(`wrote: appended to ${course}: both files in COURSE.files, ${lectures.length} lecture(s) (${lectures.map(l => l.id + ' ' + l.deck).join(', ')}), ` +
  `${skills.length} skill(s), and ${NAME} ${meta.version} on`);
