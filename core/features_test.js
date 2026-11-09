/* course.js `features`: feature modules, and the hooks the engine offers them
 * (features.js, features/README.md).
 *
 * Checked on scratch copies of this source tree, with three probe modules written
 * into the copy's features/ folder by this test (their code is below):
 *   - `features: {}` and no `features` field build the same page, except the build
 *     stamp, and that page holds none of features.js;
 *   - the build stops, naming the problem, on a module that is not on disk, a
 *     version the folder does not hold, an option the module does not take, a
 *     module whose `needs` are not switched on, a question type no module draws,
 *     and a build step that throws; it lists each module's test (--list-checks);
 *   - in Chromium, with the probes on: the tab (placed before Settings, drawn on
 *     tap, kept across a reload), the question type (its card, its grader, the
 *     answer recorded), the step after an answer (it sees the kept entry), the
 *     pass after the engine draws a view, a reading tab's HTML before it is
 *     drawn, a new exam paper, the Settings section, the start-up step
 *     (once, after the progress is loaded), the progress converter (on a saved
 *     progress and on Import), the build step's output, and FX.api;
 *   - a module that throws while it loads is skipped and the rest of the page
 *     works; a module whose tab throws when drawn is switched off, its tab goes,
 *     and the page shows Topics; neither leaves a page error.
 *
 *     node features_test.js
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'features_test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

const py = (src, args) => {
  const r = child.spawnSync('python3', ['build.py'].concat(args || []), {cwd: src, encoding: 'utf8', timeout: 600000});
  return {code: r.status, out: ((r.stdout || '') + (r.stderr || '')).trim()};
};
const lastLine = s => s.split('\n').pop();
/* a scratch copy; `courseLine` is appended to course.js after the COURSE object */
function scratch(label, courseLine, mods){
  const repo = L.scratchRepo(L.PAGE.SRC, 'features-' + label);
  const src = path.join(repo, 'src');
  for(const [name, m] of Object.entries(mods || {})){
    const d = path.join(src, 'features', name);
    fs.mkdirSync(d, {recursive: true});
    for(const [f, text] of Object.entries(m)) fs.writeFileSync(path.join(d, f), typeof text === 'string' ? text : JSON.stringify(text, null, 1));
  }
  if(courseLine) fs.appendFileSync(path.join(src, 'course.js'), '\n;' + courseLine + '\n');
  return {repo, src, page: path.join(repo, 'index.html')};
}
const stampless = s => s.replace(/const BUILD = \{stamp:"[^"]*", built:"[^"]*",/, 'const BUILD = {stamp:"", built:"",');

/* ---- the probe modules ---------------------------------------------------- */
const meta = (name, extra) => Object.assign({name, version: 'v1', does: 'a probe for features_test.js',
  js: [name + '.js'], css: [], options: {}}, extra || {});
const PROBE_JS = `
const seen = window.__probe = {after: [], rendered: {}, start: 0, startDB: null, conv: 0};
X.api({hello: () => 'probe api ' + OPT.word});
X.tab({id: 'probe', label: 'Probe', render: el => {
  el.innerHTML = '<h2>Probe</h2><p id="probeTab">probe tab ' + OPT.word + ' ' + DATA.n + '</p>';
}});
X.type('probe-pick', {
  body: (q, Q) => Q.revealed
    ? '<p class="verdict" id="probeVerdict">' + (Q.lastRight ? 'right' : 'wrong') + ' (' + Q.picked + ')</p>'
    : '<p><button class="chip" data-probe="a">a</button> <button class="chip" data-probe="b">b</button></p>',
  wire: (q, el, Q) => el.querySelectorAll('[data-probe]').forEach(b => b.onclick = () => { Q.picked = b.dataset.probe; }),
  read: (q, el, Q) => Q.picked,
  grade: (q, picked) => picked === q.answer,
});
X.after((q, result, picked, mode, entry) => {
  seen.after.push({qid: q.id, result, picked, mode, kept: !!entry && entry.qid === q.id});
  if(entry) entry.probe = 'after';
});
X.rendered((pane, view) => { seen.rendered[view] = (seen.rendered[view] || 0) + 1; });
X.reading(html => html + '<p id="probeRead">probe reading</p>');
X.paper(qs => { seen.paperCalls = (seen.paperCalls || 0) + 1; seen.paper = qs.map(q => q.id);
  const mode = window.__paperMode || 'reverse';
  // other bank questions in as many places as the bank allows, the rest of the paper after them (a bank with
  // fewer questions outside the paper than the paper holds still gets a full-length paper of bank questions)
  if(mode === 'replace'){ const ids = new Set(qs.map(q => q.id)); const other = QUESTIONS.filter(q => !ids.has(q.id)).slice(0, qs.length);
    const res = other.concat(qs.slice(0, qs.length - other.length));
    seen.replaced = res.map(q => q.id); seen.others = other.length; return res; }
  if(mode === 'short') return qs.slice(1);
  if(mode === 'junk') return qs.map((q, i) => i ? q : {id: q.id});
  if(mode === 'twice') return qs.map((q, i) => i ? q : qs[1]);
  return qs.slice().reverse(); });
X.settings({title: 'Probe settings', html: () => '<p><button class="chip" id="probeSet">probe setting</button></p>',
            wire: el => { el.querySelector('#probeSet').onclick = () => { seen.setting = true; }; }});
X.start(() => { seen.start++; seen.startDB = !!(DB && DB.answers); });
X.progress(db => { (db.answers || []).forEach(a => { if(a.oldKind && !a.miss){ a.miss = a.oldKind; seen.conv++; } }); });
`;
const PROBE_STEP = `
const n = QUESTIONS.filter(q => q.type === 'probe-pick').length;
if(OPT.word === 'stop') throw new Error('the probe step was told to stop');
STEP = {n};
`;
const PROBES = {
  'fx-probe': {'module.json': meta('fx-probe', {types: ['probe-pick'], step: 'step.js', css: ['fx-probe.css'],
                 options: {word: {default: 'hello', about: 'a word the probe shows'}}}),
               'fx-probe.js': PROBE_JS, 'step.js': PROBE_STEP, 'fx-probe.css': '#probeTab{color:rgb(1, 2, 3)}\n'},
  'fx-probe-throws': {'module.json': meta('fx-probe-throws'),
               'fx-probe-throws.js': "X.tab({id: 'throws', label: 'Throws', render: el => { el.innerHTML = 'never'; }});\nthrow new Error('probe module fails while loading');\n"},
  'fx-probe-badtab': {'module.json': meta('fx-probe-badtab', {needs: ['fx-probe']}),
               'fx-probe-badtab.js': "X.tab({id: 'badtab', label: 'Bad tab', render: el => { throw new Error('probe tab fails when drawn'); }});\n" +
                                     "X.rendered((pane, view) => { window.__badRendered = (window.__badRendered || 0) + 1; });\n"},
};
const QFILE = 'q98_features_probe.js';
const QTEXT = `/* a question of the probe type, added by features_test.js */
QUESTIONS.push({id:'fx-probe-1', type:'probe-pick', answer:'b', prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id,
  sub:TOPICS[0].subs[0].id, concept:'fx-probe-1', skill:COURSE.skills[0].id, source:'slide', tags:[],
  stem:'PROBE: which button is the keyed one?', teach:'Probe item.', cite:'Probe (' + COURSE.lectures[0].deck + ') slide 1'});
`;
const withFiles = "COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat(['" + QFILE + "'])";
const on = extra => `COURSE.features = Object.assign({}, COURSE.features, ${JSON.stringify(extra)})`;
const ALL = {'fx-probe': {version: 'v1', word: 'zz-word'}, 'fx-probe-throws': {version: 'v1'}, 'fx-probe-badtab': {version: 'v1'}};

(async () => {
  console.log('\n=== no module switched on ===');
  {
    const a = scratch('empty', 'COURSE.features = {}'), b = scratch('absent', 'delete COURSE.features');
    const ra = py(a.src), rb = py(b.src);
    if(ra.code !== 0 || rb.code !== 0) L.notRun(NAME, 'the course does not build in a scratch copy: ' + lastLine(ra.out + '\n' + rb.out));
    const pa = fs.readFileSync(a.page, 'utf8'), pb = fs.readFileSync(b.page, 'utf8');
    // the appended line itself is part of course.js, which the page carries; it is taken out before comparing
    const pa0 = pa.replace('\n;COURSE.features = {}\n', '\n'), pb0 = pb.replace('\n;delete COURSE.features\n', '\n');
    check(pa0 !== pa && pb0 !== pb && stampless(pa0) === stampless(pb0),
          '`features: {}` and no `features` build the same page, except the build stamp', `${pa.length} and ${pb.length} characters`);
    check(!/const FX = /.test(pa) && !/FX\.load\(/.test(pa), 'that page holds none of features.js');
    check(py(a.src, ['--list-checks']).out.split('\n').filter(Boolean).every(c => c !== NAME),
          'without modules, --list-checks does not list this test');
    [a, b].forEach(s => fs.rmSync(s.repo, {recursive: true, force: true}));
  }

  console.log('\n=== what the build refuses ===');
  const refuse = (label, line, mods, want) => {
    const s = scratch(label, line, mods);
    if(line.includes(QFILE)) fs.writeFileSync(path.join(s.src, QFILE), QTEXT);
    const r = py(s.src);
    check(r.code !== 0 && want.test(r.out) && !fs.existsSync(s.page), `stops: ${label}`, lastLine(r.out));
    fs.rmSync(s.repo, {recursive: true, force: true});
  };
  refuse('a module that is not on disk', on({'fx-nowhere': {version: 'v1'}}), {}, /fx-nowhere.*is not there/);
  refuse('a version the folder does not hold', on({'fx-probe': {version: 'v2'}}), PROBES, /pins fx-probe v2.*holds v1/);
  refuse('an option the module does not take', on({'fx-probe': {version: 'v1', colour: 'red'}}), PROBES, /sets \['colour'\]/);
  refuse('an option of the wrong kind', on({'fx-probe': {version: 'v1', word: 3}}), PROBES, /word is int.*expects str/);
  refuse('a module whose needs are off', on({'fx-probe-badtab': {version: 'v1'}}), PROBES, /needs \['fx-probe'\]/);
  refuse('a question type no module draws', withFiles + ';' + on({}), {}, /type \['probe-pick'\]/);
  refuse('a build step that throws', withFiles + ';' + on({'fx-probe': {version: 'v1', word: 'stop'}}), PROBES, /told to stop/);

  console.log('\n=== the probes switched on ===');
  const s = scratch('probes', withFiles + ';' + on(ALL), PROBES);
  fs.writeFileSync(path.join(s.src, QFILE), QTEXT);
  const r = py(s.src);
  if(!check(r.code === 0, 'the course builds with the three probes on', lastLine(r.out))){ L.finish(NAME); }
  const checks = py(s.src, ['--list-checks']).out.split('\n');
  check(checks.includes(NAME), '--list-checks lists this test when a module is on', checks.join(', '));
  const srcs = JSON.parse(py(s.src, ['--list-sources']).out);
  check(['features.js', 'features/fx-probe/fx-probe.js', 'features/fx-probe/fx-probe.css'].every(f => srcs.includes(f)),
        '--list-sources names features.js and the modules\' files, so the device lint reads them');

  const {browser} = await L.launch(NAME);
  try {
    const ctx = await browser.newContext(L.OPEN_CTX);
    await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.goto(await L.pageUrl(s.page));
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForTimeout(300);

    const st = await page.evaluate(() => ({mods: FX.modules(), errors: FX.errors.slice(), wrapped: FX.wrapped.slice(),
      nav: [...document.querySelectorAll('#nav button')].map(b => b.dataset.v), probe: window.__probe,
      api: FX.api('fx-probe') && FX.api('fx-probe').hello(), apiOff: FX.api('fx-probe-throws')}));
    check(['show', 'renderQuiz', 'record', 'renderSettings', 'refFigures', 'drawPaper', 'load', 'upgradeDB'].every(w => st.wrapped.includes(w)),
          'the hooks attach to show, renderQuiz, record, renderSettings, refFigures, drawPaper, load and upgradeDB', st.wrapped.join(', '));
    const probes = st.mods.map(m => m.name).filter(n => n.startsWith('fx-probe'));
    check(probes.join(',') === 'fx-probe,fx-probe-throws,fx-probe-badtab',
          'the modules load in course order, a module after the ones it needs (the course\'s own modules first)', st.mods.map(m => m.name).join(','));
    check(st.mods.find(m => m.name === 'fx-probe-throws').on === false && st.errors.some(e => e.module === 'fx-probe-throws' && e.where === 'load'),
          'a module that throws while it loads is skipped, and the error is kept', JSON.stringify(st.errors));
    check(!st.nav.includes('throws'), 'the skipped module\'s tab is not in the nav');
    const at = st.nav.indexOf('probe');
    check(at > 0 && st.nav[at + 1] === 'badtab' && st.nav[at + 2] === 'settings', 'the tabs sit before Settings', st.nav.join(' '));
    check(st.probe.start === 1 && st.probe.startDB === true, 'the start-up step ran once, after the progress was loaded', st.probe);
    check(st.api === 'probe api zz-word', 'FX.api gives a module\'s offer, with its options; a skipped module offers nothing',
          st.api + ' / ' + st.apiOff);

    // the tab
    await page.click('#nav button[data-v="probe"]');
    const tab = await page.evaluate(() => ({text: (document.getElementById('probeTab') || {}).textContent, view: VIEW,
      hidden: document.getElementById('v-topics').classList.contains('hide'), color: getComputedStyle(document.getElementById('probeTab')).color,
      sel: document.querySelector('#nav button[data-v="probe"]').getAttribute('aria-selected')}));
    check(tab.text === 'probe tab zz-word 1', 'the tab draws its pane with the options and the build step\'s output', tab.text);
    check(tab.view === 'probe' && tab.hidden && tab.sel === 'true', 'the tab is the view on screen, the others hidden');
    check(tab.color === 'rgb(1, 2, 3)', 'the module\'s CSS is in the page', tab.color);
    await page.click('#nav button[data-v="topics"]');
    check(await page.evaluate(() => document.getElementById('v-probe').classList.contains('hide') && VIEW === 'topics'),
          'a core tab hides the module\'s pane again');

    // the question type
    await page.evaluate(() => { Q = {pool: [byId('fx-probe-1')], label: 'probe', current: null, answered: 0, lastId: null,
                                     sweep: ['fx-probe-1', 'fx-probe-1'], i: 0, examMode: false, picked: null, revealed: false};
                                nextQuestion(); show('quiz'); });
    check(await page.evaluate(() => !!document.querySelector('#v-quiz [data-probe="b"]') && /PROBE: which button/.test(document.querySelector('#v-quiz .stem').textContent)),
          'the question type draws its card: the stem, and its own body');
    await page.click('#v-quiz [data-probe="a"]'); await page.click('#btnCheck');
    const t1 = await page.evaluate(() => ({v: (document.getElementById('probeVerdict') || {}).textContent, last: DB.answers[DB.answers.length - 1],
                                           after: window.__probe.after.slice(), next: !!document.getElementById('btnNext')}));
    check(t1.v === 'wrong (a)' && t1.last.qid === 'fx-probe-1' && t1.last.result === 'wrong' && t1.last.picked === 'a',
          'its grader decides, and the answer is recorded with what was picked', t1);
    check(t1.after.length === 1 && t1.after[0].kept && t1.after[0].mode === 'sweep' && t1.last.probe === 'after',
          'the step after an answer sees the answer as kept, and can add to it', t1.after);
    check(t1.next, 'the answered card offers Next question');
    await page.click('#btnNext');
    await page.click('#v-quiz [data-probe="b"]'); await page.click('#btnCheck');
    check(await page.evaluate(() => document.getElementById('probeVerdict').textContent === 'right (b)' && DB.answers[DB.answers.length - 1].result === 'correct'),
          'the keyed pick is graded right');
    const rendered = await page.evaluate(() => window.__probe.rendered);
    check(rendered.quiz > 0 && rendered.topics > 0 && rendered.probe > 0, 'the pass after the engine draws ran on Topics, Quiz and the tab', rendered);

    // an exam paper
    const paper = await page.evaluate(() => ({got: drawPaper().map(q => q.id), seen: window.__probe.paper}));
    check(paper.seen && paper.seen.length && JSON.stringify(paper.got) === JSON.stringify(paper.seen.slice().reverse()),
          'the paper hook gets a new paper\'s questions in order and what it returns is the paper', paper);
    // the exam's opening page samples papers to describe its select-all items; those sample draws are not
    // new papers, so X.paper does not run on them (a hook that saves, such as paper-picker's, would
    // otherwise write the progress for papers nobody started; the porter's finding on #59)
    const sampled = await page.evaluate(() => {
      const before = window.__probe.paperCalls || 0;
      if(EX){ clearInterval(EX.timer); EX = null; } clearExam(); EXAM_SATA_SEEN = null; show('exam');
      return {calls: (window.__probe.paperCalls || 0) - before, page: !!document.getElementById('startExam'),
              sampled: !!(EXAM_SATA_SEEN && EXAM_SATA_SEEN.key)};
    });
    check(sampled.page && sampled.sampled && sampled.calls === 0,
          `the exam's opening page draws its sample papers without running the paper hook (${sampled.calls} hook calls)`, sampled);
    const real = await page.evaluate(() => { const before = window.__probe.paperCalls || 0; drawPaper(); return (window.__probe.paperCalls || 0) - before; });
    check(real === 1, `a paper drawn after the sampling still runs the paper hook once (${real})`, real);
    // the hook contract: a paper of the same length, the same questions reordered or other questions in
    // their place (paper-picker), is the paper (a refused result is checked last: it switches the module off)
    const contract = await page.evaluate(() => {
      const out = {};
      window.__paperMode = 'replace'; const r = drawPaper().map(q => q.id);
      out.replace = {got: r, want: window.__probe.replaced, others: window.__probe.others};
      window.__paperMode = 'reverse';
      return out;
    });
    if(contract.replace.others === 0) L.notRunCase('a paper hook may put other questions in place',
      'every question in the bank is on the paper, so there is no other question to put in');
    else check(contract.replace.want && contract.replace.want.length && JSON.stringify(contract.replace.got) === JSON.stringify(contract.replace.want),
          `a paper hook may put other questions in place (same length): its paper is the one drawn (${contract.replace.others} of ${contract.replace.want.length} replaced)`, contract.replace);
    // a draw that throws during the sampling still clears the flag: the next real paper runs the hook
    const thrown = await page.evaluate(() => {
      const keep = drawPaper; let n = 0;
      drawPaper = function(){ if(++n === 3) throw new Error('probe: a draw that fails'); return keep.apply(this, arguments); };
      EXAM_SATA_SEEN = null; examSataDrawn(); drawPaper = keep;
      const flag = EXAM_SAMPLING, before = window.__probe.paperCalls || 0; drawPaper(); EXAM_SATA_SEEN = null;
      return {flag, calls: (window.__probe.paperCalls || 0) - before};
    });
    check(thrown.flag === false && thrown.calls === 1, `a sample draw that throws leaves the flag off, and the next paper runs the hook once`, thrown);

    // a reading tab's HTML
    await page.click('#nav button[data-v="ref"]');
    check(await page.evaluate(() => !!document.querySelector('#v-ref #probeRead')), 'the reading hook changes a reading tab\'s HTML before it is drawn');

    // Settings
    await page.click('#nav button[data-v="settings"]');
    const set = await page.evaluate(() => { const b = document.querySelector('#v-settings [data-feature="fx-probe"] #probeSet');
      if(b) b.click(); return {title: (document.querySelector('#v-settings [data-feature="fx-probe"] h3') || {}).textContent, clicked: !!window.__probe.setting}; });
    check(set.title === 'Probe settings' && set.clicked, 'the Settings section is drawn at the end of Settings and wired', set);

    // the progress converter, on a saved progress (reload) and on Import
    await page.evaluate(() => { DB.answers[0].oldKind = 'unit'; delete DB.answers[0].miss; store.set(keyFor(PROFILE), JSON.stringify(DB)); });
    await page.evaluate(() => show('probe'));
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForTimeout(500);
    const conv = await page.evaluate(() => ({miss: DB.answers[0].miss, conv: window.__probe.conv, view: VIEW,
      shown: !document.getElementById('v-probe').classList.contains('hide')}));
    check(conv.miss === 'unit' && conv.conv === 1, 'the progress converter runs on the saved progress when it is loaded', conv);
    check(conv.view === 'probe' && conv.shown, 'a reload on the module\'s tab comes back to it', conv);
    const imp = await page.evaluate(() => { const db = JSON.parse(JSON.stringify(DB)); db.answers[0].oldKind = 'round'; delete db.answers[0].miss;
      const out = upgradeDB(db); return {miss: out.answers[0].miss, conv: window.__probe.conv}; });
    check(imp.miss === 'round' && imp.conv === 2, 'and on a progress read in by Import (upgradeDB)', imp);

    // a tab that throws when drawn
    await page.click('#nav button[data-v="badtab"]');
    await page.waitForTimeout(200);
    const bad = await page.evaluate(() => ({view: VIEW, tab: !!document.querySelector('#nav button[data-v="badtab"]'),
      err: FX.errors.filter(e => e.module === 'fx-probe-badtab').map(e => e.where), on: FX.modules().find(m => m.name === 'fx-probe-badtab').on,
      before: window.__badRendered || 0, topics: !document.getElementById('v-topics').classList.contains('hide')}));
    check(bad.view === 'topics' && bad.topics && !bad.tab && bad.on === false && bad.err.includes('tab badtab'),
          'a module whose tab throws is switched off: its tab goes and the page shows Topics', bad);
    await page.click('#nav button[data-v="quiz"]');
    const after = await page.evaluate(() => window.__badRendered || 0);
    check(after === bad.before, 'its other hooks stop too', `${bad.before} then ${after}`);
    await page.click('#nav button[data-v="probe"]');
    check(await page.evaluate(() => (document.getElementById('probeTab') || {}).textContent === 'probe tab zz-word 1'),
          'the other modules keep working');
    // a paper hook that returns another length is refused: the drawn paper is kept and the module is
    // switched off, like any module whose hook throws (last, since fx-probe is off afterwards)
    const short = await page.evaluate(() => { window.__paperMode = 'short'; const got = drawPaper().map(q => q.id);
      return {got, drawn: window.__probe.paper, on: FX.modules().find(m => m.name === 'fx-probe').on,
              err: FX.errors.filter(e => e.module === 'fx-probe').map(e => e.where)}; });
    check(JSON.stringify(short.got) === JSON.stringify(short.drawn) && short.on === false && short.err.includes('paper'),
          'a paper hook that returns another length is refused: the drawn paper is kept and the module is switched off', short);
    // switching a module off lasts for the visit: after a reload, a copy that is not the bank's question,
    // and a question given twice, are refused the same way (each on its own visit)
    for(const [mode, what] of [['junk', 'an entry that is not a question of the bank'], ['twice', 'the same question twice']]){
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const r = await page.evaluate(m => { window.__paperMode = m; const got = drawPaper();
        return {got: got.map(q => q.id), same: got.every(q => byId(q.id) === q), drawn: window.__probe.paper,
                on: FX.modules().find(x => x.name === 'fx-probe').on, err: FX.errors.filter(e => e.module === 'fx-probe').map(e => e.where)}; }, mode);
      check(JSON.stringify(r.got) === JSON.stringify(r.drawn) && r.same && r.on === false && r.err.includes('paper'),
            `a paper hook that returns ${what} is refused: the drawn paper is kept and the module is switched off`, r);
    }
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    fs.rmSync(s.repo, {recursive: true, force: true});
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
