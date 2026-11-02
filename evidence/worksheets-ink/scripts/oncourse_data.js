/* Course data for the module-on scratch course (worksheets-ink alone, or with
   chained-problem-sets): two documents over the template's own sample questions,
   and with chained-problem-sets one problem set of two of them. Nothing here ships.
   node oncourse_data.js <src> [chained] */
const fs = require('fs'), path = require('path');
const [SRC, mode] = process.argv.slice(2);
const chained = mode === 'chained';
const SOURCES = [
  {id: 'tpl-dp-1', title: 'Daily practice 1', type: 'daily-practice', module: 'Module 1', date: '2026-10-01',
   key: 'instructor', chains: chained ? ['tpl-set-1'] : [], items: [{q: 's1-1', label: '1'}, {q: 's1-2', label: '2'}, {q: 's2-3', label: '3'}]},
  {id: 'tpl-quiz-1', title: 'Quiz 1', type: 'quiz', module: 'Module 1', date: '2026-10-08',
   items: [{q: 's2-1', label: '1'}, {q: 's2-2', label: '2'}, {q: 's2-4', label: '3'}]}];
let text = `const SOURCES = ${JSON.stringify(SOURCES)};\n`;
if(chained) text += `const CHAINS = ${JSON.stringify([{id: 'tpl-set-1', name: 'Daily practice 1, problems 1 and 2', setup: 'The two problems of Daily practice 1.', parts: ['s1-1', 's1-2']}])};\n`;
fs.writeFileSync(path.join(SRC, 'ws_course.js'), text);
const feats = chained ? "{'worksheets-ink': {version: 'v1'}, 'chained-problem-sets': {version: 'v2'}}" : "{'worksheets-ink': {version: 'v1'}}";
fs.appendFileSync(path.join(SRC, 'course.js'), `\n;COURSE.files = COURSE.files.concat(['ws_course.js']);\nCOURSE.features = ${feats};\n`);
