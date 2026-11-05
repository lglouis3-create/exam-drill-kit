/* Quota-pressure reproduction (#47 on top of #45). Run from a built course's src/:
 *     node quota_repro.js <room in characters> <answers>
 * The whole site's storage is capped at what is stored after seeding 300 history entries and a
 * first answer, plus <room>. After each answer it prints what persists as study progress, what
 * persists as history, what this tab's per-tab record holds, and what is only on the page
 * (and so recoverable only by Export). Prints one JSON line per answer, then a summary line.
 */
const L = require('./check_lib');
const NAME = 'quota_repro.js';
const ROOM = Number(process.argv[2] || 1200), N = Number(process.argv[3] || 12);
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
  return true;
};
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
(async () => {
  const {browser} = await L.launch(NAME);
  const {ctx, page: o, errors} = await L.openFile(browser, {}, ORIGIN);
  await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
  await o.evaluate(n => { const t = Math.round(Date.now() / 1000) - 86400; LOG = [];
    for(let i = 0; i < n; i++) LOG.push([t + i, 'abcdef01', 1, 'quiz', 'seeded', 'knew', 'mc', 'concept', '', null]);
    saveLog(); }, 300);
  await o.reload();
  await o.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  await o.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 8000}).catch(() => {});
  const next = () => o.evaluate(() => { const b = document.getElementById('btnNext'); if(b) b.click(); });
  // a first answer so a progress record and (with #45) a per-tab record exist, then the cap
  await o.evaluate(() => startQuiz(null, null)); await o.evaluate(ANSWER, true); await o.waitForTimeout(400);
  await o.evaluate(room => { let t = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } window.__originCap = t + room; window.__base = t; }, ROOM);
  const state = () => o.evaluate(() => {
    const get = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return 'unreadable'; } };
    const d = get(NS + ':data:' + PROFILE) || {answers: []}, l = get(NS + ':log:' + PROFILE) || [];
    let rec = null; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k.startsWith(NS + ':pending:' + PROFILE + ':')){ const r = get(k); rec = Math.max(rec || 0, (r && r.db && r.db.answers || []).length); } }
    const storedAt = new Set((d.answers || []).map(a => a.at));
    const recAts = new Set(); for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k.startsWith(NS + ':pending:' + PROFILE + ':')){ const r = get(k); for(const a of (r && r.db && r.db.answers || [])) recAts.add(a.at); } }
    const logSet = new Set(l.map(e => JSON.stringify(e)));
    let used = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); used += k.length + localStorage.getItem(k).length; }
    return {
      pageAnswers: DB.answers.length, storedProgress: (d.answers || []).length,
      answersOnlyOnPage: DB.answers.filter(a => !storedAt.has(a.at) && !recAts.has(a.at)).length,
      answersOnlyInRecord: DB.answers.filter(a => !storedAt.has(a.at) && recAts.has(a.at)).length,
      pageHistory: LOG.length, storedHistory: l.length, historyOnlyOnPage: LOG.filter(e => !logSet.has(JSON.stringify(e))).length,
      historyStoredNotOnPage: l.filter(e => !new Set(LOG.map(x => JSON.stringify(x))).has(JSON.stringify(e))).length,
      record: rec, room: window.__originCap - used,
      notice: ((document.getElementById('savewarn') || {}).textContent || '').slice(0, 60)
    };
  });
  let last = null;
  for(let i = 0; i < N; i++){
    await o.evaluate(i => record(QUESTIONS[i % QUESTIONS.length], i % 4 ? 'correct' : 'wrong', 0, 4000), i); await o.waitForTimeout(250);
    last = await state(); console.log(JSON.stringify(Object.assign({answer: i + 1}, last)));
  }
  await o.evaluate(() => show('settings'));
  const [dl] = await Promise.all([o.waitForEvent('download', {timeout: 5000}).catch(() => null), o.evaluate(() => document.getElementById('btnExport').click())]);
  const ex = dl ? JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8')) : {};
  console.log('SUMMARY ' + JSON.stringify({room: ROOM, answers: N, final: last, exportAnswers: ex.db && ex.db.answers.length, exportHistory: ex.log && ex.log.length, errors: errors.slice(0, 2)}));
  await ctx.close(); await browser.close();
})().catch(e => { console.log('STOPPED ' + e.stack); process.exit(1); });
