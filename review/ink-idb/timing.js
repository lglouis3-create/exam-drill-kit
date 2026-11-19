// Save and click timing of worksheet ink kept in IndexedDB (kit PR "IndexedDB for worksheet ink",
// Louis 2026-11-08), with #66's method (review/records-storage/latency_measure.js) as the baseline.
// Run from a built course's src/ whose core has the outside-part layer (Medicinal-chemistry with
// this core copied in, as ci_course.sh does):   node <this file>
// A copy of the page with registerOutside('ink') added is served (as outside_test.js does).
// Per sample, CPU rate and run: the sample placed and saved (not counted), then 5 changes; each
// change adds one stroke to one page (a different page each time) and calls save(), and 8 clicks
// 40 ms apart on a button start at once, so they meet the save's work as in #66. Measured per change:
//   saveCallMs   the main-thread time of the save() call (it starts the page's database write)
//   commitMs     from the save() call to the page's transaction complete event (outsideState 'saved');
//                with no part registered (T_BASE=1), to the end of the progress write 150 ms later
//   progressMs   the main-thread time of the progress's own write to localStorage (saveProgress,
//                150 ms later), as #66 measured it
// and per click: Event Timing's duration (input to the next paint, entries of 16 ms and more; no
// entry counts as under 16 ms), and the fallback for a browser without Event Timing: from the
// event's timeStamp to the second requestAnimationFrame callback after it.
// Samples (generated, not Louis's data): "answers at both caps" is 5,000 answers recorded through
// record() on this course (the profile of review/storage-measure/measure.js); the ink samples are
// #66's random-walk generator, generated in #66's order, added to that profile.
'use strict';
const path = require('path'), fs = require('fs');
const L = require(path.join(process.cwd(), 'check_lib.js'));
const RATES = process.env.T_RATES ? process.env.T_RATES.split(',').map(Number) : [1, 4], RUNS = +(process.env.T_RUNS || 3), SAVES = 5, CLICKS = 8, GAP = 40;
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const walk = pages => { const ink = {};
  for(let g = 0; g < pages; g++){ const ss = []; for(let j = 0; j < 30; j++){ let x = rnd(), y = rnd(); const p = []; for(let i = 0; i < 60; i++){ x = Math.min(1, Math.max(0, x + (rnd() - 0.5) * 0.02)); y = Math.min(1, Math.max(0, y + (rnd() - 0.5) * 0.02)); p.push(+x.toFixed(4), +y.toFixed(4)); } ss.push({t: 'pen', c: '#111111', w: 0.00305, p}); }
    ink['q:s1-' + (g % 7 + 1) + '|work' + g] = {parts: {work: ss}, room: {}, at: 1793974599362 + g}; }
  return {ink}; };
