// fills localStorage of one origin (served over http, like GitHub Pages) until the browser
// refuses, and reports the characters (keys + values) it held then
const { chromium } = require('playwright'); const http = require('http');
(async () => {
  const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end('<!doctype html><title>q</title>'); }).listen(0);
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(), p = await (await b.newContext()).newPage();
  await p.goto(url);
  const r = await p.evaluate(() => {
    localStorage.clear();
    const chunk = 'x'.repeat(100000); let i = 0, total = 0, err = '';
    for(;;){ const k = 'k' + i; try { localStorage.setItem(k, chunk); total += k.length + chunk.length; i++; } catch(e){ err = e.name; break; } }
    // then the remainder in smaller pieces
    for(let size = 10000; size >= 10; size = Math.floor(size / 10)){ const c = 'y'.repeat(size); for(;;){ const k = 's' + i; try { localStorage.setItem(k, c); total += k.length + c.length; i++; } catch(e){ break; } } }
    localStorage.clear();
    return {total, err};
  });
  console.log(JSON.stringify({browser: 'chromium ' + b.version(), ...r}));
  await b.close(); srv.close();
})();
