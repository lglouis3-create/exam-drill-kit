/* Rewrites the `const PK = ...` line of features/plan-the-problem/current/test.js from
   Basic-Pharmacokinetics at ac2eb73 (read-only clone): the same 10 questions with the
   same fields, each value taken from PK's own QUESTIONS; PK's own TOPICS entries for
   their topics (whole, with cite and subs); ASKS; the plan tables. The one change to the
   data: `prof` (questions and topics) set to "Professor".
   node regen_fixture.js <test.js> <pk src> */
const fs = require('fs'), path = require('path');
const [file, src] = process.argv.slice(2);
const pk = require('./pkload')(src);
const lines = fs.readFileSync(file, 'utf8').split('\n');
const at = lines.findIndex(l => l.startsWith('const PK = '));
const old = JSON.parse(lines[at].slice(11).replace(/;$/, ''));
const PROF = 'Professor';
const qs = old.qs.map(q => {
  const o = pk.QUESTIONS.find(x => x.id === q.id);
  if(!o) throw new Error('not in PK: ' + q.id);
  const out = {};
  for(const k of Object.keys(q)){ if(!(k in o)) throw new Error(q.id + ' has no ' + k + ' in PK'); out[k] = k === 'prof' ? PROF : o[k]; }
  return out;
});
const topics = old.topics.map(t => { const o = pk.TOPICS.find(x => x.id === t.id); if(!o) throw new Error('topic not in PK: ' + t.id); return Object.assign({}, o, {prof: PROF}); });
const routine = [...pk.CALC_ROUTINE_HTML.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
// PK's SU_SAME (views.js 4894-4896: nine groups and the sheet's alsoEq pairs), each group kept to the
// equations the equation-drill fixture holds; a group left with fewer than two lines is dropped
const SU_SAME = [['first-exp', 'first-ln', 'first-log', 'cp-after-stop'], ['fe', 'fe-k'], ['dl-rk', 'dl-css-vd'], ['clh', 'clt-sum', 'clr'],
  ['cl-k-vd', 'thalf-cl-vd'], ['f-abs', 'f-auc'], ['vp-ab', 'vp-auc'], ['cmax-ss', 'cp-ss'], ['css', 'cp-infusing']];
const sheet = fs.readFileSync(path.join(src, 'sheet.js'), 'utf8');
for(const m of sheet.matchAll(/eq: '([^']+)', alsoEq: \[([^\]]*)\]/g)) SU_SAME.push([m[1], ...[...m[2].matchAll(/'([^']+)'/g)].map(x => x[1])]);
const eqt = fs.readFileSync(path.join(path.dirname(file), '..', '..', 'equation-drill', 'current', 'test.js'), 'utf8');
const have = new Set(JSON.parse(eqt.match(/^const FIX = (\[.*\]);$/m)[1]).map(e => e.id));
const same = SU_SAME.map(g => g.filter(id => have.has(id))).filter(g => g.length >= 2);
const plan = {models: pk.PLAN_MODELS, topics: pk.PLAN_TOPIC, also: old.plan.also, units: pk.UNIT_POOL, same, routine};
// the second change: the professor's name inside the worked steps' text, "Dr. Mosley", written "the professor"
let renamed = 0;
const unname = v => typeof v === 'string' ? v.replace(/Dr\. Mosley/g, (m, at, all) => { renamed++; return at === 0 || /[.!?]\s+$/.test(all.slice(0, at)) ? 'The professor' : 'the professor'; })
  : Array.isArray(v) ? v.map(unname) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, unname(x)])) : v;
// for a course of its own (ci/oncourse.js): PK's COURSE.skills entries the questions use, PK's
// COURSE.lectures entries of the questions' own lectures (each question's PK `lecture` field)
const skills = [...new Set(qs.map(q => q.skill))].map(id => { const s = pk.COURSE.skills.find(x => x.id === id); if(!s) throw new Error('skill not in PK: ' + id); return s; });
const lectureOf = Object.fromEntries(old.qs.map(q => [q.id, pk.QUESTIONS.find(x => x.id === q.id).lecture]));
const lectures = [...new Set(Object.values(lectureOf))].map(id => { const l = pk.COURSE.lectures.find(x => x.id === id); if(!l) throw new Error('lecture not in PK: ' + id); return Object.assign({}, l, {prof: PROF}); });
console.log(`skills ${skills.map(s => s.id).join(', ')}; lectures ${lectures.map(l => l.id + ' ' + l.deck).join(', ')}`);
const PK = unname({qs, asks: pk.ASKS, topics, plan, skills, lectures, lectureOf});
console.log('"Dr. Mosley" written "the professor":', renamed);
lines[at] = 'const PK = ' + JSON.stringify(PK) + ';';
fs.writeFileSync(file, lines.join('\n'));
console.log(`rewrote ${file}: ${qs.length} questions, ${topics.length} topics (${topics.map(t => t.subs.length).join('+')} subs), ${Object.keys(pk.ASKS).length} ASKS, ` +
  `${plan.models.length} models, ${plan.units.length} units, ${routine.length} routine steps, SU_SAME ${SU_SAME.length} groups -> ${same.length} kept`);
console.log('personal name left in the line:', /Mosley/.test(lines[at]));
