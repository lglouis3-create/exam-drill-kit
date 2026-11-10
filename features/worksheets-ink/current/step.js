/* worksheets-ink build step: the course's SOURCES checked against the bank before
   anything is written (Basic-Pharmacokinetics src/sources_check.js, the checks that
   read the bank: every item names a question, every set names a problem set, no
   question is on two documents), and which document and number each question comes
   from (Basic-Pharmacokinetics' SOURCE_OF, which gen/sources.py wrote from the same
   items). The module's regular-expression options must compile and hold no
   lookbehind, which older Safari cannot read. */
const list = typeof SOURCES === 'undefined' ? null : SOURCES;
if(!Array.isArray(list)) throw new Error('SOURCES must be a list of the documents the questions come from, in a data file listed in course.js `files`');
if(!list.length) throw new Error('SOURCES lists no document, so the Worksheets tab would be empty');
const TYPES = ['daily-practice', 'in-class', 'homework', 'quiz', 'review', 'example', 'lecture-slides'];
const ids = new Set(QUESTIONS.map(q => q.id));
const chains = new Set((typeof CHAINS === 'undefined' || !Array.isArray(CHAINS) ? [] : CHAINS).map(c => c && c.id));
const of = {}, seen = new Set(), errs = [];
list.forEach((s, k) => {
  if(!s || typeof s.id !== 'string' || !s.id){ errs.push(`document ${k + 1} in SOURCES has no id`); return; }
  if(seen.has(s.id)) errs.push(`two documents have the id "${s.id}"`);
  seen.add(s.id);
  if(!s.title) errs.push(`document "${s.id}" has no title`);
  if(!TYPES.includes(s.type)) errs.push(`document "${s.id}" has type ${JSON.stringify(s.type)}; it must be one of ${TYPES.join(', ')}`);
  if(s.module === undefined || s.module === null) errs.push(`document "${s.id}" has no module`);
  if(s.drive != null && !(s.drive && typeof s.drive.id === 'string' && s.drive.id)) errs.push(`document "${s.id}" has a drive entry without an id`);
  if(!Array.isArray(s.items)) errs.push(`document "${s.id}" has no items list`);
  (Array.isArray(s.items) ? s.items : []).forEach(it => {
    if(!it || !it.q || typeof it.label !== 'string') { errs.push(`document "${s.id}" has an item that is not {q, label}`); return; }
    if(!ids.has(it.q)) errs.push(`document "${s.id}" names ${it.q}, which is not a question in the bank`);
    if(of[it.q] && of[it.q].src !== s.id) errs.push(`question ${it.q} is on both "${of[it.q].src}" and "${s.id}"`);
    if(!of[it.q]) of[it.q] = {src: s.id, label: it.label};
  });
  (Array.isArray(s.chains) ? s.chains : []).forEach(c => { if(!chains.has(c)) errs.push(`document "${s.id}" names problem set ${c}, which CHAINS does not have`); });
});
if(typeof SOURCE_OF !== 'undefined' && SOURCE_OF){
  for(const [q, v] of Object.entries(SOURCE_OF)){
    const o = of[q];
    if(!o || !v || o.src !== v.src || o.label !== v.label) { errs.push(`SOURCE_OF says ${q} is ${JSON.stringify(v)}, but the documents' items say ${JSON.stringify(o || null)}`); break; }
  }
}
for(const k of ['originalIds', 'changedIds', 'drillWorked', 'spokenOnly', 'writtenWorking']){
  const v = OPT[k];
  if(!v) continue;
  if(/\(\?<[=!]/.test(v)) errs.push(`option ${k} holds a lookbehind, which older Safari cannot read`);
  try { new RegExp(v, 'i'); } catch(e){ errs.push(`option ${k} is not a regular expression: ${e.message}`); }
}
if(OPT.calcSkills != null){
  const ids = new Set(((typeof COURSE !== 'undefined' && COURSE && COURSE.skills) || []).map(k => k && k.id));
  if(!Array.isArray(OPT.calcSkills) || OPT.calcSkills.some(k => typeof k !== 'string')) errs.push('option calcSkills must be a list of skill ids');
  else OPT.calcSkills.filter(k => !ids.has(k)).forEach(k => errs.push(`option calcSkills names the skill ${JSON.stringify(k)}, which COURSE.skills does not have`));
}
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {of, documents: list.length, questions: Object.keys(of).length};
