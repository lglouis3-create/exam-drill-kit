/* equation-drill build step: the course's EQUATIONS checked before anything is
   written. Each equation needs a unique id, a name, a left side, its pieces
   (tokens) and the form a typed answer is compared with (typed); the module's
   test holds the rest (the pieces build what `typed` keys, the lures, the
   stacked display). */
if(typeof EQUATIONS === 'undefined' || !Array.isArray(EQUATIONS))
  throw new Error('EQUATIONS is not declared: put the equations in a data file listed in course.js `files`');
const seen = new Set(), errs = [];
EQUATIONS.forEach((e, k) => {
  if(!e || typeof e.id !== 'string' || !e.id){ errs.push(`equation ${k + 1} has no id`); return; }
  if(seen.has(e.id)) errs.push(`two equations have the id "${e.id}"`);
  seen.add(e.id);
  for(const f of ['name', 'lhs', 'typed']) if(!e[f]) errs.push(`equation "${e.id}" has no ${f}`);
  if(!Array.isArray(e.tokens) || !e.tokens.length) errs.push(`equation "${e.id}" has no pieces (tokens) to build it from`);
});
if(!EQUATIONS.length) errs.push('EQUATIONS is empty');
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {equations: EQUATIONS.length, must: EQUATIONS.filter(e => e.must).length};
