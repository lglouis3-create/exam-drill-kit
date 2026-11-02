/* course.js `files`: the course's own list of data files, in build order.
 *
 * A core update copies the kit's build.py over the course's (Mode 7). While the
 * list of question files lived in build.py (DATA_FILES), that copy replaced a
 * course's list with the template's single question file, and a course with
 * more question files lost their questions from the page with no error
 * (Medicinal-chemistry has 15). The list now lives in course.js, which a core
 * update never replaces.
 *
 * Checked on scratch copies of this source tree:
 *   - with two more question files listed in course.js `files`, after this
 *     core's build.py is copied over the course's own, the page holds every
 *     question of every listed file; BUILD.questions, build.py --list-files,
 *     --list-sources and the device lint all go by the same list;
 *   - without `files`, the template's list is the default, and a question file
 *     in src/ that the list leaves out stops the build, naming the file;
 *   - a listed file that is missing, listed twice, or one of the sources the
 *     build always includes stops the build before anything is written.
 *
 *     node files_test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'files_test.js';
const {check} = L;
// the template's list, which build.py uses when course.js has no `files`
// (template/course.js and core/README.md say the same)
const TEMPLATE_FILES = ['atlas.js', 'diagrams.js', 'q1_topics.js'];
const EXTRA = ['q90_files_test_a.js', 'q91_files_test_b.js'];

const py = (src, args) => {
  const r = child.spawnSync('python3', ['build.py'].concat(args || []), {cwd: src, encoding: 'utf8'});
  return {code: r.status, out: ((r.stdout || '') + (r.stderr || '')).trim()};
};
const lastLine = s => s.split('\n').pop();
const listFiles = src => { const r = py(src, ['--list-files']); try { return JSON.parse(r.out); } catch(e){ return null; } };
/* A scratch copy of this source tree; `courseLine` is appended to course.js
   (after the COURSE object, whatever the course wrote in it). */
function scratch(label, courseLine){
  const repo = L.scratchRepo(L.PAGE.SRC, 'files-' + label);
  const src = path.join(repo, 'src');
  if(courseLine) fs.appendFileSync(path.join(src, 'course.js'), '\n;' + courseLine + '\n');
  return {repo, src};
}
const question = id => `/* a question file added by files_test.js */
QUESTIONS.push({id:'${id}', prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id,
  concept:'${id}', skill:COURSE.skills[0].id, source:'slide', tags:[],
  stem:'TEST ${id}: which option is the one marked right?',
  options:[{t:'The one marked right', correct:true, why:'Marked right in this test file.'},
           {t:'The one marked wrong', correct:false, why:'Marked wrong in this test file.'},
           {t:'Another one marked wrong', correct:false, why:'Marked wrong in this test file.'}],
  teach:'Test item.', cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'});
`;
/* QUESTIONS and BUILD of a built page, run in node without its boot block. */
function bankOf(page){
  try {
    const sb = {console}; vm.createContext(sb);
    const code = L.PAGE.engine(fs.readFileSync(page, 'utf8'));
    // the engine needs storage and a DOM only once it boots; the data and BUILD come first
    const at = code.indexOf('\nconst EXAM = ');
    if(at < 0) return {error: 'the page script has no `const EXAM = ` line after its data'};
    const data = code.slice(0, at);
    vm.runInContext(data + '\nglobalThis.__B = {ids: QUESTIONS.map(q => q.id), built: BUILD.questions};', sb);
    return sb.__B;
  } catch(e){ return {error: e.message}; }
}

console.log('\n=== course.js `files` ===');
// the course's own list, as this core's build.py reads it
const own = listFiles(L.PAGE.SRC);
const base = own && Array.isArray(own.files) ? own.files : TEMPLATE_FILES.filter(f => fs.existsSync(path.join(L.PAGE.SRC, f)));
if(!own) L.skip('the course\'s own list from build.py --list-files', 'this build.py does not print it; the template\'s list stands in');

// the questions of the course as it is, built in a scratch copy
const plain = scratch('plain', '');
const pb = py(plain.src);
if(pb.code !== 0) L.notRun(NAME, 'the course does not build in a scratch copy: ' + lastLine(pb.out));
const ownIds = bankOf(path.join(plain.repo, 'index.html')).ids || [];
fs.rmSync(plain.repo, {recursive: true, force: true});

