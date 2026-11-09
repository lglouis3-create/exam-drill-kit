/* compare-tab: write the BDK_FACTS line of current/test.js from BDK's own files.
 *
 *     node features/compare-tab/ci/bdk_facts.js <BDK checkout at 05c36c3> > bdk_facts.line
 *
 * Reads BDK's assets/app.js and data/decks.json. Its functions splitDepth0 (lines
 * 108-120) and itemsOf (273-280) are taken from app.js as written and run; the rest is
 * BDK's code copied here: loadData's facts from the flashcards (EK_Q line 281, lines
 * 302-324), resolveSeeAbove's two loops on the facts (331-336, 342-347; its middle loop,
 * 337-341, changes cards only), and factList (2294-2299) for each of COMPARE_ROWS'
 * keys (2290-2293). Prints `const BDK_FACTS = {"<page>:<index>": {cat, brand, cls, ind,
 * kse, bw, notes, org}, ...};`, the lists BDK's Compare shows for each drug.
 * It is not run by the checks; it is how the line in test.js was made (2026-11-08).
 */
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
if(!dir){ console.error('usage: node bdk_facts.js <BDK checkout>'); process.exit(2); }
const app = fs.readFileSync(path.join(dir, 'assets', 'app.js'), 'utf8');
const deck = JSON.parse(fs.readFileSync(path.join(dir, 'data', 'decks.json'), 'utf8'));
const take = name => { const m = app.match(new RegExp('function ' + name + '[\\s\\S]*?\\n  }\\n')); if(!m) throw new Error('app.js has no function ' + name); return m[0]; };
const splitDepth0 = new Function(take('splitDepth0') + '; return splitDepth0;')();
const itemsOf = new Function('splitDepth0', take('itemsOf') + '; return itemsOf;')(splitDepth0);
const EK_Q = /^What (?:is|are) the (Key Side Effects?|US Boxed Warnings?|Other Notes?)(?: (\([^)]*\)))? (?:of|for) /;
const PAGES = deck.pages;
for(const p of PAGES){
  p.drugs.forEach(d => { d.facts = {kse: [], bw: [], notes: [], ind: [], org: [], cls: []}; });
  p.cards.forEach(c => {
    c.items = itemsOf(c);
    const list = c.items || [c.a];
    if(c.k === 'indication') c.d.forEach(di => { p.drugs[di].facts.ind = list; });
    else if(c.k === 'classification') c.d.forEach(di => { p.drugs[di].facts.cls = list; });
    else if(c.k === 'category') c.d.forEach(di => { p.drugs[di].facts.cat = c.a; });
    else if(c.k === 'organism') c.d.forEach(di => { p.drugs[di].facts.org = list; });
    else if(c.f === 'EssentialKnowledge'){
      const m = c.q.match(EK_Q); if(!m) return;
      const key = m[1].startsWith('Key') ? 'kse' : m[1].startsWith('US') ? 'bw' : 'notes';
      const q = m[2] ? `${m[2]} ` : '';
      const its = (c.items || [c.a]).map(x => q + x);
      c.d.forEach(di => p.drugs[di].facts[key].push(...its));
    }
  });
}
const shared = {};
for(const p of PAGES) for(const d of p.drugs) for(const it of d.facts.bw){
  const m = it.match(/^(\([^)]*\)) (.*)$/);
  if(m && !/^See above/i.test(m[2])) (shared[m[1]] = shared[m[1]] || {page: p, items: new Set()}).items.add(m[2]);
}
for(const p of PAGES) for(const d of p.drugs) d.facts.bw = d.facts.bw.flatMap(it => {
  const m = it.match(/^(\([^)]*\)) See above/i);
  return m && shared[m[1]] ? [...shared[m[1]].items].map(x => `${m[1]} ${x}`) : [it];
});
function factList(d, key){
  if(key === 'brand') return d.brand && d.brand !== '---' ? [d.brand] : [];
  if(key === 'cat') return d.facts.cat ? [d.facts.cat] : [];
  if(key === 'cls') return d.facts.cls.length ? d.facts.cls : ['Rx only'];
  return d.facts[key] || [];
}
const KEYS = ['cat', 'brand', 'cls', 'ind', 'kse', 'bw', 'notes', 'org'];
const out = {};
for(const p of PAGES) p.drugs.forEach((d, i) => { out[p.page + ':' + i] = Object.fromEntries(KEYS.map(k => [k, factList(d, k)])); });
process.stdout.write('const BDK_FACTS = ' + JSON.stringify(out) + ';\n');
