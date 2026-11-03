// Build the stopwatch test fixture from Basic-Pharmacokinetics at ac2eb73 (read-only copy), with nothing invented.
//   node mkfixture.js <out.json>
// Loader: pkload.js (copied from evidence/paper-picker/scripts/pkload.js: the course's build order, src/build.py).
//
// Taken verbatim from the course:
//   exam        src/course.js `exams`, the entry with id 3 (Exam 3 (final)), the course's activeExam, every field
//   activeExam  src/course.js `activeExam` (3)
//   calc        the numeric questions of the professor's Canvas Quiz 4 (src/q13_quizzes.js, ids cq4-*), the quiz
//               whose `said` line (src/course.js line 264) gives the pace: "A few calculations, each meant to take
//               2 minutes or less"
//   qs          single-answer and select-all questions (src/q*.js) that fill Exam 3's pools, chosen by the rule below
//   topics      the TOPICS entries the questions name
//   lectures    the COURSE.lectures entries whose deck the questions' cites name
//   skills      the COURSE.skills entries the questions use
// The one change to the data: `prof` is left out here; ci/oncourse.js and the test write the template's
// "Professor" into every question, topic and lecture, so no personal name is in the kit.
//
// Which questions (the rule only chooses; no question is changed). A question can be taken when it
//   - is not lowYield, and each image it shows (img, teachImg) is in the course's src/images.json,
//   - does not name the professor anywhere in its text (her name, or "Dr."),
//   - passes the core's rules for a question (each copied below from the kit core at tree a2dbf03),
//   - and every question up its dupOf chain can be taken too.
// Calculations: every Quiz 4 numeric question that can be taken. Exam 3's pools (single-answer and select-all,
// because Exam 3 has no `typed`): for each pool, questions are added (with their dupOf chain) until the pool
// holds its marks plus 1 question families, and at least its share of select-all families plus 1 (the core's
// drawPaper share: round(sata x marks / total), the largest pool the rest). Questions without an image come
// first, in the course's own order; a question with an image only while the pool is still short, smallest
// image first; the images.json entries those questions show are taken with them.
const fs = require('fs');
const B = require('./pkload.js');
const IM = JSON.parse(fs.readFileSync(B.SRC + '/images.json', 'utf8'));
const imgsOf = q => [q.img, q.teachImg].filter(Boolean);
const byId = Object.fromEntries(B.QUESTIONS.map(q => [q.id, q]));
const EX = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
const PREV = new Set(process.env.PREV_FIXTURE ? require(process.env.PREV_FIXTURE).FIX.qs.map(q => q.id) : []);
const STEM_RE = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|given as|named as|described as)\b/i; // core/style_check.js line 34
const FIG_RE = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;  // core/browser_test.js line 376
const BAD_WORD = /\b(undefined|null|NaN|\[object Object\])\b/;                       // core/browser_test.js line 197
const STEP_KINDS = ['setup', 'unit', 'algebra', 'round'];                            // core/test.js line 65
const lecOf = q => B.COURSE.lectures.find(l => (q.cite || '').includes(l.deck));
const text = q => JSON.stringify(Object.assign({}, q, {prof: ''}));
// Rework (policy of 2026-11-03): only scope reasons choose here (lowYield, an image missing from images.json, a
// type other than numeric); a question a core check refuses is named in exclude.json with its reproduction.
const reasons = q => [q.lowYield && 'lowYield', imgsOf(q).some(k => !IM[k]) && 'its image is not in images.json',
  EX[q.id] && 'excluded: ' + EX[q.id], q.type && q.type !== 'numeric' && 'type ' + q.type].filter(Boolean);
const chain = q => { const out = [q]; let r = q; const seen = new Set(); while(r.dupOf && !seen.has(r.id)){ seen.add(r.id); r = byId[r.dupOf]; if(!r) return null; out.push(r); } return out; };
const takeable = q => !reasons(q).length && (chain(q) || [null]).every(x => x && !reasons(x).length);
const family = q => { const c = chain(q); return c[c.length - 1].id; };

const exam = JSON.parse(JSON.stringify(B.COURSE.exams.find(e => e.id === B.COURSE.activeExam)));
const field = (q, k) => (k === 'exam' || k === 'module') ? (lecOf(q) || {})[k] : q[k];
const inPool = (q, p) => Object.entries(p.filter).every(([k, v]) => Array.isArray(v) ? v.includes(field(q, k)) : field(q, k) === v);
const poolOf = q => exam.pools.find(p => inPool(q, p));
const total = exam.pools.reduce((n, p) => n + p.marks, 0);
const main = exam.pools.reduce((a, b) => b.marks > a.marks ? b : a, exam.pools[0]);
const share = {}; let left = exam.sata;
exam.pools.filter(p => p !== main).forEach(p => { share[p.key] = Math.round(exam.sata * p.marks / total); left -= share[p.key]; });
share[main.key] = Math.max(0, left);

