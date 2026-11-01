/* course.js `tools`: the course's own tables for cite_check.py, explain_check.js
 * and harvest_mask.py.
 *
 * A core update copies every core file over the course's (Mode 7). While these
 * three tools kept the course's tables at the top of their own files
 * (cite_check.py ALIASES, LECTURES, BARE_MAP; explain_check.js WEIGHTY;
 * harvest_mask.py SPEC), that copy replaced the course's tables with the kit's
 * empty ones, with no error (Medicinal-chemistry has entries in all three). The
 * tables now live in course.js `tools`, which a core update never replaces.
 *
 * Checked on scratch copies of this source tree, after this core's three tools
 * and build.py are copied over the copy's own:
 *   - each tool prints the tables it read (--tables), and they are the ones in
 *     course.js: the course's own, and a set of test tables;
 *   - the tables change what the tools find: explain_check.js reports a course
 *     term that has no gloss, and does not once the term is gone; cite_check.py
 *     checks citations against a deck that only a course alias names (when
 *     pdfplumber is installed);
 *   - without `tools` every table is empty, so the three files hold none;
 *   - a field no tool reads, or a table of the wrong shape, stops the build.
 *
 *     node tables_test.js
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'tables_test.js';
const {check} = L;
const TOOLS = ['cite_check.py', 'explain_check.js', 'harvest_mask.py'];
const FIXTURE = 'zz_tables_test.pdf';
// test tables; the explain term matches any explanation with an "e" in it and
// is shown as its first alternative, zztablestest, a key no glossary has
const TABLES = {
  citeAliases:  {'zz-tables-test.pdf': FIXTURE, 'zz-not-on-hand.pdf': null},
  citeLectures: {'98': FIXTURE},
  citeBareMap:  {'Tables Test Deck': FIXTURE, 'Tables Test Missing': null},
  explainTerms: [['zz-tables-test', 'zztablestest|e']],
  harvestMasks: [['zz_tables_test_crop', ['ZZ TABLES TEST', 'second phrase']]],
};

delete process.env.DRILL_PAGE;
function run(src, file, args, env){
  const cmd = /\.py$/.test(file) ? 'python3' : process.execPath;
  const r = child.spawnSync(cmd, [file].concat(args || []), {cwd: src, encoding: 'utf8', timeout: 600000,
    env: Object.assign({}, process.env, env || {})});
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  return {code: r.status, out, last: out.split('\n').pop()};
}
const build = src => run(src, 'build.py');
function tablesOf(src, file){
  const r = run(src, file, ['--tables']);
  try { return JSON.parse(r.last); } catch(e){ return {error: r.last}; }
}
// equal as data, whatever the key order
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const show = v => JSON.stringify(v).slice(0, 160);
/* A scratch copy of this source tree with `courseLine` appended to course.js,
   then the core update: this core's three tools and build.py copied over. */
