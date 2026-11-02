/* Step-through figures, driven in a real browser.
 *
 * Two faults this catches and nothing else does:
 *   - a step that does not settle: more or fewer than one group shown, the dots
 *     out of step with it, a ghost copy of the previous step left behind, an
 *     inline transform left on a shape, a translucent shape turned solid, a
 *     rotated label with its rotation lost
 *   - a shape that fades out and fades back in across one move, when it is the
 *     same shape in both steps and should have glided or stayed put
 *
 * Every figure in DIA that carries step controls is walked: forward through all
 * its steps, then a burst of rapid clicks, then a jump to the last step.
 */
const fs = require('fs'), path = require('path');
const L = require('./check_lib');
const OUT = L.PAGE.PAGE;
// A check that cannot run exits 2 with NOT RUN (codes in check_lib.js); it used
// to exit 0, which a chained command could not tell from a pass.
L.PAGE.need('stepper_test.js');
const browserType = L.browserType('stepper_test.js');

/* Passed to the page as a function, not a string: a string is evaluated as an
   expression, and an arrow-function expression serializes back as undefined. */
const SETTLE = () => {
  const bad = [], fig = document.querySelector('#v-topics .fig');
  if (!fig) return ['no figure on the page'];
  const on = fig.querySelectorAll('.st.on');
  if (on.length !== 1) return ['steps shown: ' + on.length];
  const i = [...fig.querySelectorAll('.st')].indexOf(on[0]);
  const d = [...fig.querySelectorAll('.sdot')].findIndex(x => x.classList.contains('on'));
  if (i !== d) bad.push('dot ' + d + ' vs step ' + i);
  if (fig.querySelector('.st-out')) bad.push('ghost copy left behind');
  on[0].querySelectorAll('[opacity]').forEach(el => {
    const a = +el.getAttribute('opacity'), c = +getComputedStyle(el).opacity;
    if (Math.abs(a - c) > 0.02) bad.push('opacity ' + el.tagName + ' ' + a + ' != ' + c);
  });
  on[0].querySelectorAll('*').forEach(el => { if (el.style.transform) bad.push('leftover transform'); });
  on[0].querySelectorAll('[transform]').forEach(el => {
    if (/rotate/.test(el.getAttribute('transform')) && getComputedStyle(el).transform === 'none')
      bad.push('rotation lost');
  });
  return [...new Set(bad)];
};

