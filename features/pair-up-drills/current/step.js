/* pair-up-drills build step: the course's PAIR_SETS and RECALL_TABLES checked
   before anything is written (the shapes are in pair-up-drills.js's header;
   Intro-Pharmacology- exam1-drill/src/test.js checks its poisoning table the same
   way: every row with its fields, no id twice, every "same as" row found).
   At least one of the two is there. PAIR_SETS: each set an id (no id twice), a
   name, `bins` true or left out, and at least 2 pairs [chip, box, why] of text (why
   may be empty); no chip twice in a set; in a one-chip-per-box set no box twice.
   RECALL_TABLES: each table an id of letters, digits and -, no id twice, a `tab`
   name; `columns` [[column, label]] of text; `name` a column; rows with an id (no
   id twice, no "|" in it) whose cells are text or lists of text with no HTML tag;
   `covers` [[id, label, [columns]]] naming columns of `columns`; each mode an id
   (no id twice), a label, `ask` (a column or a list of columns), `answer`,
   `options` 2 to 8, and `near`, `distinct`, `alts` columns; in a row the list
   cells a mode reads have one length; each mode has at least 2 items and at
   least 2 different answers. Every column a table names is in at least one row. */
const sets = typeof PAIR_SETS === 'undefined' ? null : PAIR_SETS;
const tables = typeof RECALL_TABLES === 'undefined' ? null : RECALL_TABLES;
const errs = [];
const str = x => typeof x === 'string' && x.trim() !== '';
const TAG = /<[a-z/!]/i;
if(sets === null && tables === null)
  throw new Error('pair-up-drills reads PAIR_SETS or RECALL_TABLES: put them in a data file listed in course.js `files`');
