// read-only scan of PK at ac2eb73: questions whose why/teach has {{frac:..}} and names a PK term
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = process.argv[2];
const sb = {console}; vm.createContext(sb);
const qf = fs.readdirSync(D).filter(f => /^q\d+_.*\.js$/.test(f)).sort();
vm.runInContext(fs.readFileSync(path.join(D, 'glossary.js'), 'utf8') + '\n;this.__T = TERMS;', sb);
const T = sb.__T, Q = [];
for(const f of qf){
  const src = fs.readFileSync(path.join(D, f), 'utf8');
  const names = [...src.matchAll(/^const (Q_[A-Za-z0-9_]+)\s*=/gm)].map(m => m[1]);
  const c = {console, QUESTIONS: [], TOPICS: [], CHAINS: [], WORKSHEETS: [], OBJECTIVES: []}; vm.createContext(c);
  try { vm.runInContext(src + '\n;this.__Q = [].concat(' + names.join(',') + ');', c); } catch(e){ console.log('ERR', f, e.message); continue; }
  c.__Q.forEach(q => { q.__file = f; Q.push(q); });
}
const nameOf = t => String(t.term).replace(/\s*\([^)]*\)\s*$/, '').trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
console.log('terms', T.length, 'questions', Q.length);
const mode = process.argv[3] || 'frac';
const out = [];
for(const q of Q){
  const parts = [...(q.options || []).map((o, i) => ['why' + i, o.why || '']), ['teach', typeof q.teach === 'string' ? q.teach : JSON.stringify(q.teach || '')]];
  for(const [where, p] of parts){
    const segs = (mode === 'both' && !/\{\{frac:/.test(p)) ? [] : mode === 'frac' ?[...p.matchAll(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g)].map(m => m[0]) : [p];
    for(const s of segs){
      for(const t of T){
        const n = nameOf(t); if(n.length < 3) continue;
        const re = new RegExp('(^|[^A-Za-z0-9])' + reEsc(n) + '(e?s)?(?![A-Za-z0-9])', 'i');
        if(re.test(s)) out.push([q.id, where, t.id, n, s.length > 200 ? s.slice(0, 200) + '…' : s]);
      }
    }
  }
}
console.log(out.length);
out.slice(0, 80).forEach(x => console.log(x.join(' | ')));
