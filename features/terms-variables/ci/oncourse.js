/* terms-variables: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/terms-variables/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as it
 * stands: its `const PK`, which is Basic-Pharmacokinetics' own data at ac2eb73, taken
 * verbatim: 8 terms (src/glossary.js), 10 calculation questions with `asks`
 * (src/q1_module1.js to src/q4_module4.js), their 5 topics (src/q1_module1.js), all of
 * ASKS (src/shell.html 1371-1428) and the three symbol tables VAR_FAMILY, VAR_NAMES and
 * VAR_TWINS (src/views.js 1076-1104), which become the module's options. Every id is
 * prefixed `tvc-` (the test's own scratch copies use `tvt-`, so the two never share an
 * id). Nothing is written for the test.
 *
 * What differs from Basic-Pharmacokinetics' files, and why (rework of 2026-11-03: `prof`
 * and the worked steps are the course's own, the professor's name included, which is added
 * to COURSE.professors when the course lacks it):
 *   - ids are prefixed `tvc-`: question, topic, term (and each `confuse` entry), the
 *     lecture ids and each question's and term's `lecture`;
 *   - a question's `setup` (plan-the-problem's data, which this module does not read)
 *     is left out when it names an equation that the course's EQUATIONS does not have,
 *     since plan-the-problem's build step refuses it;
 *   - a question's `teachImg` is left out: every question here is a calculation, and the
 *     core's browser_test.js stops with a TypeError on a calculation that carries one
 *     (fault C7 in kit PR #30; the core's page does not draw it either);
 *   - a question whose `cite` names no deck of COURSE.lectures is left out, with the
 *     topic it alone filled: tvc-m2-n-d3a and tvc-m2-n-vp1 cite only practice-sheet
 *     solutions (IV-Bolus-Practice-1---Solutions.pdf, IV-Bolus-Practice-3---Solutions.pdf),
 *     which Basic-Pharmacokinetics' course.js lists as no lecture, and the core's test.js
 *     refuses a question that cites no lecture deck (fault C3 in kit PR #30; reproduction in
 *     evidence/terms-variables, rework-* folder). The test's own scratch copies keep all 10;
 *   - a term is left out when the course's own TERMS already has a term of that name
 *     (none in the template; glossary-tap's build step refuses two terms of one name).
 * The rest comes from Basic-Pharmacokinetics as it stands:
 *   - the topics, pushed after the course's own topics (the course's first topic is
 *     unchanged);
 *   - the 5 lectures the questions and terms name (src/course.js `lectures`, L01-L05),
 *     added to COURSE.lectures in the course's own literal form;
 *   - the 5 skills the questions carry (src/course.js `skills`), added to COURSE.skills
 *     when the course does not have them.
 * Files written in <courseSrcDir>:
 *   tvc_course_data.js   TERMS and ASKS (pushed or assigned when the course already
 *                        declares them)
 *   q90_tvc_course.js    the topics and questions kept, one question per line
 *                        opening `{id:'...'` with the professor as a literal
 * and one line appended to course.js: the professor's name in COURSE.professors when the
 * course lacks it, the two files in COURSE.files, the lectures, the
 * skills, and the module on at the version in its module.json with the three symbol
 * tables as its options, kept beside any module already on. Writes only inside
 * <courseSrcDir>; stops with a non-zero exit on any failure, including a course that
 * already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'terms-variables', TAG = '/* terms-variables ci */', PRE = 'tvc-';
const DATA = 'tvc_course_data.js', QFILE = 'q90_tvc_course.js';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read ${path.join(cur, 'test.js')}: ${e.message}`); }
const pkLine = test.split('\n').find(l => l.startsWith('const PK = '));
if(!pkLine) fail('test.js has no top-level `const PK = `');
let PK;
try { PK = vm.runInNewContext(pkLine + '\n;PK', {}); } catch(e){ fail(`test.js's PK cannot be read: ${e.message}`); }
if(!PK || !Array.isArray(PK.terms) || !Array.isArray(PK.qs) || !Array.isArray(PK.topics) || !PK.asks) fail('the fixture in test.js has no terms, questions, topics or ASKS');
if(!Array.isArray(PK.lectures) || !Array.isArray(PK.skills)) fail('the fixture in test.js has no lectures or skills');

