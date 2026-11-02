/* The Home Screen card: what each kind of browser is offered, and that its
 * buttons work. Modeled on BDK's tests/home.js.
 *
 * The card is a section in Settings that starts closed (a <details> whose
 * <summary> is its one-line heading), and Topics shows none (Louis, 2026-11-01):
 *
 *   iPhone/iPad in Safari   "Keep your progress: add <short> to your Home
 *                           Screen"; opened, the steps to export, add to the
 *                           Home Screen and import, and Export progress
 *   Home Screen copy with   "Progress from Safari"; opened, how to bring
 *     no progress yet       progress over from Safari
 *   a browser with an       "Install <short>"; opened, an Install button that
 *     install prompt        calls the prompt
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
const CARD = '#v-settings [data-hs]';
// click only what is there, so a missing element fails its own check and the rest still run
const tap = async (page, sel) => { if(!(await page.$(sel))) return false; await page.click(sel); return true; };
// the card in Settings: a closed <details> whose summary is the given heading
async function closedSection(page, heading, label){
  const s = await page.$eval(CARD, el => ({tag: el.tagName, open: el.open,
    summary: (el.querySelector(':scope > summary') || {}).textContent || ''})).catch(() => null);
  check(s && s.tag === 'DETAILS' && s.open === false, `${label}: Settings has the card as a closed section`, JSON.stringify(s));
  check(s && s.summary.replace(/\s+/g, ' ').trim() === heading, `${label}: its one line reads "${heading}"`, s && s.summary);
  return s;
}
// Topics shows no card, whatever the browser
async function noneOnTopics(page, label){
  await go(page, 'topics');
  // The What's new card (#news) may quote a change-log line that names the Home
  // Screen; only the Home Screen card's own text counts here.
  const shown = await page.evaluate(() => {
    const v = document.querySelector('#v-topics'); if(!v) return '';
    const c = v.cloneNode(true); c.querySelectorAll('#news').forEach(n => n.remove()); return c.textContent;
  });
  check(!(await page.$('#v-topics [data-hs]')) && !/Home Screen|Install /.test(shown),
    `${label}: Topics shows no Home Screen card`);
}

(async () => {
  const {pw, browser} = await L.launch(NAME);
  const IPHONE = pw.devices['iPhone 13'];

  console.log('\n=== iPhone in Safari ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, IPHONE);
    const id = await page.evaluate(() => COURSE.id);
    const short = await page.evaluate(() => COURSE.short || COURSE.title);
    await noneOnTopics(page, 'iPhone');
    await go(page, 'settings');
    await closedSection(page, `Keep your progress: add ${short} to your Home Screen`, 'iPhone');
    check(!(await page.isVisible(`${CARD} .hs-steps`)) && !(await page.isVisible(`${CARD} [data-hs-export]`)),
      'closed, the steps and the Export button are not shown');
    await tap(page, `${CARD} > summary`);
    check(await page.$eval(CARD, el => el.open).catch(() => false), 'tapping the line opens the section');
    const body = await text(page, CARD);
    check(await page.isVisible(`${CARD} .hs-steps`) && /Export progress/.test(body) && /Add to Home Screen/.test(body) &&
          /Import progress/.test(body), 'opened, it shows the steps: Export, Add to Home Screen, Import', body.slice(0, 120));
    check(/7 days/.test(body) && !!(await page.$(`${CARD} a[href="https://webkit.org/tracking-prevention/"]`)),
      'the section names the 7-day rule with its source');
    let dl = null;
    if(await page.isVisible(`${CARD} [data-hs-export]`))
      [dl] = await Promise.all([page.waitForEvent('download'), page.click(`${CARD} [data-hs-export]`)]);
    const fname = dl ? dl.suggestedFilename() : '';
    check(new RegExp(`^${id}-progress-.+\\.json$`).test(fname), 'Export progress in the section saves a progress file', fname);
    let file = null;
    try { file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); } catch(e){}
    check(file && file.db && file.db.concepts && Array.isArray(file.log), 'the file holds the progress and the answer history');
    check(!(await overflow(page)), 'no sideways scroll with the section open');
    check(!(await page.$('[data-hs-dismiss]')), 'there is no Not now button');
    // a browser that pressed the old card's "Not now" still sees nothing on Topics, and the section in Settings
    await page.evaluate(() => localStorage.setItem(NS + ':homeTipDismissed', '1'));
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    await noneOnTopics(page, 'after the old "Not now" and a reload');
    await go(page, 'settings');
    await closedSection(page, `Keep your progress: add ${short} to your Home Screen`, 'after a reload');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== iPhone, opened from the Home Screen, nothing answered yet ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, IPHONE,
      () => Object.defineProperty(Navigator.prototype, 'standalone', {get: () => true, configurable: true}));
    await noneOnTopics(page, 'Home Screen copy');
    await go(page, 'settings');
    await closedSection(page, 'Progress from Safari', 'Home Screen copy');
    await tap(page, `${CARD} > summary`);
    const body = await text(page, CARD);
    check(/open the drill in Safari/.test(body) && /Export progress/.test(body) && /Import progress/.test(body),
      'opened, it says how to bring progress from Safari', body.slice(0, 120));
    // The answer that gives this copy progress of its own. The quiz's own first draw on
    // TOPICS[0] can be a select-all question, where one tap ticks a box and records no
    // answer (Medicinal-chemistry's first topic holds 7 among its 75), and the check used
    // to tap once on whatever was drawn, so it failed at random. The test picks the
    // question itself: a select-all question when the bank has one. It first takes the
    // old check's step on it, which records nothing and leaves the card, then answers it
    // as a student does (the right boxes, then Check).
    const nAnswers = () => page.evaluate(() => DB.answers.length);
    const sa = await page.evaluate(() => (QUESTIONS.find(q => isMulti(q) && Array.isArray(q.options) && q.options.length) || {}).id);
    const single = await page.evaluate(() => (QUESTIONS.find(q => !q.type && !isMulti(q) && Array.isArray(q.options) && q.options.length) || {}).id);
    if(sa){
      await L.quizOn(page, sa);
      await page.evaluate(() => document.querySelector('#v-quiz button[data-o]').click());
      check(await nAnswers() === 0, `one tap on the select-all question ${sa} records no answer (the step the old check took)`, await nAnswers());
      await go(page, 'settings');
      check(!!(await page.$('#v-settings [data-hs]')), 'so the card is still in Settings: the old check failed whenever the quiz drew a select-all question');
      await L.quizOn(page, sa);
      await page.evaluate(() => { for(const i of correctSet(Q.current)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); });
    } else {
      L.skip('one tap on a select-all question records no answer', 'the bank has no select-all question');
      if(single){ await L.quizOn(page, single); await page.evaluate(() => document.querySelector('#v-quiz button[data-o]').click()); }
    }
    if(!sa && !single) L.skip('a Home Screen copy with progress of its own', 'the bank has no select-all or single-answer question');
    else {
      check(await nAnswers() === 1, `answering ${sa ? `the select-all question ${sa} with its right boxes and Check` : `the question ${single}`} records one answer in this copy`, await nAnswers());
      await go(page, 'settings');
      check(!(await page.$('#v-settings [data-hs]')), 'once this copy has progress of its own, the card is gone from Settings');
    }
    await noneOnTopics(page, 'with progress');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== Desktop, no install prompt ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: 1200, height: 900}});
    await noneOnTopics(page, 'desktop');
    await go(page, 'settings');
    check(!(await page.$('#v-settings [data-hs]')), 'no card in Settings');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== A browser that offers an install prompt ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: 1200, height: 900}});
    const short = await page.evaluate(() => COURSE.short || COURSE.title);
    // The prompt arrives after the first render, as it does in Chrome; the card is drawn on the next view.
    await page.evaluate(() => {
      const e = new Event('beforeinstallprompt', {cancelable: true});
      e.prompt = () => { window.__prompted = true; return Promise.resolve(); };
      e.userChoice = Promise.resolve({outcome: 'accepted'});
      window.dispatchEvent(e);
    });
    await noneOnTopics(page, 'install prompt');
    await go(page, 'settings');
    await closedSection(page, `Install ${short}`, 'install prompt');
    check(!(await page.isVisible(`${CARD} [data-install]`)), 'closed, the Install button is not shown');
    await tap(page, `${CARD} > summary`);
    check(await page.isVisible(`${CARD} [data-install]`), 'opened, it shows the Install button');
    if(await page.isVisible(`${CARD} [data-install]`)) await page.click(`${CARD} [data-install]`);
    await page.waitForTimeout(200);
    check(await page.evaluate(() => window.__prompted === true), 'Install calls the browser prompt');
    check(!(await page.$('[data-hs]')), 'the card is gone after the prompt');
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
