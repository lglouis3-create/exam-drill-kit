/* Writes the line `const FIX = {...};` for features/quiz-prep-cards/current/test.js from the
   extract of Basic-Pharmacokinetics (extract.js output). Rework 2026-11-03 (Louis's policy): every value
   verbatim, `prof` included. usage: node mkfix.js <extract.json> <out.txt> */
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const prof = o => Object.assign({}, o);
const FIX = {quizzes: d.quizzes, topics: d.topics.map(prof), lectures: d.lectures.map(prof), skills: d.skills, qs: d.qs.map(prof)};
const s = JSON.stringify(FIX);
fs.writeFileSync(process.argv[3], 'const FIX = ' + s + ';\n');
console.log('FIX:', FIX.quizzes.length, 'quizzes,', FIX.topics.length, 'topics,', FIX.lectures.length, 'lectures,', FIX.skills.length, 'skills,', FIX.qs.length, 'questions;', s.length, 'characters');
