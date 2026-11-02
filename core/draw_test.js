/* The exam draw never puts two wordings of one fact on a paper.
 *
 * Wordings of one fact are marked dupOf and form a family: an original, the
 * questions marked dupOf it, and chains of those. A family can span two pools
 * (one wording in this lecture's pool, one in an earlier lecture's), and a draw
 * that keeps a blocked set per pool lets both onto one paper; Medicinal-chemistry
 * saw that about once in 300 papers before ed38dbd. The course's own bank may
 * have no family that spans pools on the day this runs, so the draw is run on a
 * fixed bank built here, with every kind of family:
 *
 *   F1  a pair split across the two pools
 *   F2  a chain (b3 dupOf b2 dupOf b1) across the two pools
 *   F3  siblings: c1 and c2 both dupOf c0, in different pools
 *   F4  siblings of an original that is not in the bank
 *
 * Families are written out below rather than worked out by the engine, so the
 * test does not share the code it checks. Both draws are run: by pool marks
 * (drawPaper) and by announced counts (drawBlueprint). Then the course's own
 * bank is drawn too.
 *
 *     node draw_test.js
 */
const L = require('./check_lib');
const NAME = 'draw_test.js';
const {check, skip} = L;
L.PAGE.need(NAME);
const PAPERS = 400;

const X = L.engine('{QUESTIONS, EXAM, drawPaper, drawBlueprint: typeof drawBlueprint === "function" ? drawBlueprint : null}');

/* Families in the course's own bank, from the dupOf fields alone. */
function families(qs){
  const by = Object.fromEntries(qs.map(q => [q.id, q])), fam = {};
  for(const q of qs){
    let id = q.id, r = q; const seen = new Set();
    while(r && r.dupOf && !seen.has(r.id)){ seen.add(r.id); id = r.dupOf; r = by[r.dupOf]; }
    fam[q.id] = id;
  }
  return fam;
}
function clashes(papers, fam){
  let bad = 0; const where = {};
  for(const p of papers){
    const n = {};
    for(const q of p){ const f = fam[q.id]; if(f) (n[f] ||= []).push(q.id); }
    const hit = Object.entries(n).filter(([, ids]) => ids.length > 1);
    if(hit.length){ bad++; hit.forEach(([f, ids]) => { where[f + ': ' + ids.sort().join('+')] = (where[f + ': ' + ids.sort().join('+')] || 0) + 1; }); }
  }
  return {bad, where};
}

console.log('\n=== The course bank ===');
{
  const real = X.QUESTIONS.slice();
  const fam = families(real);
  const inFam = Object.entries(fam).filter(([id, f]) => id !== f || real.some(q => fam[q.id] === id && q.id !== id));
  if(!real.some(q => q.dupOf)) skip('no two wordings of one fact on a paper drawn from this bank', 'no question in this bank carries dupOf');
  else if(X.EXAM.questions === null || X.EXAM.questions === undefined)
    skip('no two wordings of one fact on a paper drawn from this bank', 'the number of questions on the exam is not set, so no paper is drawn');
  else {
    const famOnly = Object.fromEntries(inFam);
    const papers = Array.from({length: PAPERS}, () => X.drawPaper());
    const c = clashes(papers, famOnly);
    check(!c.bad, `${PAPERS} papers from this bank carry no two members of one dupOf family`, JSON.stringify(c.where));
  }
}

console.log('\n=== A fixed bank with every kind of family ===');
const q = (id, pool, dupOf) => ({id, prof: 'P', tier: 'new', topic: pool, sub: 'a', concept: 'c-' + id, skill: 'recall',
  stem: `Fixture ${pool} question ${id}`, cite: 'fixture', dupOf,
  options: [{t: 'one', correct: true, why: 'fixture'}, {t: 'two', correct: false, why: 'fixture'}, {t: 'three', correct: false, why: 'fixture'}]});
const BANK = [
  q('a1', 'poolA'), q('a2', 'poolB', 'a1'),
  q('b1', 'poolB'), q('b2', 'poolA', 'b1'), q('b3', 'poolB', 'b2'),
  q('c0', 'poolA'), q('c1', 'poolA', 'c0'), q('c2', 'poolB', 'c0'),
  q('d1', 'poolA', 'gone'), q('d2', 'poolB', 'gone'),
  q('e1', 'poolA'), q('e2', 'poolA'), q('e3', 'poolA'), q('e4', 'poolA'),
  q('f1', 'poolB'), q('f2', 'poolB'), q('f3', 'poolB'), q('f4', 'poolB'),
];
const FAM = {a1: 'F1', a2: 'F1', b1: 'F2', b2: 'F2', b3: 'F2', c0: 'F3', c1: 'F3', c2: 'F3', d1: 'F4', d2: 'F4'};
X.QUESTIONS.splice(0, X.QUESTIONS.length, ...BANK);
delete X.EXAM.blueprint;
X.EXAM.questions = 8;
X.EXAM.pools.splice(0, X.EXAM.pools.length,
  {key: 'A', name: 'Pool A', marks: 4, filter: {topic: 'poolA'}, test: x => x.topic === 'poolA'},
  {key: 'B', name: 'Pool B', marks: 4, filter: {topic: 'poolB'}, test: x => x.topic === 'poolB'});

function judge(label, draw){
  const papers = [];
  try { for(let i = 0; i < PAPERS; i++) papers.push(draw()); }
  catch(e){ check(false, `${label}: ${PAPERS} papers are drawn`, e.message); return; }
  const shape = papers.filter(p => p.length !== 8 || new Set(p.map(x => x.id)).size !== 8 ||
    p.filter(x => x.topic === 'poolA').length !== 4).length;
  check(!shape, `${label}: every paper has 8 different questions, 4 from each pool`, `${shape} of ${PAPERS} did not`);
  const seen = {}; papers.flat().forEach(x => { if(FAM[x.id]) seen[FAM[x.id]] = 1; });
  check(Object.keys(seen).length === 4, `${label}: every family is drawn on some paper, so the check is not empty`, Object.keys(seen).join(','));
  const c = clashes(papers, FAM);
  const cross = Object.keys(c.where).filter(k => k.split(': ')[1].split('+').some(id => BANK.find(b => b.id === id).topic === 'poolA') &&
                                                 k.split(': ')[1].split('+').some(id => BANK.find(b => b.id === id).topic === 'poolB'));
  check(!c.bad, `${label}: no paper carries two members of one dupOf family (pairs, chains, siblings)`,
    `${c.bad} of ${PAPERS} papers did; ${JSON.stringify(c.where)}`);
  check(!cross.length, `${label}: including families whose members sit in different pools`, cross.join('; '));
}
judge('drawn by pool marks', () => X.drawPaper());
if(X.drawBlueprint){
  const bp = {sata: 0, cats: [{key: 'A', match: 'poolA'}, {key: 'B', match: 'poolB'}], rest: 'other',
              parts: [{key: 'A', name: 'A', n: 4}, {key: 'B', name: 'B', n: 4}]};
  X.EXAM.blueprint = bp;                          // bpCat reads the categories from EXAM.blueprint
  judge('drawn by announced counts', () => X.drawBlueprint(bp));
  delete X.EXAM.blueprint;
} else check(false, 'drawn by announced counts', 'drawBlueprint is not in the page');
L.finish(NAME);
