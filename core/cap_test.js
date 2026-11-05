/* The answer history past 20,000 entries (LOG_MAX), Louis's decision of 2026-11-05: no silent
 * cut. Past the cap the page offers Export and lets the student remove the oldest entries; the
 * question names how many and their dates and needs an explicit OK; until then nothing is
 * removed and new entries go on being added, in storage and in Export.
 *
 *     node cap_test.js
 */
const fs = require('fs');
const L = require('./check_lib');
const NAME = 'cap_test.js';
const {check} = L;
L.PAGE.need(NAME);
(async () => {
  const {browser} = await L.launch(NAME);
  const {ctx, page: o, errors} = await L.openFile(browser, {});
  const said = []; o.removeAllListeners('dialog');
  let answer = false; o.on('dialog', d => { said.push(d.type() + ': ' + d.message()); (answer ? d.accept() : d.dismiss()).catch(() => {}); });
  await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
  const stored = () => o.evaluate(() => JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]'));
  // exactly LOG_MAX entries, one a day apart in seconds, the oldest first
  await o.evaluate(() => { const t0 = Math.round(Date.now() / 1000) - 86400 * 400; LOG = [];
    for(let i = 0; i < LOG_MAX; i++) LOG.push([t0 + i * 60, 'abcdef01', 1, 'quiz', 'seeded', 'knew', 'mc', 'concept', '', null]);
    saveLog(); });
  check(await o.evaluate(() => !document.getElementById('capwarn')), 'at exactly 20,000 entries: no notice');
  // the 20,001st entry: nothing removed, the notice with the count, Export, Remove, Not now
  await o.evaluate(() => { record(QUESTIONS[0], 'correct', 0, 4000); saveNow(); });
  await o.waitForTimeout(200);
  const s1 = await stored();
  const n1 = await o.evaluate(() => { const d = document.getElementById('capwarn'); return d ? {text: d.textContent, exp: !!document.getElementById('capExport'), trim: !!document.getElementById('capTrim'), later: !!document.getElementById('capLater')} : null; });
  check(s1.length === 20001 && !!n1 && /20,001 entries, more than 20,000/.test(n1.text) && /Nothing is removed unless you choose/.test(n1.text) && n1.exp && n1.trim && n1.later,
    'past 20,000 entries: nothing is removed, and a notice gives the count and offers Export, Remove the oldest entries and Not now', {stored: s1.length, notice: n1 && n1.text.slice(0, 160)});
  // Export holds every entry
  const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => document.getElementById('capExport').click())]);
  const ex = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : {};
  check(Array.isArray(ex.log) && ex.log.length === 20001, 'the notice\'s Export holds all 20,001 entries', ex.log && ex.log.length);
  // Remove, the question cancelled: nothing removed; the question names how many and their dates
  const n0 = said.length;
  answer = false;
  await o.evaluate(() => document.getElementById('capTrim').click());
  const q = said.slice(n0).find(x => /^confirm: Remove the oldest 1 entry/.test(x));
  const s2 = await stored();
  const localDay = t => { const d = new Date(t * 1000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  check(!!q && q.includes('from ' + localDay(s1[0][0]) + ' to ' + localDay(s1[0][0])), 'the question\'s dates are those of the entries it removes, on this device\'s calendar', q);
  check(!!q && /from \d{4}-\d\d-\d\d to \d{4}-\d\d-\d\d/.test(q) && /20,000 entries stay/.test(q) && /cannot be undone/.test(q) && s2.length === 20001 && await o.evaluate(() => !!document.getElementById('capwarn')),
    'Remove the oldest entries asks first, naming how many and their dates; cancelled, nothing is removed and the notice stays', {q, stored: s2.length});
  // Not now: the notice goes; new answers while the decision is pending are kept, nothing removed
  await o.evaluate(() => document.getElementById('capLater').click());
  await o.evaluate(() => { record(QUESTIONS[1], 'wrong', 0, 4000); saveNow(); record(QUESTIONS[2], 'correct', 0, 4000); saveNow(); });
  await o.waitForTimeout(200);
  const s3 = await stored();
  check(s3.length === 20003 && s3[0][4] === 'seeded' && await o.evaluate(() => !document.getElementById('capwarn')),
    'Not now: the notice goes for this visit; new answers while the decision waits are added and nothing is removed (20,003 stored)', s3.length);
  // Settings shows the count and the same choice; confirmed, the oldest 3 go and 20,000 stay
  await o.evaluate(() => show('settings'));
  const btn = await o.evaluate(() => { const b = document.getElementById('btnCapTrim'); return b ? b.textContent : null; });
  answer = true;
  const oldest = s3.slice(0, 3).map(e => JSON.stringify(e)), keptFirst = JSON.stringify(s3[3]);
  await o.evaluate(() => document.getElementById('btnCapTrim').click());
  await o.waitForTimeout(200);
  const s4 = await stored();
  check(btn && /Remove the oldest 3/.test(btn) && s4.length === 20000 && JSON.stringify(s4[0]) === keptFirst && !s4.some(e => oldest.includes(JSON.stringify(e))),
    'Settings offers the same choice; confirmed, exactly the oldest 3 are removed and 20,000 stay', {btn, stored: s4.length});
  // a reload with 20,000 again: no notice; with more, the notice comes back on the next visit
  await o.reload(); await o.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  await o.waitForTimeout(300);
  check(await o.evaluate(() => !document.getElementById('capwarn')), 'a reload at 20,000 entries: no notice');
  // a tab that does not write the profile removes nothing
  const b2 = await ctx.newPage(); b2.on('dialog', d => d.accept().catch(() => {}));
  await o.evaluate(() => { record(QUESTIONS[3], 'correct', 0, 4000); saveNow(); });
  await b2.goto(o.url()); await b2.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  await b2.waitForFunction(() => WRITER !== 'pending', null, {timeout: 8000}).catch(() => {});
  const ro = await b2.evaluate(() => { window.__a = null; window.alert = m => { window.__a = m; }; window.confirm = () => true; const r = trimOldest(); return {r, writer: WRITER, alert: window.__a, n: JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE)).length}; });
  check(HAS_LOCKS_OK(ro) && !ro.r && ro.n === 20001, 'a tab that does not hold the profile removes nothing', ro);
  const roUI = await b2.evaluate(() => { show('settings'); return {notice: !!document.getElementById('capwarn'), btn: !!document.getElementById('btnCapTrim')}; });
  check(!roUI.notice && !roUI.btn, 'a tab that does not hold the profile shows neither the notice nor the Settings button', roUI);
  await b2.close();
  // the next visit past the cap: the notice again
  await o.reload(); await o.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  await o.waitForFunction(() => WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
  await o.waitForTimeout(500);
  check(await o.evaluate(() => !!document.getElementById('capwarn')), 'the next visit with the history past 20,000: the notice again, before any answer');
  // a switch to another profile already past the cap: its notice, before any answer
  await o.evaluate(() => { const t0 = Math.round(Date.now() / 1000) - 86400 * 300; const l = [];
    for(let i = 0; i < LOG_MAX + 10; i++) l.push([t0 + i * 60, 'abcdef02', 1, 'quiz', 'seeded', 'knew', 'mc', 'concept', '', null]);
    localStorage.setItem(NS + ':log:other-cap', JSON.stringify(l)); const w = document.getElementById('capwarn'); if(w) w.remove(); useProfile('other-cap'); });
  await o.waitForFunction(() => PROFILE === 'other-cap' && (WRITER === 'held' || WRITER === 'none'), null, {timeout: 8000}).catch(() => {});
  await o.waitForTimeout(500);
  const sw = await o.evaluate(() => { const d = document.getElementById('capwarn'); return d ? d.textContent.slice(0, 80) : null; });
  check(!!sw && /other-cap/.test(sw) && /20,010 entries/.test(sw), 'a switch to a profile already past 20,000: its notice, before any answer', sw);
  await o.evaluate(n => useProfile(n), 'me');
  await o.waitForFunction(() => PROFILE === 'me' && (WRITER === 'held' || WRITER === 'none'), null, {timeout: 8000}).catch(() => {});
  // Import's merge does not cut
  const merged = await o.evaluate(() => { const extra = []; for(let i = 0; i < 5; i++) extra.push([1 + i, 'fffffff' + i, 1, 'quiz', 'x', '', 'mc', 'concept', '', null]); return mergedLog(LOG, extra).length - LOG.length; });
  check(merged === 5, 'Import\'s merge past 20,000 entries cuts nothing (5 added, 5 more)', merged);
  check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
  await ctx.close();
  {
    // storage full: the removal frees room, and the progress refused before is then stored; this tab's
    // per-tab record keeps every remaining entry (after an Import-like copy of the history); the cap
    // notice does not cover the storage notice (the review of 159ae5c, M1, M2 and the overlap)
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
    const {ctx: c2, page: p, errors: e2} = await L.openFile(browser, {}, ORIGIN);
    p.on('dialog', d => d.accept().catch(() => {}));
    await p.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
    await p.evaluate(() => { const t0 = Math.round(Date.now() / 1000) - 86400 * 400; LOG = [];
      for(let i = 0; i < LOG_MAX + 4; i++) LOG.push([t0 + i * 60, 'abcdef01', 1, 'quiz', 'seeded', 'knew', 'mc', 'concept', '', null]);
      saveLog(); record(QUESTIONS[0], 'correct', 0, 4000); saveNow();
      LOG = LOG.map(e => e.slice());                                   // as a history-only Import or Put back leaves it: copies
      record(QUESTIONS[1], 'correct', 0, 4000); saveNow(); });
    // storage full now: the next answer's progress is refused, and its history held
    // less room than what is stored minus this tab's record: even with the record removed, the progress does not fit
    await p.evaluate(() => { let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; }
      const rk = myPendingKey(), rl = (localStorage.getItem(rk) || '').length + rk.length; window.__originCap = t - rl - 1; record(QUESTIONS[2], 'wrong', 0, 4000); saveNow(); });
    const before = await p.evaluate(() => ({refused: FAILED.has(keyFor(PROFILE)), page: DB.answers.length, prog: JSON.parse(localStorage.getItem(keyFor(PROFILE))).answers.length,
      over: !!document.getElementById('capwarn') && !!document.getElementById('savewarn')}));
    // both notices on screen, the cap notice shown after the storage notice (as when the answer that
    // passes 20,000 comes after a refused save): the storage notice's Export is not covered
    const covered = await p.evaluate(() => { const c = document.getElementById('capwarn'); if(c) c.remove(); CAP_SHOWN.delete(PROFILE); capNotice(); const b = document.getElementById('savewarnExport'); if(!b) return 'no export button'; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el && el.closest('#savewarn') ? 'visible' : (el ? (el.closest('[id]') || el).id : 'none'); });
    const r = await p.evaluate(() => { const ok = trimOldest(); return {ok, refused: FAILED.has(keyFor(PROFILE)), stored: JSON.parse(localStorage.getItem(logKey())).length, page: LOG.length,
      prog: JSON.parse(localStorage.getItem(keyFor(PROFILE))).answers.length, pageAnswers: DB.answers.length}; });
    check(before.refused && r.ok && !r.refused && r.stored === 20000 && r.prog === r.pageAnswers,
      'storage full: removing the oldest entries frees room; the shorter history is stored, and the progress refused before is then stored', {before, r});
    check(before.over && covered === 'visible', 'storage full past the cap: the cap notice does not cover the storage notice\'s Export', {both: before.over, covered});
    await p.evaluate(() => { window.__originCap = null; record(QUESTIONS[3], 'correct', 0, 4000); saveNow(); });   // room again: the record is written
    const rec = await p.evaluate(() => { try { const x = JSON.parse(localStorage.getItem(myPendingKey())); return x ? x.log.length : null; } catch(e){ return 'unreadable'; } });
    const want = await p.evaluate(() => NEW_LOGS[PROFILE].length);
    check(rec === want && want === 4, 'after a copy of the history and a removal, this tab\'s per-tab record keeps every entry answered since it took the profile (4)', {rec, want});
    check(!e2.length, 'storage full and the cap: no page errors', e2.slice(0, 2).join('; '));
    await c2.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
function HAS_LOCKS_OK(ro){ return ro.writer === 'other' || ro.writer === 'none'; }
