// How much smaller a per-tab record would be if its progress copy were compressed. Deflate
// (zlib level 9) is the estimate; localStorage holds text, so compressed bytes are packed 15 bits
// per stored character, as lz-string's compressToUTF16 does (chars = ceil(bytes * 8 / 15)).
const zlib = require('zlib');
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const est = (label, obj) => { const s = JSON.stringify(obj), b = zlib.deflateRawSync(Buffer.from(s, 'utf8'), {level: 9}).length, c = Math.ceil(b * 8 / 15);
  console.log(`${label.padEnd(48)} chars ${String(s.length).padStart(9)}  deflate bytes ${String(b).padStart(8)}  stored chars ${String(c).padStart(8)}  record/progress ${(c / s.length).toFixed(3)}`); };
const base = () => ({v: 3, concepts: {}, answers: [], qn: 0, fsrsQ: {}, fsrsC: {}, arms: {}, fsUndo: [], settings: {mode: 'normal'}, created: 1793974599362});
// 1. the porter's ink generator, exactly (worksheets-ink test.js BULK([60,30,'bulk']) at port/worksheets-ink 0769d14)
{ const DB = base(); DB.ink = {}; const mk = (seed, n) => { const p = []; for(let i = 0; i < n; i++) p.push(+(0.05 + ((seed * 7 + i * 13) % 900) / 1000).toFixed(4), +(0.05 + ((seed * 11 + i * 17) % 900) / 1000).toFixed(4)); return {t: 'pen', c: '#111111', w: 0.00305, p}; };
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++) ss.push(mk(g * 30 + j, 60)); DB.ink['q:s1-' + (g % 7 + 1) + '|bulk' + Math.floor(g / 7)] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  est('ink, the porter\'s generator (60 x 30 x 60)', DB); }
// 2. the same shape, with a hand-like random walk (4 decimals), which compresses less
{ const DB = base(); DB.ink = {};
  for(let g = 0; g < 60; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
    DB.ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  est('ink, random-walk strokes (60 x 30 x 60)', DB); }
// 3. answers: 4,000 answers on 600 concepts, in the core's own shapes
{ const DB = base(); const t0 = 1793974599362;
  for(let i = 0; i < 4000; i++){ const c = 'concept-' + (i % 600), q = 'L' + (1 + i % 18) + '-' + String(i % 900).padStart(3, '0');
    DB.answers.push({qid: q, concept: c, result: rnd() < 0.7 ? 'correct' : 'wrong', at: t0 + i * 41000 + Math.floor(rnd() * 9000), qn: i + 1, ms: 3000 + Math.floor(rnd() * 40000)});
    const s = DB.concepts[c] = DB.concepts[c] || {seen: 0, correct: 0, wrong: 0, guessed: 0, streak: 0, box: 0, dueAt: 0, dueQ: 0, lastQ: 0, asked: [], last: {}};
    s.seen++; s.correct += 1; s.box = Math.min(5, s.box + 1); s.dueAt = t0 + i * 41000 + 86400000; s.dueQ = i + 9; s.lastQ = i + 1; if(!s.asked.includes(q)) s.asked.push(q); s.last[q] = i + 1; }
  est('answers: 4,000 answers on 600 concepts', DB); }
