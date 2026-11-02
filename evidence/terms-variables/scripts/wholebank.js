// Whole-bank comparison: Basic-Pharmacokinetics' own termQuestions/varQuestions (src/views.js at
// ac2eb73, read-only clone) against the module's, on PK's whole bank, TERMS and ASKS. shuffle is the
// identity in both, so ids, stems and keyed answers can be compared one to one.
//   node wholebank.js <module js>
const fs = require('fs'), vm = require('vm');
const pk = require('./loadpk.js');
const views = fs.readFileSync('/tmp/pk-readonly/src/views.js', 'utf8').split('\n');
// PK lines 1037-1136: TERM_BY .. VAR_QS
const start = views.findIndex(l => l.startsWith('const TERM_BY = ')), end = views.findIndex(l => l.startsWith('const VAR_QS = varQuestions();'));
const pkCode = views.slice(start, end + 1).join('\n');
const base = () => ({COURSE: pk.COURSE, TERMS: pk.TERMS, QUESTIONS: pk.QUESTIONS, ASKS: pk.ASKS, shuffle: a => a, qType: q => q.type || 'mc', console});
const P = vm.runInNewContext(pkCode + '\n;({TERM_QS, VAR_QS, VAR_FAMILY, VAR_NAMES, VAR_TWINS, askSentence})', base());
let api = null;
const X = {tab(){}, rendered(){}, api(a){ api = a; }};
const OPT = {label: 'Terms', before: 'settings', groups: {}, families: P.VAR_FAMILY, names: P.VAR_NAMES, twins: P.VAR_TWINS, cite: 'x', skill: ''};
const ctx = Object.assign(base(), {X, OPT, FX: {api: () => null}, esc: s => s, show(){}, record(){}, nextQuestion(){}, Q: null, document: {}});
vm.runInNewContext(fs.readFileSync(process.argv[2], 'utf8'), ctx);
const key = q => (q.options.find(o => o.correct) || {}).t;
function cmp(label, a, b){
  const ia = a.map(q => q.id), ib = b.map(q => q.id);
  const same = JSON.stringify(ia) === JSON.stringify(ib);
  const by = Object.fromEntries(b.map(q => [q.id, q]));
  const stem = a.filter(q => by[q.id] && by[q.id].stem.replace(/her problems/, "the professor's problems") !== q.stem.replace(/her problems/, "the professor's problems")).map(q => q.id);
  const keyed = a.filter(q => by[q.id] && key(by[q.id]) !== key(q)).map(q => q.id);
  console.log(`${label}: PK ${a.length}, module ${b.length}; same ids in the same order: ${same}; stems differing: ${stem.length}; keyed answers differing: ${keyed.length}` +
    (stem.length ? ' e.g. ' + stem.slice(0, 3).join(', ') : '') + (keyed.length ? ' e.g. ' + keyed.slice(0, 3).join(', ') : ''));
  return same && !stem.length && !keyed.length;
}
const okT = cmp('term questions', P.TERM_QS, api.termQs);
const okV = cmp('variable questions', P.VAR_QS, api.varQs);
const nums = pk.QUESTIONS.filter(q => q.type === 'numeric');
const differ = nums.filter(q => P.askSentence(q.stem) !== api.askSentence(q.stem)).length;
console.log(`question sentence: ${nums.length} numeric stems, ${differ} differ; ${P.VAR_QS.filter(q => q.fromQ).length} stem-sentence questions, ${Object.keys(P.VAR_FAMILY).filter(k => pk.ASKS[k]).length} symbols; ${pk.TERMS.length} terms`);
process.exit(okT && okV && !differ ? 0 : 1);
