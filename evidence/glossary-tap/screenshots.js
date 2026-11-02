/* Screenshots for the glossary-tap evidence (agent-run). Builds nothing itself:
 *     node screenshots.js <built page index.html> <outDir>
 * The page is a scratch course with glossary-tap and formulas-in-text on
 * (glossary-tap listed first) and Basic-Pharmacokinetics' ws6-i3-2c as gtp-ws6-i3-2c. */
const path = require('path'), fs = require('fs');
const {chromium} = require('playwright');
const [page0, out] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  const p = await ctx.newPage();
  await p.goto('file://' + page0);
  await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
  await p.evaluate(() => { const q = byId('gtp-ws6-i3-2c'); Q = {pool: [q], label: 'shot', sweep: [q.id], i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false}; nextQuestion(); show('quiz'); });
  await p.evaluate(() => document.querySelector('#v-quiz button[data-o="0"]').click());
  await p.waitForTimeout(300);
  await p.click('#v-quiz .gtap[data-term="gtp-elimination"]');
  const box = await p.$('#v-quiz .gtap-box');
  if(box) await box.scrollIntoViewIfNeeded();
  await p.screenshot({path: path.join(out, '1_quiz_card_tap_with_formulas.png')});
  console.log('wrote 1_quiz_card_tap_with_formulas.png');
  await p.click('#nav button[data-v="guide"]');
  await p.waitForTimeout(200);
  await p.click('#v-guide .frac .gtap[data-term="gtp-elimination"]');
  const h = await p.$('#gtp-guide-pk'); if(h) await h.scrollIntoViewIfNeeded();
  await p.screenshot({path: path.join(out, '2_guide_term_inside_fraction.png')});
  console.log('wrote 2_guide_term_inside_fraction.png');
  await p.click('#nav button[data-v="glossary"]');
  await p.waitForTimeout(200);
  await p.screenshot({path: path.join(out, '3_glossary_tab.png')});
  console.log('wrote 3_glossary_tab.png');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
