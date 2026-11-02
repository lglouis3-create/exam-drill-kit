/* Compares the IP fixture in features/short-answer-graphs/current/test.js with
 * Intro-Pharmacology exam1-drill/src at 929cd62 (read-only clone), field by field.
 *   node verify_fixture.js <test.js> <ip src dir>
 * Prints, for each part of the fixture, whether it equals the source; for the
 * `prof` field it prints only "the course's professor" or "Professor", never the
 * value. Exit 1 when anything else differs. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const [testFile, src] = process.argv.slice(2);
const t = fs.readFileSync(testFile, 'utf8');
const line = t.split('\n').find(l => l.startsWith('const IP = '));
const IP = vm.runInNewContext('(' + line.slice('const IP = '.length).replace(/;\s*$/, '') + ')', {});
const files = fs.readdirSync(src);
const ctx = {console: {log(){}, warn(){}}};
vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8').replace(/^(const|let) /gm, 'var '), ctx, {filename: f});
run('course.js');
const COURSE = ctx.COURSE, profs = COURSE.professors;
vm.runInContext('var TOPICS = []; var QUESTIONS = [];', ctx);
for(const f of ['q_FIGS.js', 'q_L06.js', 'q_PE2.js']){
  // these files push onto TOPICS / QUESTIONS, or declare them
  run(f);
}
run('graphs.js'); run('sa4.js'); run('sa3.js');
const images = JSON.parse(fs.readFileSync(path.join(src, 'images.json'), 'utf8'));
const appSrc = fs.readFileSync(path.join(src, 'app.js'), 'utf8');
const grabObj = name => { const m = appSrc.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});')); return vm.runInNewContext('(' + m[1] + ')', {}); };
const MISS = grabObj('MISS'), MISS2 = grabObj('MISS2');
let bad = 0;
const profWord = v => profs.includes(v) ? "the course's professor" : v === 'Professor' ? 'Professor' : 'something else';
function cmp(label, a, b){
  const A = Object.assign({}, a), B = Object.assign({}, b);
  const pa = A.prof, pb = B.prof; delete A.prof; delete B.prof;
  const same = JSON.stringify(A) === JSON.stringify(B);
  const extra = [Object.keys(b).filter(k => !(k in a)), Object.keys(a).filter(k => !(k in b))];
  console.log(`${same ? 'SAME' : 'DIFF'}  ${label}` + (pa !== undefined || pb !== undefined ? `  (prof: fixture ${profWord(pa)}, source ${profWord(pb)})` : '') +
    (extra[0].length ? `  fields only in source: ${extra[0].join(',')}` : '') + (extra[1].length ? `  fields only in fixture: ${extra[1].join(',')}` : ''));
  return same;
}
IP.qs.forEach(q => {
  const s = ctx.QUESTIONS.find(x => x.id === q.id);
  if(!s){ console.log('MISSING in source: ' + q.id); bad++; return; }
  const S = s;   // the fixture keeps fg; test.js and ci/oncourse.js leave it out when they write the course (the core reads fg as a drawn structure)
  if(!cmp('question ' + q.id, q, S)) bad++;
});
IP.topics.forEach(tp => { const s = ctx.TOPICS.find(x => x.id === tp.id); if(!s || !cmp('topic ' + tp.id, tp, s)) bad++; });
IP.graphs.forEach(g => { const s = ctx.GRAPHS.find(x => x.key === g.key); if(!s || !cmp('figure ' + g.key, g, s)) bad++; });
const SA = ctx.SHORT4.concat(ctx.SHORT3);
IP.sa.forEach(p => { const s = SA.find(x => x.id === p.id); if(!s || !cmp('prompt ' + p.id, p, s)) bad++; });
(IP.lectures || []).forEach(l => { const s = COURSE.lectures.find(x => x.id === l.id); if(!s || !cmp('lecture ' + l.id, l, s)) bad++; });
(IP.skills || []).forEach(k => { const s = COURSE.skills.find(x => x.id === k.id); if(!s || !cmp('skill ' + k.id, k, s)) bad++; });
Object.keys(IP.images).forEach(k => { const same = IP.images[k] === images[k]; console.log(`${same ? 'SAME' : 'DIFF'}  image ${k} (${String(IP.images[k]).length} characters)`); if(!same) bad++; });
const m1 = JSON.stringify(IP.miss) === JSON.stringify(MISS), m2 = JSON.stringify(IP.miss2) === JSON.stringify(MISS2);
console.log(`${m1 ? 'SAME' : 'DIFF'}  app.js MISS (${Object.keys(MISS).length} tags)`); if(!m1) bad++;
console.log(`${m2 ? 'SAME' : 'DIFF'}  app.js MISS2 (${Object.keys(MISS2).length} tags)`); if(!m2) bad++;
// the lectures the fixture's prompts and cites name, and whether their text names a professor
const re = new RegExp('\\b(' + profs.join('|') + ')\\b', 'i');
const wantLec = new Set(IP.sa.map(p => p.lecture).concat(IP.qs.map(q => q.lecture)));
const cites = IP.qs.map(q => q.cite).join('; ');
COURSE.lectures.forEach(l => {
  const decks = [l.deck].concat(l.decks || []);
  const cited = decks.filter(d => cites.includes(d));
  if(!wantLec.has(l.id) && !cited.length) return;
  const named = Object.entries(l).filter(([k, v]) => k !== 'prof' && re.test(JSON.stringify(v))).map(([k]) => k);
  console.log(`LECTURE ${l.id}: named by ${wantLec.has(l.id) ? 'a prompt or question lecture field' : ''}${cited.length ? ' cites (' + cited.join(', ') + ')' : ''}; ` +
    (named.length ? `its ${named.join(', ')} names a professor, so it is left out` : 'no professor named outside prof'));
});
console.log(bad ? `FAIL: ${bad} part(s) differ from the source` : 'PASS: every part of the fixture equals the source at 929cd62, except prof as listed');
process.exit(bad ? 1 : 0);
