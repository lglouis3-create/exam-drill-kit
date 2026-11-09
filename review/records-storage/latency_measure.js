// Kit #66, Louis's order of 2026-11-06 item 5, revised after the review of b8017ca. In the page,
// for each progress sample, CPU throttling rate and save variant, 5 saves with 8 clicks 40 ms
// apart after each change, repeated 3 times (runs):
//   the save's main-thread work (the core's saveProgress: JSON.stringify of the progress, its
//   write, and the record's write or compression), long tasks over 50 ms, the Event Timing
//   click-to-next-paint delay, writes the browser refused, and the keys stored afterwards.
// Variants (test harnesses injected into this scratch page only; nothing here is in core/; the
// compressed record cannot be placed by the core, so one tab is opened and no record is placed):
//   A  today's save: the progress and this tab's full record
//   F  compress on every save: the record compressed in the page (fflate deflateSync level 6,
//      then 15-bit packing)
//   T  threshold variant: the record compressed only when three full copies of it, with the
//      origin's other keys, would not fit in 5,242,859 characters (logs/quota-probe.log);
//      otherwise today's full copy
//   W  the compression of F in a Worker; the page writes the record when the Worker answers.
//      Chromium refuses CPU throttling for a Worker (logs/worker-throttle-probe.log): at rates 4
//      and 6 only the page is slowed, and the Worker runs at full speed.
// Then the main-thread time of an IndexedDB put of the progress text (the call itself, which
// copies the value, and the time to the transaction's complete event), 5 times, median.
// Chromium, CPU throttling rates 1, 4 and 6 (Chrome DevTools Protocol): a slowed desktop CPU,
// not a phone. Samples: compress_estimate.js's generators (generated data, not Louis's
// progress); the random-walk generator with more pages gives the larger sizes.
// Run from a built scratch course's src/: node <this file> <dir holding node_modules/fflate@0.8.2>
'use strict';
const path = require('path'), fs = require('fs');
const L = require(path.join(process.cwd(), 'check_lib.js'));
const LIBS = process.argv[2];
const ff = fs.readFileSync(path.join(LIBS, 'node_modules/fflate/umd/index.js'), 'utf8');
const ffVer = JSON.parse(fs.readFileSync(path.join(LIBS, 'node_modules/fflate/package.json'), 'utf8')).version;
const SMOKE = process.env.LAT_SMOKE === '1';
const SAVES = SMOKE ? 2 : 5, CLICK_GAP = 40, CLICKS = 8, RUNS = SMOKE ? 1 : 3, RATES = SMOKE ? [4] : (process.env.LAT_RATES ? process.env.LAT_RATES.split(',').map(Number) : [1, 4, 6]),
  MODES = process.env.LAT_MODES ? process.env.LAT_MODES.split(',') : ['A', 'F', 'T', 'W'];   // LAT_RATES, LAT_MODES: a subset, one sample at a time
const QUOTA = 5242859;