let pairs = 0;
if(sets !== null){
  if(!Array.isArray(sets)) errs.push('PAIR_SETS is not a list');
  else {
    const ids = new Set();
    sets.forEach((s, n) => {
      const w = `PAIR_SETS ${n + 1}${s && str(s.id) ? ' (' + s.id + ')' : ''}`;
      if(!s || typeof s !== 'object'){ errs.push(`${w} is not {id, name, pairs}`); return; }
      if(!str(s.id)) errs.push(`${w} has no id`); else if(ids.has(s.id)) errs.push(`${w}: the id is used twice`); else ids.add(s.id);
      if(!str(s.name)) errs.push(`${w} has no name`);
      if(s.bins !== undefined && typeof s.bins !== 'boolean') errs.push(`${w}: bins is not true or false`);
      if(s.cite !== undefined && typeof s.cite !== 'string') errs.push(`${w}: cite is not text`);
      if(!Array.isArray(s.pairs) || s.pairs.length < 2){ errs.push(`${w} has fewer than 2 pairs`); return; }
      const chips = new Set(), boxes = new Set();
      s.pairs.forEach((p, i) => {
        if(!Array.isArray(p) || p.length !== 3 || !str(p[0]) || !str(p[1]) || typeof p[2] !== 'string'){ errs.push(`${w}: pair ${i + 1} is not [chip, box, why]`); return; }
        if(p.some(x => TAG.test(x))) errs.push(`${w}: pair ${i + 1} carries an HTML tag`);
        if(chips.has(p[0])) errs.push(`${w}: the chip "${p[0]}" is there twice`); chips.add(p[0]);
        if(!s.bins && boxes.has(p[1])) errs.push(`${w}: the box "${p[1]}" is there twice in a one-chip-per-box set (set bins: true)`); boxes.add(p[1]);
        pairs++;
      });
    });
  }
}
const out = [];
if(tables !== null){
  if(!Array.isArray(tables)) errs.push('RECALL_TABLES is not a list');
  else {
    const ids = new Set();
    tables.forEach((t, n) => {
      const w = `RECALL_TABLES ${n + 1}${t && str(t.id) ? ' (' + t.id + ')' : ''}`;
      if(!t || typeof t !== 'object'){ errs.push(`${w} is not a table`); return; }
      if(!str(t.id) || !/^[a-z0-9-]+$/i.test(t.id)) errs.push(`${w}: the id is not letters, digits and -`);
      else if(ids.has(t.id)) errs.push(`${w}: the id is used twice`); else ids.add(t.id);
      if(!str(t.tab)) errs.push(`${w} has no tab name`);
      for(const f of ['title', 'intro', 'cite']) if(t[f] !== undefined && typeof t[f] !== 'string') errs.push(`${w}: ${f} is not text`);
      const cols = Array.isArray(t.columns) ? t.columns : [];
      if(!cols.length || !cols.every(c => Array.isArray(c) && c.length === 2 && c.every(str))) errs.push(`${w}: columns is not a list of [column, label]`);
      const colset = new Set(cols.map(c => c[0]));
      if(!Array.isArray(t.rows) || t.rows.length < 2){ errs.push(`${w} has fewer than 2 rows`); return; }
      const rids = new Set(), have = new Set();
      t.rows.forEach((r, i) => {
        if(!r || typeof r !== 'object' || !str(r.id)){ errs.push(`${w}: row ${i + 1} has no id`); return; }
        if(rids.has(r.id)) errs.push(`${w}: the row id "${r.id}" is used twice`); rids.add(r.id);
        if(r.id.includes('|')) errs.push(`${w}: the row id "${r.id}" holds a |`);
        for(const [k, v] of Object.entries(r)){
          if(k === 'id') continue;
          have.add(k);
          const ok = typeof v === 'string' || (Array.isArray(v) && v.length && v.every(x => typeof x === 'string'));
          if(!ok) errs.push(`${w}: row ${r.id}, ${k} is not text or a list of text`);
          else if([].concat(v).some(x => TAG.test(x))) errs.push(`${w}: row ${r.id}, ${k} carries an HTML tag`);
        }
      });
      const need = (k, what) => { if(!str(k)) errs.push(`${w}: ${what} is not a column name`); else if(!have.has(k)) errs.push(`${w}: ${what} "${k}" is in no row`); };
      need(t.name, 'name');
      cols.forEach(c => need(c[0], 'the column'));
      if(t.covers !== undefined){
        if(!Array.isArray(t.covers)) errs.push(`${w}: covers is not a list`);
        else t.covers.forEach((c, i) => {
          if(!Array.isArray(c) || c.length !== 3 || !str(c[0]) || !str(c[1]) || !Array.isArray(c[2])) errs.push(`${w}: cover ${i + 1} is not [id, label, [columns]]`);
          else c[2].forEach(k => { if(!colset.has(k)) errs.push(`${w}: cover ${c[0]} names "${k}", which is not in columns`); });
        });
      }
      if(t.cover !== undefined && t.cover !== false) errs.push(`${w}: cover is false or left out`);
      if(!Array.isArray(t.modes) || !t.modes.length){ errs.push(`${w} has no modes`); return; }
      const mids = new Set(), counts = {};
      t.modes.forEach((m, i) => {
        const mw = `${w}, mode ${m && str(m.id) ? m.id : i + 1}`;
        if(!m || typeof m !== 'object' || !str(m.id) || m.id.startsWith('#')){ errs.push(`${mw} has no id`); return; }
        if(mids.has(m.id)) errs.push(`${mw}: the id is used twice`); mids.add(m.id);
        if(!str(m.label)) errs.push(`${mw} has no label`);
        if(m.prompt !== undefined && typeof m.prompt !== 'string') errs.push(`${mw}: prompt is not text`);
        const asks = [].concat(m.ask);
        if(!asks.length) errs.push(`${mw} has no ask column`);
        asks.forEach(k => need(k, `${m.id} ask`));
        need(m.answer, `${m.id} answer`);
        for(const f of ['near', 'distinct', 'alts']) if(m[f] !== undefined) need(m[f], `${m.id} ${f}`);
        if(m.options !== undefined && !(Number.isInteger(m.options) && m.options >= 2 && m.options <= 8)) errs.push(`${mw}: options is not a whole number from 2 to 8`);
        let items = 0; const answers = new Set();
        t.rows.forEach(r => {
          const cells = asks.concat([m.answer]).map(k => r[k]);
          if(!cells.every(v => typeof v === 'string' ? v !== '' : Array.isArray(v) && v.length)) return;
          const lens = new Set(cells.filter(Array.isArray).map(v => v.length));
          if(lens.size > 1){ errs.push(`${mw}: row ${r.id} has lists of different lengths in the columns it reads`); return; }
          const n2 = lens.size ? [...lens][0] : 1;
          items += n2;
          for(let j = 0; j < n2; j++) answers.add(Array.isArray(r[m.answer]) ? r[m.answer][j] : r[m.answer]);
        });
        if(items < 2) errs.push(`${mw} has fewer than 2 items (rows with its ask and answer columns)`);
        else if(answers.size < 2) errs.push(`${mw}: every item has the same answer, so there is nothing to choose between`);
        counts[m.id] = items;
      });
      out.push({id: t.id, rows: t.rows.length, modes: counts});
    });
  }
}
if(errs.length) throw new Error(errs.slice(0, 6).join('; ') + (errs.length > 6 ? ` (and ${errs.length - 6} more)` : ''));
STEP = {sets: sets ? sets.length : 0, pairs, tables: out};
