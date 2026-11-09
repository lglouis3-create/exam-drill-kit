/* field-colours build step: the option `fields` checked before anything is written.
   Each entry is [field, light colour, dark colour]: a field name of letters, digits,
   "_" or "-" (it goes into a CSS selector), and two colours as #rgb or #rrggbb. The
   step does not read any module's data: which fields exist is the business of the
   modules that mark their headings. */
const F = OPT.fields, errs = [], COL = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, seen = new Set();
if(!Array.isArray(F)) errs.push('option fields must be a list of [field, light colour, dark colour]');
else F.forEach((e, k) => {
  if(!Array.isArray(e) || e.length !== 3 || e.some(x => typeof x !== 'string')){ errs.push(`option fields entry ${k + 1} must be [field, light colour, dark colour]`); return; }
  if(!/^[A-Za-z0-9_-]+$/.test(e[0])) errs.push(`option fields entry ${k + 1}: the field "${e[0]}" must be letters, digits, "_" or "-"`);
  if(seen.has(e[0])) errs.push(`option fields names the field "${e[0]}" twice`);
  seen.add(e[0]);
  [1, 2].forEach(j => { if(!COL.test(e[j])) errs.push(`option fields entry ${k + 1}: "${e[j]}" is not a colour as #rgb or #rrggbb`); });
});
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {fields: F.length};
