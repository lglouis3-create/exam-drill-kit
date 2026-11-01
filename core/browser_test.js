/* Drive the built app in a real browser and fail on anything a user would hit.
 *
 * The node checks parse the bank and exercise the engine, but they stub out the
 * DOM. This opens the actual file in Chromium, answers a question, reveals the
 * explanation and visits every view, so a fault that only appears once the page
 * runs — a boot error, a view that throws on click, an image that does not decode
 * — is caught before the file is delivered.
 *
 * A port of the template's browser_test.py to Node Playwright, which a cloud
 * session has without an install step; the cases and their wording are the
 * Python version's. A case that cannot run on the bank on hand is a skip, never
 * a pass.
 *
 *     node browser_test.js
 */
const fs = require('fs'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'browser_test.js';
L.PAGE.need(NAME);
const URL_ = 'file://' + L.PAGE.PAGE;
const {check, skip} = L;

// Every question file, from course.js `files` as build.py reads it (the build
// itself stops when a q<N>_*.js file in src/ is missing from that list), so a
// new one is counted here the moment it is built into the page.
function questionFiles(){
  const r = child.spawnSync('python3', ['build.py', '--list-files'], {cwd: L.PAGE.SRC, encoding: 'utf8'});
  try { const q = JSON.parse(r.stdout).questions; if(Array.isArray(q) && q.length) return q; } catch(e){}
  console.log('FAIL: browser_test.js: build.py --list-files named no question file: ' + ((r.stderr || r.stdout || '').trim().split('\n').pop() || 'no output'));
  process.exit(1);
}
// A question object opens at column 0 and carries a prof field; the TOPICS
// entries in the first question file are indented and have no prof, so they are not counted.
const QRE = /^\{id:'[^']+',(?: *(?:lowYield|dupOf|skill|type):[^,]+,)* *prof:'/gm;

/* How many questions and images the sources hold, so the page can be compared
   against them instead of against a number written here. */
function sourceCounts(){
  const n = questionFiles().reduce((s, f) => s + (fs.readFileSync(f, 'utf8').match(QRE) || []).length, 0);
  if(!n){ console.log('FAIL: browser_test.js: counted no questions in the sources — the count pattern is wrong'); process.exit(1); }
  return [n, Object.keys(JSON.parse(fs.readFileSync('images.json', 'utf8'))).length];
}

(async () => {
  const {browser} = await L.launch(NAME);
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errors = [], consoleErrors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if(m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('dialog', d => d.dismiss());

  console.log('\n=== Browser smoke test ===');
  await page.goto(URL_);
  await page.waitForTimeout(1200);
  // the app asks for a name on first run; answer the prompt if it appears
  await page.evaluate(() => { window.prompt = () => 'TestUser'; });

  check(!errors.length, 'page loads with no uncaught JavaScript error', errors.slice(0, 2).join('; '));
  check(!consoleErrors.length, 'no console errors on load', consoleErrors.slice(0, 2).join('; '));
  const body = await page.innerText('body');
  check(body.length > 200, 'page renders visible text', `only ${body.length} chars`);

  // the question bank reached the page, counted from the sources rather
  // than from a literal, so adding questions does not require editing this
  const [wantQ, wantI] = sourceCounts();
  const n = await page.evaluate(() => typeof QUESTIONS !== 'undefined' ? QUESTIONS.length : -1);
  check(n === wantQ, `question bank present in the page (${n} of ${wantQ} in the sources)`);
  const imgs = await page.evaluate(() => typeof IMAGES !== 'undefined' ? Object.keys(IMAGES).length : -1);
  check(imgs === wantI, `image bank present in the page (${imgs} of ${wantI} in images.json)`);

  // every image decodes: a truncated base64 URL would fail here and nowhere else
  const badImg = await page.evaluate(async () => {
    const bad = [];
    for(const [k, v] of Object.entries(IMAGES)){
      const ok = await new Promise(res => { const im = new Image();
        im.onload = () => res(im.naturalWidth > 0); im.onerror = () => res(false); im.src = v; });
      if(!ok) bad.push(k);
    }
    return bad;
  });
  check(!badImg.length, `all ${imgs} embedded images decode`, badImg.slice(0, 5).join(', '));

  // answer a question end to end through the real UI
  // A select-all item is answered by toggling options and pressing Check;
  // a single-answer item by clicking one option. `answerCurrent` does
  // whichever the question on screen needs, through the rendered buttons,
  // so every walk below exercises the same code a reader would.
  await page.evaluate(() => {
    window.answerCurrent = (allCorrect) => {
      const q = Q && Q.current; if(!q) return false;
      if(q.type === 'numeric'){
        const inp = document.getElementById('numIn'); if(!inp) return false;
        inp.value = allCorrect ? String(q.answer) : String(q.answer + 1000);
        document.getElementById('btnCheck').click(); return true;
      }
      if(q.type === 'match'){
        const sels = [...document.querySelectorAll('#v-quiz select[data-row]')]; if(!sels.length) return false;
        sels.forEach((s, i) => { s.value = String(allCorrect ? i : (i + 1) % sels.length); s.dispatchEvent(new Event('change')); });
        document.getElementById('btnCheck').click(); return true;
      }
      const btns = [...document.querySelectorAll('#v-quiz button[data-o]')];
      if(!btns.length) return false;
      if(isMulti(q)){
        const want = allCorrect ? correctSet(q) : [+btns[0].dataset.o];
        for(const i of want){ const b = document.querySelector(`#v-quiz button[data-o="${i}"]`); if(b) b.click(); }
        const chk = document.getElementById('btnCheck'); if(!chk) return false;
        chk.click();
      } else if(allCorrect){
        const c = q.options.findIndex(o => o.correct);
        document.querySelector(`#v-quiz button[data-o="${c}"]`).click();
      } else btns[0].click();
      return true;
    };
  });
  const started = await page.evaluate(() => {
    if(typeof startQuiz !== 'function') return 'no startQuiz';
    try { startQuiz(TOPICS[0].id); return 'ok'; } catch(e){ return String(e); }
  });
  check(started === 'ok', 'a quiz starts', started);
  await page.waitForTimeout(400);

  const opts = await page.$$('#v-quiz button[data-o]');
  check(opts.length >= 2, `question options render (${opts.length} found)`);
  if(opts.length){
    await page.evaluate(() => answerCurrent(false));
    await page.waitForTimeout(500);
    const after = await page.innerText('body');
    check(after.toLowerCase().includes('concept behind this') || after.length > body.length, 'answering reveals the explanation');
  }
  // A teachImg renders only inside the concept block, so answering a
  // question that carries one is the only way to see whether it displays.
  // Driving a specific question makes this assert something; counting
  // whatever happened to be on screen would pass with zero figures.
  let shown = await page.evaluate(() => {
    const want = QUESTIONS.filter(q => q.teachImg);
    if(!want.length) return {none: true};
    const noTeach = want.filter(q => !q.teach).map(q => q.id);
    const missing = [], notEmbedded = [];
    for(const q of want){
      startQuiz(q.topic);
      if(!Q) return {err: 'startQuiz left no quiz state'};
      Q.current = q; Q.order = q.options.map((o, i) => i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
      renderQuiz();
      if(!answerCurrent(true)){ missing.push(q.id + ' (no options)'); continue; }
      const img = document.querySelector('#v-quiz img.qimg');
      if(!img){ missing.push(q.id + ' -> ' + q.teachImg); continue; }
      if(!img.getAttribute('src').startsWith('data:image/')) notEmbedded.push(q.id);
    }
    return {n: want.length, noTeach, missing, notEmbedded};
  });
  if(shown.none) skip('concept-block figures render after answering', 'no question in this bank carries a teachImg');
  else {
    check(!shown.err, 'questions carrying a figure can be reached', shown.err || '');
    check(!(shown.noTeach || []).length, 'every teachImg sits on a question that has a concept block',
      'these would never display: ' + (shown.noTeach || []).join(', '));
    check(!(shown.missing || []).length, `all ${shown.n} concept-block figures render after answering`,
      'did not render: ' + (shown.missing || []).slice(0, 6).join(', '));
    check(!(shown.notEmbedded || []).length, 'every rendered figure is an embedded data URL', (shown.notEmbedded || []).slice(0, 6).join(', '));
  }

  // Every question, answered through the real renderer. The checks above
  // drive a handful; a fault in one question's data — an option list that
  // renders short, an explanation that throws, a citation that vanishes —
  // only shows up when that question is the one on screen.
  const every = await page.evaluate(() => {
    const bad = {options: [], verdict: [], whys: [], cite: [], threw: []};
    for(const q of QUESTIONS){
      if(q.type) continue;   // numeric and matching items have their own check
      try {
        startQuiz(q.topic);
        Q.current = q; Q.order = q.options.map((o, i) => i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
        renderQuiz();
        const btns = document.querySelectorAll('#v-quiz button[data-o]');
        if(btns.length !== q.options.length){ bad.options.push(`${q.id} (${btns.length}/${q.options.length})`); continue; }
        if(!answerCurrent(true)){ bad.verdict.push(q.id + ' (could not answer)'); continue; }
        const panel = document.querySelector('#v-quiz .why');
        if(!panel){ bad.verdict.push(q.id); continue; }
        const verdict = panel.querySelector('.verdict');
        if(!verdict || !verdict.classList.contains('ok')) bad.verdict.push(q.id + ' (keyed answer not marked correct)');
        const rows = panel.querySelectorAll('.wrow');
        if(rows.length !== q.options.length) bad.whys.push(`${q.id} (${rows.length}/${q.options.length})`);
        if(/\b(undefined|null|NaN|\[object Object\])\b/.test(document.getElementById('v-quiz').textContent))
          bad.whys.push(`${q.id} (undefined/null text reached the page)`);
        const cite = panel.querySelector('.cite');
        if(!cite || cite.textContent.trim().length < 5) bad.cite.push(q.id);
      } catch(e){ bad.threw.push(`${q.id}: ${e.message}`); }
    }
    return bad;
  });
  const nQ = await page.evaluate(() => QUESTIONS.length);
  check(!every.threw.length, `all ${nQ} questions answer without throwing`, every.threw.slice(0, 3).join(' | '));
  check(!every.options.length, 'every question renders all of its options', every.options.slice(0, 5).join(', '));
  check(!every.verdict.length, 'every answer produces an explanation panel', every.verdict.slice(0, 5).join(', '));
  check(!every.whys.length, 'every option gets its own explanation row', every.whys.slice(0, 5).join(', '));
  check(!every.cite.length, 'every question shows a citation', every.cite.slice(0, 5).join(', '));

  // The full sweep: every question once, in order, no repeats, ending on
  // its own panel. A queue that loops or stops short is invisible until
  // someone actually walks it.
  const sweep = await page.evaluate(() => {
    show('topics');
    const btn = document.getElementById('sweepAll');
    if(!btn) return {err: 'no "All questions" button on the topics view'};
    btn.click();
    if(!Q || !Q.sweep) return {err: 'sweep did not start'};
    const want = Q.sweep.length;
    const seen = new Set(); let dup = 0, n = 0;
    while(Q && Q.current && n < want + 20){
      if(seen.has(Q.current.id)) dup++;
      seen.add(Q.current.id);
      if(!answerCurrent(false)) return {err: 'no options at question ' + (n + 1)};
      const nx = document.getElementById('btnNext');
      if(!nx) return {err: 'no Next button at question ' + (n + 1)};
      nx.click(); n++;
    }
    return {want, answered: n, distinct: seen.size, dup, ended: !!document.querySelector('#v-quiz .empty')};
  });
  check(!sweep.err, 'the full sweep starts from the topics view', sweep.err || '');
  if(!sweep.err){
    check(sweep.answered === sweep.want, `the sweep serves all ${sweep.want} questions`, `served ${sweep.answered}`);
    check(sweep.dup === 0, 'the sweep repeats nothing', `${sweep.dup} repeats`);
    check(sweep.distinct === sweep.want, 'the sweep covers every question', `${sweep.distinct} of ${sweep.want} distinct`);
    check(sweep.ended, 'the sweep ends on its completion panel');
  }

  // The app is opened from disk, where a browser can give the page an
  // opaque origin and make localStorage throw on the first read. That used
  // to happen while the script was still evaluating, which left a blank
  // page. Loading with storage denied proves the drill still runs.
  const denied = await browser.newPage({viewport: {width: 1280, height: 900}});
  const deniedErrors = [];
  denied.on('pageerror', e => deniedErrors.push(String(e)));
  denied.on('dialog', d => d.dismiss());
  await denied.addInitScript(() => {
    const boom = () => { throw new DOMException('denied', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', {configurable: true, get: boom});
  });
  await denied.goto(URL_);
  await denied.waitForTimeout(1000);
  await denied.evaluate(() => { window.prompt = () => 'TestUser'; });
  const survived = await denied.evaluate(() => {
    try {
      if(typeof QUESTIONS === 'undefined') return {err: 'script did not finish'};
      startQuiz(TOPICS[0].id);
      const btns = document.querySelectorAll('#v-quiz button[data-o]');
      if(!btns.length) return {err: 'no options rendered'};
      const q = Q.current;
      if(isMulti(q)){ for(const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
      else btns[0].click();
      return {ok: !!document.querySelector('#v-quiz .why')};
    } catch(e){ return {err: e.message}; }
  });
  check(!survived.err && survived.ok, 'the drill still runs when the browser denies localStorage', survived.err || 'no explanation panel');
  check(!deniedErrors.length, 'no uncaught error with storage denied', deniedErrors.slice(0, 2).join('; '));
  await denied.close();

  // The reference text is authored as HTML, so any label re-escaped for an
  // attribute or a caption can reach the reader as a literal "&mdash;".
  const ref = await page.evaluate(() => {
    show('ref');
    const el = document.querySelector('#v-ref');
    const raw = t => /&[a-z]+;/i.test(t);
    return {
      figs: el.querySelectorAll('.reffig img').length,
      secs: el.querySelectorAll('h3').length,
      navs: el.querySelectorAll('.refnav a').length,
      entities: [...el.querySelectorAll('figcaption, .refnav a, h3')].map(e => e.textContent).filter(raw).slice(0, 4),
      tokens: /\{\{fig:/.test(el.innerHTML),
      broken: [...el.querySelectorAll('.reffig img')].filter(i => !i.getAttribute('src').startsWith('data:image/'))
        .map(i => i.getAttribute('alt')).slice(0, 4),
    };
  });
  check(ref.secs > 0 && ref.navs === ref.secs, `reference has ${ref.secs} sections, each with a jump link`, `${ref.navs} links for ${ref.secs} sections`);
  if(ref.figs) check(true, `reference figures render (${ref.figs})`);
  check(!ref.broken.length, 'every reference figure is an embedded data URL', ref.broken.join(', '));
  check(!ref.tokens, 'no unexpanded figure token reached the reference');
  check(!ref.entities.length, 'no raw HTML entity reaches the reader', ref.entities.join(' | '));

  const hasAtlas = await page.evaluate(() => !!(document.querySelector('#nav button[data-v="atlas"]') && typeof ATLAS !== 'undefined' && ATLAS.boards && ATLAS.boards.length));
  if(hasAtlas){
    // The atlas is a recall surface as well as a reference one, so the
    // names have to be hideable and the structures have to survive hiding.
    const atlas = await page.evaluate(() => {
      show('atlas');
      const el = document.getElementById('v-atlas');
      const tiles = () => [...el.querySelectorAll('.attile')].filter(t => !t.hidden);
      const before = tiles().length;
      const hide = el.querySelector('#atHide');
      if(hide) hide.click();
      const hidden = el.classList.contains('namesoff');
      const reveal = el.querySelector('#atShow');
      const revealOffered = !!reveal && !reveal.classList.contains('hide');
      if(hide) hide.click();          // back to names shown
      const box = el.querySelector('#atq');
      let filtered = before;
      if(box){
        // search for the first word of the last tile's name: a term that
        // matches at least one tile and, on any atlas with more than a
        // handful of tiles, not all of them
        const names = [...el.querySelectorAll('.attile .atname')].map(n => n.textContent.trim());
        box.value = (names[names.length - 1] || 'a').split(/\s+/)[0].toLowerCase();
        box.oninput();
        filtered = tiles().length;
        box.value = '';
        box.oninput();
      }
      return {tiles: before,
        items: ATLAS.boards.reduce((n, b) => n + b.sections.reduce((m, s) => m + s.items.length, 0), 0),
        svgs: el.querySelectorAll('.attile .atfig svg').length,
        boards: el.querySelectorAll('.atboard').length, boardsInData: ATLAS.boards.length,
        hidden, filtered, restored: tiles().length, revealOffered, hasSearch: !!box, hasHide: !!hide};
    });
    check(atlas.tiles === atlas.items && atlas.tiles > 0, `atlas renders a tile per item (${atlas.tiles} of ${atlas.items})`);
    check(atlas.svgs === atlas.tiles, 'every atlas tile draws a structure', `${atlas.svgs} drawings for ${atlas.tiles} tiles`);
    check(atlas.boards === atlas.boardsInData, `atlas boards render (${atlas.boards} of ${atlas.boardsInData})`);
    check(atlas.hasHide && atlas.hidden, 'hiding the names puts the atlas into recall mode');
    check(atlas.revealOffered, 'recall mode offers a way to reveal every name again');
    check(atlas.hasSearch && 0 < atlas.filtered && atlas.filtered < atlas.tiles, 'atlas search narrows the tiles', `${atlas.filtered} of ${atlas.tiles} left after searching`);
    check(atlas.restored === atlas.tiles, 'clearing the search brings every tile back', `${atlas.restored} of ${atlas.tiles}`);
  }

  // A question that asks for the name of a drawn group must not carry
  // that name anywhere a reader can reach before answering.
  const drawn = await page.evaluate(() => {
    const q = QUESTIONS.filter(x => x.fg);
    const has = typeof FGQ !== 'undefined';
    const missing = q.filter(x => !has || !FGQ[x.fg]).map(x => x.id);
    const leaks = q.filter(x => {
      const svg = (has && FGQ[x.fg]) || '';
      return svg.includes(x.fg) || /aria-label="(?!Chemical structure)/.test(svg);
    }).map(x => x.id);
    return {n: q.length, missing: missing.slice(0, 4), leaks: leaks.slice(0, 4)};
  });
  if(drawn.n === 0 && !hasAtlas) skip('drawn structures', 'no question in this bank carries a drawn structure (no atlas)');
  else {
    check(drawn.n > 0, `questions carry a drawn structure (${drawn.n})`);
    check(!drawn.missing.length, 'every drawn structure resolves to a group', drawn.missing.join(', '));
    check(!drawn.leaks.length, 'no drawing names the group it is asking about', drawn.leaks.join(', '));
  }
  shown = await page.evaluate(() => {
    const drawn = QUESTIONS.filter(q => q.fg);
    if(!drawn.length) return 'ok';
    const missing = [];
    for(const q of drawn){
      startQuiz(q.topic);
      Q.current = q; Q.order = q.options.map((o, i) => i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
      renderQuiz();
      if(!document.getElementById('v-quiz').querySelector('.fgshow svg')) missing.push(q.id);
    }
    return missing.length ? `${missing.length} show no drawing: ` + missing.slice(0, 4).join(', ') : 'ok';
  });
  check(shown === 'ok', 'every structure question shows its drawing before the answer', shown);

  // The general form of that check. A stem that says "shown", "below",
  // "drawn" or "pictured" is promising the reader something to look at.
  // Nine ring questions once shipped with that promise and an empty
  // card, because the drawing lived in a field the pre-answer render
  // never read. This walks every such stem and requires a visible
  // figure of any kind before the answer.
  const promised = await page.evaluate(() => {
    const re = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
    const qs = QUESTIONS.filter(q => re.test(q.stem));
    const bare = [];
    for(const q of qs){
      startQuiz(q.topic);
      Q.current = q; Q.order = (q.options || []).map((o, i) => i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
      renderQuiz();
      const figs = document.getElementById('v-quiz').querySelectorAll('.qbody svg, .qbody img, .fgshow svg, .qimg');
      if(!figs.length) bare.push(q.id);
    }
    return {n: qs.length, bare};
  });
  if(promised.n === 0) skip('stems that promise a figure show one', 'no stem in this bank promises a figure');
  else check(promised.n > 0, `stems that promise a figure exist (${promised.n})`);
  check(!promised.bare.length, 'every stem that promises a figure shows one before the answer',
    `${promised.bare.length} bare: ` + promised.bare.slice(0, 8).join(', '));

  // Select-all items: toggles, the Check button, all-or-nothing grading in
  // the quiz, the logged picks, and the exam paper's share of them.
  const sata = await page.evaluate(() => {
    const out = {};
    const qs = QUESTIONS.filter(isMulti);
    out.n = qs.length;
    if(!qs.length) return out;
    const q = qs[0];
    const fresh = () => { startQuiz(q.topic);
      Q.current = q; Q.order = q.options.map((o, i) => i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
      renderQuiz(); };
    fresh();
    const el = document.getElementById('v-quiz');
    out.banner = !!el.querySelector('.sata');
    out.toggles = el.querySelectorAll('button.opt.multi').length === q.options.length;
    const chk = () => document.getElementById('btnCheck');
    out.checkDisabledAtStart = !!chk() && chk().disabled;
    // a partial set: toggle one correct option, check -> marked wrong
    const want = correctSet(q);
    document.querySelector(`#v-quiz button[data-o="${want[0]}"]`).click();
    out.toggledOn = !!document.querySelector(`#v-quiz button[data-o="${want[0]}"].on`);
    out.checkEnabledAfterToggle = !!chk() && !chk().disabled;
    const before = DB.answers.length;
    chk().click();
    const v1 = el.querySelector('.verdict');
    out.partialMarkedWrong = !!v1 && v1.classList.contains('bad');
    const logged = DB.answers[DB.answers.length - 1];
    out.logged = DB.answers.length === before + 1 && logged.qid === q.id && logged.result === 'wrong'
                 && Array.isArray(logged.picked) && logged.picked.length === 1 && logged.picked[0] === want[0];
    out.youSelected = el.querySelectorAll('.youpicked').length === 1;
    // the full set: every correct option and nothing else -> marked right
    fresh();
    for(const i of want) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
    chk().click();
    const v2 = el.querySelector('.verdict');
    out.fullMarkedRight = !!v2 && v2.classList.contains('ok');
    out.guessOffered = !!document.getElementById('btnGuess');
    // the full set plus one wrong option -> marked wrong
    const wrong = q.options.findIndex(o => !o.correct);
    fresh();
    for(const i of [...want, wrong]) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
    chk().click();
    const v3 = el.querySelector('.verdict');
    out.extraMarkedWrong = !!v3 && v3.classList.contains('bad');
    // the exam paper draws its share of select-all items and renders them with toggles
    show('exam');
    document.getElementById('startExam').click();
    out.examSata = EX.qs.filter(isMulti).length;
    // the blueprint's own select-all count governs when the course has one
    out.examTarget = (EXAM.blueprint && (EXAM.blueprint.parts || []).length) ? (EXAM.blueprint.sata || 0) : EXAM_SATA;
    const first = EX.qs.findIndex(isMulti);
    if(first >= 0){
      EX.i = first; renderExamQ();
      const ex = document.getElementById('v-exam');
      out.examToggles = ex.querySelectorAll('button.opt.multi').length === EX.qs[first].options.length;
      out.examChip = !!ex.querySelector('.tag.sata');
      ex.querySelector('button.opt.multi').click();
      out.examPickIsArray = Array.isArray(EX.picks[first]) && EX.picks[first].length === 1;
    }
    clearInterval(EX.timer); EX = null;
    return out;
  });
  if(sata.n === 0 && !sata.examTarget) skip('select-all items', 'no select-all question in this bank and none on the blueprint');
  else check(sata.n >= (sata.examTarget || 0), `select-all questions exist (${sata.n}, the paper draws ${sata.examTarget || 0})`);
  if(sata.n){
    check(sata.banner && sata.toggles, 'a select-all item renders its banner and toggle options');
    check(sata.checkDisabledAtStart && sata.checkEnabledAfterToggle && sata.toggledOn, 'the Check button waits for a selection and toggles mark on');
    check(sata.partialMarkedWrong, 'a partial selection is marked wrong');
    check(sata.logged, 'the answer log stores the picked set and the verdict');
    check(sata.youSelected, 'the review marks which options were selected');
    check(sata.fullMarkedRight && sata.guessOffered, 'the complete correct set is marked right and can be flagged as a guess');
    check(sata.extraMarkedWrong, 'the correct set plus a wrong option is marked wrong');
    check(sata.examSata === sata.examTarget, `the exam paper carries ${sata.examTarget} select-all items`, `drew ${sata.examSata}`);
    if(sata.examTarget) check(sata.examToggles && sata.examChip && sata.examPickIsArray, 'exam select-all items render toggles, a chip, and store an array of picks');
    else skip('exam select-all rendering', 'the blueprint puts no select-all item on the paper');
  }

  // Weak spots after mixed results: the next-step cards and the confusion table render
  const gaps = await page.evaluate(() => {
    show('gaps');
    const el = document.getElementById('v-gaps');
    return {cards: el.querySelectorAll('.nextcard').length, pools: EXAM.pools.length, table: !!el.querySelector('table'), text: el.innerText.length};
  });
  check(gaps.cards === gaps.pools, `weak spots shows a next-step card per pool (${gaps.cards} of ${gaps.pools})`);
  check(gaps.table && gaps.text > 200, 'weak spots renders its tables');

  // typed items: a numeric answer graded and its steps shown; a matching table graded per pair
  const typed = await page.evaluate(() => {
    const out = {};
    const nq = QUESTIONS.find(q => q.type === 'numeric');
    if(nq){
      startQuiz(nq.topic);
      Q.current = nq; Q.order = []; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now(); Q.rights = null;
      renderQuiz();
      const inp = document.getElementById('numIn');
      out.numInput = !!inp;
      if(inp){ inp.value = String(nq.answer); document.getElementById('btnCheck').click(); }
      const v = document.querySelector('#v-quiz .verdict');
      out.numRight = !!(v && v.classList.contains('ok'));
      out.numSteps = document.querySelectorAll('#v-quiz .steps li').length;
      // a wrong answer offers the kind-of-miss buttons
      Q.current = nq; Q.order = []; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
      renderQuiz();
      const inp2 = document.getElementById('numIn'); inp2.value = String(nq.answer + 1000); document.getElementById('btnCheck').click();
      out.missButtons = document.querySelectorAll('#v-quiz [data-miss]').length;
      const mb = document.querySelector('#v-quiz [data-miss]'); if(mb) mb.click();
      out.missLogged = DB.answers[DB.answers.length - 1].miss || null;
    }
    const mq = QUESTIONS.find(q => q.type === 'match');
    if(mq){
      startQuiz(mq.topic);
      Q.current = mq; Q.order = []; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now(); Q.rights = null;
      renderQuiz();
      const sels = [...document.querySelectorAll('#v-quiz select[data-row]')];
      out.matchRows = sels.length;
      sels.forEach((s, i) => { s.value = String(i); s.dispatchEvent(new Event('change')); });
      const bc = document.getElementById('btnCheck'); out.matchEnabled = bc && !bc.disabled;
      if(bc) bc.click();
      const v = document.querySelector('#v-quiz .verdict');
      out.matchRight = !!(v && v.classList.contains('ok'));
      out.pairOk = (DB.answers[DB.answers.length - 1].pairOk || []).every(Boolean);
    }
    return out;
  });
  if('numInput' in typed){
    check(typed.numInput && typed.numRight && typed.numSteps >= 2, `numeric item grades the answer and shows its steps (${typed.numSteps} steps)`);
    check(typed.missButtons === 4 && typed.missLogged, 'a wrong numeric answer logs the kind of miss');
  } else skip('numeric items', 'no numeric question in this bank');
  if('matchRows' in typed)
    check(typed.matchRows >= 3 && typed.matchEnabled && typed.matchRight && typed.pairOk, `matching item grades every pair (${typed.matchRows} rows)`);
  else skip('matching items', 'no matching question in this bank');

  // the exam paper survives a reload and can be submitted in part
  const ex = await page.evaluate(() => {
    beginExam();
    const q0 = EX.qs[0]; EX.picks[0] = isMulti(q0) ? correctSet(q0) : q0.options.findIndex(o => o.correct);
    saveExam();
    const saved = store.get(NS + ':exam:' + PROFILE);
    EX = null;
    const back = restoreExam();
    const same = back && EX && EX.qs.length === EXAM.questions && (Array.isArray(EX.picks[0]) ? EX.picks[0].length > 0 : EX.picks[0] !== null);
    const before = DB.answers.length;
    finishExam(true);
    const logged = DB.answers.length - before;
    return {saved: !!saved, same, logged, cleared: !store.get(NS + ':exam:' + PROFILE)};
  });
  check(ex.saved && ex.same, 'an exam paper in progress is saved and restored');
  check(ex.logged === 1 && ex.cleared, `submitting a partial paper logs only the answered items (${ex.logged} logged)`);

  // ---- What's new card and the change log ----------------------------
  const news = await page.evaluate(() => {
    const log = BUILD.changelog || [];
    if(!log.length) return {none: true};
    store.set(NS + ':newsSeen', '');
    show('topics');
    const card = document.getElementById('news');
    const out = {items: card ? card.querySelectorAll('li').length : 0, card: !!card};
    if(card){ document.getElementById('newsok').click();
      out.dismissed = !document.getElementById('news');
      out.remembered = store.get(NS + ':newsSeen') === log[0].date + '|' + log[0].items.join('').length; }
    show('settings');
    out.inSettings = !!document.getElementById('changelog');
    show('topics');
    out.staysDismissed = !document.getElementById('news');
    return out;
  });
  if(news.none) skip("What's new card", 'the build carries no change log');
  else {
    check(news.card && news.items > 0, `What's new card shows the newest entries (${news.items} bullets)`);
    check(news.dismissed && news.remembered, '"Got it" dismisses the card and remembers the entry');
    check(news.staysDismissed, 'the card stays dismissed on the next visit to Topics');
    check(news.inSettings, 'Settings lists the whole change log');
  }

  // ---- session progress and the review plan --------------------------
  const sess = await page.evaluate(() => {
    // answer a handful through the real UI, getting one wrong on purpose
    startQuiz(TOPICS[0].id);
    // Under an FSRS model a topic answered earlier in this run can have
    // nothing due yet (a miss comes back after the library's relearning
    // step), so the session line is read on a question the drill can serve.
    const mode = DB.settings.mode;
    if(!Q || !Q.current) startQuiz(null);
    if(!Q || !Q.current){ DB.settings.mode = 'all'; startQuiz(null); }
    const out = {};
    for(let i = 0; i < 4; i++){
      if(!Q || !Q.current) break;
      answerCurrent(i !== 1);
      // read the session line while a question is still on screen: a
      // short topic can run out before the loop does
      if(!out.strip) out.strip = (document.getElementById('sess') || {}).textContent || '';
      const nx = document.getElementById('btnNext'); if(nx) nx.click();
    }
    out.logged = sessionLog().length;
    DB.settings.mode = mode;
    show('gaps');
    const el = document.getElementById('v-gaps');
    out.sessionCard = !!el.querySelector('.sdots10');
    out.dots = el.querySelectorAll('.sdots10 i').length;
    out.plan = el.querySelectorAll('.panel.plan').length;
    out.planText = el.innerText.includes('What to review next');
    const drill = el.querySelector('[data-area]');
    out.drills = !!drill;
    if(drill){ drill.click(); out.drilled = !!(Q && Q.current); show('gaps'); }
    return out;
  });
  check(sess.logged >= 2, `answers land in this session (${sess.logged} logged)`);
  check((sess.strip || '').includes('This session'), 'the quiz carries a session line', (sess.strip || '').slice(0, 60));
  check(sess.sessionCard && sess.dots >= 2, `Weak spots shows this session's dots (${sess.dots})`);
  check(sess.planText, 'Weak spots shows the review plan');
  check(sess.plan >= 1, `the plan groups what is not solid (${sess.plan} section(s))`);
  check(sess.drills && sess.drilled, 'a plan section drills its own questions');

  // ---- Explain more links, and the way back -------------------------
  const links = await page.evaluate(() => {
    const q = QUESTIONS.find(x => linksFor(x).length);
    if(!q) return {none: true};
    startQuiz(q.topic);
    Q.current = q; Q.order = (q.options || []).map((o, i) => i); Q.picked = null; Q.revealed = false;
    renderQuiz(); answerCurrent(true);
    const chip = document.querySelector('#v-quiz [data-jump]');
    const out = {chip: !!chip};
    if(chip){
      const [v, a] = chip.dataset.jump.split(':');
      chip.click();
      out.view = VIEW; out.want = v;
      out.target = !!document.getElementById(a);
      const back = document.getElementById('backbtn');
      out.back = !!back;
      if(back){ back.click(); out.returned = VIEW; }
    }
    return out;
  });
  if(links.none) skip('Explain more links', 'no question in this bank resolves to a reading section');
  else {
    check(links.chip, 'an answered question offers its reading sections');
    check(links.view === links.want, `the chip opens that tab (${links.view})`);
    check(links.target, 'the section it names exists in that tab');
    check(links.back && links.returned === 'quiz', 'the floating button comes back to the question');
  }

  // ---- Explain-one cards in a table ---------------------------------
  const xp = await page.evaluate(() => {
    show('ref');
    const btn = document.querySelector('#v-ref [data-xpick]');
    if(!btn) return {none: true};
    const [g] = btn.dataset.xpick.split(':');
    btn.click();
    const out = {filled: (document.querySelector(`[data-xout="${g}"]`) || {innerHTML: ''}).innerHTML.length > 20};
    const sel = document.querySelector(`select[data-xsel="${g}"]`);
    if(sel && sel.options.length > 2){
      sel.value = sel.options[2].value; sel.dispatchEvent(new Event('change', {bubbles: true}));
      out.viaSelect = (document.querySelector(`[data-xout="${g}"]`) || {innerHTML: ''}).innerHTML.length > 20;
    }
    const go = document.querySelector(`[data-xout="${g}"] [data-xgo]`);
    if(go){ go.click(); out.xback = !!document.getElementById('xback'); }
    return out;
  });
  if(xp.none) skip('Explain-one cards', 'no table in this bank carries one');
  else {
    check(xp.filled, 'a Why? button fills the explanation card');
    check(xp.viaSelect !== false, 'the Explain-one select fills it too');
    check(xp.xback !== false, 'following a card to its figure offers a way back');
  }

  // ---- step-through figures -----------------------------------------
  const st = await page.evaluate(() => {
    const keys = (typeof DIA === 'undefined' ? [] : Object.keys(DIA).filter(k => /data-anim/.test(DIA[k])));
    if(!keys.length) return {none: true};
    show('diagrams');
    const fig = document.querySelector('#v-diagrams .fig');
    if(!fig) return {err: 'no figure rendered in the Diagrams tab'};
    const steps = fig.querySelectorAll('.st').length;
    const shownAt = () => [...fig.querySelectorAll('.st')].findIndex(s => s.classList.contains('on'));
    const first = shownAt();
    fig.querySelector('[data-go="1"]').click();
    const after = shownAt();
    fig.querySelector('[data-go="dot"][data-i="0"]').click();
    return {keys: keys.length, steps, first, after, back: shownAt(),
            dots: fig.querySelectorAll('.sdot').length, chips: document.querySelectorAll('#v-diagrams [data-dg]').length};
  });
  if(st.none) skip('step-through figures', 'no figure in DIA carries step controls');
  else {
    check(!st.err, 'the Diagrams tab renders its figures', st.err || '');
    check((st.steps || 0) >= 2, `a step-through has its steps (${st.steps})`);
    check(st.first === 0 && st.after === 1, 'Next moves one step on');
    check(st.back === 0, 'a step dot jumps back to that step');
    check(st.dots === st.steps, 'one dot per step');
    check((st.chips || 0) > 0, 'the contents chips list the figures');
  }

  // ---- figure labels stay inside their figure ------------------------
  // A label that overflows the SVG box is invisible on a phone and cut off
  // on a desktop, and nothing else in the suite notices.
  const overflow = await page.evaluate(() => {
    const bad = [];
    const keys = (typeof DIA === 'undefined' ? [] : Object.keys(DIA));
    const host = document.getElementById('v-topics');
    const old = host.innerHTML;
    for(const k of keys){
      host.innerHTML = '<div style="max-width:620px">' + DIA[k] + '</div>';
      const svg = host.querySelector('svg'); if(!svg) continue;
      const steps = [...host.querySelectorAll('.st')];
      const groups = steps.length ? steps : [svg];
      groups.forEach((g, gi) => {
        steps.forEach((s, j) => s.classList.toggle('on', j === gi));
        const box = svg.getBoundingClientRect();
        g.querySelectorAll('text').forEach(t => {
          const r = t.getBoundingClientRect();
          if(!r.width) return;
          if(r.left < box.left - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1 || r.top < box.top - 1)
            bad.push(k + (steps.length ? ' step ' + (gi + 1) : '') + ': "' + t.textContent.slice(0, 24) + '"');
        });
      });
    }
    host.innerHTML = old;
    return [...new Set(bad)];
  });
  if(!(await page.evaluate(() => typeof DIA !== 'undefined' && Object.keys(DIA).length))) skip('figure labels inside the box', 'no drawn figures in this bank');
  else check(!overflow.length, 'every figure label sits inside its figure', overflow.slice(0, 5).join(', '));

  // every view renders without throwing
  const hasDia = await page.evaluate(() => !!document.querySelector('#nav button[data-v="diagrams"]'));
  for(const view of ['topics', 'quiz', 'gaps', 'exam'].concat(hasAtlas ? ['atlas'] : [], hasDia ? ['diagrams'] : [], ['guide', 'tell', 'ref', 'settings'])){
    const r = await page.evaluate(v => { try { if(typeof show === 'function'){ show(v); return 'ok'; } return 'no show()'; } catch(e){ return String(e); } }, view);
    await page.waitForTimeout(150);
    check(r === 'ok', `view '${view}' renders`, r);
  }
  check(!errors.length, 'no uncaught error after interaction', errors.slice(0, 2).join('; '));

  // ---- wide tables and long chips in the reading tabs, on a phone ----
  // A table wider than the screen scrolls sideways inside its own box
  // (boxTables in views.js, .tscroll in shell.html) and the page does not; a
  // jump-list chip longer than the screen wraps. A table built here, wider
  // than any phone, is checked on every course; the course's own wide tables
  // are checked when it has any.
  async function phoneTables(p, tabs){
    const boxed = () => [...document.querySelectorAll('main > section:not(.hide) table')]
      .filter(t => t.getBoundingClientRect().width > innerWidth).map(t => {
        const box = t.parentElement, r = box.getBoundingClientRect();
        const inBox = box.classList.contains('tscroll') && r.right <= innerWidth + 1 && box.scrollWidth > box.clientWidth + 2;
        if(inBox){ box.scrollLeft = 60; }
        const moved = inBox && box.scrollLeft > 0 && scrollX === 0 && document.documentElement.scrollWidth - innerWidth <= 2;
        if(inBox) box.scrollLeft = 0;
        return {ok: !!moved, table: Math.round(t.getBoundingClientRect().width), box: Math.round(r.width)};
      });
    const own = [], chips = [];
    for(const v of ['guide', 'tell', 'ref'].filter(v => tabs.includes(v))){
      own.push(...(await p.evaluate(([v, f]) => { show(v); return eval(f)(); }, [v, '(' + boxed + ')'])).map(x => Object.assign({v}, x)));
      chips.push(...await p.evaluate(v => { const d = document.querySelector(`#v-${v} .refnav-wrap`); if(!d) return [];
        d.open = true; const out = [...d.querySelectorAll('.refnav a')].filter(a => a.getBoundingClientRect().right > innerWidth + 1)
          .map(a => `${v}: ${a.textContent.slice(0, 40)}`); d.open = false; return out; }, v));
    }
    const planted = await p.evaluate(f => {
      show('ref');
      const cells = Array.from({length: 8}, (_, i) => `<td style="white-space:nowrap">Column ${i + 1} of a test table built by browser_test.js</td>`).join('');
      renderDoc(document.getElementById('v-ref'), `<p>Test table.</p><table class="reftab"><tr>${cells}</tr></table>`, 'ref');
      const r = eval(f)(); show('ref'); return r;
    }, '(' + boxed + ')');
    check(planted.length === 1 && planted[0].ok, `a table wider than the screen scrolls inside its own box and the page does not (${planted[0] ? planted[0].table + ' px table, ' + planted[0].box + ' px wide around it' : 'no wide table'})`, planted);
    if(!own.length) skip('the course\'s own tables wider than the screen', 'none in this bank at 375 px');
    else check(own.every(x => x.ok), `each of the course's ${own.length} reading-tab tables wider than the screen scrolls inside its own box`,
      own.filter(x => !x.ok).slice(0, 3));
    check(!chips.length, 'every jump-list chip in the reading tabs fits on the phone screen', chips.slice(0, 3).join(' | '));
  }

  // ---- every tab, on a phone and on a desktop, light and dark --------
  // Three faults live only here: a page that scrolls sideways on a phone,
  // a value that renders as "undefined" or "NaN" in one view only, and a
  // colour that is only defined for one theme.
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));
  for(const [w, label] of [[375, 'phone'], [1100, 'desktop']]){
    for(const scheme of ['light', 'dark']){
      const p2 = await browser.newPage({viewport: {width: w, height: 820}, colorScheme: scheme});
      const errs2 = [];
      p2.on('pageerror', e => errs2.push(String(e)));
      p2.on('dialog', d => d.dismiss());
      await p2.addInitScript(() => { window.prompt = () => 'TestUser'; });
      await p2.goto(URL_);
      await p2.waitForTimeout(700);
      const worst = [], wide = [];
      for(const v of tabs){
        await p2.evaluate(v => show(v), v);
        await p2.waitForTimeout(180);
        const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if(over > 2) wide.push(`${v} by ${over}px`);
        const txt = await p2.innerText('body');
        for(const token of ['undefined', 'NaN', '[object Object]']) if(txt.includes(token)) worst.push(`${v}: ${token}`);
      }
      check(!wide.length, `no sideways scroll on ${label} (${scheme})`, wide.join(', '));
      check(!worst.length, `no undefined or NaN on screen on ${label} (${scheme})`, worst.slice(0, 4).join(', '));
      if(label === 'phone' && scheme === 'light') await phoneTables(p2, tabs);
      check(!errs2.length, `no page error on ${label} (${scheme})`, errs2.slice(0, 2).join('; '));
      await p2.close();
    }
  }
  await browser.close();
  console.log();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
