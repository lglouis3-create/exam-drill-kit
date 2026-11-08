/* drug-list-tab build step: the course's DRUG_TABLES and the module's options
   checked before anything is written. A table needs an id (unique) and its
   rows; every column, searched field and the detail field is a field some row
   has; a group names only tables that exist; the group the tab opens on is one
   of the groups; images are given for every table or for none. */
if(typeof DRUG_TABLES === 'undefined' || !Array.isArray(DRUG_TABLES))
  throw new Error('DRUG_TABLES is not declared: put the tables in a data file listed in course.js `files`');
const errs = [], ids = new Set(), fields = new Set();
if(!DRUG_TABLES.length) errs.push('DRUG_TABLES is empty');
DRUG_TABLES.forEach((t, k) => {
  if(!t || (typeof t.id !== 'string' && typeof t.id !== 'number') || t.id === ''){ errs.push(`table ${k + 1} has no id`); return; }
  const id = String(t.id);
  if(ids.has(id)) errs.push(`two tables have the id "${id}"`);
  ids.add(id);
  if(!t.title) errs.push(`table "${id}" has no title`);
  if(!Array.isArray(t.rows) || !t.rows.length){ errs.push(`table "${id}" has no rows`); return; }
  t.rows.forEach((r, i) => {
    if(!r || typeof r !== 'object' || Array.isArray(r)) errs.push(`table "${id}" row ${i + 1} is not an object of fields`);
    else Object.keys(r).forEach(f => fields.add(f));
  });
});
const withImg = DRUG_TABLES.filter(t => t && typeof t.image === 'string' && t.image).map(t => String(t.id));
if(withImg.length && withImg.length < DRUG_TABLES.length)
  errs.push(`${withImg.length} of ${DRUG_TABLES.length} tables give an image: give every table an image, or none`);
const known = f => typeof f === 'string' && fields.has(f);
const cols = OPT.columns;
if(!Array.isArray(cols) || !cols.length) errs.push('option columns must list at least one [field, heading]');
else cols.forEach((c, k) => {
  if(!Array.isArray(c) || (c.length !== 2 && c.length !== 4) || c.some(x => typeof x !== 'string')){ errs.push(`option columns entry ${k + 1} must be [field, heading] or [field, heading, sub-field, sub-label]`); return; }
  if(!known(c[0])) errs.push(`option columns names the field "${c[0]}", which no row has`);
  if(c.length === 4 && !known(c[2])) errs.push(`option columns names the sub-field "${c[2]}", which no row has`);
});
if(!Array.isArray(OPT.searchFields) || !OPT.searchFields.length) errs.push('option searchFields must list at least one field');
else OPT.searchFields.forEach(f => { if(!known(f)) errs.push(`option searchFields names the field "${f}", which no row has`); });
if(!known(OPT.detailField)) errs.push(`option detailField names the field "${OPT.detailField}", which no row has`);
if(OPT.detailOwnField && !known(OPT.detailOwnField)) errs.push(`option detailOwnField names the field "${OPT.detailOwnField}", which no row has`);
(Array.isArray(OPT.detailSections) ? OPT.detailSections : [null]).forEach((s, k) => {
  if(!s || typeof s.heading !== 'string' || !s.heading || typeof s.label !== 'string' || !s.label){ errs.push(`option detailSections entry ${k + 1} needs a heading and a label`); return; }
  let re = null;
  try { re = new RegExp('|' + s.label); } catch(e){ errs.push(`option detailSections label "${s.label}" is not a regular expression: ${e.message}`); return; }
  if(re.exec('').length > 1) errs.push(`option detailSections label "${s.label}" has a capturing group; write (?:...)`);
});
if(OPT.detailSeeAbove){
  try { if(new RegExp('|' + OPT.detailSeeAbove).exec('').length > 1) errs.push(`option detailSeeAbove "${OPT.detailSeeAbove}" has a capturing group; write (?:...)`); }
  catch(e){ errs.push(`option detailSeeAbove "${OPT.detailSeeAbove}" is not a regular expression: ${e.message}`); }
}
const labels = new Set();
(Array.isArray(OPT.groups) ? OPT.groups : [null]).forEach((g, k) => {
  if(!g || typeof g.label !== 'string' || !g.label){ errs.push(`group ${k + 1} has no label`); return; }
  if(labels.has(g.label)) errs.push(`two groups have the label "${g.label}"`);
  labels.add(g.label);
  if(g.tables === 'all') return;
  if(!Array.isArray(g.tables) || !g.tables.length){ errs.push(`group "${g.label}" names no tables (a list of table ids, or 'all')`); return; }
  g.tables.forEach(id => { if(!ids.has(String(id))) errs.push(`group "${g.label}" names the table "${id}", which DRUG_TABLES does not have`); });
});
if(!Array.isArray(OPT.recallShow) || OPT.recallShow.some(f => typeof f !== 'string')) errs.push('option recallShow must be a list of row fields');
else OPT.recallShow.forEach(f => { if(!known(f)) errs.push(`option recallShow names the field "${f}", which no row has`); });
if(OPT.recallClassField && !known(OPT.recallClassField)) errs.push(`option recallClassField names the field "${OPT.recallClassField}", which no row has`);
if(OPT.defaultGroup && !labels.has(OPT.defaultGroup)) errs.push(`option defaultGroup is "${OPT.defaultGroup}", which is not the label of a group`);
if(typeof OPT.tab !== 'string' || !/^[a-z][a-z0-9-]*$/.test(OPT.tab)) errs.push(`option tab "${OPT.tab}" must be lowercase letters, digits and hyphens`);
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {tables: DRUG_TABLES.length, rows: DRUG_TABLES.reduce((n, t) => n + t.rows.length, 0), groups: (OPT.groups || []).length};
