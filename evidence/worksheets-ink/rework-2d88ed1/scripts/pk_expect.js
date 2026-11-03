/* PK's own dropCarry, sharedLead and wsOrder (src/views.js at ac2eb73), run on the
   test fixture's questions and sheet plans: the expected values the test records.
   node pk_expect.js <test.js> */
const fs = require('fs');
const V = fs.readFileSync('/tmp/pk-readonly/src/views.js', 'utf8');
const grab = re => { const m = re.exec(V); if(!m) throw new Error('not found ' + re); return m[0]; };
const code = [grab(/const CARRY_RE = [^\n]*\n/), grab(/const dropCarry = [^\n]*\n/),
  grab(/function sharedLead\(stems\)\{[\s\S]*?\n\}\n/), grab(/function wsOrder\(q\)\{[\s\S]*?\n\}\n/)].join('');
const F = new Function(code + 'return {dropCarry, sharedLead, wsOrder};')();
const T = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const PK = JSON.parse(T.find(l => l.startsWith('const PK = ')).slice('const PK = '.length).replace(/;$/, ''));
const EXPECT = JSON.parse(T.find(l => l.startsWith('const EXPECT = ')).slice('const EXPECT = '.length).replace(/;$/, ''));
const by = Object.fromEntries(PK.qs.map(q => [q.id, q]));
const out = {carry: {}, order: {}, cut: {}};
PK.qs.forEach(q => { const d = F.dropCarry(q.stem); if(d !== String(q.stem || '')) out.carry[q.id] = d.length; if((q.options || []).length > 1) out.order[q.id] = F.wsOrder(Object.assign({}, q, {id: 'wsi-' + q.id})).join(''); });   // the order follows the id, and the test's ids carry the prefix wsi-
Object.entries(EXPECT).forEach(([id, e]) => ['main', 'changed'].forEach(v => e[v].forEach((g, i) => {
  if(g.length > 1) out.cut[id + ':' + v + ':' + i] = F.sharedLead(g.map(x => F.dropCarry(by[x].stem))); })));
console.log('const PK_TEXT = ' + JSON.stringify(out) + ';');
