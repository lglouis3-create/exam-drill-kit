#!/usr/bin/env node
/* module-pages: switch the module on in a fresh scratch course, for the kit's CI
 * (the shape agreed in PR #12). Outside current/, so a course never copies it.
 *
 *     node features/module-pages/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is taken from the module test's own fixture, read from
 * features/module-pages/current/test.js as it stands: its `const PK` (Basic-Pharmacokinetics'
 * Module 2, src/q1_module1.js and src/q2_module2.js at ac2eb73, 23 questions, verbatim) and its
 * `const PK_LECTURES` (that course's two Module 2 lectures, src/course.js lines 55-61, verbatim).
 * Each question, topic and lecture is written as the course has it, its professor's name
 * included (added to COURSE.professors when the course lacks it), apart from:
 *   - ids (the kit's CI data rule 2): question, topic, kind-of-problem and lecture ids, and every
 *     reference to one (dupOf, topic, lecture, an objective's subtopics, a kind's match and
 *     example), get the prefix `mpc-` (the test's own scratch copies use `mpt-`); the module
 *     number is FM (below);
 *   - rule 4: a plan-the-problem `setup` whose equations the course's EQUATIONS lacks, and an
 *     `asks` key its ASKS lacks, are left out, and printed;
 *   - a calculation's teachImg (m2-n-koverall) is left out: the core's browser_test.js stops with
 *     a TypeError on a calculation that carries one (fault C7 in kit PR #30). The concept
 *     questions' slide images are added to images.json from current/fixture-images/.
 * Questions left out, each because a core check fails with it (reproductions in
 * evidence/module-pages, rework-* folder):
 *   - the 13 questions whose citation names no deck of those lectures (practice-sheet
 *     solutions, a homework sheet, a lecture transcript): core test.js refuses a question that
 *     resolves to no lecture (fault C3 in kit PR #30); three of them (hw2-2a, hw2-2b, hw2-2d)
 *     have one worked step, which core test.js also refuses (it wants two; the course's own
 *     test wants one);
 *   (The two second wordings that cite the deck, m2-mod-2 and m2-vd-2 in topic bolus1, were left
 *   out until core test.js section 7 was fixed: fault C1 in kit PR #30, fixed by kit PRs #38 and #40.
 *   They are written now; with them, section 7 takes mpc-m2-mod-1 -> mpc-m2-mod-2 in mpc-bolus1.)
 * So the course holds: the questions citing 2IVBolusAdministration.pdf, the topics they are in,
 * every objective whose subtopics hold them, every kind of problem whose worked example is among
 * them, the skills they use that the course lacks, and the two lectures as literals in
 * course.js. No problem set is written: the fixture's set (Homework 2, problem 2) cites the
 * homework sheet.
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
 *   images.json          the concept questions' slide images the course lacks
 * and one line appended to course.js: the professor's name in COURSE.professors when the
 * course lacks it, both files in COURSE.files, the lectures in
 * COURSE.lectures, and module-pages on at the version in its module.json, kept beside any
 * module already on. Writes only inside <courseSrcDir>; exits non-zero on any failure,
 * including a course that already has this data (run it once per fresh course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'module-pages', TAG = '/* module-pages ci */', PRE = 'mpc-', pre = id => PRE + id;
