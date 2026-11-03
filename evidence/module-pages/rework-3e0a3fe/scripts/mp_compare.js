// node mp_compare.js <test.js>: each field of module-pages' PK fixture that differs from the source
const fs = require('fs'), vm = require('vm');
const B = require('/tmp/port-rework/scripts/pk_bank.js')('/tmp/pk-readonly/src');
const t = fs.readFileSync(process.argv[2], 'utf8'), line = t.split('\n').find(l => l.startsWith('const PK = '));
const PK = vm.runInNewContext(line + ';PK');
const diff = (a, b, p, out) => { if(JSON.stringify(a) === JSON.stringify(b)) return;
  if(a && b && typeof a === 'object' && typeof b === 'object'){ for(const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + '.' + k, out); }
  else out.push(`${p}: fixture ${JSON.stringify(a)===undefined?'(absent)':JSON.stringify(a).slice(0,140)} | source ${JSON.stringify(b)===undefined?'(absent)':JSON.stringify(b).slice(0,140)}`); };
const out = [];
PK.qs.forEach(q => diff(q, B.QUESTIONS.find(x => x.id === q.id), q.id, out));
PK.topics.forEach(x => diff(x, B.TOPICS.find(y => y.id === x.id), 'topic ' + x.id, out));
PK.objectives.forEach((x, i) => diff(x, B.OBJECTIVES.filter(o => o.module === 2)[i], 'objective ' + i, out));
PK.types.forEach(x => diff(x, B.CALC_TYPES.find(y => y.id === x.id), 'type ' + x.id, out));
PK.chains.forEach(x => diff(x, B.CHAINS.find(y => y.id === x.id), 'chain ' + x.id, out));
diff(PK.skills, B.COURSE.skills.filter(s => PK.skills.some(k => k.id === s.id)), 'skills', out);
diff(PK.module, B.COURSE.topicsMenu.find(m => m.module === 2), 'module', out);
console.log(out.join('\n')); console.log(out.length + ' differences');
const m2 = B.QUESTIONS.filter(q => q.module === 2 || /^bolus/.test(q.topic));
console.log('source questions in topics bolus1/bolus2:', B.QUESTIONS.filter(q => /^bolus[12]$/.test(q.topic)).length, '; module 2:', B.QUESTIONS.filter(q => q.module === 2).length);
