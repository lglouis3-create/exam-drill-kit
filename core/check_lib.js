/* ==========================================================================
   SHARED PARTS OF THE CHECKS
   ==========================================================================
   Every check ends with one summary line and an exit code, which is what
   run_checks.sh reads:

     PASS: <check>: ...       exit 0
     FAIL: <check>: ...       exit 1
     NOT RUN: <check>: why    exit 2   the check could not run here (no
                                       built page, no Playwright, no decks);
                                       it is never counted as passed
     REPORT: <check>: ...     exit 0   a report with no failing condition

   A check that ran over zero items has proved nothing, so a check that finds
   nothing to look at reports NOT RUN rather than PASS.

   One case inside a check that cannot run in this browser is reported with
   notRunCase(label, why): the line "  NOT RUN  <label>  — <why>", counted apart
   from passes and skips (never as either), and named in the summary:
     PASS: <check>: <n> checks passed, <k> NOT RUN (<label>: <why>; ...)
   run_checks.sh lists each such case, and ci_course.sh fails the run on any
   case that is not a documented exclusion (core/ci_exclusions.sh).
   ========================================================================== */
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'),
      crypto = require('crypto'), vm = require('vm'), child = require('child_process');
const PAGE = require('./built_page');

let fails = 0, passes = 0;
const failed = [], skipped = [], notRunCases = [];
function check(ok, label, detail){
  console.log((ok ? '  ok    ' : '  FAIL  ') + label +
    (!ok && detail !== undefined && detail !== '' ? '  — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''));
  if(ok) passes++; else { fails++; failed.push(label); }
  return !!ok;
}
function skip(label, why){ console.log(`  skip  ${label}  — ${why}`); skipped.push(label); }
function notRun(name, why){ console.log(`NOT RUN: ${name}: ${why}`); process.exit(2); }
function notRunCase(label, why){
  const l = String(label).replace(/\s+/g, ' ').trim(), w = String(why).replace(/\s+/g, ' ').trim();
  console.log(`  NOT RUN  ${l}  — ${w}`); notRunCases.push({label: l, why: w});
}
function finish(name){
  const nr = notRunCases.length ? `, ${notRunCases.length} NOT RUN (${notRunCases.map(c => `${c.label}: ${c.why}`).join('; ')})` : '';
  if(!fails && !passes) notRun(name, 'no check ran' + (skipped.length ? ` (${skipped.length} skipped)` : '') + nr);
  const sk = skipped.length ? ` (${skipped.length} skipped: ${skipped.slice(0, 3).join('; ')}${skipped.length > 3 ? ' …' : ''})` : '';
  if(fails) console.log(`FAIL: ${name}: ${fails} of ${fails + passes} checks failed: ${failed.slice(0, 3).join('; ')}${failed.length > 3 ? ' …' : ''}${nr}`);
  else console.log(`PASS: ${name}: ${passes} checks passed${nr}${sk}`);
  process.exit(fails ? 1 : 0);
}

/* Node Playwright, from the project or from the global install
   (NODE_PATH=$(npm root -g)). Browsers are never installed from here. */
function playwright(name){
  try { return require('playwright'); } catch(e) {}
  try {
    const root = child.execSync('npm root -g', {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
    return require(path.join(root, 'playwright'));
  } catch(e) {}
  notRun(name, 'Node Playwright is not installed');
}
/* The browser the checks run in: Chromium, or the one DRILL_BROWSER names
   ('webkit', Safari's engine; 'firefox'). The kit's GitHub workflow runs them in
   Chromium and in WebKit; the cloud container has Chromium only. */
const BROWSER = (process.env.DRILL_BROWSER || 'chromium').toLowerCase();
const BROWSER_NAME = {chromium: 'Chromium', webkit: 'WebKit', firefox: 'Firefox'}[BROWSER] || BROWSER;
function browserType(name){
  const pw = playwright(name);
  if(!pw[BROWSER] || typeof pw[BROWSER].launch !== 'function') notRun(name, `DRILL_BROWSER=${BROWSER} is not a Playwright browser`);
  return pw[BROWSER];
}
/* The line "  browser  <name> started" (the engine Playwright launched) marks the checks
   printed after the browser started; ci_course.sh counts them for each module's own test
   (a module course must pass at least one in the browser the job names). */
async function launch(name, opts){
  const pw = playwright(name), type = browserType(name);
  let browser;
  try { browser = await type.launch(opts || {}); }
  catch(e) { notRun(name, `${BROWSER_NAME} did not start: ` + String(e.message).split('\n')[0]); }
  // named from the browser actually launched, not from DRILL_BROWSER
  const got = browser.browserType().name();
  console.log(`  browser  ${({chromium: 'Chromium', webkit: 'WebKit', firefox: 'Firefox'})[got] || got} started`);
  return {pw, browser};
}
/* Built pages are opened over HTTP from 127.0.0.1, as a student opens the hosted
   copy, and not from disk. From disk WebKit gives the page the origin "null" and
   refuses its manifest ("Origin null is not allowed by Access-Control-Allow-Origin"
   on the console), which made three checks fail in the kit's WebKit job of
   2026-11-02 on an error no student sees. One server per check serves a page at its
   own path on disk (http://127.0.0.1:<port>/<path>), so every page a check opens
   shares one origin, as pages opened from disk did; it serves only the folders of
   the pages it was asked for, and reads each file at each request (no caching), so a
   page rebuilt in place is served new. A secure origin like the hosted one: the
   storage and the other secure-context features work as on the hosted site.
   OPEN_CTX blocks service workers in these contexts, as a page from disk has none;
   offline_test.js, update_test.js, preview_test.js and oldcache_test.js test the
   worker with serve(). `openFromDisk` keeps the file:// opening for the check that
   a page opened from disk still works. */
const OPEN_CTX = {viewport: {width: 390, height: 844}, serviceWorkers: 'block'};
const PAGE_TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf',
  '.zip': 'application/zip', '.woff2': 'font/woff2'};
const pageRoots = new Set();
let pageServer = null;
function pageHost(){
  if(pageServer) return pageServer;
  pageServer = new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let file;
      try { file = path.normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); }
      catch(e){ res.writeHead(400); res.end(); return; }
      const inside = [...pageRoots].some(r => file.startsWith(r + path.sep));
      let body = null;
      try { if(inside && fs.statSync(file).isFile()) body = fs.readFileSync(file); } catch(e){}
      if(!body){ res.writeHead(inside ? 404 : 403); res.end(); return; }
      res.writeHead(200, {'Content-Type': PAGE_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
                          'Cache-Control': 'no-store', 'Content-Length': body.length});
      res.end(body);
    });
    // the server never keeps a check's process alive
    server.on('connection', s => s.unref());
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => { server.unref(); resolve(`http://127.0.0.1:${server.address().port}`); });
  });
  return pageServer;
}
/* The http:// address of a built page on disk; its folder (with everything under
   it) is served from then on. */
