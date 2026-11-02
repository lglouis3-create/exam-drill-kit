/* Which PK documents' questions (with their dupOf targets) carry the professor's
   name in their text, and which lectures (and exams) their cites name. Read only.
   node pk_names.js <document id> ... */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = '/tmp/pk-readonly/src';
const files = ['q1_module1.js','q2_module2.js','q3_module3.js','q4_module4.js','q5_module5.js','q7_module6.js','q8_module6b.js','q12_module7.js','q13_quizzes.js','q6_figures.js','q9_worksheets.js','q10_homework.js','q14_review.js','q15_module7b.js','q16_module8.js','q17_final_review.js','q18_new_a.js','q18_new_b.js','q18_new_c.js','q11_extra.js','qz_all.js'];
let code = fs.readFileSync(path.join(SRC, 'course.js'), 'utf8');
for(const f of files.concat(['sources.js'])) code += '\n;\n' + fs.readFileSync(path.join(SRC, f), 'utf8');
const P = vm.runInNewContext(code + '\n;({COURSE, QUESTIONS, SOURCES})', {console});
const by = Object.fromEntries(P.QUESTIONS.map(q => [q.id, q]));
const NAME = new RegExp(P.COURSE.lectures[0].prof);
for(const id of process.argv.slice(2)){
  const s = P.SOURCES.find(x => x.id === id), ids = [];
  const add = i => { if(!by[i] || ids.includes(i)) return; ids.push(i); if(by[i].dupOf) add(by[i].dupOf); };
  s.items.forEach(it => add(it.q));
  const named = ids.filter(i => { const c = Object.assign({}, by[i]); delete c.prof; return NAME.test(JSON.stringify(c)); });
  const lec = [...new Set(ids.map(i => { const l = P.COURSE.lectures.find(l => (by[i].cite || '').includes(l.deck)); return l ? l.id + '/e' + l.exam : 'none'; }))];
  const imgs = ids.filter(i => by[i].img || by[i].teachImg || JSON.stringify(by[i]).includes("teachImg"));
  console.log(id, "img:" + imgs.length, ids.length + "q", "named:" + named.length + (named.length ? ' (' + named.slice(0, 3).join(' ') + ')' : ''), lec.join(' '));
}
