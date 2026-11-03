// Rework of mkfixture.js (evidence/paper-picker) to Louis's policy of 2026-11-03.
// Build the paper-picker test fixture from Basic-Pharmacokinetics at ac2eb73 (read-only copy), with nothing invented.
//   node mkfixture2.js <out.json> [exclude.json]
// Taken verbatim: COURSE.exams, COURSE.activeExam, COURSE.lectures (all twelve), COURSE.professors, the COURSE.skills
// and TOPICS entries the selected questions use, the selected questions, and the images.json entries they show.
// Every field is kept as the course has it, `prof` included (the policy of 2026-11-03: real names are kept).
// Which questions (the rule chooses; it never changes a question):
//   - scope: no `type` (single-answer or select-all: these exams have no `typed`, so a paper carries only these),
//     and not `lowYield` (never on a paper);
//   - every such question is taken unless exclude.json names it (a question kept out because a core check fails
//     on it, with its reproduction in the evidence), and only with its whole dupOf chain;
//   - a question with an image is taken when it has one of the properties the first selection (mkfixture.js)
//     used to leave it out (names the professor, a stem the stem rule flags, a stem promising a figure without
//     one, a cite naming no deck, fewer than 3 options, the word undefined/null/NaN), or while a pool of any of
//     the three exams has fewer question families than its marks, smallest image first. Other image questions
//     are left out for size only (the fixture is committed in the kit), except those the earlier fixture
//     (PREV_FIXTURE, the branch's test_fixture.js at b283f2f) already held, which are all kept.
const fs = require('fs');
const B = require('./pkload.js');
const IM = JSON.parse(fs.readFileSync(B.SRC + '/images.json', 'utf8'));
const {stemFlag} = require(process.env.KIT_CORE + '/style_rules.js');
const EX = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
const byId = Object.fromEntries(B.QUESTIONS.map(q => [q.id, q]));
const NAME = new RegExp(B.COURSE.professors.join('|') + '|Dr\\.');
const FIG_RE = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
const BAD_WORD = /\b(undefined|null|NaN|\[object Object\])\b/;
const decks = B.COURSE.lectures.map(l => l.deck);
const text = q => JSON.stringify(Object.assign({}, q, {prof: ''}));
const imgsOf = q => [q.img, q.teachImg].filter(Boolean);
// the stem rule of the first selection (core style_check.js before kit PR #31), used only to find what it left out
const OLD_STEM_RE = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|given as|named as|described as)\b/i;
const PREV = new Set(process.env.PREV_FIXTURE ? require(process.env.PREV_FIXTURE).PK.qs.map(q => q.id) : []);
const props = q => [NAME.test(text(q)) && 'names the professor', stemFlag(q.stem) && 'stem flagged: ' + stemFlag(q.stem),
  !stemFlag(q.stem) && OLD_STEM_RE.test(q.stem || '') && 'stem flagged before PR #31 only',
  FIG_RE.test(q.stem || '') && !q.img && 'stem promises a figure, none', !decks.some(d => (q.cite || '').includes(d)) && 'cite names no deck',
  (q.options || []).length < 3 && 'fewer than 3 options', q.multi && (q.options || []).length < 4 && 'select-all, fewer than 4 options',
  q.multi && (q.options || []).every(o => o.correct) && 'select-all, no distractor', BAD_WORD.test(text(q)) && 'word undefined/null/NaN',
  imgsOf(q).some(k => !IM[k]) && 'image not in images.json'].filter(Boolean);
const scope = q => !q.type && !q.lowYield;
const can = new Set(B.QUESTIONS.filter(q => scope(q) && !EX[q.id]).map(q => q.id));
const chainOut = new Map();
for(let changed = true; changed;){ changed = false;
  for(const id of [...can]){ const q = byId[id]; if(q.dupOf && !can.has(q.dupOf)){ can.delete(id); chainOut.set(id, q.dupOf); changed = true; } } }
