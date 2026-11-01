/* The Home Screen card: what each kind of browser is offered, and that its
 * buttons work. Modeled on BDK's tests/home.js.
 *
 *   iPhone/iPad in Safari   steps to export, add to the Home Screen and import;
 *                           "Not now" hides it on Topics only
 *   Home Screen copy with   how to bring progress over from Safari
 *     no progress yet
 *   a browser with an       an Install button that calls the prompt
 *     install prompt
 *   any other browser       no card
 *
 * The iPhone is Playwright's iPhone 13 profile in Chromium (its screen and
 * user agent), not Safari: WebKit is not installed here.
 *
 *     node home_test.js
 */
const fs = require('fs');
const L = require('./check_lib');
const NAME = 'home_test.js';
const {check} = L;
L.PAGE.need(NAME);
const text = (page, sel) => page.$eval(sel, el => el.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
const go = (page, v) => page.click(`#nav button[data-v="${v}"]`);
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

(async () => {
  const {pw, browser} = await L.launch(NAME);
  const IPHONE = pw.devices['iPhone 13'];

  console.log('\n=== iPhone in Safari ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, IPHONE);
    const id = await page.evaluate(() => COURSE.id);
    const topics = await text(page, '[data-hs="topics"]');
    check(/to your Home Screen/.test(topics), 'Topics shows the Home Screen card', topics.slice(0, 80));
    check(/7 days/.test(topics) && !!(await page.$('[data-hs="topics"] a[href="https://webkit.org/tracking-prevention/"]')),
      'the card names the 7-day rule with its source');
    let dl = null;
    if(await page.$('[data-hs="topics"] [data-hs-export]'))
      [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-hs="topics"] [data-hs-export]')]);
    const fname = dl ? dl.suggestedFilename() : '';
    check(new RegExp(`^${id}-progress-.+\\.json$`).test(fname), 'Export progress on the card saves a progress file', fname);
    let file = null;
    try { file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); } catch(e){}
    check(file && file.db && file.db.concepts && Array.isArray(file.log), 'the file holds the progress and the answer history');
    check(!(await overflow(page)), 'no sideways scroll with the card');
    if(await page.$('[data-hs="topics"] [data-hs-dismiss]')) await page.click('[data-hs="topics"] [data-hs-dismiss]');
    check(!(await page.$('[data-hs="topics"]')), 'Not now hides the card');
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    await go(page, 'topics');
    check(!(await page.$('[data-hs="topics"]')), 'the card stays hidden on Topics after a reload');
    await go(page, 'settings');
    const settings = await text(page, '[data-hs="settings"]');
    check(/Add to Home Screen/.test(settings) && /Import progress/.test(settings), 'Settings still shows the steps', settings.slice(0, 80));
    check(!(await page.$('[data-hs="settings"] [data-hs-dismiss]')), 'the Settings card has no Not now button');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== iPhone, opened from the Home Screen, nothing answered yet ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, IPHONE,
      () => Object.defineProperty(Navigator.prototype, 'standalone', {get: () => true, configurable: true}));
    const topics = await text(page, '[data-hs="topics"]');
    check(/Progress from Safari/.test(topics) && /Import progress/.test(topics), 'Topics says how to bring progress from Safari', topics.slice(0, 80));
    await go(page, 'settings');
    check(/Progress from Safari/.test(await text(page, '[data-hs="settings"]')), 'Settings says the same');
    await page.evaluate(() => { startQuiz(TOPICS[0].id); const b = document.querySelector('#v-quiz button[data-o]'); if(b) b.click(); });
    await go(page, 'settings');
    check(!(await page.$('#v-settings [data-hs]')), 'once this copy has progress of its own, the card is gone from Settings');
    await go(page, 'topics');
    check(!(await page.$('#v-topics [data-hs]')), 'and from Topics');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== Desktop, no install prompt ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: 1200, height: 900}});
    check(!(await page.$('#v-topics [data-hs]')), 'no card on Topics');
    await go(page, 'settings');
    check(!(await page.$('#v-settings [data-hs]')), 'no card in Settings');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== A browser that offers an install prompt ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: 1200, height: 900}});
    // The prompt arrives after the first render, as it does in Chrome; the card is drawn on the next view.
    await page.evaluate(() => {
      const e = new Event('beforeinstallprompt', {cancelable: true});
      e.prompt = () => { window.__prompted = true; return Promise.resolve(); };
      e.userChoice = Promise.resolve({outcome: 'accepted'});
      window.dispatchEvent(e);
    });
    await go(page, 'settings');
    check(/Install/.test(await text(page, '[data-hs="settings"]')), 'Settings shows Install');
    if(await page.$('[data-hs="settings"] [data-install]')) await page.click('[data-hs="settings"] [data-install]');
    await page.waitForTimeout(200);
    check(await page.evaluate(() => window.__prompted === true), 'Install calls the browser prompt');
    check(!(await page.$('[data-hs]')), 'the card is gone after the prompt');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
