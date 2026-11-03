/* Rework of 2026-11-03 (Louis's porter policy): module-pages' test fixture `PK`, verbatim from
   Basic-Pharmacokinetics src at ac2eb73 (read-only clone): the 22 questions of the first fixture and
   m2-n-cl1, the question m2-n-cl2's dupOf names; topics bolus1 and bolus2; skills; Module 2's
   topicsMenu entry, OBJECTIVES, CALC_TYPES and the set hw2-p2. No field is changed or left out
   (prof, teachImg, setup, asks, givens, check, audit, quote, lecture and exam included; "Dr. Mosley"
   as written). Also writes the slide images the concept questions' teachImg fields name, byte for
   byte from src/images.json, and PK_LECTURES (src/course.js L02 and L03) verbatim.
     node extract_fix.js <pkSrc> <pk.json> <lectures.json> <imagesDir> */
const fs = require('fs'), path = require('path');
const [SRC, OUT, LOUT, IDIR] = process.argv.slice(2);
const B = require('/tmp/port-rework/scripts/pk_bank.js')(SRC);
const ids = ['m2-mod-1','m2-mod-2','m2-vd-1','m2-vd-2','m2-cl-1','m2-cl-3','m2-mc-1','m2-mc-2','m2-mc-4','m2-mc-5',
  'm2-n-k2','m2-n-k1','m2-n-c0a','m2-n-c15','m2-n-cl1','m2-n-cl2','m2-n-vd1','m2-n-koverall','m2-n-tb1','hw2-2a','hw2-2b','hw2-2c','hw2-2d'];
const cp = x => JSON.parse(JSON.stringify(x));
const qs = ids.map(i => { const q = B.QUESTIONS.find(x => x.id === i); if(!q) throw new Error('no ' + i); return cp(q); });
const missingDup = qs.filter(q => q.dupOf && !ids.includes(q.dupOf)).map(q => q.id + ' -> ' + q.dupOf);
const out = {qs,
  topics: B.TOPICS.filter(t => /^bolus[12]$/.test(t.id)).map(cp),
  skills: B.COURSE.skills.filter(s => ['krate', 'conctime', 'vddose', 'clearance', 'multicpt'].includes(s.id)).map(cp),
  module: cp(B.COURSE.topicsMenu.find(m => m.module === 2)),
  objectives: B.OBJECTIVES.filter(o => o.module === 2).map(cp),
  types: B.CALC_TYPES.filter(t => t.module === 2).map(cp),
  chains: B.CHAINS.filter(c => c.id === 'hw2-p2').map(cp)};
const lsk = [...new Set(qs.map(q => q.skill))].filter(s => !out.skills.some(k => k.id === s));
fs.writeFileSync(OUT, JSON.stringify(out));
const lecs = B.COURSE.lectures.filter(l => ['L02', 'L03'].includes(l.id)).map(cp);
fs.writeFileSync(LOUT, JSON.stringify(lecs));
const IMG = JSON.parse(fs.readFileSync(path.join(SRC, 'images.json'), 'utf8'));
fs.mkdirSync(IDIR, {recursive: true});
const keys = [...new Set(qs.filter(q => q.teachImg && q.type !== 'numeric').map(q => q.teachImg))];
for(const k of keys){
  const m = IMG[k].match(/^data:image\/([a-z]+);base64,(.*)$/);
  fs.writeFileSync(path.join(IDIR, k + '.' + m[1]), Buffer.from(m[2], 'base64'));
  if('data:image/' + m[1] + ';base64,' + fs.readFileSync(path.join(IDIR, k + '.' + m[1])).toString('base64') !== IMG[k]) throw new Error(k + ' does not round-trip');
  console.log('image', k, m[1], IMG[k].length, 'chars, round-trips');
}
console.log('questions', qs.length, qs.map(q => q.id + (q.teachImg ? ' [' + q.teachImg + (q.type === 'numeric' ? ', calculation' : '') + ']' : '')).join(', '));
console.log('topics', out.topics.map(t => t.id + ' prof ' + t.prof).join(', '), '| objectives', out.objectives.length, '| types', out.types.length, '| chains', out.chains.map(c => c.id).join());
console.log('lectures', JSON.stringify(lecs));
console.log('dupOf targets missing:', missingDup.join(', ') || 'none', '| skills used but not in the fixture skills:', lsk.join(', '));
console.log('"Mosley" occurrences in the fixture:', (JSON.stringify(out).match(/Mosley/g) || []).length);