let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const porter = () => { const ink = {}; const mk = (seed, n) => { const p = []; for(let i = 0; i < n; i++) p.push(+(0.05 + ((seed * 7 + i * 13) % 900) / 1000).toFixed(4), +(0.05 + ((seed * 11 + i * 17) % 900) / 1000).toFixed(4)); return {t: 'pen', c: '#111111', w: 0.00305, p}; };
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++) ss.push(mk(g * 30 + j, 60)); ink['q:s1-' + (g % 7 + 1) + '|bulk' + Math.floor(g / 7)] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  return {ink}; };
const walk = pages => { const ink = {};
  for(let g = 0; g < pages; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
    ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  return {ink}; };
const answersSample = () => { const answers = [], concepts = {}; const t0 = 1793974599362;
  for(let i = 0; i < 4000; i++){ const c = 'concept-' + (i % 600), q = 'L' + (1 + i % 18) + '-' + String(i % 900).padStart(3, '0');
    answers.push({qid: q, concept: c, result: rnd() < 0.7 ? 'correct' : 'wrong', at: t0 + i * 41000 + Math.floor(rnd() * 9000), qn: i + 1, ms: 3000 + Math.floor(rnd() * 40000)});
    const s = concepts[c] = concepts[c] || {seen: 0, correct: 0, wrong: 0, guessed: 0, streak: 0, box: 0, dueAt: 0, dueQ: 0, lastQ: 0, asked: [], last: {}};
    s.seen++; s.correct += 1; s.box = Math.min(5, s.box + 1); s.dueAt = t0 + i * 41000 + 86400000; s.dueQ = i + 9; s.lastQ = i + 1; if(!s.asked.includes(q)) s.asked.push(q); s.last[q] = i + 1; }
  return {answers, concepts}; };
// generated in the same order as compress_estimate.js, so the first three equal its samples
const SAMPLES = [['ink, porter', porter()], ['ink, random walk 60 pages', walk(60)], ['answers', answersSample()],
  ['ink, random walk 69 pages', walk(69)], ['ink, random walk 100 pages', walk(100)], ['ink, random walk 150 pages', walk(150)], ['ink, random walk 171 pages', walk(171)]];

const SETUP = ({ffSrc, quota}) => {
  const H = window.__lat = {mode: 'A', saves: [], long: [], events: [], recWrites: [], refused: {progress: 0, record: 0}};
  new PerformanceObserver(l => { for(const e of l.getEntries()) H.long.push({t: e.startTime, d: e.duration}); }).observe({type: 'longtask', buffered: false});
  new PerformanceObserver(l => { for(const e of l.getEntries()) if(e.name === 'pointerdown' || e.name === 'click' || e.name === 'pointerup')
    H.events.push({name: e.name, t: e.startTime, d: e.duration, delay: e.processingStart - e.startTime, id: e.interactionId}); }).observe({type: 'event', durationThreshold: 16, buffered: false});
  const b = document.createElement('button'); b.id = 'lat-btn'; b.textContent = '0';
  b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;width:80px;height:40px';
  b.addEventListener('click', () => { b.textContent = String(+b.textContent + 1); });
  document.body.appendChild(b);
  const pack = u8 => { let out = [], acc = 0, n = 0; const parts = [];
    for(let i = 0; i < u8.length; i++){ acc = (acc << 8) | u8[i]; n += 8; if(n >= 15){ n -= 15; out.push(32 + ((acc >>> n) & 0x7fff)); acc &= (1 << n) - 1; if(out.length >= 8192){ parts.push(String.fromCharCode.apply(null, out)); out = []; } } }
    if(n > 0) out.push(32 + ((acc << (15 - n)) & 0x7fff)); parts.push(String.fromCharCode.apply(null, out)); return parts.join(''); };
  (0, eval)(ffSrc);
  const enc = new TextEncoder();
  const compress = v => { const t = performance.now(); const z = pack(fflate.deflateSync(enc.encode(v), {level: 6})); return [z, performance.now() - t]; };
  const wsrc = ffSrc + '\n;const pack=' + pack.toString() + ';const enc=new TextEncoder();onmessage=e=>{const t=performance.now();const z=pack(fflate.deflateSync(enc.encode(e.data.v),{level:6}));postMessage({k:e.data.k,z,t0:e.data.t0,ms:performance.now()-t});};';
  const worker = new Worker(URL.createObjectURL(new Blob([wsrc], {type: 'text/javascript'})));
  const set = Storage.prototype.setItem;
  const kind = k => k.includes(':pending:') ? 'record' : k === keyFor(PROFILE) ? 'progress' : 'other';
  const trySet = (s, k, v) => { try { return set.call(s, k, v); } catch(e){ const c = kind(k); if(c in H.refused) H.refused[c]++; throw e; } };
  worker.onmessage = e => { const t = performance.now(); let ok = true; try { trySet(localStorage, e.data.k, '{"z":' + JSON.stringify(e.data.z) + '}'); } catch(err){ ok = false; }
    H.recWrites.push({queued: e.data.t0, stored: performance.now(), write: performance.now() - t, workerMs: e.data.ms, ok}); };
  const others = () => { let n = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(kind(k) === 'other') n += k.length + (localStorage.getItem(k) || '').length; } return n; };
  Storage.prototype.setItem = function(k, v){
    if(this === localStorage && typeof k === 'string' && k.includes(':pending:') && H.mode !== 'A'){
      const big = H.mode !== 'T' || others() + 3 * (k.length + v.length) > quota;
      H.lastCompressed = big;
      if(big && (H.mode === 'F' || H.mode === 'T')){ const [z, ms] = compress(v); H.lastCompress = ms; return trySet(this, k, '{"z":' + JSON.stringify(z) + '}'); }
      if(H.mode === 'W'){ const t0 = performance.now(); worker.postMessage({k, v, t0}); H.lastPost = performance.now() - t0; return; }
    }
    return trySet(this, k, v);
  };
  const sp = window.saveProgress;
  window.saveProgress = function(){ const t = performance.now(); H.lastCompress = 0; H.lastPost = 0; H.lastCompressed = false; const r = sp.apply(this, arguments);
    H.saves.push({start: t, work: performance.now() - t, compress: H.lastCompress, post: H.lastPost, compressed: H.lastCompressed, end: performance.now()}); return r; };
  // the IndexedDB put: the call's own main-thread time (it copies the value) and the time to complete
  window.__idb = async () => {
    const s = localStorage.getItem(keyFor(PROFILE)) || JSON.stringify(DB);
    const db = await new Promise(res => { const o = indexedDB.open('lat-probe', 1); o.onupgradeneeded = () => o.result.createObjectStore('r'); o.onsuccess = () => res(o.result); });
    const call = [], done = [];
    for(let i = 0; i < 5; i++) await new Promise(res => { const a = performance.now(); const tx = db.transaction('r', 'readwrite'); tx.objectStore('r').put(s, 'k'); call.push(performance.now() - a); tx.oncomplete = () => { done.push(performance.now() - a); res(); }; });
    db.close(); await new Promise(res => { const r = indexedDB.deleteDatabase('lat-probe'); r.onsuccess = r.onerror = res; });
    const med = a => a.slice().sort((x, y) => x - y)[2];
    return {chars: s.length, callMs: Math.round(med(call)), completeMs: Math.round(med(done))};
  };
  return {saveProgressWrapped: typeof sp === 'function'};
};

