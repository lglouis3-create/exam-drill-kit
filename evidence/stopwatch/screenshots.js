/* Screenshots for the evidence: node screenshots.js COURSE_SRC OUT_DIR
   The template's own calculation (s2-3) in the quiz: running, past 2:00, and stopped. */
const path = require('path');
const [SRC, OUT] = process.argv.slice(2);
const L = require(path.join(path.resolve(SRC), 'check_lib'));
(async () => {
  const {browser} = await L.launch('screenshots');
  const init = () => { window.__off = 0; const real = Date.now.bind(Date); Date.now = () => real() + window.__off; };
  const {ctx, page} = await L.openPage(browser, path.join(path.resolve(SRC), '..', 'index.html'), {viewport: {width: 900, height: 700}}, init);
  await L.quizOn(page, ['s2-3']); await page.waitForTimeout(200);
  const card = page.locator('#v-quiz .qcard');
  await page.evaluate(() => { window.__off += 47000; FX.api('stopwatch').tickTimers(); });
  await card.screenshot({path: path.join(OUT, 'quiz_running_0-47.png')});
  await page.evaluate(() => { window.__off += 80000; FX.api('stopwatch').tickTimers(); });
  await card.screenshot({path: path.join(OUT, 'quiz_over_pace.png')});
  await page.fill('#numIn', '140'); await page.press('#numIn', 'Enter'); await page.waitForTimeout(200);
  await card.screenshot({path: path.join(OUT, 'quiz_took_over_pace.png')});
  await ctx.close(); await browser.close();
  console.log('wrote 3 screenshots');
})().catch(e => { console.log('FAIL: ' + e); process.exit(1); });
