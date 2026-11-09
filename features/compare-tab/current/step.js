/* compare-tab build step: the course's DRUG_TABLES and the module's options checked
   before anything is written. DRUG_TABLES is declared (drug-list-tab's step checks the
   tables themselves when that module is on; this step checks what Compare reads): every
   row field the options name is a field some row has; each row has a key, a heading and
   a field, a section index within sectionLabels, separators as text; max is 2 or more;
   defaultTable, if given, is a table's id. */
if(typeof DRUG_TABLES === 'undefined' || !Array.isArray(DRUG_TABLES))
  throw new Error('DRUG_TABLES is not declared: put the tables in a data file listed in course.js `files`');
const errs = [], fields = new Set(), ids = new Set();
DRUG_TABLES.forEach((t, k) => {
  if(!t || (typeof t.id !== 'string' && typeof t.id !== 'number') || t.id === ''){ errs.push(`table ${k + 1} has no id`); return; }
  ids.add(String(t.id));
  if(!Array.isArray(t.rows) || !t.rows.length){ errs.push(`table "${t.id}" has no rows`); return; }
  t.rows.forEach(r => { if(r && typeof r === 'object') Object.keys(r).forEach(f => fields.add(f)); });
});
const known = f => typeof f === 'string' && fields.has(f);
const reOk = (s, what) => { try { if(new RegExp('|' + s).exec('').length > 1) errs.push(`${what} "${s}" has a capturing group; write (?:...)`); } catch(e){ errs.push(`${what} "${s}" is not a regular expression: ${e.message}`); } };
const labels = Array.isArray(OPT.sectionLabels) ? OPT.sectionLabels : [];
if(!Array.isArray(OPT.sectionLabels) || labels.some(x => typeof x !== 'string' || !x)) errs.push('option sectionLabels must be a list of regular expressions');
else labels.forEach(x => reOk(x, 'option sectionLabels'));
if(OPT.seeAbove) reOk(OPT.seeAbove, 'option seeAbove');
const keys = new Set();
if(!Array.isArray(OPT.rows) || !OPT.rows.length) errs.push('option rows must list at least one row');
else OPT.rows.forEach((d, k) => {
  if(!d || typeof d.key !== 'string' || !d.key || typeof d.heading !== 'string' || !d.heading || typeof d.field !== 'string'){ errs.push(`option rows entry ${k + 1} needs a key, a heading and a field`); return; }
  if(keys.has(d.key)) errs.push(`option rows has the key "${d.key}" twice`);
  keys.add(d.key);
  if(!known(d.field)) errs.push(`option rows "${d.key}" names the field "${d.field}", which no row has`);
  if(d.section !== undefined && !(Number.isInteger(d.section) && d.section >= 0 && d.section < labels.length)) errs.push(`option rows "${d.key}" has section ${JSON.stringify(d.section)}, not an index into sectionLabels (0 to ${labels.length - 1})`);
  if(d.split !== undefined && (!Array.isArray(d.split) || d.split.some(x => typeof x !== 'string' || !x))) errs.push(`option rows "${d.key}" has split that is not a list of separators`);
  for(const x of ['blank', 'empty']) if(d[x] !== undefined && (typeof d[x] !== 'string' || !d[x])) errs.push(`option rows "${d.key}" has ${x} that is not text`);
  const extra = Object.keys(d).filter(x => !['key', 'heading', 'field', 'section', 'split', 'blank', 'empty'].includes(x));
  if(extra.length) errs.push(`option rows "${d.key}" has ${extra.join(', ')}, which a row does not take`);
});
for(const o of ['ownField', 'classField', 'brandField']) if(OPT[o] && !known(OPT[o])) errs.push(`option ${o} names the field "${OPT[o]}", which no row has`);
if(!Array.isArray(OPT.classSkip) || OPT.classSkip.some(x => typeof x !== 'string')) errs.push('option classSkip must be a list of class names (text)');
for(const o of ['label', 'before']) if(typeof OPT[o] !== 'string' || !OPT[o].trim()) errs.push(`option ${o} must be text`);
if(!known(OPT.labelField)) errs.push(`option labelField names the field "${OPT.labelField}", which no row has`);
if(!Number.isInteger(OPT.max) || OPT.max < 2) errs.push(`option max is ${JSON.stringify(OPT.max)}: Compare needs room for at least 2 drugs`);
if(OPT.defaultTable !== '' && !ids.has(String(OPT.defaultTable))) errs.push(`option defaultTable is "${OPT.defaultTable}", which is not a table's id`);
if(typeof OPT.tab !== 'string' || !/^[a-z][a-z0-9-]*$/.test(OPT.tab)) errs.push(`option tab "${OPT.tab}" must be lowercase letters, digits and hyphens`);
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {tables: DRUG_TABLES.length, rows: OPT.rows.length};
