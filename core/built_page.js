/* ==========================================================================
   WHERE THE BUILT PAGE IS — the one place every check reads it from
   ==========================================================================
   build.py writes the app to the repository root as index.html, the file
   GitHub Pages serves at the site root, one level above this src/ folder.
   Every check that reads the built page takes its location from here, so the
   build and the checks cannot disagree about it, and no check reads a path
   outside the repository.

   DRILL_PAGE in the environment points the checks at another built page, for
   example a page built by an older engine, to show a new check failing on it.
   The folder the page sits in is treated as the site: sw.js, version.json and
   manifest.json are looked for beside it.

   A check that cannot find the page cannot run, which is not the same as
   failing: need() says so and exits 2 (see run_checks.sh for the codes).
   ========================================================================== */
const fs = require('fs'), path = require('path');

const SRC  = __dirname;
const ROOT = path.dirname(SRC);
const PAGE = process.env.DRILL_PAGE ? path.resolve(process.env.DRILL_PAGE) : path.join(ROOT, 'index.html');
const SITE = path.dirname(PAGE);
// The checks open course.js, the question files and CHANGELOG.md by bare name,
// so they run from src/ whatever directory they were started in.
process.chdir(SRC);

const exists = () => fs.existsSync(PAGE);

/* Stop the check with NOT RUN when there is no built page to check. */
function need(check){
  if(exists()) return;
  console.log(`NOT RUN: ${check}: no built page at ${PAGE} (run python3 build.py first)`);
  process.exit(2);
}

const read = () => fs.readFileSync(PAGE, 'utf8');

/* The page carries exactly one inline script: the course, the data and the
   engine, assembled by build.py. */
function script(html){
  const all = [...(html || read()).matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if(all.length !== 1) throw new Error(`expected 1 script block in ${PAGE}, got ${all.length}`);
  return all[0];
}

/* The script without its boot block, for checks that run the engine in node:
   the boot block needs a real DOM. */
function engine(html){
  const code = script(html);
  const at = code.lastIndexOf('   BOOT');
  if(at === -1) throw new Error('BOOT marker not found in the page script');
  return code.slice(0, code.lastIndexOf('/* ===', at));
}

module.exports = {SRC, ROOT, PAGE, SITE, exists, need, read, script, engine};
