// Kit #66 review M1: can CDP CPU throttling reach a dedicated Worker? Chromium (Playwright 1.63.0). Tries
// BrowserContext.newCDPSession(worker), then Target.attachToTarget on a browser session and
// Emulation.setCPUThrottlingRate sent to the worker target. Prints the loop time before and after.
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const page = await ctx.newPage();
  await page.goto('about:blank');
  const wp = new Promise(r => page.once('worker', r));
  await page.evaluate(() => { const src = 'onmessage=e=>{const t=performance.now();let x=0;for(let i=0;i<3e7;i++)x+=i%7;postMessage(performance.now()-t)}'; window.w = new Worker(URL.createObjectURL(new Blob([src]))); });
  const worker = await wp;
  const run = () => page.evaluate(() => new Promise(r => { w.onmessage = e => r(Math.round(e.data)); w.postMessage(0); }));
  console.log('unthrottled', await run());
  let ok = 'no';
  try { const ws = await ctx.newCDPSession(worker); await ws.send('Emulation.setCPUThrottlingRate', {rate: 4}); ok = 'newCDPSession(worker)'; } catch(e){ console.log('newCDPSession(worker) failed:', e.message.split('\n')[0]); }
  if(ok === 'no'){ try {
    const bs = await b.newBrowserCDPSession();
    const {targetInfos} = await bs.send('Target.getTargets'); const wt = targetInfos.find(t => t.type === 'worker');
    console.log('worker target', !!wt);
    const {sessionId} = await bs.send('Target.attachToTarget', {targetId: wt.targetId, flatten: false});
    const reply = new Promise(r => bs.on('Target.receivedMessageFromTarget', m => { if(/"id":1/.test(m.message)) r(m.message); }));
    await bs.send('Target.sendMessageToTarget', {sessionId, message: JSON.stringify({id: 1, method: 'Emulation.setCPUThrottlingRate', params: {rate: 4}})});
    console.log('reply', await reply); ok = 'browser session';
  } catch(e){ console.log('browser session failed:', e.message.split('\n')[0]); } }
  console.log('method', ok, 'after rate 4', await run());
  await b.close();
})();