const pct = (a, p) => { if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]); };
const med = a => pct(a, 50);

(async () => {
  console.log(`fflate ${ffVer} deflateSync level 6, 15-bit packing; ${SAVES} saves per run, ${RUNS} runs, ${CLICKS} clicks ${CLICK_GAP} ms apart after each change; Chromium; quota ${QUOTA}`);
  const {browser} = await L.launch('latency_measure');
  const {ctx, page} = await L.openFile(browser);
  await page.waitForFunction(() => typeof DB === 'object' && typeof saveProgress === 'function', null, {timeout: 15000});
  await page.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held', null, {timeout: 10000}).catch(() => {});
  console.log(`setup ${JSON.stringify(await page.evaluate(SETUP, {ffSrc: ff, quota: QUOTA}))}; writer ${await page.evaluate(() => typeof WRITER === 'undefined' ? 'no lock' : WRITER)}`);
  const box = await page.locator('#lat-btn').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const cdp = await ctx.newCDPSession(page);
  // LAT_ONLY=<sample label> measures one sample (used to finish a run after a page crash)
  for(const [label, extra] of SAMPLES.filter(([l]) => !process.env.LAT_ONLY || l === process.env.LAT_ONLY)){
    for(const rate of RATES){
      await cdp.send('Emulation.setCPUThrottlingRate', {rate});
      for(const mode of MODES){
        for(let run = 1; run <= RUNS; run++){
          // the same start for every run: this tab's record removed, the sample placed, the progress
          // written once (that write is not counted)
          const chars = await page.evaluate(([x, m]) => { const H = window.__lat; H.mode = m;
            try { localStorage.removeItem(myPendingKey()); } catch(e){}
            DB.ink = undefined; DB.answers = []; DB.concepts = {}; Object.assign(DB, x); DB.settings.latencyProbe = 0;
            store.set(keyFor(PROFILE), JSON.stringify(DB));   // through the core's store, so its next save is not a stale one
            H.saves = []; H.long = []; H.events = []; H.recWrites = []; H.refused = {progress: 0, record: 0};
            return JSON.stringify(DB).length; }, [extra, mode]);
          await page.waitForTimeout(300);
          const changes = [];
          for(let i = 0; i < SAVES; i++){
            changes.push(await page.evaluate(i => { DB.settings.latencyProbe = i + 1; const t = performance.now(); save(); return t; }, i));
            for(let c = 0; c < CLICKS; c++){ await page.mouse.click(cx, cy); await page.waitForTimeout(CLICK_GAP); }
            await page.waitForTimeout(mode === 'W' ? 1500 : 400);
          }
          await page.waitForTimeout(500);
          const H = await page.evaluate(() => { const H = window.__lat; const k = keyFor(PROFILE), r = myPendingKey();
            const pv = localStorage.getItem(k), rv = localStorage.getItem(r);
            return {saves: H.saves, long: H.long, events: H.events, recWrites: H.recWrites, refused: H.refused,
              stored: {progress: pv === null ? null : pv.length, progressCurrent: pv === JSON.stringify(DB), record: rv === null ? null : rv.length, recordCompressed: rv !== null && rv.startsWith('{"z":')}}; });
          const saves = H.saves.filter(s => s.start >= changes[0] - 1);
          const recs = H.recWrites.filter(r => r.queued >= changes[0] - 1);   // the placement's own write is left out
          const lag = recs.map((r, i) => saves[i] ? r.stored - saves[i].end : null).filter(x => x !== null);
          const ints = {}; for(const e of H.events){ if(!e.id) continue; ints[e.id] = Math.max(ints[e.id] || 0, e.d); }
          const iv = Object.values(ints), all = iv.concat(Array(Math.max(0, SAVES * CLICKS - iv.length)).fill(0));   // no entry: under 16 ms
          const lt = H.long.filter(x => x.d > 50);
          console.log(JSON.stringify({sample: label, chars, rate, mode, run, saves: saves.length, compressedSaves: saves.filter(s => s.compressed).length,
            saveWorkMs: {median: med(saves.map(s => s.work)), max: pct(saves.map(s => s.work), 100)},
            compressMs: mode === 'F' || mode === 'T' ? med(saves.filter(s => s.compressed).map(s => s.compress)) : undefined,
            postMs: mode === 'W' ? med(saves.map(s => s.post)) : undefined,
            worker: mode === 'W' ? {compressMs: med(recs.map(r => r.workerMs)), recordWriteMs: med(recs.map(r => r.write)), recordAfterSaveMs: med(lag), recordAfterSaveMaxMs: pct(lag, 100), written: recs.filter(r => r.ok).length} : undefined,
            longTasks: {count: lt.length, maxMs: lt.length ? Math.round(Math.max(...lt.map(x => x.d))) : 0},
            clicks: {p75Ms: pct(all, 75), maxMs: pct(all, 100)},
            refused: H.refused, stored: H.stored}));
        }
      }
      if(label === 'ink, porter' || label === 'ink, random walk 171 pages' || label === 'answers')
        console.log(JSON.stringify({sample: label, rate, idbPut: await page.evaluate(() => window.__idb())}));
    }
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  }
  await ctx.close(); await browser.close();
})().catch(e => { console.log('FAILED: ' + e.stack); process.exit(1); });
