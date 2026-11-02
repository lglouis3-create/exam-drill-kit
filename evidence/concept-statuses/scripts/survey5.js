/* survey5.js <pkSrc> <id>: each option of a question, correct or wrong, the length of its why and where {{frac: starts */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2]; const ctx = {}; vm.createContext(ctx);
const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, {filename: f});
const q = vm.runInContext('QUESTIONS', ctx).find(x => x.id === process.argv[3]);
q.options.forEach((o, i) => console.log(i, o.correct ? 'C' : 'w', o.t, '|', (o.why || '').length, (o.why || '').indexOf('{{frac:'), (o.why || '').slice(0, 160)));
