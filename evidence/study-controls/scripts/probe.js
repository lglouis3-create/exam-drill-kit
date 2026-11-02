/* probe.js PAGE  — read-only questions to the study-controls page, before any fix. Prints JSON lines. */
const pw = require('playwright');
const PAGE = process.argv[2], SHOTS = '/tmp/port-study-controls/evidence/shots/';
const out = (k, v) => console.log(JSON.stringify({probe: k, result: v}));
(async () => {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({viewport: {width: 1000, height: 900}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let onDialog = d => d.accept();
  page.on('dialog', d => onDialog(d));
  const ready = () => page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  await page.goto('file://' + PAGE); await ready();
  const ev = (f, a) => page.evaluate(f, a);
  const settle = () => page.waitForTimeout(80);
  const quizOn = ids => ev(ids => { const pool = ids.map(byId).filter(Boolean);
    Q = {pool, label: 'probe', sweep: ids.slice(), i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
    nextQuestion(); show('quiz'); return !!Q.current; }, ids);
  const mc = await ev(() => QUESTIONS.filter(q => !q.type && !(q.options || []).some(o => o.correct) === false && !isMulti(q)).map(q => q.id));

  // 1. a modal <dialog> open over the quiz
  await quizOn([mc[0]]); await settle();
  await ev(() => { const d = document.createElement('dialog'); d.id = 'probeDlg'; d.innerHTML = '<p>probe dialog</p>'; document.body.appendChild(d); d.showModal(); });
  await page.keyboard.press('a'); await settle();
  out('modal <dialog> open, key a', await ev(() => ({revealed: Q.revealed, active: document.activeElement.tagName})));
  await ev(() => { const d = document.getElementById('probeDlg'); d.close(); d.remove(); });

  // 2. contenteditable
  await quizOn([mc[0]]); await settle();
  await ev(() => { const d = document.createElement('div'); d.contentEditable = 'true'; d.id = 'probeCE'; document.getElementById('v-quiz').prepend(d); d.focus(); });
  await page.keyboard.press('a'); await settle();
  out('contenteditable focused, key a', await ev(() => ({revealed: Q.revealed, text: document.getElementById('probeCE').textContent})));
  await ev(() => document.getElementById('probeCE').remove());

  // 3. textarea
  await quizOn([mc[0]]); await settle();
  await ev(() => { const d = document.createElement('textarea'); d.id = 'probeTA'; document.getElementById('v-quiz').prepend(d); d.focus(); });
  await page.keyboard.press('a'); await page.keyboard.press('Enter'); await settle();
  out('textarea focused, keys a Enter', await ev(() => ({revealed: Q.revealed})));
  await ev(() => document.getElementById('probeTA').remove());

  // 4. worksheets-ink Scratch paper over a calculation in the quiz
  await quizOn(['s2-3']); await settle();
  await page.fill('#numIn', '140');
  const hasScratch = await page.locator('#v-quiz .inkscratch').count();
  if(hasScratch){
    await page.click('#v-quiz .inkscratch'); await page.waitForSelector('#ink canvas.inkcv');
    await page.keyboard.press('Enter'); await settle();
    out('quiz: Scratch paper open, Enter', await ev(() => ({revealed: Q.revealed, ink: !!document.getElementById('ink'), active: document.activeElement.id || document.activeElement.tagName})));
    await page.screenshot({path: SHOTS + 'probe-scratch-quiz.png'});
    await ev(() => FX.api('worksheets-ink').inkClose());
  } else out('quiz: Scratch paper', 'no Scratch paper button');

  // 5. the exam paper with Scratch paper open, and drawing on its canvas
  await ev(() => { if(EX && EX.running) finishExam(true); show('exam'); }); await settle();
  if(await page.locator('#exAgain').count()) { await page.click('#exAgain'); await settle(); }
  await page.click('#startExam'); await settle();
  await ev(() => { const k = EX.qs.map((q, i) => i).sort((a, b) => (EX.qs[b].type ? 1 : 0) - (EX.qs[a].type ? 1 : 0));
    ['qs', 'picks', 'orders'].forEach(f => { EX[f] = k.map(i => EX[f][i]); }); EX.i = 0; saveExam(); renderExamQ(); });   // a calculation first, when the paper has one
  const xinfo = await ev(() => ({n: EX.qs.length, types: EX.qs.map(q => q.type || 'mc')}));
  out('exam paper drawn', xinfo);
  const ni = xinfo.types.indexOf('numeric');
  if(ni >= 0 && ni < xinfo.n - 1){
    await ev(i => { EX.i = i; saveExam(); renderExamQ(); }, ni); await settle();
    if(await page.locator('#v-exam .inkscratch').count()){
      await page.click('#v-exam .inkscratch'); await page.waitForSelector('#ink canvas.inkcv');
      await page.keyboard.press('ArrowRight'); await settle();
      out('exam: Scratch paper open, ArrowRight', await ev(i => ({i: EX.i, was: i, ink: !!document.getElementById('ink')}), ni));
      await ev(i => { EX.i = i; saveExam(); renderExamQ(); }, ni); await settle();
      const box = await page.locator('#ink canvas.inkcv').last().boundingBox();
      await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 60);
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
      await page.mouse.up(); await settle();
      out('exam: drawing on scratch canvas (pointer down), ArrowRight Enter', await ev(i => ({i: EX.i, was: i}), ni));
      await ev(() => FX.api('worksheets-ink').inkClose());
    } else out('exam scratch', 'no Scratch paper on the numeric exam item');
  } else out('exam scratch', 'numeric item not on paper at a usable place: ' + ni);
  await ev(() => finishExam(true)); await settle();

  // 6. strict paper: reload, back, forward, arrows; confirm while open
  await ev(() => show('exam')); await settle();
  if(await page.locator('#exAgain').count()) { await page.click('#exAgain'); await settle(); }
  await page.check('#scStrict'); await page.click('#startExam'); await settle();
  await ev(() => { const q = EX.qs[0]; EX.picks[0] = isMulti(q) ? [0] : 0; saveExam(); renderExamQ(); }); await settle();
  await ev(() => document.getElementById('exNext').click()); await settle();
  out('strict: moved to 2', await ev(() => ({i: EX.i, strict: FX.api('study-controls').strictPaper()})));
  await page.keyboard.press('ArrowLeft'); await settle();
  out('strict: ArrowLeft', await ev(() => EX.i));
  await page.waitForTimeout(300);
  await page.goBack().catch(e => out('goBack error', String(e.message).split('\n')[0]));
  await page.waitForTimeout(500);
  out('strict: after browser Back, url', page.url());
  await page.goForward().catch(e => out('goForward error', String(e.message).split('\n')[0]));
  await page.waitForTimeout(800);
  const back = await ev(() => ({url: location.href, i: EX && EX.i, run: !!(EX && EX.running), view: VIEW})).catch(e => 'eval error ' + e.message);
  out('strict: after Back then Forward', back);
  await page.reload(); await ready(); await ev(() => show('exam')); await settle();
  out('strict: after reload', await ev(() => ({i: EX.i, prev: !!document.getElementById('exPrev'), strict: FX.api('study-controls').strictPaper()})));
  // a native confirm open while keys are pressed: blank question 2 -> ArrowRight asks
  let seen = null;
  onDialog = async d => { seen = d.message(); await page.keyboard.press('ArrowLeft').catch(() => {}); await d.dismiss(); };
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
  onDialog = d => d.accept();
  out('strict: confirm opened by ArrowRight, ArrowLeft pressed while open, then Cancel', {seen, i: await ev(() => EX.i)});
  await ev(() => finishExam(true)); await settle();

  // 7. paper-picker: tick strict, then choose a paper chip
  await ev(() => show('exam')); await settle();
  if(await page.locator('#exAgain').count()) { await page.click('#exAgain'); await settle(); }
  const chips = await ev(() => [...document.querySelectorAll('[data-ppexam]')].map(b => b.dataset.ppexam));
  out('paper-picker chips', chips);
  await page.uncheck('#scStrict').catch(() => {});
  await page.click('#startExam'); await settle(); await ev(() => finishExam(true)); await settle();   // stored preference: unticked
  await page.click('#exAgain'); await settle();
  await page.check('#scStrict');
  if(chips.includes('exam0')){ await page.click('[data-ppexam="exam0"]'); await settle(); }
  out('strict box ticked, then paper chip Exam 0 chosen: box still ticked?', await ev(() => ({checked: !!(document.getElementById('scStrict') || {}).checked, chosen: FX.api('paper-picker') && FX.api('paper-picker').chosen().id})));
  await page.screenshot({path: SHOTS + 'probe-picker-strict.png'});
  out('errors', {page: errors, fx: await ev(() => FX.errors)});
  await browser.close();
})().catch(e => { console.log('PROBE CRASH ' + (e.stack || e)); process.exit(1); });
