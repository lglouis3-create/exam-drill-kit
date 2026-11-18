/* state_check.js on scratch repositories with known histories: it passes when
 * CLAUDE.md was updated with or after the newest lecture, fails when it was not
 * (committed or still in the working copy), fails when there is no CLAUDE.md, and
 * reports NOT RUN outside git and on a clone too shallow to tell.
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'state_check_test.js';

console.log('\n=== state_check.js on known histories ===');
const repo = L.scratchRepo(__dirname, 'state-test');
const src = path.join(repo, 'src');
let clock = 1767225600;                       // 2026-01-01 00:00 UTC; each commit one hour later
const git = (args, cwd) => child.spawnSync('git', args, {cwd: cwd || repo, encoding: 'utf8',
  env: Object.assign({}, process.env, {GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid',
    GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid',
    GIT_AUTHOR_DATE: `${clock} +0000`, GIT_COMMITTER_DATE: `${clock} +0000`})});
const commit = msg => { clock += 3600; git(['add', '-A']); return git(['commit', '-q', '-m', msg]); };
const state = (cwd) => {
  const r = child.spawnSync('node', ['state_check.js'], {cwd: cwd || src, encoding: 'utf8'});
  return {code: r.status, last: (r.stdout.trim().split('\n').pop() || '')};
};
const course = path.join(src, 'course.js');
const addLecture = id => {
  const s = fs.readFileSync(course, 'utf8');
  const at = s.indexOf('  lectures: [\n') + '  lectures: [\n'.length;
  fs.writeFileSync(course, s.slice(0, at) + `    {id:'${id}', deck:'${id}.pdf', label:'${id}', prof:'Professor', exam:1, module:'Module 1'},\n` + s.slice(at));
};

let r = state();
L.check(r.code === 2, 'outside a git repository: NOT RUN', r.last);

git(['init', '-q']);
fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# state\n');
commit('first lecture and state');
r = state();
L.check(r.code === 0, 'lecture and CLAUDE.md in one commit: PASS', r.last);

addLecture('L02'); commit('add L02 without the state');
r = state();
L.check(r.code === 1 && /L02/.test(r.last), 'a lecture committed after the last CLAUDE.md change: FAIL, naming it', r.last);

fs.appendFileSync(path.join(repo, 'CLAUDE.md'), 'L02 ingested\n');
r = state();
L.check(r.code === 0, 'CLAUDE.md changed in the working copy after that: PASS', r.last);
commit('state for L02');
r = state();
L.check(r.code === 0, 'CLAUDE.md committed after the lecture: PASS', r.last);

addLecture('L03');
r = state();
L.check(r.code === 1 && /L03/.test(r.last), 'a lecture not committed yet, CLAUDE.md unchanged: FAIL', r.last);
commit('L03');

const shallow = path.join(path.dirname(repo), path.basename(repo) + '-shallow');
L.scratchAdd(shallow);   // removed with the scratch copy when this check passes
child.spawnSync('git', ['clone', '-q', '--depth', '1', 'file://' + repo, shallow], {encoding: 'utf8'});
r = state(path.join(shallow, 'src'));
L.check(r.code === 2 && /shallow/.test(r.last), 'a depth-1 clone where the newest lecture is in the first commit: NOT RUN', r.last);

fs.rmSync(path.join(repo, 'CLAUDE.md')); commit('remove the state');
r = state();
L.check(r.code === 1 && /CLAUDE\.md/.test(r.last), 'no CLAUDE.md at the repository root: FAIL', r.last);
L.finish(NAME);
