// read-only: IP (929cd62) quoted spans and links that hold a glossary term name
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = '/tmp/ip-readonly/exam1-drill/src';
const sb = {}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(D, 'glossary.js'), 'utf8') + ';this.T = TERMS', sb);
const T = sb.T;
const nameOf = t => String(t.term).replace(/\s*\([^)]*\)\s*$/, '').trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const res = T.map(t => [t, new RegExp('(^|[^A-Za-z0-9])' + reEsc(nameOf(t)) + '(e?s)?(?![A-Za-z0-9])', 'i')]);
const files = fs.readdirSync(D).filter(f => /^(guide\d*|q_.*|tell.*|ref.*)\.js$/.test(f)).sort();
const out = [];
for(const f of files){
  const s = fs.readFileSync(path.join(D, f), 'utf8');
  for(const m of s.matchAll(/“([^”]{1,200})”/g)) for(const [t, re] of res) if(re.test(m[1])) out.push([f, 'quote', t.id, m[0]]);
  for(const m of s.matchAll(/<a [^>]*>([^<]{1,200})<\/a>/g)) for(const [t, re] of res) if(re.test(m[1])) out.push([f, 'link', t.id, m[0].slice(0, 160)]);
}
console.log(out.length);
const by = {}; out.forEach(o => { const k = o[0] + ' ' + o[1]; by[k] = (by[k] || 0) + 1; });
console.log(by);
out.filter(o => /^guide/.test(o[0])).slice(0, 25).forEach(o => console.log(o.join(' | ')));
out.filter(o => /^q_/.test(o[0])).slice(0, 10).forEach(o => console.log(o.join(' | ')));
