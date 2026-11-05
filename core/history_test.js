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
    check(/did not save your progress or answer history/.test(warn), 'that notice names the answer history', warn.slice(0, 80));
    await q.evaluate(() => { const b = document.querySelector('#savewarn button'); if(b) b.click(); });   // dismissed
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
    // every refused write written since: a new refusal shows the notice again (it was dismissed above)
    await q.evaluate(() => { window.__logCap = localStorage.getItem(NS + ':log:' + PROFILE).length + 20; });
    await next(q); await q.evaluate(() => startQuiz(null, null)); await q.evaluate(ANSWER, true);
    await q.waitForTimeout(300);
    check(await q.evaluate(() => !!document.getElementById('savewarn') && FAILED.has(logKey())), 'a refusal after every refused write was saved shows the notice again');
    await q.evaluate(() => { window.__logCap = null; });
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
      '"Use it here" on that tab, with the browser still refusing the history: every entry, the refused one too, is kept in its copy (field log)', copies.map(c => c.log ? JSON.parse(c.log).length : null));
    check(!e3.length, 'two tabs, with the history refused: no page errors', e3.slice(0, 2).join('; '));
    await c3.close();
  }
  {
    // #47's review, M1: a profile switched away from with its history refused. The switch asks first
    // and offers the export; once the browser keeps writes, a save of the other profile writes the
    // first profile's history too, so a reload does not lose it
    const {ctx: c4, page: m, errors: e4} = await L.openFile(browser, {}, CAP);
    const dialogs = []; m.on('dialog', d => dialogs.push(d.message()));
    await seeded(m, c4);
    await m.evaluate(() => startQuiz(null, null));
    await m.evaluate(ANSWER, true);
    await m.waitForTimeout(400);
    const me = await m.evaluate(() => ({p: PROFILE, k: logKey(), last: LOG[LOG.length - 1]}));
    const heldM = () => m.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 5000}).catch(() => {});
    // both questions answered Cancel: the page stays on this profile
    await m.evaluate(() => { window.__realConfirm = window.confirm; window.confirm = () => false; useProfile('other-one'); window.confirm = window.__realConfirm; });
    check(await m.evaluate(p => PROFILE === p, me.p), 'switching away with a refused history write, both questions cancelled: the page stays on the profile', await m.evaluate(() => PROFILE));
    const n0 = dialogs.length;
    const [dl] = await Promise.all([m.waitForEvent('download', {timeout: 5000}).catch(() => null), m.evaluate(() => useProfile('other-one'))]);
    await heldM();
    const asked = dialogs.slice(n0);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : null;
    check(asked.length === 2 && /did not save/.test(asked[0]) && /Export/.test(asked[0]) && !!ex && ex.profile === me.p && ex.log.length === SEED + 1,
      'switching away with a refused history write asks first and exports that profile with every entry when asked to', {asked, exported: ex && ex.log.length});
    await m.evaluate(() => { window.__logCap = null; });
    // another tab opens the profile this page left, and answers there: while it has that profile,
    // this page's saves write nothing under it
    const t = await c4.newPage();
    t.on('dialog', x => x.accept());
    await t.goto(m.url());
    await t.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await t.evaluate(p => useProfile(p), me.p);
    await t.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    await t.evaluate(() => startQuiz(null, null));
    const n1 = await t.evaluate(() => LOG.length);
    await t.evaluate(ANSWER, true);
    const theirs = await t.evaluate(n => LOG.length > n ? LOG[LOG.length - 1] : null, n1);
    await t.waitForTimeout(300);
    const theirsStored = await t.evaluate(k => localStorage.getItem(k), me.k);
    await m.evaluate(() => startQuiz(null, null));
    await m.evaluate(ANSWER, true);   // this page's answer and save, under the other profile
    await m.waitForTimeout(800);
    const held = await m.evaluate(k => ({same: localStorage.getItem(k), failed: FAILED.has(k)}), me.k);
    check(!!theirs && held.same === theirsStored && held.failed,
      'while another tab has the profile this page left, this page writes nothing under it (that tab\'s save stays as it is) and keeps its refused entries', {theirs: !!theirs, same: held.same === theirsStored, failed: held.failed});
    await t.close();
    await m.waitForTimeout(300);
    await m.evaluate(() => startQuiz(null, null));
    await m.evaluate(ANSWER, true);   // that tab closed: what is stored is not what this page last knew there
    await m.waitForTimeout(800);
    const away = await m.evaluate(k => ({same: localStorage.getItem(k), failed: FAILED.has(k), notice: (document.querySelector('.awaywarn') || {}).textContent || ''}), me.k);
    check(away.same === theirsStored && away.failed && /changed in another tab/.test(away.notice),
      'that tab closed, its save still stored: this page writes nothing over it, keeps its entries refused, and says so', {same: away.same === theirsStored, failed: away.failed, notice: away.notice.slice(0, 80)});
    check(/may have erased that history/.test(away.notice) && /brings those entries back/.test(away.notice),
      'that notice says the other tab may have erased that history, and that importing the file brings those entries back', away.notice.slice(0, 400));
    const [adl] = await Promise.all([m.waitForEvent('download', {timeout: 5000}).catch(() => null), m.evaluate(() => { const b = document.querySelector('.awaywarn button'); if(b) b.click(); })]);
    const aex = adl ? JSON.parse(fs.readFileSync(await adl.path(), 'utf8')) : null;
    check(!!aex && aex.profile === me.p && aex.log.length === SEED + 1 && aex.log.some(e => JSON.stringify(e) === JSON.stringify(me.last)),
      'that notice\'s "Export it" gives a file for that profile with every entry this page holds, the refused one too', aex && {profile: aex.profile, n: aex.log.length});
    check(!e4.length, 'a profile switched away from: no page errors', e4.slice(0, 2).join('; '));
    await c4.close();
  }
  {
    // #47's review, M2: the whole site's storage is full (every key counts), not only the history key.
    // Nothing is cut: the history and the answers stay on the page and in Export, with the notice. The
    // progress then stops saving sooner than with the cut before 2026-11-04 (the README says so;
    // Louis decides); the counts stored are printed, not checked.
    const ORIGIN = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        if(typeof window.__originCap === 'number'){
          let t = String(k).length + String(v).length;
          for(let i = 0; i < this.length; i++){ const kk = this.key(i); if(kk !== k) t += kk.length + this.getItem(kk).length; }
          if(t > window.__originCap) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        return set.call(this, k, v);
      };
    };
    const {ctx: c5, page: o, errors: e5} = await L.openFile(browser, {}, ORIGIN);
    await seeded(o, c5);
    await o.evaluate(() => { window.__logCap = null; let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } window.__originCap = t + 1200; });
    let N = 0;   // the answers given (a draw can come up empty in a small bank)
    for(let i = 0; i < 9; i++){ await next(o); await o.evaluate(() => startQuiz(null, null)); if(await o.evaluate(ANSWER, true)) N++; await o.waitForTimeout(200); }
    await o.waitForTimeout(300);
    const st = await o.evaluate(() => { const l = JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]'), d = JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{"answers":[]}');
      const mine = new Set(LOG.map(e => JSON.stringify(e)));
      return {log: LOG.length, seeded: LOG.filter(e => e[4] === 'seeded').length, answers: DB.answers.length, storedLog: l.length, storedIn: l.every(e => mine.has(JSON.stringify(e))), storedAnswers: d.answers.length,
              warn: (document.getElementById('savewarn') || {}).textContent || ''}; });
    console.log(`  note  whole-site quota: progress stored for ${st.storedAnswers} of ${st.answers} answers; history stored ${st.storedLog} of ${st.log}`);
    check(N > 0 && st.log === SEED + N && st.seeded === SEED && st.answers === N && st.storedLog >= SEED && st.storedIn,
      `the whole site's storage full: no history entry is deleted (${SEED + N} on the page, the ${SEED} seeded all there, none dropped from storage) and every answer is on the page`, st);
    check(/did not save/.test(st.warn) && /Export progress/.test(st.warn), 'the whole site\'s storage full: the notice is shown', st.warn.slice(0, 80));
    await o.evaluate(() => show('settings'));
    const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => document.getElementById('btnExport').click())]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    check(Array.isArray(ex.log) && ex.log.length === SEED + N && ex.db && ex.db.answers.length === N, `the whole site's storage full: Export holds every history entry (${SEED + N}) and every answer (${N})`, {log: ex.log && ex.log.length, answers: ex.db && ex.db.answers.length});
    check(!e5.length, 'the whole site\'s storage full: no page errors', e5.slice(0, 2).join('; '));
    await c5.close();
  }
  {
    // Study progress first (Louis, 2026-11-05). The whole site's storage nearly full; 40 answers.
    // (1) Once a progress write is refused, no later history entry is stored before the progress is:
    // at most one entry is ahead of the stored progress (the answer whose own progress write was the
    // first refused; its entry is written when it is answered, before its progress save 150 ms later).
    // (2) Nothing is lost: every answer and entry is on the page and in Export, with the notice.
    // (3) Once there is room, the next save stores the progress and then all the held history.
    const ORIGIN = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        if(typeof window.__originCap === 'number'){
          let t = String(k).length + String(v).length;
          for(let i = 0; i < this.length; i++){ const kk = this.key(i); if(kk !== k) t += kk.length + this.getItem(kk).length; }
          if(t > window.__originCap) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        return set.call(this, k, v);
      };
    };
    const {ctx: c6, page: o, errors: e6} = await L.openFile(browser, {}, ORIGIN);
    await seeded(o, c6);
    await o.evaluate(() => { window.__logCap = null; record(QUESTIONS[0], 'correct', 0, 4000); saveNow(); });
    await o.waitForTimeout(300);
    await o.evaluate(() => { let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } window.__originCap = t + 3000; });
    for(let i = 1; i <= 40; i++){ await o.evaluate(i => record(QUESTIONS[i % QUESTIONS.length], i % 4 ? 'correct' : 'wrong', 0, 4000), i); await o.waitForTimeout(220); }
    await o.waitForTimeout(300);
    const st = await o.evaluate(() => {
      const d = JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{"answers":[]}'), l = JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]');
      return {page: DB.answers.length, prog: d.answers.length, pageLog: LOG.length, log: l.length, newLog: l.filter(e => e[4] !== 'seeded').length,
              warn: (document.getElementById('savewarn') || {}).textContent || ''};
    });
    console.log(`  note  study progress first, 3,000 characters of room: progress stored for ${st.prog} of ${st.page} answers; history stored ${st.log} of ${st.pageLog}`);
    check(st.prog < st.page && st.newLog <= st.prog + 1, 'storage full: after the first refused progress write, no history is stored ahead of the progress (study progress first)', st);
    check(st.page === 41 && st.pageLog === SEED + 41 && /did not save/.test(st.warn) && /answer history/.test(st.warn), 'storage full: every answer and entry is on the page, and the notice names the progress and the history', st);
    await o.evaluate(() => show('settings'));
    const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => document.getElementById('btnExport').click())]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    check(ex.db && ex.db.answers.length === 41 && Array.isArray(ex.log) && ex.log.length === SEED + 41, 'storage full: Export holds every answer (41) and every entry', {answers: ex.db && ex.db.answers.length, log: ex.log && ex.log.length});
    await o.evaluate(() => { window.__originCap = null; record(QUESTIONS[1], 'correct', 0, 4000); });
    await o.waitForTimeout(400);
    const after = await o.evaluate(() => {
      const d = JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{"answers":[]}'), l = JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]');
      return {prog: d.answers.length, log: l.length};
    });
    check(after.prog === 42 && after.log === SEED + 42, 'room again: the next save stores the progress and then every held history entry', after);
    check(!e6.length, 'study progress first: no page errors', e6.slice(0, 2).join('; '));
    await c6.close();
  }
  {
    // This tab's own per-tab record (#45) is removed under storage pressure only when what is stored,
    // read back, holds all of it; a record holding a history entry the stored history lacks is kept.
    const {ctx: c7, page: o, errors: e7} = await L.openFile(browser, {});
    await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    if(await o.evaluate(() => typeof dropOwnRecordIfStored === 'function' && WRITER === 'held')){
      await o.evaluate(() => { record(QUESTIONS[0], 'correct', 0, 4000); saveNow(); });
      const proven = await o.evaluate(() => { const k = myPendingKey(), had = localStorage.getItem(k) !== null; const r = dropOwnRecordIfStored(); return {had, r, gone: localStorage.getItem(k) === null}; });
      await o.evaluate(() => { record(QUESTIONS[1], 'correct', 0, 4000); saveNow(); });
      const unproven = await o.evaluate(() => {
        const k = myPendingKey(), rec = JSON.parse(localStorage.getItem(k));
        rec.log.push([1, 'ffffffff', 1, 'quiz', 'x', '', 'mc', 'concept', '', null]);   // an entry the stored history lacks
        localStorage.setItem(k, JSON.stringify(rec));
        const r = dropOwnRecordIfStored(); return {r, kept: localStorage.getItem(k) !== null};
      });
      check(proven.had && proven.r && proven.gone && !unproven.r && unproven.kept, 'storage pressure: this tab\'s own record is removed only when the stored progress and history hold all of it', {proven, unproven});
    } else check(true, 'storage pressure: own-record removal not tested (no Web Locks here)');
    check(!e7.length, 'own record under pressure: no page errors', e7.slice(0, 2).join('; '));
    await c7.close();
  }
  {
    // While the progress write is refused, the history is held, not written: the browser refuses only
    // the progress key here, so a history write would succeed if it were tried.
    const KEYCAP = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){ if(window.__refuseKey && k === window.__refuseKey) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return set.call(this, k, v); };
    };
    const {ctx: c9, page: o, errors: e9} = await L.openFile(browser, {}, KEYCAP);
    await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    await o.evaluate(() => { record(QUESTIONS[0], 'correct', 0, 4000); saveNow(); });
    const before = await o.evaluate(() => JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]').length);
    await o.evaluate(() => { window.__refuseKey = NS + ':data:' + PROFILE; record(QUESTIONS[1], 'correct', 0, 4000); saveNow(); record(QUESTIONS[2], 'wrong', 0, 4000); saveNow(); });
    await o.waitForTimeout(300);
    const held = await o.evaluate(() => ({stored: JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]').length, page: LOG.length, failed: FAILED.has(logKey()),
      warn: (document.getElementById('savewarn') || {}).textContent || ''}));
    check(held.stored <= before + 1 && held.page === before + 2 && held.failed && /answer history/.test(held.warn),
      'progress refused: the history after it is held (not written), named in the notice, and kept on the page', Object.assign({before}, held, {warn: held.warn.slice(0, 50)}));
    await o.evaluate(() => { window.__refuseKey = null; record(QUESTIONS[3], 'correct', 0, 4000); saveNow(); });
    await o.waitForTimeout(300);
    const after = await o.evaluate(() => ({log: JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]').length, prog: JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE)).answers.length, page: LOG.length}));
    check(after.log === after.page && after.prog === 4, 'progress saved again: the held history is written after it, every entry', after);
    check(!e9.length, 'held history: no page errors', e9.slice(0, 2).join('; '));
    await c9.close();
  }
  {
    // A profile switched away from with both its progress and its history refused: once there is room,
    // its progress is written first and then its history, never its history alone (the review of
    // c2b0238, M1: the history was written and the progress never tried again)
    const KEYS = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){ if(window.__refuse && window.__refuse.includes(k)) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return set.call(this, k, v); };
    };
    const {ctx: c11, page: o, errors: e11} = await L.openFile(browser, {}, KEYS);
    await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    const me = await o.evaluate(() => { record(QUESTIONS[0], 'correct', 0, 4000); saveNow();
      window.__refuse = [keyFor(PROFILE), logKey()]; record(QUESTIONS[1], 'correct', 0, 4000); saveNow();
      return {p: PROFILE, dk: keyFor(PROFILE), lk: logKey(), refused: FAILED.has(keyFor(PROFILE)) && FAILED.has(logKey())}; });
    await o.evaluate(() => { let n = 0; window.__realConfirm = window.confirm; window.confirm = () => n++ > 0; useProfile('other-two'); window.confirm = window.__realConfirm; });
    await o.waitForFunction(() => PROFILE === 'other-two' && (WRITER === 'held' || WRITER === 'none'), null, {timeout: 6000}).catch(() => {});
    await o.evaluate(() => { window.__refuse = null; record(QUESTIONS[2], 'correct', 0, 4000); saveNow(); });
    await o.waitForTimeout(800);
    const st = await o.evaluate(m => ({on: PROFILE, prog: JSON.parse(localStorage.getItem(m.dk) || '{"answers":[]}').answers.length,
      log: JSON.parse(localStorage.getItem(m.lk) || '[]').length, failedData: FAILED.has(m.dk), failedLog: FAILED.has(m.lk)}), me);
    check(me.refused && st.on === 'other-two' && st.prog === 2 && st.log === 2 && !st.failedData && !st.failedLog,
      'a profile switched away from with progress and history refused: with room again, its progress is written, then its history', st);
    check(!e11.length, 'away progress first: no page errors', e11.slice(0, 2).join('; '));
    await c11.close();
  }
  {
    // Storage full, what the student sees and can do (Louis, 2026-11-05): the first refused save shows
    // the notice at once, with an Export button whose file holds every answer and entry; the notice says
    // when the per-tab record is off; the app's Reload asks first; closing the tab gets the browser's
    // leave question (Chromium; WebKit's close with runBeforeUnload does not finish, #39)
    const ORIGIN3 = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        if(typeof window.__originCap === 'number'){
          let t = String(k).length + String(v).length;
          for(let i = 0; i < this.length; i++){ const kk = this.key(i); if(kk !== k) t += kk.length + this.getItem(kk).length; }
          if(t > window.__originCap) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        return set.call(this, k, v);
      };
    };
    const {ctx: c12, page: o, errors: e12} = await L.openFile(browser, {}, ORIGIN3);
    const said = []; o.removeAllListeners('dialog'); o.on('dialog', d => { said.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
    await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    await o.evaluate(() => { for(let i = 0; i < 3; i++){ record(QUESTIONS[i % QUESTIONS.length], 'correct', 0, 4000); saveNow(); } });
    const noneYet = await o.evaluate(() => !document.getElementById('savewarn'));
    await o.evaluate(() => { let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } window.__originCap = t + 60; });
    await o.evaluate(() => { record(QUESTIONS[3 % QUESTIONS.length], 'wrong', 0, 4000); saveNow(); });
    const first = await o.evaluate(() => { const d = document.getElementById('savewarn'); return {shown: !!d, text: d ? d.textContent : '', exportBtn: !!document.getElementById('savewarnExport'), page: DB.answers.length, log: LOG.length}; });
    check(noneYet && first.shown && /did not save/.test(first.text) && /loses it/.test(first.text) && first.exportBtn,
      'storage full: the first refused save shows the notice at once, saying a close or reload loses the work, with an Export button', Object.assign({}, first, {text: first.text.slice(0, 120)}));
    const locksHere = await o.evaluate(() => HAS_LOCKS);
    check(locksHere ? /cannot keep the record that protects its last save/.test(first.text) : true,
      'storage full: the notice says the per-tab record that protects a close without hand-over is off', first.text.slice(0, 400));
    await o.evaluate(() => { record(QUESTIONS[4 % QUESTIONS.length], 'correct', 0, 4000); saveNow(); });
    const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => document.getElementById('savewarnExport').click())]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    const now = await o.evaluate(() => ({page: DB.answers.length, log: LOG.length}));
    check(ex.db && ex.db.answers.length === now.page && now.page === 5 && Array.isArray(ex.log) && ex.log.length === now.log,
      'storage full: the notice\'s Export holds every answer and history entry on the page', {exported: ex.db && ex.db.answers.length, log: ex.log && ex.log.length, now});
    // a later answer is not exported yet: the app's Reload (the new-version bar) asks first; cancelled, nothing is lost
    // no room at all from here, so the next answer stays unsaved
    await o.evaluate(() => { let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } window.__originCap = t - 1; });
    await o.evaluate(() => { record(QUESTIONS[5 % QUESTIONS.length], 'correct', 0, 4000); saveNow(); offerReload('A new version is ready.'); });
    const unsaved = await o.evaluate(() => ({failed: [...FAILED].length, atRisk: atRisk()}));
    const n0 = said.length;
    await o.evaluate(() => document.querySelector('#swbar [data-reload]').click());
    await o.waitForTimeout(300);
    const kept = await o.evaluate(() => DB.answers.length);
    check(unsaved.failed > 0 && unsaved.atRisk && said.slice(n0).some(x => /^confirm: .*lost on reload unless you export/.test(x)) && kept === 6,
      'storage full: the new-version bar\'s Reload asks first while unexported work is unsaved; cancelled, the page and its work stay', {unsaved, asked: said.slice(n0), kept});
    // closing the tab: the browser's own leave question (Chromium)
    if(L.BROWSER === 'chromium'){
      const n1 = said.length;
      await o.close({runBeforeUnload: true});
      await new Promise(r => setTimeout(r, 500));
      const asked = said.slice(n1);
      check(asked.some(x => /^beforeunload/.test(x)) && !o.isClosed(), 'storage full: closing the tab with unexported unsaved work gets the browser\'s leave question; dismissed, the tab stays', asked);
      if(!o.isClosed()){
        // after an export of everything, closing the tab asks nothing
        await o.evaluate(() => { EXPORTED_SNAP = snapHere(); });
        const n2 = said.length;
        await o.close({runBeforeUnload: true});
        await new Promise(r => setTimeout(r, 500));
        check(!said.slice(n2).some(x => /^beforeunload/.test(x)) && o.isClosed(), 'storage full: after the export, closing the tab asks nothing and the tab closes', said.slice(n2));
      }
    } else L.skip('closing the tab with unsaved work: the browser\'s leave question', 'WebKit\'s page close with runBeforeUnload does not finish here (#39)');
    check(!e12.length, 'what the student sees with storage full: no page errors', e12.slice(0, 2).join('; '));
    await c12.close().catch(() => {});
  }
  {
    // Refused work of a profile switched away from (the review of b3c9bbe, M1): it counts as at risk,
    // the notice names it and exports it, and the app's Reload and closing the tab ask first
    const KEYS2 = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){ if(window.__refuse && window.__refuse.includes(k)) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return set.call(this, k, v); };
    };
    const {ctx: c13, page: o, errors: e13} = await L.openFile(browser, {}, KEYS2);
    const said = []; o.removeAllListeners('dialog');
    o.on('dialog', d => { said.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
    await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    const me = await o.evaluate(() => { record(QUESTIONS[0], 'correct', 0, 4000); saveNow();
      window.__refuse = [keyFor(PROFILE), logKey()]; record(QUESTIONS[1], 'wrong', 0, 4000); saveNow();
      return {p: PROFILE, dk: keyFor(PROFILE), lk: logKey(), at: DB.answers[DB.answers.length - 1].at}; });
    // the switch asks twice: export? (no), switch? (yes)
    await o.evaluate(() => { let n = 0; window.__rc = window.confirm; window.confirm = () => n++ > 0; useProfile('bee-away'); window.confirm = window.__rc; });
    await o.waitForFunction(() => PROFILE === 'bee-away' && (WRITER === 'held' || WRITER === 'none'), null, {timeout: 6000}).catch(() => {});
    await o.evaluate(() => { record(QUESTIONS[2], 'correct', 0, 4000); saveNow(); });   // bee saves; me stays refused (__refuse holds me's keys)
    await o.waitForTimeout(300);
    const st = await o.evaluate(m => ({on: PROFILE, risk: atRiskAll(), here: atRisk(), away: awayRefused(), btn: !!document.querySelector('#savewarn button[data-away="' + m.p + '"]'),
      text: (document.getElementById('savewarn') || {}).textContent || ''}), me);
    check(st.on === 'bee-away' && st.risk && !st.here && st.away.includes(me.p) && st.btn && /another profile on this page/.test(st.text),
      'a profile switched away from with refused work: it counts as at risk, and the notice names another profile and offers its export', Object.assign({}, st, {text: st.text.slice(0, 120)}));
    // the new-version bar's Reload asks (cancelled: nothing lost)
    const n0 = said.length;
    await o.evaluate(() => { offerReload('A new version is ready.'); document.querySelector('#swbar [data-reload]').click(); });
    await o.waitForTimeout(300);
    check(said.slice(n0).some(x => /^confirm: .*lost on reload unless you export/.test(x)) && await o.evaluate(() => PROFILE === 'bee-away'),
      'that profile\'s refused work: the new-version bar\'s Reload asks first; cancelled, the page stays', said.slice(n0));
    if(L.BROWSER === 'chromium'){
      const n1 = said.length;
      await o.close({runBeforeUnload: true}); await new Promise(r => setTimeout(r, 500));
      check(said.slice(n1).some(x => /^beforeunload/.test(x)) && !o.isClosed(), 'that profile\'s refused work: closing the tab gets the browser\'s leave question', said.slice(n1));
    } else L.skip('closing the tab with another profile\'s refused work', 'WebKit\'s page close with runBeforeUnload does not finish here (#39)');
    // its export holds that profile's unsaved answer and entry; afterwards closing asks nothing
    const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(p => document.querySelector('#savewarn button[data-away="' + p + '"]').click(), me.p)]);
    const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
    check(ex.profile === me.p && ex.db && ex.db.answers.some(a => a.at === me.at) && Array.isArray(ex.log) && ex.log.length === 2,
      'that profile\'s export holds its answer and history entry that were not saved', {profile: ex.profile, answers: ex.db && ex.db.answers.length, log: ex.log && ex.log.length});
    if(!o.isClosed()){
      // room again: that profile's work is stored, and the notice goes (it does not claim the record is off; the review of c2e7d93, N1)
      await o.evaluate(() => { window.__refuse = null; record(QUESTIONS[3], 'correct', 0, 4000); saveNow(); });
      await o.waitForTimeout(800);
      const after = await o.evaluate(m => ({failed: FAILED.size, notice: (document.getElementById('savewarn') || {}).textContent || null, me: JSON.parse(localStorage.getItem(m.dk)).answers.length}), me);
      check(after.failed === 0 && after.notice === null && after.me === 2, 'room again: that profile\'s work is stored and the notice goes', after);
      // only a key that is neither progress nor history refused (the profile chosen): the general wording
      await o.evaluate(() => { window.__refuse = [NS + ':profile']; useProfile('cee-away'); });
      await o.waitForTimeout(300);
      const gen = await o.evaluate(() => (document.getElementById('savewarn') || {}).textContent || '');
      check(/some of this page's data/.test(gen) && !/Storage is full\. Your progress is saved/.test(gen), 'only the profile choice refused: the notice says some of this page\'s data was not saved, not that the record is off', gen.slice(0, 160));
    }
    if(L.BROWSER === 'chromium'){
      const n2 = said.length;
      await o.close({runBeforeUnload: true}); await new Promise(r => setTimeout(r, 500));
      check(!said.slice(n2).some(x => /^beforeunload/.test(x)) && o.isClosed(), 'after that export, closing the tab asks nothing and the tab closes', said.slice(n2));
    }
    check(!e13.length, 'another profile\'s refused work: no page errors', e13.slice(0, 2).join('; '));
    await c13.close().catch(() => {});
  }
  {
    // A refused progress write is tried once more after this tab's own record, proven stored, is
    // removed: room for a history entry but not for the progress save, which the record's room makes.
    const ORIGIN2 = () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        if(typeof window.__originCap === 'number'){
          let t = String(k).length + String(v).length;
          for(let i = 0; i < this.length; i++){ const kk = this.key(i); if(kk !== k) t += kk.length + this.getItem(kk).length; }
          if(t > window.__originCap) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        return set.call(this, k, v);
      };
    };
    const {ctx: c10, page: o, errors: e10} = await L.openFile(browser, {}, ORIGIN2);
    await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    if(await o.evaluate(() => typeof myPendingKey === 'function' && WRITER === 'held')){
      for(let i = 0; i < 6; i++) await o.evaluate(i => { record(QUESTIONS[i % QUESTIONS.length], 'correct', 0, 4000); saveNow(); }, i);
      const r = await o.evaluate(() => {
        const rk = myPendingKey(), had = localStorage.getItem(rk) !== null;
        let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; }
        window.__originCap = t + 200;
        record(QUESTIONS[6 % QUESTIONS.length], 'correct', 0, 4000); saveNow();
        return {had, prog: JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE)).answers.length, page: DB.answers.length, rec: localStorage.getItem(rk) !== null, failed: FAILED.has(keyFor(PROFILE))};
      });
      check(r.had && r.prog === r.page && !r.failed, 'storage full: a refused progress write is stored after this tab\'s own proven record is removed to make room', r);
    } else check(true, 'second progress try not tested (no Web Locks here)');
    check(!e10.length, 'second progress try: no page errors', e10.slice(0, 2).join('; '));
    await c10.close();
  }
  // two answers to one question in one second, both refused: alike in their first four fields
  const twoAlike = pg => pg.evaluate(() => {
    while(Date.now() % 1000 > 400){ /* early in a second, so both round to the same one */ }
    const q = QUESTIONS[0];
    record(q, 'correct', undefined, 1000); record(q, 'correct', undefined, 1000);
    const a = LOG[LOG.length - 2], b = LOG[LOG.length - 1];
    return {alike: JSON.stringify(a) === JSON.stringify(b), e: b, n: LOG.length};
  });
  const countOf = (pg, k, e) => pg.evaluate(([k, e]) => { const l = JSON.parse(localStorage.getItem(k) || '[]'); return {n: l.length, count: l.filter(x => JSON.stringify(x) === JSON.stringify(e)).length}; }, [k, e]);
  {
    // a profile switched away from, nothing else changed there: once the browser keeps writes, its
    // history is written as this page holds it, two alike entries as two (#47's re-review, N2)
    const {ctx: c7, page: m, errors: e7} = await L.openFile(browser, {}, CAP);
    await seeded(m, c7);
    const two = await twoAlike(m);
    await m.waitForTimeout(400);
    const k = await m.evaluate(() => logKey()), p0 = await m.evaluate(() => PROFILE);
    await m.evaluate(() => useProfile('other-one'));
    await m.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 5000}).catch(() => {});
    await m.evaluate(() => { window.__logCap = null; });
    await m.evaluate(() => startQuiz(null, null));
    await m.evaluate(ANSWER, true);
    await m.waitForTimeout(800);
    const w = await countOf(m, k, two.e);
    check(two.alike && w.n === SEED + 2 && w.count === 2 && await m.evaluate(k => !FAILED.has(k), k),
      `a profile switched away from: its history is written as this page holds it, two alike entries as two (${SEED + 2} stored)`, Object.assign({alike: two.alike}, w));
    await m.reload();
    await m.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const r = await countOf(m, k, two.e);
    check(r.n === SEED + 2 && r.count === 2, 'and after a reload', r);
    check(!e7.length, 'a profile switched away from, written: no page errors', e7.slice(0, 2).join('; ') + (p0 ? '' : ''));
    await c7.close();
  }
  {
    // another tab erases the history of the profile this page left (#47's re-review, N1): this page's
    // unsaved copy is not written or merged back over the erase; it stays in memory, with a notice
    const {ctx: c8, page: x, errors: e8} = await L.openFile(browser, {}, CAP);
    await seeded(x, c8);
    await x.evaluate(() => startQuiz(null, null));
    await x.evaluate(ANSWER, true);
    await x.waitForTimeout(400);
    const me = await x.evaluate(() => ({p: PROFILE, k: logKey()}));
    await x.evaluate(() => useProfile('other-one'));
    await x.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 5000}).catch(() => {});
    await x.evaluate(() => { window.__logCap = null; });
    const y = await c8.newPage();
    y.on('dialog', d => d.accept());
    await y.goto(x.url());
    await y.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await y.evaluate(p => useProfile(p), me.p);
    await y.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    await y.evaluate(() => show('settings'));
    await y.click('#btnReset');
    await y.waitForTimeout(300);
    const erased = await y.evaluate(k => localStorage.getItem(k), me.k);
    await y.close();
    await x.waitForTimeout(300);
    await x.evaluate(() => startQuiz(null, null));
    await x.evaluate(ANSWER, true);
    await x.waitForTimeout(800);
    const st = await x.evaluate(k => ({stored: localStorage.getItem(k), failed: FAILED.has(k), mem: JSON.parse(MEM[k] || '[]').length, notice: !!document.querySelector('.awaywarn')}), me.k);
    check(erased === '[]' && st.stored === '[]' && st.failed && st.mem === SEED + 1 && st.notice,
      'another tab erased the history of the profile this page left: this page writes nothing back over it, keeps its copy in memory and offers its export', Object.assign({erased}, st, {stored: (st.stored || '').length}));
    check(!e8.length, 'another tab erased it: no page errors', e8.slice(0, 2).join('; '));
    await c8.close();
  }
  for(const theyAnswer of [false, true]){
    // only history entries unsaved at "Use it here" (the progress as stored), and the browser has
    // room again: they are added to the stored history, and no copy of the progress is made, so
    // Put back has nothing older to roll the progress back to. Two of them alike (one question, one
    // second) stay two (#47's re-review, N2): with nothing else stored since, the history is written
    // as this page holds it; with the other tab's answer stored meanwhile, this page's never-stored
    // entries are added to it, counted
    const {ctx: c6, page: a, errors: e6} = await L.openFile(browser, {}, CAP);
    await seeded(a, c6);
    const two = await twoAlike(a);
    // a confidence changed here on an entry stored before ("Not sure" later), refused with the rest
    const first = await a.evaluate(() => { LOG[0][5] = 'unsure'; saveLog(); return LOG[0]; });
    await a.waitForTimeout(400);
    const b = await c6.newPage();
    b.on('dialog', x => x.accept());
    await b.goto(a.url());
    await b.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await b.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await b.evaluate(() => takeOver(false));
    await b.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    let theirs = null;
    if(theyAnswer){
      await b.evaluate(() => startQuiz(null, null));
      const n1 = await b.evaluate(() => LOG.length);
      await b.evaluate(ANSWER, true);
      theirs = await b.evaluate(n => LOG.length > n ? LOG[LOG.length - 1] : null, n1);
      await b.waitForTimeout(300);
    }
    await a.waitForFunction(() => !!document.getElementById('stopwall'), null, {timeout: 5000}).catch(() => {});
    await a.evaluate(() => { window.__logCap = null; const x = document.getElementById('stopTake'); if(x) x.click(); });
    await a.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const r = await a.evaluate(([m, t]) => { const l = JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]');
      return {n: l.length, count: l.filter(e => JSON.stringify(e) === JSON.stringify(m)).length, theirs: t ? l.some(e => JSON.stringify(e) === JSON.stringify(t)) : null,
              seeded: l.filter(e => e[4] === 'seeded').length, copies: localStorage.getItem(NS + ':backup:' + PROFILE), held: WRITER}; }, [two.e, theirs]);
    const want = SEED + 2 + (theyAnswer ? 1 : 0);
    check(two.alike && (!theyAnswer || (!!theirs && r.theirs)) && r.n === want && r.count === 2 && r.seeded === SEED && r.copies === null && r.held === 'held',
      `"Use it here" with only history entries unsaved${theyAnswer ? ', the other tab having answered meanwhile' : ''}: they are added to the stored history, two alike entries as two (${want} stored), and no copy of the progress is made`, Object.assign({alike: two.alike}, r));
    const conf = await a.evaluate(f => { const l = JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]');
      const e = l.find(x => JSON.stringify(x.filter((y, i) => i !== 5)) === JSON.stringify(f.filter((y, i) => i !== 5))); return e ? e[5] : null; }, first);
    check(conf === 'unsure', `"Use it here"${theyAnswer ? ', the other tab having answered meanwhile' : ''}: a confidence this page changed on an entry stored before is kept on the stored entry`, conf);
    check(!e6.length, '"Use it here" with only history unsaved: no page errors', e6.slice(0, 2).join('; '));
    await c6.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
