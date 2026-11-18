/* The checks themselves: exit codes, the device lint, run_checks.sh.
 *
 * A check that cannot run has to say NOT RUN and exit 2, never 0: the template's
 * stepper and citation checks exited 0 when they could not run, and test.js
 * exited 0 after two of its own failures, so a chained command read all three as
 * passes. This runs the checks in a scratch copy of the source tree, in the
 * states that should produce each code:
 *
 *   before any build       every page check says NOT RUN and exits 2
 *   no decks               cite_check.py says NOT RUN and exits 2
 *   no Playwright          the browser checks say NOT RUN and exit 2
 *   a report               explain_check.js says REPORT and exits 0
 *   a planted lookbehind   device_lint.js fails, in a source and in the page
 *   run_checks.sh          one line per check, non-zero exit on a FAIL
 *   no DIAGRAMS list       test.js and render_test.js still run and pass (the
 *                          Diagrams tab's list is optional, as in views.js)
 *   scratch folders        removed when a check passes, kept and named when it
 *                          fails or with KEEP_TEST_TMP=1; a REPORT stays REPORT
 *
 *     node checks_test.js              this source tree
 *     node checks_test.js --src DIR    another one (for example the archived template)
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const at = process.argv.indexOf('--src');
const SRC = at > 0 ? path.resolve(process.argv[at + 1]) : __dirname;   // resolved before check_lib moves to src/
const L = require('./check_lib');
const NAME = 'checks_test.js';
const {check} = L;

const repo = L.scratchRepo(SRC, 'checks-test');
const src = path.join(repo, 'src');
const env = extra => Object.assign({}, process.env, {DRILL_PAGE: ''}, extra || {});
delete process.env.DRILL_PAGE;
function run(file, args, extra){
  const cmd = /\.py$/.test(file) ? 'python3' : /\.sh$/.test(file) ? 'bash' : process.execPath;
  const r = child.spawnSync(cmd, [file].concat(args || []), {cwd: src, encoding: 'utf8', env: env(extra), timeout: 600000});
  const lines = (r.stdout || '').split('\n').filter(l => l.trim());
  return {code: r.status, last: lines[lines.length - 1] || (r.stderr || '').trim().split('\n').pop() || '', out: r.stdout || ''};
}
const has = f => fs.existsSync(path.join(src, f));

console.log('\n=== The checks: exit codes, device lint, run_checks.sh ===');
for(const f of ['run_checks.sh', 'device_lint.js', 'check_lib.js', 'built_page.js', 'browser_test.js'])
  check(has(f), `${f} is in the source tree`);

// 1. before any build there is no page: every page check cannot run
for(const f of ['test.js', 'style_check.js', 'render_test.js', 'explain_check.js', 'stepper_test.js', 'browser_test.js', 'cite_check.py']){
  if(!has(f)){ check(false, `${f} with no built page exits 2 and says NOT RUN`, 'no such file'); continue; }
  const r = run(f);
  check(r.code === 2 && /^NOT RUN: /.test(r.last), `${f} with no built page exits 2 and says NOT RUN`, `exit ${r.code}: ${r.last.slice(0, 100)}`);
}

// 2. build the copy, unless its build would write outside the repository
const build = fs.readFileSync(path.join(src, 'build.py'), 'utf8');
if(build.includes('/mnt/' + 'user-data')){
  check(false, 'the build runs in the copy', 'not run: the build would write outside the repository');
  L.finish(NAME);
}
const b = child.spawnSync('python3', ['build.py'], {cwd: src, encoding: 'utf8'});
check(b.status === 0, 'the build runs in the copy', (b.stderr || '').trim().split('\n').pop());

// 3. the codes once there is a page
let r = run('explain_check.js');
check(r.code === 0 && /^REPORT: explain_check\.js: /.test(r.last), 'explain_check.js is a report: exit 0, last line REPORT', `exit ${r.code}: ${r.last.slice(0, 100)}`);
r = run('cite_check.py');
check(r.code === 2 && /^NOT RUN: cite_check\.py: /.test(r.last), 'cite_check.py with no decks exits 2 and says NOT RUN', `exit ${r.code}: ${r.last.slice(0, 100)}`);
r = run('test.js');
check(r.code === 0 && /^PASS: test\.js: /.test(r.last), 'test.js passes with exit 0 and a PASS line', `exit ${r.code}: ${r.last.slice(0, 100)}`);
// Playwright out of reach: no NODE_PATH, and no npm on PATH for the global lookup
for(const f of ['browser_test.js', 'stepper_test.js']){
  r = run(f, [], {NODE_PATH: '', PATH: '/nonexistent'});
  check(r.code === 2 && /^NOT RUN: .*Playwright/.test(r.last), `${f} without Playwright exits 2 and says NOT RUN`, `exit ${r.code}: ${r.last.slice(0, 100)}`);
}

// 4. the device lint: clean copy passes, a lookbehind in a source or in the page fails
const LB = '(?' + '<=';
r = run('device_lint.js');
check(r.code === 0 && /^PASS: /.test(r.last), 'device_lint.js passes on the clean copy', `exit ${r.code}: ${r.last.slice(0, 120)}`);
const views = path.join(src, 'views.js'), viewsText = fs.readFileSync(views, 'utf8');
fs.writeFileSync(views, viewsText + `\nconst __planted = /${LB}a)b/;\n`);
r = run('device_lint.js');
check(r.code === 1 && /views\.js:\d+/.test(r.out), 'device_lint.js fails on a lookbehind in a shipped source and names the line', `exit ${r.code}: ${r.last.slice(0, 120)}`);
// its log folder, kept because a check fails, is made inside the scratch copy and goes with it
const rc = run('run_checks.sh', ['device_lint.js', 'test.js'], {TMPDIR: repo});
check(rc.code === 1 && /^FAIL +device_lint\.js /m.test(rc.out), 'run_checks.sh prints FAIL for it and exits 1', `exit ${rc.code}: ${rc.out.slice(-200)}`);
fs.writeFileSync(views, viewsText);
child.spawnSync('python3', ['build.py'], {cwd: src});
const index = path.join(repo, 'index.html'), indexText = fs.readFileSync(index, 'utf8');
fs.writeFileSync(index, indexText.replace('</script>', `new RegExp('${LB}x)y');\n</script>`));
r = run('device_lint.js');
check(r.code === 1 && /index\.html:\d+/.test(r.out), 'device_lint.js fails on a lookbehind that reaches only the built page', `exit ${r.code}: ${r.last.slice(0, 120)}`);
fs.writeFileSync(index, indexText);

// 5. run_checks.sh: one line per check, the right word for each code, exit 0 with no FAIL
const all = run('run_checks.sh', ['test.js', 'explain_check.js', 'cite_check.py', 'device_lint.js']);
const out = all.out;
check(all.code === 0, 'run_checks.sh exits 0 when nothing fails (a NOT RUN is listed, not failed)', `exit ${all.code}`);
check(/^PASS +build\.py /m.test(out), 'run_checks.sh builds first and reports the build');
check(/^PASS +test\.js +\S/m.test(out), 'a passing check is one PASS line with its summary');
check(/^REPORT +explain_check\.js +\S/m.test(out), 'a report is one REPORT line');
// the reason depends on the machine (no lecture PDFs here; no pdfplumber on a bare one), so any reason will do
check(/^NOT RUN +cite_check\.py +\S/m.test(out), 'a check that could not run is one NOT RUN line with the reason', (out.match(/^NOT RUN +cite_check\.py.*$/m) || ['no NOT RUN line'])[0]);
check(/^PASS +device_lint\.js /m.test(out), 'the device lint is one PASS line on the clean copy');
check(/^3 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT/m.test(out), 'run_checks.sh ends with the counts');
const listed = (fs.readFileSync(path.join(src, 'run_checks.sh'), 'utf8').match(/^CHECKS=\(([\s\S]*?)\)/m) || [, ''])[1].split(/\s+/).filter(Boolean);
const absent = listed.filter(f => !has(f));
check(listed.length >= 10 && !absent.length, `every check run_checks.sh lists is in the source tree (${listed.length})`, absent.join(', '));

// 6. a course without a DIAGRAMS list: the node checks do not depend on one
{
  let lf = null;
  try { lf = JSON.parse(child.spawnSync('python3', ['build.py', '--list-files'], {cwd: src, encoding: 'utf8'}).stdout); } catch(e){}
  const DECL = /^const DIAGRAMS(\s*=)/m;
  const holder = lf && (lf.files || []).find(f => has(f) && DECL.test(fs.readFileSync(path.join(src, f), 'utf8')));
  if(!holder) L.skip('test.js and render_test.js without a DIAGRAMS list', lf ? 'no data file declares DIAGRAMS' : 'build.py --list-files gave no list');
  else {
    const hp = path.join(src, holder), text = fs.readFileSync(hp, 'utf8');
    fs.writeFileSync(hp, text.replace(DECL, 'const DIAGRAMS_LEFT_OUT$1'));
    const nb = child.spawnSync('python3', ['build.py'], {cwd: src, encoding: 'utf8'});
    for(const f of ['test.js', 'render_test.js']){
      const t = nb.status === 0 ? run(f) : {code: null, last: 'the build failed: ' + (nb.stderr || nb.stdout).trim().split('\n').pop()};
      check(t.code === 0 && new RegExp('^PASS: ' + f.replace('.', '\\.') + ': ').test(t.last), `${f} passes on a course whose ${holder} declares no DIAGRAMS list`, `exit ${t.code}: ${t.last.slice(0, 120)}`);
    }
    fs.writeFileSync(hp, text);
  }
}

// 7. scratch folders (check_lib.js scratchRepo): removed when the check passes, kept and
// named when it fails or with KEEP_TEST_TMP=1; a REPORT stays a REPORT with the kept line
// after it. Each case runs a small check in src/ with a TMPDIR of its own.
{
  console.log('\n=== Scratch folders ===');
  const tiny = path.join(repo, 'tiny'); fs.mkdirSync(tiny); fs.writeFileSync(path.join(tiny, 'a.txt'), 'a');
  const body = {
    'scratch_pass.js': `L.scratchRepo(${JSON.stringify(tiny)}, 'scratch-case'); L.check(true, 'a passing check'); L.finish('scratch_pass.js');`,
    'scratch_fail.js': `L.scratchRepo(${JSON.stringify(tiny)}, 'scratch-case'); L.check(false, 'a failing check'); L.finish('scratch_fail.js');`,
    'scratch_report.js': `L.scratchRepo(${JSON.stringify(tiny)}, 'scratch-case'); console.log('REPORT: scratch_report.js: a report'); process.exit(0);`,
  };
  for(const [f, b] of Object.entries(body)) fs.writeFileSync(path.join(src, f), `const L = require('./check_lib');\n${b}\n`);
  let n = 0;
  const tmp = () => { const d = path.join(repo, 'tmp-' + (++n)); fs.mkdirSync(d); return d; };
  const left = d => fs.readdirSync(d).filter(f => f.startsWith('scratch-case-'));
  let d = tmp(), t = run('scratch_pass.js', [], {TMPDIR: d, KEEP_TEST_TMP: ''});
  check(t.code === 0 && !left(d).length && !/kept for inspection/.test(t.out), 'a passing check removes the scratch folder it made', {code: t.code, left: left(d), out: t.out.slice(-200)});
  d = tmp(); t = run('scratch_fail.js', [], {TMPDIR: d, KEEP_TEST_TMP: ''});
  check(t.code === 1 && left(d).length === 1 && t.out.includes('kept for inspection: ' + path.join(d, left(d)[0] || '?')), 'a failing check keeps its scratch folder and prints "kept for inspection: <path>"', {code: t.code, left: left(d), out: t.out.slice(-200)});
  d = tmp(); t = run('scratch_pass.js', [], {TMPDIR: d, KEEP_TEST_TMP: '1'});
  check(t.code === 0 && left(d).length === 1 && /kept for inspection: .*KEEP_TEST_TMP=1/.test(t.out), 'KEEP_TEST_TMP=1 keeps the scratch folder of a passing check and names it', {code: t.code, left: left(d), out: t.out.slice(-200)});
  d = tmp(); t = run('run_checks.sh', ['scratch_report.js'], {TMPDIR: d, KEEP_TEST_TMP: '1'});
  const rlog = (t.out.match(/logs in (\S+)$/m) || [])[1], rtext = rlog && fs.existsSync(path.join(rlog, 'scratch_report.js.log')) ? fs.readFileSync(path.join(rlog, 'scratch_report.js.log'), 'utf8') : '';
  check(t.code === 0 && /^REPORT +scratch_report\.js +a report$/m.test(t.out) && /\nkept for inspection: .*\n?$/.test(rtext),
    'run_checks.sh reads an exit-0 check whose last line before the kept line is REPORT: as REPORT (KEEP_TEST_TMP=1)', {code: t.code, out: t.out.slice(-300), log: rtext.slice(-200)});
  for(const f of Object.keys(body)) fs.rmSync(path.join(src, f));
}

fs.rmSync(repo, {recursive: true, force: true});
L.finish(NAME);
