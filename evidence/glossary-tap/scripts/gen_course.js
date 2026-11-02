/* Builds FIXCOURSE for the glossary-tap CI course from Intro to Pharmacology 929cd62 (read-only clone):
   node gen_course.js <outJson> <qid,...>
   lectures L01 and L02 and the course's skills (course.js), topics L02 and TERMS (q_L02.js, q_TERMS.js),
   and the named questions (L02* = every L02 question with no fg, graph, img or dupOf) with fg, reading and dupOf left out. Nothing else is changed here. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = '/tmp/ip-readonly/exam1-drill/src';
const [OUT, IDS] = process.argv.slice(2);
const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(D, 'course.js'), 'utf8') + ';this.C = COURSE', c);
const C = c.C, Q = [], T = [];
for(const f of ['q_L02.js', 'q_L04.js', 'q_L10.js', 'q_TERMS.js']){
  const d = {QUESTIONS: [], TOPICS: [], COURSE: C}; vm.createContext(d);
  vm.runInContext(fs.readFileSync(path.join(D, f), 'utf8') + ';this.Q = QUESTIONS; this.T = TOPICS', d);
  Q.push(...d.Q); T.push(...d.T);
}
const drop = new Set(['fg', 'reading', 'dupOf']);
const ids = IDS.split(',').flatMap(x => /^L\d\d\*$/.test(x) ? Q.filter(q => q.topic === x.slice(0, 3) && !q.fg && !q.graph && !q.img && !q.dupOf).map(q => q.id) : [x]);
/* left out: questions the kit's own bank checks reject (test.js: fewer than 3 options, a cite naming no
   lecture deck; style_check.js: a phrasing issue), listed by id */
const LEFT = {'L04-048': 'only 2 options', 'L04-008': 'cites no lecture deck', 'L02-010': 'only 2 options', 'L02-046': 'only 2 options', 'L02-047': 'only 2 options',
  'L02-001': 'cites no lecture deck', 'L02-049': 'cites no lecture deck',
  'L02-007': 'style_check: metaphor', 'L02-057': 'style_check: metaphor',
  'L10-042': 'style_check: study meta-commentary', 'L10-051': 'style_check: study meta-commentary'};
const qs = ids.filter(id => !LEFT[id]).map(id => { const q = Q.find(x => x.id === id); if(!q) throw new Error('no question ' + id);
  return Object.fromEntries(Object.entries(q).filter(([k]) => !drop.has(k))); });
const out = {lectures: C.lectures.filter(l => ['L04', 'L10'].includes(l.id)), skills: C.skills,
  topics: ['L04', 'L10'].map(id => T.find(t => t.id === id)), qs};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('lectures', out.lectures.length, 'topics', out.topics.map(t => t.id + ' (' + t.subs.length + ' subs)').join(', '), 'questions', qs.length);