const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
for(const f of [DATA, QFILE]) if(fs.existsSync(path.join(src, f))) fail(path.join(src, f) + ' already exists (this script runs once per course)');

// the course as it stands: its professor, skills, lectures, and which of TERMS, ASKS, EQUATIONS it declares
let own;
try {
  const ctx = vm.createContext({});
  const files = vm.runInContext(text + "\n;COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']", ctx);
  const code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
  own = vm.runInContext(text + '\n;\n' + code + '\n;({COURSE, TOPICS: typeof TOPICS === "undefined" ? null : TOPICS, QUESTIONS: typeof QUESTIONS === "undefined" ? null : QUESTIONS,' +
    ' TERMS: typeof TERMS !== "undefined", termNames: typeof TERMS !== "undefined" && Array.isArray(TERMS) ? TERMS.map(t => t && t.term) : [],' +
    ' ASKS: typeof ASKS !== "undefined",' +
    ' EQ: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : []})', vm.createContext({}));
} catch(e){ fail('the course could not be read: ' + e.message); }
if(!own.QUESTIONS || typeof own.QUESTIONS.push !== 'function' || !own.TOPICS) fail('the course declares no TOPICS and QUESTIONS lists');

const lit = s => { if(!/^[A-Za-z0-9_. -]+$/.test(String(s))) fail(`"${s}" cannot be written as a plain literal`); return `'${s}'`; };
const pre = id => PRE + id;
const ownIds = new Set(own.QUESTIONS.map(q => q.id).concat(own.TOPICS.map(t => t.id)));
const clash = PK.qs.map(q => pre(q.id)).concat(PK.topics.map(t => pre(t.id))).filter(id => ownIds.has(id));
if(clash.length) fail('the course already has ' + clash.join(', '));

