/* Compares the plan-the-problem test fixture (const PK in test.js) and the
   equation-drill fixture (const FIX) with Basic-Pharmacokinetics at ac2eb73.
   node verify_fixture.js <kit worktree> <pk src>  -> prints each difference; exit 1 if any */
const fs = require('fs'), path = require('path');
const [kit, src] = process.argv.slice(2);
const pk = require('./pkload')(src);
const t = fs.readFileSync(path.join(kit, 'features/plan-the-problem/current/test.js'), 'utf8');
const FIXQ = JSON.parse(t.split('\n').find(l => l.startsWith('const PK = ')).slice(11).replace(/;$/, ''));
const et = fs.readFileSync(path.join(kit, 'features/equation-drill/current/test.js'), 'utf8');
const EQF = JSON.parse(et.match(/^const FIX = (\[.*\]);$/m)[1]);
const S = x => JSON.stringify(x);
const diffs = [];
const deep = (a, b, where) => {
  if(S(a) === S(b)) return;
  if(a && b && typeof a === 'object' && typeof b === 'object'){
    for(const k of new Set([...Object.keys(a), ...Object.keys(b)])) deep(a[k], b[k], where + '.' + k);
  } else diffs.push(`${where}: fixture ${S(a)} | PK ${S(b)}`);
};
console.log(`PK: ${pk.QUESTIONS.length} questions, ${pk.EQUATIONS.length} equations, ${Object.keys(pk.ASKS).length} ASKS, files ${pk.files.length}`);
for(const q of FIXQ.qs){
  const o = pk.QUESTIONS.find(x => x.id === q.id);
  if(!o){ diffs.push(`${q.id}: not in PK QUESTIONS`); continue; }
  deep(q, o, 'q ' + q.id);
}
deep(FIXQ.asks, pk.ASKS, 'ASKS');
for(const tp of FIXQ.topics){
  const o = pk.TOPICS.find(x => x.id === tp.id);
  if(!o){ diffs.push(`topic ${tp.id}: not in PK`); continue; }
  if(tp.name !== o.name) diffs.push(`topic ${tp.id}: name differs`);
  for(const s of tp.subs){ const os = o.subs.find(x => x.id === s.id); if(!os || os.name !== s.name) diffs.push(`topic ${tp.id}/${s.id}: sub not in PK or name differs`); }
  const extra = Object.keys(o).filter(k => !(k in tp)); if(extra.length) console.log(`  note: fixture topic ${tp.id} leaves out PK fields ${extra.join(',')} and ${o.subs.length - tp.subs.length} of ${o.subs.length} subs`);
}
deep(FIXQ.plan.models, pk.PLAN_MODELS, 'PLAN.models');
deep(FIXQ.plan.topics, pk.PLAN_TOPIC, 'PLAN.topics');
deep(FIXQ.plan.units, pk.UNIT_POOL, 'PLAN.units');
const lis = [...pk.CALC_ROUTINE_HTML.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
deep(FIXQ.plan.routine, lis, 'PLAN.routine');
console.log('  note: PLAN.also is the course code planModels() written as data:', S(FIXQ.plan.also), '; PLAN.same', S(FIXQ.plan.same));
const named = new Set(FIXQ.qs.flatMap(q => [q.setup.eq, ...(q.setup.pre || [])]).filter(x => x !== 'none'));
for(const id of named){
  const f = EQF.find(e => e.id === id), o = pk.EQUATIONS.find(e => e.id === id);
  if(!f) diffs.push(`equation ${id}: named by a fixture question, not in the equation-drill fixture`);
  if(!o) diffs.push(`equation ${id}: not in PK EQUATIONS`);
  if(f && o) deep(f, o, 'eq ' + id);
}
for(const f of EQF){ const o = pk.EQUATIONS.find(e => e.id === f.id); if(!o) diffs.push(`equation-drill fixture ${f.id}: not in PK`); else if(!named.has(f.id)) deep(f, o, 'eq(unnamed) ' + f.id); }
console.log(`fixture: ${FIXQ.qs.length} questions, ${named.size} equations named (${[...named].join(', ')}), equation-drill fixture ${EQF.length}`);
console.log(diffs.length ? diffs.map(d => '  DIFF ' + d).join('\n') : '  no difference');
process.exit(diffs.length ? 1 : 0);
