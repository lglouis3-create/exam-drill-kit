/* terms-variables build step: the course's TERMS and ASKS checked before
   anything is written (Basic-Pharmacokinetics src/test.js section 9 "Terms",
   lines 943-972, and src/var_test.py, at ac2eb73, as far as the data decides).
   At least one of TERMS and ASKS is there.
   TERMS, when there: a list of at least 4 terms (a question has 4 options);
   each with an id (unique), a name (`term`), a group, a definition (`def`) and
   a source (`cite`), all text; `gist`, `scene` and `hook`, when present, text;
   `module`, when present, a number; `confuse`, when present, a list (an id in it
   that is not a term of TERMS is skipped, as PK's termDistractors skips it, so a
   course's term list can be used in part).
   ASKS, when there: {key: [symbol, meaning]}, both text; every key of the
   options `families`, `names` and `twins`, and every key a twin names, is a
   key of ASKS; `names` values are lists of text; at least 5 symbols are
   drilled (a "which symbol" question has 5 options); every numeric question's
   `asks` is a key of ASKS. No question in the bank has an id this module
   gives its own questions (term-<id>-..., var-<key>-...). */
const terms = (typeof TERMS === 'undefined') ? null : TERMS;
const asks = (typeof ASKS === 'undefined') ? null : ASKS;
if(terms === null && asks === null)
  throw new Error('terms-variables reads TERMS or ASKS: put the terms ([{id, term, group, def, cite}]) or the symbols ({key: [symbol, meaning]}) in a data file listed in course.js `files`');
const str = x => typeof x === 'string' && x.trim() !== '';
const errs = [];
let nTerms = 0, nSyms = 0;
if(terms !== null){
  if(!Array.isArray(terms)) errs.push('TERMS is not a list');
  else {
    const ids = new Set();
    terms.forEach((t, i) => {
      const who = t && str(t.id) ? t.id : `term ${i + 1}`;
      if(!t || typeof t !== 'object'){ errs.push(`${who} is not an object`); return; }
      if(!str(t.id)) errs.push(`${who} has no id`);
      else if(ids.has(t.id)) errs.push(`${t.id}: the id is used twice`);
      else ids.add(t.id);
      for(const f of ['term', 'group', 'def', 'cite']) if(!str(t[f])) errs.push(`${who} has no ${f}`);
      for(const f of ['gist', 'scene', 'hook']) if(t[f] !== undefined && typeof t[f] !== 'string') errs.push(`${who}: ${f} is not text`);
      if(t.module !== undefined && typeof t.module !== 'number') errs.push(`${who}: module is not a number`);
      if(t.confuse !== undefined && !Array.isArray(t.confuse)) errs.push(`${who}: confuse is not a list of term ids`);
    });
    if(terms.length < 4) errs.push(`TERMS has ${terms.length} term${terms.length === 1 ? '' : 's'}; a term question needs 4 terms for its 4 options`);
    nTerms = terms.length;
  }
}
if(asks !== null){
  if(!asks || typeof asks !== 'object' || Array.isArray(asks)) errs.push('ASKS is not {key: [symbol, meaning]}');
  else {
    for(const [k, v] of Object.entries(asks)) if(!Array.isArray(v) || v.length !== 2 || !v.every(str)) errs.push(`ASKS.${k} is not [symbol, meaning]`);
    for(const f of ['families', 'names', 'twins']) for(const k of Object.keys(OPT[f] || {})) if(!asks[k]) errs.push(`option ${f} names "${k}", which is not a key of ASKS`);
    for(const [k, v] of Object.entries(OPT.families || {})) if(!str(v)) errs.push(`option families: "${k}" has no family name`);
    for(const [k, v] of Object.entries(OPT.names || {})) if(!Array.isArray(v) || !v.every(str)) errs.push(`option names: "${k}" is not a list of words`);
    for(const [k, v] of Object.entries(OPT.twins || {})){
      if(!Array.isArray(v)) errs.push(`option twins: "${k}" is not a list of ASKS keys`);
      else for(const x of v) if(!asks[x]) errs.push(`option twins: "${k}" names "${x}", which is not a key of ASKS`);
    }
    nSyms = Object.keys(OPT.families || {}).length ? Object.keys(OPT.families).filter(k => asks[k]).length : Object.keys(asks).length;
    if(nSyms < 5) errs.push(`the variables quiz drills ${nSyms} symbol${nSyms === 1 ? '' : 's'}; a "which symbol" question needs 5 for its 5 options`);
    for(const q of QUESTIONS) if(q.type === 'numeric' && q.asks !== undefined && !asks[q.asks]) errs.push(`${q.id}: asks "${q.asks}" is not a key of ASKS`);
  }
}
const mine = QUESTIONS.filter(q => /^(term|var)-/.test(String(q.id))).map(q => q.id);
if(mine.length) errs.push(`question id${mine.length === 1 ? '' : 's'} ${mine.slice(0, 3).join(', ')} start${mine.length === 1 ? 's' : ''} with term- or var-, which the module uses for its own questions`);
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {terms: nTerms, symbols: nSyms};
