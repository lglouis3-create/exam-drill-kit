/* The worksheets-ink test fixture, read from Basic-Pharmacokinetics at ac2eb73
   (/tmp/pk-readonly/src, read only), verbatim: the documents named below (SOURCES),
   the questions on them and the questions their dupOf names (QUESTIONS after
   qz_all.js), their problem sets (CHAINS), their topics (TOPICS) and the lectures
   whose decks their cites name (COURSE.lectures). It also checks the old fixture's
   questions are the same objects, and prints PK's own sheetPlan and solvedBy on
   each document (EXPECT), taken from src/views.js.
   node pk_fixture.js <old test.js> <out.json> */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = '/tmp/pk-readonly/src';
const DOCS = ['quiz-1', 'hw-2', 'dp-m1-2', 'dp-m1-3', 'ex-m6a', 'ic-m7', 'ic-m7b', 'ex-m8'];
// the documents ci/oncourse.js puts on a course: every question on them meets the kit core's checks (pk_scan.js), with no
// figure or slide picture (the template course has no images.json entries for them)
// and none names the professor in its text (pk_names.js); none carries a dupOf (core test.js section 7 takes
// the first concept with two questions, and a dupOf pair is one question in two numbers)
const CI = (process.env.WS_CI || DOCS.join(',')).split(',');
const files = ['q1_module1.js','q2_module2.js','q3_module3.js','q4_module4.js','q5_module5.js','q7_module6.js','q8_module6b.js','q12_module7.js','q13_quizzes.js','q6_figures.js','q9_worksheets.js','q10_homework.js','q14_review.js','q15_module7b.js','q16_module8.js','q17_final_review.js','q18_new_a.js','q18_new_b.js','q18_new_c.js','q11_extra.js','qz_all.js'];
let code = fs.readFileSync(path.join(SRC, 'course.js'), 'utf8');
for(const f of files.concat(['sources.js'])) code += '\n;\n' + fs.readFileSync(path.join(SRC, f), 'utf8');
const P = vm.runInNewContext(code + '\n;({COURSE, QUESTIONS, TOPICS, SOURCES, SOURCE_OF, CHAINS})', {console});
const by = Object.fromEntries(P.QUESTIONS.map(q => [q.id, q]));
const sources = DOCS.map(id => { const s = P.SOURCES.find(x => x.id === id); if(!s) throw new Error('no document ' + id); return s; });
const ids = [];
const add = (id, dup) => { if(!by[id]) throw new Error('no question ' + id); if(ids.includes(id)) return; ids.push(id); if(dup && by[id].dupOf) add(by[id].dupOf, dup); };
sources.forEach(s => s.items.forEach(it => add(it.q, true)));
// the professor's name is the one change: `prof` is left off here (the test and ci/oncourse.js set the course's own, the template's "Professor")
// rework 2026-11-03 (Louis's policy): every value verbatim, `prof` included; the dupOf targets of every document are carried
const noProf = o => Object.assign({}, o);
const qs = ids.map(id => noProf(by[id]));
const chainIds = [...new Set(sources.flatMap(s => s.chains || []))];
const chains = chainIds.map(id => P.CHAINS.find(c => c.id === id));
const topics = P.TOPICS.filter(t => qs.some(q => q.topic === t.id)).map(noProf);
const skills = P.COURSE.skills.filter(k => qs.some(q => q.skill === k.id));
const lectures = P.COURSE.lectures.filter(l => qs.some(q => (q.cite || '').includes(l.deck))).map(noProf);
// the old fixture's questions are these same objects
const T = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const OLD = JSON.parse(T.find(l => l.startsWith('const PK = ')).slice('const PK = '.length).replace(/;$/, ''));
const differ = OLD.qs.filter(q => JSON.stringify(q) !== JSON.stringify(noProf(by[q.id]))).map(q => q.id);
const differT = OLD.topics.filter(t => JSON.stringify(t) !== JSON.stringify(noProf(P.TOPICS.find(x => x.id === t.id)))).map(t => t.id);
console.log(`old fixture topics: ${OLD.topics.length}, ${differT.length} differ`);
const differS = OLD.sources.filter(s => JSON.stringify(s) !== JSON.stringify(P.SOURCES.find(x => x.id === s.id))).map(s => s.id);
console.log(`old fixture: ${OLD.qs.length} questions, ${differ.length} differ from PK (${differ.join(' ')}); ${OLD.sources.length} documents, ${differS.length} differ`);
// PK's own sheetPlan and solvedBy (src/views.js), with byId, SRC_OF and CHAINS of PK
const V = fs.readFileSync(path.join(SRC, 'views.js'), 'utf8');
const grab = re => { const m = re.exec(V); if(!m) throw new Error('not found ' + re); return m[0]; };
const fns = [grab(/function setNumbers\(c\)\{[\s\S]*?\n\}\n/), grab(/const srcLabel = [^\n]*\n/), grab(/function sheetPlan\(s\)\{[\s\S]*?\n\}\n/),
  grab(/const DRILL_WORKED = [^\n]*\n/), grab(/function solvedBy\(q, s\)\{[\s\S]*?\n\}\n/)].join('');
const F = new Function('byId', 'SRC_OF', 'CHAINS', fns + 'return {sheetPlan, solvedBy};')(id => by[id], P.SOURCE_OF, P.CHAINS);
const EXPECT = {};
sources.forEach(s => { const p = F.sheetPlan(s);
  EXPECT[s.id] = {main: p.main.map(g => g.ids), changed: p.changed.map(g => g.ids), mainChanged: p.mainChanged,
    by: Object.fromEntries(p.main.concat(p.changed).flatMap(g => g.ids).map(q => [q, F.solvedBy(by[q], s) === 'her' ? 'prof' : 'drill']))}; });
const OLDX = JSON.parse(T.find(l => l.startsWith('const EXPECT = ')).slice('const EXPECT = '.length).replace(/;$/, ''));
console.log('old EXPECT the same as PK\'s functions give now:', Object.keys(OLDX).every(k => JSON.stringify(OLDX[k]) === JSON.stringify(EXPECT[k])));
console.log(`new fixture: ${sources.length} documents, ${qs.length} questions, ${chains.length} problem sets, ${topics.length} topics, ${skills.length} skills, ${lectures.length} lectures (${lectures.map(l => l.id + ' ' + l.deck).join('; ')})`);
const modules = P.COURSE.topicsMenu.filter(t => t.module != null).map(t => { const m = /Module\s+(\S+)/.exec(t.name); return [t.module, m ? m[1] : String(t.module), t.name]; });
console.log('modules', JSON.stringify(modules));
fs.writeFileSync(process.argv[3], JSON.stringify({PK: {sources, chains, qs, topics, lectures, skills, ci: CI}, EXPECT, modules}));