// 1. two more question files, listed in course.js, across a copy of the core's build.py
{
  const {repo, src} = scratch('kept', `COURSE.files = ${JSON.stringify(base.concat(EXTRA))};`);
  EXTRA.forEach((f, i) => fs.writeFileSync(path.join(src, f), question('zfiles' + i)));
  // a core update: the kit's build.py replaces the course's (here, this core's own file)
  fs.copyFileSync(path.join(__dirname, 'build.py'), path.join(src, 'build.py'));
  const b = py(src);
  check(b.code === 0, 'the course builds with its question files listed in course.js `files`', lastLine(b.out));
  const after = bankOf(path.join(repo, 'index.html'));
  const nq = base.filter(f => /^q[0-9]/.test(f)).length + EXTRA.length;
  check(!after.error && ownIds.length && after.ids.length === ownIds.length + EXTRA.length &&
        ownIds.every(id => after.ids.includes(id)) && ['zfiles0', 'zfiles1'].every(id => after.ids.includes(id)),
    `after build.py is copied from the core, the page holds every question of the ${nq} listed question files (${(after.ids || []).length} = ${ownIds.length} + ${EXTRA.length})`,
    after.error || `${(after.ids || []).length} questions, want ${ownIds.length + EXTRA.length}`);
  check(after.built === (after.ids || []).length, `the page's question count says ${after.built}, the number of questions it holds`, `${after.built} vs ${(after.ids || []).length}`);
  const bpy = fs.readFileSync(path.join(src, 'build.py'), 'utf8');
  check(!EXTRA.some(f => bpy.includes(f)), 'build.py names none of the course\'s question files: the list is the course\'s');
  const lf = listFiles(src);
  check(lf && JSON.stringify(lf.files) === JSON.stringify(base.concat(EXTRA)) && JSON.stringify(lf.questions.slice(-2)) === JSON.stringify(EXTRA),
    'build.py --list-files gives the course.js list, in its order, with the question files of it', lf ? JSON.stringify(lf) : 'no list');
  let shipped = null;
  try { shipped = JSON.parse(py(src, ['--list-sources']).out); } catch(e){}
  check(Array.isArray(shipped) && base.concat(EXTRA).every(f => shipped.includes(f)) &&
        shipped.indexOf(EXTRA[0]) < shipped.indexOf(EXTRA[1]),
    `build.py --list-sources ships every listed file (${Array.isArray(shipped) ? shipped.length : 0} sources)`, JSON.stringify(shipped));
  const env = Object.assign({}, process.env); delete env.DRILL_PAGE;
  const d = child.spawnSync(process.execPath, ['device_lint.js'], {cwd: src, encoding: 'utf8', env});
  const lintOut = (d.stdout || '').trim();
  check(d.status === 0 && Array.isArray(shipped) && lintOut.includes(`every shipped source is on disk (${shipped.length})`),
    'the device lint reads the same list and passes', lastLine(lintOut) || (d.stderr || '').trim());
  fs.rmSync(repo, {recursive: true, force: true});
}

// 2. without `files`: the template's list, and an unlisted question file stops the build
{
  const {repo, src} = scratch('unlisted', 'delete COURSE.files;');
  fs.writeFileSync(path.join(src, EXTRA[0]), question('zfiles0'));
  const b = py(src);
  check(b.code !== 0 && b.out.includes(EXTRA[0]) && /not in/.test(b.out) && !fs.existsSync(path.join(repo, 'index.html')),
    `without \`files\`, a question file in src/ that the default list leaves out (${EXTRA[0]}) stops the build, named, and nothing is written`, lastLine(b.out));
  fs.rmSync(repo, {recursive: true, force: true});
}
{
  const {repo, src} = scratch('default', 'delete COURSE.files;');
  const others = fs.readdirSync(src).filter(f => /^q[0-9][A-Za-z0-9._-]*\.js$/.test(f) && !TEMPLATE_FILES.includes(f));
  if(!TEMPLATE_FILES.every(f => fs.existsSync(path.join(src, f)))) L.skip('the default list', 'this course has not got all of ' + TEMPLATE_FILES.join(', '));
  else {
    others.forEach(f => fs.unlinkSync(path.join(src, f)));
    const lf = listFiles(src);
    check(lf && JSON.stringify(lf.files) === JSON.stringify(TEMPLATE_FILES),
      `without \`files\` the build uses the template's list ${JSON.stringify(TEMPLATE_FILES)}`, lf ? JSON.stringify(lf.files) : 'no list');
  }
  fs.rmSync(repo, {recursive: true, force: true});
}

// 3. lists the build refuses
for(const [what, files, named] of [
  ['a listed file that is not in src/', base.concat(['q99_missing.js']), 'q99_missing.js'],
  ['a file listed twice', base.concat([base[base.length - 1]]), base[base.length - 1]],
  ['a source the build always includes (glossary.js)', base.concat(['glossary.js']), 'glossary.js'],
  ['a path instead of a file name', base.concat(['../q1_topics.js']), '../q1_topics.js']]){
  const {repo, src} = scratch('bad', `COURSE.files = ${JSON.stringify(files)};`);
  const b = py(src);
  check(b.code !== 0 && b.out.includes(named) && /`files`/.test(b.out) && !fs.existsSync(path.join(repo, 'index.html')),
    `the build stops on ${what}, names it and writes nothing`, lastLine(b.out));
  fs.rmSync(repo, {recursive: true, force: true});
}
L.finish(NAME);
