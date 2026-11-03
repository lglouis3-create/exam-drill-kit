/* Rework of 2026-11-03: terms-variables' fixture `PK` with every question, term, topic, lecture and skill
   taken again from Basic-Pharmacokinetics at ac2eb73 (read-only clone), verbatim: the professor's name in
   `prof` and in the worked steps as the course prints it. ASKS and the symbol tables are unchanged (they
   already equal the course's). Writes the new `const PK = ...;` line.
     node restore_fix.js <test.js> <out.txt> */
const fs = require('fs'), vm = require('vm'), path = require('path');
const pk = require(path.join(__dirname, 'loadpk.js'));
const t = fs.readFileSync(process.argv[2], 'utf8'), line = t.split('\n').find(l => l.startsWith('const PK = '));
const fix = vm.runInNewContext(line + ';PK');
const cp = x => JSON.parse(JSON.stringify(x)), one = (list, id, what) => { const x = list.find(y => y.id === id); if(!x) throw new Error('no ' + what + ' ' + id); return cp(x); };
const out = Object.assign({}, fix, {
  terms: fix.terms.map(x => one(pk.TERMS, x.id, 'term')),
  qs: fix.qs.map(x => one(pk.QUESTIONS, x.id, 'question')),
  topics: fix.topics.map(x => one(pk.TOPICS, x.id, 'topic')),
  lectures: fix.lectures.map(x => one(pk.COURSE.lectures, x.id, 'lecture')),
  skills: fix.skills.map(x => one(pk.COURSE.skills, x.id, 'skill'))});
fs.writeFileSync(process.argv[3], 'const PK = ' + JSON.stringify(out) + ';');
console.log('questions', out.qs.length, 'terms', out.terms.length, 'topics', out.topics.length, 'lectures', out.lectures.length, 'skills', out.skills.length);
console.log('"Mosley" before', (line.match(/mosley/gi) || []).length, 'after', (JSON.stringify(out).match(/mosley/gi) || []).length,
  '| "the professor" before', (line.match(/the professor/gi) || []).length, 'after', (JSON.stringify(out).match(/the professor/gi) || []).length);
