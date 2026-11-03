// Load Basic-Pharmacokinetics' bank in its build order (src/build.py DATA_FILES), read-only.
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = process.env.PK_SRC || '/tmp/pk-readonly/src';
const FILES = ['course.js','q1_module1.js','q2_module2.js','q3_module3.js','q4_module4.js','q5_module5.js','q7_module6.js','q8_module6b.js','q12_module7.js','q13_quizzes.js','q6_figures.js','q9_worksheets.js','q10_homework.js','q14_review.js','q15_module7b.js','q16_module8.js','q17_final_review.js','q18_new_a.js','q18_new_b.js','q18_new_c.js','q11_extra.js','qz_all.js'];
const text = {};
for(const f of FILES) text[f] = fs.readFileSync(path.join(SRC, f), 'utf8');
const code = FILES.map(f => text[f]).join('\n;\n') + '\n;({COURSE, TOPICS, QUESTIONS, CHAINS: typeof CHAINS==="undefined"?null:CHAINS})';
const ctx = vm.createContext({console});
module.exports = Object.assign(vm.runInContext(code, ctx), {FILES, SRC, text});
if(require.main === module){
  const B = module.exports;
  console.log('questions', B.QUESTIONS.length, 'topics', B.TOPICS.length);
  const kinds = {};
  for(const q of B.QUESTIONS){ const k = (q.type||'single') + (q.multi?'/multi':'') + (q.lowYield?'/low':'') + (q.dupOf?'/dup':''); kinds[k]=(kinds[k]||0)+1; }
  console.log(kinds);
  const keys = {};
  for(const q of B.QUESTIONS) for(const k of Object.keys(q)) keys[k]=(keys[k]||0)+1;
  console.log(keys);
}
