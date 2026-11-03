// Lists PK multiple-choice questions usable verbatim as the theme test's fixture:
// no professor name in any field (read from course.js professors[0]), no {{...}} formula
// markup, no teachImg/img, no dupOf, no "given as" (style_check STEM_RE).
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2];
const ctx = {console};
vm.createContext(ctx);
const course = fs.readFileSync(path.join(SRC, 'course.js'), 'utf8');
vm.runInContext(course.replace(/^const COURSE/m, 'var COURSE'), ctx);
const bp = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8');
const files = (bp.slice(bp.indexOf('DATA_FILES'), bp.indexOf(']', bp.indexOf('DATA_FILES'))).match(/'([^']+\.js)'/g) || []).map(s => s.slice(1, -1)).filter(f => f !== 'course.js');
for(const f of files){ try { vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8').replace(/^(const|let) /gm, 'var '), ctx); } catch(e){ console.error('skip', f, e.message); } }
const prof = ctx.COURSE.professors[0];
const all = [];
for(const k of Object.keys(ctx)) if(Array.isArray(ctx[k]) && ctx[k].length && ctx[k][0] && ctx[k][0].id && ctx[k][0].stem) all.push(...ctx[k].map(q => Object.assign({__arr: k}, q)));
const bad = new RegExp(prof + '|\\{\\{|Dr\\.|given as|\\bshe\\b|\\bher\\b', 'i');
const ok = all.filter(q => !q.type && Array.isArray(q.options) && q.options.length && !q.dupOf && !q.teachImg && !q.img && !q.qimg && !bad.test(JSON.stringify(Object.assign({}, q, {prof: ""}))));
const mc = all.filter(q => !q.type && Array.isArray(q.options) && q.options.length);
console.log('mc', mc.length, 'noDup', mc.filter(q => !q.dupOf).length, 'noImg', mc.filter(q => !q.teachImg && !q.img && !q.qimg).length,
  'noProf', mc.filter(q => !new RegExp(prof, 'i').test(JSON.stringify(q))).length, 'noBraces', mc.filter(q => !/\{\{/.test(JSON.stringify(q))).length,
  'noPron', mc.filter(q => !/\bshe\b|\bher\b/i.test(JSON.stringify(q))).length, 'sample', JSON.stringify(Object.keys(mc[0] || {})));
const byTopic = {};
ok.forEach(q => (byTopic[q.topic + '/' + q.sub] = byTopic[q.topic + '/' + q.sub] || []).push(q.id + (q.multi ? '*' : '') + ' [' + q.__arr + ']'));
console.log('files', files.length, 'questions', all.length, 'usable', ok.length);
for(const [k, v] of Object.entries(byTopic)) console.log(k, v.length, v.slice(0, 6).join(' '));
console.log('TOPICS', (ctx.TOPICS || []).map(t => t.id + ':' + (t.subs || []).map(s => s.id).join(',')).join(' | '));
if(process.argv[3]){
  const ids = process.argv[3].split(',');
  const out = {qs: ids.map(id => { const q = all.find(x => x.id === id); const c = Object.assign({}, q); delete c.__arr; return c; })};
  const tids = [...new Set(out.qs.map(q => q.topic))];
  out.topics = (ctx.TOPICS || []).filter(t => tids.includes(t.id));
  out.lectures = (ctx.COURSE.lectures || []).filter(l => out.qs.some(q => String(q.cite || '').includes(l.deck)));
  fs.writeFileSync(process.argv[4], JSON.stringify(out, null, 1));
  console.log('wrote', process.argv[4]);
}
