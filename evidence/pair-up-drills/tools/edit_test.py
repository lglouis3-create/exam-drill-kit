import sys
p = sys.argv[1]
s = open(p).read()
def rep(a, b):
    global s
    assert s.count(a) == 1, ('count', s.count(a), a[:80])
    s = s.replace(a, b)

rep("const fs = require('fs'), path = require('path');", "const fs = require('fs'), path = require('path'), os = require('os');")

rep(""" * cell a Show button, one shown, Show all, Hide again, another cover choice.
 *""", """ * cell a Show button, one shown, Show all, Hide again, another cover choice; a tap on
 * Skip or an answer within 350 ms of Next (the end of a double tap) is not taken.
 * `near`: after a row's own answer and its alts, the answers offered come from the
 * rows with the same `near` value first (Intro to Pharmacology's rxAnswers and
 * rxOptions: the same section first).
 *
 * Persistence, in a second browser context with every mode's misses and a best score
 * per set and mode saved: a reload brings them back and the misses lead the round;
 * Export progress carries them and Import into a new profile brings them back; each
 * profile keeps its own; a reload 400 ms after Check keeps the new score, a reload at
 * once after Check is reported (the core writes 150 ms after the last change); with
 * storage denied and full the student is told, the stored progress is left as it was,
 * and the next change after storage works is saved with everything earlier; a saved
 * value in another shape is read as none and the tables still open.
 *
 * PUD_SHOTS=<folder> writes screenshots there.
 *""")

rep("""/* The scratch course's data: Intro to Pharmacology's sets and tables, in place of""",
"""const SHOTS = process.env.PUD_SHOTS || '';
const DENY = () => { const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if(window.__deny === 'denied') throw new DOMException('The operation is insecure.', 'SecurityError');
    if(window.__deny === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return orig.call(this, k, v); }; };

/* `near`: the answers after the item's own and its alts come from items with the same `near` value first */
function nearBad(S, tables){
  const bad = []; let n = 0;
  for(const t of tables) for(const m of t.modes){
    if(!m.near) continue;
    const all = S.items(t, m);
    for(const it of all){
      n++;
      const o = S.options(t, m, it, all), alts = new Set(m.alts ? [].concat(it.row[m.alts] || []) : []);
      let pool = all.filter(x => x.id !== it.id);
      if(m.distinct) pool = pool.filter(x => x.row[m.distinct] !== it.row[m.distinct]);
      const same = new Set(pool.filter(x => x.row[m.near] === it.row[m.near]).map(x => x.ans));
      same.delete(it.ans); alts.forEach(a => same.delete(a));
      const extra = o.filter(a => a !== it.ans && !alts.has(a));
      if(extra.filter(a => same.has(a)).length !== Math.min(extra.length, same.size)) bad.push(`${t.id}/${m.id}/${it.id}`);
    }
  }
  return {bad, n};
}

/* The scratch course's data: Intro to Pharmacology's sets and tables, in place of""")

rep("""  { const r = badOptions(S, IP.tables); check(!r.bad.length, `every item of its two tables is offered its answers, its own among them (${r.n} items)`, r.bad.slice(0, 6).join(', ')); }""",
"""  { const r = badOptions(S, IP.tables); check(!r.bad.length, `every item of its two tables is offered its answers, its own among them (${r.n} items)`, r.bad.slice(0, 6).join(', ')); }
  { const r = nearBad(S, IP.tables); check(r.n === 78 && !r.bad.length, `after its own line and its flipped twin, each drug is offered the lines or drugs of its own section first (${r.n} items in the modes with \\`near\\`)`, r.bad.slice(0, 6).join(', ')); }""")

rep("""    const ev = (f, a) => page.evaluate(f, a);
    const nav =""", """    const ev = (f, a) => page.evaluate(f, a);
    const settle = () => page.waitForTimeout(370);   // a tap within 350 ms of a card being drawn is not taken
    const nav =""")

rep("""    await page.click(`#v-rt-ip-rx [data-ptans="${await optSel(x.ans)}"]`);""", """    await settle(); await page.click(`#v-rt-ip-rx [data-ptans="${await optSel(x.ans)}"]`);""")
rep("""    await page.click(`#v-rt-ip-rx [data-ptans="${x.opts.findIndex(o => o !== x.ans)}"]`);""", """    await settle(); await page.click(`#v-rt-ip-rx [data-ptans="${x.opts.findIndex(o => o !== x.ans)}"]`);""")
rep("""    for(;;){ x = await cur(); await page.click(`#v-rt-ip-rx [data-ptans="${x.opts.indexOf(x.ans)}"]`);""", """    for(;;){ x = await cur(); await settle(); await page.click(`#v-rt-ip-rx [data-ptans="${x.opts.indexOf(x.ans)}"]`);""")
rep("""    await page.click(`#v-rt-ip-pt [data-ptans="${pt.all.indexOf(pt.ans)}"]`);""", """    await settle(); await page.click(`#v-rt-ip-pt [data-ptans="${pt.all.indexOf(pt.ans)}"]`);""")

rep("""    check(await ev(() => FX.api('pair-up-drills').state('ip-pt').i === 1), 'Enter goes on to the next row');""",
"""    check(await ev(() => FX.api('pair-up-drills').state('ip-pt').i === 1), 'Enter goes on to the next row');
    // a double tap on Next: its second tap lands on the new card (Skip sits where Next was) and is not taken
    { await settle();
      const T0 = await ev(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {i: T.i, ans: T.queue[T.i].ans, opts: T.opts}; });
      await page.click(`#v-rt-ip-pt [data-ptans="${T0.opts.indexOf(T0.ans)}"]`);
      const dbl = await ev(() => { document.querySelector('#v-rt-ip-pt [data-ptnext]').click(); document.querySelector('#v-rt-ip-pt [data-ptskip]').click();
        document.querySelector('#v-rt-ip-pt [data-ptans]').click(); const T = FX.api('pair-up-drills').state('ip-pt'); return {i: T.i, redo: T.redo.length, result: !!T.result}; });
      check(dbl.i === T0.i + 1 && dbl.redo === 0 && !dbl.result, 'a tap on Skip or on an answer within 350 ms of Next is not taken', dbl);
      await settle(); await page.click('#v-rt-ip-pt [data-ptskip]');
      const sk = await ev(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {i: T.i, redo: T.redo.length}; });
      check(sk.i === T0.i + 2 && sk.redo === 1, 'Skip after that goes on and puts the row in the redo list', sk); }""")

rep("""    check(await ev(() => document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length) === 12, 'Cover symptoms covers the 12 symptom cells only');""",
"""    check(await ev(() => document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length) === 12, 'Cover symptoms covers the 12 symptom cells only');
    if(SHOTS) await page.screenshot({path: path.join(SHOTS, 'cover-symptoms.png')});""")

rep("""    check(c1.best === '5/7', 'the best score is kept in the progress (DB.pairup)', c1.best);""",
"""    check(c1.best === '5/7', 'the best score is kept in the progress (DB.pairup)', c1.best);
    if(SHOTS) await page.screenshot({path: path.join(SHOTS, 'pairup-checked.png')});""")

PERSIST = open(sys.argv[2]).read().rstrip('\n')
rep("""    await ctx.close();""", PERSIST)
open(p, 'w').write(s)
print('ok')
