// shot.js: screenshots of the Topics tab of the module's own course with the page's clock on Fri 2 Oct 2026, 12:00
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 900, height: 1100}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser';
    const D = Date, o = new D('2026-10-02T12:00').getTime() - D.now();
    function F(...a){ if(!new.target) return new D(D.now() + o).toString(); return a.length ? new D(...a) : new D(D.now() + o); }
    F.prototype = D.prototype; F.now = () => D.now() + o; F.parse = D.parse; F.UTC = D.UTC; window.Date = F; });
  const p = await ctx.newPage();
  await p.goto('file:///tmp/port-quiz-prep-cards/course/index.html');
  await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
  await p.click('#nav button[data-v="topics"]');
  await p.waitForSelector('.qpcard');
  await p.evaluate(() => { document.querySelector('.qpcard[data-qp="q5"] details').open = true; });
  await (await p.$('.qpcard[data-qp="q5"]')).screenshot({path: '/tmp/port-quiz-prep-cards/evidence/quiz5-card-2026-10-02.png'});
  await (await p.$('#qpCards')).screenshot({path: '/tmp/port-quiz-prep-cards/evidence/cards-2026-10-02.png'});
  await b.close(); console.log('ok');
})();
