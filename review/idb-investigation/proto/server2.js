// Static server for the follow-up drivers (quota.js, upgrade.js). Serves the prototype pages only.
// server.js is kept unchanged for run.js and hold.js.
const http = require('http');
const fs = require('fs');
const path = require('path');
const FILES = ['page.html', 'manual.html', 'manual-plus.html', 'manual-lab.js'];
function start() {
  const server = http.createServer((req, res) => {
    const name = (req.url.split('?')[0].replace(/^\//, '')) || 'manual-plus.html';
    if (!FILES.includes(name)) { res.writeHead(404); res.end('not found'); return; }
    const type = name.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(fs.readFileSync(path.join(__dirname, name)));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
module.exports = { start };
