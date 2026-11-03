// The PK questions of one topic: id, type, dupOf, image, and the lecture its cite names.
const B = require('./pkload.js');
const topic = process.argv[2];
const lecOf = q => B.COURSE.lectures.find(l => (q.cite || '').includes(l.deck));
for (const q of B.QUESTIONS.filter(q => q.topic === topic))
  console.log(q.id, q.type || '-', 'dup:' + (q.dupOf || ''), 'img:' + ([q.img, q.teachImg].filter(Boolean).join(',')), 'lec:' + ((lecOf(q) || {}).id), 'low:' + !!q.lowYield, 'multi:' + !!q.multi, 'concept:' + q.concept);
