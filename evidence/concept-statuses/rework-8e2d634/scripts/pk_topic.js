// node pk_topic.js <pkSrc> <topic>: every question of the topic, with name/pronoun hits, fig words, dupOf, teachImg
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2], T = process.argv[3];
const ctx = {console}; vm.createContext(ctx);
const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8') + (f === 'course.js' ? '\n;globalThis.__C = COURSE;' : ''), ctx, {filename: f});
const Q = vm.runInContext('QUESTIONS', ctx);
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
for(const q of Q.filter(q => q.topic === T)){
  const c = Object.assign({}, q); delete c.prof;
  const hits = JSON.stringify(c).match(/Mosley|\bDr\.|\bshe\b|\bher\b|\bhers\b|\bhim\b|\bhis\b|\bhe\b/gi) || [];
  console.log([q.id, q.sub, q.concept, q.type||'mcq', q.lecture, hits.length ? 'NAMES:'+hits.join(',') : '', fig.test(q.stem||'') ? 'FIG' : '', /given as/i.test(q.stem||'')?'GIVENAS':'', q.dupOf?'dupOf '+q.dupOf:'', q.teachImg?'img '+q.teachImg:''].filter(Boolean).join('  '));
}
