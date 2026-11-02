/* notes: the module's own test. run_checks.sh runs it when the course switches the
 * module on (build.py --list-checks).
 *
 * In node, on the course's own page: with a note on every question of the bank, the
 * copied text has one section per question, a key for every multiple-choice,
 * numeric and matching question, and no "undefined" or "[object Object]"; the
 * converter keeps each saved note {t, at} and drops anything else.
 * In Chromium, on a scratch copy with one of Basic-Pharmacokinetics' questions added
 * (src/q13_quizzes.js cq5-5 at ac2eb73, id nt-cq5-5, the professor, topic, skill and
 * cite set to the course's own) and 40 copies of it under other ids for a large saved
 * state, at 390 px and 1200 px (Basic-Pharmacokinetics src/notes_test.py ported; its
 * paper flags are study-controls' and are checked only through the Notes tab):
 * a note on a drill question is saved as it is typed, the button then reads My note,
 * and the note is there after a reload; a note on a running paper leaves the key out
 * of the text and out of the Notes tab; after a reload the paper and the note are
 * both there; after Submit every result card carries the button and the text carries
 * both keys, with the course's {{frac:a|b}} written (a)/(b); Weak spots counts the
 * notes and opens the tab; the Notes tab lists them newest first, Copy for AI copies
 * the text, Download saves it as <course id>-my-questions.md, a note edits in place,
 * an emptied note is removed, Delete note removes it, Drill these drills the noted
 * questions; Settings says what is kept; no page error.
 * Persistence (390 px): 41 notes of 2,000 characters and 300 answers come back
 * after a reload; the topic filter and Drill these follow the topic; Export progress
 * carries every note, and Import into a new profile brings back the same notes; each
 * profile keeps its own; a reload 400 ms after typing keeps the change, a reload
 * under 150 ms is reported (the core writes 150 ms after the last change); with
 * storage denied and with storage full the notice shows, the stored progress is left
 * as it was, and once storage works the next change is saved with every earlier
 * note and loads after a reload; Erase my history removes the notes.
 * When study-controls is on: a flagged question's card on the Notes tab says
 * "⚑ flagged" and the mark goes when the flag does; typing in a note never fires a
 * study-controls key (quiz and paper); the one-page cards carry the button. When it
 * is off: no flag mark even with a stray DB.flags.
 *
 *     node features/notes/test.js        (NOTES_SHOTS=<folder> saves screenshots)
 */
