/* short-answer-graphs build step: the short-answer and figure data checked
   against the bank and IMAGES before anything is written (Intro-Pharmacology
   exam1-drill/src/test.js lines 60-84, the graph registry check, at 929cd62).
   SHORT_ANSWERS, when the course declares it: a list; each prompt has a
   unique id, the prompt q, the model answer and at least one key point, all
   text; lecture, form, quote, cite and note, when there, are text, and form
   is one of her, key, objective.
   GRAPHS, when the course declares it: a list; each figure has a key and a
   title; read is a list of one or more lines; alts and asks, when there, are
   lists of text; exam, when there, a whole number from 1; every key and alt
   is an image in images.json and belongs to one figure only; every figure has
   at least one question whose img is its key or an alt; every miss tag on a
   wrong option of those questions is in GRAPH_MISS or in GRAPH_EXAMS[exam].miss
   (each entry [label, question]). Unlike that course's check, the group names
   and the counts of read lines, asks and questions per figure are not fixed:
   they were that course's own rules. At least one of the two lists has rows. */
const errs = [];
const str = x => typeof x === 'string' && x.trim() !== '';
const strList = x => Array.isArray(x) && x.every(str);
const sa = typeof SHORT_ANSWERS === 'undefined' ? null : SHORT_ANSWERS;
const gr = typeof GRAPHS === 'undefined' ? null : GRAPHS;
const miss = typeof GRAPH_MISS === 'undefined' ? {} : GRAPH_MISS;
const exams = typeof GRAPH_EXAMS === 'undefined' ? {} : GRAPH_EXAMS;
const missTable = (t, where) => {
  if(!t || typeof t !== 'object' || Array.isArray(t)){ errs.push(`${where} is not {tag: [label, question]}`); return; }
  for(const [k, v] of Object.entries(t)) if(!Array.isArray(v) || v.length !== 2 || !v.every(str)) errs.push(`${where}.${k} is not [label, question]`);
};
if(sa !== null){
  if(!Array.isArray(sa)) errs.push('SHORT_ANSWERS is not a list');
  else {
    const seen = new Set();
    sa.forEach((p, i) => {
      const id = p && str(p.id) ? p.id : `prompt ${i + 1}`;
      if(!p || !str(p.id)) errs.push(`SHORT_ANSWERS ${i + 1} has no id`);
      else if(seen.has(p.id)) errs.push(`SHORT_ANSWERS: the id ${p.id} is used twice`);
      else seen.add(p.id);
      if(!p) return;
      for(const f of ['q', 'model']) if(!str(p[f])) errs.push(`${id}: no ${f}`);
      if(!Array.isArray(p.points) || !p.points.length || !strList(p.points)) errs.push(`${id}: points is not a list of one or more key points`);
      for(const f of ['lecture', 'form', 'quote', 'cite', 'note']) if(p[f] !== undefined && !str(p[f])) errs.push(`${id}: ${f} is not text`);
      if(str(p.form) && !['her', 'key', 'objective'].includes(p.form)) errs.push(`${id}: form "${p.form}" is not her, key or objective`);
    });
  }
}
let qsOn = 0;
if(gr !== null){
  if(!Array.isArray(gr)) errs.push('GRAPHS is not a list');
  else {
    missTable(miss, 'GRAPH_MISS');
    if(typeof exams !== 'object' || Array.isArray(exams)) errs.push('GRAPH_EXAMS is not {exam number: {intro, noun, other, miss}}');
    else for(const [n, e] of Object.entries(exams)){
      if(!/^[1-9][0-9]*$/.test(n)) errs.push(`GRAPH_EXAMS key "${n}" is not an exam number`);
      if(!e || typeof e !== 'object'){ errs.push(`GRAPH_EXAMS.${n} is not an object`); continue; }
      for(const f of ['intro', 'noun', 'other']) if(e[f] !== undefined && !str(e[f])) errs.push(`GRAPH_EXAMS.${n}.${f} is not text`);
      if(e.miss !== undefined) missTable(e.miss, `GRAPH_EXAMS.${n}.miss`);
    }
    const owner = {}, byImg = {};
    QUESTIONS.forEach(q => { if(q.img) (byImg[q.img] = byImg[q.img] || []).push(q); });
    gr.forEach((g, i) => {
      const id = g && str(g.key) ? g.key : `figure ${i + 1}`;
      if(!g || !str(g.key)){ errs.push(`GRAPHS ${i + 1} has no key`); return; }
      if(!str(g.title)) errs.push(`GRAPHS ${id}: no title`);
      if(!Array.isArray(g.read) || !g.read.length || !strList(g.read)) errs.push(`GRAPHS ${id}: read is not a list of one or more lines`);
      for(const f of ['alts', 'asks']) if(g[f] !== undefined && !strList(g[f])) errs.push(`GRAPHS ${id}: ${f} is not a list of text`);
      for(const f of ['group', 'source', 'method']) if(g[f] !== undefined && !str(g[f])) errs.push(`GRAPHS ${id}: ${f} is not text`);
      if(g.exam !== undefined && !(Number.isInteger(g.exam) && g.exam >= 1)) errs.push(`GRAPHS ${id}: exam is not a whole number from 1`);
      const keys = [g.key].concat(Array.isArray(g.alts) ? g.alts : []);
      const qs = [];
      for(const k of keys){
        if(typeof IMAGES === 'undefined' || !IMAGES[k]) errs.push(`GRAPHS ${id}: the image "${k}" is not in images.json`);
        if(owner[k]) errs.push(`GRAPHS ${id}: the image "${k}" is also in the figure ${owner[k]}`);
        owner[k] = id;
        qs.push(...(byImg[k] || []));
      }
      if(!qs.length) errs.push(`GRAPHS ${id}: no question has this figure (img: "${g.key}")`);
      qsOn += qs.length;
      const em = (exams[g.exam || 1] || {}).miss || {};
      qs.forEach(q => (q.options || []).forEach(o => {
        if(!o.correct && o.miss !== undefined && !(em[o.miss] || miss[o.miss])) errs.push(`${q.id}: the miss tag "${o.miss}" is in neither GRAPH_MISS nor GRAPH_EXAMS[${g.exam || 1}].miss`);
      }));
    });
  }
}
const nSa = Array.isArray(sa) ? sa.length : 0, nGr = Array.isArray(gr) ? gr.length : 0;
if(!errs.length && !nSa && !nGr) errs.push('neither SHORT_ANSWERS nor GRAPHS has rows, so neither page would have anything to show');
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {prompts: nSa, figures: nGr, questions: qsOn};
