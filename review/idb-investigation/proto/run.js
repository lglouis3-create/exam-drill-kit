// Cross-tab IndexedDB prototype driver. Usage: node run.js <chromium|webkit>
// Prints one line per measured fact, prefixed with the engine name.
const pw = require('playwright');
const { start } = require('./server');

const engine = process.argv[2] || 'chromium';
const L = (...a) => console.log('[' + engine + '] ' + a.join(' '));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function analyse(label, state, tabs, expectedCompleted) {
  const seq = state.seq;
  let sawOk = 0, sawBad = 0, switches = 0, perTabMono = true;
  const lastI = {}, perTab = {}, dup = new Set(); let dups = 0;
  seq.forEach((e, k) => {
    if (e.saw === k) sawOk++; else sawBad++;
    if (k > 0 && seq[k - 1].tab !== e.tab) switches++;
    if (lastI[e.tab] !== undefined && e.i <= lastI[e.tab]) perTabMono = false;
    lastI[e.tab] = e.i;
    perTab[e.tab] = (perTab[e.tab] || 0) + 1;
    const key = e.tab + ':' + e.i; if (dup.has(key)) dups++; dup.add(key);
  });
  L(label, 'count=' + state.count, 'seq.length=' + seq.length,
    'expected=' + expectedCompleted, 'lost=' + (expectedCompleted - seq.length),
    'saw==position:' + sawOk + ' mismatched:' + sawBad, 'duplicates=' + dups,
    'per-tab order kept=' + perTabMono, 'tab switches in order=' + switches,
    'per tab=' + JSON.stringify(perTab));
}

