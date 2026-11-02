// loads Basic-Pharmacokinetics' data at ac2eb73 (read-only clone) into one object; reads only
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = process.env.PK_SRC || '/tmp/pk-readonly/src';
const files = ['course.js','q1_module1.js','q2_module2.js','q3_module3.js','q4_module4.js','q5_module5.js','q7_module6.js','q8_module6b.js','q12_module7.js','q13_quizzes.js','q6_figures.js','q9_worksheets.js','q10_homework.js','q14_review.js','q15_module7b.js','q16_module8.js','q17_final_review.js','q18_new_a.js','q18_new_b.js','q18_new_c.js','q11_extra.js','qz_all.js','glossary.js'];
let code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
const shell = fs.readFileSync(path.join(src, 'shell.html'), 'utf8');
const m = shell.match(/const ASKS\s*=\s*\{[\s\S]*?\n\s*\};/);
code += '\n;' + (m ? m[0] : '') + '\n;({COURSE, TOPICS, QUESTIONS, TERMS: typeof TERMS==="undefined"?null:TERMS, GLOSSARY: typeof GLOSSARY==="undefined"?null:GLOSSARY, ASKS: typeof ASKS==="undefined"?null:ASKS})';
module.exports = vm.runInNewContext(code, {console});
if(require.main === module){ const d = module.exports; console.log(Object.fromEntries(Object.entries(d).map(([k,v]) => [k, v && (Array.isArray(v) ? v.length : Object.keys(v).length)]))); }
