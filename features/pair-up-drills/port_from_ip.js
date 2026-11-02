/* port_from_ip.js: writes the test fixture of pair-up-drills (the `const IP = ...;`
   line of current/test.js) from Intro to Pharmacology's own files.

       node features/pair-up-drills/port_from_ip.js /tmp/ip-readonly/exam1-drill/src

   It reads, at Intro-Pharmacology- 929cd62:
   - app.js: PAIR_SETS and pairDrugs (the Pair up sets), the drug-receptor drill's
     row helpers (rxRows, rxKey, rxLabel, rxRecText, rxSig, rxFlip, rxAsk) and the
     poisoning table drill's helpers (ptAnti, ptAntiLabel, PT_LONG, ptMoaText,
     ptItems, ptCellText), taken out of the file by their names and run as they are;
   - drugs.js (DRUGS_ALL) and poison_table.js (POISON_TABLE).
   Each piece starts at an exact marker that must be found once and ends at the next
   end marker, so a changed app.js stops this script instead of giving a different fixture.

   What it writes: the Pair up sets with their chips, boxes and reasons as
   Intro to Pharmacology has them (the drug set as pairDrugs builds it from the
   table); the drug table and the poisoning table as RECALL_TABLES rows, every cell
   the text Intro to Pharmacology's drill shows for it (HTML tags taken out, as the
   drill does); and `expect`: the items Intro to Pharmacology's own ptItems builds
   per mode, and per drug its answer line, flipped line and receptor-plus-action,
   which the module's test compares with what the module builds. The "See the
   figure" links of Pair up are left out (they open Intro to Pharmacology's own
   diagrams). Row and set ids get the prefix ip-. It is not copied into a course. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = process.argv[2];
if(!SRC) { console.error('usage: node port_from_ip.js <Intro-Pharmacology exam1-drill/src>'); process.exit(2); }
const app = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
function cut(from, to){
  const a = app.indexOf(from), a2 = app.indexOf(from, a + 1);
  if(a < 0 || a2 >= 0) throw new Error('marker not found exactly once: ' + from.slice(0, 60));
  const b = app.indexOf(to, a + from.length);   // the first end marker after the start
  if(b < 0) throw new Error('end marker not found after ' + from.slice(0, 60));
  return app.slice(a, b);
}
const code = [
  cut('const PAIR_SETS = [', 'const PR = {set:'),
  cut('const drName = r =>', '\n'),
  cut('const RX_RECS = [', 'const RX = {mode:'),
  cut('const rxRecText = r =>', 'function rxAnswers('),
  cut('const rxAsk = r =>', 'function vRxq()'),
  cut('const ptRows = () =>', 'const PT = {mode:'),
  cut('function ptCellText(k) {', 'function ptCheck(n) {'),
].join('\n');
const ctx = {console};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SRC, 'drugs.js'), 'utf8') + '\n' + fs.readFileSync(path.join(SRC, 'poison_table.js'), 'utf8') +
  '\n' + code + `
this.out = {PAIR_SETS, pairDrugs, DRUGS_ALL, POISON_TABLE, rxRows, rxKey, rxLabel, rxRecText, rxSig, rxFlip, rxAsk,
            ptAnti, ptAntiLabel, PT_LONG, ptMoaText, ptItems, ptCellText, drName};`, ctx);
const O = ctx.out, P = 'ip-';
const plain = s => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* Pair up: [chip, box, why]; the fourth field (a link into Intro to Pharmacology's diagrams) is dropped */
const pairSets = O.PAIR_SETS.map(s => {
  const o = {id: P + s.id, name: s.name, cite: s.cite, pairs: (s.pairs || O.pairDrugs()).map(p => [p[0], p[1], p[2]])};
  if(s.bins) o.bins = true;
  return o;
});

