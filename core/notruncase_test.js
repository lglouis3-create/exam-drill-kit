/* One case inside a check reported as NOT RUN (check_lib.js notRunCase), and the one such
 * case a kit CI run accepts (core/ci_exclusions.sh): the worksheets-ink PDF's size in WebKit.
 *
 * In a scratch folder with this core's check_lib.js, built_page.js, run_checks.sh and
 * ci_exclusions.sh, and fake checks that use them:
 *   - a NOT RUN case is printed and named in the summary, and never counted as passed or skipped;
 *   - a check with only NOT RUN cases is NOT RUN (exit 2); with a failure it is FAIL;
 *   - run_checks.sh lists each case on its own line and counts the cases apart;
 *   - ci_course.sh's rule accepts exactly that case, for that module, in WebKit, and refuses
 *     the same case in Chromium, another case, another module, another reason, and a whole-check
 *     NOT RUN of the module.
 *     node notruncase_test.js */
const fs = require('fs'), os = require('os'), path = require('path'), child = require('child_process');
const HERE = __dirname;
const L = require('./check_lib');
const NAME = 'notruncase_test.js';
const {check} = L;

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'notruncase-'));
for(const f of ['check_lib.js', 'built_page.js', 'run_checks.sh', 'ci_exclusions.sh']) fs.copyFileSync(path.join(HERE, f), path.join(T, f));
fs.writeFileSync(path.join(T, 'build.py'), "import sys\nif '--list-checks' in sys.argv: sys.exit(0)\nprint('wrote index.html  (scratch)')\n");
const PDF = "the printed PDF's size", WHY = 'page.pdf runs only in Chromium (WebKit here); the printed worksheet is checked by its print layout above';
const mk = (rel, body) => {
  const f = path.join(T, rel); fs.mkdirSync(path.dirname(f), {recursive: true});
  const up = path.relative(path.dirname(f), T) || '.';
  fs.writeFileSync(f, `const L = require(${JSON.stringify('./' + path.join(up, 'check_lib.js'))});\n${body}\n`);
};
mk('features/worksheets-ink/test.js', `L.check(true, 'the print layout of the worksheet'); L.notRunCase(${JSON.stringify(PDF)}, ${JSON.stringify(WHY)}); L.finish('features/worksheets-ink/test.js');`);
mk('only_case.js', `L.notRunCase('a case', 'cannot run here'); L.finish('only_case.js');`);
mk('fail_case.js', `L.check(false, 'a failing check'); L.notRunCase('a case', 'cannot run here'); L.finish('fail_case.js');`);
mk('counts.js', `L.check(true, 'x'); L.skip('s', 'skipped here'); L.notRunCase('c', 'not here'); console.log(JSON.stringify(L.counts())); L.finish('counts.js');`);
const node = f => child.spawnSync(process.execPath, [path.join(T, f)], {encoding: 'utf8', cwd: T, env: Object.assign({}, process.env, {DRILL_PAGE: path.join(T, 'index.html')})});

console.log('\n=== check_lib.js notRunCase ===');
let r = node('features/worksheets-ink/test.js');
check(r.status === 0 && r.stdout.includes(`  NOT RUN  ${PDF}  — ${WHY}`), 'a NOT RUN case is printed on its own line, and the check still passes on its passing checks', r.stdout.slice(-400));
check(r.stdout.includes(`PASS: features/worksheets-ink/test.js: 1 checks passed, 1 NOT RUN (${PDF}: ${WHY})`), 'the summary names the case and counts it apart from the passes', r.stdout.slice(-300));
r = node('counts.js');
const c = JSON.parse(r.stdout.split('\n').find(l => l.startsWith('{')) || '{}');
check(c.passes === 1 && c.skipped === 1 && c.notRun === 1, 'a NOT RUN case is counted neither as passed nor as skipped', c);
r = node('only_case.js');
check(r.status === 2 && /^NOT RUN: only_case\.js: no check ran.*1 NOT RUN \(a case: cannot run here\)/m.test(r.stdout), 'a check whose only results are NOT RUN cases is NOT RUN (exit 2), never PASS', {status: r.status, out: r.stdout.slice(-200)});
r = node('fail_case.js');
check(r.status === 1 && /^FAIL: fail_case\.js: 1 of 1 checks failed: a failing check, 1 NOT RUN/m.test(r.stdout), 'a failure with a NOT RUN case is FAIL', {status: r.status, out: r.stdout.slice(-200)});