const chain = q => { const out = [q]; let r = q; const seen = new Set(); while(r.dupOf && !seen.has(r.id)){ seen.add(r.id); r = byId[r.dupOf]; out.push(r); } return out; };
const family = q => { const c = chain(q); return c[c.length - 1].id; };
const lecOf = q => B.COURSE.lectures.find(l => (q.cite || '').includes(l.deck));
const field = (q, k) => (k === 'exam' || k === 'module') ? (lecOf(q) || {})[k] : q[k];
const inPool = (q, p) => Object.entries(p.filter).every(([k, v]) => Array.isArray(v) ? v.includes(field(q, k)) : field(q, k) === v);
const keep = new Set([...can].filter(id => !imgsOf(byId[id]).length || props(byId[id]).length || PREV.has(id)));
for(const id of [...keep]) chain(byId[id]).forEach(x => keep.add(x.id));   // the targets are in `can` (chainOut removed the rest)
const poolOf = (e, q) => e.pools.find(x => inPool(q, x));
const famsIn = (e, p) => { const s = new Set(); for(const id of keep){ const q = byId[id]; if(poolOf(e, q) === p) s.add(family(q)); } return s.size; };
const imgShown = new Set(); for(const id of keep) imgsOf(byId[id]).forEach(k => imgShown.add(k));
const cost = q => [...new Set(chain(q).flatMap(imgsOf))].filter(k => !imgShown.has(k)).reduce((s, k) => s + IM[k].length, 0);
const added = [], short = [];
const order = [B.COURSE.activeExam, ...B.COURSE.exams.map(e => e.id).filter(id => id !== B.COURSE.activeExam).sort((a, b) => b - a)];
for(const eid of order){ const e = B.COURSE.exams.find(x => x.id === eid);
  for(const p of e.pools){
    while(famsIn(e, p) < p.marks){
      const have = new Set([...keep].filter(id => poolOf(e, byId[id]) === p).map(id => family(byId[id])));
      const cands = [...can].map(id => byId[id]).filter(q => !keep.has(q.id) && poolOf(e, q) === p && !have.has(family(q)));
      if(!cands.length){ short.push(`${e.name} ${p.key}: ${famsIn(e, p)} of ${p.marks} families`); break; }
      cands.sort((a, b) => cost(a) - cost(b) || B.QUESTIONS.indexOf(a) - B.QUESTIONS.indexOf(b));
      const q = cands[0];
      for(const x of chain(q)){ keep.add(x.id); imgsOf(x).forEach(k => imgShown.add(k)); }
      added.push(`${e.name} ${p.key}: ${q.id}`);
    }
  }
}
const cp = o => JSON.parse(JSON.stringify(o));
const qs = B.QUESTIONS.filter(q => keep.has(q.id)).map(cp);
const topicIds = new Set(qs.map(q => q.topic));
const skillIds = new Set(qs.map(q => q.skill));
const images = Object.fromEntries([...imgShown].sort().map(k => [k, IM[k]]));
const fix = {qs, topics: B.TOPICS.filter(t => topicIds.has(t.id)).map(cp), lectures: B.COURSE.lectures.map(cp),
  professors: cp(B.COURSE.professors), skills: B.COURSE.skills.filter(s => skillIds.has(s.id)).map(cp),
  exams: cp(B.COURSE.exams), activeExam: B.COURSE.activeExam, images};
fs.writeFileSync(process.argv[2], JSON.stringify(fix));
// report: every question of the bank not taken, with why
const why = q => !scope(q) ? (q.type ? 'scope: has a type (' + q.type + ')' : 'scope: lowYield') : EX[q.id] ? 'excluded: ' + EX[q.id] :
  chainOut.has(q.id) ? 'dupOf target ' + chainOut.get(q.id) + ' not taken' : !keep.has(q.id) ? 'size: image question not needed to fill a pool' : null;
const skipped = {}, notTaken = [];
for(const q of B.QUESTIONS){ const k = why(q); if(!k) continue; const kk = k.replace(/\(.*\)|: .*$/, '').trim(); skipped[kk] = (skipped[kk] || 0) + 1;
  if(!/^scope|^size/.test(k)) notTaken.push(q.id + ' — ' + k); }
const fams = {}; for(const e of fix.exams) fams[e.name] = e.pools.map(p => p.key + ' ' + famsIn(e, p) + '/' + p.marks).join(', ');
const putBack = qs.filter(q => props(q).length).map(q => q.id + ' (' + props(q).join('; ') + ')');
console.log(JSON.stringify({questions: qs.length, selectAll: qs.filter(q => q.multi).length, withImage: qs.filter(q => imgsOf(q).length).length,
  familiesPerPool: fams, short, added, topics: fix.topics.map(t => t.id), skills: fix.skills.map(s => s.id), images: Object.keys(images).length,
  imageBytes: Object.values(images).reduce((s, v) => s + v.length, 0), bytes: JSON.stringify(fix).length, skipped, notTaken,
  takenWithAFormerReason: putBack.length, putBack, prevKept: [...PREV].every(id => keep.has(id)), prevCount: PREV.size}, null, 1));
