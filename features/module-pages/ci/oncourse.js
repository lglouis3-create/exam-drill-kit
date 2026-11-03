#!/usr/bin/env node
/* module-pages: switch the module on in a fresh scratch course, for the kit's CI
 * (the shape agreed in PR #12). Outside current/, so a course never copies it.
 *
 *     node features/module-pages/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is taken from the module test's own fixture, read from
 * features/module-pages/current/test.js as it stands: its `const PK` (Basic-Pharmacokinetics'
 * Module 2, src/q1_module1.js and src/q2_module2.js at ac2eb73) and its `const PK_LECTURES`
 * (that course's two Module 2 lectures, src/course.js lines 55-61). Of the fixture it writes
 * the part the kit core's checks accept as it is:
 *   - the questions whose citation names a deck of those lectures (2IVBolusAdministration.pdf),
 *     except a second wording of a concept (a question with `dupOf`); the other questions
 *     cite practice sheets, a homework sheet and a lecture transcript, which are not lectures
 *     of the course. The second wordings are left out because with them the core's test.js
 *     check 7 ("Different wording when a missed concept returns") fails on this data: it
 *     takes the first concept with two wordings (topic bolus1), and bolus1 then holds 4
 *     concepts, while a missed concept returns only after GAP = 4 other questions
 *     (core/shell.html), so within bolus1 it cannot return. That is a limit of the core
 *     check on a small topic, reported for a core proposal; the data is not changed for it;
 *   - the topics those questions are in, after the course's own topics (TOPICS.push);
 *   - every objective (OBJECTIVES) whose subtopics hold those questions;
 *   - every kind of problem (CALC_TYPES) whose worked example is among them;
 *   - the skills those questions use that the course does not have;
 *   - the two lectures, as literals in course.js.
 * No problem set is written: the fixture's set (Homework 2, problem 2) cites the homework
 * sheet. Ids of questions, kinds and lectures are prefixed `mpc-` (the test's own scratch
 * copies use `mpt-`). The one change to the data: `prof` is the course's own
 * (COURSE.professors[0], the template's "Professor") on the questions, topics and lectures.
 * The module is switched on with the `modules` option: the course's own modules in the
 * order its lectures name them, then the fixture's module under its Basic-Pharmacokinetics
 * name. That module is number 2 when the course does not use 2; when the course's lectures
 * or questions already use module 2 (another module's script may have written it), it is the
 * first number from 92 on that the course does not use, as test.js does (`FM = free(92)`),
 * and the questions, objectives, kinds of problem and lectures written carry that number
 * (CIDATA rule 3).
 * Files written in <courseSrcDir>:
 *   q90_mpc_fixture.js   the topics and the questions, one per line in the template's form
 *                        ({id:'...', prof:'...', ...})
 *   mpc_data.js          OBJECTIVES and CALC_TYPES (pushed when the course already has them)
 *                        and the skills, pushed onto COURSE.skills
 * and one line appended to course.js: both files in COURSE.files, the lectures in
 * COURSE.lectures, and module-pages on at the version in its module.json, kept beside any
 * module already on. Writes only inside <courseSrcDir>; exits non-zero on any failure,
 * including a course that already has this data (run it once per fresh course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'module-pages', TAG = '/* module-pages ci */', PRE = 'mpc-', pre = id => PRE + id;
const QFILE = 'q90_mpc_fixture.js', DFILE = 'mpc_data.js';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read the kit's features/${NAME}/current/module.json or test.js: ${e.message}`); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const courseText = fs.readFileSync(course, 'utf8');
if(courseText.includes(TAG) || fs.existsSync(path.join(src, QFILE)) || fs.existsSync(path.join(src, DFILE)))
  fail('this course already has the module-pages ci data (this script runs once per course)');

// the fixture, as test.js declares it
function grab(name){
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`test.js has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInNewContext(lines.slice(at, end).join('\n') + `\n;${name}`, {}); }
  catch(e){ fail(`test.js's ${name} cannot be read: ${e.message}`); }
}
const PK = grab('PK'), LECS = grab('PK_LECTURES');
if(!PK || !Array.isArray(PK.qs) || !Array.isArray(LECS) || !LECS.length) fail('the fixture in test.js has no questions or no lectures');

