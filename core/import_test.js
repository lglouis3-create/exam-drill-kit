/* Import progress (views.js readProgressFile, importPlan, runImport), on the
 * course's own page, each browser context standing for one device:
 *
 *   another course     a file labelled with another course, a file that names no
 *   or none            course (even when every question it answers is this drill's),
 *                      a BDK quiz file and another app's file are refused, and nothing
 *                      is saved
 *   damaged files      not JSON, not an object, no progress, an answer that is not
 *                      whole, the same answer twice, a history entry that is not
 *                      whole, a history that is not a list: refused, nothing saved
 *   older files        a labelled progress from before 2026-11-01 (no `v`, no `last`)
 *                      and a history of seven-field entries are read and converted
 *   newer, older,      a file that continues this device's record replaces it after
 *   diverged           the plan is confirmed, and the replaced progress is kept and
 *                      can be put back; an older file whose settings differ goes
 *                      into a new profile; a file and a
 *                      device that each have answers the other lacks: the file goes
 *                      into a new profile and this one is unchanged; a file that keeps
 *                      only its latest 4,000 answers and lacks this device's older
 *                      ones goes into a new profile too, and the plan says why
 *   conflicts          an answer in both under the same question and time, with a
 *                      different result or a different choice: the file goes into a
 *                      new profile, both records kept, the plan says so
 *   continuation       the file replaces this profile only when it continues it: a
 *                      record of another origin (`created`), an answer list here that
 *                      the 4,000-answer limit has cut, or answers here that are not
 *                      the file's first answers in order: a new profile, each time
 *   besides the        matching or empty answer lists with other concept progress
 *   answers            (both lists empty, as in review of 3edbf94), another pace,
 *                      a scheduling state or a module's part: a new profile, never
 *                      "nothing"; a file with no answers whose every part is here:
 *                      nothing
 *   empty profile      a file with concept progress and no answers, or with answers,
 *                      replaces a profile with no progress; a profile with concept
 *                      progress and no answers is not taken for an empty one
 *   older files and    an older file whose every part is here changes nothing; one
 *   repeats            whose concept was answered again here goes into a new
 *                      profile; the same file again, also after a reload, after the
 *                      profile was opened, and with no answers, makes no second
 *                      profile; a file with the same answers as a profile but other
 *                      concept progress is not taken for it
 *   other parts        a part this profile changed without an answer (a module's record)
 *                      sends a file whose answers continue it into a new profile;
 *                      settings, an answer count, concept records and scheduler
 *                      records of the wrong kind are refused
 *   cleared storage    site data cleared while a page is open: its next save writes
 *                      its copy back
 *   tabs and refused   a profile another tab saved since, or progress the browser
 *   saves              refused to save in this visit: Import plans and writes nothing;
 *                      a tab opened before an import does not save over it, and says
 *                      so; a waiting save refused at Import stays on the page, flagged;
 *                      Import, Erase and Put back in a stale tab write nothing and say so
 *   history            an empty profile with another record's history is not
 *                      replaced; a file whose progress is all in a profile here adds
 *                      its new history entries to that profile
 *   put back           a refused write at each of its three steps, and at step 2
 *                      with its undo refused too: both records are in storage after
 *                      each, the page says what happened, a reload shows the same;
 *                      the copies are deleted only when asked
 *   settings           the pace comes with the file; the equation drill's choice and
 *                      every key outside the progress stay as they were
 *   refused reads and  a progress or history that could not be read in this visit,
 *   writes             and a refused write of the progress, the copies or the
 *                      history: nothing is replaced, the history in memory does not
 *                      shrink, and a reload shows the same
 * Every case checks what is stored, not only what is on screen.
 *
 *     node import_test.js
 */
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('./check_lib');
const NAME = 'import_test.js';
const {check} = L;
L.PAGE.need(NAME);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'import-test-'));
let nfile = 0;

