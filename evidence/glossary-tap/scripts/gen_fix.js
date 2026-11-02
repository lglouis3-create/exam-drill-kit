/* Builds the glossary-tap test fixtures from the read-only course clones and
   compares the existing FIX entries with the course files.
   node gen_fix.js <kit worktree> <out dir>
   - FIX: the 8 Intro to Pharmacology terms, 2 questions and guide excerpt already
     in test.js (checked unchanged against 929cd62), plus term cheese-effect and
     questions L10-030 and T-affinity-3 (quoted words), same fields left out.
   - FIXPK: 7 Basic-Pharmacokinetics terms and question ws6-i3-2c at ac2eb73. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const [KIT, OUT] = process.argv.slice(2);
const IP = '/tmp/ip-readonly/exam1-drill/src', PK = '/tmp/pk-readonly/src';
const load = (file, expr, extra) => { const c = Object.assign({QUESTIONS: [], TOPICS: [], COURSE: {}, CHAINS: [], WORKSHEETS: [], OBJECTIVES: []}, extra || {});
  vm.createContext(c); vm.runInContext(fs.readFileSync(file, 'utf8') + ';this.__X = ' + expr, c); return c.__X; };
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const test = fs.readFileSync(path.join(KIT, 'features/glossary-tap/current/test.js'), 'utf8');
const FIX = JSON.parse(test.match(/^const FIX = (\{.*\});$/m)[1]);

// IP terms and questions
const ipT = load(path.join(IP, 'glossary.js'), 'TERMS');
const dropT = new Set(['lecture', 'fig']);
const termOut = t => Object.fromEntries(Object.entries(t).filter(([k]) => !dropT.has(k)));
const ipQ = {};
for(const f of fs.readdirSync(IP).filter(f => /^q_.*\.js$/.test(f))) try { load(path.join(IP, f), 'QUESTIONS').forEach(q => { ipQ[q.id] = q; }); } catch(e){ console.log('skip', f, e.message); }
const QK = Object.keys(FIX.qs[0]);
let bad = 0;
FIX.terms.forEach(t => { const s = ipT.find(x => x.id === t.id); if(JSON.stringify(termOut(s)) !== JSON.stringify(t)){ bad++; console.log('term differs', t.id); } });
FIX.qs.forEach(q => { const s = ipQ[q.id]; if(JSON.stringify(pick(s, Object.keys(q))) !== JSON.stringify(q)){ bad++; console.log('question differs', q.id); } });
console.log('existing FIX: ' + FIX.terms.length + ' terms, ' + FIX.qs.length + ' questions, ' + bad + ' differ from 929cd62');
const guideSrc = fs.readFileSync(path.join(IP, 'guide.js'), 'utf8');
console.log('existing FIX.guide lines found verbatim in guide.js: ' + FIX.guide.split('\n').filter(l => l.trim()).filter(l => guideSrc.includes(l)).length + ' of ' + FIX.guide.split('\n').filter(l => l.trim()).length);
const NEW = Object.assign({}, FIX, {
  terms: FIX.terms.concat(['cheese-effect', 'rtk'].map(id => termOut(ipT.find(t => t.id === id)))),
  qs: FIX.qs.concat(['L10-030', 'T-affinity-3'].map(id => pick(ipQ[id], QK)))});

// PK terms and question
const pkT = load(path.join(PK, 'glossary.js'), 'TERMS');
const PK_IDS = ['pharmacokinetics', 'elimination', 'bioavailability', 'plasma', 'clearance', 'total-body-clearance', 'nonlinear-pharmacokinetics'];
const dropPK = new Set(['module', 'lecture']);
const pkTerms = PK_IDS.map(id => Object.fromEntries(Object.entries(pkT.find(t => t.id === id)).filter(([k]) => !dropPK.has(k))));
const line = fs.readFileSync(path.join(PK, 'q9_worksheets.js'), 'utf8').split('\n').find(l => l.startsWith('{"id": "ws6-i3-2c"'));
const q = JSON.parse(line.replace(/,\s*$/, ''));
const pkQ = pick(q, ['id', 'tier', 'concept', 'source', 'stem', 'options', 'cite']);
// the course's concept block is {h, list}; the kit's is {h, t}: one section per list item, wording unchanged
pkQ.teach = q.teach.flatMap(s => s.list.map((t, i) => i === 0 ? {h: s.h, t} : {t}));
const FIXPK = {terms: pkTerms, qs: [pkQ]};
fs.writeFileSync(path.join(OUT, 'FIX.json'), JSON.stringify(NEW));
fs.writeFileSync(path.join(OUT, 'FIXPK.json'), JSON.stringify(FIXPK));
console.log('wrote FIX (' + NEW.terms.length + ' terms, ' + NEW.qs.length + ' questions) and FIXPK (' + pkTerms.length + ' terms, 1 question)');
