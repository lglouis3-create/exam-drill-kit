// read-only: IP questions whose option why or teach holds a quoted span naming a term
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = '/tmp/ip-readonly/exam1-drill/src';
const sb = {}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(D, 'glossary.js'), 'utf8') + ';this.T = TERMS', sb);
const T = sb.T;
const nameOf = t => String(t.term).replace(/\s*\([^)]*\)\s*$/, '').trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const res = T.map(t => [t, new RegExp('(^|[^A-Za-z0-9])' + reEsc(nameOf(t)) + '(e?s)?(?![A-Za-z0-9])', 'i')]);
for(const f of fs.readdirSync(D).filter(f => /^q_.*\.js$/.test(f)).sort()){
  const c = {QUESTIONS: [], TOPICS: [], COURSE: {}}; vm.createContext(c);
  let qs = [];
  try { vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8') + ';this.__Q = QUESTIONS', c); qs = c.__Q; } catch(e){ console.log('ERR', f, e.message); continue; }
  for(const q of qs){
    const parts = (q.options || []).map((o, i) => ['why' + i, o.why || '']).concat([['teach', typeof q.teach === 'string' ? q.teach : JSON.stringify(q.teach || '')]]);
    for(const [w, p] of parts) for(const m of p.matchAll(/“([^”]{1,200})”/g)){
      const ins = res.filter(([t, re]) => re.test(m[1])).map(([t]) => t.id);
      if(ins.length){
        // is the term named before the quote in the card text?
        const before = parts.slice(0, parts.findIndex(x => x[0] === w)).map(x => x[1]).join(' ') + ' ' + p.slice(0, m.index);
        const first = ins.filter(id => !res.find(([t]) => t.id === id)[1].test(before));
        if(first.length) console.log(f, q.id, w, first.join(','), m[0].slice(0, 120));
      }
    }
  }
}