(async () => {
  const {browser} = await L.launch(NAME);
  const open = async (seed) => {
    const o = await L.openFile(browser, {}, seed ? ([s]) => {
      if(sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      for(const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    } : undefined);
    if(seed) { await o.page.close(); o.page = await o.ctx.newPage(); o.page.on('pageerror', e => o.errors.push(e.message)); o.page.on('dialog', d => d.accept().catch(() => {})); }
    return o;
  };
  // the page with init scripts set before load (open() above seeds through an init script on the context)
  // locks: the browser's Web Locks as it has them. Without it the page sees a browser with no
  // Web Locks (navigator.locks undefined), the case the comparison guards cover on their own;
  // every section before "Two tabs at once" runs so, as it did before the single-writer lock
  const device = async (seed, locks) => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    if(!locks) await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'locks', {get: () => undefined, configurable: true}); } catch(e){} });
    if(seed) await ctx.addInitScript(([s]) => {
      if(sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      for(const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    }, [seed]);
    const page = await ctx.newPage(), errors = [], dialogs = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => { dialogs.push(d.message()); d.accept().catch(() => {}); });   // a dialog shown as its page closes cannot be accepted (WebKit, run 41943489826)
    await page.goto(await L.pageUrl(L.PAGE.PAGE));
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    return {ctx, page, errors, dialogs};
  };
  void open;
  const info = p => p.evaluate(() => ({ns: NS, profile: PROFILE, data: keyFor(PROFILE), log: NS + ':log:' + PROFILE, backup: NS + ':backup:' + PROFILE,
                                       course: COURSE.id, ids: QUESTIONS.map(q => q.id), concepts: QUESTIONS.map(q => q.concept)}));
  const stored = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
  // every stored key and value, in key order (the browser's own order can change)
  const allKeys = p => p.evaluate(() => { const o = {}, ks = []; for(let i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
    ks.sort().forEach(k => { o[k] = localStorage.getItem(k); }); return o; });
  // n answers to the bank's questions, each at its own millisecond
  const answer = (p, n, start) => p.evaluate(([n, start]) => {
    for(let i = 0; i < n; i++){
      const t = Date.now(); while(Date.now() === t){ /* the next millisecond */ }
      const q = QUESTIONS[(start + i) % QUESTIONS.length];
      record(q, i % 3 === 2 ? 'wrong' : 'correct', undefined, 1000);   // record() writes the history entry too
    }
    clearTimeout(saveTimer); saveTimer = null; store.set(keyFor(PROFILE), JSON.stringify(DB));
    return DB.answers.length;
  }, [n, start || 0]);
  const exportOf = async p => {
    await p.evaluate(() => show('settings'));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnExport')]);
    return JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  };
  // choose the file; returns the plan's text and whether an Import button is offered;
  // go: click it and return the result's text too
  const choose = async (p, obj, go) => {
    const f = path.join(TMP, `f${++nfile}.json`);
    fs.writeFileSync(f, typeof obj === 'string' ? obj : JSON.stringify(obj));
    await p.evaluate(() => show('settings'));
    await p.setInputFiles('#fileIn', f);
    await p.waitForFunction(() => { const b = document.getElementById('importPlan'); return b && b.textContent.trim(); }, null, {timeout: 5000}).catch(() => {});
    const text = () => p.evaluate(() => { const b = document.getElementById('importPlan'); return b ? b.textContent : ''; });
    const plan = (await text()).replace(/\s+/g, ' ').trim();
    const offered = !!(await p.$('#importGo'));
    let result = '';
    if(go && offered){
      await p.click('#importGo');
      await p.waitForSelector('#importResult', {timeout: 5000}).catch(() => {});
      result = (await text()).replace(/\s+/g, ' ').trim();
    }
    return {plan, offered, result};
  };
  const reload = async p => { await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); };
  // One tab's save reaches another tab's localStorage a moment later, not at once: the HTML
  // Standard leaves storage between processes undefined, with no locking. On GitHub (run
  // 41593067385) a tab read null right after the other tab's save, then the same 913 characters
  // one step later. So before one tab acts on, or is checked against, another tab's save, it
  // first reads exactly what the writing tab holds under those keys. Returns those values.
  const synced = async (reader, writer, keys, what) => {
    const want = await writer.evaluate(ks => ks.map(k => localStorage.getItem(k)), keys);
    const ok = await reader.waitForFunction(([ks, w]) => ks.every((k, i) => localStorage.getItem(k) === w[i]), [keys, want], {timeout: 5000, polling: 10})
      .then(() => true, () => false);
    check(ok, `${what}: this tab reads the other tab's save within 5 s`, keys);
    return want;
  };
  const nAns = p => p.evaluate(() => DB.answers.length);

  // ---- device A: three answers ----
  const A = await device();
  const I = await info(A.page);
  await answer(A.page, 3, 0);
  const fileA = await exportOf(A.page);
  check(fileA.app === 'exam-drill' && fileA.course === I.course && fileA.ns === I.ns && fileA.db.answers.length === 3 && fileA.log.length === 3,
    'Export writes the course, its storage name, the progress and the history', {course: fileA.course, n: fileA.db.answers.length});

  console.log('\n=== Files of another course, of another app, or damaged ===');
  {
    const before = await allKeys(A.page);
    // fileA with its first concept record changed
    const withConcept = fn => { const g = JSON.parse(JSON.stringify(fileA)), c = Object.keys(g.db.concepts)[0]; g.db.concepts[c] = fn(g.db.concepts[c]); return g; };
    const withDb = part => Object.assign({}, fileA, {db: Object.assign({}, fileA.db, part)});
    const bad = [
      ['settings that are not a settings record', withDb({settings: null}), /settings are not a settings record/],
      ['an answer count that is not a number', withDb({qn: 'x'}), /answer count is not a number/],
      ['a concept record with a count that is not a number', withConcept(c => Object.assign({}, c, {seen: 'many'})), /"seen" is not a number/],
      ['a concept record whose questions asked are not a list', withConcept(c => Object.assign({}, c, {asked: 7})), /"asked" is not a list/],
      ['a scheduler record that is not a list of entries', withDb({arms: []}), /"arms" is not a list of entries/],
      ['a comparison record with an arm that does not exist', withDb({arms: {[Object.keys(fileA.db.concepts)[0]]: 42}}), /an arm that does not exist/],
      ['an FSRS record with an entry that is not a card', withDb({fsrsQ: {[I.ids[0]]: 'x'}}), /that is not a card/],
      ['a setting of the wrong kind', withDb({settings: {mode: 7}}), /setting "mode" is not a setting/],
      ['a file labelled with another course', Object.assign({}, fileA, {course: 'OTHER101', ns: 'other101-drill'}), /another course \(OTHER101\)/],
      ['a file labelled with this course\'s name and another storage name', Object.assign({}, fileA, {ns: 'someone-else'}), /another course/],
      ['a file that names no course, every question it answers this drill\'s', {profile: 'x', db: fileA.db, log: fileA.log}, /names no course/],
      ['a file that names no course, none of its questions this drill\'s', {profile: 'x', db: {concepts: {}, answers: [{qid: 'zz-not-here', concept: 'c', result: 'correct', at: 1, qn: 1}]}}, /names no course/],
      ['a file that names no course, with no answers', {profile: 'x', db: {concepts: {}, answers: []}}, /names no course/],
      ['a BDK quiz export', {app: 'bdk-quiz', exported: '2026-11-01T00:00:00Z', progress: {}, log: []}, /BDK quiz/],
      ['another app\'s file', {app: 'flashcards', db: fileA.db}, /another app/],
      ['a file that is not JSON', '{"app": "exam-drill", "db": ', /not valid JSON/],
      ['JSON that is not an object', '[1, 2, 3]', /not a progress export/],
      ['an object with no progress', {app: 'exam-drill', course: I.course, ns: I.ns, log: []}, /holds no progress/],
      ['an answer that is not whole', Object.assign({}, fileA, {db: Object.assign({}, fileA.db, {answers: fileA.db.answers.concat([{qid: I.ids[0], result: 'correct'}])})}), /answer 4 of 4 is not a whole answer/],
      ['an answer with a result the drill does not record', Object.assign({}, fileA, {db: Object.assign({}, fileA.db, {answers: [Object.assign({}, fileA.db.answers[0], {result: 'maybe'})]})}), /answer 1 of 1/],
      ['the same answer twice', Object.assign({}, fileA, {db: Object.assign({}, fileA.db, {answers: fileA.db.answers.concat([fileA.db.answers[0]])})}), /the same answer twice/],
      ['a history entry that is not whole', Object.assign({}, fileA, {log: fileA.log.concat([['x', 'y']])}), /entry 4 of 4 is not a whole entry/],
      ['a history that is not a list', Object.assign({}, fileA, {log: {a: 1}}), /history is damaged: it is not a list/],
    ];
    const moved = [];
    for(const [label, obj, want] of bad){
      const r = await choose(A.page, obj, true);
      check(!r.offered && want.test(r.plan) && /Nothing was imported/.test(r.plan), `${label}: refused, saying why`, r.plan.slice(0, 220));
      await A.page.waitForTimeout(200);   // past the 150 ms a save waits
      const now = await allKeys(A.page);
      if(JSON.stringify(now) !== JSON.stringify(before)) moved.push(label);
    }
    check(!moved.length, `after each of the ${bad.length} refused files every stored key is exactly as it was`, moved.join('; '));
    check(await nAns(A.page) === 3, 'and the progress on screen is unchanged (3 answers)');
  }

  console.log('\n=== Older files: a labelled progress from before 2026-11-01 ===');
  {
    const old = await device();
    // a progress of before 2026-11-01 (no `v`, no `last`), in a file that names the course
    const db = JSON.parse(JSON.stringify(fileA.db));
    delete db.v; for(const c of Object.values(db.concepts)) delete c.last; delete db.fsrsQ; delete db.fsrsC; delete db.arms; delete db.fsUndo;
    const r = await choose(old.page, {app: 'exam-drill', course: I.course, ns: I.ns, profile: 'Louis', db}, true);
    check(r.offered && /progress of "Louis"/.test(r.plan) && /this profile has no progress yet/.test(r.plan), 'the older progress, in a file that names this course, is offered to a profile with none', r.plan.slice(0, 260));
    const got = await old.page.evaluate(() => JSON.parse(JSON.stringify(DB)));
    const lastWant = {};
    for(const a of fileA.db.answers) (lastWant[a.concept] = lastWant[a.concept] || {})[a.qid] = Math.max(a.qn, ((lastWant[a.concept] || {})[a.qid]) || 0);
    check(got.v === 2 && got.answers.length === 3 && Object.entries(lastWant).every(([c, l]) => JSON.stringify(got.concepts[c].last) === JSON.stringify(l)),
      'it is converted to the current shape: v 2, every answer kept, each concept\'s last-shown counts rebuilt', {v: got.v, n: got.answers.length});
    // a history of seven-field entries (before the scheduler fields)
    const seven = fileA.log.map(e => e.slice(0, 7));
    const r2 = await choose(old.page, Object.assign({}, fileA, {log: seven.concat([[fileA.log[0][0] - 60, 'abcdef01', 1, 'quiz', 'c', 'knew', 'mc']])}), true);
    const log = await old.page.evaluate(() => LOG.slice());
    // the older file carried no history, so all four entries are new here
    check(/adds 4 history entries/.test(r2.plan) && log.length === 4 && log.every(e => e.length === 7) && log.some(e => e[1] === 'abcdef01'),
      'a history of seven-field entries is merged as it is', {plan: r2.plan.slice(0, 260), n: log.length});
    check(!old.errors.length, 'no page errors', old.errors.slice(0, 2).join('; '));
    await old.ctx.close();
  }

  console.log('\n=== Newer, older and diverged files ===');
  const B = await device();
  let r = await choose(B.page, fileA, true);
  check(r.offered && /3 answers that this device does not have/.test(r.plan) && /In the file: 3 answers/.test(r.plan) && /On this device, "[^"]+": 0 answers/.test(r.plan),
    'a device with no answers is offered the file, with what the file and the device hold', r.plan.slice(0, 300));
  check(/Imported/.test(r.result) && await nAns(B.page) === 3 && (await B.page.evaluate(() => LOG.length)) === 3, 'confirmed, the device has the file\'s 3 answers and 3 history entries', r.result);
  await answer(B.page, 2, 3);
  const fileB = await exportOf(B.page);
  // A imports B's newer file: it continues A's record
  await A.page.evaluate(() => { DB.settings.pace = 'semester'; DB.settings.eqPick = 'device-choice'; store.set(keyFor(PROFILE), JSON.stringify(DB)); });
  await A.page.evaluate(ns => localStorage.setItem(ns + ':homeTipDismissed', '1'), I.ns);
  const fileB2 = JSON.parse(JSON.stringify(fileB));
  fileB2.db.settings = Object.assign({}, fileB2.db.settings, {mode: 'normal', pace: 'weekly', eqPick: 'file-choice'});
  const aBefore = await stored(A.page, I.data), aKeys = await allKeys(A.page);
  r = await choose(A.page, fileB2, false);
  check(r.offered && /2 answers that this device does not have, and it continues this profile's record/.test(r.plan) && /kept, and Settings can put it back/.test(r.plan) && /pace/.test(r.plan),
    'a newer file of the same record: the plan says it replaces the progress, keeps the old one, and that the pace comes with it', r.plan.slice(0, 400));
  check(await stored(A.page, I.data) === aBefore && await nAns(A.page) === 3, 'nothing is saved before the plan is confirmed');
  await A.page.click('#importCancel');
  check(await stored(A.page, I.data) === aBefore && !(await A.page.textContent('#importPlan')).trim(), 'Cancel leaves everything as it was');
  r = await choose(A.page, fileB2, true);
  const aSet = await A.page.evaluate(() => JSON.parse(JSON.stringify(DB.settings)));
  check(await nAns(A.page) === 5 && JSON.parse(await stored(A.page, I.data)).answers.length === 5, 'confirmed, the progress is the file\'s (5 answers), on screen and stored', r.result);
  check(aSet.pace === 'weekly' && aSet.mode === 'normal' && aSet.eqPick === 'device-choice', 'the pace and "Ask everything" come with the file; the equation drill\'s choice stays this device\'s', aSet);
  check(await stored(A.page, I.ns + ':homeTipDismissed') === '1' && Object.keys(aKeys).filter(k => !k.startsWith(I.ns + ':data:') && !k.startsWith(I.ns + ':log:')).every(k => k === I.backup || aKeys[k] === (k in aKeys ? aKeys[k] : null)),
    'keys outside the progress and the history are untouched');
  // the copies Import keeps, as a list (one stored copy that is not a list counts as a list of one)
  const asList = v => Array.isArray(v) ? v : (v ? [v] : []);
  const copiesOf = async (p, k) => asList(JSON.parse(await stored(p, k) || '[]'));
  const bk = await copiesOf(A.page, I.backup);
  check(bk.length === 1 && bk[0].data === aBefore, 'the replaced progress is kept as a copy, exactly as it was stored', bk.length);
  check((await A.page.evaluate(() => LOG.length)) === 5 && JSON.parse(await stored(A.page, I.log)).length === 5, 'the history gains the file\'s 2 entries (5)');
  await reload(A.page);
  check(await nAns(A.page) === 5 && (await A.page.evaluate(() => LOG.length)) === 5, 'after a reload: 5 answers and 5 history entries');
  await A.page.evaluate(() => show('settings'));
  check(!!(await A.page.$('#btnRestore')), 'Settings offers to put back the progress from before the import');
  // the same file again
  r = await choose(A.page, fileB2, true);
  check(!r.offered && /on this device already/.test(r.plan) && await nAns(A.page) === 5 && (await A.page.evaluate(() => LOG.length)) === 5,
    'importing the same file again changes nothing', r.plan.slice(0, 200));
  // an older file of the same record: its answers are all here, but its other parts may
  // be older or may have been changed elsewhere, which its answers cannot tell apart
  {
    const before = await stored(A.page, I.data);
    r = await choose(A.page, fileA, false);
    // this device's pace was set by the newer file above, so the older file's settings differ
    check(r.offered && /this device has 2 answers that the file does not have; the file's settings differ from this profile's/i.test(r.plan) && /new profile/.test(r.plan),
      'an older file of the same record whose settings differ: the plan offers a new profile, and says why', r.plan.slice(0, 420));
    await A.page.click('#importCancel');
    check(await stored(A.page, I.data) === before && await nAns(A.page) === 5, 'cancelled, nothing is saved');
  }
  // put back, then forward again
  await A.page.click('#btnRestore');
  await A.page.waitForTimeout(300);
  check(await nAns(A.page) === 3 && await stored(A.page, I.data) === aBefore, 'Put back restores the progress from before the import, as it was stored');
  {
    const c = await copiesOf(A.page, I.backup);
    check(c.length === 1 && c[0].data !== aBefore && JSON.parse(c[0].data).answers.length === 5,
      'and keeps the progress it replaced (5 answers) as the copy in its place; the copy put back is off the list', c.map(x => JSON.parse(x.data).answers.length));
  }
  r = await choose(A.page, fileB2, true);
  check(await nAns(A.page) === 5, 'the newer file imports again after a put-back');

  // diverged: B answers on its own; A answers on its own
  await answer(B.page, 2, 5);
  const fileB3 = await exportOf(B.page);
  await answer(A.page, 1, 2);   // q2, right: A's earlier answer to q2 was wrong, so their history entries differ even within one second
  const aNow = await stored(A.page, I.data), aLog = await stored(A.page, I.log);
  r = await choose(A.page, fileB3, false);
  const newName = (r.plan.match(/new profile, "([^"]+)"/) || [])[1] || '(no new profile named)';
  check(r.offered && /2 answers that this device does not have; this device has 1 answer that the file does not have/.test(r.plan) && !!newName,
    'a file and a device that each have answers the other lacks: the plan offers a new profile for the file', r.plan.slice(0, 400));
  r = await choose(A.page, fileB3, true);
  const prof = JSON.parse(await stored(A.page, I.ns + ':data:' + newName) || 'null');
  check(prof && prof.answers.length === 7 && JSON.stringify(prof.answers) === JSON.stringify(fileB3.db.answers), `confirmed, the file's 7 answers are the profile "${newName}"`, r.result);
  check(JSON.parse(await stored(A.page, I.ns + ':log:' + newName) || '[]').length === 7, 'with its 7 history entries');
  check(await stored(A.page, I.data) === aNow && await stored(A.page, I.log) === aLog && await nAns(A.page) === 6, 'the progress and history of this profile are unchanged (6 answers)');
  // the same diverged file again
  const profiles = async () => Object.keys(await allKeys(A.page)).filter(k => k.startsWith(I.ns + ':data:')).length;
  const nProf = await profiles();
  r = await choose(A.page, fileB3, true);
  check(!r.offered && r.plan.includes(`already in the profile "${newName}"`) && await profiles() === nProf,
    'the same file again: it is in the profile it went into, and no second profile is made', r.plan.slice(0, 200));
  await reload(A.page);
  check(!!(await stored(A.page, I.ns + ':data:' + newName)) && await nAns(A.page) === 6, 'after a reload the new profile is there and this profile has its 6 answers');
  // Open it
  r = await choose(A.page, Object.assign({}, fileB3, {db: Object.assign({}, fileB3.db, {answers: fileB3.db.answers.concat([])})}), false);
  await A.page.evaluate(n => { useProfile(n); show('settings'); }, newName);
  check(await A.page.evaluate(() => PROFILE) === newName && await nAns(A.page) === 7, 'the new profile opens with the file\'s 7 answers');
  await A.page.evaluate(n => { useProfile(n); show('settings'); }, I.profile);
  r = await choose(A.page, fileB3, true);
  check(!r.offered && r.plan.includes(`already in the profile "${newName}"`) && await profiles() === nProf,
    'after that profile was opened, the same file again still makes no second profile', r.plan.slice(0, 200));
  // the same answers as that profile, with other concept progress: not the file imported before
  {
    const g = JSON.parse(JSON.stringify(fileB3)), c = Object.keys(g.db.concepts)[0];
    g.db.concepts[c].seen += 1; g.db.concepts[c].correct += 1;
    r = await choose(A.page, g, true);
    const name2 = (r.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const p2 = name2 ? JSON.parse(await stored(A.page, I.ns + ':data:' + name2) || 'null') : null;
    check(!!p2 && !r.plan.includes('already in the profile') && JSON.stringify(p2.concepts[c]) === JSON.stringify(g.db.concepts[c]) && await profiles() === nProf + 1,
      'a file with the same answers as a profile here but other concept progress is not taken for it: a new profile, holding the file\'s concept progress', r.plan.slice(0, 300));
    r = await choose(A.page, g, true);
    check(!r.offered && r.plan.includes(`already in the profile "${name2}"`) && await profiles() === nProf + 1, 'that file again makes no further profile', r.plan.slice(0, 200));
  }

  console.log('\n=== The 4,000-answer limit ===');
  {
    const T = await device();
    const ti = await info(T.page);
    await answer(T.page, 2, 0);
    const here = await T.page.evaluate(() => DB.answers.map(a => a.at));
    const t0 = Math.max(...here) + 1000;
    const answers = Array.from({length: 4000}, (_, i) => ({qid: ti.ids[i % ti.ids.length], concept: ti.concepts[i % ti.ids.length], result: 'correct', at: t0 + i, qn: i + 1}));
    const f = {app: 'exam-drill', course: ti.course, ns: ti.ns, profile: 'other device', exported: new Date().toISOString(), db: {v: 2, concepts: {}, answers, qn: 4000, settings: {mode: 'normal'}}, log: []};
    const before = await stored(T.page, ti.data);
    const rr = await choose(T.page, f, false);
    check(rr.offered && /keeps only its latest 4,000 answers/.test(rr.plan) && /new profile/.test(rr.plan),
      'a file at the limit that lacks this device\'s older answers goes into a new profile, and the plan says why', rr.plan.slice(0, 400));
    check(await stored(T.page, ti.data) === before, 'nothing is saved before it is confirmed');
    await T.ctx.close();
  }

  // a device with n answers of its own, its export, and what it has stored
  const own = async (n) => {
    const d = await device(); const di = await info(d.page);
    await answer(d.page, n, 0);
    return {d, di, file: await exportOf(d.page), data: await stored(d.page, di.data)};
  };
  const later = (f, k) => {   // f with k more answers after its last, numbered on
    const g = JSON.parse(JSON.stringify(f)), last = g.db.answers[g.db.answers.length - 1];
    for(let i = 1; i <= k; i++) g.db.answers.push(Object.assign({}, g.db.answers[i % g.db.answers.length], {at: last.at + 5000 * i, qn: last.qn + i}));
    return g;
  };
  // a file that went into a new profile: that profile holds the file's answers, this one is as it was
  const keptApart = async (o, r, f, label) => {
    const name = (r.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const theirs = name ? JSON.parse(await stored(o.d.page, I.ns + ':data:' + name) || 'null') : null;
    check(!!theirs && JSON.stringify(theirs.answers) === JSON.stringify(f.db.answers) && await stored(o.d.page, o.di.data) === o.data,
      `${label}: the file's answers are a new profile, field for field, and this profile's stored progress is exactly as it was`, name);
  };

  console.log('\n=== Conflicting answers: the same question and time, different fields ===');
  {
    const o = await own(3);
    for(const [label, edit] of [['a different result', a => { a.result = a.result === 'wrong' ? 'correct' : 'wrong'; }],
                                ['a different choice', a => { a.picked = 2; }]]){
      const f = JSON.parse(JSON.stringify(o.file)); edit(f.db.answers[1]);
      let rr = await choose(o.d.page, f, false);
      check(rr.offered && /1 answer is in both with a different result, choice or mark/.test(rr.plan) && /new profile/.test(rr.plan) && !/on this device already/.test(rr.plan),
        `${label} under the same question and time is a conflict: the plan offers a new profile`, rr.plan.slice(0, 300));
      rr = await choose(o.d.page, f, true);
      await keptApart(o, rr, f, label);
    }
    await o.d.ctx.close();
  }

  console.log('\n=== Replacement only when the file continues this profile\'s record ===');
  {
    const o = await own(3);
    const f = later(o.file, 1); f.db.created = o.file.db.created + 1;
    let rr = await choose(o.d.page, f, false);
    check(rr.offered && /not started from this profile's record/.test(rr.plan) && /new profile/.test(rr.plan),
      'a file of another origin (created) that holds every answer here and one more goes into a new profile', rr.plan.slice(0, 300));
    rr = await choose(o.d.page, f, true);
    await keptApart(o, rr, f, 'another origin');
    await o.d.ctx.close();
  }
  {
    const o = await own(3);
    const f = later(o.file, 1);
    // this device's list cut at its start, as the 4,000-answer limit cuts it: its first answer is no longer answer 1
    await o.d.page.evaluate(k => { const d = JSON.parse(localStorage.getItem(k)); d.answers.shift(); localStorage.setItem(k, JSON.stringify(d)); }, o.di.data);
    await reload(o.d.page);
    o.data = await stored(o.d.page, o.di.data);
    let rr = await choose(o.d.page, f, false);
    check(rr.offered && /does not begin with its first answer/.test(rr.plan) && /new profile/.test(rr.plan),
      'an answer list here that does not start at answer 1 cannot be shown to be continued: a new profile', rr.plan.slice(0, 300));
    rr = await choose(o.d.page, f, true);
    await keptApart(o, rr, f, 'a cut list here');
    await o.d.ctx.close();
  }
  {
    const o = await own(3);
    const f = JSON.parse(JSON.stringify(o.file));
    f.db.answers.unshift(Object.assign({}, f.db.answers[0], {at: f.db.answers[0].at - 60000, qn: 0}));
    let rr = await choose(o.d.page, f, false);
    check(rr.offered && /not the file's first answers in order/.test(rr.plan) && /new profile/.test(rr.plan),
      'a file with an answer before this device\'s first (not its continuation) goes into a new profile', rr.plan.slice(0, 300));
    rr = await choose(o.d.page, f, true);
    await keptApart(o, rr, f, 'answers out of order');
    await o.d.ctx.close();
  }

  console.log('\n=== Progress besides the answers: concept progress, settings, scheduling state ===');
  // Louis, 2026-11-03: matching or empty answer lists alone never show that a file adds nothing
  const C0 = I.concepts[0];
  const rec = (seen, box) => ({seen, correct: seen - 1, wrong: 1, guessed: 0, streak: 1, box, dueAt: 1793700000000 + 86400000 * box, dueQ: 0, lastQ: -999, asked: [], last: {}});
  const blankDb = () => ({v: 2, concepts: {}, answers: [], qn: 0, fsrsQ: {}, fsrsC: {}, arms: {}, fsUndo: null, settings: {mode: 'cram'}, created: 1793600000000});
  const fileOf = db => ({app: 'exam-drill', course: I.course, ns: I.ns, profile: 'other device', exported: new Date().toISOString(), db, log: []});
  const profilesOn = async p => Object.keys(await allKeys(p)).filter(k => k.startsWith(I.ns + ':data:')).length;
  // a file that went into a new profile: that profile is the file's progress, part for part, and this one is as it was
  const keptWhole = async (p, di, r, f, hereBefore, label) => {
    const name = (r.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const theirs = name ? JSON.parse(await stored(p, I.ns + ':data:' + name) || 'null') : null;
    check(!!theirs && ['concepts', 'answers', 'settings', 'arms', 'fsrsC'].every(k => JSON.stringify(theirs[k]) === JSON.stringify(f.db[k] === undefined ? {} : f.db[k])) &&
          await stored(p, di.data) === hereBefore,
      `${label}: the file's progress is a new profile, part for part, and this profile's stored progress is exactly as it was`, name);
    return name;
  };
  {
    // both answer lists empty, the concept progress different (the case found in review of 3edbf94)
    const here = blankDb(); here.concepts[C0] = rec(3, 1);
    const D = await device({[I.ns + ':profile']: 'TestUser', [I.ns + ':data:TestUser']: JSON.stringify(here)});
    const di = await info(D.page);
    const hereBefore = await stored(D.page, di.data);
    const fdb = blankDb(); fdb.concepts[C0] = rec(5, 2);
    const f = fileOf(fdb);
    let rr = await choose(D.page, f, false);
    check(rr.offered && /In the file: 0 answers/.test(rr.plan) && /the file's concept progress differs from this profile's/i.test(rr.plan) && /new profile/.test(rr.plan),
      'both answer lists empty, the concept progress different: the plan offers a new profile and says why, not "nothing"', rr.plan.slice(0, 400));
    rr = await choose(D.page, f, true);
    const name = await keptWhole(D.page, di, rr, f, hereBefore, 'empty answer lists, other concept progress');
    const n0 = await profilesOn(D.page);
    rr = await choose(D.page, f, true);
    check(!rr.offered && rr.plan.includes(`already in the profile "${name}"`) && await profilesOn(D.page) === n0, 'that file again: no second profile', rr.plan.slice(0, 200));
    // another file with no answers: not taken for the profile made above, since its concept progress differs
    const g = fileOf(Object.assign(blankDb(), {concepts: {[C0]: rec(7, 3)}}));
    rr = await choose(D.page, g, true);
    check(!rr.plan.includes('already in the profile') && /now the profile/.test(rr.result) && await profilesOn(D.page) === n0 + 1,
      'another file with no answers and other concept progress is not taken for it: a new profile', rr.plan.slice(0, 260));
    // a file with no answers whose every part is this profile's
    rr = await choose(D.page, fileOf(JSON.parse(hereBefore)), true);
    check(!rr.offered && /on this device already/.test(rr.plan) && await profilesOn(D.page) === n0 + 1 && await stored(D.page, di.data) === hereBefore,
      'a file with no answers whose every part is this profile\'s changes nothing', rr.plan.slice(0, 200));
    check(!D.errors.length, 'no page errors', D.errors.slice(0, 2).join('; '));
    await D.ctx.close();
  }
  for(const [label, change, want] of [
    ['the same answers, other concept progress', f => { const c = Object.keys(f.db.concepts)[0]; f.db.concepts[c].box += 1; f.db.concepts[c].dueAt += 86400000; }, /the file's concept progress differs from this profile's/i],
    ['the same answers and concept progress, another pace', f => { f.db.settings = Object.assign({}, f.db.settings, {mode: 'normal', pace: 'semester'}); }, /the file's settings differ from this profile's/i],
    ['the same answers, a scheduling state this profile lacks', f => { f.db.arms = {[Object.keys(f.db.concepts)[0]]: 'concept-fsrs'}; }, /the file's scheduling state differs from this profile's/i],
    ['the same answers, a part a feature module keeps', f => { f.db.notes = {[I.ids[0]]: 'a note'}; }, /the file's other saved progress differs from this profile's/i],
  ]){
    const o = await own(3);
    const f = JSON.parse(JSON.stringify(o.file));
    change(f);
    let rr = await choose(o.d.page, f, false);
    check(rr.offered && want.test(rr.plan) && /new profile/.test(rr.plan) && !/on this device already/.test(rr.plan),
      `${label}: the plan offers a new profile and says why, not "nothing"`, rr.plan.slice(0, 400));
    rr = await choose(o.d.page, f, true);
    const name = await keptWhole(o.d.page, o.di, rr, f, o.data, label);
    if(f.db.notes){
      const theirs = JSON.parse(await stored(o.d.page, I.ns + ':data:' + name) || '{}');
      check(JSON.stringify(theirs.notes) === JSON.stringify(f.db.notes), 'and the module\'s part is in it', theirs.notes);
    }
    await o.d.ctx.close();
  }

  console.log('\n=== Into an empty profile ===');
  {
    const E = await device(); const ei = await info(E.page);
    const fdb = blankDb(); fdb.concepts[C0] = rec(4, 2); fdb.settings = {mode: 'normal', pace: 'semester'};
    const f = fileOf(fdb);
    let rr = await choose(E.page, f, false);
    check(rr.offered && /The file holds progress with no answers, and this profile has no progress yet/.test(rr.plan),
      'a file with concept progress and no answers, into a profile with none: the plan replaces it, not "nothing"', rr.plan.slice(0, 300));
    rr = await choose(E.page, f, true);
    const got = JSON.parse(await stored(E.page, ei.data) || 'null') || {concepts: null, settings: {}, answers: []};
    check(JSON.stringify(got.concepts) === JSON.stringify(fdb.concepts) && got.settings.pace === 'semester' && got.answers.length === 0 && await profilesOn(E.page) === 1,
      'confirmed, the profile holds the file\'s concept progress and pace, and no other profile is made', rr.result);
    rr = await choose(E.page, f, true);
    check(!rr.offered && /on this device already/.test(rr.plan) && await profilesOn(E.page) === 1, 'the same file again changes nothing', rr.plan.slice(0, 200));
    await E.ctx.close();
  }
  {
    const E = await device(); const ei = await info(E.page);
    let rr = await choose(E.page, fileA, true);
    const got = JSON.parse(await stored(E.page, ei.data) || 'null') || {concepts: null, answers: null};
    check(/this profile has no progress yet/.test(rr.plan) && JSON.stringify(got.answers) === JSON.stringify(fileA.db.answers) && JSON.stringify(got.concepts) === JSON.stringify(fileA.db.concepts),
      'a file with answers, into a profile with none: the profile holds the file\'s answers and concept progress', rr.plan.slice(0, 260));
    rr = await choose(E.page, fileA, true);
    check(!rr.offered && /on this device already/.test(rr.plan) && await profilesOn(E.page) === 1, 'the same file again changes nothing, and no second profile is made', rr.plan.slice(0, 200));
    await E.ctx.close();
  }
  {
    // a profile with concept progress and no answers is not empty: a file with answers does not replace it
    const here = blankDb(); here.concepts[C0] = rec(3, 1);
    const D = await device({[I.ns + ':profile']: 'TestUser', [I.ns + ':data:TestUser']: JSON.stringify(here)});
    const di = await info(D.page);
    const hereBefore = await stored(D.page, di.data);
    let rr = await choose(D.page, fileA, false);
    check(rr.offered && /new profile/.test(rr.plan) && !/no progress yet/.test(rr.plan),
      'a profile with concept progress and no answers is not taken for an empty one: a file with answers goes into a new profile', rr.plan.slice(0, 300));
    rr = await choose(D.page, fileA, true);
    await keptWhole(D.page, di, rr, fileA, hereBefore, 'into a profile with concept progress and no answers');
    await D.ctx.close();
  }

  console.log('\n=== Older files and repeated imports ===');
  {
    const o = await own(3);                 // q1 to q3
    const f1 = o.file;
    await answer(o.d.page, 2, 3);           // q4 and q5: concepts the file holds no record of
    const data5 = await stored(o.d.page, o.di.data);
    let rr = await choose(o.d.page, f1, true);
    check(!rr.offered && /on this device already/.test(rr.plan) && await stored(o.d.page, o.di.data) === data5 && await profilesOn(o.d.page) === 1,
      'an older file whose every part is here (its concepts not answered since) changes nothing', rr.plan.slice(0, 260));
    await answer(o.d.page, 1, 0);           // q1 again: the file's record of that concept is no longer this profile's
    const data6 = await stored(o.d.page, o.di.data);
    rr = await choose(o.d.page, f1, false);
    check(rr.offered && /this device has 3 answers that the file does not have; the file's concept progress differs from this profile's/i.test(rr.plan) && /new profile/.test(rr.plan),
      'an older file whose concept was answered again here: a new profile, since its answers cannot show that it adds nothing', rr.plan.slice(0, 400));
    rr = await choose(o.d.page, f1, true);
    const name = await keptWhole(o.d.page, o.di, rr, f1, data6, 'an older file');
    rr = await choose(o.d.page, f1, true);
    check(!rr.offered && rr.plan.includes(`already in the profile "${name}"`) && await profilesOn(o.d.page) === 2, 'that file again: no second profile', rr.plan.slice(0, 200));
    await reload(o.d.page);
    rr = await choose(o.d.page, f1, true);
    check(!rr.offered && rr.plan.includes(`already in the profile "${name}"`) && await profilesOn(o.d.page) === 2 && await stored(o.d.page, o.di.data) === data6,
      'after a reload, that file again: still no second profile, and this profile as it was', rr.plan.slice(0, 200));
    await o.d.ctx.close();
  }


  console.log('\n=== Continuation: a part this profile changed without an answer ===');
  {
    // a module keeps a record that changes without an answer (as equation-drill's DB.eq does)
    const o = await own(3);
    await o.d.page.evaluate(() => { DB.eq = {'eq-cl': {seen: 5, right: 4, wrong: 1, streak: 3, at: 1793700000000}}; clearTimeout(saveTimer); saveTimer = null; store.set(keyFor(PROFILE), JSON.stringify(DB)); });
    o.data = await stored(o.d.page, o.di.data);
    const f = later(o.file, 2);   // the answers continue, from a device that never had that record
    let rr = await choose(o.d.page, f, false);
    check(rr.offered && /this profile's other saved progress is not in the file as it is here/i.test(rr.plan) && /new profile/.test(rr.plan) && !/continues this profile's record/.test(rr.plan),
      'a file whose answers continue this profile but which lacks a part changed here without an answer: a new profile, not a replace', rr.plan.slice(0, 420));
    rr = await choose(o.d.page, f, true);
    await keptApart(o, rr, f, 'a part changed here without an answer');
    const mine = JSON.parse(await stored(o.d.page, o.di.data));
    check(!!mine.eq && mine.eq['eq-cl'].seen === 5 && !(await stored(o.d.page, o.di.backup)), 'this profile keeps that part, and no copy was needed', mine.eq);
    await o.d.ctx.close();
  }

  console.log('\n=== Another tab of the same browser ===');
  {
    const d = await device(); const di = await info(d.page);
    const tab2 = await d.ctx.newPage();
    tab2.on('dialog', x => x.accept().catch(() => {}));
    await tab2.goto(d.page.url());
    await tab2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    // this tab opened the profile with no progress; the other tab answers 3 and saves
    await answer(tab2, 3, 0);
    const [theirs] = await synced(d.page, tab2, [di.data, di.log], 'the other tab answered');
    let rr = await choose(d.page, fileA, true);
    // what is stored after, with what the other tab wrote and saved, for a failure's report
    const after = async (was) => { const now = await stored(d.page, di.data), n = v => JSON.parse(v || '{"answers":[]}').answers.length;
      return {same: now === was, wasN: n(was), nowN: n(now), backup: !!(await stored(d.page, di.backup)), stale1: await d.page.evaluate(() => typeof STALE === 'undefined' ? 'no STALE' : STALE), stale2: await tab2.evaluate(() => typeof STALE === 'undefined' ? 'no STALE' : STALE),
              pending2: await tab2.evaluate(() => !!saveTimer), lenWas: (was || '').length, lenNow: (now || '').length}; };
    const a1 = await after(theirs);
    check(!rr.offered && /saved by another tab or window/.test(rr.plan) && a1.same && !a1.backup,
      'a tab whose profile another tab has saved since: Import plans nothing and says so, and the other tab\'s progress is stored as it was', Object.assign({offered: rr.offered, plan: rr.plan.slice(0, 90)}, a1));
    // after a reload: the plan is shown, then the other tab saves again before the click
    await reload(d.page);
    const g = later(await exportOf(d.page), 1);
    rr = await choose(d.page, g, false);
    check(rr.offered && /continues this profile's record/.test(rr.plan), 'reloaded, the tab plans a file that continues its record', rr.plan.slice(0, 200));
    await answer(tab2, 1, 3);
    const [theirs2] = await synced(d.page, tab2, [di.data, di.log], 'the other tab answered again');
    await d.page.click('#importGo');
    await d.page.waitForSelector('#importResult', {timeout: 5000}).catch(() => {});
    const res = (await d.page.evaluate(() => document.getElementById('importPlan').textContent)).replace(/\s+/g, ' ');
    const a2 = await after(theirs2);
    check(/saved by another tab or window/.test(res) && a2.same && !a2.backup,
      'the other tab saving after the plan was shown: Import refuses at the click, and nothing is written', Object.assign({res: res.slice(0, 90)}, a2));
    await d.ctx.close();
  }
  {
    // a tab opened before an import does not write its older progress over the import
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const tab2 = await d.ctx.newPage();
    tab2.on('dialog', x => x.accept().catch(() => {}));
    await tab2.goto(d.page.url());
    await tab2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const g = later(await exportOf(d.page), 2);
    const rr = await choose(d.page, g, true);
    const imported = await stored(d.page, di.data), importedLog = await stored(d.page, di.log);
    check(/Imported/.test(rr.result) && JSON.parse(imported).answers.length === 4, 'this tab imports a file that continues its record (4 answers)', rr.result.slice(0, 200));
    // the other tab, still holding the 2-answer progress, answers once (once it can read the import)
    await synced(tab2, d.page, [di.data, di.log], 'this tab imported');
    await tab2.evaluate(() => record(QUESTIONS[4], 'correct', undefined, 1000));
    await tab2.waitForTimeout(400);
    const warned = await tab2.evaluate(() => !!document.getElementById('stalewarn'));
    // read in the tab that might have written, and in this one
    check(await stored(tab2, di.data) === imported && await stored(tab2, di.log) === importedLog &&
          await stored(d.page, di.data) === imported && await stored(d.page, di.log) === importedLog && warned,
      'the other tab\'s next save writes neither its progress nor its history over the import, and it says why and offers a reload',
      {warned, n: JSON.parse(await stored(d.page, di.data) || '{"answers":[]}').answers.length});
    await tab2.reload();
    await tab2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    check(await tab2.evaluate(() => DB.answers.length) === 4, 'reloaded, the other tab shows the imported progress (4 answers)');
    await d.ctx.close();
  }

  console.log('\n=== Storage cleared while the page is open; stale tabs and the other writes ===');
  {
    // the browser's site data cleared while a page is open: the page's next save writes its copy back
    const o = await own(3);
    await o.d.page.evaluate(() => localStorage.clear());
    await o.d.page.evaluate(() => record(QUESTIONS[3], 'correct', undefined, 1000));
    await o.d.page.waitForTimeout(400);
    const back = JSON.parse(await stored(o.d.page, o.di.data) || '{"answers":[]}'), log = JSON.parse(await stored(o.d.page, o.di.log) || '[]');
    const warned = await o.d.page.evaluate(() => !!document.getElementById('stalewarn'));
    check(back.answers.length === 4 && log.length === 4 && !warned,
      'site data cleared while the page is open: the next save writes the page\'s 4 answers and 4 history entries back, with no "another tab" notice', {n: back.answers.length, log: log.length, warned});
    await o.d.ctx.close();
  }
  {
    // a tab already stopped as stale stays stopped, also after the site data is cleared
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const tab2 = await d.ctx.newPage();
    tab2.on('dialog', x => x.accept().catch(() => {}));
    await tab2.goto(d.page.url());
    await tab2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await answer(tab2, 3, 2);                                       // the other tab: 5 answers stored
    await synced(d.page, tab2, [di.data, di.log], 'the other tab answered');
    await d.page.evaluate(() => record(QUESTIONS[0], 'correct', undefined, 1000));
    await d.page.waitForTimeout(400);                                // this tab is stopped
    await d.page.evaluate(() => localStorage.clear());
    await d.page.evaluate(() => record(QUESTIONS[1], 'correct', undefined, 1000));
    // a setting changed there too: the stopped page takes no answer, and writes no setting either
    await d.page.evaluate(() => { DB.settings.goal = 21; save(); saveNow(); });
    await d.page.waitForTimeout(400);
    check(await stored(d.page, di.data) === null && await d.page.evaluate(() => !!document.getElementById('stalewarn')),
      'a tab stopped as stale writes nothing after the site data is cleared either: its older copy is not written', await stored(d.page, di.data));
    await d.ctx.close();
  }
  {
    // site data cleared, then Import: the plan saves the page's copy again first
    const o = await own(3);
    await o.d.page.evaluate(() => localStorage.clear());
    const rr = await choose(o.d.page, o.file, false);
    const back = JSON.parse(await stored(o.d.page, o.di.data) || '{"answers":[]}');
    check(back.answers.length === 3 && /on this device already/.test(rr.plan),
      'site data cleared, then Import: the page\'s 3 answers are saved again before the plan, so "on this device already" is true', {n: back.answers.length, plan: rr.plan.slice(0, 120)});
    await o.d.ctx.close();
  }
  {
    // two tabs on one profile: a history import in one, then Import, Erase and Put back in the other
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const base = await exportOf(d.page);
    const tab2 = await d.ctx.newPage(); const said2 = [];
    tab2.on('dialog', x => { said2.push(x.message()); x.accept().catch(() => {}); });
    await tab2.goto(d.page.url());
    await tab2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const H = JSON.parse(JSON.stringify(base)); H.log.push([H.log[2][0] + 11, 'aaaaaaaa', 1, 'quiz']);
    const G = JSON.parse(JSON.stringify(base)); G.log.push([G.log[2][0] + 13, 'bbbbbbbb', 1, 'quiz']);
    let rr = await choose(tab2, H, true);
    check(/1 history entry added|adds 1 history entry/.test(rr.plan + rr.result), 'the other tab imports a file that adds one history entry', rr.result.slice(0, 160));
    const [data0, log0] = await synced(d.page, tab2, [di.data, di.log], 'the other tab imported history');
    rr = await choose(d.page, G, true);
    check(!rr.offered && /saved by another tab or window/.test(rr.plan) && await stored(d.page, di.log) === log0 && log0.includes('aaaaaaaa'),
      'this tab, whose history the other tab has saved since, imports nothing: the other tab\'s entry stays in the history', rr.plan.slice(0, 260));
    const n0 = d.dialogs.length;
    await d.page.evaluate(() => show('settings'));
    await d.page.click('#btnReset');
    await d.page.waitForTimeout(400);
    const saidErase = d.dialogs.slice(n0).join(' | ');
    check(/nothing was erased/.test(saidErase) && !/History erased/.test(saidErase) && await stored(d.page, di.data) === data0 && await stored(d.page, di.log) === log0,
      'Erase in that tab erases nothing and says so, instead of "History erased."', saidErase.slice(0, 200));
    await d.ctx.close();
  }
  {
    // Put back in a tab another tab has saved over
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const tab2 = await d.ctx.newPage(); const said2 = [];
    tab2.on('dialog', x => { said2.push(x.message()); x.accept().catch(() => {}); });
    await tab2.goto(d.page.url());
    await tab2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const rr = await choose(d.page, later(await exportOf(d.page), 2), true);   // this tab replaces; a copy is kept
    const [data1, copies1] = await synced(tab2, d.page, [di.data, di.backup, di.log], 'this tab imported');
    await tab2.evaluate(() => { show('settings'); });
    await tab2.evaluate(() => restoreBackup());
    await tab2.waitForTimeout(300);
    // read in the tab that might have put back, and in this one
    check(/Imported/.test(rr.result) && said2.some(m => /nothing was put back/.test(m)) && await stored(tab2, di.data) === data1 && await stored(tab2, di.backup) === copies1 &&
          await stored(d.page, di.data) === data1 && await stored(d.page, di.backup) === copies1,
      'Put back in a tab another tab has saved over puts nothing back and says so', said2.join(' | ').slice(0, 200));
    await d.ctx.close();
  }

  console.log('\n=== Progress the browser refused to save in this visit ===');
  {
    const o = await own(3);
    await o.d.page.evaluate(() => {
      const real = Storage.prototype.setItem, key = keyFor(PROFILE);
      Storage.prototype.setItem = function(k, v){ if(k === key) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return real.call(this, k, v); };
    });
    await answer(o.d.page, 1, 3);     // held on the page only
    const rr = await choose(o.d.page, o.file, true);
    check(!rr.offered && /could not be saved in this visit/.test(rr.plan) && await stored(o.d.page, o.di.data) === o.data,
      'progress the browser refused to save: Import plans nothing and says what is stored is not what is shown', rr.plan.slice(0, 300));
    await o.d.ctx.close();
  }
  {
    // an answer still waiting to be saved when Import is tapped, and the browser refuses that save
    const o = await own(3);
    const g = later(o.file, 2);
    let rr = await choose(o.d.page, g, false);
    await o.d.page.evaluate(() => {
      DB.answers.push(Object.assign({}, DB.answers[2], {at: DB.answers[2].at + 1, qn: 4})); DB.qn = 4;
      saveTimer = setTimeout(() => {}, 1e6);   // the save waits, as for 150 ms after an answer
      const real = Storage.prototype.setItem, key = keyFor(PROFILE);
      Storage.prototype.setItem = function(k, v){ if(k === key) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return real.call(this, k, v); };
    });
    await o.d.page.click('#importGo');
    await o.d.page.waitForSelector('#importResult', {timeout: 5000}).catch(() => {});
    const res = (await o.d.page.evaluate(() => document.getElementById('importPlan').textContent)).replace(/\s+/g, ' ');
    const kept = await o.d.page.evaluate(() => ({n: DB.answers.length, failed: FAILED.has(keyFor(PROFILE))}));
    check(/refused to save/.test(res) && /kept on this page/.test(res) && kept.n === 4 && kept.failed && await stored(o.d.page, o.di.data) === o.data,
      'the waiting save refused: nothing is imported, the answer stays on the page, flagged as not saved', {res: res.slice(0, 200), kept});
    rr = await choose(o.d.page, g, false);
    check(!rr.offered && /could not be saved in this visit/.test(rr.plan), 'and Import plans nothing while it is not saved', rr.plan.slice(0, 200));
    await o.d.ctx.close();
  }

  console.log('\n=== Empty profiles with history, and history for a profile that holds the file ===');
  {
    // a profile with no progress whose answer history holds another record's entries (as a put-back leaves)
    const D = await device({[I.ns + ':profile']: 'TestUser', [I.ns + ':log:TestUser']: JSON.stringify(fileA.log)});
    const di = await info(D.page);
    const hereBefore = await stored(D.page, di.data), logBefore = await stored(D.page, di.log);
    const oc = await own(2); const fc = oc.file; await oc.d.ctx.close();
    let rr = await choose(D.page, fc, false);
    check(rr.offered && /no progress, but its answer history holds 3 history entries the file does not have/i.test(rr.plan) && /new profile/.test(rr.plan),
      'a profile with no progress but another record\'s history: the file goes into a new profile, so the two are not mixed', rr.plan.slice(0, 400));
    rr = await choose(D.page, fc, true);
    check(/now the profile/.test(rr.result) && await stored(D.page, di.log) === logBefore && await stored(D.page, di.data) === hereBefore,
      'confirmed, this profile and its history are as they were', rr.result.slice(0, 200));
    rr = await choose(D.page, fileA, false);
    check(rr.offered && /this profile has no progress yet/.test(rr.plan), 'the record those entries belong to replaces the empty profile', rr.plan.slice(0, 260));
    await D.ctx.close();
  }
  {
    // a profile with concept progress and no answers, of the file's own origin: the plan names the reason
    const here = blankDb(); here.created = fileA.db.created; here.concepts[C0] = rec(3, 1);
    const D = await device({[I.ns + ':profile']: 'TestUser', [I.ns + ':data:TestUser']: JSON.stringify(here)});
    const rr = await choose(D.page, fileA, false);
    check(rr.offered && /this profile has no answers but other progress/.test(rr.plan) && !/4,000/.test(rr.plan) && /new profile/.test(rr.plan),
      'no answers here but other progress, the same origin: a new profile, with that reason (not the 4,000-answer limit)', rr.plan.slice(0, 400));
    await D.ctx.close();
  }
  {
    // the file's progress is all in a profile made from it before; the file adds history entries to that profile
    const o = await own(3); const f1 = o.file;
    await answer(o.d.page, 1, 0);
    const dataNow = await stored(o.d.page, o.di.data);
    let rr = await choose(o.d.page, f1, true);
    const name = (rr.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const f2 = JSON.parse(JSON.stringify(f1));
    f2.log.push([f2.log[2][0] + 7, f2.log[0][1], 1, 'quiz']);
    const n0 = await profilesOn(o.d.page), x0 = JSON.parse(await stored(o.d.page, I.ns + ':log:' + name) || '[]').length;
    rr = await choose(o.d.page, f2, false);
    check(rr.offered && rr.plan.includes(`already in the profile "${name}"`) && /adds 1 history entry to that profile's answer history/.test(rr.plan),
      'a file whose progress is all in a profile here but which has one more history entry: the plan adds the entry to that profile', rr.plan.slice(0, 400));
    rr = await choose(o.d.page, f2, true);
    const x1 = JSON.parse(await stored(o.d.page, I.ns + ':log:' + name) || '[]');
    check(x1.length === x0 + 1 && await profilesOn(o.d.page) === n0 && await stored(o.d.page, o.di.data) === dataNow,
      'confirmed, that profile\'s history gains the entry; no profile is made, and this profile is as it was', rr.result.slice(0, 200));
    rr = await choose(o.d.page, f2, true);
    check(!rr.offered && rr.plan.includes(`already in the profile "${name}"`) && await profilesOn(o.d.page) === n0, 'that file again changes nothing', rr.plan.slice(0, 200));
    await o.d.ctx.close();
  }

  console.log('\n=== Put back, with a write refused at each step ===');
  {
    const o = await own(3);
    const P3 = o.data;
    let rr = await choose(o.d.page, later(o.file, 2), true);
    const P5 = await stored(o.d.page, o.di.data);
    const copies = async () => asList(JSON.parse(await stored(o.d.page, o.di.backup) || '[]')).map(c => c.data);
    check(JSON.parse(P5).answers.length === 5 && JSON.stringify(await copies()) === JSON.stringify([P3]), 'set up: the progress has 5 answers, and the 3-answer progress is the one copy');
    // refuse the n-th write of a key containing sub; several [sub, n] pairs refuse several writes
    const refuseNth = (...rules) => o.d.page.evaluate(rules => {
      window.__rn = rules.map(([sub, n]) => ({sub, n, seen: 0}));
      if(window.__wrappedN) return; window.__wrappedN = true;
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        let refuse = false;
        for(const r of window.__rn || []) if(k.includes(r.sub) && ++r.seen === r.n) refuse = true;
        if(refuse) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        return real.call(this, k, v);
      };
    }, rules);
    const putBack = async () => {
      const n0 = o.d.dialogs.length;
      await o.d.page.evaluate(() => show('settings'));
      await o.d.page.click('#btnRestore');
      await o.d.page.waitForTimeout(400);
      await o.d.page.evaluate(() => { window.__rn = null; });
      return o.d.dialogs.slice(n0).join(' | ');
    };
    // (1) the progress on screen cannot be added to the copies
    await refuseNth([':backup:', 1]);
    let said = await putBack();
    check(/nothing was put back/.test(said) && await stored(o.d.page, o.di.data) === P5 && JSON.stringify(await copies()) === JSON.stringify([P3]),
      'step 1 refused (the copy of the progress on screen): nothing changes, and the page says so', said.slice(0, 200));
    // (2) the copy cannot be written as the progress
    await refuseNth([':data:', 1]);
    said = await putBack();
    check(/nothing was put back/.test(said) && await stored(o.d.page, o.di.data) === P5 && (await copies()).includes(P3),
      'step 2 refused (the copy written as the progress): the progress is as it was, and the 3-answer copy is still kept', said.slice(0, 200));
    await reload(o.d.page);
    check(await nAns(o.d.page) === 5, 'after a reload the progress still has 5 answers');
    // (3) the copy put back cannot be taken off the list
    await refuseNth([':backup:', 2]);
    said = await putBack();
    const c3 = await copies();
    check(/is back/.test(said) && /still on the list/.test(said) && await stored(o.d.page, o.di.data) === P3 && c3.includes(P5) && c3.includes(P3),
      'step 3 refused (the list updated): the 3-answer progress is back, the 5-answer progress is kept as a copy, and the page says the list kept both', said.slice(0, 260));
    await reload(o.d.page);
    check(await nAns(o.d.page) === 3 && (await copies()).includes(P5), 'after a reload: 3 answers, and the 5-answer copy is kept');
    // with nothing refused: the newest copy (the 5-answer progress) comes back, the 3-answer progress is kept
    said = await putBack();
    check(/is back/.test(said) && !/still on the list/.test(said) && await stored(o.d.page, o.di.data) === P5 && (await copies()).includes(P3),
      'with nothing refused: the newest copy is back, and the progress it replaced is kept as a copy', said.slice(0, 200));
    // (2) refused, and putting the list back as it was refused too
    await refuseNth([':data:', 1], [':backup:', 2]);
    said = await putBack();
    const c2 = await copies();
    check(/nothing was put back/.test(said) && /also hold a copy/.test(said) && await stored(o.d.page, o.di.data) === P5 && c2.includes(P3) && c2.includes(P5),
      'step 2 refused and the list not put back: the progress is as it was, both records are kept, and the page says the list holds the extra copy', said.slice(0, 300));
    // the extra copy is the newest: putting it back writes the same progress again, and the 3-answer copy is still listed
    said = await putBack();
    check(/is back/.test(said) && await stored(o.d.page, o.di.data) === P5 && (await copies()).includes(P3),
      'putting back the extra copy leaves the progress as it was, and the 3-answer copy kept', said.slice(0, 200));
    // the copies are deleted only when the student asks
    await o.d.page.evaluate(() => show('settings'));
    check(!!(await o.d.page.$('#btnDeleteCopies')), 'Settings offers to delete the copies kept by Import');
    await o.d.page.click('#btnDeleteCopies');
    await o.d.page.waitForTimeout(300);
    check(await stored(o.d.page, o.di.backup) === null && await stored(o.d.page, o.di.data) === P5, 'asked and confirmed, the copies are deleted, and the progress is as it was');
    await o.d.ctx.close();
  }

  console.log('\n=== Refused reads and writes ===');
  {
    // the progress could not be read in this visit
    const D = await device({[I.ns + ':profile']: 'TestUser', [I.ns + ':data:TestUser']: '{not json', [I.ns + ':log:TestUser']: '[]'});
    const f = path.join(TMP, 'refused.json'); fs.writeFileSync(f, JSON.stringify(fileB3));
    await D.page.evaluate(() => show('settings'));
    await D.page.setInputFiles('#fileIn', f);
    await D.page.waitForTimeout(500);
    check(D.dialogs.some(d => /could not be loaded/.test(d) && /The file was not imported/.test(d)) && await stored(D.page, I.ns + ':data:TestUser') === '{not json',
      'a progress that could not be read: Import says the file was not imported, and the stored value is as it was', JSON.stringify(D.dialogs));
    await D.ctx.close();
    // the history could not be read
    const E = await device();
    const ei = await info(E.page);
    await answer(E.page, 3, 0);
    // a file that continues E's record, with one answer and one history entry more
    const ownE = await exportOf(E.page);
    ownE.db.answers.push(Object.assign({}, ownE.db.answers[0], {at: ownE.db.answers[2].at + 5000, qn: 4}));
    ownE.log.push([ownE.log[2][0] + 5, ownE.log[0][1], 1, 'quiz']);
    const eData = await stored(E.page, ei.data);
    await E.page.evaluate(k => localStorage.setItem(k, 'garbled history'), ei.log);
    await reload(E.page);
    r = await choose(E.page, ownE, true);
    check(/history saved on this device could not be read/.test(r.plan) && !r.offered && await stored(E.page, ei.log) === 'garbled history' && await stored(E.page, ei.data) === eData,
      'a history that could not be read: nothing is imported, and both stored values are as they were', r.plan.slice(0, 200));
    await E.ctx.close();
  }
  {
    // writes refused: the progress, the backup, the history
    const refuse = (p, which) => p.evaluate(which => {
      window.__refuse = which;
      if(window.__wrapped) return; window.__wrapped = true;
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        if(window.__refuse && k.includes(window.__refuse)) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        return real.call(this, k, v);
      };
    }, which);
    for(const [which, label] of [[':data:', 'the progress'], [':backup:', 'the backup']]){
      const F = await device();
      const fi = await info(F.page);
      await answer(F.page, 3, 0);
      const before = await allKeys(F.page), n = await nAns(F.page), logN = await F.page.evaluate(() => LOG.length);
      // a file that continues this record: fileB3 holds A's first three answers, not F's, so build one from F's own export
      const own = await exportOf(F.page);
      const more = JSON.parse(JSON.stringify(own));
      more.db.answers.push(Object.assign({}, more.db.answers[0], {at: more.db.answers[2].at + 5000, qn: 4}));
      more.log.push([more.log[2][0] + 5, more.log[0][1], 1, 'quiz']);
      await refuse(F.page, which);
      r = await choose(F.page, more, true);
      await refuse(F.page, null);
      check(/refused to save/.test(r.result) && /nothing was imported/.test(r.result), `${label} write refused: Import says nothing was imported`, r.result.slice(0, 220));
      const after = await allKeys(F.page);
      // a refused progress write takes back the copy written just before it
      const changed = Object.keys(after).filter(k => after[k] !== before[k]).concat(Object.keys(before).filter(k => !(k in after)));
      check(!changed.length, 'the stored progress, history and copies are as they were (no copy left behind)', changed.join(', '));
      check(await nAns(F.page) === n && (await F.page.evaluate(() => LOG.length)) === logN, 'the progress and history on screen are as they were');
      // the refused write left no copy for this visit: a profile switch and back loads what is stored
      await F.page.evaluate(p => { useProfile('someone else'); useProfile(p); }, fi.profile);
      check(await nAns(F.page) === n, 'a switch to another profile and back shows the same progress, not the file\'s', await nAns(F.page));
      await reload(F.page);
      check(await nAns(F.page) === n, 'and after a reload');
      await F.ctx.close();
    }
    // the history write refused on a replace: the progress is imported, the history here is unchanged and does not shrink
    const G = await device();
    const gi = await info(G.page);
    await answer(G.page, 3, 0);
    const own = await exportOf(G.page);
    const more = JSON.parse(JSON.stringify(own));
    more.db.answers.push(Object.assign({}, more.db.answers[0], {at: more.db.answers[2].at + 5000, qn: 4}));
    more.log.push([more.log[2][0] + 5, more.log[0][1], 1, 'quiz']);
    const logBefore = await stored(G.page, gi.log);
    await refuse(G.page, ':log:');
    r = await choose(G.page, more, true);
    await refuse(G.page, null);
    check(/Imported/.test(r.result) && /refused to save .*answer history/.test(r.result) && await nAns(G.page) === 4,
      'the history write refused: the progress is imported (4 answers) and the page says the history was not added', r.result.slice(0, 300));
    check(await stored(G.page, gi.log) === logBefore && (await G.page.evaluate(() => LOG.length)) === 3, 'the stored history is as it was, and the history in memory keeps its 3 entries');
    r = await choose(G.page, more, true);
    check(/adds 1 history entry/.test(r.plan) && (await G.page.evaluate(() => LOG.length)) === 4, 'importing the file again adds the entry', r.plan.slice(0, 200));
    await G.ctx.close();
    // a new profile whose history write is refused is not made at all
    const H = await device();
    const hi = await info(H.page);
    await answer(H.page, 2, 0);
    const before = await allKeys(H.page);
    await refuse(H.page, ':log:');
    r = await choose(H.page, fileB3, true);
    await refuse(H.page, null);
    const after = await allKeys(H.page);
    check(/refused to save/.test(r.result) && JSON.stringify(after) === JSON.stringify(before), 'a new profile whose history cannot be saved is not made: every stored key is as it was',
      {result: r.result.slice(0, 160), changed: Object.keys(after).filter(k => after[k] !== before[k])});
    void hi;
    await H.ctx.close();
  }

  // a second tab of d's browser, on the drill
  const secondTab = async d => {
    const t = await d.ctx.newPage();
    t.on('dialog', x => x.accept().catch(() => {}));
    await t.goto(d.page.url());
    await t.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    return t;
  };
  // in page p, the browser refuses every write of the key k (null: none), as a full storage does;
  // with once, only the next write of k
  const refuseKey = (p, k, once) => p.evaluate(([k, once]) => {
    window.__refuseKey = k; window.__refuseOnce = !!once;
    if(window.__refuseWrapped) return; window.__refuseWrapped = true;
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, v){
      if(window.__refuseKey !== null && key === window.__refuseKey){
        if(window.__refuseOnce) window.__refuseKey = null;
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      }
      return real.call(this, key, v);
    };
  }, [k, once]);
  // in page p, save()'s 150 ms timer never fires on its own (its delay made an hour, as in
  // storage_test.js), so a waiting save reaches storage only through the code under test
  const holdTimer = p => p.evaluate(() => {
    const real = window.setTimeout; window.__held = 0;
    window.setTimeout = function(f, d, ...a){ if(d === 150) window.__held++; return real.call(this, f, d === 150 ? 3600000 : d, ...a); };
  });

  console.log('\n=== A save waiting when the page goes, with another tab (with #39\'s saveNow) ===');
  for(const how of ['hidden', 'pagehide']){
    // #39 writes a save still waiting on its timer when the page is hidden or closed (saveNow);
    // here that write must not put this page's older copy over another tab's newer save
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const tab2 = await secondTab(d);
    await synced(tab2, d.page, [di.data, di.log], 'this tab answered');
    // the other tab changes a setting and saves it (no answer, so the history is unchanged)
    await tab2.evaluate(() => { DB.settings.goal = 99; save(); saveNow(); });
    const [theirs] = await synced(d.page, tab2, [di.data, di.log], 'the other tab saved a setting');
    await holdTimer(d.page);
    // this tab: an answer, its save waiting on the timer, then the page goes, in one task
    const r = await d.page.evaluate(how => {
      record(QUESTIONS[3], 'correct', undefined, 1000);
      const waiting = !!saveTimer && window.__held > 0;
      if(how === 'hidden'){
        Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'});
        document.dispatchEvent(new Event('visibilitychange'));
      } else window.dispatchEvent(new Event('pagehide'));
      return {waiting, timer: !!saveTimer, warned: !!document.getElementById('stalewarn')};
    }, how);
    check(r.waiting && !r.timer && r.warned && await stored(d.page, di.data) === theirs && await stored(tab2, di.data) === theirs,
      `the page ${how === 'hidden' ? 'hidden' : 'closed (pagehide)'} within 150 ms of an answer, after another tab saved: the other tab's save stays, and this page says why`,
      Object.assign({same: await stored(d.page, di.data) === theirs}, r));
    await d.ctx.close();
  }

  console.log('\n=== Review of 7dbc054: a new profile\'s name, Put back with a waiting save, a refused save ===');
  // 1. A plan shown here names a new profile; another tab saves a profile of that name before
  //    the click. Confirming must not write over it, also when the history write is refused.
  for(const refuseLog of [false, true]){
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 3, 0);                   // this device's own answers: fileA goes into a new profile
    const rr = await choose(d.page, fileA, false);
    const name = (rr.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const dk = di.ns + ':data:' + name, lk = di.ns + ':log:' + name;
    const tab2 = await secondTab(d);
    await tab2.evaluate(n => useProfile(n), name);
    await answer(tab2, 2, 5);                     // the other tab's own progress and history under that name
    const [hisData, hisLog] = await synced(d.page, tab2, [dk, lk], 'the other tab saved a profile of that name');
    const mine = await stored(d.page, di.data), myLog = await stored(d.page, di.log), nProf = await profilesOn(d.page);
    if(refuseLog) await refuseKey(d.page, lk);
    await d.page.click('#importGo');
    await d.page.waitForSelector('#importResult', {timeout: 5000}).catch(() => {});
    const res = (await d.page.evaluate(() => (document.getElementById('importPlan') || {}).textContent || '')).replace(/\s+/g, ' ');
    if(refuseLog) await refuseKey(d.page, null);
    check(rr.offered && !!name && !!hisData && await stored(d.page, dk) === hisData && await stored(d.page, lk) === hisLog &&
          await stored(tab2, dk) === hisData && await stored(tab2, lk) === hisLog &&
          await stored(d.page, di.data) === mine && await stored(d.page, di.log) === myLog && await profilesOn(d.page) === nProf && /nothing was imported/.test(res),
      `a new profile's name taken by another tab after the plan was shown${refuseLog ? ', and the history write refused' : ''}: confirming writes nothing, that profile and this one are as they were, and the page says why`,
      {name, res: res.slice(0, 200), dataSame: await stored(d.page, dk) === hisData, logSame: await stored(d.page, lk) === hisLog});
    await d.ctx.close();
  }
  // 2. Put back while an answer waits on its timer: the copy of the progress on screen holds it.
  for(const refuseFlush of [false, true]){
    const o = await own(3);
    await choose(o.d.page, later(o.file, 2), true);          // replaces: a copy of the 3-answer progress is kept
    const P5 = await stored(o.d.page, o.di.data), copies0 = await stored(o.d.page, o.di.backup);
    await holdTimer(o.d.page);
    // only the waiting change's save is refused, so a Put back that carried on after it would
    // succeed at step (2) and be seen below
    if(refuseFlush) await refuseKey(o.d.page, o.di.data, true);
    const r = await o.d.page.evaluate(() => {
      record(QUESTIONS[5], 'correct', undefined, 1000);
      const a = DB.answers[DB.answers.length - 1];
      const waiting = !!saveTimer && window.__held > 0, n = DB.answers.length;
      show('settings'); restoreBackup();
      return {waiting, n, key: a.qid + '|' + a.at, nowN: DB.answers.length};
    });
    if(refuseFlush) await refuseKey(o.d.page, null);
    const list = asList(JSON.parse(await stored(o.d.page, o.di.backup) || '[]'));
    const inCopies = list.some(c => { try { return JSON.parse(c.data).answers.some(a => a.qid + '|' + a.at === r.key); } catch(e){ return false; } });
    if(!refuseFlush)
      check(r.waiting && r.n === 6 && inCopies && JSON.parse(await stored(o.d.page, o.di.data)).answers.length === 3,
        'Put back while an answer waits on its 150 ms timer: the 3-answer progress is back, and the kept copy of the progress that was on screen holds the waiting answer (6 answers)',
        {waiting: r.waiting, n: r.n, inCopies, copies: list.map(c => { try { return JSON.parse(c.data).answers.length; } catch(e){ return '?'; } })});
    else
      check(r.waiting && r.nowN === 6 && await stored(o.d.page, o.di.data) === P5 && await stored(o.d.page, o.di.backup) === copies0 &&
            await o.d.page.evaluate(k => FAILED.has(k), o.di.data),
        'Put back while an answer waits and its save is refused: nothing is put back, the stored progress and copies are as they were, and the answer stays on the page, flagged as unsaved',
        {nowN: r.nowN, sameData: await stored(o.d.page, o.di.data) === P5, sameCopies: await stored(o.d.page, o.di.backup) === copies0});
    await o.d.ctx.close();
  }
  {
    // 2b. another tab saves while Put back's question is on screen: nothing is put back
    const o = await own(3);
    await choose(o.d.page, later(o.file, 2), true);
    const copies0 = await stored(o.d.page, o.di.backup);
    const r = await o.d.page.evaluate(() => {
      // the other tab's save, made while the question is open (written past this page's store)
      const other = JSON.stringify(Object.assign({}, DB, {settings: Object.assign({}, DB.settings, {goal: 77})}));
      window.confirm = () => { localStorage.setItem(keyFor(PROFILE), other); return true; };
      show('settings'); restoreBackup();
      return other;
    });
    check(await stored(o.d.page, o.di.data) === r && await stored(o.d.page, o.di.backup) === copies0,
      'another tab saves while Put back asks for confirmation: nothing is put back, and that tab\'s progress and the copies are as they were');
    await o.d.ctx.close();
  }
  // 3. A refused save must not hide a later save by another tab.
  {
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const tab2 = await secondTab(d);
    await synced(tab2, d.page, [di.data, di.log], 'this tab answered');
    await refuseKey(d.page, di.data);
    await d.page.evaluate(() => { DB.settings.goal = 10; save(); saveNow(); });      // this tab's write refused
    const failed = await d.page.evaluate(k => FAILED.has(k), di.data);
    await tab2.evaluate(() => { DB.settings.goal = 99; save(); saveNow(); });        // the other tab saves a setting
    const [theirs] = await synced(d.page, tab2, [di.data, di.log], 'the other tab saved a setting');
    await refuseKey(d.page, null);                                                    // storage writable again here
    await d.page.evaluate(() => { DB.settings.goal = 11; save(); saveNow(); });      // this tab saves again
    check(failed && await stored(d.page, di.data) === theirs && await stored(tab2, di.data) === theirs &&
          JSON.parse(theirs).settings.goal === 99 && await d.page.evaluate(() => !!document.getElementById('stalewarn')),
      'a save refused in this tab, then another tab saves: this tab\'s next save writes nothing over it, and says why',
      {failed, goal: JSON.parse(await stored(d.page, di.data) || '{}').settings});
    await d.ctx.close();
  }
  {
    // 3b. one tab alone: its refused save is written by the next save, with no "another tab" notice
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 2, 0);
    await refuseKey(d.page, di.data);
    await d.page.evaluate(() => { DB.settings.goal = 10; save(); saveNow(); });
    const failed = await d.page.evaluate(k => FAILED.has(k), di.data);
    await refuseKey(d.page, null);
    await d.page.evaluate(() => { DB.settings.goal = 11; save(); saveNow(); });
    const got = JSON.parse(await stored(d.page, di.data));
    check(failed && got.settings.goal === 11 && got.answers.length === 2 && !(await d.page.evaluate(() => !!document.getElementById('stalewarn') || FAILED.size > 0)),
      'one tab alone: after a refused save, its next save writes the progress, with no "another tab" notice', {failed, goal: got.settings.goal});
    await d.ctx.close();
  }

  console.log('\n=== Review of 2bc1e07: a refused save and the profile opened again; questions left open ===');
  for(const other of [false, true]){
    // M1: a refused save, then the profile opened again (Switch to the same name), then storage
    // works: one tab alone writes its progress with no notice; with another tab's save in
    // between, that save stays
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const tab2 = other ? await secondTab(d) : null;
    if(tab2) await synced(tab2, d.page, [di.data, di.log], 'this tab answered');
    await refuseKey(d.page, di.data);
    await d.page.evaluate(() => { DB.settings.goal = 10; save(); saveNow(); });             // refused
    const failed = await d.page.evaluate(k => FAILED.has(k), di.data);
    let theirs = null;
    if(tab2){ await tab2.evaluate(() => { DB.settings.goal = 99; save(); saveNow(); }); [theirs] = await synced(d.page, tab2, [di.data, di.log], 'the other tab saved a setting'); }
    await d.page.evaluate(() => useProfile(PROFILE));                                       // opened again
    await refuseKey(d.page, null);
    await d.page.evaluate(() => { DB.settings.goal = 11; save(); saveNow(); });
    const got = JSON.parse(await stored(d.page, di.data)), warned = await d.page.evaluate(() => !!document.getElementById('stalewarn'));
    if(!other)
      check(failed && got.settings.goal === 11 && got.answers.length === 3 && !warned,
        'one tab alone: a refused save, the profile opened again, storage working again: the next save writes the progress, with no "another tab" notice',
        {failed, goal: got.settings.goal, warned});
    else
      check(failed && await stored(d.page, di.data) === theirs && got.settings.goal === 99 && warned,
        'a refused save, another tab saves, the profile opened again here: this tab\'s next save writes nothing over the other tab\'s, and says why',
        {failed, goal: got.settings.goal, warned});
    await d.ctx.close();
  }
  {
    // M2: another tab replaces the progress (an import, adding a copy) while "Delete the copies"
    // asks here: nothing is deleted
    const o = await own(3);
    await choose(o.d.page, later(o.file, 2), true);                     // one copy kept
    const r = await o.d.page.evaluate(() => {
      const list = JSON.parse(localStorage.getItem(backupKey(PROFILE)));
      const other = JSON.stringify(Object.assign({}, DB, {settings: Object.assign({}, DB.settings, {goal: 55})}));
      const more = JSON.stringify(list.concat([{at: Date.now(), data: localStorage.getItem(keyFor(PROFILE)), why: 'import'}]));
      window.confirm = () => { localStorage.setItem(backupKey(PROFILE), more); localStorage.setItem(keyFor(PROFILE), other); return true; };
      show('settings'); deleteCopies();
      return {other, more};
    });
    check(await stored(o.d.page, o.di.backup) === r.more && await stored(o.d.page, o.di.data) === r.other,
      '"Delete the copies" while another tab imports (a second copy added): nothing is deleted, and both copies are kept');
    await o.d.ctx.close();
  }
  {
    // another tab only deletes the copies while Put back asks here: nothing is put back, and the
    // other tab's delete stands
    const o = await own(3);
    await choose(o.d.page, later(o.file, 2), true);
    const P5 = await stored(o.d.page, o.di.data);
    await o.d.page.evaluate(() => {
      window.confirm = () => { localStorage.removeItem(backupKey(PROFILE)); return true; };
      show('settings'); restoreBackup();
    });
    check(await stored(o.d.page, o.di.data) === P5 && await stored(o.d.page, o.di.backup) === null,
      'Put back while another tab deletes the copies: nothing is put back, and the copies stay deleted');
    await o.d.ctx.close();
  }
  {
    // Erase while another tab saves: nothing is erased, and the page does not say it was
    const o = await own(3);
    const n0 = o.d.dialogs.length;
    const other = await o.d.page.evaluate(() => {
      const other = JSON.stringify(Object.assign({}, DB, {settings: Object.assign({}, DB.settings, {goal: 66})}));
      window.confirm = () => { localStorage.setItem(keyFor(PROFILE), other); return true; };
      show('settings'); document.getElementById('btnReset').click();
      return other;
    });
    await o.d.page.waitForTimeout(400);
    const said = o.d.dialogs.slice(n0).join(' | ');
    check(await stored(o.d.page, o.di.data) === other && /nothing was erased/.test(said) && !/History erased/.test(said) && await nAns(o.d.page) === 3,
      'Erase while another tab saves during its question: nothing is erased, the page says so, and the progress on screen stays', said.slice(0, 200));
    await o.d.ctx.close();
  }
  {
    // a new profile's name whose history (not its progress) another tab saved: the plan names a
    // free name, and at the click a name with only a history counts as taken too
    const d = await device(); const di = await info(d.page);
    await answer(d.page, 3, 0);
    let rr = await choose(d.page, fileA, false);
    const name = (rr.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const lk = di.ns + ':log:' + name, dk = di.ns + ':data:' + name;
    await d.page.evaluate(([lk]) => localStorage.setItem(lk, JSON.stringify([[1, 'abcdef01', 1, 'quiz']])), [lk]);
    rr = await choose(d.page, fileA, false);
    const name2 = (rr.plan.match(/new profile, "([^"]+)"/) || [])[1];
    check(!!name2 && name2 !== name && await stored(d.page, dk) === null, 'a name with only a saved history is taken: the plan names another', {name, name2});
    // the other way round: the plan shown first, then another tab writes that name's history
    // only (its progress waits on its timer); the click imports nothing
    await d.page.evaluate(([lk]) => localStorage.removeItem(lk), [lk]);
    rr = await choose(d.page, fileA, false);
    const name3 = (rr.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const tab2 = await secondTab(d);
    await holdTimer(tab2);
    await tab2.evaluate(n => { useProfile(n); record(QUESTIONS[2], 'correct', undefined, 1000); }, name3);
    const lk3 = di.ns + ':log:' + name3, dk3 = di.ns + ':data:' + name3;
    const [hisLog] = await synced(d.page, tab2, [lk3], 'the other tab saved that name\'s history');
    await d.page.click('#importGo');
    await d.page.waitForSelector('#importResult', {timeout: 5000}).catch(() => {});
    const res = (await d.page.evaluate(() => (document.getElementById('importPlan') || {}).textContent || '')).replace(/\s+/g, ' ');
    check(name3 === name && !!hisLog && await stored(d.page, lk3) === hisLog && await stored(d.page, dk3) === null && /nothing was imported/.test(res),
      'a new profile\'s name whose history another tab saved after the plan was shown: confirming writes nothing, and that history is as it was', {name3, res: res.slice(0, 160)});
    await d.ctx.close();
  }

  console.log('\n=== Review of 1e6c1d1: copies another tab deleted; a write Import or Put back had kept, then a refused save ===');
  // O1: this tab imported, so it wrote the copies itself; another tab then deletes them. Two
  // devices, so that each case starts with this page still holding its own copy of the deleted key
  const deletedElsewhere = async () => {
    const o = await own(3);
    await choose(o.d.page, later(o.file, 2), true);                     // one copy kept, written by this tab
    const P5 = await stored(o.d.page, o.di.data);
    const tab2 = await secondTab(o.d);
    await tab2.evaluate(() => localStorage.removeItem(backupKey(PROFILE)));
    await synced(o.d.page, tab2, [o.di.backup], 'the other tab deleted the copies');
    return {o, P5, f5: await exportOf(o.d.page)};
  };
  {
    // this tab neither offers nor puts back the deleted copy, and a later import does not write it back
    const {o, P5, f5} = await deletedElsewhere();
    const shown = await o.d.page.evaluate(() => { show('settings'); return !!document.getElementById('btnRestore'); });
    const n0 = o.d.dialogs.length;
    await o.d.page.evaluate(() => restoreBackup());
    const said = o.d.dialogs.slice(n0).join(' | ');
    check(!shown && await stored(o.d.page, o.di.data) === P5 && await stored(o.d.page, o.di.backup) === null && /no copy to put back/.test(said),
      'copies another tab deleted: Settings offers no Put back, and Put back puts nothing back and writes no copy', {shown, said: said.slice(0, 120)});
    const r = await choose(o.d.page, later(f5, 2), true);
    const list = JSON.parse(await stored(o.d.page, o.di.backup) || '[]');
    check(/Imported:/.test(r.result) && list.length === 1 && list[0].data === P5,
      'then an import that is kept: one copy, of the progress it replaced; the deleted copy is not written back', {n: list.length, result: r.result.slice(0, 120)});
    await o.d.ctx.close();
  }
  {
    // an import whose progress write is refused: the copy written for it is taken off again, and
    // the list is left as the other tab left it (deleted), not as this page last wrote it
    const {o, P5, f5} = await deletedElsewhere();
    await refuseKey(o.d.page, o.di.data);
    const r = await choose(o.d.page, later(f5, 2), true);
    await refuseKey(o.d.page, null);
    check(/nothing was imported/.test(r.result) && await stored(o.d.page, o.di.data) === P5 && await stored(o.d.page, o.di.backup) === null,
      'copies another tab deleted, then an import whose progress write is refused: nothing is imported, and the deleted copies are not written back', r.result.slice(0, 160));
    await o.d.ctx.close();
  }
  for(const how of ['an Import', 'a Put back']){
    // O2: what Import or Put back had the browser keep (trySet) is what is stored; a refused save
    // after it, the profile opened again, storage working again: the next save writes, no notice
    const o = await own(3);
    await choose(o.d.page, later(o.file, 2), true);
    // a save between the import and the Put back, so the progress Put back writes is a value
    // this page's KEPT no longer holds (only Put back's own write can make it what is stored)
    if(how === 'a Put back') await o.d.page.evaluate(() => { DB.settings.goal = 7; save(); saveNow(); show('settings'); restoreBackup(); });
    const back = how !== 'a Put back' || await nAns(o.d.page) === 3;
    await refuseKey(o.d.page, o.di.data);
    await o.d.page.evaluate(() => { DB.settings.goal = 10; save(); saveNow(); });             // refused
    const failed = await o.d.page.evaluate(k => FAILED.has(k), o.di.data);
    await o.d.page.evaluate(() => useProfile(PROFILE));                                       // opened again
    await refuseKey(o.d.page, null);
    await o.d.page.evaluate(() => { DB.settings.goal = 11; save(); saveNow(); });
    const got = JSON.parse(await stored(o.d.page, o.di.data)), warned = await o.d.page.evaluate(() => !!document.getElementById('stalewarn'));
    check(back && failed && got.settings.goal === 11 && !warned,
      `after ${how}, a refused save, the profile opened again, storage working again: the next save writes, with no "another tab" notice`,
      {back, failed, goal: got.settings.goal, warned});
    await o.d.ctx.close();
  }

  console.log('\n=== Two tabs at once: another tab\'s save not yet passed to this tab (no synchronising before the action) ===');
  // The browser passes one tab's save to another tab a moment later, with no locking (the HTML
  // Standard). lagView freezes page p's view of keys ks as they are now, so another tab's later
  // save has not reached p while p acts; p's own writes still show in its view, as in a browser.
  // Nothing waits for the two tabs to agree between the other tab's save and p's action.
  const lagView = (p, ks) => p.evaluate(ks => {
    const P = Storage.prototype, get = P.getItem, set = P.setItem, rem = P.removeItem;
    window.__lag = new Map(ks.map(k => [k, get.call(localStorage, k)]));
    if(window.__lagWrapped) return; window.__lagWrapped = true;
    P.getItem = function(k){ return this === localStorage && window.__lag && window.__lag.has(k) ? window.__lag.get(k) : get.call(this, k); };
    P.setItem = function(k, v){ const r = set.call(this, k, v); if(this === localStorage && window.__lag && window.__lag.has(k)) window.__lag.set(k, String(v)); return r; };
    P.removeItem = function(k){ const r = rem.call(this, k); if(this === localStorage && window.__lag && window.__lag.has(k)) window.__lag.set(k, null); return r; };
  }, ks);
  const unlag = p => p.evaluate(() => { window.__lag = null; });
  // choose a file and press Import from script: a stopped page covers its buttons, and the
  // check is that its writes are refused even when the button is reached
  const chooseJS = async (p, obj) => {
    const f = path.join(TMP, `f${++nfile}.json`);
    fs.writeFileSync(f, JSON.stringify(obj));
    await p.evaluate(() => show('settings'));
    await p.setInputFiles('#fileIn', f);
    await p.waitForFunction(() => { const b = document.getElementById('importPlan'); return b && b.textContent.trim(); }, null, {timeout: 5000}).catch(() => {});
    await p.evaluate(() => { const g = document.getElementById('importGo'); if(g) g.click(); });
    await p.waitForSelector('#importResult', {timeout: 3000}).catch(() => {});
    return (await p.evaluate(() => { const b = document.getElementById('importPlan'); return b ? b.textContent : ''; })).replace(/\s+/g, ' ').trim();
  };
  // a real answer through the page's own path (record, then the save the page would make)
  // the answer's time, or null when the page took no answer (a read-only page)
  const answerHere = (p, i) => p.evaluate(i => { const n = DB.answers.length; record(QUESTIONS[i % QUESTIONS.length], 'correct', undefined, 1000); saveNow(); return DB.answers.length > n ? DB.answers[DB.answers.length - 1].at : null; }, i);
  // the answer at `at` is in the stored progress or in a copy Import or Put back kept
  const keptSomewhere = async (p, di, at) => {
    const prog = JSON.parse(await stored(p, di.data) || '{"answers":[]}');
    const copies = JSON.parse(await stored(p, di.backup) || '[]');
    const has = db => (db.answers || []).some(a => a.at === at);
    return has(prog) || copies.some(c => { try { return has(JSON.parse(c.data)); } catch(e){ return false; } });
  };
  for(const order of ['the importing tab opened second', 'the importing tab opened first']){
    for(const act of ['Import', 'an ordinary save', 'Put back']){
      // one tab answers and saves; the other tab, which has not yet received that save, acts
      const d = await device(undefined, true); const di = await info(d.page);
      await answer(d.page, 3, 0);
      const file = await exportOf(d.page);
      if(act === 'Put back') await choose(d.page, later(file, 2), true);      // a copy to put back
      const t2 = await secondTab(d);
      await synced(t2, d.page, [di.data, di.log, di.backup], 'starting conditions');
      const [actor, other] = order === 'the importing tab opened second' ? [t2, d.page] : [d.page, t2];
      await lagView(actor, [di.data, di.log, di.backup]);
      const at = await answerHere(other, 7);                                   // the other tab's answer
      const otherSaved = at !== null && await keptSomewhere(other, di, at);
      // whichever of the two tabs is read-only takes no answer at all
      const ro = await other.evaluate(() => typeof WRITER !== 'undefined' && WRITER === 'other');   // code before the lock: no WRITER
      check(ro ? at === null : otherSaved, `${order}, ${act}: the other tab ${ro ? 'is read-only and takes no answer' : 'is the writer and its answer is stored'}`, {ro, at, otherSaved});
      if(act === 'Import') await chooseJS(actor, later(file, 2));
      else if(act === 'an ordinary save') await answerHere(actor, 9);
      else await actor.evaluate(() => { show('settings'); restoreBackup(); });
      await unlag(actor);
      await actor.waitForTimeout(300);
      const kept = !otherSaved || await keptSomewhere(other, di, at);
      check(kept, `${order}, ${act} there while another tab's answer has not reached it: that answer is still in the stored progress or a kept copy`,
        {otherSaved, at});
      await d.ctx.close();
    }
  }
  {
    // Delete the copies in a tab that has not yet received another tab's import (which kept a copy)
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const file = await exportOf(d.page);
    await choose(d.page, later(file, 2), true);                             // copy 1
    const t2 = await secondTab(d);
    await synced(t2, d.page, [di.data, di.log, di.backup], 'starting conditions');
    for(const [actor, other] of [[t2, d.page], [d.page, t2]]){
      await lagView(actor, [di.data, di.log, di.backup]);
      const r = {result: await chooseJS(other, later(await exportOf(d.page), 2))};   // the other tab's import: one more copy, if it may
      const before = JSON.parse(await stored(other, di.backup) || '[]').length;
      await actor.evaluate(() => { show('settings'); deleteCopies(); });
      await unlag(actor);
      await actor.waitForTimeout(300);
      const after = JSON.parse(await stored(other, di.backup) || '[]').length;
      const imported = /Imported:/.test(r.result);
      check(!imported || after === before, `Delete the copies in a tab another tab's import has not yet reached: a copy that import kept is not deleted`, {imported, before, after, result: r.result.slice(0, 80)});
      await synced(actor, other, [di.data, di.log, di.backup], 'the two tabs agree again');
    }
    await d.ctx.close();
  }

  console.log('\n=== One writer per profile: a second tab, the hand-over, a take-over, another profile ===');
  const wall = p => p.evaluate(() => { const w = document.getElementById('stopwall') || document.getElementById('stalewarn'); return w ? w.dataset.why : null; });
  {
    // a second tab of the same profile opens read-only: it says so, takes no answer, writes nothing
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER !== 'pending', null, {timeout: 5000}).catch(() => {});
    const before = await stored(d.page, di.data);
    const n0 = await nAns(t2);
    await t2.evaluate(() => { record(QUESTIONS[5], 'correct', undefined, 1000); saveNow(); DB.settings.goal = 42; save(); saveNow(); });
    check(await wall(t2) === 'other' && await nAns(t2) === n0 && await stored(d.page, di.data) === before && await d.page.evaluate(() => WRITER) === 'held',
      'a second tab of a profile another tab has: it shows why it is read-only, takes no answer and writes nothing', {why: await wall(t2), n0, n: await nAns(t2)});
    // the stop wall covers the page, so a real tap does not reach the questions
    const covered = await t2.evaluate(() => { const b = document.querySelector('#nav button'); if(!b) return null; const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(top && top.closest('#stopwall')); });
    check(covered === true, 'the stop wall lies over the page, so its buttons cannot be tapped', covered);
    // "Use it here": the first tab saves the answer still waiting on its timer, hands over and stops
    await holdTimer(d.page);
    const at = await d.page.evaluate(() => { record(QUESTIONS[6], 'correct', undefined, 1000); return DB.answers[DB.answers.length - 1].at; });
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const t2has = await t2.evaluate(at => DB.answers.some(a => a.at === at), at);
    check(await t2.evaluate(() => WRITER) === 'held' && t2has && await wall(t2) === null && await wall(d.page) === 'gave',
      'Use it here: the other tab saves its waiting answer and stops; this tab starts saving with that answer in its progress',
      {t2: await t2.evaluate(() => WRITER), t2has, wall1: await wall(d.page)});
    const at2 = await answerHere(t2, 8);
    const prog = JSON.parse(await stored(t2, di.data));
    check(prog.answers.some(a => a.at === at) && prog.answers.some(a => a.at === at2) && await d.page.evaluate(() => { record(QUESTIONS[2], 'correct', undefined, 1000); return WRITER; }) === 'other',
      'after the hand-over both answers are stored, and the first tab takes no more answers', prog.answers.length);
    await d.ctx.close();
  }
  {
    // the hand-over when the old writer's last save has not reached the new tab yet: the new tab
    // does not start writing on its older view; once the save arrives, Use it here works
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await lagView(t2, [di.data, di.log]);
    await holdTimer(d.page);
    const at = await d.page.evaluate(() => { record(QUESTIONS[6], 'correct', undefined, 1000); return DB.answers[DB.answers.length - 1].at; });
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => (document.getElementById('stopwall') || {dataset: {}}).dataset.why === 'late', null, {timeout: 9000}).catch(() => {});
    const late = await wall(t2), w1 = await t2.evaluate(() => WRITER);
    await unlag(t2);
    await d.page.evaluate(() => takeOver(false)).catch(() => {});      // the first tab takes it back first: it has the newest progress
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const has = await t2.evaluate(at => DB.answers.some(a => a.at === at), at);
    check(late === 'late' && w1 === 'other' && has && JSON.parse(await stored(t2, di.data)).answers.some(a => a.at === at),
      'a hand-over whose last save has not reached this tab: it does not start writing on its older view; later, Use it here brings that answer', {late, w1, has});
    await d.ctx.close();
  }
  {
    // a writer that does not answer (asleep in the background): after the wait the page offers to
    // take it over; the old writer then stops, and offers to export what it had not saved
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await holdTimer(d.page);
    await d.page.evaluate(() => { writerChan.close(); record(QUESTIONS[6], 'correct', undefined, 1000); });   // deaf, with an unsaved answer
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => (document.getElementById('stopwall') || {dataset: {}}).dataset.why === 'slow', null, {timeout: 8000}).catch(() => {});
    const slow = await wall(t2);
    await t2.evaluate(() => takeOver(true));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await d.page.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const storedNowV = await stored(t2, di.data);
    await d.page.evaluate(() => saveNow());                                         // its waiting save: refused
    const exportOffered = await d.page.evaluate(() => !!document.getElementById('stopExport'));
    check(slow === 'slow' && await t2.evaluate(() => WRITER) === 'held' && await wall(d.page) === 'taken' && await stored(t2, di.data) === storedNowV && exportOffered,
      'a writer that does not answer: "Take it over anyway" works; the old writer stops, writes nothing, and offers to export its unsaved answer',
      {slow, w1: await wall(d.page), exportOffered});
    const [dl] = await Promise.all([d.page.waitForEvent('download', {timeout: 5000}).catch(() => null), d.page.evaluate(() => { const b = document.getElementById('stopExport'); if(b) b.click(); })]);
    const exp = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : null;
    check(!!exp && exp.db.answers.length === 4, 'the export from the stop wall holds this page\'s unsaved answer', exp && exp.db.answers.length);
    await d.ctx.close();
  }
  {
    // reloading a stopped page with unsaved work asks first
    const d = await device(undefined, true);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await holdTimer(d.page);
    await d.page.evaluate(() => { writerChan.close(); record(QUESTIONS[6], 'correct', undefined, 1000); });
    await t2.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const n0 = d.dialogs.length;
    d.page.removeAllListeners('dialog'); d.page.on('dialog', x => { d.dialogs.push(x.message()); x.dismiss().catch(() => {}); });
    await d.page.evaluate(() => { const b = document.getElementById('stopReload'); if(b) b.click(); });
    check(/lost on reload unless you export/.test(d.dialogs.slice(n0).join(' ')) && await d.page.evaluate(() => DB.answers.length) === 3,
      'Reload on a stopped page with unsaved answers asks first; cancelled, the page and its answers stay', d.dialogs.slice(n0));
    await d.ctx.close();
  }
  {
    // an import that would write a profile another tab has open writes nothing
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.evaluate(() => useProfile('other-one'));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    const r = await d.page.evaluate(() => withOtherProfile({action: 'separate', name: 'other-one'}, () => ({text: 'WROTE'})));
    const free = await d.page.evaluate(() => withOtherProfile({action: 'separate', name: 'free-one'}, () => ({text: 'WROTE'})));
    check(/open in another tab/.test(r.text) && free.text === 'WROTE', 'Import into a profile another tab has open writes nothing and says why; a free name is written', {r: r.text.slice(0, 80), free: free.text});
    await d.ctx.close();
  }

  console.log('\n=== One writer per profile: the review of 4b3b94c ===');
  {
    // a read-only tab writes no exam paper and erases nothing
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const before = await stored(d.page, di.data);
    await t2.evaluate(() => { EX = {running: true, qs: [QUESTIONS[0]], picks: [0], orders: [[0, 1, 2, 3]], i: 0, ends: Date.now() + 3600000, timer: 0}; saveExam(); EX = null; });
    await t2.evaluate(() => { show('settings'); const b = document.getElementById('btnReset'); if(b) b.click(); });
    await t2.waitForTimeout(300);
    check(await stored(d.page, di.ns + ':exam:' + di.profile) === null && await stored(d.page, di.data) === before && await stored(d.page, di.log) !== null,
      'a read-only tab writes no exam paper, and Erase there erases nothing');
    // the writer's lock is taken by name: a writer that finds another tab named in <ns>:writer:<profile> stops
    await d.page.evaluate(() => localStorage.setItem(NS + ':writer:' + PROFILE, 'another-tab'));
    const n0 = await stored(d.page, di.data);
    await d.page.evaluate(() => { DB.settings.goal = 77; save(); saveNow(); });
    check(await stored(d.page, di.data) === n0 && await wall(d.page) === 'taken', 'a writer whose tab is no longer named as the writer writes nothing and stops', await wall(d.page));
    await d.ctx.close();
  }
  {
    // a profile switch frees the old profile's lock: another tab can then take it without a hand-over
    const d = await device(undefined, true);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await d.page.evaluate(() => useProfile('elsewhere'));
    const free = await t2.evaluate(() => navigator.locks.request(NS + ':writer:' + PROFILE, {ifAvailable: true}, l => !!l));
    check(free === true, 'a profile switch frees the old profile\'s lock', free);
    await d.ctx.close();
  }
  {
    // the Import button itself goes through the other profile's lock: the plan's new-profile name is
    // opened in another tab after the plan was shown (that tab has written nothing yet)
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 3, 0);
    const rr = await choose(d.page, fileA, false);
    const name = (rr.plan.match(/new profile, "([^"]+)"/) || [])[1];
    const t2 = await secondTab(d);
    await t2.evaluate(n => useProfile(n), name);
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    await d.page.evaluate(() => document.getElementById('importGo').click());
    await d.page.waitForSelector('#importResult', {timeout: 5000}).catch(() => {});
    const res = await d.page.evaluate(() => (document.getElementById('importResult') || {}).textContent || '');
    check(!!name && /open in another tab/.test(res) && await stored(d.page, di.ns + ':data:' + name) === null, 'the Import button writes no profile another tab has open, and says why', {name, res: res.slice(0, 100)});
    await d.ctx.close();
  }
  {
    // after Use it here the exam paper is read from storage again, not the one this page restored
    const d = await device(undefined, true);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await t2.evaluate(() => { EX = {running: true, qs: [QUESTIONS[0]], picks: [null], orders: [[0, 1, 2, 3]], i: 0, ends: Date.now() + 3600000, timer: 0}; });
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    check(await t2.evaluate(() => EX === null), 'after Use it here the page drops the exam paper it restored earlier, so the stored one is read again');
    // Use it here on a page with an unsaved answer (the review of 4b3b94c, M2, and ChatGPT's
    // review of 4b3b94c): that page's progress is kept as a copy, not dropped and not mixed in
    await holdTimer(t2);
    const mine = await t2.evaluate(() => { record(QUESTIONS[3], 'correct', undefined, 1000); return DB.answers[DB.answers.length - 1].at; });
    await d.page.evaluate(() => takeOver(true));
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await t2.evaluate(() => { const b = document.getElementById('stopTake'); if(b) b.click(); });
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const di2 = await info(t2);
    const copies = JSON.parse(await stored(t2, di2.backup) || '[]');
    const inCopy = copies.some(c => { try { return JSON.parse(c.data).answers.some(a => a.at === mine); } catch(e){ return false; } });
    const inProg = JSON.parse(await stored(t2, di2.data)).answers.some(a => a.at === mine);
    check(inCopy && !inProg && await t2.evaluate(() => WRITER) === 'held',
      'Use it here on a page with an unsaved answer: that page\'s progress is kept as a copy (Put back), and the stored progress opens unmixed', {inCopy, inProg});
    // the page behind the wall cannot be reached by the keyboard
    // the first tab, which handed the profile back, shows the wall: the page behind it is inert
    await d.page.waitForFunction(() => !!document.getElementById('stopwall'), null, {timeout: 5000}).catch(() => {});
    check(await d.page.evaluate(() => !!document.getElementById('stopwall') && [...document.body.children].filter(e => e.id !== 'stopwall' && e.id !== 'stalewarn').every(e => e.inert)), 'the page behind the stop wall is inert (no keyboard access)');
    await d.ctx.close();
  }

  {
    // a hand-over whose waiting save the browser refuses: the old writer keeps that answer on the
    // page and offers the export; taking the profile back keeps it as a copy
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await holdTimer(d.page);
    const mine = await d.page.evaluate(() => { record(QUESTIONS[4], 'correct', undefined, 1000); return DB.answers[DB.answers.length - 1].at; });
    await refuseKey(d.page, di.data);
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    await refuseKey(d.page, null);
    const offered = await d.page.evaluate(() => !!document.getElementById('stopExport'));
    const why = await wall(d.page);
    await d.page.evaluate(() => { const b = document.getElementById('stopTake'); if(b) b.click(); });
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]');
    const inCopy = copies.some(c => { try { return JSON.parse(c.data).answers.some(a => a.at === mine); } catch(e){ return false; } });
    check(why === 'gave' && offered && inCopy, 'a hand-over whose waiting save is refused: the old tab offers the export, and taking the profile back keeps that answer as a copy', {why, offered, inCopy});
    await d.ctx.close();
  }

  console.log('\n=== One writer per profile: the review of 4311133 ===');
  {
    // a stopped page with unsaved work: the new-version bar's Reload asks too; and after one export,
    // a later unsaved answer is asked about again
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await holdTimer(d.page);
    await d.page.evaluate(() => { writerChan.close(); record(QUESTIONS[6], 'correct', undefined, 1000); });
    await t2.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const msgs = [];
    d.page.removeAllListeners('dialog'); d.page.on('dialog', x => { msgs.push(x.message()); x.dismiss().catch(() => {}); });
    await d.page.evaluate(() => { offerReload('A new version is ready.'); const b = document.querySelector('#swbar button'); if(b) b.click(); });
    const asked1 = /lost on reload/.test(msgs.join(' ')) && await d.page.evaluate(() => DB.answers.length) === 3;
    // export, then one more unsaved change: Reload asks again
    await Promise.all([d.page.waitForEvent('download', {timeout: 5000}).catch(() => null), d.page.evaluate(() => { const b = document.getElementById('stopExport'); if(b) b.click(); })]);
    const n0 = msgs.length;
    await d.page.evaluate(() => { DB.settings.goal = 31; const b = document.getElementById('stopReload'); if(b) b.click(); });
    const asked2 = /lost on reload/.test(msgs.slice(n0).join(' '));
    check(asked1 && asked2, 'a stopped page with unsaved work: the new-version bar\'s Reload asks first, and after an export a later unsaved change is asked about again', {asked1, asked2});
    await d.ctx.close();
  }
  {
    // one tab alone, a paper whose clock ran out: opened again, it is submitted once and cleared,
    // not submitted again on every reload (the lock is still being asked for at that moment)
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const ids = await d.page.evaluate(() => QUESTIONS.slice(0, 3).map(q => q.id));
    await d.page.evaluate(([ids, k]) => localStorage.setItem(k, JSON.stringify({ids, picks: [0, 0, 0], orders: ids.map(() => [0, 1, 2, 3]), i: 2, ends: Date.now() - 1000})), [ids, di.ns + ':exam:' + di.profile]);
    const counts = [];
    for(let i = 0; i < 2; i++){
      await reload(d.page);
      await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
      await d.page.evaluate(() => { try { show('exam'); } catch(e){} });
      await d.page.waitForTimeout(400);
      await d.page.evaluate(() => saveNow());
      counts.push(JSON.parse(await stored(d.page, di.data)).answers.length);
    }
    check(counts[0] === counts[1] && await stored(d.page, di.ns + ':exam:' + di.profile) === null, 'a paper whose clock ran out is submitted once and cleared, not again on the next reload', counts);
    await d.ctx.close();
  }
  {
    // Use it here keeps the history entries this page had not stored with its copy
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await refuseKey(d.page, di.log);
    await holdTimer(d.page);
    await d.page.evaluate(() => { record(QUESTIONS[5], 'correct', undefined, 1000); });   // its history write refused
    await refuseKey(d.page, null);
    await d.page.evaluate(() => writerChan.close());
    await t2.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const held = await d.page.evaluate(() => LOG.length);
    await d.page.evaluate(() => takeOver(true));                                   // its channel is closed: taken back by force
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]');
    const last = copies[copies.length - 1] || {};
    const logLen = last.log ? JSON.parse(last.log).length : 0;
    check(logLen === held && held > 0, 'Use it here keeps the history entries this page had not stored with its copy', {held, logLen});
    // Put back of that copy adds those entries to the stored history before the copy leaves the list
    await d.page.evaluate(() => { show('settings'); restoreBackup(); });
    const hist = JSON.parse(await stored(d.page, di.log) || '[]').length;
    check(hist >= held, 'Put back of that copy adds its history entries to the stored history', {hist, held});
    await d.ctx.close();
  }

  console.log('\n=== One writer per profile: ChatGPT\'s follow-up at f53ac75 ===');
  {
    // a never-saved profile whose only change is a setting: it counts as unsaved work, so taking
    // the profile back keeps it as a copy, and Reload asks first
    const d = await device(undefined, true); const di = await info(d.page);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await holdTimer(d.page);
    await d.page.evaluate(() => { writerChan.close(); DB.settings.goal = 99; save(); });          // waiting, never stored
    await t2.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const unsaved = await d.page.evaluate(() => unsavedHere());
    const asked = await d.page.evaluate(() => atRisk());                // what Reload and Switch ask on
    await d.page.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]');
    const kept = copies.some(c => { try { return JSON.parse(c.data).settings.goal === 99; } catch(e){ return false; } });
    check(unsaved && asked && kept, 'a never-saved profile with only a changed setting: Reload asks, and taking it back keeps that setting as a copy', {unsaved, asked, kept});
    // a blank profile with no change makes no copy
    const d2 = await device(undefined, true); const di2 = await info(d2.page);
    const t3 = await secondTab(d2);
    await t3.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await t3.evaluate(() => takeOver(false));
    await t3.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    check(await stored(t3, di2.backup) === null, 'a blank profile with no change makes no copy when it is taken over');
    await d.ctx.close(); await d2.ctx.close();
  }
  {
    // after a refused progress write, taking the profile back opens the stored progress: the other
    // tab's answer stays active, this tab's unsaved branch is a copy, and the next save works
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await refuseKey(d.page, di.data);
    const mine = await d.page.evaluate(() => { record(QUESTIONS[2], 'correct', undefined, 1000); saveNow(); return DB.answers[DB.answers.length - 1].at; });   // refused
    await refuseKey(d.page, null);
    await t2.evaluate(() => takeOver(false));
    await t2.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const theirs = await answerHere(t2, 4);
    await d.page.evaluate(() => takeOver(false));
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const active = await d.page.evaluate(([m, t]) => ({mine: DB.answers.some(a => a.at === m), theirs: DB.answers.some(a => a.at === t)}), [mine, theirs]);
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]');
    const inCopy = copies.some(c => { try { return JSON.parse(c.data).answers.some(a => a.at === mine); } catch(e){ return false; } });
    const next = await answerHere(d.page, 5);
    const prog = JSON.parse(await stored(d.page, di.data));
    const ok = !active.mine && active.theirs && inCopy && prog.answers.some(a => a.at === next) && prog.answers.some(a => a.at === theirs) && await wall(d.page) === null;
    check(ok, 'after a refused write, taking the profile back opens the stored progress (the other tab\'s answer active, this tab\'s branch a copy), and the next save works', {active, inCopy, wall: await wall(d.page)});
    await d.ctx.close();
  }

  {
    // a refused save, the profile opened again, then taken over: the answer still counts as unsaved,
    // and taking the profile back keeps it as a copy (#32's review of 9557366)
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    await refuseKey(d.page, di.data);
    const mine = await d.page.evaluate(() => { record(QUESTIONS[2], 'correct', undefined, 1000); saveNow(); return DB.answers[DB.answers.length - 1].at; });
    await d.page.evaluate(() => { useProfile('away'); useProfile('me'); });
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    await refuseKey(d.page, null);
    const unsaved = await d.page.evaluate(() => unsavedHere());
    await d.page.evaluate(() => writerChan.close());
    await t2.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const offered = await d.page.evaluate(() => !!document.getElementById('stopExport'));
    await d.page.evaluate(() => takeOver(true));
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 8000}).catch(() => {});
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]');
    const inCopy = copies.some(c => { try { return JSON.parse(c.data).answers.some(a => a.at === mine); } catch(e){ return false; } });
    check(unsaved && offered && inCopy, 'a refused save, the profile opened again, then taken over: it still counts as unsaved, and taking it back keeps the answer as a copy', {unsaved, offered, inCopy});
    await d.ctx.close();
  }

  console.log('\n=== A writer that leaves without handing over: its last save in a key only it writes ===');
  // the take-over finished before the test answers there (a precondition, its own check): in WebKit a
  // take-over has taken longer than 9 s, and an answer recorded before it finished is replaced by the
  // stored progress the take-over opens (the page is under the "asking" wall then, so a student cannot)
  const tookOver = async (t, what) => {
    await t.waitForFunction(() => WRITER === 'held', null, {timeout: 20000}).catch(() => {});
    const w = await t.evaluate(() => WRITER);
    if(w !== 'held') check(false, 'precondition: the take-over finished (' + what + ')', w);
    return w === 'held';
  };
  const keptAnywhere = async (p, di, at) => {                   // in the stored progress or in a kept copy
    const prog = JSON.parse(await stored(p, di.data) || '{"answers":[]}');
    const copies = JSON.parse(await stored(p, di.backup) || '[]');
    const has = db => (db.answers || []).some(a => a.at === at);
    return {live: has(prog), copy: copies.some(c => { try { return has(JSON.parse(c.data)); } catch(e){ return false; } })};
  };
  const leaveWithoutHandOver = async (lagPending) => {
    // tab 1 writes; tab 2 is read-only and has not yet received tab 1's last save; tab 1 closes
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => typeof WRITER !== 'undefined' && WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const pk = await d.page.evaluate(() => typeof pendingKey === 'function' ? pendingKey(PROFILE, TAB_ID) : null);
    await lagView(t2, [di.data, di.log].concat(lagPending && pk ? [pk] : []));
    const last = await answerHere(d.page, 6);                          // tab 1's last answer, stored
    await d.page.close();                                              // no hand-over
    return {d, di, t2, last, pk};
  };
  {
    // the leaving tab's record arrives (it is not held back): the next writer starts from it
    const {d, di, t2, last} = await leaveWithoutHandOver(false);
    await t2.evaluate(() => takeOver(false));
    await tookOver(t2, 'section A, take-over 1');
    const mine = await answerHere(t2, 7);
    await unlag(t2);
    await t2.waitForTimeout(300);
    const a = await keptAnywhere(t2, di, last), b = await keptAnywhere(t2, di, mine);
    check(a.live && b.live, 'a writer closes without handing over before its last save reached the next tab: that answer is in the stored progress, with the next tab\'s', {last: a, next: b});
    await d.ctx.close();
  }
  {
    // the record arrives only after the next tab has answered: the record is kept as a copy, not mixed in
    const {d, di, t2, last, pk} = await leaveWithoutHandOver(true);
    await t2.evaluate(() => takeOver(false));
    await tookOver(t2, 'section A, take-over 2');
    const mine = await answerHere(t2, 7);
    await unlag(t2);
    await t2.evaluate(() => { if(typeof settlePending === 'function') settlePending(); });   // as the storage event does
    await t2.waitForTimeout(300);
    const a = await keptAnywhere(t2, di, last), b = await keptAnywhere(t2, di, mine);
    check((a.live || a.copy) && b.live, 'the record arrives after the next tab answered: the closed tab\'s answer is kept (a copy), and the next tab\'s stays in the progress', {last: a, next: b, pk: !!pk});
    check(a.copy && !a.live, 'that record is not mixed into the progress: it is a separate copy', a);
    await d.ctx.close();
  }
  {
    // a record whose answer differs field by field from the stored one at the same question and time,
    // and one with a second attempt at the same question: neither is merged or dropped
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    const base = JSON.parse(await stored(d.page, di.data));
    const conflict = JSON.parse(JSON.stringify(base)); conflict.answers[1].result = conflict.answers[1].result === 'correct' ? 'wrong' : 'correct';
    const attempt = JSON.parse(JSON.stringify(base)); attempt.answers.push(Object.assign({}, base.answers[1], {at: base.answers[1].at + 1}));
    await d.page.evaluate(([c, a]) => {
      localStorage.setItem(pendingKey(PROFILE, 'gone-1'), JSON.stringify({at: Date.now(), db: JSON.parse(c), log: []}));
      localStorage.setItem(pendingKey(PROFILE, 'gone-2'), JSON.stringify({at: Date.now(), db: JSON.parse(a), log: []}));
      DB.settings.goal = 13; save(); saveNow();                        // this page has changed something
      settlePending();
    }, [JSON.stringify(conflict), JSON.stringify(attempt)]);
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]').map(c => c.data);
    const live = JSON.parse(await stored(d.page, di.data));
    check(copies.includes(JSON.stringify(conflict)) && copies.includes(JSON.stringify(attempt)) && live.answers.length === 2 && live.answers[1].result === base.answers[1].result,
      'records with a conflicting answer, or a second attempt at the same question, are kept as copies field for field; the live progress is unchanged', {copies: copies.length, live: live.answers.length});
    // cleanup: a record is removed only on a later check, at least 60 s after it was found stored, unchanged
    const k1 = await d.page.evaluate(() => pendingKey(PROFILE, 'gone-1'));
    const before = await stored(d.page, k1);
    await d.page.evaluate(() => settlePending());
    const stillThere = await stored(d.page, k1) === before;
    const age = k => { const sk = NS + ':pending-seen:' + PROFILE; const v = JSON.parse(localStorage.getItem(sk) || '{}'); if(v[k]) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v)); };
    await d.page.evaluate(`(${age.toString()})(${JSON.stringify(k1)}); settlePending();`);
    const gone = await stored(d.page, k1) === null;
    // a record that changed in between is checked again, not removed
    const k2 = await d.page.evaluate(() => pendingKey(PROFILE, 'gone-2'));
    await d.page.evaluate(`(${age.toString()})(${JSON.stringify(k2)}); { const r = JSON.parse(localStorage.getItem(${JSON.stringify(k2)})); r.at += 1; localStorage.setItem(${JSON.stringify(k2)}, JSON.stringify(r)); } settlePending();`);
    const kept2 = await stored(d.page, k2) !== null;
    // an older record whose second answer differs field by field from the stored one (same question
    // and time): it is not taken as stored and dropped; it is kept as a copy
    const older = JSON.parse(JSON.stringify(base)); older.answers = older.answers.slice(0, 2); older.answers[1].picked = 'other';
    await answer(d.page, 1, 3);                                        // the stored progress has more answers now
    await d.page.evaluate(o => { localStorage.setItem(pendingKey(PROFILE, 'gone-3'), JSON.stringify({at: Date.now(), db: JSON.parse(o), log: []})); settlePending(); }, JSON.stringify(older));
    const copies3 = JSON.parse(await stored(d.page, di.backup) || '[]').map(c => c.data);
    check(copies3.includes(JSON.stringify(older)), 'an older record whose answer differs from the stored one at the same question and time is kept as a copy, not taken as stored', copies3.length);
    check(stillThere && gone && kept2, 'a record is removed only on a later check, 60 s after it was found stored, and only if it did not change in between', {stillThere, gone, kept2});
    await d.ctx.close();
  }

  console.log('\n=== Records and deliberate changes: the review of ef82bb6 ===');
  const rawRec = (p, tab, db, log) => p.evaluate(([tab, db, log]) => localStorage.setItem(pendingKey(PROFILE, tab), JSON.stringify({at: Date.now(), db, log})), [tab, db, log]);
  const lockReady = p => p.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
  {
    // M1, M2: Erase is not undone by this tab's own or an earlier load's record, at once or after a reload
    const d = await device(undefined, true); const di = await info(d.page);
    await lockReady(d.page);
    await answerHere(d.page, 1); await answerHere(d.page, 2); await answerHere(d.page, 3);
    await reload(d.page); await lockReady(d.page);                      // an earlier load's record stays
    await d.page.evaluate(() => { window.confirm = () => true; show('settings'); document.getElementById('btnReset').click(); saveNow(); });
    await d.page.waitForTimeout(300);
    await reload(d.page); await lockReady(d.page); await d.page.waitForTimeout(1800);
    const prog = JSON.parse(await stored(d.page, di.data) || '{"answers":[]}'), log = JSON.parse(await stored(d.page, di.log) || '[]');
    check(prog.answers.length === 0 && log.length === 0, 'Erase, then reloads: the progress and the history stay erased (no record brings them back)', {answers: prog.answers.length, log: log.length});
    await d.ctx.close();
  }
  {
    // M2: Put back is not undone by an earlier load's record
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    const f = await exportOf(d.page);
    await choose(d.page, later(f, 2), true);                             // 3 answers, a copy of 1
    await reload(d.page); await lockReady(d.page);
    await d.page.evaluate(() => { show('settings'); restoreBackup(); });
    await reload(d.page); await lockReady(d.page); await d.page.waitForTimeout(1800);
    const n = JSON.parse(await stored(d.page, di.data)).answers.length;
    check(n === 1, 'Put back, then a reload: the progress put back stays (an earlier load\'s record does not undo it)', n);
    await d.ctx.close();
  }
  {
    // M3: Delete the copies is not undone by the later check of a record kept as a copy
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    await lockReady(d.page);
    const base = JSON.parse(await stored(d.page, di.data));
    const other = JSON.parse(JSON.stringify(base)); other.settings.goal = 77;
    await rawRec(d.page, 'gone-x', other, []);
    await d.page.evaluate(() => settlePending());
    const made = JSON.parse(await stored(d.page, di.backup) || '[]').length;
    await d.page.evaluate(() => { window.confirm = () => true; show('settings'); deleteCopies(); });
    await d.page.evaluate(() => { const sk = NS + ':pending-seen:' + PROFILE; const v = JSON.parse(localStorage.getItem(sk) || '{}'); for(const k in v) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v)); settlePending(); });
    check(made === 1 && await stored(d.page, di.backup) === null, 'Delete the copies: a record kept as a copy does not bring the copy back at its later check', made);
    await d.ctx.close();
  }
  {
    // M4: at the 4,000-answer cap, a reload and an answer make no copy
    const d = await device(undefined, true); const di = await info(d.page);
    await d.page.evaluate(() => {
      const t0 = Date.now() - 1e8;
      for(let i = 0; i < ANSWERS_MAX + 5; i++){ const q = QUESTIONS[i % QUESTIONS.length]; DB.answers.push({qid: q.id, concept: q.concept, result: 'correct', at: t0 + i, qn: i + 1, picked: 0, ms: 1000}); }
      DB.answers.splice(0, DB.answers.length - ANSWERS_MAX); DB.qn = ANSWERS_MAX + 5;
      store.set(keyFor(PROFILE), JSON.stringify(DB));
    });
    await reload(d.page); await lockReady(d.page);
    await answerHere(d.page, 4);
    await reload(d.page); await lockReady(d.page);
    await answerHere(d.page, 5);
    await d.page.evaluate(() => settlePending());
    check(await stored(d.page, di.backup) === null, 'at the 4,000-answer cap, reloads and answers make no copy');
    await d.ctx.close();
  }
  {
    // M5: a record whose only change is a setting, at the same point as what is stored: kept as a copy, not removed as taken in
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0); await lockReady(d.page);
    const base = JSON.parse(await stored(d.page, di.data));
    const set = JSON.parse(JSON.stringify(base)); set.settings.goal = 61;
    await rawRec(d.page, 'gone-s', set, []);
    await d.page.evaluate(() => settlePending());
    const copies = JSON.parse(await stored(d.page, di.backup) || '[]');
    check(copies.some(c => JSON.parse(c.data).settings.goal === 61), 'a record whose only change is a setting is kept as a copy, not taken as stored', copies.length);
    await d.ctx.close();
  }
  {
    // M6: reloads do not pile records up; the first-found time is kept across reloads
    const d = await device(undefined, true); const di = await info(d.page);
    await lockReady(d.page); await answerHere(d.page, 1);
    for(let i = 0; i < 4; i++){ await reload(d.page); await lockReady(d.page); await answerHere(d.page, 2 + i); }
    await d.page.evaluate(() => { const sk = NS + ':pending-seen:' + PROFILE; const v = JSON.parse(localStorage.getItem(sk) || '{}'); for(const k in v) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v)); settlePending(); });
    const n = await d.page.evaluate(() => { let n = 0; for(let i = 0; i < localStorage.length; i++) if(localStorage.key(i).startsWith(NS + ':pending:' + PROFILE + ':')) n++; return n; });
    check(n === 1, 'after reloads, once the wait has passed, only this tab\'s own record is left', n);
    await d.ctx.close();
  }
  {
    // history: a "Not sure" on the same entry is one entry; two identical attempts stay two
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0); await lockReady(d.page);
    const log = JSON.parse(await stored(d.page, di.log));
    const e = log[log.length - 1].slice(), unsure = e.slice(); unsure[5] = 'unsure';
    const sameAs = (list) => list.filter(x => JSON.stringify(x.map((v, i) => i === 5 ? null : v)) === JSON.stringify(e.map((v, i) => i === 5 ? null : v))).length;
    await rawRec(d.page, 'gone-h1', JSON.parse(await stored(d.page, di.data)), [unsure]);
    await d.page.evaluate(() => settlePending());
    const one = sameAs(JSON.parse(await stored(d.page, di.log)));
    check(one === 1, 'a record\'s history: the same entry with a changed confidence ("Not sure") is not added a second time', one);
    await rawRec(d.page, 'gone-h2', JSON.parse(await stored(d.page, di.data)), [e.slice(), e.slice()]);
    await d.page.evaluate(() => settlePending());
    const two = sameAs(JSON.parse(await stored(d.page, di.log)));
    check(two === 2, 'a record\'s history: a second identical attempt is kept (two in all)', two);
    await d.ctx.close();
  }
  for(const order of [['z-old', 'a-new', true], ['a-old', 'z-new', false]]){
    // several leaving tabs: the newer record, continuing the older, ends as the progress, whatever the
    // key names and the order they were written in (a tab that has written nothing since it took the profile)
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    await reload(d.page); await lockReady(d.page);
    const base = JSON.parse(await stored(d.page, di.data)), q = base.answers[0];
    const r1 = JSON.parse(JSON.stringify(base)); r1.answers.push(Object.assign({}, q, {at: q.at + 10}));
    const r2 = JSON.parse(JSON.stringify(r1)); r2.answers.push(Object.assign({}, q, {at: q.at + 20}));
    await d.page.evaluate(([a, b, kOld, kNew, newFirst]) => {
      const put = (k, at, db) => localStorage.setItem(pendingKey(PROFILE, k), JSON.stringify({at, db, log: []}));
      if(newFirst){ put(kNew, 2000, b); put(kOld, 1000, a); } else { put(kOld, 1000, a); put(kNew, 2000, b); }
      settlePending();
    }, [r1, r2, order[0], order[1], order[2]]);
    check(JSON.parse(await stored(d.page, di.data)).answers.length === 3 && await stored(d.page, di.backup) === null,
      `two leaving tabs' records (${order[0]}, ${order[1]}), the newer continuing the older: the newer is the progress, with no copy`);
    await d.ctx.close();
  }

  for(const order of [['z-old', 'a-new', true], ['a-old', 'z-new', false]]){
    // What oldest first is for: the newer record continues the older one and carries a setting changed
    // after it. Placed oldest first, the older becomes the progress and the newer then continues it, so
    // the newer is the progress and nothing is copied. Placed newest first, the newer becomes the
    // progress and the older, now behind it with another setting, is copied though nothing of it is
    // missing. Either way nothing is lost; the order decides only that no needless copy is made.
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    await reload(d.page); await lockReady(d.page);
    const base = JSON.parse(await stored(d.page, di.data)), q = base.answers[0];
    const r1 = JSON.parse(JSON.stringify(base)); r1.answers.push(Object.assign({}, q, {at: q.at + 10}));
    const r2 = JSON.parse(JSON.stringify(r1)); r2.answers.push(Object.assign({}, q, {at: q.at + 20})); r2.settings = Object.assign({}, r2.settings, {goal: 73});
    await d.page.evaluate(([a, b, kOld, kNew, newFirst]) => {
      const put = (k, at, db) => localStorage.setItem(pendingKey(PROFILE, k), JSON.stringify({at, db, log: []}));
      if(newFirst){ put(kNew, 2000, b); put(kOld, 1000, a); } else { put(kOld, 1000, a); put(kNew, 2000, b); }
      settlePending();
    }, [r1, r2, order[0], order[1], order[2]]);
    const st = JSON.parse(await stored(d.page, di.data));
    check(st.answers.length === 3 && st.settings.goal === 73 && await stored(d.page, di.backup) === null,
      `two leaving tabs' records (${order[0]}, ${order[1]}), the newer continuing the older with a setting changed since: the newer is the progress, with no copy`,
      {n: st.answers.length, goal: st.settings.goal, copies: JSON.parse(await stored(d.page, di.backup) || '[]').length});
    await d.ctx.close();
  }
  {
    // A tab back on a profile it wrote before: its earlier record is not written over. Tab X's last save
    // on the profile is written over by tab Y, which never received it (held back) and closes; X comes
    // back and saves. Before d325326's review that save replaced X's earlier record unchecked, and X's
    // last answer was in neither the progress nor a copy.
    const d = await device(undefined, true); const di = await info(d.page);
    await lockReady(d.page);
    await answerHere(d.page, 1); await answerHere(d.page, 2);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const pk1 = await d.page.evaluate(() => myPendingKey());
    await lagView(t2, [di.data, di.log, pk1]);
    const last = await answerHere(d.page, 3);                          // X's last answer here, stored, and in its record
    await d.page.evaluate(() => useProfile('bee')); await lockReady(d.page);
    await t2.evaluate(() => takeOver(false));
    await tookOver(t2, 'section A, take-over 3');
    const yHeld = await t2.evaluate(() => WRITER);
    await answerHere(t2, 4);                                           // Y writes over X's last save
    // X's view of storage gets Y's write a moment later (in WebKit in GitHub run 41943489826 it had
    // not yet when read at once): wait until X's view no longer holds its last answer
    await d.page.waitForFunction(([k, at]) => { try { return !JSON.parse(localStorage.getItem(k)).answers.some(a => a.at === at); } catch(e){ return false; } }, [di.data, last], {timeout: 5000}).catch(() => {});
    const overwritten = !(await keptAnywhere(d.page, di, last)).live;
    await t2.close();
    let back = '', tries = 0;
    for(; tries < 8 && back !== 'held'; tries++){
      await d.page.waitForFunction(async n => (await navigator.locks.query()).held.every(l => !l.name.endsWith(':writer:' + n)), di.profile, {timeout: 5000}).catch(() => {});
      if(tries) { await d.page.evaluate(() => useProfile('bee')); await lockReady(d.page); }
      await d.page.evaluate(n => useProfile(n), di.profile);
      await d.page.waitForFunction(n => WRITER !== 'pending' && PROFILE === n, di.profile, {timeout: 6000}).catch(() => {});
      back = await d.page.evaluate(() => WRITER);
    }
    check(yHeld === 'held' && overwritten && back === 'held', 'a tab back on a profile it wrote before: the other tab wrote over its last save, and it holds the profile again (precondition)', {yHeld, overwritten, back, tries});
    await answerHere(d.page, 5);                                       // the save that wrote over the earlier record before
    await d.page.evaluate(() => settlePending());
    const a = await keptAnywhere(d.page, di, last);
    const pk2 = await d.page.evaluate(() => myPendingKey());
    check(a.live || a.copy, 'a tab back on a profile it wrote before: its earlier last answer, written over by another tab, is kept (progress or a copy) after its next save', Object.assign({sameKey: pk1 === pk2}, a));
    // cleanup stays safe: the earlier record goes only after the 60 s wait with proof, never before
    const early = await d.page.evaluate(k => localStorage.getItem(k) !== null, pk1);
    const age = k => { const sk = NS + ':pending-seen:' + PROFILE; const v = JSON.parse(localStorage.getItem(sk) || '{}'); if(v[k]) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v)); };
    await d.page.evaluate(`(${age.toString()})(${JSON.stringify(pk1)}); settlePending();`);
    const gone = await d.page.evaluate(k => localStorage.getItem(k) === null, pk1);
    const keptAfter = await keptAnywhere(d.page, di, last);
    const ownStays = await d.page.evaluate(k => localStorage.getItem(k) !== null, pk2);
    check(pk1 !== pk2 && early && gone && (keptAfter.live || keptAfter.copy) && ownStays,
      'a tab back on a profile: its new saves go to a new record; the earlier record is removed only after it is proven stored and 60 s have passed, the answer stays kept, and the present record stays',
      {pk1, pk2, early, gone, keptAfter, ownStays});
    await d.ctx.close();
  }

  console.log('\n=== Records: the review of 59b3c50 ===');
  {
    // N1: Put back right after taking over must not delete the leaving tab's late record; its answer is kept
    const {d, di, t2, last} = await leaveWithoutHandOver(true);
    await t2.evaluate(() => takeOver(false));
    await tookOver(t2, 'section A, take-over 4');
    await t2.evaluate(() => { show('settings'); window.confirm = () => true; if(readCopies().length) restoreBackup(); else { DB.settings.goal = 5; save(); saveNow(); pendingRetire(); } });
    await unlag(t2);
    await t2.evaluate(() => settlePending());
    const a = await keptAnywhere(t2, di, last);
    check(a.live || a.copy, 'a deliberate change right after taking over (Put back) does not delete the leaving tab\'s late record: its last answer is kept', a);
    await d.ctx.close();
  }
  {
    // N2: a record found equal at the first check is not turned into a copy when this tab changes a setting later
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    await reload(d.page); await lockReady(d.page); await d.page.waitForTimeout(1800);
    await d.page.evaluate(() => { DB.settings.goal = 44; save(); saveNow(); settlePending(); });
    check(await stored(d.page, di.backup) === null, 'a record found equal before, unchanged since, makes no copy after this tab changes a setting');
    await d.ctx.close();
  }
  {
    // N3: a leaving tab's last save is a setting; the next tab answered before the record arrived: the setting is kept as a copy
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const pk = await d.page.evaluate(() => pendingKey(PROFILE, TAB_ID));
    await lagView(t2, [di.data, di.log, pk]);
    await d.page.evaluate(() => { DB.settings.goal = 91; save(); saveNow(); });
    await d.page.close();
    await t2.evaluate(() => takeOver(false));
    await tookOver(t2, 'section A, take-over 5');
    await answerHere(t2, 8);
    await unlag(t2);
    await t2.evaluate(() => settlePending());
    const copies = JSON.parse(await stored(t2, di.backup) || '[]');
    check(copies.some(c => { try { return JSON.parse(c.data).settings.goal === 91; } catch(e){ return false; } }), 'a leaving tab\'s last setting, written over by the next tab\'s answer, is kept as a copy', copies.length);
    await d.ctx.close();
  }
  {
    // a leaving tab's last save is a Put back; the next tab answered before the record arrived: the
    // put-back progress is kept as a copy, not silently reverted
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    const f = await exportOf(d.page);
    await choose(d.page, later(f, 2), true);                             // 3 answers, a copy of 1
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER === 'other', null, {timeout: 5000}).catch(() => {});
    const pk = await d.page.evaluate(() => pendingKey(PROFILE, TAB_ID));
    await lagView(t2, [di.data, di.log, di.backup, pk]);
    await d.page.evaluate(() => { show('settings'); restoreBackup(); });   // back to 1 answer
    await d.page.close();
    await t2.evaluate(() => takeOver(false));
    await tookOver(t2, 'section A, take-over 6');
    await answerHere(t2, 8);
    await unlag(t2);
    await t2.evaluate(() => settlePending());
    const copies = JSON.parse(await stored(t2, di.backup) || '[]');
    check(copies.some(c => { try { return JSON.parse(c.data).answers.length === 1 && c.why === "another tab's last save"; } catch(e){ return false; } }),
      'a leaving tab\'s last Put back, written over by the next tab\'s answer, is kept as a copy', copies.map(c => c.why));
    await d.ctx.close();
  }
  {
    // P1: a record whose copy write was refused is not removed after Delete the copies (no proof it is stored)
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0); await lockReady(d.page);
    const base = JSON.parse(await stored(d.page, di.data)), q = base.answers[0];
    const lost = JSON.parse(JSON.stringify(base)); lost.answers.push(Object.assign({}, q, {at: q.at + 77}));
    await d.page.evaluate(() => { DB.settings.goal = 3; save(); saveNow(); });      // this tab wrote: the record becomes a copy
    await refuseKey(d.page, di.backup);
    await rawRec(d.page, 'gone-p1', lost, []);
    await d.page.evaluate(() => settlePending());                                 // its copy write refused
    await refuseKey(d.page, null);
    await d.page.evaluate(() => { window.confirm = () => true; show('settings'); deleteCopies(); pendingRetire(); });
    await d.page.evaluate(() => { const sk = NS + ':pending-seen:' + PROFILE; const v = JSON.parse(localStorage.getItem(sk) || '{}'); for(const k in v) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v)); settlePending(); });
    const k = await d.page.evaluate(() => pendingKey(PROFILE, 'gone-p1'));
    const still = await stored(d.page, k) !== null;
    const a = await keptAnywhere(d.page, di, q.at + 77);
    check(still || a.live || a.copy, 'a record never taken in (its copy refused) is not removed after Delete the copies: its answer is kept somewhere', {still, a});
    await d.ctx.close();
  }
  {
    // records do not pile up when a setting is changed after each load
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 2, 0);
    for(let i = 0; i < 3; i++){
      await reload(d.page); await lockReady(d.page); await d.page.waitForTimeout(1800);
      await d.page.evaluate(g => { DB.settings.goal = g; save(); saveNow(); }, 20 + i);
    }
    for(let i = 0; i < 2; i++) await d.page.evaluate(() => { const sk = NS + ':pending-seen:' + PROFILE; const v = JSON.parse(localStorage.getItem(sk) || '{}'); for(const k in v) v[k].t -= 61000; localStorage.setItem(sk, JSON.stringify(v)); settlePending(); });
    const n = await d.page.evaluate(() => { let n = 0; for(let i = 0; i < localStorage.length; i++) if(localStorage.key(i).startsWith(NS + ':pending:' + PROFILE + ':')) n++; return n; });
    check(n === 1 && await stored(d.page, di.backup) === null, 'a setting changed after each of several loads: records do not pile up (only this tab\'s own is left), and no copy is made', n);
    await d.ctx.close();
  }
  {
    // ChatGPT's review of c9254dc: profile A's history entries do not go into profile B's record after a switch,
    // nor into B's history when another tab settles that record; B's own entry is kept
    const d = await device(undefined, true); const di = await info(d.page);
    await lockReady(d.page);
    const aAt = await answerHere(d.page, 1);
    const aEntry = await d.page.evaluate(() => JSON.stringify(LOG[LOG.length - 1]));
    await d.page.evaluate(() => useProfile('bee'));
    await lockReady(d.page);
    await answerHere(d.page, 2);
    const bEntry = await d.page.evaluate(() => JSON.stringify(LOG[LOG.length - 1]));
    const rec = await d.page.evaluate(() => JSON.parse(localStorage.getItem(pendingKey('bee', TAB_ID)) || 'null'));
    const recLog = (rec && rec.log || []).map(e => JSON.stringify(e));
    const t2 = await secondTab(d);
    await d.page.evaluate(() => useProfile(PROFILE === 'bee' ? 'other-x' : PROFILE));  // frees "bee"
    await t2.evaluate(() => useProfile('bee'));
    await t2.waitForFunction(() => WRITER === 'held' && PROFILE === 'bee', null, {timeout: 6000}).catch(() => {});
    await t2.evaluate(() => settlePending());
    const bLog = JSON.parse(await stored(t2, di.ns + ':log:bee') || '[]').map(e => JSON.stringify(e));
    check(!recLog.includes(aEntry) && recLog.includes(bEntry) && !bLog.includes(aEntry) && bLog.includes(bEntry),
      'after a profile switch, the other profile\'s history entries are in neither the new profile\'s record nor, once settled, its history; its own entry is kept',
      {recHasA: recLog.includes(aEntry), recHasB: recLog.includes(bEntry), logHasA: bLog.includes(aEntry), logHasB: bLog.includes(bEntry), aAt});
    await d.ctx.close();
  }
  {
    // a tab back on a profile it held before, after another tab erased that history: the erased entries do not come back
    const d = await device(undefined, true); const di = await info(d.page);
    await lockReady(d.page);
    await answerHere(d.page, 1); await answerHere(d.page, 2); await answerHere(d.page, 3);
    await d.page.evaluate(() => useProfile('bee')); await lockReady(d.page);
    const t2 = await secondTab(d);
    await t2.evaluate(n => useProfile(n), di.profile);                 // the profile the first tab left
    await t2.waitForFunction(n => WRITER === 'held' && PROFILE === n, di.profile, {timeout: 6000}).catch(() => {});
    const erased = await t2.evaluate(() => { window.confirm = () => true; show('settings'); document.getElementById('btnReset').click(); saveNow(); return true; });
    await t2.waitForTimeout(300);
    const afterErase = JSON.parse(await stored(t2, di.log) || '[]').length;
    await t2.waitForTimeout(300);
    await t2.close();
    // the closed tab's lock is freed a moment later: wait until it is, then go back
    // (a closed tab's lock can stay held for a moment after locks.query shows it free; the switch back is
    // tried again until this tab holds the profile, so the check below tests the history, not that timing)
    let back = '', tries = 0;
    for(; tries < 8 && back !== 'held'; tries++){
      await d.page.waitForFunction(async n => (await navigator.locks.query()).held.every(l => !l.name.endsWith(':writer:' + n)), di.profile, {timeout: 5000}).catch(() => {});
      if(tries) { await d.page.evaluate(() => useProfile('bee')); await lockReady(d.page); }
      await d.page.evaluate(n => useProfile(n), di.profile);
      await d.page.waitForFunction(n => WRITER !== 'pending' && PROFILE === n, di.profile, {timeout: 6000}).catch(() => {});
      back = await d.page.evaluate(() => WRITER);
    }
    check(back === 'held', 'back on a profile another tab erased meanwhile: this tab holds it again (precondition)', {back, tries});
    await answerHere(d.page, 4);
    await reload(d.page); await lockReady(d.page); await d.page.waitForTimeout(1800);
    const log = JSON.parse(await stored(d.page, di.log) || '[]');
    check(erased && afterErase === 0 && log.length === 1, 'back on a profile another tab erased meanwhile: only the new entry is in its history after a reload', {afterErase, back, tries, n: log.length});
    await d.ctx.close();
  }
  {
    // Erase without a reload first: this tab's own record (NEW_LOG) does not bring the history back
    const d = await device(undefined, true); const di = await info(d.page);
    await lockReady(d.page);
    await answerHere(d.page, 1); await answerHere(d.page, 2); await answerHere(d.page, 3);
    await d.page.evaluate(() => { window.confirm = () => true; show('settings'); document.getElementById('btnReset').click(); saveNow(); });
    await reload(d.page); await lockReady(d.page); await d.page.waitForTimeout(1800);
    const log = JSON.parse(await stored(d.page, di.log) || '[]');
    check(log.length === 0, 'Erase in the same visit as the answers, then a reload: the history stays erased', log.length);
    await d.ctx.close();
  }

  console.log('\n=== A profile switch away and straight back ===');
  {
    // one tab alone: switching away and straight back leaves it the writer, not read-only
    const d = await device(undefined, true); const di = await info(d.page);
    await answer(d.page, 1, 0);
    await d.page.waitForFunction(() => WRITER === 'held', null, {timeout: 5000}).catch(() => {});
    await d.page.evaluate(n => { useProfile('away'); useProfile(n); }, di.profile);      // in the same moment
    await d.page.waitForFunction(() => WRITER !== 'pending', null, {timeout: 5000}).catch(() => {});
    const w = await d.page.evaluate(() => WRITER), why = await d.page.evaluate(() => (document.getElementById('stopwall') || {dataset: {}}).dataset.why || null);
    check(w === 'held' && why === null, 'one tab alone, a profile switch away and straight back: it is still the writer, with no wall', {w, why});
    // six switches in one moment: still the writer, with no wall
    await d.page.evaluate(n => { for(let i = 0; i < 3; i++){ useProfile('away'); useProfile(n); } }, di.profile);
    await d.page.waitForFunction(() => WRITER !== 'pending', null, {timeout: 6000}).catch(() => {});
    await d.page.waitForTimeout(300);
    const w6 = await d.page.evaluate(() => ({w: WRITER, wall: (document.getElementById('stopwall') || {dataset: {}}).dataset.why || null}));
    check(w6.w === 'held' && w6.wall === null, 'six switches in one moment: still the writer, with no wall', w6);
    // another tab queued for that profile's lock when this page frees it: this page waits about 2 s,
    // then opens read-only, holding no lock, and the other tab has it
    const t2 = await secondTab(d);
    await t2.waitForFunction(() => WRITER !== 'pending', null, {timeout: 5000}).catch(() => {});
    await t2.evaluate(n => { window.__q = navigator.locks.request(NS + ':writer:' + n, () => new Promise(() => {})).catch(() => {}); }, di.profile);   // a raw queued request
    const t0 = Date.now();
    await d.page.evaluate(n => { useProfile('away'); useProfile(n); }, di.profile);
    await d.page.waitForFunction(() => WRITER !== 'pending', null, {timeout: 6000}).catch(() => {});
    const waited = Date.now() - t0;
    const after = await d.page.evaluate(() => ({w: WRITER, wall: (document.getElementById('stopwall') || {dataset: {}}).dataset.why || null, held: WRITER_FOR}));
    const q = await d.page.evaluate(() => navigator.locks.query().then(r => r.held.length));
    check(after.w === 'other' && after.wall === 'other' && !after.held && waited >= 1500 && q === 1,
      'another tab queued for the profile when this page frees it: this page waits about 2 s, then opens read-only, and only the other tab holds the lock', {after, waited, q});
    await d.ctx.close();
  }

  check(!A.errors.length && !B.errors.length, 'no page errors', A.errors.concat(B.errors).slice(0, 2).join('; '));
  await A.ctx.close(); await B.ctx.close();
  await browser.close();
  fs.rmSync(TMP, {recursive: true, force: true});
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
