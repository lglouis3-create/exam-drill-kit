/* quiz-prep-cards build step: COURSE.quizzes checked against the bank before
   anything is written. Each quiz: an id of letters, digits, - or _ that no
   other quiz has; a name; `when` a local date and time written
   YYYY-MM-DDTHH:MM that is a real date; `minutes` a number of 0 or more;
   `topics` (TOPICS ids) or `modules` (values of the questions' `module`
   field), or both, each one that the bank has, and together at least one
   question; `covers`, `quote` and `src` text with no HTML tag; `said` a list
   of text whose only tags are <sub>, <sup>, <b>, <i> and <em>. A field the
   module does not read stops the build, so a misspelt one is not ignored.
   Basic-Pharmacokinetics checked none of this (its src/review_test.py lines
   76-108 test the cards in a browser only); these are the kit's checks. */
const errs = [], seen = new Set();
const list = COURSE.quizzes;
const FIELDS = ['id', 'name', 'when', 'minutes', 'topics', 'modules', 'covers', 'quote', 'said', 'src'];
const str = x => typeof x === 'string' && x.trim() !== '';
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
const scope = {};
if(!Array.isArray(list) || !list.length)
  throw new Error('quiz-prep-cards reads COURSE.quizzes: give course.js a list of quizzes, {id, name, when, minutes, topics or modules}');
const topicIds = new Set((typeof TOPICS === 'undefined' ? [] : TOPICS).map(t => t.id));
const modules = new Set(QUESTIONS.filter(q => q.module !== undefined).map(q => q.module));
list.forEach((qz, i) => {
  const at = qz && str(qz.id) ? qz.id : `quiz ${i + 1}`;
  if(!qz || typeof qz !== 'object' || Array.isArray(qz)){ errs.push(`${at} is not {id, name, when, minutes, ...}`); return; }
  for(const k of Object.keys(qz)) if(!FIELDS.includes(k)) errs.push(`${at}: the field "${k}" is not one the module reads (${FIELDS.join(', ')})`);
  if(!str(qz.id) || !/^[A-Za-z0-9_-]+$/.test(qz.id)) errs.push(`${at}: id is not letters, digits, - or _`);
  else if(seen.has(qz.id)) errs.push(`${at}: two quizzes have this id`);
  seen.add(qz.id);
  if(!str(qz.name)) errs.push(`${at}: no name`);
  if(typeof qz.when !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(qz.when) || isNaN(new Date(qz.when).getTime()))
    errs.push(`${at}: when is not a date and time written YYYY-MM-DDTHH:MM`);
  if(typeof qz.minutes !== 'number' || !(qz.minutes >= 0)) errs.push(`${at}: minutes is not a number of 0 or more`);
  const t = qz.topics, m = qz.modules;
  if(t === undefined && m === undefined) errs.push(`${at}: names neither topics nor modules, so the card would have no questions`);
  if(t !== undefined && !Array.isArray(t)) errs.push(`${at}: topics is not a list`);
  if(m !== undefined && !Array.isArray(m)) errs.push(`${at}: modules is not a list`);
  (Array.isArray(t) ? t : []).forEach(x => { if(!topicIds.has(x)) errs.push(`${at}: topics names "${x}", which TOPICS does not have`); });
  (Array.isArray(m) ? m : []).forEach(x => { if(!modules.has(x)) errs.push(`${at}: modules names ${JSON.stringify(x)}, which no question carries as its module`); });
  const tt = Array.isArray(t) ? t : [], mm = Array.isArray(m) ? m : [];
  const n = QUESTIONS.filter(q => tt.includes(q.topic) || (q.module !== undefined && mm.includes(q.module))).length;
  if((Array.isArray(t) || Array.isArray(m)) && !n) errs.push(`${at}: the bank holds no question on the topics or modules it names`);
  scope[qz.id] = n;
  for(const f of ['covers', 'quote', 'src']) if(qz[f] !== undefined){
    if(typeof qz[f] !== 'string') errs.push(`${at}: ${f} is not text`);
    else if(/<[a-zA-Z/]/.test(qz[f])) errs.push(`${at}: ${f} carries an HTML tag`);
  }
  if(qz.said !== undefined){
    if(!Array.isArray(qz.said) || !qz.said.every(str)) errs.push(`${at}: said is not a list of text`);
    else qz.said.forEach((s, j) => {
      for(const g of s.matchAll(TAG)) if(!['sub', 'sup', 'b', 'i', 'em'].includes(g[1].toLowerCase()) || /<[a-zA-Z]+\s/.test(g[0]))
        errs.push(`${at}: said line ${j + 1} carries the tag ${g[0]}; only <sub>, <sup>, <b>, <i> and <em> are kept`);
    });
  }
});
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {quizzes: list.length, scope};
