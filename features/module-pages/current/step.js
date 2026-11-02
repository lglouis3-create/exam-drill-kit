/* module-pages build step: the course's OBJECTIVES and CALC_TYPES checked
   against the bank before anything is written (Basic-Pharmacokinetics
   src/review_test.py lines 112-117: every kind of problem has a worked example
   of its own kind). Both lists are optional; what a course declares must hold:

   - an objective needs a module, a number (n), its text and the subtopics
     ('topic/sub') its concept questions come from, each one in TOPICS;
   - a kind of problem needs a unique id, a module, a name and what it matches
     ('topic', 'topic/sub', either with ':skill'), each topic and subtopic in
     TOPICS; its worked example, when named, is a calculation in the bank whose
     first matching kind is this one;
   - every module they name is one of the course's modules (the `modules`
     option, or the lectures' `module` and the questions' own `module`). */
const errs = [];
const OBJ = typeof OBJECTIVES === 'undefined' ? [] : OBJECTIVES;
const TYP = typeof CALC_TYPES === 'undefined' ? [] : CALC_TYPES;
if(!Array.isArray(OBJ)) errs.push('OBJECTIVES must be a list');
if(!Array.isArray(TYP)) errs.push('CALC_TYPES must be a list');
if(OPT.modules !== undefined && !(Array.isArray(OPT.modules) && OPT.modules.every(r => Array.isArray(r) && r.length >= 2 && typeof r[1] === 'string')))
  errs.push('the modules option must be [[module value, heading], ...]');
if(errs.length) throw new Error(errs.join('; '));

const lecMod = q => { const c = q.cite || ''; const l = (COURSE.lectures || []).find(x => c.includes(x.deck)); return l ? l.module : undefined; };
const modOf = q => (q.module !== undefined && q.module !== null ? q.module : lecMod(q));
const calcSkill = Object.fromEntries((COURSE.skills || []).map(s => [s.id, s.kind === 'calc']));
const QTY = /^[<>≈~]?\s*-?[\d.]/;
const isCalc = q => q.type === 'numeric' || (q.type === 'match' && calcSkill[q.skill]
  && (q.pairs || []).length > 0 && q.pairs.every(p => QTY.test(String(p.r).trim())));
const topic = id => TOPICS.find(t => t.id === id);
const subOk = ts => { const [t, s] = String(ts).split('/'); const T = topic(t); return !!T && (s === undefined || (T.subs || []).some(x => x.id === s)); };

const known = new Set((Array.isArray(OPT.modules) && OPT.modules.length ? OPT.modules.map(r => r[0])
  : (COURSE.lectures || []).map(l => l.module).concat(QUESTIONS.map(modOf))).filter(m => m !== undefined && m !== null));
if(!QUESTIONS.some(q => known.has(modOf(q))))
  errs.push('no question belongs to a module: give the lectures in course.js a `module` (or the questions a `module` field)');

const objKeys = new Set();
OBJ.forEach((o, k) => {
  const name = `objective ${k + 1}` + (o && o.n !== undefined ? ` ("${o.n}")` : '');
  if(!o || o.module === undefined || o.n === undefined || !o.text){ errs.push(`${name} needs a module, a number (n) and its text`); return; }
  if(!known.has(o.module)) errs.push(`${name} names module ${JSON.stringify(o.module)}, which is not one of the course's modules`);
  const key = JSON.stringify([o.module, String(o.n)]);
  if(objKeys.has(key)) errs.push(`two objectives of module ${JSON.stringify(o.module)} are numbered "${o.n}"`);
  objKeys.add(key);
  if(!Array.isArray(o.subs) || !o.subs.length) errs.push(`${name} names no subtopics (subs)`);
  else o.subs.forEach(s => { if(!/^[^/]+\/[^/]+$/.test(s) || !subOk(s)) errs.push(`${name} names the subtopic "${s}", which is not a topic/sub in TOPICS`); });
});

const typeIds = new Set();
const matches = (t, q) => modOf(q) === t.module && (t.match || []).some(m => {
  const [ts, sk] = String(m).split(':');
  return (ts === q.topic + '/' + q.sub || ts === q.topic) && (!sk || q.skill === sk);
});
TYP.forEach((t, k) => {
  if(!t || typeof t.id !== 'string' || !t.id){ errs.push(`kind of problem ${k + 1} has no id`); return; }
  if(typeIds.has(t.id)) errs.push(`two kinds of problem have the id "${t.id}"`);
  typeIds.add(t.id);
  if(t.module === undefined || !t.name) errs.push(`kind of problem "${t.id}" needs a module and a name`);
  else if(!known.has(t.module)) errs.push(`kind of problem "${t.id}" names module ${JSON.stringify(t.module)}, which is not one of the course's modules`);
  if(!Array.isArray(t.match) || !t.match.length) errs.push(`kind of problem "${t.id}" matches nothing (match)`);
  else t.match.forEach(m => { if(!subOk(String(m).split(':')[0])) errs.push(`kind of problem "${t.id}" matches "${m}", whose topic or subtopic is not in TOPICS`); });
  if(t.example !== undefined){
    const q = QUESTIONS.find(x => x.id === t.example);
    if(!q) errs.push(`kind of problem "${t.id}" names the worked example ${t.example}, which is not a question in the bank`);
    else if(!isCalc(q)) errs.push(`the worked example ${t.example} of "${t.id}" is not a calculation`);
    else { const first = TYP.find(x => x && matches(x, q)); if(first !== t) errs.push(`the worked example ${t.example} of "${t.id}" belongs to ${first ? `"${first.id}"` : 'no kind of problem'}`); }
  }
});
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {objectives: OBJ.length, types: TYP.length};
