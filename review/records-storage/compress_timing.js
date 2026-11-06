// Kit #66 review item M3: how long compressing the per-tab record's progress copy takes in the
// page, against what a save costs now, and how long an IndexedDB write of the same text takes to
// complete. Chromium, unthrottled and with CPU throttling rate 4 (Chrome DevTools Protocol
// Emulation.setCPUThrottlingRate; a slowed desktop CPU, not a phone).
// Run from a built scratch course's src/: node <this file> <dir holding node_modules with
// lz-string@1.5.0 and fflate@0.8.2>. The samples are compress_estimate.js's three generators
// (generated data, not Louis's progress). Times are the median of 5 runs, in milliseconds.
'use strict';
const path = require('path'), fs = require('fs');
const L = require(path.join(process.cwd(), 'check_lib.js'));
const LIBS = process.argv[2];
const lz = fs.readFileSync(path.join(LIBS, 'node_modules/lz-string/libs/lz-string.min.js'), 'utf8');
const ff = fs.readFileSync(path.join(LIBS, 'node_modules/fflate/umd/index.js'), 'utf8');
const ver = p => JSON.parse(fs.readFileSync(path.join(LIBS, 'node_modules', p, 'package.json'), 'utf8')).version;

// the three samples, generated exactly as compress_estimate.js does
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const base = () => ({v: 3, concepts: {}, answers: [], qn: 0, fsrsQ: {}, fsrsC: {}, arms: {}, fsUndo: [], settings: {mode: 'normal'}, created: 1793974599362});
const samples = [];
{ const DB = base(); DB.ink = {}; const mk = (seed, n) => { const p = []; for(let i = 0; i < n; i++) p.push(+(0.05 + ((seed * 7 + i * 13) % 900) / 1000).toFixed(4), +(0.05 + ((seed * 11 + i * 17) % 900) / 1000).toFixed(4)); return {t: 'pen', c: '#111111', w: 0.00305, p}; };
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++) ss.push(mk(g * 30 + j, 60)); DB.ink['q:s1-' + (g % 7 + 1) + '|bulk' + Math.floor(g / 7)] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  samples.push(['ink, the porter\'s generator', DB]); }
{ const DB = base(); DB.ink = {};
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
    DB.ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  samples.push(['ink, random-walk strokes', DB]); }
{ const DB = base(); const t0 = 1793974599362;
  for(let i = 0; i < 4000; i++){ const c = 'concept-' + (i % 600), q = 'L' + (1 + i % 18) + '-' + String(i % 900).padStart(3, '0');
    DB.answers.push({qid: q, concept: c, result: rnd() < 0.7 ? 'correct' : 'wrong', at: t0 + i * 41000 + Math.floor(rnd() * 9000), qn: i + 1, ms: 3000 + Math.floor(rnd() * 40000)});
    const s = DB.concepts[c] = DB.concepts[c] || {seen: 0, correct: 0, wrong: 0, guessed: 0, streak: 0, box: 0, dueAt: 0, dueQ: 0, lastQ: 0, asked: [], last: {}};
    s.seen++; s.correct += 1; s.box = Math.min(5, s.box + 1); s.dueAt = t0 + i * 41000 + 86400000; s.dueQ = i + 9; s.lastQ = i + 1; if(!s.asked.includes(q)) s.asked.push(q); s.last[q] = i + 1; }
  samples.push(['answers: 4,000 on 600 concepts', DB]); }

const MEASURE = async (db) => {
  const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const time = (f, n = 5) => { const t = []; let r; for(let i = 0; i < n; i++){ const a = performance.now(); r = f(); t.push(performance.now() - a); } return [Math.round(med(t)), r]; };
  const [tStr, s] = time(() => JSON.stringify(db));
  const [tSet] = time(() => { localStorage.setItem('timing-probe', s); localStorage.removeItem('timing-probe'); });
  const [tLz, z] = time(() => LZString.compressToUTF16(s));
  const [tUnLz, back] = time(() => LZString.decompressFromUTF16(z));
  const u8 = new TextEncoder().encode(s);
  const [tFf, d] = time(() => fflate.deflateSync(u8, {level: 6}));
  const [tUnFf, b2] = time(() => fflate.inflateSync(d));
  const ffExact = new TextDecoder().decode(b2) === s;
  // an IndexedDB write of the same text: from the put to the transaction's complete event
  const idb = await new Promise(res => { const o = indexedDB.open('timing-probe', 1); o.onupgradeneeded = () => o.result.createObjectStore('r'); o.onsuccess = () => res(o.result); });
  const w = []; for(let i = 0; i < 5; i++) w.push(await new Promise(res => { const a = performance.now(); const tx = idb.transaction('r', 'readwrite'); tx.objectStore('r').put(s, 'k' + i); tx.oncomplete = () => res(performance.now() - a); }));
  idb.close(); await new Promise(res => { const r = indexedDB.deleteDatabase('timing-probe'); r.onsuccess = r.onerror = res; });
  return {progressChars: s.length, stringify: tStr, setItem: tSet,
    lz: {ms: tLz, unMs: tUnLz, chars: z.length, ratio: +(z.length / s.length).toFixed(3), exact: back === s},
    fflate: {ms: tFf, unMs: tUnFf, bytes: d.length, packedChars: Math.ceil(d.length * 8 / 15), ratio: +(Math.ceil(d.length * 8 / 15) / s.length).toFixed(3), exact: ffExact},
    idbPutToComplete: Math.round(med(w))};
};

(async () => {
  console.log(`lz-string ${ver('lz-string')}, fflate ${ver('fflate')} (deflateSync level 6; stored characters counted at 15 bits each)`);
  const {browser} = await L.launch('compress_timing');
  const {ctx, page} = await L.openFile(browser);
  await page.waitForFunction(() => typeof DB === 'object', null, {timeout: 15000});
  await page.addScriptTag({content: lz}); await page.addScriptTag({content: ff});
  const cdp = await ctx.newCDPSession(page);
  for(const rate of [1, 4]){
    await cdp.send('Emulation.setCPUThrottlingRate', {rate});
    for(const [label, db] of samples){
      const r = await page.evaluate(MEASURE, db);
      console.log(`rate ${rate}  ${label.padEnd(32)} ${JSON.stringify(r)}`);
    }
  }
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  await ctx.close(); await browser.close();
})().catch(e => { console.log('FAILED: ' + e.stack); process.exit(1); });
