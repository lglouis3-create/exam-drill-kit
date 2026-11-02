// Build the paper-picker test fixture from Basic-Pharmacokinetics at ac2eb73 (read-only copy), with nothing invented.
//   node mkfixture.js <out.json>
// Taken verbatim: COURSE.exams (all three, every field), COURSE.activeExam, COURSE.lectures (all twelve),
// the COURSE.skills entries and TOPICS entries the selected questions use, the selected questions, and the
// images.json entries they show.
// The one change made to the data: every `prof` field (questions, topics, lectures) is left out here and
// set to the course's own first professor ("Professor" in the kit's template) when the fixture is written
// into a course, so the kit holds no personal name.
// Selection rule (which questions are taken, never what they say). A question can be taken when it
//   - has no `type`: a single-answer or select-all question (these exams have no `typed`, so their papers
//     carry only these),
//   - is not `lowYield` (never on a paper),
//   - does not name the professor anywhere in its text (Mosley, Dr.): kit fixtures hold no personal names,
//   - passes the core's own rules that a question in a kit course must pass (each named below with the
//     core file it is copied from),
//   - and, when it has a `dupOf`, every question up its dupOf chain can be taken too (core test.js fails a
//     dupOf that points at a missing question).
// Every such question without an image is taken. A question with an image (`img`, `teachImg`) is taken
// only while a pool of the current exam (Exam 3, which the core draws and checks) or of Exam 2 has fewer
// question families than its marks, smallest image first, with the images.json entries it shows.
// Exam 1's Module 2 pool cannot be filled (the bank has too few Module 2 questions that pass), so no image
// question is taken for it, and the drill says a paper for Exam 1 cannot be drawn.
const fs = require('fs');
const B = require('./pkload.js');
const IM = JSON.parse(fs.readFileSync(B.SRC + '/images.json', 'utf8'));
const byId = Object.fromEntries(B.QUESTIONS.map(q => [q.id, q]));
const NAME = /Mosley|Dr\./;
// the core's own rules, copied from the kit's core at the port branch's core tree c9fde5b:
const STEM_RE = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|given as|named as|described as)\b/i;  // style_check.js line 34
const FIG_RE = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;   // browser_test.js line 361: a stem that promises a figure must show one
const BAD_WORD = /\b(undefined|null|NaN|\[object Object\])\b/;                       // browser_test.js line 182, nullexam_test.js line 61
const decks = B.COURSE.lectures.map(l => l.deck);
const text = q => JSON.stringify(Object.assign({}, q, {prof: ''}));
const imgsOf = q => [q.img, q.teachImg].filter(Boolean);
const reasons = q => [q.type && 'has a type (' + q.type + ')', q.lowYield && 'lowYield',
  NAME.test(text(q)) && 'names the professor',
  STEM_RE.test(q.stem || '') && 'stem matches style_check.js STEM_RE',
  FIG_RE.test(q.stem || '') && !q.img && 'stem promises a figure and has none (browser_test.js)',
  !decks.some(d => (q.cite || '').includes(d)) && 'cite names no lecture deck (test.js)',
  (q.options || []).length < 3 && 'fewer than 3 options (test.js line 84)',
  q.multi && (q.options || []).length < 4 && 'select-all with fewer than 4 options (test.js line 82)',
  q.multi && (q.options || []).every(o => o.correct) && 'select-all with no distractor (test.js line 81)',
  BAD_WORD.test(text(q)) && 'text holds the word undefined, null or NaN (browser_test.js, nullexam_test.js)',
  imgsOf(q).some(k => !IM[k]) && 'its image is not in images.json'].filter(Boolean);