(async () => {
  let browser;
  try { browser = await pw[engine].launch(); }
  catch (e) { L('LAUNCH FAILED', String(e.message).split('\n')[0]); process.exit(2); }
  L('launched', browser.version());
  const { server, port } = await start();
  const url = 'http://localhost:' + port + '/page.html';
  L('serving', url);
  const ctx = await browser.newContext();
  const newPage = async () => { const p = await ctx.newPage(); await p.goto(url); return p; };

  // T0: feature probe
  {
    const p = await newPage();
    L('T0 probe', JSON.stringify(await p.evaluate(() => durabilityProbe())));
    await p.close();
  }

  // T1: three tabs, concurrent read-modify-write transactions on one record
  for (const [dur, n] of [['default', 500], ['relaxed', 300], ['strict', 300]]) {
    const pages = [await newPage(), await newPage(), await newPage()];
    await pages[0].evaluate(() => idbReset());
    const t = Date.now() + 500;
    const t0 = Date.now();
    const tallies = await Promise.all(pages.map((p, k) => p.evaluate(([k, n, t, dur]) => idbRun('T' + k, n, t, dur), [k, n, t, dur])));
    const ms = Date.now() - t0 - 500;
    L('T1 idb durability=' + dur, 'tabs=3', 'tx per tab=' + n, 'results per tab=' + JSON.stringify(tallies), 'elapsed_ms~' + ms);
    const completed = tallies.reduce((a, x) => a + (x.complete || 0), 0);
    const { state } = await pages[0].evaluate(() => idbReadAll());
    analyse('T1 idb durability=' + dur, state, 3, completed);
    for (const p of pages) await p.close();
  }

  // T2: a tab closed while its transactions are in flight; a second tab writes and samples.
  for (let rep = 1; rep <= 3; rep++) {
    const survivor = await newPage();
    await survivor.evaluate(() => idbReset());
    const victim = await newPage();
    const ev = { created: new Set(), complete: new Set(), abort: new Set() };
    victim.on('console', (m) => {
      const t = m.text(); if (!t.startsWith('EV ')) return;
      const [, kind, i] = t.split(' '); ev[kind] && ev[kind].add(Number(i));
    });
    // survivor: its own writes plus a sampler that checks every snapshot for half-done transactions
    const survivorRun = survivor.evaluate(async () => {
      const db = await openDB();
      let snapshots = 0, inconsistent = 0, stop = false, mine = 0;
      const sampler = (async () => {
        while (!stop) {
          await new Promise((res) => {
            const tx = db.transaction(['kv', 'marks'], 'readonly');
            const st = tx.objectStore('kv').get('state');
            const mk = tx.objectStore('marks').getAllKeys();
            tx.oncomplete = () => {
              const s = st.result || { count: 0, seq: [] };
              const vEntries = new Set(s.seq.filter((e) => e.tab === 'V').map((e) => 'V:' + e.i));
              const vMarks = new Set(mk.result.filter((k) => String(k).startsWith('V:')));
              let ok = vEntries.size === vMarks.size && s.count === s.seq.length;
              if (ok) for (const k of vEntries) if (!vMarks.has(k)) { ok = false; break; }
              snapshots++; if (!ok) inconsistent++;
              res();
            };
          });
          await sleep(2);
        }
      })();
      const writes = [];
      for (let i = 0; i < 300; i++) { writes.push(rmwTx(db, 'S', i, 'default', false).then((r) => { if (r.result === 'complete') mine++; })); if (i % 5 === 4) await sleep(3); }
      await Promise.all(writes);
      await sleep(1500);
      stop = true; await sampler;
      db.close();
      return { snapshots, inconsistent, mine };
    });
    await victim.evaluate(() => idbCloseVictim('V', 5000));
    // close once the victim has reported some completions
    const want = 100 * rep;
    const deadline = Date.now() + 20000;
    while (ev.complete.size < want && Date.now() < deadline) await sleep(1);
    const atClose = { created: ev.created.size, complete: ev.complete.size };
    await victim.close();
    const sres = await survivorRun;
    await sleep(500);
    const { state, marks } = await survivor.evaluate(() => idbReadAll());
    const vEntries = new Set(state.seq.filter((e) => e.tab === 'V').map((e) => e.i));
    const vMarks = new Set(marks.filter((k) => String(k).startsWith('V:')).map((k) => Number(String(k).slice(2))));
    let completeMissing = 0; for (const i of ev.complete) if (!vEntries.has(i)) completeMissing++;
    let presentNotReported = 0; for (const i of vEntries) if (!ev.complete.has(i)) presentNotReported++;
    let entryNoMark = 0; for (const i of vEntries) if (!vMarks.has(i)) entryNoMark++;
    let markNoEntry = 0; for (const i of vMarks) if (!vEntries.has(i)) markNoEntry++;
    const maxV = Math.max(-1, ...vEntries);
    let gaps = 0; for (let i = 0; i <= maxV; i++) if (!vEntries.has(i)) gaps++;
    L('T2 close rep=' + rep,
      'victim created at close=' + atClose.created, 'victim complete events at close=' + atClose.complete,
      'victim complete events total=' + ev.complete.size, 'victim abort events=' + ev.abort.size,
      'victim entries persisted=' + vEntries.size, 'victim marks persisted=' + vMarks.size,
      'complete-but-missing=' + completeMissing, 'persisted-without-complete-event=' + presentNotReported,
      'entry-without-mark=' + entryNoMark, 'mark-without-entry=' + markNoEntry,
      'gaps below highest persisted i=' + gaps);
    L('T2 close rep=' + rep, 'survivor tx complete=' + sres.mine + '/300',
      'survivor snapshots=' + sres.snapshots, 'snapshots with a half-done transaction=' + sres.inconsistent);
    analyse('T2 close rep=' + rep, state, 2, state.seq.length);
    await survivor.close();
  }

  // T3: localStorage control
  for (const [gap, n] of [[-1, 300], [1, 100]]) {
    const pages = [await newPage(), await newPage(), await newPage()];
    await pages[0].evaluate(() => lsReset());
    await sleep(200);
    const t = Date.now() + 500;
    await Promise.all(pages.map((p, k) => p.evaluate(([k, n, t, gap]) => lsRun('T' + k, n, t, gap), [k, n, t, gap])));
    await sleep(500);
    const state = await pages[0].evaluate(() => lsRead());
    analyse('T3 localStorage gap=' + (gap < 0 ? 'none(sync)' : gap + 'ms'), state, 3, 3 * n);
    for (const p of pages) await p.close();
  }

  // T4: versionchange / blocked across tabs
  for (const policy of ['keep', 'close']) {
    const name = 'vc-' + policy;
    const a = await newPage(), b = await newPage();
    await a.evaluate(([n, p]) => vcOpen(n, 1, p), [name, policy]);
    await b.evaluate((n) => vcOpenAsync(n, 2, 'close'), name);
    await sleep(700);
    const aEv = await a.evaluate(() => vcState());
    const bEv1 = await b.evaluate(() => vcState());
    L('T4 versionchange old-tab policy=' + policy, 'old tab events=' + JSON.stringify(aEv.events),
      'new tab after 700ms: events=' + JSON.stringify(bEv1.events), 'result=' + bEv1.res);
    if (policy === 'keep') {
      await a.evaluate(() => vcClose());
      await sleep(700);
      const bEv2 = await b.evaluate(() => vcState());
      L('T4 versionchange old-tab policy=keep', 'after old tab close(): new tab events=' + JSON.stringify(bEv2.events), 'result=' + bEv2.res);
    }
    await a.close(); await b.close();
  }

  // T5: versionchange where the old tab is closed (page.close) instead of closing its connection
  {
    const name = 'vc-pageclose';
    const a = await newPage(), b = await newPage();
    await a.evaluate((n) => vcOpen(n, 1, 'keep'), name);
    await b.evaluate((n) => vcOpenAsync(n, 2, 'close'), name);
    await sleep(700);
    const bEv1 = await b.evaluate(() => vcState());
    await a.close();
    await sleep(1000);
    const bEv2 = await b.evaluate(() => vcState());
    L('T5 old tab page.close()', 'before: events=' + JSON.stringify(bEv1.events) + ' result=' + bEv1.res,
      'after: events=' + JSON.stringify(bEv2.events) + ' result=' + bEv2.res);
    await b.close();
  }

  await ctx.close();
  await browser.close();
  server.close();
  L('done');
})().catch((e) => { L('ERROR', e && e.stack); process.exit(1); });
