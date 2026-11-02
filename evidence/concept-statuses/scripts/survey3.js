/* survey3.js <pkSrc> <id> ...: personal names and pronouns for the professor in each question's text */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(process.argv[2], 'q1_module1.js'), 'utf8') + '\n;globalThis.__Q = Q_MODULE1;', ctx);
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
for(const id of process.argv.slice(3)){
  const q = Object.assign({}, ctx.__Q.find(x => x.id === id)); delete q.prof;
  const t = JSON.stringify(q);
  const hits = (t.match(/Mosley|\bDr\.|\bshe\b|\bher\b|\bhers\b/gi) || []);
  console.log(id, hits.length ? 'HITS: ' + hits.join(',') : 'clean', fig.test(q.stem) ? 'FIGWORD' : '', /given as/i.test(q.stem) ? 'GIVENAS' : '', q.dupOf || '');
}
