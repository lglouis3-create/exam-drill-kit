// Interrupted-upgrade coverage. Usage: node upgrade.js <chromium|webkit>
// Uses the page functions upSetup, upSlow, upState, upCheck, upFinish, upHold* from manual-lab.js
// (database "proto-upgrade": v1 has store "items"; the v2 upgrade copies it into "items2" in chunks
// of 100, with a 1,500 ms gap kept busy by chained requests).
const pw = require('playwright');
const { start } = require('./server2');
const engine = process.argv[2] || 'chromium';
const L = (...a) => console.log('[' + engine + '] ' + a.join(' '));
const J = JSON.stringify;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let browser;
  try { browser = await pw[engine].launch(); }
  catch (e) { L('LAUNCH FAILED', String(e.message).split('\n')[0]); process.exit(2); }
  L('launched', browser.version());
  const { server, port } = await start();
  const url = 'http://localhost:' + port + '/manual-plus.html';
  L('serving', url);
  const ctx = await browser.newContext();
  const np = async () => { const p = await ctx.newPage(); await p.goto(url); return p; };
  const waitCopied = async (p, n, ms = 20000) => {
    const end = Date.now() + ms; let s;
    while (Date.now() < end) { s = await p.evaluate(() => upState()); if (s.copied >= n || /^opened|^error/.test(s.state)) break; await sleep(50); }
    return s;
  };

  // U1: page closed mid-upgrade; U2: page reloaded mid-upgrade.
  for (const how of ['close', 'reload']) {
    for (let rep = 1; rep <= 3; rep++) {
      const a = await np();
      const setup = await a.evaluate(() => upSetup(2000, 1024));
      await a.close();
      const b = await np();
      await b.evaluate(() => upSlow(100, 1500, 2));
      const before = await waitCopied(b, 300);
      if (how === 'close') await b.close(); else await b.reload();
      const c = await np();
      const t0 = Date.now();
      const chk = await c.evaluate(() => upCheck());
      const chkMs = Date.now() - t0;
      const fin = await c.evaluate(() => upFinish(2));
      L('U' + (how === 'close' ? 1 : 2) + ' page ' + how + ' mid-upgrade rep=' + rep, 'setup=' + J(setup),
        '| at ' + how + ': ' + J(before), '| check (took ' + chkMs + ' ms): ' + J(chk), '| fresh upgrade: ' + J(fin));
      if (how === 'reload') await b.close();
      await c.close();
    }
  }

  // U3: an old tab holds v1 open and ignores versionchange; the upgrading tab is blocked, then closed while blocked.
  {
    const a = await np(); await a.evaluate(() => upSetup(2000, 1024)); await a.close();
    const h = await np();
    L('U3 old tab', await h.evaluate(() => upHold('keep')));
    const b = await np();
    await b.evaluate(() => upSlow(100, 1500, 2));
    await sleep(1500);
    const sb = await b.evaluate(() => upState());
    const sh = await h.evaluate(() => upHoldState());
    L('U3 after 1,500 ms', 'upgrading tab: ' + J(sb), '| old tab: ' + J(sh), '| old tab can still start a transaction: ' + await h.evaluate(() => upHoldWrite()));
    await b.close();
    await sleep(300);
    await h.evaluate(() => window.__hold.close());
    const c = await np();
    L('U3 upgrading tab closed while blocked, then old tab closed its connection', 'check: ' + J(await c.evaluate(() => upCheck())));
    await h.close(); await c.close();
  }

  // U4: an old tab closes on versionchange; then it tries a transaction on its closed connection and reopens v1
  // during the upgrade; the upgrading tab is closed mid-upgrade.
  // U5: the same, but the upgrade is left to complete.
  for (const finish of [false, true]) {
    const name = finish ? 'U5 upgrade completes' : 'U4 upgrading tab closed mid-upgrade';
    const a = await np(); await a.evaluate(() => upSetup(2000, 1024)); await a.close();
    const h = await np();
    await h.evaluate(() => upHold('close'));
    const b = await np();
    await b.evaluate((g) => upSlow(100, g, 2), finish ? 100 : 1500);
    await waitCopied(b, 200);
    const tx = await h.evaluate(() => upHoldWrite());
    await h.evaluate(() => upHoldReopen(1));
    await sleep(500);
    const during = await h.evaluate(() => upHoldState());
    let sb;
    if (finish) { sb = await waitCopied(b, 99999, 30000); } else { sb = await b.evaluate(() => upState()); await b.close(); }
    await sleep(1000);
    const after = await h.evaluate(() => upHoldState());
    const c = await np();
    L(name, 'old tab transaction on its connection after versionchange: ' + tx, '| old tab reopen v1, 500 ms into the wait: ' + J(during),
      '| upgrading tab: ' + J(sb), '| old tab after: ' + J(after), '| check: ' + J(await c.evaluate(() => upCheck())));
    if (finish) await b.close();
    await h.close(); await c.close();
  }

  const z = await np(); L('cleanup', await z.evaluate(() => deleteDB(UDB))); await z.close();
  await ctx.close(); await browser.close(); server.close();
  L('done');
})().catch((e) => { L('ERROR', e && e.stack); process.exit(1); });