/* the drug-receptor table: the rows Intro to Pharmacology's drill asks (rxRows) */
const rxRows = O.rxRows().map(r => {
  const row = {id: P + r.id, name: plain(r.name), sec: r.sec, line: O.rxSig(r), ask: O.rxAsk(r),
               key: O.rxLabel(O.rxKey(r)[0], O.rxKey(r)[2]), cls: r.clsLabel + (r.sub.length ? ' · ' + r.sub.join(', ') : ''),
               rec: plain(r.rec), soa: plain(r.soa), moa: plain(r.moa)};
  const f = O.rxFlip(r); if(f) row.flip = f;
  if(r.why) row.why = plain(r.why);
  return row;
});
const rxTable = {id: 'ip-rx', tab: 'Drug ↔ receptor', title: 'Drug ↔ receptor',
  intro: 'Every drug on the Exam 2 table, one at a time. Name the receptor: the drug is shown with five answers written the way the drug table writes them; tap the one that is the table\'s own line. Name the drug: a receptor, action and site are shown; tap the drug. A miss comes back at the end of the round and leads the next one.',
  cite: 'the Exam 2 drug table (All drugs page), built from the professor\'s slides and the official list',
  name: 'name',
  columns: [['line', 'The table\'s line'], ['cls', 'Class'], ['rec', 'Receptor'], ['soa', 'Site'], ['moa', 'Mechanism'], ['why', 'Why']],
  covers: [['all', 'Cover the line and the class', ['line', 'cls']]],
  modes: [
    {id: 'rec', label: 'Name the receptor', ask: 'name', answer: 'line', prompt: 'Which receptor does it act on, and how? Pick one.', options: 5, near: 'sec', alts: 'flip'},
    {id: 'drug', label: 'Name the drug', ask: 'ask', answer: 'name', prompt: 'Which drug is this?', options: 4, near: 'sec', distinct: 'key'}],
  rows: rxRows};

/* the poisoning table: one row per row of the key, every cell as the drill shows it */
const ptRowsOut = O.POISON_TABLE.map(r => {
  const row = {id: P + r.id, poison: r.poison, poison_od: r.poison + ' overdose', sym: r.sym, antidotes: O.ptAntiLabel(r),
               moa: O.ptCellText(r.id + ':moa'), ref: r.ref};
  if(!r.same){ row.antidote = r.anti.map(a => O.PT_LONG[a[0]] || a[0]); row.mechanism = r.anti.map(a => O.ptMoaText(r, a)); }
  if(r.special.length){ row.special_q = r.special.map(s => s[0]).join(' '); row.special = r.special.map(s => s[1]).join(' ');
                        row.special_ask = `${r.poison}: ${row.special_q}`; }
  return row;
});
const ptTable = {id: 'ip-pt', tab: 'Poisoning table', title: 'Poisoning table',
  intro: 'The professor\'s Poisoning Treatment Table 2026 key, row by row, in the professor\'s wording. Pick a mode; a miss comes back at the end of the round and leads the next one.',
  cite: 'PoisoningTreatmentTable2026KEY.pdf, the professor\'s posted key (pages 1–3)',
  name: 'poison',
  columns: [['sym', 'Symptoms of acute poisoning / diagnostic methods'], ['antidotes', 'Antidote(s)'], ['moa', 'MOA of antidote(s)'],
            ['special_q', 'Special considerations: the question'], ['special', 'Special considerations: the professor\'s answer'], ['ref', 'Reference column']],
  covers: [['all', 'Cover every cell', ['sym', 'antidotes', 'moa', 'special']], ['antimoa', 'Cover antidote + mechanism', ['antidotes', 'moa']], ['sym', 'Cover symptoms', ['sym']]],
  modes: [
    {id: 'anti', label: 'Name the antidote', ask: 'poison', answer: 'antidotes', prompt: 'Antidote(s) in the professor\'s table?'},
    {id: 'moa', label: 'Name the mechanism', ask: ['antidote', 'poison_od'], answer: 'mechanism', prompt: 'Mechanism of this antidote in the professor\'s table?'},
    {id: 'poison', label: 'Name the poison', ask: 'sym', answer: 'poison', prompt: 'Which overdose has these symptoms or diagnostic methods in the professor\'s table?'},
    {id: 'special', label: 'The professor\'s special questions', ask: 'special_ask', answer: 'special', prompt: 'The professor\'s answer in the key?'}],
  rows: ptRowsOut};

const expect = {
  pt: Object.fromEntries(['anti', 'moa', 'poison', 'special'].map(m => [m, O.ptItems(m).map(x => [x.ask, x.ans])])),
  rx: Object.fromEntries(O.rxRows().map(r => [P + r.id, [O.rxSig(r), O.rxFlip(r), O.rxLabel(O.rxKey(r)[0], O.rxKey(r)[2])]])),
  pairDrugs: O.pairDrugs().length,
};
const IP = {pairSets, tables: [rxTable, ptTable], expect};
const line = 'const IP = ' + JSON.stringify(IP) + ';';
if(/Smith/.test(line)) throw new Error('a personal name is in the fixture');
const test = path.join(__dirname, 'current', 'test.js');
const t = fs.readFileSync(test, 'utf8'), m = t.match(/^const IP = .*;$/m);
if(!m) throw new Error('current/test.js has no `const IP = ...;` line');
fs.writeFileSync(test, t.replace(m[0], () => line));
console.log(`wrote the fixture: ${pairSets.length} pair sets (${pairSets.map(s => s.pairs.length).join(', ')} pairs), ` +
            `${rxRows.length} drug rows, ${ptRowsOut.length} poisoning rows`);