console.log('\n=== run_checks.sh ===');
const rc = child.spawnSync('bash', ['run_checks.sh', 'features/worksheets-ink/test.js', 'only_case.js'], {encoding: 'utf8', cwd: T, env: Object.assign({}, process.env, {TMPDIR: T, DRILL_PAGE: path.join(T, 'index.html')})});
const out = rc.stdout;
const log = path.join(T, 'checks.log'); fs.writeFileSync(log, out);
check(out.includes(`NOT RUN CASE  features/worksheets-ink/test.js :: ${PDF}  — ${WHY}`), 'run_checks.sh lists the case as "NOT RUN CASE  <check> :: <label>  — <why>", a prefix of its own', out);
check(/^PASS +features\/worksheets-ink\/test\.js +1 checks passed, 1 NOT RUN/m.test(out), 'the check itself is listed as PASS, with its case named');
check(/2 PASS, 0 FAIL, 1 NOT RUN, 0 REPORT, 2 NOT RUN case\(s\); logs in /.test(out), 'the final line counts the NOT RUN cases apart from the checks', out.split('\n').slice(-2).join(' '));

console.log('\n=== ci_course.sh accepts exactly the one documented case ===');
// what ci_course.sh does with a run's output: unexpected_notruns <log>, with $kind and $browser set
const rule = (kind, browser, file) => {
  const s = child.spawnSync('bash', ['-c', `set -euo pipefail; source "$1"; kind="$2"; browser="$3"; unexpected_notruns "$4" >/dev/null || true; echo "$UNEXPECTED_NOTRUNS"`, '_', path.join(T, 'ci_exclusions.sh'), kind, browser, file], {encoding: 'utf8'});
  return s.status === 0 ? +s.stdout.trim() : `error ${s.status}: ${s.stderr}`;
};
// a log as run_checks.sh writes it: the lines, then the final count line with the number of case lines
const one = (lines, name, counted) => {
  const ls = [].concat(lines), n = counted != null ? counted : ls.filter(l => l.startsWith('NOT RUN CASE  ')).length;
  const f = path.join(T, name); fs.writeFileSync(f, ls.join('\n') + `\n1 PASS, 0 FAIL, 0 NOT RUN, 0 REPORT, ${n} NOT RUN case(s); logs in /x\n`); return f;
};
const permitted = one(`NOT RUN CASE  features/worksheets-ink/test.js :: ${PDF}  — ${WHY}`, 'permitted.log');
check(rule('module:worksheets-ink', 'webkit', permitted) === 0, 'the worksheets-ink PDF-size case in WebKit is accepted');
check(rule('module:worksheets-ink', 'chromium', permitted) === 1, 'the same case in Chromium fails the run (the PDF and its size stay required there)');
check(rule('modules:worksheets-ink,chained-problem-sets', 'webkit', permitted) === 0, 'it is accepted on a course combining worksheets-ink with another module');
const cases = [
  ['another case of worksheets-ink in WebKit (its print layout)', `NOT RUN CASE  features/worksheets-ink/test.js :: the printed worksheet's print layout  — not here`],
  ['a similar label', `NOT RUN CASE  features/worksheets-ink/test.js :: the printed PDF  — ${WHY}`],
  ['the same case for another module', `NOT RUN CASE  features/theme/test.js :: ${PDF}  — ${WHY}`],
  ['the same case for a module whose path merely contains worksheets-ink', `NOT RUN CASE  features/worksheets-ink-x/test.js :: ${PDF}  — ${WHY}`],
  ['the same case for a core check', `NOT RUN CASE  browser_test.js :: ${PDF}  — ${WHY}`],
  ['another reason', `NOT RUN CASE  features/worksheets-ink/test.js :: ${PDF}  — the browser did not start`],
  ['the whole worksheets-ink test NOT RUN', `NOT RUN  features/worksheets-ink/test.js  page.pdf runs only in Chromium`],
  ['a whole-check NOT RUN worded like the permitted case', `NOT RUN  features/worksheets-ink/test.js :: ${PDF}  — ${WHY}`],
  ['a case line without its reason separator', `NOT RUN CASE  features/worksheets-ink/test.js :: ${PDF} page.pdf runs only in Chromium`]
];
for(const [label, line] of cases) check(rule('module:worksheets-ink', 'webkit', one(line, 'x.log')) === 1, `refused in WebKit: ${label}`);
check(rule('template', 'webkit', log) === 2, 'the run above (its real output): only_case.js fails it twice (the whole check NOT RUN and its case); the PDF-size case does not count', rule('template', 'webkit', log));
check(rule('template', 'chromium', one('NOT RUN  cite_check.py     no lecture PDFs found under decks/ or src/', 'cite.log')) === 0, 'the existing exclusion for cite_check.py still holds');
check(rule('template', 'chromium', one('NOT RUN  cite_check.py     pdfplumber is not installed', 'cite2.log')) === 1, 'cite_check.py for any other reason still fails the run');
const many = one(Array.from({length: 256}, (_, i) => `NOT RUN CASE  features/x/test.js :: item ${i}  — not here`), 'many.log');
check(rule('template', 'webkit', many) === 256, '256 unexpected cases are counted as 256: the count cannot wrap to 0', rule('template', 'webkit', many));
check(rule('module:worksheets-ink', 'webkit', one(`NOT RUN CASE  features/worksheets-ink/test.js :: ${PDF}  — ${WHY}`, 'forged.log', 0)) === 1, 'a case line that run_checks.sh did not count (a forged line) fails the run');
{
  const ci = fs.readFileSync(path.join(HERE, 'ci_course.sh'), 'utf8');
  check(/^source "\$kit\/core\/ci_exclusions\.sh"$/m.test(ci) && /unexpected_notruns "\$work\/checks\.log"/.test(ci) && /unexpected=\$UNEXPECTED_NOTRUNS/.test(ci) && /if \[ "\$unexpected" -gt 0 \]; then/.test(ci),
    'ci_course.sh sources this rule, applies it to the run\'s log and fails on any unexpected line');
}
const step = one('NOT RUN  stepper_test.js   no step-through figures in this course', 'step.log');
check(rule('medicinal-chemistry', 'chromium', step) === 0 && rule('template', 'chromium', step) === 1, 'the stepper_test.js exclusion still holds for medicinal-chemistry only');
check(rule('template', 'chromium', one('NOT RUN  storage_test.js   Node Playwright is not installed', 'pw.log')) === 1, 'any other NOT RUN check still fails the run');

