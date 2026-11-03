/* Reads Basic-Pharmacokinetics src/ (read-only clone) and prints, as JSON, the course data the
   quiz-prep-cards fixture takes: COURSE.quizzes, the questions of the professor's graded Quiz 4
   and Quiz 5 (q13_quizzes.js cq4-*, cq5-*) and the questions their dupOf names, less those listed in `left`, the TOPICS entries they name, the COURSE.lectures
   entries they name, and the COURSE.skills entries their skills name. Nothing is changed here;
   the prof change is made by the fixture writer. usage: node extract.js <pkSrcDir> (QPC_TRIAL=1: keep the refused questions too, the reproduction of rework 2026-11-03) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = process.argv[2];
const files = fs.readFileSync(path.join(src, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'([^']+\.js)'/g).map(s => s.slice(1, -1));
const ctx = {console}; vm.createContext(ctx);
let code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
code += '\n;globalThis.__X = {COURSE, TOPICS, QUESTIONS};';
vm.runInContext(code, ctx, {filename: 'pk-data'});
const {COURSE, TOPICS, QUESTIONS} = ctx.__X;
/* The professor's graded Quiz 4 and Quiz 5 (cq4-*, cq5-*) and, so that every dupOf points at a
   question in the slice (core test.js), each question a kept question names in dupOf, and so on.
   A question the kit core's bank check refuses as written is left out, not changed: a cite that
   names no deck in COURSE.lectures (core test.js "cite no deck in the manifest") or a
   single-answer question with fewer than 3 options (core test.js "only 2 options"); so is every
   question whose dupOf chain reaches a left-out one. */
const byId = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const decks = COURSE.lectures.map(l => l.deck);
const refused = q => !decks.some(d => String(q.cite || '').includes(d)) ? 'its cite names no deck in COURSE.lectures'
  : (!q.type && (q.options || []).length < 3) ? `a single-answer question with ${(q.options || []).length} options` : '';
const chain = q => { const out = []; for(let r = q; r; r = r.dupOf ? byId[r.dupOf] : null){ if(out.includes(r)) break; out.push(r); } return out; };
const left = [], qs = [];
for(const q of QUESTIONS.filter(q => /^cq[45]-/.test(q.id))){
  const c = chain(q), bad = c.find(r => refused(r));
  if(bad && process.env.QPC_TRIAL !== '1'){ c.forEach(r => { if(!left.some(x => x.id === r.id)) left.push({id: r.id, why: r === bad ? refused(r) : `its dupOf chain reaches ${bad.id} (${refused(bad)})`}); }); continue; }
  c.forEach(r => { if(!qs.includes(r)) qs.push(r); });
}
const topicIds = [...new Set(qs.map(q => q.topic))];
const topics = TOPICS.filter(t => topicIds.includes(t.id));
const lecIds = [...new Set(qs.map(q => q.lecture))];
const lectures = COURSE.lectures.filter(l => lecIds.includes(l.id));
const skillIds = [...new Set(qs.map(q => q.skill))];
const skills = COURSE.skills.filter(s => skillIds.includes(s.id));
const out = {quizzes: COURSE.quizzes, topics, qs, lectures, skills, left,
  counts: {bank: QUESTIONS.length, files: files.length, qs: qs.length, byModule: qs.reduce((a, q) => (a[q.module] = (a[q.module] || 0) + 1, a), {}),
           allInModules: {q4: QUESTIONS.filter(q => [6, 7].includes(q.module)).length, q5: QUESTIONS.filter(q => [9, 8].includes(q.module)).length},
           topicQs: topicIds.map(t => [t, QUESTIONS.filter(q => q.topic === t).length])}};
console.log(JSON.stringify(out));
