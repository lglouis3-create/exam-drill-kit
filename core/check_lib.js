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
   ========================================================================== */
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'),
      crypto = require('crypto'), vm = require('vm'), child = require('child_process');
const PAGE = require('./built_page');

let fails = 0, passes = 0;
const failed = [], skipped = [];
function check(ok, label, detail){
  console.log((ok ? '  ok    ' : '  FAIL  ') + label +
    (!ok && detail !== undefined && detail !== '' ? '  — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''));
  if(ok) passes++; else { fails++; failed.push(label); }
  return !!ok;
}
function skip(label, why){ console.log(`  skip  ${label}  — ${why}`); skipped.push(label); }
function notRun(name, why){ console.log(`NOT RUN: ${name}: ${why}`); process.exit(2); }
function finish(name){
  if(!fails && !passes) notRun(name, 'no check ran' + (skipped.length ? ` (${skipped.length} skipped)` : ''));
  const sk = skipped.length ? ` (${skipped.length} skipped: ${skipped.slice(0, 3).join('; ')}${skipped.length > 3 ? ' …' : ''})` : '';
  if(fails) console.log(`FAIL: ${name}: ${fails} of ${fails + passes} checks failed: ${failed.slice(0, 3).join('; ')}${failed.length > 3 ? ' …' : ''}`);
  else console.log(`PASS: ${name}: ${passes} checks passed${sk}`);
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
async function launch(name, opts){
  const pw = playwright(name);
  try { return {pw, browser: await pw.chromium.launch(opts || {})}; }
  catch(e) { notRun(name, 'Chromium did not start: ' + String(e.message).split('\n')[0]); }
}
/* A page opened from disk, with the first-run name prompt answered and every
   page error collected. */
async function openFile(browser, ctxOpts, init){
  const ctx = await browser.newContext(Object.assign({viewport: {width: 390, height: 844}}, ctxOpts || {}));
  await ctx.addInitScript(() => { window.prompt = () => (window.__name || 'TestUser'); });
  if(init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto('file://' + PAGE.PAGE);
  await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  return {ctx, page, errors};
}

/* The site folder served over HTTP the way GitHub Pages serves it: under a
   repository path, with ETags and max-age=600. mode 'slow' answers after
   slowMs, 'down' drops every connection; override(path, body) replaces what
   one file serves, which is how a test publishes a new build. */
function serve(root, opts){
  opts = Object.assign({base: '/course-drill/', slowMs: 8000}, opts || {});
  const S = {mode: 'ok', overrides: {}, hits: {}};
  const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
                 '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8'};
  const server = http.createServer((req, res) => {
    if(S.mode === 'down'){ req.socket.destroy(); return; }
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
          rm: () => fs.rmSync(repo, {recursive: true, force: true})};
}
/* `course.js` line that switches module `name` on with these options (kept
   with any other module the course has on), at the version in its module.json. */
function featureOn(dir, opts){
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8'));
  return `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(meta.name)}: ` +
         `Object.assign({}, (COURSE.features || {})[${JSON.stringify(meta.name)}], ${JSON.stringify(Object.assign({version: meta.version}, opts || {}))})});`;
}
/* openFile for any built page, not only the course's own */
async function openPage(browser, file, ctxOpts, init){
  const ctx = await browser.newContext(Object.assign({viewport: {width: 390, height: 844}}, ctxOpts || {}));
  await ctx.addInitScript(() => { window.prompt = () => (window.__name || 'TestUser'); });
  if(init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto('file://' + file);
  await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  return {ctx, page, errors};
}
/* Start the quiz on one question (or a fixed list of ids), as a sweep. */
const quizOn = (page, ids) => page.evaluate(ids => {
  const pool = ids.map(byId).filter(Boolean);
  Q = {pool, label: 'check', sweep: ids.slice(), i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion(); show('quiz');
  return !!Q.current;
}, [].concat(ids));

module.exports = {PAGE, check, skip, notRun, finish, playwright, launch, openFile, serve, engine, scratchRepo,
                  scratchBuild, featureOn, openPage, quizOn,
                  counts: () => ({fails, passes, skipped: skipped.length})};
