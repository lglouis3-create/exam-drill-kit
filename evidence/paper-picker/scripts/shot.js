// Screenshots of the module on the final CI course: node shot.js <built index.html> <out dir>
const path = require('path');
const {chromium} = require('playwright');
(async () => {
  const [file, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 900, height: 1100}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  const p = await ctx.newPage();
  await p.goto('file://' + file);
  await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
  await p.click('#nav button[data-v="exam"]'); await p.waitForTimeout(300);
  await p.click('#v-exam .chip[data-ppexam="2"]'); await p.waitForTimeout(300);
  await p.screenshot({path: path.join(out, 'exam2-chosen.png')});
  await p.evaluate(() => { const A = FX.api('paper-picker'); A.choose(2); renderExam(); document.getElementById('startExam').click(); finishExam(true); A.logPaper(); EX = null; renderExam(); });
  await p.click('#v-exam .chip[data-ppexam="1"]'); await p.waitForTimeout(300);
  await p.screenshot({path: path.join(out, 'exam1-short-and-list.png'), fullPage: true});
  await b.close();
  console.log('wrote exam2-chosen.png, exam1-short-and-list.png');
})().catch(e => { console.error(e); process.exit(1); });
