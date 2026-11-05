// Exploratory follow-up to quota.js Q4: after a refused 6 MB write under a 5 MB cap, retry a 1 KB write in the SAME database only
// (no write to another database in between). Usage: node quota-reclaim.js
const pw = require('playwright'); const { start } = require('./server2');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const b = await pw.chromium.launch(); const { server, port } = await start(); const origin='http://localhost:'+port;
 const ctx = await b.newContext(); let p = await ctx.newPage(); await p.goto(origin+'/manual-plus.html');
 const cdp = await ctx.newCDPSession(p); await cdp.send('Storage.overrideQuotaForOrigin', { origin, quotaSize: 5*1048576 });
 await p.evaluate(()=>quotaPair(6*1048576));
 const small = () => p.evaluate(async () => { const db = await openNamed(QDB2, 1); const t = db.transaction('progress','readwrite'); t.objectStore('progress').put({rev:9},'x'); const r = await txDone(t); db.close(); return r.result + ' ' + (r.error||'') + ' ' + JSON.stringify(await estimate()); });
 console.log('immediately', await small());
 await sleep(5000); console.log('after 5 s', await small());
 await p.reload(); console.log('after reload', await small());
 await sleep(30000); console.log('after 35 s', await small());
 const p2 = await ctx.newPage(); await p2.goto(origin+'/manual-plus.html'); await p.close(); p = p2;
 console.log('new page', await small());
 await ctx.close(); await b.close(); server.close(); })();
