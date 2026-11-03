/* theme_probe.js <courseSrc>: with Dark stored, the moment #nav first holds a button: data-theme then,
 * and the stack of the code that added it. Diagnostic only (not a check). */
const path = require('path');
const SRC = path.resolve(process.argv[2]); const L = require(path.join(SRC, 'check_lib.js'));
(async () => {
  const {browser} = await L.launch('theme_probe');
  const watch = () => { window.__hit = null; new MutationObserver((ms, o) => { const n = document.getElementById('nav');
    if(n && n.querySelector('button') && !window.__hit){ window.__hit = {theme: document.documentElement.getAttribute('data-theme'),
      themeScriptRan: typeof FX !== 'undefined' && !!(FX.api && FX.api('theme')), fx: typeof FX !== 'undefined', loaded: (() => { try { return ['chained-problem-sets','concept-statuses','formulas-in-text','equation-drill','glossary-tap','module-pages','notes','pair-up-drills','paper-picker','plan-the-problem','quiz-prep-cards','short-answer-graphs','stopwatch','study-controls','terms-variables','theme','worksheets-ink','wrong-number-diagnosis'].filter(m => FX.api(m)); } catch(e){ return 'err ' + e.message; } })(), scripts: document.scripts.length, rs: document.readyState, stack: new Error().stack.split('\n').slice(1, 7).map(s => s.trim().slice(0, 90)).join(' | ')}; o.disconnect(); } })
    .observe(document, {childList: true, subtree: true}); };
  const {page} = await L.openFile(browser, {colorScheme: 'light'}, watch);
  await page.waitForTimeout(800);
  await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(100);
  await page.reload(); await page.waitForTimeout(1500);
  console.log(JSON.stringify({hit: await page.evaluate(() => window.__hit), after: await page.evaluate(() => document.documentElement.getAttribute('data-theme'))}));
  await browser.close();
})().catch(e => { console.log('probe error: ' + e.message); process.exit(1); });
