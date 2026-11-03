/* Screenshots for the evidence: node screenshots.js COURSE_SRC OUT_DIR
   On the module's own course: the professor's Quiz 4 calculation sw-cq4-2 in the quiz (running,
   past 2:00, stopped), and a paper of Exam 3 as the course has it (no clock on its questions). */
const path = require('path');
const [SRC, OUT] = process.argv.slice(2);
const L = require(path.join(path.resolve(SRC), 'check_lib'));
(async () => {
  const {browser} = await L.launch('screenshots');
  const init = () => { window.__off = 0; const real = Date.now.bind(Date); Date.now = () => real() + window.__off; };
  const {ctx, page} = await L.openPage(browser, path.join(path.resolve(SRC), '..', 'index.html'), {viewport: {width: 900, height: 700}}, init);
  await L.quizOn(page, ['sw-cq4-2']); await page.waitForTimeout(200);
  const head = page.locator('#v-quiz .qcard .qhead');
  await page.evaluate(() => { window.__off += 47000; FX.api('stopwatch').tickTimers(); });
  await head.screenshot({path: path.join(OUT, 'quiz_cq4-2_running_0-47.png')});
  await page.evaluate(() => { window.__off += 80000; FX.api('stopwatch').tickTimers(); });
  await head.screenshot({path: path.join(OUT, 'quiz_cq4-2_over_pace.png')});
  await page.fill('#numIn', '151.1'); await page.press('#numIn', 'Enter'); await page.waitForTimeout(200);
  await head.screenshot({path: path.join(OUT, 'quiz_cq4-2_took_over_pace.png')});
  await page.evaluate(() => { show('exam'); }); await page.click('#startExam'); await page.waitForTimeout(200);
  await page.locator('#v-exam .examhead').screenshot({path: path.join(OUT, 'exam3_paper_head.png')});
  await ctx.close(); await browser.close();
  console.log('wrote 4 screenshots');
})().catch(e => { console.log('FAIL: ' + e); process.exit(1); });
