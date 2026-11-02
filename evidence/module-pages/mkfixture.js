// The module-pages test fixture from Basic-Pharmacokinetics ac2eb73 (read-only clone), Module 2.
const fs = require('fs');
const D = require('/tmp/port-module-pages/pk_all.json');
const ids = ['m2-mod-1','m2-mod-2','m2-vd-1','m2-vd-2','m2-cl-1','m2-cl-3','m2-mc-1','m2-mc-2','m2-mc-4','m2-mc-5',
  'm2-n-k2','m2-n-k1','m2-n-c0a','m2-n-c15','m2-n-cl2','m2-n-vd1','m2-n-koverall','m2-n-tb1','hw2-2a','hw2-2b','hw2-2c','hw2-2d'];
const keep = new Set(ids);
const DROP = ['prof', 'teachImg', 'setup', 'asks', 'givens', 'check', 'audit', 'quote', 'lecture', 'exam'];
// personal names out of the fixture: "Dr. Mosley" is written "the professor"
const unname = v => typeof v === 'string' ? v.replace(/(^|[.!?]\s+|["(]\s*)Dr\. Mosley/g, (m, a) => a + 'The professor').replace(/Dr\. Mosley/g, 'the professor').replace(/Mosley/g, 'the professor')
  : Array.isArray(v) ? v.map(unname) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, unname(x)])) : v;
const qs = ids.map(i => {
  const q = Object.assign({}, D.QUESTIONS.find(x => x.id === i));
  DROP.forEach(k => delete q[k]);
  if(q.dupOf && !keep.has(q.dupOf)) delete q.dupOf;
  return unname(q);
});
const out = {
  qs,
  topics: D.TOPICS.filter(t => /^bolus/.test(t.id)).map(t => { const c = Object.assign({}, t); delete c.prof; return unname(c); }),
  skills: D.COURSE.skills.filter(s => ['krate', 'conctime', 'vddose', 'clearance', 'multicpt'].includes(s.id)),
  module: D.COURSE.topicsMenu.find(m => m.module === 2),
  objectives: D.OBJECTIVES.filter(o => o.module === 2),
  types: D.CALC_TYPES.filter(t => t.module === 2),
  chains: D.CHAINS.filter(c => c.id === 'hw2-p2'),
};
const s = JSON.stringify(out);
console.log(s.length, (s.match(/Mosley/g) || []).length, qs.length, out.objectives.length, out.types.length);
fs.writeFileSync('/tmp/port-module-pages/fixture.json', s);
