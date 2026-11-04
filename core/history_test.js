/* The answer history: one entry per answer, with the fields the scheduler work
 * needs, carried by Export and Import, cleared by Erase, and never in the way
 * of saving progress. A history write the browser refuses keeps every entry,
 * shows the "did not save" notice, counts as unsaved, and is written by the next
 * save the browser keeps (since 2026-11-04; before, the oldest half was dropped
 * with no notice). Modeled on BDK's tests/history.js.
 *
 * An entry is [seconds, question code, right, mode, concept, confidence, item
 * type, scheduler, arm, predicted recall] (shell.html, ANSWER HISTORY); the
 * first seven are the older format, which still has to merge. The question
 * code is checked here against an FNV-1a hash written in this file, not the
 * page's own. The last three fields under the FSRS models are checked in
 * scheduler_test.js; here the course's own model is read from course.js.
 *
 *     node history_test.js
 */
const fs = require('fs');
const L = require('./check_lib');
const NAME = 'history_test.js';
const {check} = L;
L.PAGE.need(NAME);
const fnv = id => { let h = 0x811c9dc5; for(let i = 0; i < id.length; i++){ h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
const readLog = p => p.evaluate(() => { try { return JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]'); } catch(e){ return []; } });
// answers the question on screen through its controls, right or wrong, and reports what it was
const ANSWER = right => {
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
  return {id: q.id, concept: q.concept, type: q.type || (q.multi ? 'multi' : 'mc')};
};
const next = p => p.evaluate(() => { const b = document.getElementById('btnNext'); if(b) b.click(); });

(async () => {
  const {browser} = await L.launch(NAME);
  console.log('\n=== Answers make entries ===');
  const {ctx, page: p, errors} = await L.openFile(browser);
  const ids = await p.evaluate(() => QUESTIONS.map(q => q.id));
  const codes = new Set(ids.map(fnv));
  await p.evaluate(() => startQuiz(null, null));
  const asked = [];
  for(let i = 0; i < 3; i++){ asked.push(await p.evaluate(ANSWER, true)); await next(p); }
  let log = await readLog(p);
  check(log.length === 3, 'three answers make three history entries', log.length);
  check(log.every(e => Number.isInteger(e[0]) && /^[0-9a-f]{8}$/.test(e[1]) && e[2] === 1 && e[3] === 'quiz'),
    'each entry is [seconds, question code, right, mode, ...] and the mode is quiz', JSON.stringify(log));
  check(log.every(e => codes.has(e[1])) && log.every((e, i) => e[1] === fnv(asked[i].id)), 'each question code is the hash of the question answered');
  check(log.every((e, i) => e[4] === asked[i].concept), 'each entry carries the concept id', JSON.stringify(log.map(e => e[4])));
  check(log.every((e, i) => e[6] === asked[i].type), 'each entry carries the item type', JSON.stringify(log.map(e => e[6])));
  check(log.every(e => e[5] === 'knew'), 'a right answer left as it is records "knew"', JSON.stringify(log.map(e => e[5])));
  const model = await p.evaluate(() => (COURSE.scheduler && COURSE.scheduler.model) || 'concept');
  check(log.every(e => e.length === 10), 'each entry has ten fields: the seven before, then scheduler, arm, predicted recall', JSON.stringify(log[0]));
  if(model === 'concept')
    check(log.every(e => e[7] === 'concept' && e[8] === '' && e[9] === null),
      'under the concept scheduler each entry ends "concept", "" (no comparison), null (no predicted recall)', JSON.stringify(log.map(e => e.slice(7))));
  else
    check(log.every(e => ['concept', 'fsrs', 'concept-fsrs'].includes(e[7]) && typeof e[8] === 'string' && (e[9] === null || (e[9] > 0 && e[9] < 1))),
      `under the ${model} model each entry names its scheduler, an arm and a recall that is null or between 0 and 1`, JSON.stringify(log.map(e => e.slice(7))));

  // the confidence buttons after a right answer, and a miss
  const conf = {}, notes = [];
  for(const [btn, want] of [['#btnShaky', 'unsure'], ['#btnGuess', 'guessed']]){
    let q = null;
    for(let k = 0; k < 6 && !(q && await p.$(btn)); k++){
      if(q) await next(p);
      q = await p.evaluate(ANSWER, true);
      if(!q){ await p.evaluate(() => startQuiz(null, null)); }
    }
    if(q && await p.$(btn)){
      notes.push(/Next counts as “Knew it”/.test(await p.textContent('#v-quiz')));
      await p.click(btn); log = await readLog(p);
      conf[want] = log[log.length - 1][5] === want && log[log.length - 1][1] === fnv(q.id);
    }
    await next(p);
  }
  check(notes.length === 2 && notes.every(Boolean), 'beside the confidence buttons the screen says Next counts as "Knew it"', JSON.stringify(notes));
  check(conf.unsure, '"Not sure" records "unsure" on that answer');
  check(conf.guessed, '"I guessed" records "guessed" on that answer');
  await p.evaluate(() => { if(!Q || !Q.current) startQuiz(null, null); });
  const missed = await p.evaluate(ANSWER, false);
  log = await readLog(p);
  check(missed && log[log.length - 1][2] === 0 && log[log.length - 1][5] === '', 'a miss records right 0 and no confidence', JSON.stringify(log[log.length - 1]));

  // a fixed pass, and an exam paper
  await p.evaluate(() => { show('topics'); document.getElementById('sweepAll').click(); });
  await p.evaluate(ANSWER, true);
  log = await readLog(p);
  check(log[log.length - 1][3] === 'sweep', 'an answer in a one-pass sweep records mode sweep', log[log.length - 1][3]);
  const before = log.length;
  // the course's own setting decides: with exams[].questions: null no paper is drawn
  // (nullexam.js); with a count, a missing Start button or an empty paper is a fault
  const examOpen = await p.evaluate(() => { show('exam'); return {count: EXAM.questions !== null && EXAM.questions !== undefined, start: !!document.getElementById('startExam')}; });
  if(!examOpen.count)
    L.skip('a submitted paper records mode exam and no confidence', 'the number of questions on the exam is not set, so no paper is drawn');
  else if(!check(examOpen.start, 'the Exam tab offers a Start button (the number of questions is set)')){}
  else {
    const drawn = await p.evaluate(() => { show('exam'); document.getElementById('startExam').click(); return EX && EX.qs ? EX.qs.length : 0; });
    if(!check(drawn > 0, `the Start button draws a paper with questions (${drawn} drawn)`)){
      await p.evaluate(() => { if(EX) clearInterval(EX.timer); EX = null; clearExam(); });
    } else {
      await p.evaluate(() => {
        const b = document.querySelector('#v-exam button.opt'); if(b) b.click();
        else { const q = EX.qs[EX.i], n = document.getElementById('exNum');   // a calculation or matching item first (exams[].typed)
          if(n){ n.value = String(q.answer); n.dispatchEvent(new Event('input')); } else if(q.pairs){ EX.picks[EX.i] = q.pairs.map((p, i) => i); saveExam(); } } });
      await p.click('#exEnd');
      await p.waitForTimeout(300);
      log = await readLog(p);
      const exam = log.slice(before);
      check(exam.length >= 1 && exam.every(e => e[3] === 'exam' && e[5] === ''), 'a submitted paper records mode exam and no confidence', JSON.stringify(exam));
    }
  }

  console.log('\n=== Export, Import, Erase ===');
  await p.click('#nav button[data-v="settings"]');
  check(/answer history/.test(await p.textContent('#v-settings')), 'Settings says answers are kept in a history');
  const total = (await readLog(p)).length;
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnExport')]);
  const file = await dl.path();
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  check(Array.isArray(exported.log) && exported.log.length === total, 'Export includes the whole history', `${exported.log && exported.log.length} of ${total}`);

  const fresh = await L.openFile(browser);
  await fresh.page.click('#nav button[data-v="settings"]');
  await fresh.page.setInputFiles('#fileIn', file);
  await fresh.page.waitForSelector('#importGo', {timeout: 5000}).then(b => b.click(), () => {});
  await fresh.page.waitForTimeout(600);
  check((await readLog(fresh.page)).length === total, 'Import brings the history across',
    JSON.stringify({imported: await readLog(fresh.page), exported: exported.log}));
  await fresh.page.click('#nav button[data-v="settings"]');
  await fresh.page.setInputFiles('#fileIn', file);
  await fresh.page.waitForTimeout(600);
  check(!(await fresh.page.$('#importGo')) && /on this device already/.test(await fresh.page.textContent('#importPlan')),
    'importing the same file again offers nothing to import', await fresh.page.textContent('#importPlan'));
  check((await readLog(fresh.page)).length === total, 'importing the same file twice adds nothing', (await readLog(fresh.page)).length);
  // the older seven-field format: an entry of it merges as it is, and a
  // seven-field copy here gains the fields an imported copy of the same answer carries
  {
    const old = [exported.log[0][0] - 3600, 'abcdef01', 1, 'quiz', 'some-concept', 'knew', 'mc'];
    const cut = await fresh.page.evaluate(() => { LOG[0] = LOG[0].slice(0, 7); saveLog(); return LOG[0].slice(); });
    const file2 = file + '.old.json';
    fs.writeFileSync(file2, JSON.stringify(Object.assign({}, exported, {log: [old, exported.log[0]]})));
    await fresh.page.click('#nav button[data-v="settings"]');
    await fresh.page.setInputFiles('#fileIn', file2);
    await fresh.page.waitForSelector('#importGo', {timeout: 5000}).then(b => b.click(), () => {});
    await fresh.page.waitForTimeout(600);
    const after = await readLog(fresh.page);
    const kept = after.find(e => e[1] === 'abcdef01'), filled = after.find(e => e.slice(0, 4).join('|') === cut.slice(0, 4).join('|'));
    check(after.length === total + 1 && kept && kept.length === 7 && JSON.stringify(kept) === JSON.stringify(old),
      'an entry in the older seven-field format is imported as it is', JSON.stringify({n: after.length, kept}));
    check(filled && filled.length === 10 && JSON.stringify(filled) === JSON.stringify(exported.log[0]),
      'a seven-field entry here gains the scheduler fields from the imported copy of the same answer', JSON.stringify({cut, filled}));
  }
  check(!fresh.errors.length, 'no page errors on import', fresh.errors.slice(0, 2).join('; '));
  await fresh.ctx.close();

  await p.click('#btnReset');
  await p.waitForTimeout(300);
  check((await readLog(p)).length === 0, 'Erase my history clears the answer history too');
  check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
  await ctx.close();

  console.log('\n=== The browser refuses to save the history ===');
  // Louis, 2026-11-04: "Replace silent history deletion on a failed save with clear feedback and a
  // way to preserve or export the affected work." Until then a refused history write dropped the
  // oldest half and tried again, with no notice; these checks replace the one that asserted no notice.
  // The browser refuses a history write longer than window.__logCap characters, as a nearly full
  // quota does: the stored history fits, the same history with one more entry does not, and half
  // of it would (so the core before 2026-11-04 cut it). 300 entries are stored first.
  const CAP = () => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){
      if(/:log:/.test(k) && typeof window.__logCap === 'number' && String(v).length > window.__logCap)
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return set.call(this, k, v);
    };
  };
  const SEED = 300;
  // a page whose profile holds SEED history entries (stored), then the cap set just above them
  const seeded = async (pg, ctx) => {
    await pg.evaluate(n => { const t = Math.round(Date.now() / 1000) - 86400; LOG = [];
      for(let i = 0; i < n; i++) LOG.push([t + i, 'abcdef01', 1, 'quiz', 'seeded', 'knew', 'mc', 'concept', '', null]);
      saveLog(); }, SEED);
    await pg.reload();
    await pg.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await pg.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 5000}).catch(() => {});
    return pg.evaluate(() => { const raw = localStorage.getItem(NS + ':log:' + PROFILE); window.__logCap = raw.length + 20; return {n: LOG.length, len: raw.length}; });
  };
  const storedN = pg => pg.evaluate(() => JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]').length);
  {
    const {ctx: c2, page: q, errors: e2} = await L.openFile(browser, {}, CAP);
    const s0 = await seeded(q, c2);
    check(s0.n === SEED, `${SEED} history entries are stored and loaded before the browser refuses`, s0.n);
    await q.evaluate(() => startQuiz(null, null));
    await q.evaluate(ANSWER, true);
    await q.waitForTimeout(400);
    const saved = await q.evaluate(() => JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{"answers":[]}').answers.length);
    check(saved === 1, 'with the history refused, progress still saves', saved);
    const mem = await q.evaluate(() => ({n: LOG.length, seeded: LOG.filter(e => e[4] === 'seeded').length}));
    check(mem.n === SEED + 1 && mem.seeded === SEED && await storedN(q) === SEED,
      `a refused history write keeps every entry: ${SEED + 1} in memory (none dropped), the stored ${SEED} as they were`, {mem, stored: await storedN(q)});
    const warn = await q.evaluate(() => { const w = document.getElementById('savewarn'); return w ? w.textContent : ''; });
    check(/did not save/.test(warn) && /Export progress/.test(warn), 'a refused history write shows the "did not save" notice, which points to Export progress', warn.slice(0, 120));
    // a progress save after the refused history write: it saves, tries the history again (refused
    // again), and the page's own refused write is not taken for another tab's save
    await q.evaluate(() => { DB.settings.goal = 7; save(); });
    await q.waitForTimeout(400);
    const own = await q.evaluate(() => ({goal: (JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || 'null') || {settings: {}}).settings.goal, failed: FAILED.has(logKey()),
      wall: !!document.getElementById('stopwall') || !!document.getElementById('stalewarn') || STALE, n: LOG.length}));
    check(own.goal === 7 && own.failed && !own.wall && own.n === SEED + 1,
      'after a refused history write, the next progress save is kept, the history write is tried again (refused again, nothing dropped), and the page is not stopped', own);
    await q.evaluate(() => show('settings'));
    const [dl] = await Promise.all([q.waitForEvent('download', {timeout: 5000}).catch(() => null), q.evaluate(() => document.getElementById('btnExport').click())]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    const last = await q.evaluate(() => LOG[LOG.length - 1]);
    check(Array.isArray(ex.log) && ex.log.length === SEED + 1 && JSON.stringify(ex.log[ex.log.length - 1]) === JSON.stringify(last),
      `Export after a refused history write holds every entry, the unsaved one too (${SEED + 1})`, ex.log && ex.log.length);
    // the profile opened again (switched away and back) opens this visit's unsaved history, as for the progress
    // (each switch waits for its lock: a switch straight back can find the lock not yet freed and open read-only)
    const held = () => q.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 5000}).catch(() => {});
    await q.evaluate(() => { window.__me = PROFILE; useProfile('away'); }); await held();
    await q.evaluate(() => useProfile(window.__me)); await held();
    check(await q.evaluate(() => LOG.length) === SEED + 1, 'a profile switched away and back after a refused history write still holds every entry', await q.evaluate(() => LOG.length));
    // the browser keeps writes again: the next save writes every entry, and this tab alone is not stopped
    await q.evaluate(() => { window.__logCap = null; });
    // a progress save with no answer (a setting) writes the waiting history too
    await q.evaluate(() => { DB.settings.goal = 8; save(); });
    await q.waitForTimeout(400);
    check(await storedN(q) === SEED + 1, `once the browser keeps writes, the next progress save (a setting, no answer) writes the waiting history (${SEED + 1} stored)`, await storedN(q));
    await q.evaluate(() => { if(!Q || !Q.current) startQuiz(null, null); });
    await next(q);
    await q.evaluate(() => { if(!Q || !Q.current) startQuiz(null, null); });
    await q.evaluate(ANSWER, true);
    await q.waitForTimeout(400);
    const after = await storedN(q);
    check(after === SEED + 2 && await q.evaluate(() => !FAILED.has(logKey())), `the next save the browser keeps writes every entry (${SEED + 2} stored)`, after);
    const stop = await q.evaluate(() => ({wall: !!document.getElementById('stopwall'), stale: !!document.getElementById('stalewarn'), STALE, unsaved: unsavedHere()}));
    check(!stop.wall && !stop.stale && !stop.STALE && !stop.unsaved, 'one tab alone, after a refused history write and a later save: no "another tab" stop, and nothing counts as unsaved', stop);
    check(!e2.length, 'with the history refused, no page errors', e2.slice(0, 2).join('; '));
    await c2.close();
  }
  {
    // two tabs: the writer's history write is refused; another tab asks for the profile. The writer's
    // stop wall counts the refused entries as unsaved (export offered, holding them), and taking the
    // profile back keeps them in the copy "Use it here" makes (field log)
    const {ctx: c3, page: a, errors: e3} = await L.openFile(browser, {}, CAP);
    await seeded(a, c3);
    await a.evaluate(() => startQuiz(null, null));
    await a.evaluate(ANSWER, true);
    await a.waitForTimeout(400);
    const mine = await a.evaluate(() => LOG[LOG.length - 1]);
    const b = await c3.newPage();
    b.on('dialog', x => x.accept());
    await b.goto(a.url());
    await b.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await b.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await b.evaluate(() => takeOver(false));
    await b.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await a.waitForFunction(() => !!document.getElementById('stopwall'), null, {timeout: 5000}).catch(() => {});
    const wallA = await a.evaluate(() => ({why: (document.getElementById('stopwall') || {dataset: {}}).dataset.why, exp: !!document.getElementById('stopExport'),
      text: (document.getElementById('stopwall') || {}).textContent || ''}));
    check(wallA.why === 'gave' && wallA.exp && /not saved/.test(wallA.text),
      'the stop wall of a tab whose history write was refused counts it as unsaved and offers the export', {why: wallA.why, exp: wallA.exp});
    const [dl] = await Promise.all([a.waitForEvent('download', {timeout: 5000}).catch(() => null), a.evaluate(() => { const x = document.getElementById('stopExport'); if(x) x.click(); })]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : null;
    check(!!ex && ex.log.length === SEED + 1 && ex.log.some(e => JSON.stringify(e) === JSON.stringify(mine)),
      'the export from that stop wall holds every history entry, the refused one too', ex && ex.log.length);
    await a.evaluate(() => { const x = document.getElementById('stopTake'); if(x) x.click(); });
    await a.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const copies = await a.evaluate(() => { try { return JSON.parse(localStorage.getItem(NS + ':backup:' + PROFILE) || '[]'); } catch(e){ return []; } });
    const withLog = copies.filter(c => typeof c.log === 'string').map(c => JSON.parse(c.log));
    check(withLog.some(l => l.length === SEED + 1 && l.some(e => JSON.stringify(e) === JSON.stringify(mine))),
      '"Use it here" on that tab keeps every history entry, the refused one too, in its copy (field log)', copies.map(c => c.log ? JSON.parse(c.log).length : null));
    check(!e3.length, 'two tabs, with the history refused: no page errors', e3.slice(0, 2).join('; '));
    await c3.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
