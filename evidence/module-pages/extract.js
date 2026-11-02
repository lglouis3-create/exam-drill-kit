// Reads Basic-Pharmacokinetics data files (read-only clone) in its build order and dumps module data.
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = '/tmp/pk-readonly/src';
const files = ['course.js','q1_module1.js','q2_module2.js','q3_module3.js','q4_module4.js','q5_module5.js','q7_module6.js','q8_module6b.js','q12_module7.js','q13_quizzes.js','q6_figures.js','q9_worksheets.js','q10_homework.js','q14_review.js','q15_module7b.js','q16_module8.js','q17_final_review.js','q18_new_a.js','q18_new_b.js','q18_new_c.js','q11_extra.js','qz_all.js'];
let code = files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
code += '\n;globalThis.__D={COURSE,TOPICS,QUESTIONS,OBJECTIVES,CALC_TYPES,CHAINS,WORKSHEET_KINDS};';
const sb = {console}; sb.globalThis = sb; vm.createContext(sb); vm.runInContext(code, sb);
const D = sb.__D;
fs.writeFileSync('/tmp/port-module-pages/pk_all.json', JSON.stringify(D));
console.log(D.QUESTIONS.length, D.OBJECTIVES.length, D.CALC_TYPES.length, D.CHAINS.length, D.COURSE.skills.map(s => s.id + ':' + (s.kind || '')).join(' '));
const m2 = D.QUESTIONS.filter(q => q.module === 2);
console.log('m2 qs', m2.length, 'types', [...new Set(m2.map(q => q.type || 'mc'))]);
console.log('m2 subs', [...new Set(m2.map(q => q.topic + '/' + q.sub + (q.type ? '#' + q.type + ':' + q.skill : '')))].join(' '));
console.log('m2 chains', D.CHAINS.filter(c => c.module === 2).map(c => c.id + ':' + c.src + ':' + c.parts.length).join(' '));
