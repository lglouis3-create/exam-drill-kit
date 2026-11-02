/* paper-picker build step: which exams in course.js a paper can be drawn for
   through the engine's own draw. The X.paper hook returns as many questions as
   the engine drew, and the engine's clock and the way it shows typed items
   follow the course's current exam (activeExam), so an exam is offered only
   when it has the current exam's question count, time limit and `typed`
   setting, no `blueprint` (counts per topic), and pools whose marks are all
   set. Every other exam is left off the chips, with the reason, which the page
   shows. A paper of another length or clock needs several exams on one site in
   the core (review/port-queue.md, "Core changes found by the assessments").
   The build stops only when an exam has no id or two exams share one, since a
   choice is kept by the exam's id. */
const errs = [];
const exams = Array.isArray(COURSE.exams) ? COURSE.exams : [];
const ids = exams.map(e => e && e.id);
if(ids.some(id => id === undefined || id === null || id === '')) errs.push('an exam in course.js `exams` has no id, and a chosen paper is kept by its id');
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if(dup.length) errs.push(`two exams in course.js \`exams\` share the id ${JSON.stringify(dup[0])}, and a chosen paper is kept by its id`);
if(errs.length) throw new Error(errs.join('; '));
const cur = exams.find(e => e.id === COURSE.activeExam) || exams[0];
const val = a => (a === undefined ? null : a);
const offer = [], left = [];
for(const e of exams){
  if(!e || e === cur) continue;
  const why = [];
  const count = x => val(x) === null ? 'no question count set' : `${x} questions`;
  const clock = x => val(x) === null ? 'no time limit set' : `${x} minutes`;
  if(val(e.questions) !== val(cur.questions)) why.push(`${count(e.questions)}, and the current exam has ${count(cur.questions)}`);
  if(val(e.minutes) !== val(cur.minutes)) why.push(`${clock(e.minutes)}, and the current exam has ${clock(cur.minutes)}`);
  if(!!e.typed !== !!cur.typed) why.push(e.typed ? 'calculations on its papers (typed), and the current exam has none' : 'no calculations on its papers, and the current exam has them (typed)');
  if(e.blueprint) why.push('counts per topic (blueprint)');
  const pools = Array.isArray(e.pools) ? e.pools : [];
  if(!pools.length) why.push('no pools');
  else if(pools.some(p => typeof p.marks !== 'number' || !p.filter || typeof p.filter !== 'object')) why.push('a pool without marks or a filter');
  if(why.length) left.push([e.id, why.join('; ')]);
  else offer.push(e.id);
}
STEP = {current: cur ? cur.id : null, offer, left};
