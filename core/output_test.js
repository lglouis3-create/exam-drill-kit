/* Where the build writes, and where the checks read.
 *
 * GitHub Pages serves the repository root, so the build has to write the app
 * there as index.html, with .nojekyll, and the old file name from course.js
 * `output` as a redirect to it. A build or check that reads or writes a path
 * outside the repository (the template wrote to a sandbox folder under /mnt)
 * checks a file that a clone does not have, so no check means anything on a
 * clone.
 *
 * The build runs in a scratch copy of this source tree, never in place.
 *
 *     node output_test.js              this source tree
 *     node output_test.js --src DIR    another one (for example the archived template)
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), child = require('child_process');
const at = process.argv.indexOf('--src');
const SRC = at > 0 ? path.resolve(process.argv[at + 1]) : __dirname;   // resolved before check_lib moves to src/
const L = require('./check_lib');
const NAME = 'output_test.js';

console.log('\n=== Where the build writes and the checks read ===');
// 1. no path outside the repository, in any file of the source tree
const SANDBOX = '/mnt/' + 'user-data';
const files = fs.readdirSync(SRC).filter(f => /\.(py|js|html|md|sh|json)$/.test(f) && fs.statSync(path.join(SRC, f)).isFile());
const outside = files.filter(f => fs.readFileSync(path.join(SRC, f), 'utf8').includes(SANDBOX));
L.check(!outside.length, `no file in the source tree names ${SANDBOX} (${files.length} files read)`, outside.join(', '));

// 2. the checks that read the built page take its location from built_page.js
const READERS = ['test.js', 'style_check.js', 'render_test.js', 'explain_check.js', 'stepper_test.js', 'cite_check.py']
  .concat(files.filter(f => /^browser_test\./.test(f)));
const own = READERS.filter(f => fs.existsSync(path.join(SRC, f)) &&
  !/require\('\.\/(built_page|check_lib)'\)|built_page\.js/.test(fs.readFileSync(path.join(SRC, f), 'utf8')));
L.check(!own.length, `every check that reads the built page gets its location from built_page.js (${READERS.length} checks)`, own.join(', '));
const PARSE = 'output:' + '\\s*';     // the course.js parse the template's checks each did on their own
const parsers = files.filter(f => f !== 'build.py' && fs.readFileSync(path.join(SRC, f), 'utf8').includes(PARSE));
L.check(!parsers.length, 'no check works out the page name from course.js itself', parsers.join(', '));

// 3. build a scratch copy and look at the repository root
if(outside.length){
  L.check(false, 'the build writes to the repository root', 'not run: the build would write outside the repository');
  L.finish(NAME);
}
const repo = L.scratchRepo(SRC, 'output-test');
const src = path.join(repo, 'src');
const b = child.spawnSync('python3', ['build.py'], {cwd: src, encoding: 'utf8'});
L.check(b.status === 0, 'the build runs in a fresh copy', (b.stderr || b.stdout).trim().split('\n').slice(-3).join(' | '));
const sb = {}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(src, 'course.js'), 'utf8') + '\nglobalThis.C = COURSE;', sb);
const legacy = sb.C.output;
const index = path.join(repo, 'index.html');
const page = fs.existsSync(index) ? fs.readFileSync(index, 'utf8') : '';
L.check(page && (page.match(/<script>/g) || []).length === 1 && page.includes(sb.C.title),
  'the app is written to the repository root as index.html');
L.check(fs.existsSync(path.join(repo, '.nojekyll')), '.nojekyll is written beside it');
const red = path.join(repo, legacy);
const redir = legacy && legacy !== 'index.html' && fs.existsSync(red) ? fs.readFileSync(red, 'utf8') : '';
L.check(/http-equiv="refresh" content="0; url=\.\/index\.html"/.test(redir) && /location\.replace\("\.\/index\.html"/.test(redir) && redir.length < 2000,
  `the course.js output name (${legacy}) is a redirect to index.html`);
const left = fs.readdirSync(repo).concat(fs.readdirSync(src)).filter(f => f.endsWith('.tmp'));
L.check(!left.length, 'no temporary file is left behind', left.join(', '));
const inSrc = fs.readdirSync(src).filter(f => /\.html$/.test(f) && f !== 'shell.html');
L.check(!inSrc.length, 'nothing built is written into src/', inSrc.join(', '));

// 4. the checks find that page: test.js passes in the copy, and the helper names index.html
const where = child.spawnSync('node', ['-p', "require('./built_page').PAGE"], {cwd: src, encoding: 'utf8'});
L.check(where.stdout.trim() === index, 'built_page.js names the repository root index.html', where.stdout.trim() || where.stderr.trim());
const t = child.spawnSync('node', ['test.js'], {cwd: src, encoding: 'utf8'});
L.check(t.status === 0, 'test.js reads that page and passes', (t.stdout || '').trim().split('\n').slice(-1)[0]);
const elsewhere = child.spawnSync('node', ['-p', "require('./built_page').PAGE"],
  {cwd: src, encoding: 'utf8', env: Object.assign({}, process.env, {DRILL_PAGE: path.join(repo, 'other.html')})});
L.check(elsewhere.stdout.trim() === path.join(repo, 'other.html'), 'DRILL_PAGE points every check at another page');
fs.rmSync(repo, {recursive: true, force: true});
L.finish(NAME);
