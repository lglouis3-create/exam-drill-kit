/* Read-only scan of Basic-Pharmacokinetics' data at ac2eb73 (/tmp/pk-readonly/src):
   for each document of SOURCES, whether its questions meet the kit core's checks
   (a numeric item has at least two worked steps; the cite names a deck of
   COURSE.lectures; a stem that promises a figure has an image; dupOf targets).
   node pk_scan.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = '/tmp/pk-readonly/src';
const ctx = vm.createContext({console});
const course = fs.readFileSync(path.join(SRC, 'course.js'), 'utf8');
const files = ['q1_module1.js','q2_module2.js','q3_module3.js','q4_module4.js','q5_module5.js','q7_module6.js','q8_module6b.js','q12_module7.js','q13_quizzes.js','q6_figures.js','q9_worksheets.js','q10_homework.js','q14_review.js','q15_module7b.js','q16_module8.js','q17_final_review.js','q18_new_a.js','q18_new_b.js','q18_new_c.js','q11_extra.js','qz_all.js'];   // build.py DATA_FILES
let code = course;
for(const f of files){ code += '\n;\n' + fs.readFileSync(path.join(SRC, f), 'utf8'); }
for(const f of ['sources.js']) if(!files.includes(f)) code += '\n;\n' + fs.readFileSync(path.join(SRC, f), 'utf8');
const X = vm.runInNewContext(code + '\n;({COURSE, QUESTIONS, TOPICS, SOURCES, CHAINS: typeof CHAINS === "undefined" ? [] : CHAINS})', {console});
const images = JSON.parse(fs.readFileSync(path.join(SRC, 'images.json'), 'utf8'));
const by = Object.fromEntries(X.QUESTIONS.map(q => [q.id, q]));
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
console.log('files', files.join(' '));
console.log('decks', [...new Set(X.COURSE.lectures.map(l => l.deck))].join(' | '));
for(const s of X.SOURCES){
  const qs = s.items.map(it => by[it.q]).filter(Boolean), bad = [];
  qs.forEach(q => {
    if(q.type === 'numeric' && !(Array.isArray(q.steps) && q.steps.length >= 2)) bad.push(q.id + ':steps');
    if(!X.COURSE.lectures.some(l => (q.cite || '').includes(l.deck))) bad.push(q.id + ':cite');
    if(fig.test(q.stem) && !(q.img && images[q.img])) bad.push(q.id + ':fig');
    if(q.dupOf && !by[q.dupOf]) bad.push(q.id + ':dup-missing');
  });
  const dups = qs.filter(q => q.dupOf).length, chainsN = (s.chains || []).length;
  console.log([s.id, s.type, 'm' + s.module, qs.length + 'q', chainsN + 'sets', dups + 'dup', qs.filter(q => q.img).length + 'img', bad.length ? 'BAD ' + bad.slice(0, 4).join(',') + (bad.length > 4 ? '…' + bad.length : '') : 'ok'].join('  '));
}