async function pageUrl(file){
  const abs = path.resolve(file);
  pageRoots.add(path.dirname(abs));
  return (await pageHost()) + abs.split(path.sep).map(encodeURIComponent).join('/');
}
async function openAt(browser, url, ctxOpts, init){
  const ctx = await browser.newContext(Object.assign({}, OPEN_CTX, ctxOpts || {}));
  await ctx.addInitScript(() => { window.prompt = () => (window.__name || 'TestUser'); });
  if(init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  return {ctx, page, errors};
}
/* The course's built page, with the first-run name prompt answered and every page
   error collected. */
async function openFile(browser, ctxOpts, init){ return openAt(browser, await pageUrl(PAGE.PAGE), ctxOpts, init); }
/* The same page opened from disk (file://), for the check that it still works so. */
async function openFromDisk(browser, ctxOpts, init){ return openAt(browser, 'file://' + PAGE.PAGE, ctxOpts, init); }

/* The site folder served over HTTP the way GitHub Pages serves it: under a
   repository path, with ETags and max-age=600. mode 'slow' answers after
   slowMs; override(path, body) replaces what one file serves, which is how a
   test publishes a new build.
   S.down() takes the server down the way a stopped server, or a phone with no
   connection, meets the browser: it stops listening, so a connection is refused,
   and S.up() listens again on the same port. A request already on a connection
   that was busy when listening stopped is answered 503 and counted in
   S.downAnswered. Until 2026-11-03 "down" dropped each connection after it was
   accepted (req.socket.destroy()). In WebKit on Linux (libsoup, the engine
   Playwright runs) that now and then broke the browser's network session: libsoup
   assertion failures, then "WebKit encountered an internal error. This is a WebKit
   bug.", with the test browser's site data lost. Under load it broke 16 of 195 runs; with
   refused connections, 0 of 60 instrumented runs and 0 of 120 runs of this offline_test.js
   (the WebKit diagnosis of 2026-11-03, review/webkit-offline/README.md on branch
   claude/elegant-ptolemy-pqxb8y-webkit-diag).
   The worker takes the same path for both: its fetch fails and it serves the
   saved copy. */
function serve(root, opts){
  opts = Object.assign({base: '/course-drill/', slowMs: 8000}, opts || {});
  const S = {mode: 'ok', overrides: {}, hits: {}, downAnswered: 0};
  const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
                 '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8'};
  const server = http.createServer((req, res) => {
    if(S.mode === 'down'){ S.downAnswered++; res.writeHead(503, {'Connection': 'close'}); res.end(); return; }
    const send = () => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      S.hits[p] = (S.hits[p] || 0) + 1;
      let body = null, file = null;
      if(p.startsWith(opts.base)){
        const rel = p.slice(opts.base.length) || 'index.html';
        if(rel in S.overrides) body = Buffer.from(S.overrides[rel]);
        else {
          file = path.normalize(path.join(root, rel));
          if(file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile()) body = fs.readFileSync(file);
        }
        // a "new deploy": a marker before the page's own closing body tag, the
        // last one (the script holds the string </body> too, in readingHtml)
        if(body && rel === 'index.html' && S.indexExtra){
          const t = body.toString('utf8'), at = t.lastIndexOf('</body>');
          body = Buffer.from(t.slice(0, at) + S.indexExtra + t.slice(at));
        }
      } else if(opts.other && p in opts.other) body = Buffer.from(opts.other[p]);
      if(!body){ res.writeHead(404); res.end(); return; }
      const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
      if(req.headers['if-none-match'] === etag){ res.writeHead(304, {ETag: etag}); res.end(); return; }
      res.writeHead(200, {'Content-Type': TYPES[path.extname(p)] || (p.endsWith('/') ? TYPES['.html'] : 'application/octet-stream'),
                          'ETag': etag, 'Cache-Control': 'max-age=600', 'Content-Length': body.length});
      res.end(body);
    };
    if(S.mode === 'slow') setTimeout(send, opts.slowMs); else send();
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => {
    S.port = server.address().port;
    S.origin = `http://localhost:${S.port}`;
    S.url = S.origin + opts.base;
    S.close = () => new Promise(done => { server.closeAllConnections(); server.close(() => done()); });
    S.down = () => new Promise(done => {
      S.mode = 'down';
      const t = setTimeout(done, 2000);     // busy connections do not hold it up: listening has stopped
      server.close(() => { clearTimeout(t); done(); });
      server.closeIdleConnections();
    });
    S.up = () => new Promise(done => {
      if(server.listening){ S.mode = 'ok'; done(); return; }
      server.listen(S.port, '127.0.0.1', () => { S.mode = 'ok'; done(); });
    });
    r(S);
  }));
}