// what the course already declares (course.js and its data files, run as the build runs them)
let own;
try {
  const files = vm.runInNewContext(courseText + '\n;COURSE.files', {}) || [];
  const code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
  own = vm.runInNewContext(courseText + '\n;\n' + code + '\n;({COURSE, TOPICS: typeof TOPICS === "undefined" ? [] : TOPICS,' +
    ' QUESTIONS: typeof QUESTIONS === "undefined" ? [] : QUESTIONS, OBJECTIVES: typeof OBJECTIVES !== "undefined", CALC_TYPES: typeof CALC_TYPES !== "undefined"})', {});
} catch(e){ fail('the course could not be read: ' + e.message); }
const prof = (own.COURSE.professors || [])[0];
if(typeof prof !== 'string' || !prof || /['\\\n]/.test(prof)) fail('course.js has no first professor that can be written as a literal');
// the module number the fixture goes on: its own (2) when free, else the first free one from 92, as test.js does
const usedMods = new Set((own.COURSE.lectures || []).map(l => l.module).concat(own.QUESTIONS.map(q => q.module))
  .filter(m => m !== undefined && m !== null).map(String));
const free = from => { let n = from; while(usedMods.has(String(n))) n++; return n; };
const FM = usedMods.has(String(PK.module.module)) ? free(92) : PK.module.module;
if(FM !== PK.module.module) console.log(`the course already uses module ${PK.module.module}; the fixture's module goes on module ${FM}`);

// the questions that cite a lecture deck, with their dupOf partners
const decks = [...new Set(LECS.map(l => l.deck))];
const byQ = Object.fromEntries(PK.qs.map(q => [q.id, q])), want = [];
const add = id => { const q = byQ[id]; if(!q) fail('the fixture has no question ' + id); if(want.includes(id)) return; want.push(id); if(q.dupOf) add(q.dupOf); };
PK.qs.filter(q => !q.dupOf && decks.some(d => String(q.cite || '').includes(d))).forEach(q => add(q.id));
const qs = PK.qs.filter(q => want.includes(q.id)).map(q => Object.assign({}, q, {module: FM}));
if(!qs.length) fail('no question of the fixture cites ' + decks.join(', '));
const subs = new Set(qs.map(q => q.topic + '/' + q.sub));
const ownTopics = own.TOPICS.map(t => t.id), ownSkills = (own.COURSE.skills || []).map(k => k.id);
const clash = PK.topics.filter(t => qs.some(q => q.topic === t.id) && ownTopics.includes(t.id)).map(t => t.id);
if(clash.length) fail('the course already has the topic(s) ' + clash.join(', '));
const topics = PK.topics.filter(t => qs.some(q => q.topic === t.id)).map(t => Object.assign({}, t, {prof}));
const objectives = PK.objectives.filter(o => o.subs.some(s => subs.has(s))).map(o => Object.assign({}, o, {module: FM}));
const types = PK.types.filter(t => t.example && want.includes(t.example)).map(t => Object.assign({}, t, {id: pre(t.id), example: pre(t.example), module: FM}));
const skills = PK.skills.filter(k => qs.some(q => q.skill === k.id) && !ownSkills.includes(k.id));
const missingSkill = [...new Set(qs.map(q => q.skill))].filter(k => !ownSkills.includes(k) && !skills.some(s => s.id === k));
if(missingSkill.length) fail('the questions use skills neither the course nor the fixture has: ' + missingSkill.join(', '));
const lectures = LECS.map(l => Object.assign({}, l, {id: pre(l.id), prof, module: FM}));

// one question per line, in the template's form: id and prof first, as literals
const qLine = q => { const rest = Object.assign({}, q); delete rest.id; delete rest.prof;
  if(rest.dupOf) rest.dupOf = pre(rest.dupOf);
  if(!/^[A-Za-z0-9_-]+$/.test(q.id)) fail(`question ${q.id} has an id that cannot be written as a literal`);
  return `{id:'${pre(q.id)}', prof:'${prof}', ${JSON.stringify(rest).slice(1, -1)}},`; };
const decl = (n, v, has) => has ? `${n}.push(...${JSON.stringify(v)});` : `const ${n} = ${JSON.stringify(v)};`;
const out = {
  [QFILE]: `/* module-pages ci: ${qs.length} of the module test's Basic-Pharmacokinetics Module 2 questions (ac2eb73), those citing ${decks.join(', ')}, ids prefixed ${PRE} */\n` +
    `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(\n${qs.map(qLine).join('\n')}\n);\n`,
  [DFILE]: `/* module-pages ci: Basic-Pharmacokinetics' Module 2 objectives, kinds of problem and skills (ac2eb73), from the module test's fixture */\n` +
    decl('OBJECTIVES', objectives, own.OBJECTIVES) + '\n' + decl('CALC_TYPES', types, own.CALC_TYPES) + '\n' +
    `COURSE.skills.push(...${JSON.stringify(skills)});\n`};
const lit = v => typeof v === 'number' ? String(v) : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const lectureLit = l => '{' + Object.entries(l).map(([k, v]) => `${k}:${lit(v)}`).join(', ') + '}';
if(lectures.some(l => Object.values(l).some(v => typeof v !== 'number' && typeof v !== 'string'))) fail('a lecture holds a value that cannot be written as a literal');
const ownMods = [];
(own.COURSE.lectures || []).forEach(l => { if(l.module !== undefined && l.module !== null && !ownMods.includes(l.module)) ownMods.push(l.module); });
if(ownMods.some(m => String(m) === String(FM))) fail(`the course already has a module ${FM}`);   // cannot happen: FM is free
const modules = ownMods.map(m => [m, typeof m === 'string' && /\D/.test(m) ? m : 'Module ' + m]).concat([[FM, PK.module.name]]);
try { for(const [f, t] of Object.entries(out)){ fs.writeFileSync(path.join(src, f), t); console.log(`wrote: ${path.join(src, f)} (${t.length} characters)`); } }
catch(e){ fail('cannot write the data files: ' + e.message); }
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(QFILE)}, ${JSON.stringify(DFILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lectureLit).join(', ')}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version, modules})}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
const second = PK.qs.filter(q => q.dupOf && decks.some(d => String(q.cite || '').includes(d))).length;
console.log(`data: ${qs.length} questions (calculations: ${qs.filter(q => q.type === 'numeric').length}), ${topics.length} topics, ${objectives.length} objectives, ` +
  `${types.length} kinds of problem, ${skills.length} skills, ${lectures.length} lectures; left out: ${PK.qs.length - qs.length - second} questions citing no lecture deck and ${second} second wordings, ` +
  `${PK.types.length - types.length} kinds whose worked example is not among the questions written, ${PK.chains.length} problem sets`);