function scratch(label, courseLine){
  const repo = L.scratchRepo(L.PAGE.SRC, 'tables-' + label);
  const src = path.join(repo, 'src');
  if(courseLine) fs.appendFileSync(path.join(src, 'course.js'), '\n;' + courseLine + '\n');
  TOOLS.concat(['build.py']).forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(src, f)));
  return {repo, src};
}
const courseTools = src => {
  const C = new Function(fs.readFileSync(path.join(src, 'course.js'), 'utf8') + ';return COURSE;')();
  return C.tools === undefined ? {} : C.tools;
};
const field = (t, k, empty) => t[k] == null ? empty : t[k];
// what each tool printed, against the tables it should have read
function seen(src, want, label){
  const cite = tablesOf(src, 'cite_check.py');
  check(!cite.error && ['citeAliases', 'citeLectures', 'citeBareMap'].every(k => same(cite[k], field(want, k, {}))),
    `${label}: cite_check.py reads citeAliases, citeLectures and citeBareMap from course.js ` +
    `(${['citeAliases', 'citeLectures', 'citeBareMap'].map(k => Object.keys(field(want, k, {})).length).join(', ')} entries)`,
    cite.error || show(cite));
  const ex = tablesOf(src, 'explain_check.js');
  const terms = field(want, 'explainTerms', []);
  check(!ex.error && same(ex.explainTerms, terms) && Array.isArray(ex.inUse) &&
        same(ex.inUse.slice(ex.inUse.length - terms.length), terms),
    `${label}: explain_check.js reads explainTerms from course.js and appends them to its own list ` +
    `(${terms.length} of ${Array.isArray(ex.inUse) ? ex.inUse.length : '?'} terms in use)`, ex.error || show(ex));
  const hm = tablesOf(src, 'harvest_mask.py');
  check(!hm.error && same(hm.harvestMasks, field(want, 'harvestMasks', [])),
    `${label}: harvest_mask.py reads harvestMasks from course.js (${field(want, 'harvestMasks', []).length} crops)`,
    hm.error || show(hm));
}
// explain_check.js's full listing, every flagged question shown
const explain = src => run(src, 'explain_check.js', [], {LIMIT: '1000000'});
/* A PDF of one blank page, for cite_check.py to count. */
function onePagePdf(){
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>'];
  let out = '%PDF-1.4\n';
  const at = objs.map((o, i) => { const n = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return n; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + at.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('');
  return out + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}
const withFixture = src => {
  fs.readdirSync(src).filter(f => /\.pdf$/i.test(f)).forEach(f => fs.unlinkSync(path.join(src, f)));
  fs.mkdirSync(path.join(src, 'decks'), {recursive: true});
  fs.writeFileSync(path.join(src, 'decks', FIXTURE), onePagePdf());
};

console.log('\n=== course.js `tools` across a core update ===');
// 1. the course's own tables, whatever they are, as the tools read them after the copy
{
  const {repo, src} = scratch('own', '');
  seen(src, courseTools(src), 'the course\'s own tables');
  fs.rmSync(repo, {recursive: true, force: true});
}

// 2. test tables: read, and used
let flagged = null;
{
  const {repo, src} = scratch('kept', `COURSE.tools = ${JSON.stringify(TABLES)};`);
  const b = build(src);
  check(b.code === 0, 'the course builds with test tables in course.js `tools`', b.last);
  seen(src, TABLES, 'test tables');
  const names = TOOLS.filter(f => fs.readFileSync(path.join(src, f), 'utf8').includes('zztablestest'));
  check(!names.length, 'the three tools name none of the test tables: the tables are the course\'s', names.join(', '));
  const e = explain(src);
  flagged = (e.out.match(/no gloss available: [^\n]*zztablestest/g) || []).length;
  check(e.code === 0 && /^REPORT: /.test(e.last) && flagged > 0,
    `explain_check.js reports the course term with no gloss (${flagged} questions)`, e.last);
  fs.rmSync(repo, {recursive: true, force: true});
}

// 3. without `tools`: every table empty, and the course term is not reported
{
  const {repo, src} = scratch('none', 'delete COURSE.tools;');
  const b = build(src);
  check(b.code === 0, 'the course builds without `tools`', b.last);
  seen(src, {}, 'without `tools`');
  const e = explain(src);
  check(e.code === 0 && /^REPORT: /.test(e.last) && !/zztablestest/.test(e.out),
    'without the course term, explain_check.js does not report it', e.last);
  fs.rmSync(repo, {recursive: true, force: true});
}

// 4. cite_check.py: a deck only an alias names is checked; without the alias it is not
const plumber = child.spawnSync('python3', ['-c', 'import pdfplumber'], {encoding: 'utf8'}).status === 0;
if(!plumber) L.skip('cite_check.py with a course alias, on a one-page deck', 'pdfplumber is not installed');
else {
  const C = new Function(fs.readFileSync(path.join(L.PAGE.SRC, 'course.js'), 'utf8') + ';return COURSE;')();
  const decks = [...new Set((C.lectures || []).map(l => String(l.deck).toLowerCase()))];
  const aliases = Object.fromEntries(decks.map(d => [d, FIXTURE]));
  const res = {};
  for(const [label, line] of [['alias', `COURSE.tools = {citeAliases: ${JSON.stringify(aliases)}};`],
                              ['noalias', 'delete COURSE.tools;']]){
    const {repo, src} = scratch('cite-' + label, line);
    withFixture(src);
    const b = build(src);
    res[label] = b.code === 0 ? run(src, 'cite_check.py') : {code: -1, out: '', last: 'build failed: ' + b.last};
    fs.rmSync(repo, {recursive: true, force: true});
  }
  const m = res.alias.out.match(/(\d+) slide references checked against 1 decks/);
  check(res.alias.code !== 2 && m && Number(m[1]) > 0,
    `with every lecture deck aliased to a one-page deck, cite_check.py checks ${m ? m[1] : 0} slide references against it`, res.alias.last);
  check(res.noalias.code === 2 && /no citation matched/.test(res.noalias.last),
    'without the aliases it checks none of them (NOT RUN: no citation matched a deck on hand)', res.noalias.last);
}

// 5. tables the build refuses, before it writes anything
for(const [what, line, named] of [
  ['a field no tool reads (citeAlias)', 'COURSE.tools = {citeAlias: {}};', 'citeAlias'],
  ['explainTerms written as a regex instead of its source', "COURSE.tools = {explainTerms: [['k', /x/]]};", 'tools.explainTerms'],
  ['harvestMasks with its phrases not in a list', "COURSE.tools = {harvestMasks: [['key', 'phrase']]};", 'tools.harvestMasks'],
  ['citeAliases naming a deck with a number', "COURSE.tools = {citeAliases: {'a.pdf': 3}};", 'tools.citeAliases']]){
  const {repo, src} = scratch('bad', line);
  const b = build(src);
  check(b.code !== 0 && b.out.includes(named) && !fs.existsSync(path.join(repo, 'index.html')),
    `the build stops on ${what}, names it and writes nothing`, b.last);
  fs.rmSync(repo, {recursive: true, force: true});
}
L.finish(NAME);
