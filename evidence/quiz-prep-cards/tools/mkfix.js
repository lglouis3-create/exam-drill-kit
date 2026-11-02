/* Writes the line `const FIX = {...};` for features/quiz-prep-cards/current/test.js from the
   extract of Basic-Pharmacokinetics (extract.js output). The one change: every `prof` is set to
   the template's "Professor". usage: node mkfix.js <extract.json> <out.txt> */
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const prof = o => Object.assign({}, o, {prof: 'Professor'});
const FIX = {quizzes: d.quizzes, topics: d.topics.map(prof), lectures: d.lectures.map(prof), skills: d.skills, qs: d.qs.map(prof)};
const s = JSON.stringify(FIX);
const names = [...new Set(d.qs.concat(d.topics, d.lectures).map(o => o.prof))].filter(n => n !== 'Professor');
if(names.some(n => s.includes(n))) throw new Error('the professor\'s name is still in the fixture');
fs.writeFileSync(process.argv[3], 'const FIX = ' + s + ';\n');
console.log('FIX:', FIX.quizzes.length, 'quizzes,', FIX.topics.length, 'topics,', FIX.lectures.length, 'lectures,', FIX.skills.length, 'skills,', FIX.qs.length, 'questions;', s.length, 'characters');
