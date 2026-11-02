/* Start-up and the saved progress.
 *
 * Start-up used to build the tabs before it read the saved progress. When one
 * of those steps threw (in a scratch move of the Pharmacokinetics drill, a
 * DIAGRAMS list of another shape), start-up stopped before the load, the drill
 * ran on a blank progress, and the next answer was saved over the saved
 * progress. A load that could not read what was stored (not valid JSON) also
 * went on with a blank progress and wrote over it. This check opens the built
 * page with saved progress:
 *
 *   1. nothing fails: the progress is loaded and shown, an answer and an exam
 *      paper are saved, no notice
 *   2. a start-up step throws (DIAGRAMS of the wrong shape; the offline copy's
 *      step; the reading tab a reload comes back to): the fault is on the
 *      console, the rest of start-up runs (Topics on screen), the progress is
 *      loaded and shown, an answer is saved, and no write ever stores fewer
 *      answers or history entries than were saved
 *   3. the load fails (not valid JSON; a value the load cannot convert; a
 *      load that throws): nothing is written over the stored progress, its
 *      history or an exam paper, Erase and Import change nothing, one notice
 *      says so, and another profile saves as usual
 *   4. the stored answer history cannot be read: progress still saves, and the
 *      history is left as it was
 *
 * The faults go into copies of the built page, just before its start-up block
 * (the BOOT marker built_page.js uses), so the check runs the same on any
 * course and on a page an older core built (DRILL_PAGE).
 *
 *     node startup_test.js
 */
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('./check_lib');
const NAME = 'startup_test.js';
const {check} = L;
L.PAGE.need(NAME);

const HTML = L.PAGE.read();
const BOOT_AT = (() => { const at = HTML.lastIndexOf('   BOOT'); return at < 0 ? -1 : HTML.lastIndexOf('/* ===', at); })();
if(BOOT_AT < 0){ console.log(`FAIL: ${NAME}: the BOOT marker was not found in the page script`); process.exit(1); }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'startup-test-'));
// a copy of the page with `code` run just before start-up
function variant(label, code){
  const file = path.join(TMP, label + '.html');
  fs.writeFileSync(file, HTML.slice(0, BOOT_AT) + `/* startup_test.js: ${label} */\n${code}\n` + HTML.slice(BOOT_AT));
  return file;
}

// answers the question on screen through its controls (history_test.js), then Next
const ANSWER = right => {
  if(!(Q && Q.current)) startSweep('all');
  const q = Q && Q.current; if(!q) return null;
  if(q.type === 'numeric'){ document.getElementById('numIn').value = String(right ? q.answer : q.answer + 1000); document.getElementById('btnCheck').click(); }
  else if(q.type === 'match'){
    const sels = [...document.querySelectorAll('#v-quiz select[data-row]')];
    sels.forEach((s, i) => { s.value = String(right ? i : (i + 1) % sels.length); s.dispatchEvent(new Event('change')); });
    document.getElementById('btnCheck').click();
  } else if(isMulti(q)){
    for(const i of (right ? correctSet(q) : [q.options.findIndex(o => !o.correct)])) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
    document.getElementById('btnCheck').click();
  } else document.querySelector(`#v-quiz button[data-o="${q.options.findIndex(o => right ? o.correct : !o.correct)}"]`).click();
  const b = document.getElementById('btnNext'); if(b) b.click();
  return q.id;
};
const noCount = () => EXAM.questions === null || EXAM.questions === undefined;
const answer = async (page, n) => { for(let i = 0; i < n; i++) await page.evaluate(ANSWER, i % 2 === 0); await page.waitForTimeout(400); };

// every write of the progress, the history and the exam paper, with its count
// of answers (progress) or entries (history), seen from the page's own storage
const WATCH = ([seed, session]) => {
  window.prompt = () => (window.__name || 'TestUser');
  try {
    for(const [k, v] of Object.entries(seed || {})) localStorage.setItem(k, v);
    for(const [k, v] of Object.entries(session || {})) sessionStorage.setItem(k, v);
  } catch(e){}
  window.__writes = [];
  const count = v => { try { const j = JSON.parse(v); return Array.isArray(j) ? j.length : (j && Array.isArray(j.answers) ? j.answers.length : null); } catch(e){ return null; } };
  const set = Storage.prototype.setItem, del = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(k, v){ if(/:(data|log|exam):/.test(k)) window.__writes.push({k, n: count(String(v))}); return set.call(this, k, v); };
  Storage.prototype.removeItem = function(k){ if(/:(data|log|exam):/.test(k)) window.__writes.push({k, del: true}); return del.call(this, k); };
};

