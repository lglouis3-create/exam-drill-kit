// Quota-failure coverage. Usage: node quota.js <chromium|webkit> [capMB] [webkitCeilingMB]
// Chromium: caps the origin's quota with the DevTools protocol (Storage.overrideQuotaForOrigin),
// then runs the page functions quotaFill (Q1) and quotaPair (Q2, Q3) from manual-plus.html.
// WebKit: Playwright offers no way to force a quota (no DevTools-protocol session), so the forced
// runs are NOT RUN; the script instead fills up to a ceiling under WebKit's own quota and reports it.
const pw = require('playwright');
const { start } = require('./server2');
const engine = process.argv[2] || 'chromium';
const capMB = Number(process.argv[3] || 5);
const wkCeilingMB = Number(process.argv[4] || 256);
const L = (...a) => console.log('[' + engine + '] ' + a.join(' '));
const J = JSON.stringify;

(async () => {
  let browser;
  try { browser = await pw[engine].launch(); }
  catch (e) { L('LAUNCH FAILED', String(e.message).split('\n')[0]); process.exit(2); }
  L('launched', browser.version());
  const { server, port } = await start();
  const origin = 'http://localhost:' + port;
  const url = origin + '/manual-plus.html';
  L('serving', url);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url);
  L('Q0 estimate without override', J(await page.evaluate(() => estimate())));

  if (engine === 'chromium') {
    let cdp;
    try {
      cdp = await ctx.newCDPSession(page);
      await cdp.send('Storage.overrideQuotaForOrigin', { origin, quotaSize: capMB * 1048576 });
      L('override', 'Storage.overrideQuotaForOrigin', 'origin=' + origin, 'quotaSize=' + capMB * 1048576 + ' bytes (' + capMB + ' MB)', 'accepted');
    } catch (e) {
      L('Q1-Q3 NOT RUN', 'Storage.overrideQuotaForOrigin failed:', String(e.message).split('\n')[0]);
      await ctx.close(); await browser.close(); server.close(); return;
    }
    L('Q0 estimate with override', J(await page.evaluate(() => estimate())));
    for (let rep = 1; rep <= 2; rep++) {
      await page.evaluate(() => quotaCleanup());
      const q1 = await page.evaluate(() => quotaFill({ start: 262144, factor: 2, maxRecord: 2 << 20, ceiling: 64 << 20 }));
      L('Q1 fill rep=' + rep, 'refused=' + J(q1.refused));
      L('Q1 fill rep=' + rep, 'baseline=' + q1.baseline, 'committed records=' + q1.committedRecords,
        'failed transaction: pre-<n> stored=' + q1.failedTxPreStored, 'big-<n> stored=' + q1.failedTxBigStored,
        'earlier data intact (same connection)=' + q1.intactSameConnection, '(after reopen)=' + q1.intactAfterReopen,
        '(after later writes)=' + q1.intactAfterLaterWrites);
      L('Q1 fill rep=' + rep, 'later 1 KB transaction=' + q1.laterSmall1KB, 'later transaction of half the refused size=' + q1.laterHalfOfRefused,
        'estimate before=' + J(q1.estimateBefore), 'after=' + J(q1.estimateAfter));
      // Q2: two stores in one transaction, with the fill's data still stored
      const big = Math.round(q1.refused.recordMB * 1048576);
      const q2 = await page.evaluate((b) => quotaPair(b), big);
      L('Q2 two stores, storage nearly full, rep=' + rep, 'log entry MB=' + q2.bigMB, 'baseline=' + q2.baseline,
        '| progress first: ' + J(q2['progress first']), '| log first: ' + J(q2['log first']), '| later small both: ' + J(q2.laterSmallBoth));
    }
    // Q3: two stores, empty storage, one log entry larger than the whole cap
    await page.evaluate(() => quotaCleanup());
    const q3 = await page.evaluate((b) => quotaPair(b), (capMB + 1) * 1048576);
    L('Q3 two stores, empty storage, log entry larger than the cap', 'log entry MB=' + q3.bigMB,
      '| progress first: ' + J(q3['progress first']), '| log first: ' + J(q3['log first']), '| later small both: ' + J(q3.laterSmallBoth));
    // Q4: after a refused write, when does a 1 KB write succeed again, in the same database and in another one?
    {
      const small = (p) => p.evaluate(async () => {
        const one = async (name, store, mk) => {
          const db = await openNamed(name, 1, mk);
          const t = db.transaction(store, 'readwrite'); t.objectStore(store).put({ at: Date.now() }, 'x');
          const r = await txDone(t); db.close();
          return r.result + (r.error ? ' ' + r.error : '');
        };
        const same = await one(QDB2, 'progress');
        const other = await one('proto-quota-small', 's', (d) => d.createObjectStore('s'));
        return 'same database: ' + same + '; another database: ' + other + '; estimate=' + JSON.stringify(await estimate());
      });
      await page.evaluate(() => quotaCleanup());
      const q4 = await page.evaluate((b) => quotaPair(b), (capMB + 1) * 1048576);
      L('Q4 refused write of ' + q4.bigMB + ' MB', 'progress first: ' + q4['progress first'].result + ' ' + q4['progress first'].error,
        'later small both (inside quotaPair): ' + q4.laterSmallBoth.result + ' ' + (q4.laterSmallBoth.error || ''),
        'estimate=' + J(await page.evaluate(() => estimate())));
      L('Q4 1 KB writes at once', await small(page));
      await new Promise((r) => setTimeout(r, 10000));
      L('Q4 1 KB writes after 10 s', await small(page));
      await page.reload();
      L('Q4 1 KB writes after the page reloaded', await small(page));
      const page2 = await ctx.newPage(); await page2.goto(url);
      L('Q4 1 KB writes from a second page, first page still open', await small(page2));
      await page.close();
      await new Promise((r) => setTimeout(r, 1000));
      L('Q4 1 KB writes from the second page after the first page closed', await small(page2));
      L('cleanup', J(await page2.evaluate(async () => Object.assign(await quotaCleanup(), { small: await deleteDB('proto-quota-small') }))));
      const cdp2 = await ctx.newCDPSession(page2);
      await cdp2.send('Storage.overrideQuotaForOrigin', { origin });
      L('override removed', J(await page2.evaluate(() => estimate())));
    }
  } else {
    L('Q1-Q3 forced quota NOT RUN', 'Playwright ' + require('playwright/package.json').version + ' has no DevTools-protocol session or quota setting for WebKit (newCDPSession is Chromium-only)');
    const q = await page.evaluate((c) => quotaFill({ start: 1 << 20, factor: 2, maxRecord: 32 << 20, ceiling: c * 1048576 }), wkCeilingMB);
    L('W1 fill under WebKit\'s own quota, ceiling ' + wkCeilingMB + ' MB', 'refused=' + J(q.refused), 'committed records=' + q.committedRecords,
      'intact=' + q.intactAfterReopen, 'later 1 KB=' + q.laterSmall1KB, 'estimate before=' + J(q.estimateBefore), 'after=' + J(q.estimateAfter));
    if (typeof q.refused === 'object') {
      const q2 = await page.evaluate((b) => quotaPair(b), Math.round(q.refused.recordMB * 1048576));
      L('W2 two stores, storage nearly full', 'log entry MB=' + q2.bigMB, '| progress first: ' + J(q2['progress first']), '| log first: ' + J(q2['log first']), '| later small both: ' + J(q2.laterSmallBoth));
    } else L('W2 NOT RUN', 'no refusal below the ceiling, so there is no refused size to reuse');
    L('cleanup', J(await page.evaluate(() => quotaCleanup())));
  }
  await ctx.close(); await browser.close(); server.close();
  L('done');
})().catch((e) => { L('ERROR', e && e.stack); process.exit(1); });
