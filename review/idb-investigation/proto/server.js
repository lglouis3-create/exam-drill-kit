// Minimal static server for the prototype page. Listens on a free port on 127.0.0.1.
const http = require('http');
const fs = require('fs');
const path = require('path');

function start() {
  const page = fs.readFileSync(path.join(__dirname, 'page.html'));
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url.startsWith('/page.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(page);
    } else {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
module.exports = { start };
