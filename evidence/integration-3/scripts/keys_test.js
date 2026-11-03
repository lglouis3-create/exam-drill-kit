/* keys_test.js <courseSrc> : study-controls' keyboard shortcuts against the modules where the
 * student types, writes or answers a dialog (integration check, agent-run, Chromium, simulated
 * input). A shortcut "fires" when the quiz or the paper behind changes: the picked option, the
 * revealed answer, the question shown, or the paper's question number.
 *   KEYS_SHOTS=<dir> saves screenshots.
 */
const path = require('path'), fs = require('fs');
const SRC = path.resolve(process.argv[2]);
const L = require(path.join(SRC, 'check_lib.js'));
const NAME = 'integration keys_test.js';
const {check} = L;
const SHOTS = process.env.KEYS_SHOTS || '';
const KEYS = ['1', '2', 'a', 'b', 'Enter', 'ArrowRight', 'ArrowLeft', ' '];

(async () => {
  L.PAGE.need(NAME);
  const {browser} = await L.launch(NAME);
  const {page, errors} = await L.openFile(browser);
  const on = await page.evaluate(() => ({sc: FX.on('study-controls'), keys: !!(FX.api('study-controls') || {options: {}}).options.keys,
    ink: FX.on('worksheets-ink'), notes: FX.on('notes'), sag: FX.on('short-answer-graphs'), tv: FX.on('terms-variables'),
    qp: FX.on('quiz-prep-cards'), gt: FX.on('glossary-tap'), views: [...document.querySelectorAll('#nav button')].map(b => b.dataset.v)}));
  console.log('modules on: ' + JSON.stringify(on));
  if(!on.sc || !on.keys) L.notRun(NAME, 'study-controls keys is not on in this course');
  const shot = async n => { if(SHOTS){ fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, n + '.png')}); } };
  await page.evaluate(() => { window.__sc = 0; document.addEventListener('click', e => { if(!e.isTrusted && e.target.closest && e.target.closest('#v-quiz, #v-exam')) window.__sc++; }, true); });
  const quizState = () => page.evaluate(() => ({sc: window.__sc, view: VIEW, id: Q && Q.current && Q.current.id, picked: JSON.stringify(Q && Q.picked), revealed: !!(Q && Q.revealed),
    sel: document.querySelectorAll('#v-quiz .opt.sel, #v-quiz .opt.picked, #v-quiz .opt[aria-pressed="true"]').length, answered: Q && Q.answered}));
  const examState = () => page.evaluate(() => ({sc: window.__sc, view: VIEW, running: !!(EX && EX.running), i: EX && EX.i, ans: JSON.stringify(EX && EX.ans)}));
  const press = async () => { for(const k of KEYS) await page.keyboard.press(k); await page.waitForTimeout(120); };
  const quizOn = id => L.quizOn(page, id);
  const mcId = await page.evaluate(() => QUESTIONS.find(q => !q.type && q.options && !q.multi).id);
  const numId = await page.evaluate(() => (QUESTIONS.find(q => q.type === 'numeric') || {}).id);

  // 0. control: the shortcut does fire on a plain quiz card (so a "did not fire" below means something)
  await quizOn(mcId); await page.evaluate(() => document.activeElement && document.activeElement.blur());
  let b = await quizState(); await page.keyboard.press('1'); await page.waitForTimeout(100); let a = await quizState();
  check(a.picked !== b.picked || a.revealed !== b.revealed || a.sel !== b.sel, 'control: on a plain quiz card the key 1 does pick option A', [b, a]);

  // 1. writing on a worksheet with the pointer down
  if(on.ink){
    // 1a. Scratch paper over a quiz calculation (the quiz stays the view behind it)
    if(numId){
      await quizOn(numId);
      const opened = await page.evaluate(() => { const btn = document.querySelector('#v-quiz .inkscratch'); if(!btn) return false; btn.click(); return !!document.getElementById('ink'); });
      check(opened, 'Scratch paper opens over a quiz calculation');
      if(opened){
        const box = await page.evaluate(() => { const c = document.querySelector('#ink canvas'); const r = c.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 60}; });
        b = await quizState();
        await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 30, box.y + 10);
        await press(); await shot('keys-scratch-quiz-pointerdown');
        await page.mouse.move(box.x + 60, box.y + 20); await page.mouse.up();
        a = await quizState();
        check(a.sc === b.sc && a.revealed === b.revealed && a.id === b.id && a.answered === b.answered, 'quiz Scratch paper, pen down: no shortcut checks or moves the quiz behind', [b, a]);
        b = await quizState(); await press(); a = await quizState();
        check(a.sc === b.sc && a.revealed === b.revealed && a.id === b.id && a.answered === b.answered, 'quiz Scratch paper open (pen up): no shortcut acts on the quiz behind the writing page', [b, a]);
        await page.evaluate(() => { const d = document.querySelector('#ink [data-inkdone]'); if(d) d.click(); });
      }
    } else L.skip('quiz Scratch paper', 'the course has no numeric question');
    // 1b. Scratch paper over a paper's calculation
    let ex = null; for(let tries = 0; tries < 25 && !(ex && ex.k >= 0); tries++) ex = await page.evaluate(tries => { if(EX && EX.running) EX.running = false; COURSE.exams.forEach(e => { e.typed = true; }); show('exam'); const s = document.getElementById('startExam'); if(s) s.click();
      if(!EX || !EX.running) return null; let k = EX.qs.findIndex(q => q.type === 'numeric'); if(k < 0) return {k}; EX.i = k; show('exam'); return {k, n: EX.qs.length }; }, tries);
    if(ex && ex.k >= 0){
      const opened = await page.evaluate(() => { const btn = document.querySelector('#v-exam .inkscratch'); if(!btn) return false; btn.click(); return !!document.getElementById('ink'); });
      check(opened, 'Scratch paper opens over a paper\'s calculation');
      if(opened){
        const box = await page.evaluate(() => { const c = document.querySelector('#ink canvas'); const r = c.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 60}; });
        b = await examState();
        await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 30, box.y + 10);
        await press(); await shot('keys-scratch-exam-pointerdown');
        await page.mouse.up();
        a = await examState();
        check(a.sc === b.sc && a.i === b.i && a.ans === b.ans, 'paper Scratch paper, pen down: no shortcut moves the paper or answers behind', [b, a]);
        b = await examState(); await press(); a = await examState();
        check(a.sc === b.sc && a.i === b.i && a.ans === b.ans, 'paper Scratch paper open (pen up): no shortcut moves the paper behind the writing page', [b, a]);
        await page.evaluate(() => { const d = document.querySelector('#ink [data-inkdone]'); if(d) d.click(); });
      }
    } else L.skip('paper Scratch paper', 'no paper with a calculation could be drawn: ' + JSON.stringify(ex));
    await page.evaluate(() => { if(EX && EX.running){ EX.running = false; } show('topics'); });
    // 1c. Write on it from the Worksheets tab, pen down, after a quiz was left open
    await quizOn(mcId);
    const ws = await page.evaluate(() => { show('sheets'); const w = document.querySelector('#v-sheets [data-ink]'); if(!w) return false; w.click(); return !!document.getElementById('ink'); });
    if(ws){
      const box = await page.evaluate(() => { const c = document.querySelector('#ink canvas'); const r = c.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 60}; });
      b = await quizState(); await page.mouse.move(box.x, box.y); await page.mouse.down(); await press(); await page.mouse.up(); a = await quizState();
      check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed && a.id === b.id, 'Worksheets tab, Write on it, pen down: no shortcut acts on the quiz left open', [b, a]);
      await shot('keys-worksheet-pointerdown');
      await page.evaluate(() => { const d = document.querySelector('#ink [data-inkdone]'); if(d) d.click(); });
    } else L.skip('Worksheets tab Write on it', 'no Write on it button on the Worksheets tab');
  }

  // 2. typing in a note (quiz card and paper)
  if(on.notes){
    await quizOn(mcId);
    const opened = await page.evaluate(() => { const c = document.querySelector('#v-quiz [data-noteq]'); if(!c) return false; c.click(); const t = document.querySelector('#v-quiz [data-notetext]'); if(t) t.focus(); return !!t; });
    check(opened, 'the Note box opens on a quiz card');
    if(opened){ b = await quizState(); await page.keyboard.type('1 2 a b'); await press(); a = await quizState();
      check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed && a.id === b.id, 'typing in a note on a quiz card fires no shortcut', [b, a]); }
  }
  // 3. typing a short answer (its own page; the quiz is left open behind it)
  if(on.sag){
    await quizOn(mcId);
    const v = await page.evaluate(() => { const b = [...document.querySelectorAll('#nav button')].find(x => /short answer/i.test(x.textContent)); if(!b) return null; b.click(); const t = document.getElementById('satext'); if(t) t.focus(); return !!t; });
    check(v, 'the Short answer page shows its text box');
    if(v){ b = await quizState(); await page.keyboard.type('1 a 2 b'); await press(); a = await quizState();
      check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed, 'typing a short answer fires no shortcut', [b, a]); }
  }
  // 4. typing in the glossary search box
  if(on.gt){
    await quizOn(mcId);
    const v = await page.evaluate(() => { const b = [...document.querySelectorAll('#nav button')].find(x => /glossary/i.test(x.textContent)); if(!b) return null; b.click(); const t = document.getElementById('gtsearch'); if(t) t.focus(); return !!t; });
    check(v, 'the Glossary search box is there');
    if(v){ b = await quizState(); await page.keyboard.type('1a2b'); await press(); a = await quizState();
      check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed, 'typing in the glossary search fires no shortcut', [b, a]); }
  }
  // 5. terms-variables and quiz-prep-cards: their tabs and cards, then typing nowhere: a key acts only on the core quiz
  if(on.tv){
    await quizOn(mcId);
    const v = await page.evaluate(() => { const b = [...document.querySelectorAll('#nav button')].find(x => /^\s*terms\s*$/i.test(x.textContent) || x.dataset.v === 'terms'); if(!b) return null; b.click(); return VIEW; });
    b = await quizState(); await press(); a = await quizState();
    check(v && a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed, `on the Terms tab (${v}) no key acts on the quiz left open`, [b, a]);
  }
  if(on.qp){
    await quizOn(mcId); await page.evaluate(() => show('topics'));
    b = await quizState(); await press(); a = await quizState();
    check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed, 'on Topics with the quiz-prep card no key acts on the quiz left open', [b, a]);
  }

  // 6. a confirm: keys pressed while it is open (Clear flags on Topics, Delete note, Clear page)
  const dialogKeys = async (label, prepare, open) => {
    await quizOn(mcId);
    const pr = prepare ? await prepare() : 'ok';
    b = await quizState();
    let seen = null;
    const h = async d => { seen = d.message(); try { await Promise.race([(async () => { for(const k of ['1', 'a', 'Enter']) await page.keyboard.press(k); })(), new Promise(r => setTimeout(r, 1500))]); } catch(e){} await d.dismiss().catch(() => {}); };
    page.removeAllListeners('dialog'); page.on('dialog', h);
    const r = await open().catch(e => 'error: ' + e.message);
    await page.waitForTimeout(300);
    page.removeAllListeners('dialog'); page.on('dialog', d => d.accept());
    a = await quizState();
    if(!seen) L.skip(label, 'the confirm did not open: ' + JSON.stringify([pr, r]));
    else check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed && a.id === b.id, label + ': keys pressed while its confirm is open fire no shortcut ("' + seen.slice(0, 40) + '")', [b, a]);
  };
  if(on.sc) await dialogKeys('Clear flags', async () => { await page.evaluate(() => { FX.api('study-controls').set(QUESTIONS[0].id, true); }); await page.waitForTimeout(400);
      await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3); await quizOn(mcId); return 'flag set'; },
    async () => { await page.evaluate(() => show('topics')); await page.waitForTimeout(400); return page.evaluate(() => { const c = document.getElementById('scClearFlag'); if(!c) return 'no Clear flags; flagged ' + JSON.stringify(FX.api('study-controls').flagged()) + ' row ' + (document.getElementById('scRow') || {}).outerHTML; setTimeout(() => c.click(), 0); return 'clicked'; }); });
  if(on.notes) await dialogKeys('Delete note', null, () => page.evaluate(() => { const id = QUESTIONS[0].id; DB.notes = Object.assign({}, DB.notes, {[id]: {t: 'x', at: Date.now()}}); save();
    const b = [...document.querySelectorAll('#nav button')].find(x => /notes/i.test(x.textContent)); if(b) b.click(); const d = document.querySelector('[data-notedel]'); if(!d) return 'no Delete note'; setTimeout(() => d.click(), 0); return 'clicked'; }));
  if(on.ink && numId) await dialogKeys('Clear page (quiz Scratch paper)', async () => { await L.quizOn(page, numId);
      return page.evaluate(() => { const btn = document.querySelector('#v-quiz .inkscratch'); if(!btn) return 'no scratch'; btn.click(); return !!document.getElementById('ink'); }); },
    () => page.evaluate(() => { const c = [...document.querySelectorAll('#ink button')].find(x => /clear/i.test(x.textContent)); if(!c) return 'no Clear page'; setTimeout(() => c.click(), 0); return 'clicked'; }));
  await page.evaluate(() => { const d = document.querySelector('#ink [data-inkdone]'); if(d) d.click(); });

  // 7. the Import file picker (Settings)
  {
    await quizOn(mcId);
    b = await quizState();
    const fc = page.waitForEvent('filechooser', {timeout: 3000}).catch(() => null);
    const r = await page.evaluate(() => { show('settings'); const i = document.getElementById('fileIn'); if(!i) return 'no #fileIn'; const btn = [...document.querySelectorAll('#v-settings button')].find(x => /import/i.test(x.textContent)); (btn || i).click(); return btn ? 'button' : 'input'; });
    const chooser = await fc;
    await press();
    a = await quizState();
    const active = await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
    if(!chooser) L.skip('Import file picker', 'no file chooser opened: ' + r);
    else check(a.picked === b.picked && a.sc === b.sc && a.revealed === b.revealed, `Import file picker open (simulated: Playwright intercepts the chooser; focus on ${active}): no shortcut fires`, [b, a]);
  }
  check(!errors.length, 'no page error', errors.slice(0, 3));
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': ' + e.stack); process.exit(1); });