/* The engine run in node with a stub DOM, as test.js does, returning
   whatever `exportsExpr` names. */
function engine(exportsExpr){
  const store = {};
  const el = () => ({innerHTML:'', textContent:'', classList:{toggle(){},add(){},remove(){},contains(){return false}},
                     setAttribute(){}, querySelectorAll(){return []}, querySelector(){return null}, appendChild(){},
                     onclick:null, dataset:{}, style:{}, click(){}, remove(){}});
  const sb = {console,
    localStorage:{getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]}},
    document:{querySelector:el, querySelectorAll:()=>[], getElementById:el, createElement:el, body:el(), addEventListener(){}},
    window:{scrollTo(){}}, prompt:()=>'TestUser', alert:()=>{}, confirm:()=>true,
    setTimeout:(f)=>{ f(); return 0; }, clearTimeout(){}, setInterval:()=>0, clearInterval(){},
    Blob:function(){}, URL:{createObjectURL:()=>'', revokeObjectURL(){}}, FileReader:function(){},
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error, isNaN, parseInt, parseFloat};
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(PAGE.engine() + '\nglobalThis.__X=' + exportsExpr + ';\n', sb);
  sb.__X.storage = store;
  return sb.__X;
}

/* A scratch copy of a source tree as src/ inside a new repository folder, so
   a build can run without touching the real one. */
function scratchRepo(srcDir, label){
  const root = fs.mkdtempSync(path.join(os.tmpdir(), (label || 'drill') + '-'));
  scratchRoots.push(root);
  fs.cpSync(srcDir, path.join(root, 'src'), {recursive: true,
    filter: f => !/(^|\/)(node_modules|__pycache__|decks|ingest)(\/|$)/.test(path.relative(srcDir, f))});
  return root;
}

