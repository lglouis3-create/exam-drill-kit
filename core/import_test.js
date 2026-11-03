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
 *                      can be put back; an older file changes nothing; a file and a
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
 *   put back           a refused write at each of its three steps, and at step 2
 *                      with its undo refused too: both records are in storage after
 *                      each, the page says what happened, a reload shows the same;
 *                      the copies are deleted only when asked
 *   repeated imports   the same file again changes nothing, also after it went into a
 *                      new profile
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
    if(seed) { await o.page.close(); o.page = await o.ctx.newPage(); o.page.on('pageerror', e => o.errors.push(e.message)); o.page.on('dialog', d => d.accept()); }
    return o;
  };
  // the page with init scripts set before load (open() above seeds through an init script on the context)
  const device = async (seed) => {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    if(seed) await ctx.addInitScript(([s]) => {
      if(sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      for(const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    }, [seed]);
    const page = await ctx.newPage(), errors = [], dialogs = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
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
    const bad = [
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
  // an older file of the same record
  r = await choose(A.page, fileA, true);
  check(!r.offered && /on this device already/.test(r.plan) && await nAns(A.page) === 5, 'an older file of the same record changes nothing', r.plan.slice(0, 200));
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
  check(!r.offered && r.plan.includes(`imported before, into the profile "${newName}"`) && await profiles() === nProf,
    'the same file again: it was imported before, and no second profile is made', r.plan.slice(0, 200));
  await reload(A.page);
  check(!!(await stored(A.page, I.ns + ':data:' + newName)) && await nAns(A.page) === 6, 'after a reload the new profile is there and this profile has its 6 answers');
  // Open it
  r = await choose(A.page, Object.assign({}, fileB3, {db: Object.assign({}, fileB3.db, {answers: fileB3.db.answers.concat([])})}), false);
  await A.page.evaluate(n => { useProfile(n); show('settings'); }, newName);
  check(await A.page.evaluate(() => PROFILE) === newName && await nAns(A.page) === 7, 'the new profile opens with the file\'s 7 answers');
  await A.page.evaluate(n => { useProfile(n); show('settings'); }, I.profile);

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
      // a refused progress write leaves the backup written just before it, holding the progress as it is
      const changed = Object.keys(after).filter(k => after[k] !== before[k]);
      check(changed.every(k => k === fi.backup && JSON.parse(after[k]).slice(-1)[0].data === before[fi.data]) && Object.keys(before).every(k => k in after),
        'the stored progress and history are as they were', changed.join(', '));
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

  check(!A.errors.length && !B.errors.length, 'no page errors', A.errors.concat(B.errors).slice(0, 2).join('; '));
  await A.ctx.close(); await B.ctx.close();
  await browser.close();
  fs.rmSync(TMP, {recursive: true, force: true});
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