(async () => {
  const {browser} = await L.launch(NAME);
  async function open(file, opts){
    opts = opts || {};
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(WATCH, [opts.seed || null, opts.session || null]);
    if(opts.init) await ctx.addInitScript(opts.init);
    const page = await ctx.newPage();
    const errors = [], logged = [], dialogs = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if(m.type() === 'error') logged.push(m.text()); });
    page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
    await page.goto(await L.pageUrl(file));
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForTimeout(300);
    return {ctx, page, errors, logged, dialogs};
  }
  const stored = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
  const count = s => { try { const j = JSON.parse(s); return Array.isArray(j) ? j.length : (j && Array.isArray(j.answers) ? j.answers.length : null); } catch(e){ return null; } };
  const writes = (page, k) => page.evaluate(k => window.__writes.filter(w => w.k === k), k);
  // the progress on the quiz screen: "This session: x/N"
  const shownN = page => page.evaluate(() => { startSweep('all'); const s = document.getElementById('sess'); const t = s ? s.textContent : '';
    const m = t.match(/This session: \d+\/(\d+)/); show('topics'); return m ? +m[1] : (/no answers yet/.test(t) ? 0 : null); });
  const topicsUp = page => page.evaluate(() => { const v = document.getElementById('v-topics');
    return !!v && !v.classList.contains('hide') && /Pick a topic/.test(v.textContent) && VIEW === 'topics'; });
  const notices = async page => { const els = await page.$$('#loadwarn'); return {n: els.length, text: els.length ? await els[0].textContent() : ''}; };

  // ---- the saved progress every case starts from: answers made through the page
  const base = await open(L.PAGE.PAGE);
  const NQ = await base.page.evaluate(() => QUESTIONS.length);
  const N = Math.min(5, NQ);
  await answer(base.page, N);
  const info = await base.page.evaluate(() => ({ns: NS, profile: PROFILE, data: keyFor(PROFILE), log: NS + ':log:' + PROFILE, exam: NS + ':exam:' + PROFILE}));
  const SEED = {[info.ns + ':profile']: info.profile, [info.data]: await stored(base.page, info.data), [info.log]: await stored(base.page, info.log)};
  await base.ctx.close();
  if(count(SEED[info.data]) !== N || count(SEED[info.log]) !== N){
    console.log(`FAIL: ${NAME}: ${N} answers in a clean page left ${count(SEED[info.data])} answers and ${count(SEED[info.log])} history entries saved`);
    await browser.close(); fs.rmSync(TMP, {recursive: true, force: true});
    process.exit(1);
  }
  console.log(`  ${N} answers saved as the starting progress (profile "${info.profile}", ${NQ} questions in the bank)`);

  console.log('\n=== Nothing fails ===');
  {
    const {ctx, page, errors, logged} = await open(L.PAGE.PAGE, {seed: SEED});
    check(await page.evaluate(() => DB.answers.length) === N, `the saved progress is loaded (${N} answers)`);
    check(await shownN(page) === N, `the quiz screen shows the ${N} saved answers in "This session"`);
    check((await notices(page)).n === 0, 'no notice that progress could not be loaded');
    await answer(page, 1);
    check(count(await stored(page, info.data)) === N + 1, `an answer is saved (${N + 1} answers stored)`, count(await stored(page, info.data)));
    check(count(await stored(page, info.log)) === N + 1, `the answer history is saved (${N + 1} entries stored)`, count(await stored(page, info.log)));
    // with exams[].questions: null no paper is drawn (nullexam.js)
    if(await page.evaluate(noCount)) L.skip('a started exam paper is saved', 'the number of questions on the exam is not set, so no paper is drawn');
    else {
      await page.evaluate(() => { show('exam'); beginExam(); });
      check(!!(await stored(page, info.exam)), 'a started exam paper is saved');
    }
    const dia = await page.evaluate(() => !!document.querySelector('#nav button[data-v="diagrams"]') === (DIA_LIST().length > 0));
    check(dia, 'the Diagrams tab is there exactly when the course lists figures');
    check(!errors.length && !logged.length, 'no page errors and no errors on the console', errors.concat(logged).slice(0, 2).join('; '));
    await ctx.close();
  }

  // a start-up step that throws: everything else of start-up still runs
  // `fault` matches the console error the injected fault gives
  const faultCase = async (title, file, opts, fault, extra) => {
    console.log(`\n=== ${title} ===`);
    const {ctx, page, errors, logged} = await open(file, opts);
    const inj = await page.evaluate(() => window.__injected === undefined ? true : window.__injected);
    if(inj !== true){ check(false, 'the fault is injected', inj); await ctx.close(); return; }
    check(!errors.length, 'nothing is thrown out of start-up', errors.slice(0, 2).join('; '));
    check(logged.some(t => fault.test(t)), 'the fault is reported on the console', JSON.stringify(logged.map(t => t.split('\n')[0])));
    check(await page.evaluate(() => DB.answers.length) === N, `the saved progress is loaded (${N} answers)`, await page.evaluate(() => DB.answers.length));
    check(await topicsUp(page), 'the rest of start-up runs: Topics is on screen');
    // (on a page whose start-up stopped, PLACE_READY is never declared, and reading it throws)
    check(await page.evaluate(() => { try { return PLACE_READY === true && typeof document.getElementById('btnWho').onclick === 'function'; } catch(e){ return false; } }),
      'the rest of start-up runs: the place is kept across a reload and the Switch button works');
    if(extra) await extra(page);
    check(await shownN(page) === N, `the quiz screen shows the ${N} saved answers in "This session"`);
    await answer(page, 1);
    check(count(await stored(page, info.data)) === N + 1, `answering works: ${N + 1} answers stored`, count(await stored(page, info.data)));
    const w = await writes(page, info.data), h = await writes(page, info.log);
    check(w.length >= 1 && w.every(x => x.n >= N), `no write of the progress stores fewer than the ${N} saved answers`, JSON.stringify(w));
    check(h.length >= 1 && h.every(x => x.n >= N), `no write of the history stores fewer than the ${N} saved entries`, JSON.stringify(h));
    check((await notices(page)).n === 0, 'no notice that progress could not be loaded');
    await ctx.close();
  };

  const declared = /\b(?:const|let|var)\s+DIAGRAMS\b/.test(HTML);
  const GROUP = "{name: 'a group in another shape', keys: []}";
  await faultCase('A start-up step throws: DIAGRAMS of the wrong shape',
    variant('diagrams', declared
      ? `try { if(Array.isArray(DIAGRAMS)){ DIAGRAMS.push(${GROUP}); window.__injected = true; } else window.__injected = 'DIAGRAMS is not a list'; } catch(e){ window.__injected = String(e); }`
      : `const DIAGRAMS = [${GROUP}]; window.__injected = true;`),
    {seed: SEED}, /iterable|DIAGRAMS|Diagrams/,
    async page => check(await page.evaluate(() => !document.querySelector('#nav button[data-v="diagrams"]')), 'the Diagrams tab, whose list cannot be built, is removed'));
  await faultCase('A start-up step throws: the offline copy', L.PAGE.PAGE, {seed: SEED, init: () => {
    Object.defineProperty(Navigator.prototype, 'serviceWorker', {configurable: true, get(){ throw new Error('startup_test.js: the offline step failed'); }});
  }}, /the offline step failed/);
  await faultCase('A start-up step throws: the reading tab a reload comes back to',
    variant('guide', "renderGuide = function(){ throw new Error('startup_test.js: the Guides tab failed to build'); }; window.__injected = true;"),
    {seed: SEED, session: {[info.ns + ':place']: JSON.stringify({v: 'guide', at: Date.now(), y: 0, a: null, open: []})}},
    /the Guides tab failed to build/);

  // the load fails: nothing is written over what is stored
  const loadCase = async (title, file, data, full) => {
    console.log(`\n=== ${title} ===`);
    const seed = Object.assign({}, SEED, {[info.data]: data});
    const {ctx, page, errors, dialogs} = await open(file, {seed});
    const inj = await page.evaluate(() => window.__injected === undefined ? true : window.__injected);
    if(inj !== true){ check(false, 'the fault is injected', inj); await ctx.close(); return; }
    let nt = await notices(page);
    check(nt.n === 1, 'one notice is shown', nt.n);
    check(/saved progress could not be loaded/.test(nt.text) && /Nothing will be saved during this visit/.test(nt.text),
      'it says the saved progress could not be loaded and nothing will be saved during this visit', nt.text.slice(0, 160));
    check(await topicsUp(page), 'the drill opens on Topics');
    await answer(page, 2);
    check(await page.evaluate(() => DB.answers.length) === 2, 'answering works during the visit (2 answers)', await page.evaluate(() => DB.answers.length));
    check(await stored(page, info.data) === data, 'the stored progress is exactly as it was');
    check(await stored(page, info.log) === SEED[info.log], 'the stored answer history is exactly as it was');
    check(!(await writes(page, info.data)).length && !(await writes(page, info.log)).length, 'nothing was written to the progress or the history',
      JSON.stringify((await writes(page, info.data)).concat(await writes(page, info.log))));
    if(full){
      if(await page.evaluate(noCount)) L.skip('a started exam paper is not written', 'the number of questions on the exam is not set, so no paper is drawn');
      else {
        await page.evaluate(() => { show('exam'); beginExam(); });
        check(!(await stored(page, info.exam)) && !(await writes(page, info.exam)).length, 'a started exam paper is not written');
      }
      await page.evaluate(() => show('settings'));
      await page.click('#btnReset');
      await page.waitForTimeout(400);
      check(await stored(page, info.data) === data && await stored(page, info.log) === SEED[info.log], 'Erase my history changes nothing stored');
      check(dialogs.some(d => /could not be loaded/.test(d) && /Nothing was erased/.test(d)), 'Erase says that nothing was erased', JSON.stringify(dialogs));
      const file2 = path.join(TMP, 'import.json');
      fs.writeFileSync(file2, JSON.stringify({profile: 'x', db: {v: 2, concepts: {}, answers: []}, log: []}));
      await page.evaluate(() => show('settings'));
      await page.setInputFiles('#fileIn', file2);
      await page.waitForTimeout(600);
      check(await stored(page, info.data) === data && await page.evaluate(() => DB.answers.length) === 2, 'Import progress changes nothing');
      check(dialogs.some(d => /The file was not imported/.test(d)), 'Import says that the file was not imported', JSON.stringify(dialogs));
      nt = await notices(page);
      check(nt.n === 1 && !(await page.$('#savewarn')), 'still one notice after the refused writes, and no other');
      // another profile loads, and saves as usual
      await page.evaluate(() => { window.__name = 'Other'; });
      await page.click('#btnWho');
      check((await notices(page)).n === 0, 'switching to a profile whose progress loads takes the notice away');
      await answer(page, 1);
      const other = await page.evaluate(() => keyFor('Other'));
      check(count(await stored(page, other)) === 1, 'that profile saves its answer as usual', await stored(page, other));
      check(await stored(page, info.data) === data, 'the first profile\'s stored progress is still exactly as it was');
    }
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  };
  const good = SEED[info.data];
  await loadCase('The load fails: the stored progress is not valid JSON', L.PAGE.PAGE, good.slice(0, good.length - 7), true);
  await loadCase('The load fails: a stored value the load cannot convert', L.PAGE.PAGE, JSON.stringify({concepts: {}, answers: 5}), false);
  await loadCase('The load fails: the load itself throws',
    variant('load', "load = function(){ throw new Error('startup_test.js: the load failed'); }; window.__injected = true;"), good, false);

  console.log('\n=== The stored answer history cannot be read ===');
  {
    const bad = '[[1700000000,"abc';
    const {ctx, page, errors} = await open(L.PAGE.PAGE, {seed: Object.assign({}, SEED, {[info.log]: bad})});
    check(await page.evaluate(() => DB.answers.length) === N, `the saved progress is loaded (${N} answers)`);
    check((await notices(page)).n === 0, 'no notice: the progress loaded');
    await answer(page, 1);
    check(count(await stored(page, info.data)) === N + 1, `the answer is saved (${N + 1} answers stored)`, count(await stored(page, info.data)));
    check(await stored(page, info.log) === bad, 'the stored history is left exactly as it was', await stored(page, info.log));
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  await browser.close();
  fs.rmSync(TMP, {recursive: true, force: true});
  L.finish(NAME);
})().catch(e => {
  try { fs.rmSync(TMP, {recursive: true, force: true}); } catch(e2){}
  console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1);
});
