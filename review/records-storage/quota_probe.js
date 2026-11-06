// the largest total of key+value characters Chromium's localStorage takes on an empty origin
const path = require('path'); const L = require(path.join(process.cwd(), 'check_lib.js'));
(async () => { const {browser} = await L.launch('quota_probe'); const {ctx, page} = await L.openFile(browser);
  const r = await page.evaluate(() => { localStorage.clear(); let lo = 0, hi = 12e6; while(hi - lo > 64){ const m = Math.floor((lo + hi) / 2); try { localStorage.setItem('q', 'x'.repeat(m)); lo = m; } catch(e){ hi = m; } localStorage.removeItem('q'); } return {maxValueWithKeyQ: lo, totalChars: lo + 1}; });
  console.log('QUOTA ' + JSON.stringify(r)); await ctx.close(); await browser.close(); })();
