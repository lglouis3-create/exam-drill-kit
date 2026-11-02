/* chained-problem-sets build step: the course's CHAINS checked against the bank
   before anything is written (Basic-Pharmacokinetics src/test.js section 5c).
   A set needs an id, a name, its vignette line (`setup`) and at least two parts;
   every part is a question in the bank, and no question is in two sets. */
const sets = typeof CHAINS === 'undefined' ? [] : CHAINS;
if(!Array.isArray(sets)) throw new Error('CHAINS must be a list of problem sets');
const ids = new Set(QUESTIONS.map(q => q.id)), owner = {}, setIds = new Set(), errs = [];
sets.forEach((c, k) => {
  if(!c || typeof c.id !== 'string' || !c.id){ errs.push(`problem set ${k + 1} has no id`); return; }
  if(setIds.has(c.id)) errs.push(`two problem sets have the id "${c.id}"`);
  setIds.add(c.id);
  if(!c.name || !c.setup) errs.push(`problem set "${c.id}" has no name or no vignette line (setup)`);
  const parts = Array.isArray(c.parts) ? c.parts : [];
  if(parts.length < 2) errs.push(`problem set "${c.id}" has ${parts.length} part(s); a set asked in parts needs at least two`);
  parts.forEach(id => {
    if(!ids.has(id)) errs.push(`problem set "${c.id}" names ${id}, which is not a question in the bank`);
    if(owner[id]) errs.push(`question ${id} is in both "${owner[id]}" and "${c.id}"`);
    owner[id] = c.id;
  });
});
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {sets: sets.length, parts: Object.keys(owner).length};
