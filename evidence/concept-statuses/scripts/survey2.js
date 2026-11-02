/* survey2.js <pkSrc> <id> ...: for each question, skill, fields, and which option whys hold {{frac: */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(process.argv[2], 'q1_module1.js'), 'utf8') + '\n;globalThis.__Q = Q_MODULE1;', ctx);
for(const id of process.argv.slice(3)){
  const q = ctx.__Q.find(x => x.id === id);
  const fr = (q.options || []).map((o, i) => /\{\{frac:/.test(o.why || '') ? i + (o.correct ? 'c' : 'w') : null).filter(x => x !== null);
  console.log(id, q.skill, q.type || 'mcq', 'fields:', Object.keys(q).join(','), '| frac in whys:', fr.join(' ') || 'none',
    q.pairs ? '| pairs ' + JSON.stringify(q.pairs).slice(0, 300) : '', '| cite:', q.cite);
}