// a question's `setup` is plan-the-problem's: left out when it names an equation the course does not have
const EQ = new Set(own.EQ || []);
const setupOk = st => !!st && (st.eq === 'none' || EQ.has(st.eq)) && (st.pre || []).every(id => EQ.has(id));
// a question whose `cite` names no deck of COURSE.lectures (the course's own and the 5 added) is left out:
// the core's test.js refuses it, and a lecture for it is not in Basic-Pharmacokinetics' course.js
const decks = new Set((own.COURSE.lectures || []).map(l => l.deck).concat(PK.lectures.map(l => l.deck)));
const citesDeck = q => [...decks].some(d => String(q.cite || '').includes(d));   // the core's lecOf
const keptQs = PK.qs.filter(citesDeck), leftOut = PK.qs.filter(q => !citesDeck(q)).map(q => q.id);
const keptIds = new Set(keptQs.map(q => q.id));
let dropped = 0, droppedImg = 0;
const qline = q => {
  const rest = Object.assign({}, q, {topic: pre(q.topic), lecture: q.lecture && pre(q.lecture)}, q.dupOf ? {dupOf: pre(q.dupOf)} : {});
  delete rest.id; delete rest.type; delete rest.skill; delete rest.prof;
  if(q.dupOf && !keptIds.has(q.dupOf)) fail(`${q.id} is a duplicate of ${q.dupOf}, which is left out`);
  if(rest.setup !== undefined && !setupOk(rest.setup)){ delete rest.setup; dropped++; }
  if(rest.teachImg !== undefined && q.type === 'numeric'){ delete rest.teachImg; droppedImg++; }   // core fault C7
  return `{id:${lit(pre(q.id))},` + (q.type ? ` type:${lit(q.type)},` : '') + (q.skill ? ` skill:${lit(q.skill)},` : '') +
         ` prof:${lit(q.prof)}, ${JSON.stringify(rest).slice(1)},`;
};
// a topic with none of the kept questions is left out (the core needs questions in every topic)
const topics = PK.topics.filter(t => keptQs.some(q => q.topic === t.id)).map(t => Object.assign({}, t, {id: pre(t.id)}));
// a term the course's own TERMS already has by name is left out (one course has one entry per term;
// glossary-tap's build step refuses two terms found by the same name)
const nameOf = s => String(s || '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
const ownNames = new Set((own.termNames || []).map(nameOf));
const sameName = PK.terms.filter(t => ownNames.has(nameOf(t.term))).map(t => t.id);
const terms = PK.terms.filter(t => !ownNames.has(nameOf(t.term))).map(t => Object.assign({}, t, {id: pre(t.id), confuse: (t.confuse || []).map(pre)}, t.lecture ? {lecture: pre(t.lecture)} : {}));
const qbody = `/* terms-variables ci: Basic-Pharmacokinetics' calculation questions and their topics (src/q1_module1.js
   to src/q4_module4.js, ac2eb73), from the module test's fixture, verbatim apart from what
   features/terms-variables/ci/oncourse.js lists; ids prefixed ${PRE} */
TOPICS.push(...${JSON.stringify(topics)});
QUESTIONS.push(
${keptQs.map(qline).join('\n')}
);
`;
const dbody = `/* terms-variables ci: Basic-Pharmacokinetics' terms (src/glossary.js) and ASKS (src/shell.html
   1371-1428), ac2eb73, from the module test's fixture; term ids prefixed ${PRE} */
${own.TERMS ? `TERMS.push(...${JSON.stringify(terms)});` : `const TERMS = ${JSON.stringify(terms)};`}
${own.ASKS ? `Object.assign(ASKS, ${JSON.stringify(PK.asks)});` : `const ASKS = ${JSON.stringify(PK.asks)};`}
`;
// the lectures, in the course's own literal form: state_check.js finds a lecture by its id:'...' entry in course.js
const lectures = PK.lectures.map(l => `{id:${lit(pre(l.id))}, deck:${lit(l.deck)}, label:${JSON.stringify(l.label)}, prof:${lit(l.prof)}, exam:${+l.exam}, module:${+l.module}}`);
const haveSkill = new Set((own.COURSE.skills || []).map(s => s.id));
const skills = PK.skills.filter(s => !haveSkill.has(s.id));
const opts = {version: meta.version, families: PK.families, names: PK.names, twins: PK.twins};
const profs = [...new Set(keptQs.map(q => q.prof).concat(topics.map(t => t.prof), PK.lectures.map(l => l.prof)))].filter(p => p && !(own.COURSE.professors || []).includes(p));
const line = `\n;${TAG} ` + (profs.length ? `COURSE.professors = (COURSE.professors || []).concat(${JSON.stringify(profs)}); ` : '') + `COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(DATA)}, ${JSON.stringify(QFILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.join(', ')}]); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify(opts)}});\n`;
try { fs.writeFileSync(path.join(src, DATA), dbody); } catch(e){ fail('cannot write ' + path.join(src, DATA) + ': ' + e.message); }
try { fs.writeFileSync(path.join(src, QFILE), qbody); } catch(e){ fail('cannot write ' + path.join(src, QFILE) + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${path.join(src, DATA)} (${terms.length} terms, ${Object.keys(PK.asks).length} ASKS entries${own.TERMS || own.ASKS ? ', added to the course\'s own' : ''})`);
console.log(`wrote: ${path.join(src, QFILE)} (${topics.length} of ${PK.topics.length} topics, ${keptQs.length} of ${PK.qs.length} questions)`);
console.log(`left out: terms ${sameName.join(', ') || 'none'} (the course's TERMS has a term of that name); ` +
  `questions ${leftOut.join(', ') || 'none'} (their cite names no deck of COURSE.lectures); ` +
  `${dropped} setup lines (equations the course does not have); ${droppedImg} teachImg on calculations (core fault C7, kit PR #30)`);
console.log(`wrote: appended to ${course}: ${profs.length ? `the professor(s) ${profs.join(', ')} in COURSE.professors, ` : ''}the 2 files in COURSE.files, ${lectures.length} lectures, ${skills.length} skills, and ${NAME} ${meta.version} on`);
