/* survey_all.js <pkSrc>: every bank question that is free of personal names and pronouns, with no figure-promise
   word and no "given as" in its stem; grouped by topic, with concept, type, dupOf, and frac in an option why */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2];
const ctx = {console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SRC, 'course.js'), 'utf8') + '\n;globalThis.__C = COURSE;', ctx);
const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1)).filter(f => f !== 'course.js');
for(const f of FILES){ try { vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, {filename: f}); } catch(e){ console.log('skip file', f, e.message.slice(0, 80)); } }
const Q = vm.runInContext('typeof QUESTIONS === "undefined" ? [] : QUESTIONS', ctx);
const byId = Object.fromEntries(Q.map(q => [q.id, q]));
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
const clean = q => { const c = Object.assign({}, q); delete c.prof; return !/Mosley|\bDr\.|\bshe\b|\bher\b|\bhers\b|\bhim\b|\bhis\b|\bhe\b/i.test(JSON.stringify(c)) && !fig.test(q.stem || '') && !/given as/i.test(q.stem || ''); };
const C = Q.filter(clean);
console.log('bank', Q.length, 'clean', C.length);
const byC = {};
C.forEach(q => (byC[q.topic + ' ' + q.concept] = byC[q.topic + ' ' + q.concept] || []).push(q));
for(const [k, qs] of Object.entries(byC)) if(qs.length > 1 || qs.some(q => q.type === 'numeric'))
  console.log(k, qs.map(q => q.id + (q.type ? ':' + q.type : '') + (q.dupOf ? '(dup ' + q.dupOf + (byId[q.dupOf] && clean(byId[q.dupOf]) ? ' clean' : ' NOT clean') + ')' : '') + (q.teachImg ? '' : '') +
    ((q.options || []).some(o => !o.correct && /\{\{frac:/.test(o.why || '')) ? '[frac]' : '')).join(' '));
const topics = {};
C.forEach(q => topics[q.topic] = (topics[q.topic] || 0) + 1);
console.log('clean per topic', JSON.stringify(topics));
