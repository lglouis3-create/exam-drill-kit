// Kit #66, Louis's order of 2026-11-06 item 5: how long a save takes in the page, the long tasks it
// causes, and how long a click waits for its next paint while saves run, for
//   A  today's save (the progress and this tab's full per-tab record), and
//   F  the same save with the record compressed in the page (fflate deflateSync level 6, then the
//      bytes packed 15 bits to a character), and
//   W  the same compression done in a Worker (the page writes the record when the Worker answers).
// F and W are test harnesses injected into this scratch page only (Storage.prototype.setItem is
// wrapped for the per-tab record's key); nothing here is in core/. The record they write is not
// readable by the core, so only one tab is opened and no record is placed.
// Chromium, CPU throttling rates 1, 4 and 6 (Chrome DevTools Protocol Emulation.setCPUThrottlingRate):
// a slowed desktop CPU, not a phone.
// Run from a built scratch course's src/: node <this file> <dir holding node_modules/fflate@0.8.2>
// Samples: compress_estimate.js's three generators (generated data, not Louis's progress).
'use strict';
const path = require('path'), fs = require('fs');
const L = require(path.join(process.cwd(), 'check_lib.js'));
const LIBS = process.argv[2];
const ff = fs.readFileSync(path.join(LIBS, 'node_modules/fflate/umd/index.js'), 'utf8');
const ffVer = JSON.parse(fs.readFileSync(path.join(LIBS, 'node_modules/fflate/package.json'), 'utf8')).version;
const SAVES = 8, CLICK_GAP = 40, CLICKS = 10;   // per mode, sample and rate: 8 saves, 10 clicks 40 ms apart after each

// the three samples, generated exactly as compress_estimate.js does
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const samples = [];
{ const ink = {}; const mk = (seed, n) => { const p = []; for(let i = 0; i < n; i++) p.push(+(0.05 + ((seed * 7 + i * 13) % 900) / 1000).toFixed(4), +(0.05 + ((seed * 11 + i * 17) % 900) / 1000).toFixed(4)); return {t: 'pen', c: '#111111', w: 0.00305, p}; };
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++) ss.push(mk(g * 30 + j, 60)); ink['q:s1-' + (g % 7 + 1) + '|bulk' + Math.floor(g / 7)] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  samples.push(['ink, the porter\'s generator', {ink}]); }
{ const ink = {};
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
    ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  samples.push(['ink, random-walk strokes', {ink}]); }
{ const answers = [], concepts = {}; const t0 = 1793974599362;
  for(let i = 0; i < 4000; i++){ const c = 'concept-' + (i % 600), q = 'L' + (1 + i % 18) + '-' + String(i % 900).padStart(3, '0');
    answers.push({qid: q, concept: c, result: rnd() < 0.7 ? 'correct' : 'wrong', at: t0 + i * 41000 + Math.floor(rnd() * 9000), qn: i + 1, ms: 3000 + Math.floor(rnd() * 40000)});
    const s = concepts[c] = concepts[c] || {seen: 0, correct: 0, wrong: 0, guessed: 0, streak: 0, box: 0, dueAt: 0, dueQ: 0, lastQ: 0, asked: [], last: {}};
    s.seen++; s.correct += 1; s.box = Math.min(5, s.box + 1); s.dueAt = t0 + i * 41000 + 86400000; s.dueQ = i + 9; s.lastQ = i + 1; if(!s.asked.includes(q)) s.asked.push(q); s.last[q] = i + 1; }
  samples.push(['answers: 4,000 on 600 concepts', {answers, concepts}]); }

// installed once per page: the observers, a button to click, and the F/W record hooks (off until a mode is chosen)
const SETUP = (ffSrc) => {
  const H = window.__lat = {mode: 'A', saves: [], long: [], events: [], recWrites: []};
  new PerformanceObserver(l => { for(const e of l.getEntries()) H.long.push({t: e.startTime, d: e.duration}); }).observe({type: 'longtask', buffered: false});
  new PerformanceObserver(l => { for(const e of l.getEntries()) if(e.name === 'pointerdown' || e.name === 'click' || e.name === 'pointerup')
    H.events.push({name: e.name, t: e.startTime, d: e.duration, delay: e.processingStart - e.startTime, id: e.interactionId}); }).observe({type: 'event', durationThreshold: 16, buffered: false});
  const b = document.createElement('button'); b.id = 'lat-btn'; b.textContent = '0';
  b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;width:80px;height:40px';
  b.addEventListener('click', () => { b.textContent = String(+b.textContent + 1); });
  document.body.appendChild(b);
  // 15-bit packing: every 15 bits of the deflate stream become one character 32..32799 (no surrogates)
  const pack = u8 => { let out = [], acc = 0, n = 0; const parts = [];
    for(let i = 0; i < u8.length; i++){ acc = (acc << 8) | u8[i]; n += 8; if(n >= 15){ n -= 15; out.push(32 + ((acc >>> n) & 0x7fff)); acc &= (1 << n) - 1; if(out.length >= 8192){ parts.push(String.fromCharCode.apply(null, out)); out = []; } } }
    if(n > 0) out.push(32 + ((acc << (15 - n)) & 0x7fff)); parts.push(String.fromCharCode.apply(null, out)); return parts.join(''); };
  (0, eval)(ffSrc);
  const enc = new TextEncoder();
  const compress = v => { const t = performance.now(); const z = pack(fflate.deflateSync(enc.encode(v), {level: 6})); return [z, performance.now() - t]; };
  // the Worker: the same library and packing, posted the record's text
  const wsrc = ffSrc + '\n;const pack=' + pack.toString() + ';const enc=new TextEncoder();onmessage=e=>{const z=pack(fflate.deflateSync(enc.encode(e.data.v),{level:6}));postMessage({k:e.data.k,z,t0:e.data.t0});};';
  const worker = new Worker(URL.createObjectURL(new Blob([wsrc], {type: 'text/javascript'})));
  const set = Storage.prototype.setItem;
  worker.onmessage = e => { const t = performance.now(); set.call(localStorage, e.data.k, '{"z":' + JSON.stringify(e.data.z) + '}'); H.recWrites.push({queued: e.data.t0, stored: performance.now(), write: performance.now() - t, chars: e.data.z.length}); };
  Storage.prototype.setItem = function(k, v){
    if(this === localStorage && typeof k === 'string' && k.includes(':pending:') && H.mode !== 'A'){
      if(H.mode === 'F'){ const [z, ms] = compress(v); H.lastCompress = ms; H.lastRecChars = z.length; return set.call(this, k, '{"z":' + JSON.stringify(z) + '}'); }
      if(H.mode === 'W'){ const t0 = performance.now(); worker.postMessage({k, v, t0}); H.lastPost = performance.now() - t0; return; }
    }
    return set.call(this, k, v);
  };
  // each save's work: the core's saveProgress (JSON.stringify of the progress, its write, and the record's write)
  const sp = window.saveProgress;
  window.saveProgress = function(){ const t = performance.now(); H.lastCompress = 0; H.lastPost = 0; const r = sp.apply(this, arguments);
    H.saves.push({start: t, end: performance.now(), work: performance.now() - t, compress: H.lastCompress, post: H.lastPost}); return r; };
  return {saveProgressWrapped: typeof sp === 'function', worker: true};
};

