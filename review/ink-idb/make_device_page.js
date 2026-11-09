// Writes the phone and tablet validation page for worksheet ink in IndexedDB:
//   node make_device_page.js <a built page (index.html)> <output file>
// The page is a course built with this core (Medicinal-chemistry, so the answers sample is the
// 546,993-character profile of #66), with three changes: its storage namespace is
// 'ink-validation' (so it reads and writes none of a drill's keys or databases),
// registerOutside('ink') is added where a module would add it, and the panel below is added.
// Everything it stores is synthetic (generated strokes and answers). "Clean up" removes it.
'use strict';
const fs = require('fs');
const [src, out] = process.argv.slice(2);
if(!src || !out){ console.error('usage: node make_device_page.js <built index.html> <output>'); process.exit(2); }
let html = fs.readFileSync(src, 'utf8');
const A = "/* What this page last read under the profile's own progress and history keys, or wrote";
const NSX = /\bns: *'[A-Za-z0-9_-]+'/;   // the course's own namespace, the first one in the page (COURSE)
if(!html.includes(A) || !NSX.test(html)) { console.error('not a page built with the outside-part layer'); process.exit(1); }
console.log('namespace ' + html.match(NSX)[0] + ' replaced by ns: \'ink-validation\'');
html = html.replace(NSX, "ns: 'ink-validation'").replace(A, "registerOutside('ink');\n" + A);
const panel = `
<div id="vpanel" style="position:fixed;left:0;right:0;bottom:0;max-height:55vh;overflow:auto;z-index:100000;background:#fff;color:#111;border-top:2px solid #1E56C8;font:14px/1.4 -apple-system,system-ui,sans-serif;padding:10px 12px">
  <b>Ink storage validation</b> <span id="vinfo"></span>
  <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">
    <button class="btn" data-s="0">1. Answers at both caps</button>
    <button class="btn" data-s="69">2. + ink, 69 pages</button>
    <button class="btn" data-s="171">3. + ink, 171 pages</button>
    <button class="btn" id="vrun">Run 3 rounds of 5 saves</button>
    <button class="btn" id="vtap" style="min-width:120px;min-height:48px;background:#1E56C8;color:#fff">Tap here: 0</button>
    <button class="btn" id="vcheck">Check after reload</button>
    <button class="btn" id="vquota">Storage-full test</button>
    <button class="btn" id="vcopy">Copy results</button>
    <button class="btn ghost" id="vclean">Clean up</button>
  </div>
  <div id="vstate"></div>
  <pre id="vout" style="white-space:pre-wrap;font-size:12px;margin:6px 0 0"></pre>
</div>
<script>
(() => {
  // the results are kept in this test site's localStorage, so a reload keeps them ("Clean up" removes them)
  const RK = NS + ':vres', $ = s => document.querySelector(s);
  let R = []; try { R = JSON.parse(localStorage.getItem(RK) || '[]') || []; } catch(e){ R = []; }
  window.__vres = R;
  const show = () => { $('#vout').textContent = R.map(x => JSON.stringify(x)).join('\\n'); };
  const log = o => { o.at = new Date().toISOString(); R.push(o); try { localStorage.setItem(RK, JSON.stringify(R)); } catch(e){} show(); };
  show();
  const say = t => { $('#vstate').textContent = t; };
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const walk = pages => { const ink = {};
    for(let g = 0; g < pages; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
      ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
    return ink; };
  const ET = typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes || []).includes('event');
  $('#vinfo').textContent = ' · ' + navigator.userAgent.replace(/^Mozilla\\/5.0 /, '') + ' · Event Timing: ' + (ET ? 'yes' : 'no') + ' · database: ' + OUT.state;
  const taps = [], evs = {};
  if(ET) new PerformanceObserver(l => { for(const e of l.getEntries()) if(e.interactionId) evs[e.interactionId] = Math.max(evs[e.interactionId] || 0, e.duration); }).observe({type: 'event', durationThreshold: 16});
  let nTap = 0;
  $('#vtap').addEventListener('click', e => { nTap++; $('#vtap').textContent = 'Tap here: ' + nTap; const ts = e.timeStamp;
    requestAnimationFrame(() => requestAnimationFrame(() => taps.push(performance.now() - ts))); });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const allSaved = async (ks, limit) => { const t0 = performance.now(); while(ks.some(k => outsideState('ink', k) === 'saving') && performance.now() - t0 < (limit || 120000)) await wait(20);
    return ks.filter(k => outsideState('ink', k) !== 'saved'); };
  const pct = (a, p) => { if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]); };
  let sample = '';
  document.querySelectorAll('#vpanel [data-s]').forEach(b => b.onclick = async () => {
    await outsideReady();
    const n = +b.dataset.s; say('preparing…');
    if(DB.answers.length < 4000){ for(let i = 0; i < 5000; i++){ const q = QUESTIONS[(i * 7) % QUESTIONS.length]; record(q, i % 4 === 3 ? 'wrong' : 'correct', 0, 4000); } }
    seed = 12345; walk(60); for(let i = 0; i < 8000; i++) rnd();
    const w69 = walk(69); walk(100); walk(150); const w171 = n === 171 ? walk(171) : null;
    DB.ink = n === 0 ? {} : JSON.parse(JSON.stringify(n === 69 ? w69 : w171));
    save(); saveNow();
    const bad = await allSaved(Object.keys(DB.ink));
    sample = n === 0 ? 'answers at both caps' : 'answers + ink ' + n + ' pages';
    const o = {step: 'prepare', sample, progressChars: (localStorage.getItem(keyFor(PROFILE)) || '').length, inkChars: JSON.stringify(DB.ink).length, pages: Object.keys(DB.ink).length, notSaved: bad.length, states: [...new Set(Object.keys(DB.ink).map(k => outsideState('ink', k)))]};
    log(o); say(bad.length ? 'prepared, but ' + bad.length + ' pages were not saved' : 'prepared: ' + sample + '. Now press "Run", and tap the blue button about 8 times after each save.');
  });
  $('#vrun').onclick = async () => {
    if(!sample){ say('Prepare a sample first.'); return; }
    for(let round = 1; round <= 3; round++){
      const calls = [], commits = [], states = []; taps.length = 0; for(const k in evs) delete evs[k];
      for(let i = 0; i < 5; i++){
        say('round ' + round + ', save ' + (i + 1) + ' of 5: tap the blue button now');
        const ks = Object.keys(DB.ink); const k = ks.length ? ks[(round * 5 + i) % ks.length] : 'probe';
        const old = DB.ink[k] || {parts: {work: []}, room: {}, at: 0};
        DB.ink[k] = {parts: {work: old.parts.work.concat([{t: 'pen', c: '#111111', w: 0.00305, p: [0.1, 0.1 + i / 100, 0.2, 0.2]}])}, room: old.room, at: Date.now()};
        const t = performance.now(); save(); calls.push(performance.now() - t);
        await allSaved([k], 30000); commits.push(performance.now() - t); states.push(outsideState('ink', k));
        await wait(2500);
      }
      const ev = Object.values(evs);
      log({step: 'run', sample, round, saveCallMs: {median: pct(calls, 50), max: pct(calls, 100)}, commitMs: {median: pct(commits, 50), max: pct(commits, 100)}, states: [...new Set(states)],
        taps: taps.length, tapToSecondFrameMs: {median: pct(taps, 50), max: pct(taps, 100)}, eventTiming: ET ? {entries16msOrMore: ev.length, max: pct(ev, 100)} : 'not supported'});
    }
    say('done: press "Copy results", or reload the page and press "Check after reload".');
  };
  $('#vcheck').onclick = async () => {
    await outsideReady();
    const ks = Object.keys(DB.ink || {});
    log({step: 'after reload', pages: ks.length, strokes: ks.reduce((n, k) => n + ((DB.ink[k].parts || {}).work || []).length, 0), states: [...new Set(ks.map(k => outsideState('ink', k)))], progressAnswers: DB.answers.length, database: OUT.state});
    say('checked.');
  };
  $('#vquota').onclick = async () => {
    if(!confirm('This fills this site\\'s storage with test writing until the browser refuses it. Use it only on the separate test site, never on lglouis3-create.github.io. Continue?')) return;
    await outsideReady(); say('filling…');
    const base = JSON.stringify(DB.ink || {}).length; let n = 0, refused = '', reported = '';
    seed = 999;
    while(n < 4000){
      const page = walk(10); for(const k of Object.keys(page)) DB.ink['fill' + n + k] = page[k];
      save(); const ks = Object.keys(page).map(k => 'fill' + n + k); const bad = await allSaved(ks, 60000); n++;
      if(bad.length){ refused = outsideState('ink', bad[0]); reported = document.getElementById('outwarn') ? document.getElementById('outwarn').textContent.slice(0, 80) : ''; break; }
      if(n % 10 === 0) say('filling… ' + n * 10 + ' pages');
    }
    const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : {};
    log({step: 'storage full', pagesAdded: n * 10, firstRefusedState: refused, notice: reported, usage: est.usage, quota: est.quota, progressStillStored: localStorage.getItem(keyFor(PROFILE)) !== null});
    say(refused ? 'the browser refused a write: reload, then press "Check after reload", then "Clean up".' : 'no refusal after ' + n * 10 + ' pages.');
  };
  $('#vcopy').onclick = () => { const t = R.map(x => JSON.stringify(x)).join('\\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => say('copied.'), () => { say('select the text below and copy it.'); }); };
  $('#vclean').onclick = async () => {
    if(!confirm('Remove everything this page stored (its test profile and database)?')) return;
    try { for(let i = localStorage.length - 1; i >= 0; i--){ const k = localStorage.key(i); if(k.startsWith(NS + ':')) localStorage.removeItem(k); } } catch(e){}
    try { if(OUT.db) OUT.db.close(); } catch(e){}
    const r = indexedDB.deleteDatabase(outsideDbName(NS)); r.onsuccess = r.onerror = r.onblocked = () => { say('removed; reload the page to start again.'); };
  };
})();
</script>`;
const i = html.lastIndexOf('</body>');
html = html.slice(0, i) + panel + '\n' + html.slice(i);
fs.writeFileSync(out, html);
console.log(`wrote ${out}: ${html.length} characters`);
