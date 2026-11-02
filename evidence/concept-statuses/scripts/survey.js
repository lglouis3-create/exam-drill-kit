/* survey.js <pkSrc>: Module 1 questions by topic, with concept, type, dupOf, setup eq, and whether the stem trips
   browser_test.js's figure-promise words or style_check's "given as" */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(process.argv[2], 'q1_module1.js'), 'utf8') + '\n;globalThis.__Q = Q_MODULE1;', ctx);
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
for(const q of ctx.__Q){
  if(!['orders', 'auc', 'intro'].includes(q.topic)) continue;
  console.log([q.id, q.topic + '/' + q.sub, q.concept, q.type || 'mcq', q.dupOf ? 'dupOf ' + q.dupOf : '', q.setup ? 'eq ' + q.setup.eq : '',
    fig.test(q.stem) ? 'FIGWORD' : '', /given as/i.test(q.stem) ? 'GIVENAS' : '', q.multi ? 'multi' : ''].filter(Boolean).join('  '));
}
