// compares the test.js fixture (PK object) with Basic-Pharmacokinetics' own data at ac2eb73
const fs = require('fs');
const pk = require('./loadpk.js');
const fix = JSON.parse(fs.readFileSync('/tmp/port-terms-variables/pk.json', 'utf8'));
const diffs = [];
function cmp(where, a, b){
  if(JSON.stringify(a) === JSON.stringify(b)) return;
  if(a && b && typeof a === 'object' && typeof b === 'object'){
    for(const k of new Set(Object.keys(a).concat(Object.keys(b)))) cmp(where + '.' + k, a[k], b[k]);
  } else diffs.push([where, JSON.stringify(a), JSON.stringify(b)]);
}
const qby = Object.fromEntries(pk.QUESTIONS.map(q => [q.id, q]));
fix.qs.forEach(q => cmp('q:' + q.id, q, qby[q.id]));
const tby = Object.fromEntries(pk.TERMS.map(t => [t.id, t]));
fix.terms.forEach(t => cmp('term:' + t.id, t, tby[t.id]));
const topby = Object.fromEntries(pk.TOPICS.map(t => [t.id, t]));
fix.topics.forEach(t => cmp('topic:' + t.id, t, topby[t.id]));
cmp('ASKS', fix.asks, pk.ASKS);
for(const d of diffs) console.log(d[0], '\n   fixture:', (d[1] || '').slice(0, 400), '\n   PK     :', (d[2] || '').slice(0, 400));
console.log(diffs.length, 'differences');
