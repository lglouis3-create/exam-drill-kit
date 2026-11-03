/* glossary-tap build step: the course's TERMS checked before anything is
   written. TERMS is a list; each term has an id (unique), a name (`term`), a
   group, a definition (`def`) and a source (`cite`), all text; `gist`, `scene`
   and `hook`, when present, are text; `lecture`, when present, is an id in
   COURSE.lectures; `fig`, when present, is a key of diagrams.js DIA. No two
   terms are found by the same name in text (the name without a closing
   bracket, so "Pharmacodynamics (PD)" is found as "Pharmacodynamics"), since a
   tap could not tell which one is meant. Every id in the option `notTapped` is
   a term. */
if(typeof TERMS === 'undefined' || !Array.isArray(TERMS))
  throw new Error('glossary-tap reads TERMS: put the terms in a data file listed in course.js `files`');
if(!TERMS.length) throw new Error('TERMS is empty, so the Glossary tab would have nothing to show');
const str = x => typeof x === 'string' && x.trim() !== '';
const lecs = new Set((COURSE.lectures || []).map(l => l.id));
const dia = typeof DIA === 'undefined' ? {} : DIA;
const ids = new Set(), names = {}, errs = [];
TERMS.forEach((t, i) => {
  const who = t && str(t.id) ? t.id : `term ${i + 1}`;
  if(!t || typeof t !== 'object'){ errs.push(`${who} is not an object`); return; }
  if(!str(t.id)) errs.push(`${who} has no id`);
  else if(ids.has(t.id)) errs.push(`${t.id}: the id is used twice`);
  else ids.add(t.id);
  for(const f of ['term', 'group', 'def', 'cite']) if(!str(t[f])) errs.push(`${who} has no ${f}`);
  for(const f of ['gist', 'scene', 'hook']) if(t[f] !== undefined && typeof t[f] !== 'string') errs.push(`${who}: ${f} is not text`);
  if(t.lecture !== undefined && !lecs.has(t.lecture)) errs.push(`${who}: lecture "${t.lecture}" is not an id in COURSE.lectures`);
  if(t.fig !== undefined && !dia[t.fig]) errs.push(`${who}: fig "${t.fig}" is not a figure in diagrams.js DIA`);
  if(str(t.term)){
    const n = t.term.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase().replace(/\s+/g, ' ');
    if(names[n]) errs.push(`${who} and ${names[n]} are both found by the name "${n}"`);
    else names[n] = who;
  }
});
for(const id of (OPT.notTapped || [])) if(!ids.has(id)) errs.push(`option notTapped names "${id}", which is not a term in TERMS`);
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {terms: TERMS.length, groups: [...new Set(TERMS.map(t => t.group))].length};
