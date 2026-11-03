/* first_frame.js <courseSrc> [page] [runs]: with Dark stored on a light device, reload and measure
 *  - rafTheme: data-theme in the first animation frame whose #nav holds a button (the theme test's measure)
 *  - rafBg: the body background in that frame
 *  - fcp: first-contentful-paint time; themeAt: when data-theme="dark" was set; nav: when #nav first held a button
 *  - lightPaint: first contentful paint came before data-theme was set
 * Diagnostic. */
const path = require('path'), fs = require('fs');
const SRC = path.resolve(process.argv[2]);
const L = require(path.join(SRC, 'check_lib.js'));
const PAGEF = process.argv[3] ? path.resolve(process.argv[3]) : L.PAGE.PAGE;
const RUNS = +(process.argv[4] || 3);
(async () => {
  const {browser} = await L.launch('first_frame');
  const watch = () => {
    window.__m = {};
    const t0 = () => +performance.now().toFixed(1);
    const de = () => document.documentElement;
    const seeTheme = () => { if(window.__m.themeAt == null && de() && de().getAttribute('data-theme') === 'dark') window.__m.themeAt = t0(); };
    new MutationObserver(seeTheme).observe(document, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-theme']});
    new MutationObserver((ms, o) => { const n = document.getElementById('nav');
      if(n && n.querySelector('button')){ window.__m.nav = t0(); window.__m.navRs = document.readyState; o.disconnect(); } })
      .observe(document, {childList: true, subtree: true});
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if(e.name === 'first-contentful-paint') window.__m.fcp = +e.startTime.toFixed(1); }))
      .observe({type: 'paint', buffered: true}); } catch(e){}
    const tick = () => { const n = document.getElementById('nav');
      if(n && n.querySelector('button')){ window.__m.rafTheme = document.documentElement.getAttribute('data-theme');
        window.__m.rafBg = document.body ? getComputedStyle(document.body).backgroundColor : null; window.__m.rafAt = t0(); window.__m.rafRs = document.readyState; return; }
      requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const {ctx, page} = await L.openPage(browser, PAGEF, {colorScheme: 'light'}, watch);
  await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(150);
  const size = fs.statSync(PAGEF).size;
  const out = [];
  for(let i = 0; i < RUNS; i++){
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => window.__m);
    m.lightPaint = m.fcp != null && (m.themeAt == null || m.fcp < m.themeAt);
    out.push(m);
  }
  console.log(JSON.stringify({page: PAGEF, bytes: size, runs: out}, null, 0));
  await ctx.close(); await browser.close();
})().catch(e => { console.log('probe error: ' + e.stack); process.exit(1); });
