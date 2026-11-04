/* Storage use in Settings and its warning (review/storage-usage-proposal.md §3 items 1
 * and 2; views.js storageUse, storageSection, storageWarnHtml, quizStorageWarn).
 *
 * The test seeds localStorage with keys of known lengths: other profiles of this drill,
 * copies kept by Import, a preview copy, another course on the core (progress with
 * "v":2), a drill not on the core (progress with no "v") and a key of no drill. It
 * works out the expected figures from the keys the browser holds, with its own code,
 * and checks:
 *   1. Settings: the site's total, its percentage of 5,242,880, the space left, this
 *      drill's progress, history, preview copies, copies kept by Import and their
 *      number, and this profile's answers kept and recorded;
 *   2. the warning, in Settings and in the Quiz tab, absent when the space left equals
 *      the larger need and present when it is one character less, with the need set
 *      once by the largest profile and once by a course whose preview has not copied
 *      its keys; it names the largest items, offers Export progress and Delete the
 *      copies, and deletes nothing until that is chosen and confirmed;
 *   3. the wording that the figures are an estimate and the limit differs by browser.
 *
 *     node storage_use_test.js
 */
const L = require('./check_lib');
const NAME = 'storage_use_test.js';
const {check} = L;
L.PAGE.need(NAME);

const LIMIT = 5 * 1024 * 1024;   // the denominator the proposal sets (§3 item 1)
const fmt = n => n.toLocaleString('en-US');
const pad = (c, n) => c.repeat(n);

// every key and value the browser holds now, read in the page
const listing = p => p.evaluate(() => { const o = []; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); o.push([k, localStorage.getItem(k)]); } return o; });
// the expected figures, from the listing; `core` is the set of namespaces the test seeded as on the core
function expected(list, ns, core){
  const size = ([k, v]) => k.length + v.length;
  const total = list.reduce((a, kv) => a + size(kv), 0);
  const sum = pre => list.filter(([k]) => k.startsWith(pre)).reduce((a, kv) => a + size(kv), 0);
  const profiles = {};
  for(const [k, v] of list){
    const m = /^([^:]+):(data|log):(.+)$/.exec(k);
    if(m && core.includes(m[1])) profiles[m[1] + '/' + m[3]] = (profiles[m[1] + '/' + m[3]] || 0) + k.length + v.length;
  }
  const profileNeed = Math.max(0, ...Object.values(profiles));
  let previewNeed = 0;
  for(const c of core){
    if(list.some(([k]) => k.startsWith(c + '-preview:'))) continue;
    previewNeed = Math.max(previewNeed, list.filter(([k]) => k.startsWith(c + ':')).reduce((a, [k, v]) => a + k.length + 8 + v.length, 0));
  }
  let copies = 0;
  for(const [k, v] of list) if(k.startsWith(ns + ':backup:')) copies += JSON.parse(v).length;
  const progress = sum(ns + ':data:'), history = sum(ns + ':log:'), copiesChars = sum(ns + ':backup:'), preview = sum(ns + '-preview:');
  return {total, left: LIMIT - total, pct: (100 * total / LIMIT).toFixed(1) + '%', progress, history, preview, copies: copiesChars, ncopies: copies,
          other: sum(ns + ':') - progress - history - copiesChars, profileNeed, previewNeed, need: Math.max(profileNeed, previewNeed)};
}
const shown = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#v-settings [data-st]')].map(e => [e.dataset.st, e.textContent.trim()])));
const settled = p => p.evaluate(() => new Promise(r => setTimeout(r, 30)));   // the Quiz tab's warning follows its pane's drawing (a MutationObserver)
const warnIn = (p, pane) => p.evaluate(pane => { const w = document.querySelector(`#v-${pane} [data-storage-warn]`); return w ? w.textContent.replace(/\s+/g, ' ') : null; }, pane);
// a filler key of no drill, sized so that the space left is `left`; `list` is read after the filler is removed
async function fillTo(p, ns, core, left){
  await p.evaluate(() => localStorage.removeItem('zzfill'));
  const e = expected(await listing(p), ns, core);
  const n = LIMIT - left - e.total - 'zzfill'.length;
  const kept = await p.evaluate(n => { try { localStorage.setItem('zzfill', 'z'.repeat(n)); return true; } catch(e){ return false; } }, n);
  if(!kept){ const r = new Error(`this browser refused to store ${fmt(e.total + n + 'zzfill'.length)} characters in all, below the 5,242,880 the page assumes`); r.refused = true; throw r; }
  return expected(await listing(p), ns, core);
}
/* A part that needs the site near 5,242,880 characters: in a browser whose limit is lower
   (Safari's is not measured), it is skipped with the reason, never passed. */