const fs = require('fs'), os = require('os'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/notes/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;
const SHOTS = process.env.NOTES_SHOTS || '';

// Basic-Pharmacokinetics src/q13_quizzes.js lines 834-855, at ac2eb73 (exam, module, lecture and dupOf left out)
const CQ55 = {id:'cq5-5', tier:'new', concept:'nl-low-conc', source:'both',
 stem:'Which of the following is true for a medication that displays nonlinear pharmacokinetics?',
 options:[
  {t:'At low concentrations of drug in the plasma relative to Vmax, the elimination rate depends on concentration.', correct:false,
   why:'Picking this compares the concentration with the wrong parameter. Vmax is a rate, an amount per time, so a plasma concentration cannot be low or high relative to it; the order of elimination is read from Cp against KM, which has units of concentration.'},
  {t:'At low concentrations of drug in the plasma relative to KM, the elimination rate is independent of concentration.', correct:false,
   why:'Picking this reverses the two ends. A rate independent of concentration is zero order, which holds when Cp is much greater than KM and the enzyme runs at Vmax. Well below KM the rate is {{frac:Vmax|KM}} × Cp, which follows the concentration.'},
  {t:'At low concentrations of drug in the plasma relative to KM, the elimination rate depends on the concentration.', correct:true,
   why:'With Cp much less than KM, Cp is negligible in KM + Cp and the rate is {{frac:Vmax|KM}} × Cp = k′Cp. Vmax and KM are constants, so the rate is proportional to Cp: first-order behaviour.'},
  {t:'At low concentrations of drug in the plasma relative to Vmax, the elimination rate is independent of concentration.', correct:false,
   why:'Picking this pairs the wrong parameter with the zero-order end. Vmax is a rate, not a concentration, so Cp is not compared with it; zero order applies when Cp is much greater than KM, not at low concentrations.'}],
 teach:[
  {h:'The idea', list:[
   'Rate of elimination = {{frac:Vmax × Cp|KM + Cp}}.',
   'Cp much less than KM: the rate is {{frac:Vmax|KM}} × Cp, proportional to Cp, so first order.',
   'Cp much greater than KM: the rate is Vmax, a constant, so zero order, and further dose increases accumulate.',
   'KM and Cp share units of concentration, which is why they are the pair compared; Vmax is a rate.']}]};
const MANY = 40;
const fixture = '/* Basic-Pharmacokinetics\' question cq5-5 (src/q13_quizzes.js, ac2eb73) and copies of it, added by the notes test */\n' +
  `const NT_BASE = ${JSON.stringify(CQ55)};\n` +
  "const ntQ = (id, k) => Object.assign(JSON.parse(JSON.stringify(NT_BASE)), {id, prof: COURSE.professors[0], topic: TOPICS[k % TOPICS.length].id,\n" +
  "  sub: TOPICS[k % TOPICS.length].subs[0].id, skill: COURSE.skills[0].id, tags: [], concept: k ? 'nt-many-' + k : NT_BASE.concept,\n" +
  "  cite: 'Canvas Quiz 5 (Modules 7b and 8), question 5; ' + COURSE.lectures[0].deck + ' slides 7 and 8'});\n" +
  `QUESTIONS.push(ntQ('nt-cq5-5', 0));\nfor(let k = 1; k <= ${MANY}; k++) QUESTIONS.push(ntQ('nt-many-' + k, k));\n`;

const DENY = () => { const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if(window.__deny === 'denied') throw new DOMException('The operation is insecure.', 'SecurityError');
    if(window.__deny === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return orig.call(this, k, v); }; };

(async () => {
  console.log('\n=== the copied text on the course\'s own bank (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX, QUESTIONS, COURSE, db: () => DB, upgradeDB: r => upgradeDB(r)})');
  const N = X.FX && X.FX.api('notes');
  if(!check(!!N, 'the page carries notes, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  X.db().notes = {};
  X.QUESTIONS.forEach((q, i) => { X.db().notes[q.id] = {t: 'Question about ' + q.id, at: 1000 + i}; });
  const md = N.markdown();
  const keyed = X.QUESTIONS.filter(q => (!q.type && Array.isArray(q.options)) || q.type === 'numeric' || q.type === 'match');
  check((md.match(/^## \d+\. /mg) || []).length === X.QUESTIONS.length, `the text has one section per question (${X.QUESTIONS.length} questions)`);
  check((md.match(/^\*\*Key:\*\* \S/mg) || []).length === keyed.length, `a key for every multiple-choice, numeric and matching question (${keyed.length})`);
  check(!/undefined|\[object Object\]/.test(md), 'no "undefined" or "[object Object]" in the text', (md.match(/.{0,40}(undefined|\[object Object\]).{0,20}/) || [''])[0]);
  check(N.noted().length === X.QUESTIONS.length && N.noted()[0] === X.QUESTIONS[X.QUESTIONS.length - 1].id, 'noted() lists every note, newest first');
  const id0 = X.QUESTIONS[0].id;
  const conv = X.upgradeDB({concepts: {}, answers: [], notes: {[id0]: {t: 'kept', at: 5}, a: 'text only', b: {t: '   '}, c: {at: 3}, d: null}});
  check(JSON.stringify(conv.notes) === JSON.stringify({[id0]: {t: 'kept', at: 5}}), 'the converter keeps each note {t, at} and drops anything else', conv.notes);
  check(!('notes' in X.upgradeDB({concepts: {}, answers: [], notes: 'x'})), 'a saved `notes` that is not an object is dropped');

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' question (Chromium) ===');
  const s = L.scratchBuild('notes', {files: {'q90_notes_fixture.js': fixture}});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test question does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
  try {
    for(const width of [390, 1200]){
      console.log(`\n--- ${width} px ---`);
      const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width, height: 900}, acceptDownloads: true}, DENY);
      const ev = (f, a) => page.evaluate(f, a);
      const wait = ms => page.waitForTimeout(ms);
      const SC = await ev(() => !!FX.api('study-controls'));
      // a note on a drill question
      await L.quizOn(page, ['nt-cq5-5', 'nt-cq5-5']);
      check(await ev(() => !!document.querySelector('#v-quiz .qcard .qhead [data-noteq="nt-cq5-5"]')), 'the quiz card carries ✎ Note');
      await page.click('#v-quiz [data-noteq="nt-cq5-5"]');
      await page.fill('#v-quiz textarea[data-notetext="nt-cq5-5"]', 'Why is Vmax not compared with Cp?');
      if(SHOTS && width === 390) await page.screenshot({path: path.join(SHOTS, 'quiz-note-390.png')});
      await wait(400);
      check(await ev(() => DB.notes['nt-cq5-5'] && DB.notes['nt-cq5-5'].t) === 'Why is Vmax not compared with Cp?', 'a note on a drill question is saved as it is typed');
      check(await ev(() => document.querySelector('#v-quiz [data-noteq="nt-cq5-5"]').textContent) === '✎ My note', 'the button then reads My note');
      if(SC){
        // study-controls' keys must not fire while the note is typed in
        await page.click('#v-quiz textarea[data-notetext="nt-cq5-5"]');
        await page.keyboard.type('a1b2'); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowRight');
        const k = await ev(() => ({revealed: Q.revealed, picked: Q.picked, t: DB.notes['nt-cq5-5'].t}));
        check(!k.revealed && (k.picked === null || k.picked === undefined) && k.t.endsWith('a1b2\n'), 'typing a1b2 and Enter in a note picks and checks nothing (study-controls keys)', k);
        await page.fill('#v-quiz textarea[data-notetext="nt-cq5-5"]', 'Why is Vmax not compared with Cp?'); await wait(300);
      }
      await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
      check(await ev(() => DB.notes && DB.notes['nt-cq5-5'] && DB.notes['nt-cq5-5'].t) === 'Why is Vmax not compared with Cp?', 'the note is still there after a reload');

      // a note on a running paper
      await ev(() => { Q = null; show('exam'); beginExam(); });
      const k2 = await ev(() => { const k = EX.qs.findIndex(q => q.id !== 'nt-cq5-5'); EX.i = k; renderExamQ(); return k; });
      const pid = await ev(k => EX.qs[k].id, k2);
      await page.waitForSelector(`#v-exam [data-noteq="${pid}"]`, {timeout: 3000}).catch(() => {});
      check(await ev(id => !!document.querySelector(`#v-exam .qhead [data-noteq="${id}"]`), pid), 'the exam paper\'s card carries ✎ Note');
      await page.click(`#v-exam [data-noteq="${pid}"]`);
      await page.fill(`#v-exam textarea[data-notetext="${pid}"]`, 'Not sure which line to use here.');
      if(SC){
        const before = await ev(() => ({i: EX.i, p: JSON.stringify(EX.picks)}));
        await page.click(`#v-exam textarea[data-notetext="${pid}"]`);
        await page.keyboard.type(' a1'); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
        const after = await ev(() => ({i: EX.i, p: JSON.stringify(EX.picks)}));
        check(after.i === before.i && after.p === before.p, 'typing a1, Enter and the arrows in a note on the paper moves and picks nothing (study-controls keys)', {before, after});
        await page.fill(`#v-exam textarea[data-notetext="${pid}"]`, 'Not sure which line to use here.');
      }
      await wait(400);
      let text = await ev(() => FX.api('notes').markdown());
      const sec = text.split(/^## /m).find(x => x.includes('Not sure which line')) || '';
      check(sec.includes('**Key:** left out until the paper is submitted') && (sec.match(/^\*\*Key:\*\* /mg) || []).length === 1 && !sec.includes('Why the key is right'),
            'a note on a running paper leaves its key and the reason out of the text', sec.slice(0, 300));
      await ev(() => show('notes'));
      check(await ev(id => { const c = document.querySelector(`#v-notes [data-noteid="${id}"]`); return !!c && /hidden until the paper/.test(c.textContent) && !c.querySelector('.ntkey'); }, pid),
            'the Notes tab hides that question\'s key while the paper runs');
      await ev(() => { window.onbeforeunload = null; });
      await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
      await ev(() => show('exam'));
      check(await ev(id => !!EX && EX.running && DB.notes[id] && DB.notes[id].t === 'Not sure which line to use here.', pid), 'after a reload the paper and its note are both there');
      await ev(() => finishExam(false)); await wait(200);
      check(await ev(() => document.querySelectorAll('#v-exam > .qcard .qhead [data-noteq]').length === EX.qs.length), 'after Submit every result card carries ✎ Note');
      check(await ev(id => document.querySelector(`#v-exam [data-noteq="${id}"]`).textContent === '✎ My note', pid), 'the result card of the noted question reads My note');
      text = await ev(() => FX.api('notes').markdown());
      check(!text.includes('left out until') && (text.match(/^\*\*Key:\*\* /mg) || []).length === 2 && text.includes('Not sure which line') && text.includes('Why is Vmax'),
            'after Submit the text carries both notes with their keys');
      check(text.includes('(Vmax)/(KM)') && !text.includes('{{frac'), 'the course\'s {{frac:a|b}} is written (a)/(b) in the text');
      check(text.startsWith('# My questions: ') && !/\bher\b|\bshe\b/i.test(text), 'the text names no professor by pronoun');

      // Weak spots and the Notes tab
      await ev(() => show('gaps'));
      check(await ev(() => (document.querySelector('#ntGaps') || {}).textContent || ''), 'Weak spots has the notes line') ;
      check((await ev(() => document.querySelector('#ntGaps').textContent)).includes('You have 2 notes'), 'Weak spots counts the 2 notes');
      await page.click('#ntOpen');
      check(await ev(() => VIEW === 'notes' && document.querySelectorAll('#v-notes [data-noteid]').length === 2), 'Open Notes opens the Notes tab with a card for each note');
      check(await ev(id => document.querySelector('#v-notes [data-noteid]').dataset.noteid === id, pid), 'the newest note is first');
      check(await ev(() => /Your answer:/.test(document.querySelector('#v-notes [data-noteid="nt-cq5-5"]').textContent) || /Not answered yet/.test(document.querySelector('#v-notes [data-noteid="nt-cq5-5"]').textContent)),
            'each card says the answer last given, or that there is none');
      if(SHOTS && width === 390) await page.screenshot({path: path.join(SHOTS, 'notes-tab-390.png'), fullPage: true});
      await ev(() => { navigator.clipboard.writeText = t => { window.__copied = t; return Promise.resolve(); }; });
      await page.click('#notesCopy'); await wait(200);
      check(await ev(() => document.querySelector('#notesCopy').textContent) === 'Copied ✓', 'Copy for AI says Copied');
      check(await ev(() => window.__copied === FX.api('notes').markdown()), 'Copy for AI copies the whole text');
      const dl = page.waitForEvent('download');
      await page.click('#notesDown');
      const d = await dl, cid = await ev(() => COURSE.id);
      check(d.suggestedFilename() === `${cid}-my-questions.md`, 'Download saves <course id>-my-questions.md', d.suggestedFilename());
      const dp = path.join(tmp, 'notes-' + width + '.md'); await d.saveAs(dp);
      check(fs.readFileSync(dp, 'utf8') === await ev(() => FX.api('notes').markdown()), 'the downloaded file is the text');
      await page.fill('#v-notes textarea[data-notetext="nt-cq5-5"]', 'Edited in the Notes tab.'); await wait(300);
      check(await ev(() => DB.notes['nt-cq5-5'].t) === 'Edited in the Notes tab.', 'a note edits in the Notes tab');
      // the flag mark, read from study-controls when it is on
      if(SC){
        await ev(() => { FX.api('study-controls').set('nt-cq5-5', true); show('topics'); show('notes'); });
        check(await ev(() => !!document.querySelector('#v-notes [data-noteid="nt-cq5-5"] .ntflag') && document.querySelectorAll('#v-notes .ntflag').length === 1), 'with study-controls on, the flagged question\'s card says ⚑ flagged');
        await ev(() => { FX.api('study-controls').set('nt-cq5-5', false); show('topics'); show('notes'); });
        check(await ev(() => !document.querySelector('#v-notes .ntflag')), 'the mark goes when the flag does');
      }else{
        await ev(() => { DB.flags = {'nt-cq5-5': 1}; show('topics'); show('notes'); });
        check(await ev(() => !document.querySelector('#v-notes .ntflag')), 'with study-controls off, no flag mark, even with a stray DB.flags');
        await ev(() => { delete DB.flags; });
      }
      await page.click('#v-notes [data-notedel="nt-cq5-5"]'); await wait(200);
      check(await ev(() => !DB.notes['nt-cq5-5'] && document.querySelectorAll('#v-notes [data-noteid]').length === 1), 'Delete note removes it');
      await page.fill(`#v-notes textarea[data-notetext="${pid}"]`, '   '); await wait(300);
      check(await ev(id => !(id in DB.notes), pid), 'an emptied note is removed from the progress');
      await page.fill(`#v-notes textarea[data-notetext="${pid}"]`, 'Back again.'); await wait(300);
      await page.click('#notesDrill');
      check(await ev(id => VIEW === 'quiz' && Q.pool.length === 1 && Q.pool[0].id === id, pid), 'Drill these drills the noted questions');
      await ev(() => show('settings'));
      check(await ev(() => /Export progress includes them, Import progress brings them back, and Erase my history removes them/.test((document.querySelector('#v-settings [data-feature="notes"]') || {}).textContent || '')),
            'Settings says what is kept and where');

      if(SC){
        await ev(() => { DB.layout = 'all'; save(); drillList(QUESTIONS.filter(q => !q.type).slice(0, 5), 'one page'); });
        await wait(300);
        check(await ev(() => { const c = document.querySelectorAll('#v-quiz .qcard[data-scq]'); return c.length > 1 && [...c].every(x => x.querySelector('.qhead [data-noteq="' + x.dataset.scq + '"]')); }),
              'study-controls\' one-page quiz cards each carry ✎ Note');
        await ev(() => { Q = null; EX = null; clearExam(); show('exam'); beginExam(); }); await wait(300);
        check(await ev(() => { const c = document.querySelectorAll('#v-exam .qcard.scxq'); return c.length === EX.qs.length && [...c].every((x, k) => x.querySelector('.qhead [data-noteq="' + EX.qs[k].id + '"]')); }),
              'study-controls\' one-page paper cards each carry ✎ Note');
        await ev(() => { finishExam(false); DB.layout = 'one'; save(); });
      }

      if(width === 390){
        console.log('\n--- persistence: a large saved state (390 px) ---');
        const big = await ev(() => {
          const ids = QUESTIONS.filter(q => q.id.startsWith('nt-')).map(q => q.id);
          ids.forEach((id, i) => { DB.notes[id] = {t: 'Note ' + i + ': ' + 'what I am thinking about this question. '.repeat(50).slice(0, 2000), at: Date.now() - (ids.length - i) * 1000}; });
          for(let i = 0; i < 300; i++) record(QUESTIONS[i % QUESTIONS.length], i % 3 ? 'correct' : 'wrong', undefined, 1000);
          save(); return {n: Object.keys(DB.notes).length, answers: DB.answers.length, profile: PROFILE};
        });
        await wait(400);
        const snap = await ev(() => JSON.stringify(DB.notes));
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await ev(() => JSON.stringify(DB.notes)) === snap && await ev(() => DB.answers.length) >= big.answers,
              `${big.n} notes of up to 2,000 characters and ${big.answers} answers come back after a reload`, big);
        await ev(() => show('notes'));
        check(await ev(n => document.querySelectorAll('#v-notes [data-noteid]').length === n, big.n), `the Notes tab lists all ${big.n}`);
        const tp = await ev(() => { const b = [...document.querySelectorAll('#v-notes [data-notestopic]')].filter(x => x.dataset.notestopic !== 'all');
          if(!b.length) return null; const t = b[b.length - 1].dataset.notestopic; b[b.length - 1].click();
          const cards = [...document.querySelectorAll('#v-notes [data-noteid]')];
          return {t, n: cards.length, all: cards.every(c => byId(c.dataset.noteid).topic === t), want: Object.keys(DB.notes).filter(id => byId(id) && byId(id).topic === t).length,
                  drill: document.querySelector('#notesDrill').textContent}; });
        check(tp && tp.n === tp.want && tp.all && tp.drill === `Drill these ${tp.want}`, 'the topic filter lists only that topic\'s notes, and Drill these counts them', tp);
        await page.click('#notesDrill');
        check(await ev(t => Q.pool.length > 0 && Q.pool.every(q => q.topic === t), tp && tp.t), 'Drill these drills only that topic\'s noted questions');

        // Export, then Import into a new profile
        await ev(() => show('settings'));
        const ex = page.waitForEvent('download'); await page.click('#btnExport');
        const ef = path.join(tmp, 'export.json'); await (await ex).saveAs(ef);
        const exported = JSON.parse(fs.readFileSync(ef, 'utf8'));
        check(JSON.stringify(exported.db.notes) === snap, `Export progress carries every note (${Object.keys(exported.db.notes || {}).length})`);
        await ev(() => { window.__name = 'Fresh'; askProfile(true); show('settings'); });
        check(await ev(() => PROFILE === 'Fresh' && !DB.notes), 'a new profile starts with no notes');
        await page.setInputFiles('#fileIn', ef); await wait(600);
        check(await ev(() => JSON.stringify(DB.notes)) === snap, 'Import progress into the new profile brings back the same notes');
        await wait(300);
        await ev(() => { window.__name = 'Other'; askProfile(true); });
        await ev(() => { show('notes'); });
        check(await ev(() => !DB.notes && /No notes yet/.test(document.querySelector('#v-notes').textContent)), 'a third profile has no notes');
        await ev(() => { FX.api('notes'); DB.notes = {'nt-cq5-5': {t: 'Other profile note', at: Date.now()}}; save(); }); await wait(300);
        await ev(p => { window.__name = p; askProfile(true); }, big.profile);
        check(await ev(() => JSON.stringify(DB.notes)) === snap, 'switching back, the first profile has its own notes');
        await ev(() => { window.__name = 'Other'; askProfile(true); });
        check(await ev(() => Object.keys(DB.notes).length === 1 && DB.notes['nt-cq5-5'].t === 'Other profile note'), 'the other profile keeps only its own note');
        await ev(p => { window.__name = p; askProfile(true); }, big.profile);
        check(await ev(p => PROFILE === p, big.profile), 'back on the first profile');

        // a reload soon after a change
        const typeNote = async (t) => { await L.quizOn(page, ['nt-many-1', 'nt-many-1']); await page.click('#v-quiz [data-noteq="nt-many-1"]');
          await page.fill('#v-quiz textarea[data-notetext="nt-many-1"]', t); };
        await typeNote('Kept: reloaded 400 ms after.'); await wait(400);
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await ev(() => DB.notes['nt-many-1'].t) === 'Kept: reloaded 400 ms after.', 'a reload 400 ms after typing keeps the change');
        await typeNote('Typed then reloaded at once.');
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        const fast = await ev(() => ({t: DB.notes['nt-many-1'].t, n: Object.keys(DB.notes).length}));
        console.log(`  report  a reload under 150 ms after typing: the note reads "${fast.t}" (${fast.t === 'Typed then reloaded at once.' ? 'the change was kept' : 'the last change was lost; the earlier text is kept'}), ${fast.n} notes`);
        check(fast.n === big.n && (fast.t === 'Kept: reloaded 400 ms after.' || fast.t === 'Typed then reloaded at once.'), 'a reload under 150 ms after typing loses at most that change, and every note is still there', fast);

        // storage denied, then storage full
        for(const mode of ['denied', 'full']){
          await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
          const stored0 = await ev(() => localStorage.getItem(keyFor(PROFILE)));
          await ev(m => { window.__deny = m; }, mode);
          await typeNote(`Written while storage is ${mode}.`); await wait(400);
          const r = await ev(() => ({warn: (() => { const w = document.querySelector('#savewarn'); if(!w) return false; const b = w.getBoundingClientRect(), cs = getComputedStyle(w);
              return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; })(),
            text: (document.querySelector('#savewarn') || {}).textContent || '', stored: localStorage.getItem(keyFor(PROFILE)), mem: DB.notes['nt-many-1'].t}));
          check(r.warn && /did not save your progress/.test(r.text), `storage ${mode}: the student is told the progress was not saved`, r.text);
          check(r.stored === stored0 && r.mem === `Written while storage is ${mode}.`, `storage ${mode}: the stored progress is left as it was, and the note stays on screen`);
          await ev(() => { window.__deny = null; });
          await typeNote(`Written after storage works again (${mode}).`); await wait(400);
          await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
          const back = await ev(() => ({t: DB.notes['nt-many-1'].t, n: Object.keys(DB.notes).length}));
          check(back.t === `Written after storage works again (${mode}).` && back.n === big.n, `storage ${mode}: once storage works, the next change is saved with every earlier note and loads after a reload`, back);
        }
        if(SHOTS) { await ev(() => show('notes')); await page.screenshot({path: path.join(SHOTS, 'notes-many-390.png')}); }

        // a saved note in a bad shape is dropped on load; the rest load
        await ev(() => { const k = keyFor(PROFILE), d = JSON.parse(localStorage.getItem(k)); d.notes.bad1 = 'text only'; d.notes['nt-many-2'] = {t: 7}; localStorage.setItem(k, JSON.stringify(d)); });
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await ev(n => !('bad1' in DB.notes) && !('nt-many-2' in DB.notes) && Object.keys(DB.notes).length === n - 1, big.n), 'a saved note in a bad shape is dropped on load, the others load');

        await ev(() => show('settings')); await page.click('#btnReset'); await wait(300);
        check(await ev(() => !DB.notes), 'Erase my history removes the notes');
      }
      const fx = await ev(() => FX.errors.length ? FX.errors : null);
      check(!fx && !errors.length, `no page error and no module error at ${width} px`, JSON.stringify(fx || errors.slice(0, 3)));
      await ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); fs.rmSync(tmp, {recursive: true, force: true});
  }
  L.finish(NAME);
})().catch(e => { console.log('  FAIL  the test stopped: ' + (e && e.stack || e)); L.check(false, 'the test ran to its end', String(e && e.message || e)); L.finish(NAME); });