const pct = (a, p) => { if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]); };
const med = a => pct(a, 50);

(async () => {
  console.log(`fflate ${ffVer} deflateSync level 6, 15-bit packing; ${SAVES} saves per row, ${CLICKS} clicks ${CLICK_GAP} ms apart after each change; Chromium`);
  const {browser} = await L.launch('latency_measure');
  const {ctx, page} = await L.openFile(browser);
  await page.waitForFunction(() => typeof DB === 'object' && typeof saveProgress === 'function', null, {timeout: 15000});
  await page.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held', null, {timeout: 10000}).catch(() => {});
  const setup = await page.evaluate(SETUP, ff);
  const writer = await page.evaluate(() => typeof WRITER === 'undefined' ? 'no lock' : WRITER);
  console.log(`setup ${JSON.stringify(setup)}; writer ${writer}`);
  const box = await page.locator('#lat-btn').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const cdp = await ctx.newCDPSession(page);
  for(const [label, extra] of samples){
    // the sample's parts placed into this page's progress (the module data is carried by the save as is)
    const chars = await page.evaluate(x => { DB.ink = undefined; Object.assign(DB, x); saveProgress(); return JSON.stringify(DB).length; }, extra);
    for(const rate of [1, 4, 6]){
      await cdp.send('Emulation.setCPUThrottlingRate', {rate});
      for(const mode of ['A', 'F', 'W']){
        await page.evaluate(m => { const H = window.__lat; H.mode = m; H.saves = []; H.long = []; H.events = []; H.recWrites = []; }, mode);
        await page.waitForTimeout(300);
        const changes = [];
        for(let i = 0; i < SAVES; i++){
          changes.push(await page.evaluate(i => { DB.settings.latencyProbe = i; const t = performance.now(); save(); return t; }, i));
          for(let c = 0; c < CLICKS; c++){ await page.mouse.click(cx, cy); await page.waitForTimeout(CLICK_GAP); }
          await page.waitForTimeout(mode === 'W' ? 1500 : 400);
        }
        await page.waitForTimeout(500);
        const H = await page.evaluate(() => window.__lat);
        const saves = H.saves.filter(s => s.start >= changes[0] - 1);
        const fromChange = saves.map((s, i) => changes[i] !== undefined ? s.end - changes[i] : null).filter(x => x !== null);
        const rec = H.recWrites.map((r, i) => changes[i] !== undefined ? r.stored - changes[i] : null).filter(x => x !== null);
        const ints = {}; for(const e of H.events){ if(!e.id) continue; ints[e.id] = Math.max(ints[e.id] || 0, e.d); }
        const iv = Object.values(ints); const all = iv.concat(Array(Math.max(0, SAVES * CLICKS - iv.length)).fill(0));   // a click with no entry took under 16 ms (counted as 0)
        const delays = H.events.filter(e => e.name === 'pointerdown').map(e => e.delay);
        const lt = H.long.filter(x => x.d > 50);
        const row = {sample: label, chars, rate, mode, saves: saves.length,
          saveWorkMs: {median: med(saves.map(s => s.work)), max: pct(saves.map(s => s.work), 100)},
          compressMs: mode === 'F' ? med(saves.map(s => s.compress)) : undefined,
          postMs: mode === 'W' ? med(saves.map(s => s.post)) : undefined,
          changeToSavedMs: med(fromChange),
          changeToRecordStoredMs: mode === 'W' ? {median: med(rec), max: pct(rec, 100), written: rec.length} : undefined,
          longTasks: {count: lt.length, maxMs: lt.length ? Math.round(Math.max(...lt.map(x => x.d))) : 0, totalMs: Math.round(lt.reduce((a, x) => a + x.d, 0))},
          clicks: {interactionsOver16ms: iv.length, of: SAVES * CLICKS, p75Ms: pct(all, 75), maxMs: pct(all, 100), inputDelayMaxMs: pct(delays, 100)}};
        console.log(JSON.stringify(row));
      }
    }
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  }
  await ctx.close(); await browser.close();
})().catch(e => { console.log('FAILED: ' + e.stack); process.exit(1); });