const QFILE = 'q90_mpc_fixture.js', DFILE = 'mpc_data.js';
const WITH_SECOND = true;    // C1 fixed on main by kit PRs #38 and #40
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
PK.qs.filter(q => (WITH_SECOND || !q.dupOf) && decks.some(d => String(q.cite || '').includes(d))).forEach(q => add(q.id));
const qs = PK.qs.filter(q => want.includes(q.id)).map(q => Object.assign({}, q, {module: FM, topic: pre(q.topic)}));
// what the course's other modules declare, for the kit's CI data rule 4
let eqIds = [], askKeys = [], images;
try {
  const files = vm.runInNewContext(courseText + '\n;COURSE.files', {}) || [];
  const code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
  const r = vm.runInNewContext(courseText + '\n;\n' + code + '\n;({eq: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : [],' +
    ' asks: typeof ASKS !== "undefined" && ASKS && typeof ASKS === "object" ? Object.keys(ASKS) : []})', {});
  eqIds = r.eq; askKeys = r.asks;
  images = JSON.parse(fs.readFileSync(path.join(src, 'images.json'), 'utf8'));
} catch(e){ fail('the course\'s EQUATIONS, ASKS or images.json could not be read: ' + e.message); }
const dropped = {setup: [], asks: [], teachImg: []};
qs.forEach(q => {
  if(q.setup && !((q.setup.eq === 'none' || eqIds.includes(q.setup.eq)) && (q.setup.pre || []).every(x => eqIds.includes(x)))){ delete q.setup; dropped.setup.push(pre(q.id)); }
  if(q.asks !== undefined && !askKeys.includes(q.asks)){ delete q.asks; dropped.asks.push(pre(q.id)); }
  if(q.teachImg !== undefined && q.type === 'numeric'){ delete q.teachImg; dropped.teachImg.push(pre(q.id)); }   // core fault C7
  if(q.lecture) q.lecture = pre(q.lecture);
});
const imgDir = path.join(cur, 'fixture-images'), newImages = [];
for(const k of [...new Set(qs.filter(q => q.teachImg).map(q => q.teachImg))]){
  if(images[k]) continue;
  const n = (fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : []).find(x => x.startsWith(k + '.'));
  if(!n) fail(`features/${NAME}/current/fixture-images has no image ${k}`);
  images[k] = `data:image/${path.extname(n).slice(1)};base64,` + fs.readFileSync(path.join(imgDir, n)).toString('base64'); newImages.push(k);
}
if(!qs.length) fail('no question of the fixture cites ' + decks.join(', '));
const subs = new Set(qs.map(q => q.topic + '/' + q.sub));   // topic ids already prefixed
const ownTopics = own.TOPICS.map(t => t.id), ownSkills = (own.COURSE.skills || []).map(k => k.id);
const clash = PK.topics.filter(t => qs.some(q => q.topic === pre(t.id)) && ownTopics.includes(pre(t.id))).map(t => pre(t.id));
if(clash.length) fail('the course already has the topic(s) ' + clash.join(', '));
const topics = PK.topics.filter(t => qs.some(q => q.topic === pre(t.id))).map(t => Object.assign({}, t, {id: pre(t.id)}));
const objectives = PK.objectives.filter(o => o.subs.some(s => subs.has(pre(s)))).map(o => Object.assign({}, o, {module: FM, subs: o.subs.map(pre)}));
const types = PK.types.filter(t => t.example && want.includes(t.example)).map(t => Object.assign({}, t, {id: pre(t.id), example: pre(t.example), module: FM, match: t.match.map(pre)}));
const skills = PK.skills.filter(k => qs.some(q => q.skill === k.id) && !ownSkills.includes(k.id));
const missingSkill = [...new Set(qs.map(q => q.skill))].filter(k => !ownSkills.includes(k) && !skills.some(s => s.id === k));
if(missingSkill.length) fail('the questions use skills neither the course nor the fixture has: ' + missingSkill.join(', '));
const lectures = LECS.map(l => Object.assign({}, l, {id: pre(l.id), module: FM}));
const ownProfs = own.COURSE.professors || [];
const profs = [...new Set(qs.map(q => q.prof).concat(topics.map(t => t.prof), lectures.map(l => l.prof)))].filter(p => p && !ownProfs.includes(p));

// one question per line, in the template's form: id and prof first, as literals
const qLine = q => { const rest = Object.assign({}, q); delete rest.id; delete rest.prof;
  if(rest.dupOf) rest.dupOf = pre(rest.dupOf);
  if(!/^[A-Za-z0-9_-]+$/.test(q.id)) fail(`question ${q.id} has an id that cannot be written as a literal`);
  if(!/^[^'\\\n]+$/.test(q.prof || '')) fail(`question ${q.id} has a prof that cannot be written as a literal`);
  return `{id:'${pre(q.id)}', prof:'${q.prof}', ${JSON.stringify(rest).slice(1, -1)}},`; };
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
try { for(const [f, t] of Object.entries(out)){ fs.writeFileSync(path.join(src, f), t); console.log(`wrote: ${path.join(src, f)} (${t.length} characters)`); }
      if(newImages.length){ fs.writeFileSync(path.join(src, 'images.json'), JSON.stringify(images)); console.log(`wrote: ${newImages.length} slide image(s) into images.json (${newImages.join(', ')})`); } }
catch(e){ fail('cannot write the data files: ' + e.message); }
const line = `\n;${TAG} ` + (profs.length ? `COURSE.professors = (COURSE.professors || []).concat(${JSON.stringify(profs)}); ` : '') + `COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(QFILE)}, ${JSON.stringify(DFILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lectureLit).join(', ')}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version, modules})}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log('wrote: appended to ' + course + ':' + line.trimEnd());
const second = WITH_SECOND ? 0 : PK.qs.filter(q => q.dupOf && decks.some(d => String(q.cite || '').includes(d))).length;
console.log(`data: ${qs.length} questions (calculations: ${qs.filter(q => q.type === 'numeric').length}), ${topics.length} topics, ${objectives.length} objectives, ` +
  `${types.length} kinds of problem, ${skills.length} skills, ${lectures.length} lectures; left out: ${PK.qs.length - qs.length - second} questions citing no lecture deck and ${second} second wordings, ` +
  `${PK.types.length - types.length} kinds whose worked example is not among the questions written, ${PK.chains.length} problem sets`);
console.log(`left out (rule 4): ${dropped.setup.length} setup line(s) naming an equation the course's EQUATIONS lacks (${dropped.setup.join(', ') || 'none'}), ` +
  `${dropped.asks.length} asks key(s) the course's ASKS lacks (${dropped.asks.join(', ') || 'none'}); ` +
  `left out (core fault C7, kit PR #30): ${dropped.teachImg.length} teachImg on a calculation (${dropped.teachImg.join(', ') || 'none'})`);
