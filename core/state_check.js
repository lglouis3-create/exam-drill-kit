/* The course's state file is current: CLAUDE.md at the repository root was
 * updated after the newest lecture was added (KIT_DESIGN.md §7.8).
 *
 * The state a later session starts from is that CLAUDE.md, with reviews/LOG.md
 * and reviews/OPEN_QUESTIONS.md. A session that adds a lecture and does not
 * update it leaves the next session working from an old account of what has been
 * ingested and checked.
 *
 * The newest lecture is the one in course.js `lectures` that was added last,
 * by git history: a lecture is added in the earliest commit whose change to
 * src/course.js contains its `id:'…'` entry, or now if that entry is not
 * committed yet. CLAUDE.md was updated at its last commit, or now if the working
 * copy differs from the last commit. The check passes when CLAUDE.md was updated
 * at the same time as, or after, the newest lecture was added.
 *
 * NOT RUN (exit 2) when the source tree is not in a git repository, when
 * course.js lists no lecture, or when the clone is too shallow to show the
 * commit that added the newest lecture.
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'state_check.js';

console.log('\n=== CLAUDE.md is updated after the newest lecture ===');
const SRC = __dirname, ROOT = path.dirname(SRC);
const git = args => child.spawnSync('git', args, {cwd: ROOT, encoding: 'utf8'});
if(git(['rev-parse', '--is-inside-work-tree']).stdout.trim() !== 'true') L.notRun(NAME, 'the source tree is not in a git repository');
const top = git(['rev-parse', '--show-toplevel']).stdout.trim();
if(path.resolve(top) !== path.resolve(ROOT)) L.notRun(NAME, `src/ is not directly under the repository root (${top})`);

const sb = {}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(SRC, 'course.js'), 'utf8') + '\nglobalThis.C = COURSE;', sb);
const lectures = (sb.C.lectures || []).map(l => String(l.id)).filter(Boolean);
if(!lectures.length) L.notRun(NAME, 'course.js lists no lecture');

const now = Math.floor(Date.now() / 1000);
const hasHead = git(['rev-parse', '--verify', '-q', 'HEAD']).status === 0;
const shallow = git(['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true';
const boundary = new Set(shallow && fs.existsSync(path.join(ROOT, '.git', 'shallow'))
  ? fs.readFileSync(path.join(ROOT, '.git', 'shallow'), 'utf8').split('\n').filter(Boolean) : []);
const committedCourse = hasHead ? git(['show', 'HEAD:src/course.js']).stdout : '';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// when each lecture was added
const added = lectures.map(id => {
  const entry = `id:\\s*['"]${esc(id)}['"]`;
  if(!hasHead || !new RegExp(entry).test(committedCourse)) return {id, at: now, how: 'not committed yet'};
  const log = git(['log', '--format=%H %ct', '-G', entry, '--', 'src/course.js']).stdout.trim().split('\n').filter(Boolean);
  const [sha, ct] = (log[log.length - 1] || '').split(' ');
  if(!sha) return {id, at: null, how: 'no commit found'};
  return {id, at: Number(ct), how: `commit ${sha.slice(0, 7)}`, sha};
});
const unknown = added.filter(a => a.at === null);
if(unknown.length) L.notRun(NAME, `git history shows no commit that added lecture ${unknown.map(a => a.id).join(', ')}`);
const newest = added.reduce((a, b) => (b.at >= a.at ? b : a));
if(newest.sha && boundary.has(newest.sha))
  L.notRun(NAME, `the clone is too shallow to tell when lecture ${newest.id} was added (its oldest commit here is the clone's first)`);

// when CLAUDE.md was last updated
const statePath = path.join(ROOT, 'CLAUDE.md');
L.check(fs.existsSync(statePath), 'the repository root has CLAUDE.md, the course state file');
if(!fs.existsSync(statePath)) L.finish(NAME);
let stateAt, stateHow;
const tracked = hasHead && git(['ls-files', '--error-unmatch', 'CLAUDE.md']).status === 0;
if(!tracked){ stateAt = now; stateHow = 'not committed yet'; }
else if(git(['diff', '--quiet', 'HEAD', '--', 'CLAUDE.md']).status !== 0){ stateAt = now; stateHow = 'changed in the working copy'; }
else {
  const [sha, ct] = git(['log', '-1', '--format=%H %ct', '--', 'CLAUDE.md']).stdout.trim().split(' ');
  stateAt = Number(ct); stateHow = `commit ${sha.slice(0, 7)}`;
}
const day = t => new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
L.check(stateAt >= newest.at,
  `CLAUDE.md (${stateHow}, ${day(stateAt)}) is not older than the newest lecture, ${newest.id} (${newest.how}, ${day(newest.at)})`,
  `CLAUDE.md was last updated before lecture ${newest.id} was added: update it with what that lecture added`);
L.finish(NAME);