console.log('\n=== The checks the exclusion can never replace stay required ===');
{
  const logs = path.join(T, 'logs'); fs.mkdirSync(logs, {recursive: true});
  const lf = path.join(logs, 'features__worksheets-ink__test.js.log');
  const req = (order, browser, lines) => {
    fs.writeFileSync(lf, lines.join('\n') + '\n');
    const s = child.spawnSync('bash', ['-c', 'set -euo pipefail; source "$1"; missing_required "$2" "$3" "$4" >/dev/null || true; echo "$MISSING_REQUIRED"', '_', path.join(T, 'ci_exclusions.sh'), order, browser, logs], {encoding: 'utf8'});
    return s.status === 0 ? +s.stdout.trim() : `error ${s.status}: ${s.stderr}`;
  };
  const PRINT = [
    "  ok    in print the worksheet's paper is laid out and every problem prints with its text (700 x 2985 px, 5 of 5 problems)",
    "  ok    in print the ink's picture covers its problem and holds the stroke (1 of 1)",
    '  ok    the worksheet renders in print media (158 KB picture of the paper)'];
  const PDFOK = '  ok    the printed PDF has the worksheet (56 KB)', LAYOUT = '  ok    Save as PDF prints the worksheet alone, ink as pictures in place of the canvases [1]';
  check(req('worksheets-ink', 'chromium', [LAYOUT, ...PRINT, `  skip  the printed PDF has the worksheet  — not here`]) === 1, 'Chromium: the PDF check skipped instead of passed fails the run');
  check(req('worksheets-ink', 'webkit', [LAYOUT, ...PRINT, `  NOT RUN  ${PDF}  — ${WHY}`]) === 0, 'WebKit: the print layout passed and the PDF size is the permitted case: nothing missing');
  check(req('worksheets-ink', 'webkit', [...PRINT, `  NOT RUN  ${PDF}  — ${WHY}`]) === 1, 'WebKit: without the print-layout check passing, the run fails');
  check(req('worksheets-ink', 'chromium', [PDFOK, LAYOUT, ...PRINT]) === 0, 'Chromium: the PDF check and every print-layout check passed: nothing missing');
  check(req('worksheets-ink', 'chromium', [PDFOK, ...PRINT]) === 1, 'Chromium: with only "Save as PDF prints the worksheet alone" missing, the run fails');
  for (const br of ['chromium', 'webkit']) PRINT.forEach((line, i) => {
    const rest = [PDFOK, LAYOUT, ...PRINT.filter((_, k) => k !== i)];
    check(req('worksheets-ink', br, rest) === 1, `${br}: without "${line.trim().slice(4).replace(/ \(.*$/, '')}" passing, the run fails`);
  });
  check(req('worksheets-ink', 'chromium', [LAYOUT, ...PRINT, '  FAIL  the printed PDF has the worksheet (0 KB)', 'note:  ok    the printed PDF has the worksheet']) === 1, 'a FAIL line, or the passing text anywhere but the start of a line, does not count as the pass');
  check(req('chained-problem-sets worksheets-ink', 'webkit', [LAYOUT, ...PRINT]) === 0 && req('chained-problem-sets', 'webkit', []) === 0, 'it applies when worksheets-ink is one of the modules on, and only then');
  const ci = fs.readFileSync(path.join(HERE, 'ci_course.sh'), 'utf8');
  check(/^  missing_required "\$order" "\$browser" "\$logs" \|\| true$/m.test(ci) && /^  if \[ "\$MISSING_REQUIRED" -gt 0 \]; then$/m.test(ci), 'ci_course.sh applies this to every module course');
}

fs.rmSync(T, {recursive: true, force: true});
L.finish(NAME);
