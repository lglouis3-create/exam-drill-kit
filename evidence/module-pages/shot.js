// Screenshots of the module-on scratch course (agent-run): the cards on Topics and a module's Calculations page.
const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({viewport: {width: 900, height: 1000}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  const p = await ctx.newPage();
  await p.goto('file:///tmp/port-module-pages/on/index.html');
  await p.waitForSelector('#mpCards');
  await p.screenshot({path: '/tmp/port-module-pages/evidence/topics-cards.png'});
  await p.click('#mpCards .modbtn[data-mpsec="calcs"]');
  await p.click('#v-topics details.worked > summary');
  await p.screenshot({path: '/tmp/port-module-pages/evidence/module-calculations.png'});
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
