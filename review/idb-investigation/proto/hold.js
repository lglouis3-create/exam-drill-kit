// T6: does a readwrite transaction in tab B wait for tab A's open readwrite transaction?
// T7: tab A is closed while its readwrite transaction (with a put already made) is still open.
// Usage: node hold.js <chromium|webkit>
const pw = require('playwright');
const { start } = require('./server');
const engine = process.argv[2] || 'chromium';
const L = (...a) => console.log('[' + engine + '] ' + a.join(' '));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In the page: open a readwrite tx, put a value, then keep the tx alive with chained gets
// until holdMs has passed. Reports times relative to performance.timeOrigin-independent Date.now().
const HOLD = ([tag, holdMs]) => new Promise(async (resolve) => {
  const db = await openDB();
  const t0 = Date.now();
  const tx = db.transaction('kv', 'readwrite');
  const st = tx.objectStore('kv');
  let firstReq = null, gets = 0;
  st.put({ by: tag, at: t0 }, 'hold');
  const loop = () => {
    const r = st.get('hold');
    r.onsuccess = () => {
      gets++;
      if (firstReq === null) firstReq = Date.now();
      if (Date.now() - t0 < holdMs) loop();
    };
  };
  loop();
  tx.oncomplete = () => { db.close(); resolve({ tag, created: t0, firstRequestDone: firstReq, finished: Date.now(), result: 'complete', gets }); };
  tx.onabort = () => { db.close(); resolve({ tag, created: t0, firstRequestDone: firstReq, finished: Date.now(), result: 'abort', gets }); };
  console.log('HOLD started ' + t0);
});

(async () => {
  let browser;
  try { browser = await pw[engine].launch(); }
  catch (e) { L('LAUNCH FAILED', String(e.message).split('\n')[0]); process.exit(2); }
  const { server, port } = await start();
  const url = 'http://localhost:' + port + '/page.html';
  const ctx = await browser.newContext();
  const np = async () => { const p = await ctx.newPage(); await p.goto(url); return p; };

  for (let rep = 1; rep <= 3; rep++) {
    const a = await np(), b = await np();
    await a.evaluate(() => idbReset());
    const pa = a.evaluate(HOLD, ['A', 1000]);
    await sleep(200); // A's transaction exists before B's is created
    const pb = b.evaluate(HOLD, ['B', 0]);
    const [ra, rb] = await Promise.all([pa, pb]);
    L('T6 rep=' + rep, 'A created=0', 'A first request done=+' + (ra.firstRequestDone - ra.created) + 'ms',
      'A finished=+' + (ra.finished - ra.created) + 'ms', 'A gets=' + ra.gets, 'A=' + ra.result,
      '| B created=+' + (rb.created - ra.created) + 'ms', 'B first request done=+' + (rb.firstRequestDone - ra.created) + 'ms',
      'B finished=+' + (rb.finished - ra.created) + 'ms', 'B=' + rb.result,
      'B first request after A finished=' + (rb.firstRequestDone >= ra.finished - 5));
    await a.close(); await b.close();
  }

  // read-only reader in tab B while A holds the store: does it see A's uncommitted put?
  {
    const a = await np(), b = await np();
    await a.evaluate(() => idbReset());
    const pa = a.evaluate(HOLD, ['A', 1000]);
    await sleep(200);
    const rb = await b.evaluate(async () => {
      const db = await openDB();
      const t = Date.now();
      return new Promise((res) => {
        const tx = db.transaction('kv', 'readonly');
        const g = tx.objectStore('kv').get('hold');
        g.onsuccess = () => res({ waitedMs: Date.now() - t, value: g.result === undefined ? 'undefined' : JSON.stringify(g.result) });
      });
    });
    const ra = await pa;
    L('T6b readonly in B while A holds readwrite', 'B waited ms=' + rb.waitedMs, 'B saw=' + rb.value, 'A=' + ra.result,
      'A holding ms=' + (ra.finished - ra.created));
    await a.close(); await b.close();
  }

  for (let rep = 1; rep <= 3; rep++) {
    const a = await np(), b = await np();
    await a.evaluate(() => idbReset());
    a.evaluate(HOLD, ['A', 5000]).catch(() => {});
    await sleep(300);
    const tb = Date.now();
    // B: a readwrite transaction that only reads 'hold' (so it shows whether A's put survived)
    const pb = b.evaluate(async () => {
      const db = await openDB();
      const t = Date.now();
      return new Promise((res) => {
        const tx = db.transaction('kv', 'readwrite');
        const g = tx.objectStore('kv').get('hold');
        let seen;
        g.onsuccess = () => { seen = { at: Date.now(), value: g.result === undefined ? 'undefined' : JSON.stringify(g.result) }; };
        tx.oncomplete = () => { db.close(); res({ t, ...seen, result: 'complete' }); };
        tx.onabort = () => { db.close(); res({ t, result: 'abort' }); };
      });
    });
    await sleep(300);
    const tClose = Date.now();
    await a.close();
    const rb = await pb;
    L('T7 rep=' + rep, 'A closed while its readwrite tx (with a put) was open',
      'B created=+0ms', 'A page.close at=+' + (tClose - tb) + 'ms',
      'B read done=+' + (rb.at - tb) + 'ms', 'B=' + rb.result,
      'B saw hold record=' + rb.value);
    await b.close();
  }
  await ctx.close(); await browser.close(); server.close();
  L('done');
})().catch((e) => { L('ERROR', e && e.stack); process.exit(1); });
