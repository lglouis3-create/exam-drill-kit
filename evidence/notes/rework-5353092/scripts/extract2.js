// The notes test's FIX from Basic-Pharmacokinetics (read-only clone, ac2eb73), rework 2026-11-03 (Louis's policy):
// every value verbatim, `prof` included. Questions: the 16 of the earlier fixture first, then every question of topics
// pkpd and nonlin that the earlier port left out because its text names the professor or uses a pronoun for her,
// with the questions their dupOf names. Mode `final` (default) leaves out what the kit core refuses as written
// (a cite that names no lecture deck: PR #30 C3; a single-answer question with fewer than 3 options: C2; and any
// question whose dupOf chain reaches one); mode `trial` keeps them all (the
// reproduction). usage: node extract2.js [final|trial] > fix.txt   (stderr: counts and what is left out, by id)
const fs = require('fs'), vm = require('vm');
const mode = process.argv[2] || 'final';
const S = '/tmp/pk-readonly/src/', rd = f => fs.readFileSync(S + f, 'utf8');
const code = rd('course.js') + '\nvar TOPICS=[];var CHAINS=[];\n' + rd('q13_quizzes.js') + '\n' + rd('q15_module7b.js') + '\n' + rd('q16_module8.js') +
  '\n;globalThis.__R={COURSE,TOPICS,Q:[].concat(Q_QUIZZES,Q_MODULE7B,Q_MODULE8)};';
const c = {}; vm.createContext(c); vm.runInContext(code, c);
const {COURSE, TOPICS, Q} = JSON.parse(JSON.stringify(c.__R));
const NAME = COURSE.professors[0].toLowerCase(), by = Object.fromEntries(Q.map(q => [q.id, q]));
const decks = COURSE.lectures.map(l => l.deck);
const OLD = ['cq5-1', 'pd-c20', 'pd-c01', 'pd-c02', 'pd-c04', 'pd-c06', 'pd-c22', 'pd-ex-b',
             'cq5-6', 'nl-c04', 'nl-c02', 'nl-c03', 'nl-c05', 'nl-c06', 'nl-ex1', 'nl-ex2a'];
const text = q => { const r = Object.assign({}, q); delete r.prof; return JSON.stringify(r); };
const named = q => text(q).toLowerCase().includes(NAME) || /\b(she|her|hers|herself)\b/i.test(text(q));
const refused = q => !decks.some(d => String(q.cite || '').includes(d)) ? 'C3: its cite names no lecture deck'
  : (!q.type && (q.options || []).length < 3) ? `C2: a single-answer question with ${(q.options || []).length} options`
  : /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i.test(q.stem || '') && !q.fig && !q.stemImg && !q.img
    ? 'browser_test.js: the stem\'s "below" reads as a promised figure (new core entry; core/browser_test.js line 376)'
  : '';   // "given as" (C10) is no longer refused: style_check.js on main 4e0fae4 (#31) passes nl-c10 (trial run)
// the earlier port's other leave-outs (core refusals), tried again in trial mode
const EARLIER = ['nl-c10', 'pd-c13', 'nl-c01', 'nl-c18', 'cq5-2', 'pd-c14', 'cq5-5', 'nl-c08', 'nl-c09'];
const chain = q => { const out = []; for(let r = q; r; r = r.dupOf ? by[r.dupOf] : null){ if(out.includes(r)) break; out.push(r); } return out; };
const back = Q.filter(q => (q.topic === 'pkpd' || q.topic === 'nonlin') && !OLD.includes(q.id) && (named(q) || EARLIER.includes(q.id)));
const ids = OLD.slice(), left = [];
for(const q of back){
  const ch = chain(q), bad = ch.find(r => refused(r));
  if(bad && mode !== 'trial'){ if(!left.some(x => x.id === q.id)) left.push({id: q.id, why: q === bad ? refused(q) : `its dupOf chain reaches ${bad.id} (${refused(bad)})`}); continue; }
  ch.forEach(r => { if(!ids.includes(r.id)) ids.push(r.id); });
}
const qs = ids.map(id => by[id]);
qs.forEach(q => { if(q.dupOf && !ids.includes(q.dupOf)) throw new Error(q.id + ' dupOf ' + q.dupOf + ' is not in the set'); });
const tids = ['pkpd', 'nonlin'];
const topics = tids.map(t => { const x = TOPICS.find(y => y.id === t); return Object.assign({}, x, {subs: x.subs.filter(s => qs.some(q => q.topic === t && q.sub === s.id))}); });
const lectures = ['L11', 'L12'].map(id => COURSE.lectures.find(l => l.id === id));
const skillIds = [...new Set(qs.map(q => q.skill))];
// as the earlier fixture: the two skills of the two topics (the others the questions use, apply, recall and tell, the template has)
const skills = ['pkpd', 'nonlin'].map(id => COURSE.skills.find(s => s.id === id));
const J = JSON.stringify;
let out = 'const FIX = {\n';
out += '  lectures: [\n' + lectures.map(l => '    ' + J(l)).join(',\n') + '],\n';
out += '  skills: [\n' + skills.map(l => '    ' + J(l)).join(',\n') + '],\n';
out += '  topics: [\n' + topics.map(l => '    ' + J(l)).join(',\n') + '],\n';
out += '  qs: [\n' + qs.map(l => '    ' + J(l)).join(',\n') + '\n  ]};\n';
process.stdout.write(out);
console.error(`mode ${mode}: questions ${qs.length} (${OLD.length} earlier, ${qs.length - OLD.length} put back: ${ids.slice(OLD.length).join(' ')}), topics ${topics.length} (subs ${topics.map(t => t.subs.length).join('+')}), lectures ${lectures.length}, skills ${skills.length} (${skillIds.join(' ')})`);
console.error(`left out (${left.length}): ` + left.map(x => `${x.id} [${x.why}]`).join('; '));