let can = new Set(B.QUESTIONS.filter(q => !reasons(q).length).map(q => q.id));
const chainOut = new Map();
for(let changed = true; changed;){
  changed = false;
  for(const id of [...can]){ const q = byId[id]; if(q.dupOf && !can.has(q.dupOf)){ can.delete(id); chainOut.set(id, q.dupOf); changed = true; } }
}
const chain = q => { const out = [q]; let r = q; const seen = new Set(); while(r.dupOf && !seen.has(r.id)){ seen.add(r.id); r = byId[r.dupOf]; out.push(r); } return out; };
const family = q => { const c = chain(q); return c[c.length - 1].id; };
// lecture of a question, as the core reads it (shell.html lecOf: the first lecture whose deck the cite names)
const lecOf = q => B.COURSE.lectures.find(l => (q.cite || '').includes(l.deck));
const field = (q, k) => (k === 'exam' || k === 'module') ? (lecOf(q) || {})[k] : q[k];
const inPool = (q, p) => Object.entries(p.filter).every(([k, v]) => Array.isArray(v) ? v.includes(field(q, k)) : field(q, k) === v);
const keep = new Set([...can].filter(id => !imgsOf(byId[id]).length));
// a question with a dupOf is kept only with its whole chain
for(let changed = true; changed;){ changed = false; for(const id of [...keep]) if(chain(byId[id]).some(x => !keep.has(x.id))){ keep.delete(id); changed = true; } }
const poolOf = (e, q) => e.pools.find(x => inPool(q, x));
const famsIn = (e, p) => { const s = new Set(); for(const id of keep){ const q = byId[id]; if(poolOf(e, q) === p) s.add(family(q)); } return s.size; };
const imgShown = new Set();
for(const id of keep) imgsOf(byId[id]).forEach(k => imgShown.add(k));
const cost = q => [...new Set(chain(q).flatMap(imgsOf))].filter(k => !imgShown.has(k)).reduce((s, k) => s + IM[k].length, 0);
const added = [];
for(const e of B.COURSE.exams.filter(e => e.id === B.COURSE.activeExam || e.id === 2)){
  for(const p of e.pools){
    while(famsIn(e, p) < p.marks){
      const have = new Set([...keep].filter(id => poolOf(e, byId[id]) === p).map(id => family(byId[id])));
      const cands = [...can].map(id => byId[id]).filter(q => !keep.has(q.id) && poolOf(e, q) === p && !have.has(family(q)));
      if(!cands.length) throw new Error(`${e.name} ${p.key}: no question left to fill it`);
      cands.sort((a, b) => cost(a) - cost(b) || B.QUESTIONS.indexOf(a) - B.QUESTIONS.indexOf(b));
      const q = cands[0];
      for(const x of chain(q)){ keep.add(x.id); imgsOf(x).forEach(k => imgShown.add(k)); }
      added.push(`${e.name} ${p.key}: ${q.id}`);
    }
  }
}
const qs = B.QUESTIONS.filter(q => keep.has(q.id)).map(q => { const c = JSON.parse(JSON.stringify(q)); delete c.prof; return c; });
const strip = o => { const c = JSON.parse(JSON.stringify(o)); delete c.prof; return c; };
const lectures = B.COURSE.lectures.map(strip);   // all twelve: the exams' pools name modules 1-9 through them
const topicIds = new Set(qs.map(q => q.topic));
const topics = B.TOPICS.filter(t => topicIds.has(t.id)).map(strip);
const exams = JSON.parse(JSON.stringify(B.COURSE.exams));
const skillIds = new Set(qs.map(q => q.skill));
const skills = B.COURSE.skills.filter(s => skillIds.has(s.id)).map(s => JSON.parse(JSON.stringify(s)));
const images = Object.fromEntries([...imgShown].sort().map(k => [k, IM[k]]));
const fix = {qs, topics, lectures, skills, exams, activeExam: B.COURSE.activeExam, images};
if(NAME.test(JSON.stringify(Object.assign({}, fix, {images: null})))) throw new Error('the fixture names the professor');
fs.writeFileSync(process.argv[2], JSON.stringify(fix));
const skipped = {}; for(const q of B.QUESTIONS){ const r = reasons(q); const k = r.length ? r[0] : chainOut.has(q.id) ? 'dupOf chain leaves the selection' :
  !keep.has(q.id) ? 'image question not needed to fill a pool' : null; if(k) skipped[k] = (skipped[k] || 0) + 1; }
const per = {}; for(const q of qs){ const m = (lecOf(q) || {}).module; per[m] = (per[m] || 0) + 1; }
const fams = {}; for(const e of exams) fams[e.name] = e.pools.map(p => p.key + ' ' + famsIn(e, p) + '/' + p.marks).join(', ');
console.log(JSON.stringify({questions: qs.length, selectAll: qs.filter(q => q.multi).length, withImage: qs.filter(q => imgsOf(q).length).length,
  perModule: per, familiesPerPool: fams, added, topics: topics.map(t => t.id), lectures: lectures.length, skills: skills.map(s => s.id),
  images: Object.keys(images), imageBytes: Object.values(images).reduce((s, v) => s + v.length, 0), skipped, bytes: JSON.stringify(fix).length,
  styleHits: B.QUESTIONS.filter(q => STEM_RE.test(q.stem || '') && !q.type && !q.lowYield).map(q => q.id),
  badWord: B.QUESTIONS.filter(q => BAD_WORD.test(text(q)) && !q.type && !q.lowYield).map(q => q.id)}, null, 1));