// #66's order: porter (no random numbers), walk(60), answers sample (uses rnd), walk(69), walk(100), walk(150), walk(171)
walk(60);
for(let i = 0; i < 4000; i++){ rnd(); rnd(); }   // answersSample's two rnd() calls per answer
const W69 = walk(69).ink; walk(100); walk(150); const W171 = walk(171).ink;
const pct = (a, p) => { if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]); };
const med = a => pct(a, 50);
(async () => {
  const built = fs.readFileSync(L.PAGE.PAGE, 'utf8'), A = "/* What this page last read under the profile's own progress and history keys, or wrote";
  if(!built.includes(A)) throw new Error('no outside-part layer in the built page');
  // T_BASE=1: the unchanged page (no part registered: the ink inside the stored progress, as before this layer)
  const BASE = process.env.T_BASE === '1';
  const file = path.join(path.dirname(L.PAGE.PAGE), 'ink-timing.html');
  fs.writeFileSync(file, BASE ? built : built.replace(A, "registerOutside('ink');\n" + A));
  console.log(BASE ? 'baseline: the page with no part registered (ink inside the stored progress)' : 'the page with registerOutside(\'ink\')');
  const {browser} = await L.launch('ink-timing');
  console.log(`${browser.version()}; rates ${RATES.join(',')}; ${RUNS} runs x ${SAVES} changes, ${CLICKS} clicks ${GAP} ms apart after each`);
  const {ctx, page} = await L.openPage(browser, file);
  await page.waitForFunction(() => typeof outsideReady === 'function' && (WRITER === 'held' || WRITER === 'none'), null, {timeout: 15000});
  await page.evaluate(() => outsideReady());
  // the answers at both caps, through record()
  const prog = await page.evaluate(() => { for(let i = 0; i < 5000; i++){ const q = QUESTIONS[(i * 7) % QUESTIONS.length]; record(q, i % 4 === 3 ? 'wrong' : 'correct', 0, 4000); }
    clearTimeout(saveTimer); saveTimer = null; saveProgress(); return {answers: DB.answers.length, chars: (localStorage.getItem(keyFor(PROFILE)) || '').length, questions: QUESTIONS.length}; });
  console.log('profile ' + JSON.stringify(prog));
  await page.evaluate(() => {
    const H = window.__t = {long: [], events: [], fb: [], prog: []};
    new PerformanceObserver(l => { for(const e of l.getEntries()) H.long.push({t: e.startTime, d: e.duration}); }).observe({type: 'longtask'});
    new PerformanceObserver(l => { for(const e of l.getEntries()) if(e.interactionId) H.events.push({t: e.startTime, d: e.duration, id: e.interactionId}); }).observe({type: 'event', durationThreshold: 16});
    const b = document.createElement('button'); b.id = 't-btn'; b.textContent = '0';
    b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;width:80px;height:40px';
    b.addEventListener('click', e => { b.textContent = String(+b.textContent + 1); const ts = e.timeStamp; requestAnimationFrame(() => requestAnimationFrame(() => H.fb.push({t: ts, d: performance.now() - ts}))); });
    document.body.appendChild(b);
    const sp = window.saveProgress;
    window.saveProgress = function(){ const t = performance.now(); const r = sp.apply(this, arguments); H.prog.push({t, d: performance.now() - t}); return r; };
  });
  const box = await page.locator('#t-btn').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const cdp = await ctx.newCDPSession(page);
  const samples = BASE ? [['answers at both caps', {}], ['answers + ink 69 pages', W69]] : [['answers at both caps', {}], ['answers + ink 69 pages', W69], ['answers + ink 171 pages', W171]];
  for(const [label, ink] of samples){
    // the sample placed and saved once (not counted)
    const placed = await page.evaluate(async ink => { DB.ink = JSON.parse(JSON.stringify(ink)); save(); saveNow();
      const ks = Object.keys(DB.ink); const t0 = performance.now();
      while(OUT.parts.size && ks.some(k => outsideState('ink', k) === 'saving') && performance.now() - t0 < 60000) await new Promise(r => setTimeout(r, 20));
      return {inkChars: JSON.stringify(DB.ink).length, pages: ks.length, notSaved: OUT.parts.size ? ks.filter(k => outsideState('ink', k) !== 'saved').length : (FAILED.has(keyFor(PROFILE)) ? ks.length : 0), progressChars: (localStorage.getItem(keyFor(PROFILE)) || '').length}; }, ink);
    console.log(JSON.stringify({sample: label, placed}));
    for(const rate of RATES){
      await cdp.send('Emulation.setCPUThrottlingRate', {rate});
      for(let run = 1; run <= RUNS; run++){
        await page.evaluate(() => { const H = window.__t; H.long = []; H.events = []; H.fb = []; H.prog = []; });
        const changes = [];
        for(let i = 0; i < SAVES; i++){
          changes.push(await page.evaluate(([i, run, SAVES]) => {
            const ks = Object.keys(DB.ink || {}); const k = ks.length ? ks[(run * SAVES + i) % ks.length] : 'probe';
            const old = DB.ink && DB.ink[k] || {parts: {work: []}, room: {}, at: 0};
            DB.ink = DB.ink || {};
            DB.ink[k] = {parts: {work: old.parts.work.concat([{t: 'pen', c: '#111111', w: 0.00305, p: [0.1, 0.1 + i / 100, 0.2, 0.2]}])}, room: old.room, at: Date.now()};
            const t = performance.now(); save(); const call = performance.now() - t;
            // the commit is watched while the clicks run (they start at once, as in #66)
            window.__pend = new Promise(res => { const tick = () => { const s = OUT.parts.size ? outsideState('ink', k) : (saveTimer ? 'saving' : (FAILED.has(keyFor(PROFILE)) ? 'refused' : 'saved')); if(s === 'saved' || s === 'refused' || s === 'failed' || performance.now() - t > 30000) res({k, call, commit: performance.now() - t, state: s}); else setTimeout(tick, 2); }; tick(); });
            return call;
          }, [i, run, SAVES]));
          for(let c = 0; c < CLICKS; c++){ await page.mouse.click(cx, cy); await page.waitForTimeout(GAP); }
          changes[changes.length - 1] = await page.evaluate(() => window.__pend);
          await page.waitForTimeout(400);
        }
        await page.waitForTimeout(300);
        const H = await page.evaluate(() => window.__t);
        const ints = {}; for(const e of H.events){ ints[e.id] = Math.max(ints[e.id] || 0, e.d); }
        const iv = Object.values(ints), all = iv.concat(Array(Math.max(0, SAVES * CLICKS - iv.length)).fill(0));
        const fb = H.fb.map(x => x.d), lt = H.long.filter(x => x.d > 50);
        console.log(JSON.stringify({sample: label, rate, run,
          saveCallMs: {median: med(changes.map(c => c.call)), max: pct(changes.map(c => c.call), 100)},
          commitMs: {median: med(changes.map(c => c.commit)), max: pct(changes.map(c => c.commit), 100)}, states: [...new Set(changes.map(c => c.state))],
          progressMs: {median: med(H.prog.map(x => x.d)), max: pct(H.prog.map(x => x.d), 100), n: H.prog.length},
          clickEventTiming: {p75: pct(all, 75), max: pct(all, 100), entries: iv.length},
          clickFallback: {p75: pct(fb, 75), max: pct(fb, 100), n: fb.length},
          longTasks: {count: lt.length, maxMs: lt.length ? Math.round(Math.max(...lt.map(x => x.d))) : 0}}));
      }
      await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
    }
  }
  await ctx.close(); await browser.close(); try { fs.unlinkSync(file); } catch(e){}
})().catch(e => { console.log('FAILED: ' + (e && e.stack || e)); process.exit(1); });
