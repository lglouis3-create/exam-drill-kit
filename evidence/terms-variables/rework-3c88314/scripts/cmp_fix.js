// node cmp_fix.js <test.js>: each field of terms-variables' PK fixture that differs from Basic-Pharmacokinetics at ac2eb73
const fs = require('fs'), vm = require('vm'), path = require('path');
const pk = require(path.join(__dirname, 'loadpk.js'));
const t = fs.readFileSync(process.argv[2], 'utf8'), fix = vm.runInNewContext(t.split('\n').find(l => l.startsWith('const PK = ')) + ';PK');
const diffs = [];
function cmp(where, a, b){
  if(JSON.stringify(a) === JSON.stringify(b)) return;
  if(a && b && typeof a === 'object' && typeof b === 'object'){ for(const k of new Set(Object.keys(a).concat(Object.keys(b)))) cmp(where + '.' + k, a[k], b[k]); }
  else diffs.push([where, JSON.stringify(a), JSON.stringify(b)]);
}
const qby = Object.fromEntries(pk.QUESTIONS.map(q => [q.id, q]));
fix.qs.forEach(q => cmp('q:' + q.id, q, qby[q.id]));
const tby = Object.fromEntries(pk.TERMS.map(t => [t.id, t]));
fix.terms.forEach(t => cmp('term:' + t.id, t, tby[t.id]));
const topby = Object.fromEntries(pk.TOPICS.map(t => [t.id, t]));
fix.topics.forEach(t => cmp('topic:' + t.id, t, topby[t.id]));
cmp('ASKS', fix.asks, pk.ASKS);
if(fix.lectures) fix.lectures.forEach(l => cmp('lecture:' + l.id, l, pk.COURSE.lectures.find(x => x.id === l.id)));
if(fix.skills) fix.skills.forEach(s => cmp('skill:' + s.id, s, pk.COURSE.skills.find(x => x.id === s.id)));
for(const d of diffs) console.log(d[0], '\n   fixture:', (d[1] || '(absent)').slice(0, 300), '\n   PK     :', (d[2] || '(absent)').slice(0, 300));
console.log(diffs.length, 'differences');
console.log('fixture keys:', Object.keys(fix).join(', '));
