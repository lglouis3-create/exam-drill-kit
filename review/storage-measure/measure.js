// opens the live Medicinal-chemistry page from disk and records answers through record(),
// reading the stored lengths (characters) of the progress and history keys at each count
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext();
  await ctx.addInitScript(() => { window.prompt = () => 'me'; });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  await p.goto('file:///home/user/medicinal-chemistry/index.html');
  await p.waitForFunction(() => typeof record === 'function' && QUESTIONS.length > 0, null, {timeout: 30000});
  const out = await p.evaluate(() => {
    const rows = [], marks = new Set([0, 100, 500, 1000, 2000, 4000, 5000]);
    const len = k => (localStorage.getItem(k) || '').length;
    for(let i = 0; i <= 5000; i++){
      if(marks.has(i)){ clearTimeout(saveTimer); saveTimer = null; store.set(keyFor(PROFILE), JSON.stringify(DB));
        rows.push({answers: i, kept: DB.answers.length, data: len(keyFor(PROFILE)), log: len(NS + ':log:' + PROFILE)}); }
      if(i === 5000) break;
      const q = QUESTIONS[(i * 7) % QUESTIONS.length];
      record(q, i % 4 === 3 ? 'wrong' : 'correct', 0, 4000);
    }
    return {ns: NS, n: QUESTIONS.length, rows};
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
