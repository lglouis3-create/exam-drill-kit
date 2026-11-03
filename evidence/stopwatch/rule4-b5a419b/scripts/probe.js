// Count Basic-Pharmacokinetics' single-answer and select-all questions per Exam 3 pool group, and why some cannot be taken.
const B = require('./pkload.js');
const lecOf = q => B.COURSE.lectures.find(l => (q.cite || '').includes(l.deck));
const NAME = new RegExp(B.COURSE.professors[0] + '|Dr\\.');
const STEM_RE = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|given as|named as|described as)\b/i;
const FIG_RE = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
const c = {};
for (const q of B.QUESTIONS) {
  if (q.type || q.lowYield) continue;
  const l = lecOf(q); if (!l) continue;
  const k = l.exam === 1 ? 'e1' : l.exam === 2 ? 'e2' : 'm' + l.module;
  c[k] = c[k] || {all: 0, img: 0, name: 0, stem: 0, fig: 0, ok: 0, okMulti: 0, imgOk: 0};
  c[k].all++;
  const t = JSON.stringify(Object.assign({}, q, {prof: ''}));
  const other = NAME.test(t) ? 'name' : STEM_RE.test(q.stem || '') ? 'stem' : (FIG_RE.test(q.stem || '') && !q.img) ? 'fig' : null;
  if (q.img || q.teachImg) { c[k].img++; if (!other) c[k].imgOk++; }
  else if (other) c[k][other]++;
  else { c[k].ok++; if (q.multi) c[k].okMulti++; }
}
console.log(c);