async function nearLimit(p, label, run){
  try { await run(); }
  catch(e){ if(!e.refused) throw e; L.skip(label, e.message); }
  await p.evaluate(() => localStorage.removeItem('zzfill'));
}
async function both(p){
  await p.evaluate(() => { show('settings'); });
  const s = await warnIn(p, 'settings');
  await p.evaluate(() => { show('quiz'); renderQuiz(); });
  await settled(p);
  return {settings: s, quiz: await warnIn(p, 'quiz'), first: await p.evaluate(() => { const f = document.getElementById('v-quiz').firstElementChild; return !!(f && f.hasAttribute('data-storage-warn')); })};
}

(async () => {
  const {browser} = await L.launch(NAME);
  const {ctx, page: p, errors} = await L.openFile(browser);
  const ns = await p.evaluate(() => NS);
  const core = [ns, 'kitother'];

  console.log('\n=== The figures in Settings ===');
  // one answer through the page, so the profile has a kept answer and a count
  const ids = await p.evaluate(() => QUESTIONS.filter(q => !q.type && !q.multi).map(q => q.id));
  await L.quizOn(p, ids[0]);
  await p.evaluate(() => { const q = Q.current; document.querySelector(`#v-quiz button[data-o="${q.options.findIndex(o => o.correct)}"]`).click(); saveNow(); });
  const now = Date.now();
  await p.evaluate(({ns, now, a, b, c, d, f}) => {
    localStorage.setItem(ns + ':data:big', '{"v":2,"answers":[],"pad":"' + a + '"}');
    localStorage.setItem(ns + ':log:big', '[["' + b + '"]]');
    localStorage.setItem(ns + ':backup:big', JSON.stringify([{at: now - 2, data: c, why: 'replace'}, {at: now - 1, data: c, why: 'replace'}]));
    localStorage.setItem(ns + ':backup:' + PROFILE, JSON.stringify([{at: now, data: '{"v":2,"answers":[]}', why: 'replace'}]));
    localStorage.setItem(ns + '-preview:profile', 'TestUser');
    localStorage.setItem(ns + '-preview:data:TestUser', '{"v":2,"answers":[]}');
    // a drill not on the core: progress with no "v", larger than any profile on the core
    localStorage.setItem('pkold:data:me', '{"concepts":{},"answers":[],"pad":"' + d + '"}');
    localStorage.setItem('kitother:data:me', '{"v":2,"answers":[],"pad":"' + f + '"}');
    localStorage.setItem('bdk2:log', '[' + f + ']');
  }, {ns, now, a: pad('a', 200000), b: pad('b', 100000), c: pad('c', 1000), d: pad('d', 600000), f: pad('f', 50000)});
  await p.evaluate(() => { DB.qn += 4999; show('settings'); });
  let e = expected(await listing(p), ns, core);
  let s = await shown(p);
  check(s.total === fmt(e.total), `the site's total counts every key of the origin, key and value (${fmt(e.total)})`, s.total);
  check(s.pct === e.pct, `the total as a percentage of 5,242,880 (${e.pct})`, s.pct);
  check(s.left === fmt(e.left), `the space left is 5,242,880 minus the total (${fmt(e.left)})`, s.left);
  check(s.progress === fmt(e.progress) && s.history === fmt(e.history), `this drill's progress and history, every profile (${fmt(e.progress)}, ${fmt(e.history)})`, [s.progress, s.history]);
  check(s.preview === fmt(e.preview), `this drill's preview copies (${fmt(e.preview)})`, s.preview);
  check(s.copies === fmt(e.copies) && s.ncopies === '3', `the copies kept by Import: ${fmt(e.copies)} characters, 3 copies in two lists`, [s.copies, s.ncopies]);
  check(s.other === fmt(e.other), `the rest of this drill's keys (${fmt(e.other)})`, s.other);
  const {kept, qn} = await p.evaluate(() => ({kept: DB.answers.length, qn: DB.qn}));
  check(kept === 1 && s.kept === '1' && s.qn === fmt(qn) && qn === 5000, 'the profile\'s answers kept (1) and recorded in all (DB.qn, 5,000)', [s.kept, s.qn]);
  check(e.profileNeed > e.previewNeed && new RegExp(`now\\s+${fmt(e.profileNeed)} characters`).test(s.how) && new RegExp(`now ${fmt(e.previewNeed)} characters`).test(s.how),
    `how the warning point is set names both needs: the largest profile (${fmt(e.profileNeed)}) and a first preview (${fmt(e.previewNeed)}); a drill with no "v" is not one of them`, s.how);
  check(s.how.includes(`${fmt(LIMIT - e.need)} characters stored`), `the warning point (${fmt(LIMIT - e.need)} characters stored)`, s.how);

  console.log('\n=== The estimate ===');
  check(/an estimate/.test(s.estimate) && /number of characters stored/.test(s.estimate) && /bytes a browser writes to disk can differ/.test(s.estimate),
    'Settings says the figures are an estimate, counted in characters, not bytes', s.estimate);
  check(/Chromium 153/.test(s.estimate) && s.estimate.includes('5,242,873') && /"up to 5 MiB"/.test(s.estimate) && /Safari's limit has not been measured/.test(s.estimate),
    'Settings gives the measured Chromium limit, MDN\'s "up to 5 MiB" and that Safari is not measured', s.estimate);
  check(/the warning can come early or late/.test(s.estimate), 'Settings says the warning can come early or late in another browser', s.estimate);

  console.log('\n=== The warning at the boundary: the largest profile ===');
  await nearLimit(p, 'the warning at the boundary set by the largest profile', async () => {
    e = await fillTo(p, ns, core, e.need);
    let w = await both(p);
    check(e.left === e.need && e.need === e.profileNeed, `seeded: space left ${fmt(e.left)} equals the need, set by the largest profile`, [e.left, e.need]);
    check(w.settings === null && w.quiz === null, 'no warning when the space left equals the need (Settings, Quiz tab)', w);
    e = await fillTo(p, ns, core, e.need - 1);
    w = await both(p);
    check(w.settings !== null && w.quiz !== null && w.first, 'a warning, first in the Quiz tab and in Settings, when the space left is one character less than the need', w);
    check(!!w.quiz && w.quiz.includes(`less than the space needed by one more profile the size of the largest one here (${fmt(e.profileNeed)} characters).`), 'the warning names the need (the largest profile)', w.quiz);
    check(!!w.quiz && /an estimate: the limit differs by browser/.test(w.quiz), 'the warning says it is an estimate and the limit differs by browser', w.quiz);
    const bigSize = (await listing(p)).filter(([k]) => k === ns + ':data:big').map(([k, v]) => k.length + v.length)[0];
    check(!!w.quiz && w.quiz.includes(`progress of "big" (this drill): ${fmt(bigSize)} characters`) && w.quiz.includes('zzfill'),
      'the warning names the largest items, with their sizes', w.quiz);
    const btns = await p.evaluate(() => [...document.querySelectorAll('#v-quiz [data-storage-warn] button')].map(b => b.textContent));
    check(btns[0] === 'Export progress' && btns[1] === 'Delete the 1 copy kept by Import', 'the warning offers Export progress and Delete the copies kept by Import', btns);
    check(await p.evaluate(ns => [':backup:big', ':backup:' + PROFILE, ':data:big', ':log:big'].every(k => localStorage.getItem(ns + k) !== null), ns), 'showing the warning deleted nothing');
    check(await p.evaluate(() => { document.querySelector('#v-quiz [data-storage-warn] [data-sw-export]').click(); return true; }), 'Export progress in the warning runs');
  });

  console.log('\n=== The warning at the boundary: a course whose preview has not copied it ===');
  await nearLimit(p, 'the warning at the boundary set by a first preview, and Delete the copies from it', async () => {
    await p.evaluate(({g}) => { localStorage.removeItem('zzfill'); localStorage.setItem('kitother:log:me', '[["' + g + '"]]'); localStorage.setItem('kitother:exam:me', '{}'); }, {g: pad('g', 400000)});
    e = await fillTo(p, ns, core, expected(await listing(p), ns, core).need);
    let w = await both(p);
    check(e.previewNeed > e.profileNeed && e.left === e.need, `seeded: the preview need (${fmt(e.previewNeed)}, each key 8 characters longer) is the larger, and the space left equals it`, [e.previewNeed, e.profileNeed, e.left]);
    check(w.settings === null && w.quiz === null, 'no warning when the space left equals the preview need', w);
    e = await fillTo(p, ns, core, e.need - 1);
    w = await both(p);
    check(w.settings !== null && w.quiz !== null, 'a warning when the space left is one character less than the preview need', w);
    check(!!w.quiz && w.quiz.includes(`the first opening of a preview of kitother, which copies its saved keys (${fmt(e.previewNeed)} characters).`), 'the warning names the preview need', w.quiz);

    console.log('\n=== Delete the copies, from the warning ===');
    await p.evaluate(() => { show('quiz'); renderQuiz(); });
    await settled(p);
    await p.evaluate(() => { window.__confirm = window.confirm; window.confirm = () => false; });
    await p.click('#v-quiz [data-storage-warn] [data-sw-delete]');   // the question answered No
    await settled(p);
    check(await p.evaluate(ns => localStorage.getItem(ns + ':backup:' + PROFILE) !== null, ns), 'Delete the copies, not confirmed, deletes nothing');
    await p.evaluate(() => { window.confirm = window.__confirm; });
    await p.click('#v-quiz [data-storage-warn] [data-sw-delete]');   // the confirm is accepted (check_lib)
    await settled(p);
    const after = await p.evaluate(ns => ({mine: localStorage.getItem(ns + ':backup:' + PROFILE), big: localStorage.getItem(ns + ':backup:big'),
      btn: !!document.querySelector('#v-quiz [data-storage-warn] [data-sw-delete]')}), ns);
    check(after.mine === null && after.big !== null, 'Delete the copies, confirmed, deletes this profile\'s copies only', after);
    check(!after.btn, 'the warning then offers no Delete button', after);
  });

  console.log('\n=== Storage that cannot be read ===');
  await ctx.close();
  const {ctx: c2, page: p2, errors: e2} = await L.openFile(browser, {}, () => {
    Object.defineProperty(window, 'localStorage', {configurable: true, get(){ throw new DOMException('blocked', 'SecurityError'); }});
  });
  await p2.evaluate(() => show('settings'));
  const t2 = await p2.textContent('#v-settings');
  check(/cannot read the browser's storage, so how much it holds is not shown/.test(t2) && !(await p2.$('[data-storage-warn]')), 'storage that cannot be read: Settings says so and shows no warning');
  await c2.close();

  check(!errors.length && !e2.length, 'no page errors', errors.concat(e2).slice(0, 3));
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.error(e); L.check(false, 'the test ran to the end', String(e && e.stack || e)); L.finish(NAME); });
