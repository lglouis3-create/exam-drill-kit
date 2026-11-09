/* Which module courses the kit's GitHub workflow checks (.github/workflows/checks.yml,
 * jobs "modules", in Chromium, and "modules-webkit", in WebKit). Prints `courses=<JSON list>` for $GITHUB_OUTPUT, each entry a
 * course for core/ci_course.sh, and on stderr why each one runs.
 *
 *     node .github/ci_plan.js <event> [<base commit>]
 *
 * A module is a folder features/<name>/ with current/module.json.
 *   - On a pull request: each module with a changed file under features/<name>/, and
 *     every module that needs one of them (module.json `needs`, followed through), so a
 *     changed module is checked with the modules built on it. A change under core/,
 *     template/ or .github/ checks every module, since any of them can break with it.
 *   - On a push to main or a run started by hand: every module.
 * Each selected module runs as `module:<name>`, its own course. Each line of
 * features/ci-combinations.txt names modules switched on together (`*` stands for
 * every module); it runs as `modules:<a>,<b>,...` when every module it names exists
 * and at least one of them is selected. The modules it names also run alone, as
 * above, so each pair is checked with the partner present and absent.
 * Exits 1 when a folder name is not a module name (lower-case letters, digits and
 * hyphens) or a combination names a malformed module, so nothing malformed reaches a
 * job's command line.
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const [event, base] = process.argv.slice(2);
const say = m => process.stderr.write(m + '\n');
const stop = m => { say('ci_plan: ' + m); process.exit(1); };
const NAME = /^[a-z0-9][a-z0-9-]*$/;

const dir = path.join(ROOT, 'features');
const modules = fs.readdirSync(dir).filter(n => fs.existsSync(path.join(dir, n, 'current', 'module.json'))).sort();
for(const n of modules) if(!NAME.test(n)) stop(`features/${n} is not a module name`);
const needs = Object.fromEntries(modules.map(n => {
  try { return [n, JSON.parse(fs.readFileSync(path.join(dir, n, 'current', 'module.json'), 'utf8')).needs || []]; }
  catch(e){ stop(`features/${n}/current/module.json cannot be read: ${e.message}`); }
}));

let selected;
if(event === 'pull_request'){
  if(!base) stop('a pull request needs its base commit');
  const r = child.spawnSync('git', ['diff', '--name-only', base, 'HEAD'], {cwd: ROOT, encoding: 'utf8'});
  if(r.status !== 0) stop('git diff against the base failed: ' + (r.stderr || '').trim());
  const changed = r.stdout.split('\n').filter(Boolean);
  if(changed.some(f => /^(core|template|\.github)\//.test(f))){
    selected = new Set(modules);
    say('core/, template/ or .github/ changed: every module');
  } else {
    selected = new Set(modules.filter(n => changed.some(f => f.startsWith(`features/${n}/`))));
    say('changed modules: ' + ([...selected].join(', ') || 'none'));
    // and every module that needs a selected one, followed through
    for(let grew = true; grew;){
      grew = false;
      for(const n of modules) if(!selected.has(n) && needs[n].some(d => selected.has(d))){ selected.add(n); grew = true; say(`${n} needs a changed module`); }
    }
  }
} else {
  selected = new Set(modules);
  say(`${event || 'no event'}: every module`);
}

const courses = [...selected].sort().map(n => 'module:' + n);
const combos = path.join(dir, 'ci-combinations.txt');
if(fs.existsSync(combos)){
  for(const raw of fs.readFileSync(combos, 'utf8').split('\n')){
    const line = raw.replace(/#.*/, '').trim();
    if(!line) continue;
    const names = line.split(',').map(s => s.trim()).filter(Boolean);
    for(const n of names) if(n !== '*' && !NAME.test(n)) stop(`features/ci-combinations.txt names "${n}", which is not a module name`);
    const named = names.filter(n => n !== '*');
    const absent = named.filter(n => !modules.includes(n));
    if(absent.length){ say(`combination ${line}: not run, ${absent.join(', ')} not in this tree`); continue; }
    const all = names.includes('*') ? [...new Set(named.concat(modules))] : named;
    if(!all.some(n => selected.has(n))){ say(`combination ${line}: not run, none of its modules is selected`); continue; }
    if(all.length < 2){ say(`combination ${line}: not run, it holds one module`); continue; }
    courses.push('modules:' + all.join(','));
    say(`combination ${line}: modules:${all.join(',')}`);
  }
}
process.stdout.write('courses=' + JSON.stringify(courses) + '\n');