(async () => {
  let b;
  try { b = await browserType.launch(); }
  catch (e) { L.notRun('stepper_test.js', `${L.BROWSER_NAME} did not start: ` + String(e.message).split('\n')[0]); }
  const p = await b.newPage({viewport: {width: 900, height: 1000}});
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(OUT));
  await p.evaluate(() => { window.prompt = () => 'TestUser'; });
  await p.waitForTimeout(400);

  const keys = await p.evaluate(() =>
    (typeof DIA === 'undefined' ? [] : Object.keys(DIA).filter(k => /data-anim/.test(DIA[k]))));
  if (!keys.length) {
    await b.close();
    L.notRun('stepper_test.js', 'no step-through figures in DIA');
  }

  const put = k => p.evaluate(k => {
    document.getElementById('v-topics').innerHTML = '<div style="max-width:620px">' + DIA[k] + '</div>';
    document.getElementById('v-topics').classList.remove('hide');
  }, k);
  const settle = () => p.evaluate(SETTLE);

  let problems = 0, faded = 0;
  const worst = [], notes = [];
  for (const k of keys) {
    await put(k);
    const n = await p.evaluate(() => document.querySelectorAll('#v-topics .fig .st').length);
    await p.click('[data-go="replay"]'); await p.waitForTimeout(700);
    let r = await settle();
    if (r.length) { problems++; worst.push(`${k} replay: ${r.join(', ')}`); }
    for (let i = 0; i < n; i++) {
      await p.click('[data-go="1"]'); await p.waitForTimeout(1000);
      r = await settle();
      if (r.length) { problems++; worst.push(`${k} step ${i + 2}: ${r.join(', ')}`); }
    }
    // a burst of clicks, then a jump: the figure still has to settle
    for (let i = 0; i < 7; i++) { await p.click(i % 3 ? '[data-go="1"]' : '[data-go="-1"]'); await p.waitForTimeout(40); }
    await p.click(`[data-go="dot"][data-i="${n - 1}"]`); await p.waitForTimeout(1100);
    r = await settle();
    if (r.length) { problems++; worst.push(`${k} after rapid clicks: ${r.join(', ')}`); }

    // right after a move: anything in the ghost whose signature is also in the
    // new step was faded when it should have glided
    await put(k);
    for (let i = 0; i < Math.min(n, 5); i++) {
      await p.click('[data-go="1"]');
      const wrong = await p.evaluate(() => {
        const g = document.querySelector('.st-out'); if (!g) return 0;
        const on = document.querySelector('.st.on');
        const sig = el => el.getAttribute('data-k') || [el.tagName,
          (el.getAttribute('class') || '').replace(/\b(fadein|glide)\b/g, '').trim(),
          el.tagName === 'text' ? el.textContent : (el.getAttribute('fill') || '')].join('|');
        const L = 'text,circle,rect,ellipse,line,polyline,polygon,path';
        const gs = {};
        g.querySelectorAll(L).forEach(e => { const s = sig(e); gs[s] = (gs[s] || 0) + 1; });
        let c = 0;
        on.querySelectorAll('.fadein').forEach(e => {
          if (e.classList.contains('capt')) return;
          const s = sig(e); if (gs[s]) { c++; gs[s]--; }
        });
        return c;
      });
      if (wrong) { faded += wrong; worst.push(`${k} move ${i + 1}: ${wrong} shape(s) faded instead of gliding`); }
      // A shape fading in where another just faded out, same tag and size, is
      // usually one thing whose data-k changed between the steps. It can also be
      // a deliberate swap (one label replaced by another in place), so this is
      // reported for the author to look at rather than failed.
      const swaps = await p.evaluate(() => {
        const g = document.querySelector('.st-out'); if (!g) return 0;
        const on = document.querySelector('.st.on'); if (!on) return 0;
        const L = 'text,circle,rect,ellipse,line,polyline,polygon,path';
        const box = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width + r.height]; };
        const gone = [...g.querySelectorAll(L)].map(el => ({tag: el.tagName, b: box(el)}));
        let n = 0;
        on.querySelectorAll('.fadein').forEach(el => {
          if (el.classList.contains('capt')) return;
          const b = box(el);
          const hit = gone.findIndex(o => o.tag === el.tagName && Math.abs(o.b[0] - b[0]) < 6 &&
                                          Math.abs(o.b[1] - b[1]) < 6 && Math.abs(o.b[2] - b[2]) < 6);
          if (hit >= 0) { n++; gone.splice(hit, 1); }
        });
        return n;
      });
      if (swaps) notes.push(`${k} move ${i + 1}: ${swaps} shape(s) faded in where another faded out at the same spot`);
      await p.waitForTimeout(1000);
    }
  }

  const ok = !problems && !faded && !errs.length;
  console.log(`\nstepper_test.js: ${ok ? 'passed' : 'FAILED'} (${keys.length} step-through${keys.length === 1 ? '' : 's'}; ` +
    `settle problems ${problems}; wrongly faded ${faded}; page errors ${errs.length})`);
  if (!ok) { console.log(worst.slice(0, 10).map(s => '  ' + s).join('\n')); console.log(errs.slice(0, 3)); }
  if (notes.length) {
    console.log('  to look at (a swap in place is fine; the same thing with two keys is not):');
    console.log(notes.slice(0, 8).map(s => '    ' + s).join('\n'));
  }
  console.log();
  await b.close();
  console.log(ok ? `PASS: stepper_test.js: ${keys.length} step-through(s) settle at every step`
                 : `FAIL: stepper_test.js: settle problems ${problems}, wrongly faded ${faded}, page errors ${errs.length}`);
  process.exit(ok ? 0 : 1);
})();
