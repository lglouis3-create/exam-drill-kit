// Per PK topic: takeable single-answer/select-all questions (no image / with image) and their image bytes.
const fs = require('fs');
const B = require('./pkload.js');
const IM = JSON.parse(fs.readFileSync(B.SRC + '/images.json', 'utf8'));
const NAME = new RegExp(B.COURSE.professors[0] + '|Dr\\.');
const STEM_RE = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|given as|named as|described as)\b/i;
const FIG_RE = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
const lecOf = q => B.COURSE.lectures.find(l => (q.cite || '').includes(l.deck));
const t = {};
for (const q of B.QUESTIONS) {
  if (q.type || q.lowYield || !lecOf(q)) continue;
  const s = JSON.stringify(Object.assign({}, q, {prof: ''}));
  if (NAME.test(s) || STEM_RE.test(q.stem || '') || FIG_RE.test(q.stem || '')) continue;
  const im = [q.img, q.teachImg].filter(Boolean);
  const r = t[q.topic] = t[q.topic] || {plain: 0, img: 0, bytes: 0, concepts: new Set()};
  if (im.length) { r.img++; r.bytes += im.reduce((n, k) => n + (IM[k] || '').length, 0); } else r.plain++;
  r.concepts.add(q.concept);
}
for (const [k, v] of Object.entries(t)) console.log(k, 'plain', v.plain, 'img', v.img, 'bytes', v.bytes, 'concepts', v.concepts.size);