const calc = B.QUESTIONS.filter(q => /^cq4-/.test(q.id) && q.type === 'numeric');
const calcOut = calc.filter(q => !takeable(q)).map(q => q.id + ': ' + reasons(q).join(', '));
const keep = new Set(calc.filter(takeable).map(q => q.id)), shown = new Set();
calc.filter(takeable).forEach(q => imgsOf(q).forEach(k => shown.add(k)));
const added = {};
for(const p of exam.pools){
  const fams = () => new Set([...keep].map(id => byId[id]).filter(q => !q.type && poolOf(q) === p).map(family));
  const multiFams = () => new Set([...keep].map(id => byId[id]).filter(q => !q.type && q.multi && poolOf(q) === p).map(family));
  added[p.key] = [];
  const cost = q => [...new Set(chain(q).flatMap(imgsOf))].filter(k => !shown.has(k)).reduce((n, k) => n + IM[k].length, 0);
  const order = () => B.QUESTIONS.filter(q => !q.type && !keep.has(q.id) && poolOf(q) === p && takeable(q))
    .sort((a, b) => (cost(a) > 0) - (cost(b) > 0) || (cost(a) > 0 ? cost(a) - cost(b) : 0) || B.QUESTIONS.indexOf(a) - B.QUESTIONS.indexOf(b));
  let tookImage = false;
  for(let more = true; more;){
    more = false;
    const needFam = fams().size < p.marks + 1, needMulti = multiFams().size < share[p.key] + 1;
    if(!needFam && !needMulti) break;
    const q = order().find(q => !fams().has(family(q)) && (needFam || q.multi));
    if(!q) break;
    if(cost(q) > 0) tookImage = true;
    chain(q).forEach(x => { keep.add(x.id); imgsOf(x).forEach(k => shown.add(k)); }); added[p.key].push(q.id); more = true;
  }
  // then every other question of this pool that can be taken and shows no image beyond those already taken
  if(tookImage) for(const q of B.QUESTIONS) if(!q.type && !keep.has(q.id) && poolOf(q) === p && takeable(q) && cost(q) === 0){ chain(q).forEach(x => keep.add(x.id)); added[p.key].push(q.id); }
  if(fams().size < p.marks + 1 || multiFams().size < share[p.key] + 1) throw new Error(`pool ${p.key}: cannot be filled (${fams().size} families, ${multiFams().size} select-all)`);
}
// then every question of the earlier fixture (kept: the rework adds questions only)
for(const id of PREV){ if(!takeable(byId[id])) throw new Error('earlier fixture question ' + id + ' cannot be taken: ' + reasons(byId[id])); chain(byId[id]).forEach(x => { keep.add(x.id); imgsOf(x).forEach(k => shown.add(k)); }); }
const strip = o => JSON.parse(JSON.stringify(o));
const all = B.QUESTIONS.filter(q => keep.has(q.id));
const qs = all.map(strip);
const topicIds = new Set(qs.map(q => q.topic));
const topics = B.TOPICS.filter(t => topicIds.has(t.id)).map(strip);
const lectures = B.COURSE.lectures.filter(l => all.some(q => (q.cite || '').includes(l.deck))).map(strip);
const skillIds = new Set(qs.map(q => q.skill));
const skills = B.COURSE.skills.filter(s => skillIds.has(s.id)).map(s => JSON.parse(JSON.stringify(s)));
const images = Object.fromEntries([...shown].sort().map(k => [k, IM[k]]));
const fix = {source: 'Basic-Pharmacokinetics ac2eb73', professors: JSON.parse(JSON.stringify(B.COURSE.professors)), exam, activeExam: B.COURSE.activeExam, calc: calc.filter(takeable).map(q => q.id), qs, topics, lectures, skills, images};
const flat = JSON.stringify(fix);
fs.writeFileSync(process.argv[2], flat);
const per = {}; for(const q of all.filter(q => !q.type)){ const k = (poolOf(q) || {key: "no pool"}).key; per[k] = per[k] || {q: 0, multi: 0, fams: new Set()}; per[k].q++; if(q.multi) per[k].multi++; per[k].fams.add(family(q)); }
console.log(JSON.stringify({questions: qs.length, calc: fix.calc, calcLeftOut: calcOut, perPool: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, {questions: v.q, selectAll: v.multi, families: v.fams.size, marks: (exam.pools.find(p => p.key === k) || {}).marks, sataShare: share[k]}])),
  added, topics: topics.map(t => t.id), lectures: lectures.map(l => l.id), skills: skills.map(s => s.id), bytes: flat.length, images: Object.keys(images), imageBytes: Object.values(images).reduce((n, v) => n + v.length, 0),
  withImage: qs.filter(q => imgsOf(q).length).map(q => q.id),
  newIds: qs.map(q => q.id).filter(id => !PREV.has(id)), stemsWithGivenAs: B.QUESTIONS.filter(q => keep.has(q.id) && /given as/i.test(q.stem || '')).map(q => q.id)}, null, 1));