/* For the checks of feature modules and of the core's calculation options: a
   scratch copy of this source tree, with `files` ({name: text}) written into its
   src/, `courseLine` appended to course.js after the COURSE object, `edit(src)`
   run on it, then built. A file whose name starts q<N>_ is added to course.js
   `files` as well. Returns {repo, src, page, code, out}; rm() removes it. */
function scratchBuild(label, opts){
  opts = opts || {};
  const repo = scratchRepo(PAGE.SRC, label);
  const src = path.join(repo, 'src');
  const qs = [];
  for(const [f, text] of Object.entries(opts.files || {})){
    fs.writeFileSync(path.join(src, f), text);
    if(/^q[0-9]/.test(f)) qs.push(f);
  }
  let line = qs.length ? `COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat(${JSON.stringify(qs)});` : '';
  if(opts.courseLine) line += opts.courseLine;
  if(line) fs.appendFileSync(path.join(src, 'course.js'), '\n;' + line + '\n');
  if(opts.edit) opts.edit(src);
  const r = child.spawnSync('python3', ['build.py'], {cwd: src, encoding: 'utf8', timeout: 600000});
  return {repo, src, page: path.join(repo, 'index.html'), code: r.status, out: ((r.stdout || '') + (r.stderr || '')).trim(),
          rm: () => { if(!KEEP_TMP) fs.rmSync(repo, {recursive: true, force: true}); }};
}

/* Scratch copies are removed when the check passes and kept when it fails.
   Every folder scratchRepo (and so scratchBuild) made in this process is listed
   in scratchRoots; nothing else is ever removed. When the process exits with
   code 0 (PASS or REPORT) or 2 (NOT RUN) and no check failed, the listed folders
   are removed by their exact paths. On a FAIL, a crash (an uncaught error exits
   1), any other exit code, or with KEEP_TEST_TMP=1 in the environment, they are
   kept and one line names them: "kept for inspection: <paths>" (run_checks.sh
   reads a check's summary from the last line before it). A check stopped by a
   signal (run_checks.sh's 900 s timeout) keeps them and names them too.
   Folders a check makes with its own fs.mkdtempSync are the check's to remove. */
const KEEP_TMP = process.env.KEEP_TEST_TMP === '1';
const scratchRoots = [];
/* a folder this check made beside a scratch copy (state_check_test.js's shallow
   clone), listed so the same rule applies to it */
function scratchAdd(dir){ scratchRoots.push(dir); return dir; }
function keptLine(why){
  const left = scratchRoots.filter(r => fs.existsSync(r));
  if(left.length) process.stdout.write(`kept for inspection: ${left.join(' ')}${why ? '  (' + why + ')' : ''}\n`);
}
let signalled = false;   // after SIGTERM or SIGINT nothing is removed, whatever the exit code
process.on('exit', code => {
  if(!scratchRoots.length || signalled) return;
  if(KEEP_TMP) return keptLine('KEEP_TEST_TMP=1');
  if((code === 0 || code === 2) && !fails){
    for(const r of scratchRoots){ try { fs.rmSync(r, {recursive: true, force: true}); } catch(e){ process.stdout.write(`kept for inspection: ${r}  (could not remove it: ${e.message})\n`); } }
  } else keptLine();
});
for(const sig of ['SIGTERM', 'SIGINT']){
  process.once(sig, () => { signalled = true; keptLine(sig); process.kill(process.pid, sig); });
}
/* `course.js` line that switches module `name` on with these options (kept
   with any other module the course has on), at the version in its module.json. */
function featureOn(dir, opts){
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8'));
  return `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(meta.name)}: ` +
         `Object.assign({}, (COURSE.features || {})[${JSON.stringify(meta.name)}], ${JSON.stringify(Object.assign({version: meta.version}, opts || {}))})});`;
}
/* openFile for any built page, not only the course's own */
async function openPage(browser, file, ctxOpts, init){ return openAt(browser, await pageUrl(file), ctxOpts, init); }
/* Start the quiz on one question (or a fixed list of ids), as a sweep. */
const quizOn = (page, ids) => page.evaluate(ids => {
  const pool = ids.map(byId).filter(Boolean);
  Q = {pool, label: 'check', sweep: ids.slice(), i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion(); show('quiz');
  return !!Q.current;
}, [].concat(ids));

module.exports = {browserType, BROWSER, BROWSER_NAME, PAGE, check, skip, notRun, notRunCase, finish, playwright, launch, openFile, serve, engine, scratchRepo,
                  scratchBuild, scratchAdd, featureOn, openPage, quizOn, pageUrl, openFromDisk, OPEN_CTX,
                  counts: () => ({fails, passes, skipped: skipped.length, notRun: notRunCases.length})};
