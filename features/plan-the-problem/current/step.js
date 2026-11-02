/* plan-the-problem build step: the set-up data checked against the bank and
   the course's EQUATIONS before anything is written (Basic-Pharmacokinetics
   src/test.js section "the set-up drill", lines 997-1068, at ac2eb73).
   On each numeric question that carries `setup`: its line and the lines used
   before it are equations in EQUATIONS (or the line is 'none'), its reason is
   there, with no HTML tag and no more than 60 words; `asks` is a key of ASKS
   when the course has ASKS; each given is [symbol, value, role], all three
   text. PLAN, when the course has it: `models` a list of [id, name], every
   `topics` value and every `also` model one of those ids, every `also`
   pattern a regex that compiles, `same` a list of lists of equation ids,
   `units` and `routine` lists of text. At least one stem is in the drill. */
if(typeof EQUATIONS === 'undefined' || !Array.isArray(EQUATIONS))
  throw new Error('plan-the-problem reads EQUATIONS (equation-drill): put the equations in a data file listed in course.js `files`');
const E = new Set(EQUATIONS.map(e => e.id)), errs = [];
const asks = typeof ASKS === 'undefined' ? null : ASKS;
const plan = typeof PLAN === 'undefined' ? null : PLAN;
const str = x => typeof x === 'string' && x.trim() !== '';
let stems = 0;
for(const q of QUESTIONS){
  const s = q.setup;
  if(s === undefined) continue;
  if(!s || typeof s !== 'object'){ errs.push(`${q.id}: setup is not {eq, pre, why}`); continue; }
  if(q.type !== 'numeric') errs.push(`${q.id}: setup on a question that is not numeric`);
  if(s.eq !== 'none' && !E.has(s.eq)) errs.push(`${q.id}: setup names the equation "${s.eq}", which is not in EQUATIONS`);
  for(const p of (s.pre || [])) if(!E.has(p)) errs.push(`${q.id}: setup.pre names "${p}", which is not in EQUATIONS`);
  if(!str(s.why)) errs.push(`${q.id}: setup has no reason (why)`);
  else {
    if(s.why.split(/\s+/).filter(Boolean).length > 60) errs.push(`${q.id}: setup.why runs past 60 words`);
    if(/<[a-z]/i.test(s.why)) errs.push(`${q.id}: setup.why carries an HTML tag`);
  }
  if(q.asks !== undefined && asks && !asks[q.asks]) errs.push(`${q.id}: asks "${q.asks}" is not a key of ASKS`);
  if(q.givens !== undefined){
    if(!Array.isArray(q.givens)) errs.push(`${q.id}: givens is not a list`);
    else q.givens.forEach((g, i) => { if(!Array.isArray(g) || g.length !== 3 || !g.every(str)) errs.push(`${q.id}: given ${i + 1} is not [symbol, value, role]`); });
  }
  if(s.eq !== 'none' && E.has(s.eq)) stems++;
}
if(asks !== null){
  if(typeof asks !== 'object' || Array.isArray(asks)) errs.push('ASKS is not {key: [symbol, meaning]}');
  else for(const [k, v] of Object.entries(asks)) if(!Array.isArray(v) || v.length !== 2 || !v.every(str)) errs.push(`ASKS.${k} is not [symbol, meaning]`);
}
if(plan !== null){
  const models = Array.isArray(plan.models) ? plan.models : [];
  if(plan.models !== undefined && (!models.length || !models.every(m => Array.isArray(m) && m.length === 2 && m.every(str)))) errs.push('PLAN.models is not a list of [id, name]');
  const ids = new Set(models.map(m => m[0]));
  for(const [t, m] of Object.entries(plan.topics || {})) if(!ids.has(m)) errs.push(`PLAN.topics.${t} names the model "${m}", which PLAN.models does not have`);
  (plan.also || []).forEach((r, i) => {
    if(!Array.isArray(r) || r.length !== 3 || !Array.isArray(r[0])){ errs.push(`PLAN.also ${i + 1} is not [[model ids], pattern, model id]`); return; }
    for(const m of r[0].concat([r[2]])) if(!ids.has(m)) errs.push(`PLAN.also ${i + 1} names the model "${m}", which PLAN.models does not have`);
    try { new RegExp(r[1], 'i'); } catch(e) { errs.push(`PLAN.also ${i + 1}: the pattern does not compile`); }
  });
  (plan.same || []).forEach((g, i) => { if(!Array.isArray(g)) errs.push(`PLAN.same ${i + 1} is not a list`); else for(const id of g) if(!E.has(id)) errs.push(`PLAN.same ${i + 1} names "${id}", which is not in EQUATIONS`); });
  for(const f of ['units', 'routine']) if(plan[f] !== undefined && (!Array.isArray(plan[f]) || !plan[f].every(str))) errs.push(`PLAN.${f} is not a list of text`);
}
if(!errs.length && !stems) errs.push('no numeric question carries a setup line from EQUATIONS, so the set-up drill would have nothing to ask');
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {stems, plan: !!(plan && Array.isArray(plan.models) && plan.models.length), asks: !!asks};
