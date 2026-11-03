/* theme: the module's own test. run_checks.sh runs it when the course switches
 * the module on (build.py --list-checks).
 *
 * Basic-Pharmacokinetics has no test of its theme choice; its src/modcolor_test.py
 * (lines 61-68, at ac2eb73) checks that text in its dark theme reads at 4.5 : 1 or
 * better, which is ported here for every tab. Without a page:
 *   - theme.css holds the same dark rules twice, once for Match device on a dark
 *     device and once for Dark picked by the student;
 *   - every colour the core's :root sets (shell.html) has a dark value.
 * The module loads, with no error, in the engine run in node with no page (as
 * explain_check.js and test.js run it).
 * On a scratch copy of this course built with the module on and the fixture below added
 * (four Basic-Pharmacokinetics questions in a topic of their own), in Chromium:
 *   - the fixture's questions are in the copy, after the course's topics;
 *   - a stored Dark is on <html> in the first frame that shows the tabs;
 *   - Match device (nothing stored): a device set to light shows the core's light
 *     colours, a device set to dark the dark ones, with no data-theme on <html>;
 *   - the header holds the choice with Match device, Light and Dark; Dark on a light
 *     device and Light on a dark device win over the device, are kept through a
 *     reload, and Match device removes the stored choice;
 *   - Settings holds the same choice, kept in step with the header;
 *   - the choice is a device setting: kept under <ns>:theme, the same after a
 *     profile switch, not in the profile's saved progress and not in Export progress
 *     (made after 30 answers); Import progress in a fresh browser brings the answers
 *     and leaves that browser's choice as it was;
 *   - a stored value that is not light or dark reads as Match device; a browser that
 *     refuses storage still shows the page and keeps the choice for the visit;
 *   - a reload 0, 100 and 400 ms after a pick keeps it (it is written at once);
 *   - storage denied and storage full, after 25 answers with Light saved: Dark applies
 *     for the visit, the core's notice that the browser did not save shows, the saved
 *     choice and progress are not overwritten, and once storage works again they load
 *     and a new choice is saved;
 *   - on every tab, and on quiz cards (the course's first multiple-choice question and
 *     each fixture question, unanswered and answered), no text in the dark colours reads
 *     below 4.5 : 1 against what is behind it (3 : 1 for large text), both with the
 *     device dark and with Dark picked on a light device;
 *   - the answer box of a calculation is dark with readable text, and the page and the
 *     Settings radio buttons are drawn in the browser's dark style (color-scheme);
 *   - the progress, in memory and as saved after a pick, holds no theme;
 *   - no page error and no module error.
 *
 *     node features/theme/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/theme/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* The fixture: four questions of Basic-Pharmacokinetics, their topic and their deck, from
 * src/q15_module7b.js (pd-c01, pd-c02, pd-c04 and pd-c05, lines 109-188), the TOPICS entry
 * `pkpd` that file pushes (line 34) and src/course.js `lectures` entry L11, at ac2eb73, verbatim. The one
 * change to the data: `prof` is the template's "Professor" in the topic, the lecture and each
 * question (the kit's fixtures carry no personal names). The scratch copy holds them with
 * every question and topic id prefixed `thm-`, as a question file in the kit's form (one
 * question per line, opening {id:'...'), in a topic of its own after the course's topics, and
 * the deck in COURSE.lectures, so the colour and contrast checks below run on real course
 * pages as well as on the course's own. */
const FIX = {
  topic: {"id":"pkpd","name":"PK-PD relationship","prof":"Professor","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 2 \"Objectives\"","subs":[{"id":"pd","name":"Pharmacodynamics and the exposure–response relationship","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 3 \"Pharmacodynamics\""},{"id":"doseresp","name":"Response rising with dose and concentration up to a maximum","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 4 \"Relationship of Dose to Pharmacologic Effect\", 5 \"Typical Log Dose-versus-Pharmacologic Response Curves\" and 11 \"Summary\""},{"id":"teff","name":"Dose and the duration of activity, teff","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 6 to 9 and 12"},{"id":"dosefor","name":"The dose for a target duration of activity","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 8 and the In-Class Activity on slide 13"},{"id":"thalf","name":"Elimination half-life and the duration of activity","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 9 \"Effect of Dose and Elimination Half-life on Duration of Activity\" and 10 \"Effect of Elimination Half-life on Duration of Activity\""}]},
  lecture: {"id":"L11","deck":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf","label":"Module 7b: PK-PD relationship (12 Oct)","prof":"Professor","exam":3,"module":9},
  qs: [
    {"id":"pd-c01","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"pd","concept":"pd-definition","skill":"recall","source":"slide","stem":"Which term describes the relationship between drug concentration at the site of action (receptor) and the observed pharmacologic response?","options":[{"t":"Pharmacodynamics","correct":true,"why":"Pharmacodynamics starts where pharmacokinetics stops: it takes the concentration at the receptor and links it to the response that concentration produces, which is what the drug does to the body once it arrives."},{"t":"Pharmacokinetics","why":"Choosing this takes the half of the relationship that comes first. Pharmacokinetics describes how the dose becomes a concentration over time; the response that concentration produces at the receptor is pharmacodynamics."},{"t":"Bioavailability","why":"Choosing this takes the arrival of the drug for its effect. Bioavailability is the rate and extent to which the active ingredient is absorbed and becomes available at the site of action; it ends where the receptor response begins."},{"t":"Duration of activity","why":"Choosing this takes one measure of the response for the whole relationship. Duration of activity, teff, is the time the plasma level stays at or above the minimum effective concentration; pharmacodynamics is the concentration–response link itself."}],"teach":[{"h":"Pharmacodynamics and exposure–response","list":["Pharmacodynamics (PD): the relationship between drug concentration at the site of action, the receptor, and the observed pharmacologic response.","Pharmacokinetics (PK) turns the dose into a concentration over time; PD turns that concentration into a response.","The PK–PD relationship is also called the exposure–response, concentration–response or concentration–effect relationship.","Exposure–response information is used to determine safety and efficacy in drug approval, to understand benefit–risk, and to derive dosing information."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 3 \"Pharmacodynamics\""},
    {"id":"pd-c02","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","multi":true,"topic":"pkpd","sub":"pd","concept":"exposure-response-names","skill":"recall","source":"slide","stem":"The relationship between pharmacokinetics (PK) and pharmacodynamics (PD) is also referred to as which of the following? (Select all that apply)","options":[{"t":"exposure–response relationship","correct":true,"why":"Exposure is the pharmacokinetic side and response the pharmacologic observation. Joining them is the PK–PD relationship under its most common name."},{"t":"concentration–response relationship","correct":true,"why":"This names the same link with the plasma concentration as the measure of exposure: as the concentration at the receptor rises, the response rises toward its maximum."},{"t":"concentration–effect relationship","correct":true,"why":"Effect is the change in response that the concentration produces, so this third name again joins a PK quantity, the concentration, to a PD one, the effect."},{"t":"concentration–time relationship","why":"Choosing this takes the pharmacokinetic curve alone for the PK–PD link. Concentration against time, C = C0e^(−kt) after an IV bolus, has no response in it; PK–PD joins that concentration to an effect."},{"t":"rate–extent relationship","why":"Choosing this carries over the two parts of bioavailability, rate (read from tmax) and extent (read from AUC). Both describe how drug reaches the circulation, not the response it then produces."}],"teach":[{"h":"Pharmacodynamics and exposure–response","list":["Pharmacodynamics (PD): the relationship between drug concentration at the site of action, the receptor, and the observed pharmacologic response.","Pharmacokinetics (PK) turns the dose into a concentration over time; PD turns that concentration into a response.","The PK–PD relationship is also called the exposure–response, concentration–response or concentration–effect relationship.","Exposure–response information is used to determine safety and efficacy in drug approval, to understand benefit–risk, and to derive dosing information."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 3 \"Pharmacodynamics\""},
    {"id":"pd-c04","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"doseresp","concept":"response-up-to-max","skill":"recall","source":"slide","stem":"Which of the following is true regarding the relationship of dose to pharmacologic effect?","options":[{"t":"Response rises with dose up to a maximum effect","correct":true,"why":"More dose puts more drug at the receptor, so more receptors are occupied and the response grows; once all are occupied the response cannot rise further, which sets the maximum effect."},{"t":"The response increases in direct proportion to the dose at every dose.","why":"Choosing this extends the steep low-dose part of the curve to every dose. Near the top a further dose change gives only a small increase, and the response levels off at its maximum."},{"t":"The onset, intensity, and duration of the effect depend on the dose alone, not on the pharmacokinetics.","why":"Choosing this drops half of the statement: onset, intensity and duration depend on the dose and the pharmacokinetics. The same dose acts longer when elimination is slower, because the level stays above the MEC longer."},{"t":"The response falls once the dose passes the dose that gives the maximum response.","why":"Choosing this reads the plateau as a peak. The curve rises to the maximum response and stays there; added dose finds no free receptors, so it adds no response, but it does not take response away."}],"teach":[{"h":"Dose, concentration and response","list":["As the dose increases, the concentration at the receptor site increases, and the response increases up to a maximum effect.","Response against dose on a linear scale rises steeply, then flattens: the same dose change gives a large increase at low doses and a small one near the maximum.","Response against log dose is a sigmoid (S-shaped) curve; the maximum is reached when all receptors become saturated.","Its middle portion is close to a straight line: effect against log concentration, with slope m.","Onset, intensity and duration of the effect depend on the dose and on the pharmacokinetics of the drug."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 4 \"Relationship of Dose to Pharmacologic Effect\""},
    {"id":"pd-c05","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"doseresp","concept":"dose-response-linear-plot","skill":"read","source":"slide","stem":"On a plot of pharmacologic response against drug dose on a linear scale, where does a given change in dose produce the smallest increase in response?","options":[{"t":"Near the maximum response","correct":true,"why":"Near the top most receptors are already saturated, so extra drug finds few receptors left to act on and the curve flattens; the dose change that gave a large rise early gives a small one here."},{"t":"At the lowest doses","why":"Choosing this reverses the two regions of the curve. At low doses the curve is steep, so a given dose change gives a large increase in response; the small increase comes near the top, where the curve flattens."},{"t":"Equally at every dose","why":"Choosing this treats the curve as a straight line. A straight line gives the same rise for the same dose step everywhere; this curve is steep early and then plateaus, so the same step does less and less."},{"t":"At the dose giving half of the maximum response","why":"Choosing this picks the middle of the curve, where it is still rising. The smallest gain per dose step is where the curve is flattest, at the top near the maximum response."}],"teach":[{"h":"Dose, concentration and response","list":["As the dose increases, the concentration at the receptor site increases, and the response increases up to a maximum effect.","Response against dose on a linear scale rises steeply, then flattens: the same dose change gives a large increase at low doses and a small one near the maximum.","Response against log dose is a sigmoid (S-shaped) curve; the maximum is reached when all receptors become saturated.","Its middle portion is close to a straight line: effect against log concentration, with slope m.","Onset, intensity and duration of the effect depend on the dose and on the pharmacokinetics of the drug."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 4 \"Relationship of Dose to Pharmacologic Effect\" (left figure)"},
  ],
};
const PRE = 'thm-', FIXFILE = 'q90_theme_fixture.js';
const fixtureFile = () => {
  const lit = s => `'${s}'`;
  const qs = FIX.qs.map(q => {
    const rest = Object.assign({}, q, {topic: PRE + q.topic}); delete rest.id; delete rest.prof;
    return `{id:${lit(PRE + q.id)}, prof:${lit(q.prof)}, ${JSON.stringify(rest).slice(1)},`;
  });
  return `/* theme test fixture: Basic-Pharmacokinetics (ac2eb73) questions, topic and deck, prof set to "Professor", ids prefixed ${PRE} */\n` +
    `TOPICS.push(${JSON.stringify(Object.assign({}, FIX.topic, {id: PRE + FIX.topic.id}))});\nQUESTIONS.push(\n${qs.join('\n')}\n);\n`;
};
const lectureLine = () => {
  const l = FIX.lecture, lit = s => `'${s}'`;
  return `if(!(COURSE.lectures || []).some(l => l.deck === ${lit(l.deck)})) COURSE.lectures = (COURSE.lectures || []).concat([` +
    `{id:${lit(l.id)}, deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(l.prof)}, exam:${l.exam}, module:${l.module}}]);`;
};

const css = fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8');
const shell = fs.readFileSync(path.join(L.PAGE.SRC, 'shell.html'), 'utf8');
const DEVICE = ':root:not([data-theme="light"])', PICKED = ':root[data-theme="dark"]';

/* the rules of theme.css, split into the media block and what follows it */
function blocks(text){
  const at = text.indexOf('@media (prefers-color-scheme: dark){');
  if(at < 0) return null;
  let depth = 0, i = text.indexOf('{', at), end = -1;
  for(; i < text.length; i++){ if(text[i] === '{') depth++; else if(text[i] === '}' && !--depth){ end = i; break; } }
  if(end < 0) return null;
  const inner = text.slice(text.indexOf('{', at) + 1, end);
  const rest = text.slice(end + 1);
  const rules = (t, sel) => (t.match(/[^{}]+\{[^{}]*\}/g) || []).map(r => r.trim())
    .filter(r => r.includes(sel)).map(r => r.split(sel).join('R').replace(/\s+/g, ' '));
  return {device: rules(inner, DEVICE), picked: rules(rest, PICKED)};
}
const vars = t => { const o = {}; for(const m of t.matchAll(/--([a-z0-9-]+)\s*:\s*([^;}]+)/g)) o[m[1]] = m[2].trim(); return o; };
const isColour = v => /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v);

/* text whose colour reads below 4.5 : 1 (3 : 1 when large) against what is behind it */
const LOW = function(){
  const parse = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if(!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const over = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat([1]);
  const behind = el => { const layers = [];
    for(let n = el; n && n.nodeType === 1; n = n.parentElement){
      const cs = getComputedStyle(n);
      if(cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor); if(c && c[3] > 0){ layers.push(c); if(c[3] >= 1) break; } }
    let b = [255, 255, 255, 1]; for(let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b); return b; };
  const out = [], seen = new Set(), walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for(let t = walk.nextNode(); t; t = walk.nextNode()){
    const el = t.parentElement;
    if(!t.nodeValue.trim() || !el || seen.has(el)) continue; seen.add(el);
    if(el.closest('svg,script,style,option,.hide,[hidden]')) continue;
    const r = el.getBoundingClientRect(); if(!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if(cs.visibility === 'hidden') continue;
    let op = 1; for(let n = el; n && n.nodeType === 1; n = n.parentElement) op *= +getComputedStyle(n).opacity;
    if(op < 0.5) continue;
    const bg = behind(el), fg0 = parse(cs.color); if(!bg || !fg0) continue;
    const fg = over([fg0[0], fg0[1], fg0[2], fg0[3] * op], bg);
    const a = lum(fg), b = lum(bg), cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(cs.fontSize), large = size >= 24 || (+cs.fontWeight >= 700 && size >= 18.66);
    if(cr < (large ? 3 : 4.5)) out.push(`${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''} "${t.nodeValue.trim().slice(0, 30)}" ${cr.toFixed(2)}`);
  }
  return out;
};

(async () => {
  console.log('\n=== theme.css and the core\'s colours ===');
  const B = blocks(css);
  check(B && B.device.length > 0 && B.device.length === B.picked.length && B.device.every((r, i) => r === B.picked[i]),
    `theme.css holds the same ${B ? B.device.length : 0} dark rules for Match device on a dark device and for Dark picked`,
    B ? B.device.filter((r, i) => r !== B.picked[i]).slice(0, 2) : 'no @media (prefers-color-scheme: dark) block');
  const rootAt = shell.indexOf(':root{'), coreVars = vars(shell.slice(rootAt, shell.indexOf('}', rootAt)));
  const coreColours = Object.keys(coreVars).filter(k => isColour(coreVars[k]));
  const darkVars = B && B.device.length ? vars(B.device.find(r => r.startsWith('R{')) || '') : {};
  const missing = coreColours.filter(k => !(k in darkVars));
  check(coreColours.length > 0 && !missing.length, `each of the ${coreColours.length} colours the core's :root sets has a dark value`, missing.join(', '));

  const sb = L.scratchBuild('theme', {files: {[FIXFILE]: fixtureFile()}, courseLine: lectureLine() + L.featureOn(__dirname)});
  if(sb.code !== 0){ check(false, 'the scratch copy builds with the module on and the fixture added', sb.out.slice(-400)); sb.rm(); L.finish(NAME); }

  console.log('\n=== in node, as the course\'s checks run the engine ===');
  const lib = JSON.stringify(path.join(__dirname, '..', '..', 'check_lib'));
  const n = require('child_process').spawnSync(process.execPath, ['-e',
    `const L = require(${lib}); const X = L.engine('({errors: FX.errors.slice(), on: FX.on("theme")})'); console.log('THEME ' + JSON.stringify({on: X.on, errors: X.errors}));`],
    {env: Object.assign({}, process.env, {DRILL_PAGE: sb.page}), encoding: 'utf8'});
  const E = JSON.parse(((n.stdout || '').match(/^THEME (.*)$/m) || [null, '{}'])[1]);
  check(E.on === true && Array.isArray(E.errors) && !E.errors.length,
    'the module loads with no page around it (explain_check.js and test.js run the engine so)', E.errors || (n.stdout + n.stderr).slice(-300));

  console.log('\n=== in Chromium, on a scratch copy built with the module on ===');
  const {browser} = await L.launch(NAME);
  const hex = h => { h = h.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
  const coreSurface = hex(coreVars.surface || '#000000'), darkSurface = hex(darkVars.surface || '#000000');
  check(coreSurface !== darkSurface, `the core's light page colour (${coreSurface}) and the dark one (${darkSurface}) differ`, '');
  const state = p => p.evaluate(() => ({bg: getComputedStyle(document.body).backgroundColor, attr: document.documentElement.getAttribute('data-theme'),
    sel: (document.getElementById('themeSel') || {}).value, key: FX.api('theme') && FX.api('theme').key,
    stored: (() => { try { return localStorage.getItem(FX.api('theme').key); } catch(e){ return 'unreadable'; } })(),
    opts: [...document.querySelectorAll('#themeSel option')].map(o => o.value + '=' + o.textContent), fx: FX.errors.slice()}));
  const open = async (scheme, init) => L.openPage(browser, sb.page, {colorScheme: scheme}, init);
  const navUp = p => p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
  const allErrors = [];
  const fixIds = FIX.qs.map(q => PRE + q.id);
  /* a long answer history: n answers, a choice picked and checked each time */
  const answerMany = async (page, n) => {
    const ids = await page.evaluate(() => QUESTIONS.filter(q => !q.type && (q.options || []).length).map(q => q.id));
    for(let i = 0; i < n; i++){
      await L.quizOn(page, ids[i % ids.length]);
      await page.evaluate(i => { const os = document.querySelectorAll('#v-quiz .opt'); if(os.length) os[i % os.length].click(); const c = document.getElementById('btnCheck'); if(c) c.click(); }, i);
    }
    await page.waitForTimeout(400);   // past the core's 150 ms progress write
    return page.evaluate(() => { try { return JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]').length; } catch(e){ return -1; } });
  };

  // the fixture: real course pages in the scratch copy
  {
    const {ctx, page, errors} = await open('dark');
    const f = await page.evaluate(([ids, t]) => ({qs: ids.filter(id => QUESTIONS.some(q => q.id === id)).length, topic: TOPICS.some(x => x.id === t),
      first: TOPICS[0].id}), [fixIds, PRE + FIX.topic.id]);
    check(f.qs === FIX.qs.length && f.topic && f.first !== PRE + FIX.topic.id,
      `the scratch copy holds the fixture's ${FIX.qs.length} Basic-Pharmacokinetics questions in a topic of their own, after the course's topics`, f);
    allErrors.push(...errors); await ctx.close();
  }

  // no light page first: a stored Dark is on <html> in the first frame that shows the tabs
  {
    const watch = () => { window.__firstFrame = undefined;
      const tick = () => { const n = document.getElementById('nav');
        if(n && n.querySelector('button')){ window.__firstFrame = document.documentElement.getAttribute('data-theme'); return; }
        requestAnimationFrame(tick); };
      requestAnimationFrame(tick); };
    const {ctx, page, errors} = await open('light', watch);
    await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(100);
    await page.reload(); await navUp(page); await page.waitForTimeout(100);
    const first = await page.evaluate(() => window.__firstFrame);
    check(first === 'dark', 'a stored Dark is on the page in the first frame that shows the tabs (no light page first)', first);
    allErrors.push(...errors); await ctx.close();
  }

  // Match device
  for(const scheme of ['light', 'dark']){
    const {ctx, page, errors} = await open(scheme);
    const s = await state(page);
    check(s.attr === null && s.sel === 'device' && s.bg === (scheme === 'dark' ? darkSurface : coreSurface),
      `nothing chosen, a device set to ${scheme} shows the ${scheme} colours (Match device)`, s);
    if(scheme === 'light') check(s.opts.join('|') === 'device=Match device|light=Light|dark=Dark', 'the header holds the choice: Match device, Light, Dark', s.opts);
    allErrors.push(...errors, ...s.fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }

  // Dark picked on a light device, kept through a reload; Light on a dark device; Match device again
  {
    const {ctx, page, errors} = await open('light');
    await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(100);
    let s = await state(page);
    check(s.attr === 'dark' && s.bg === darkSurface && s.stored === 'dark', 'Dark picked in the header on a light device shows the dark colours and is stored', s);
    const ns = await page.evaluate(() => NS);
    check(s.key === ns + ':theme', `the choice is kept under <ns>:theme (${s.key})`, ns);
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    s = await state(page);
    check(s.attr === 'dark' && s.sel === 'dark' && s.bg === darkSurface, 'Dark is still on after a reload, and the header shows it', s);
    // a pick, then past the core's 150 ms progress write, before any reload: nothing in the progress
    await page.selectOption('#themeSel', 'light'); await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(400);
    const saved = await page.evaluate(() => ({stored: store.get(keyFor(PROFILE)) || '', live: JSON.stringify(DB)}));
    check(!/theme|"dark"|"light"/.test(saved.stored) && !/theme|"dark"|"light"/.test(saved.live),
      'the profile\'s progress, in memory and as saved 400 ms after a pick, holds no theme', saved.stored.slice(0, 120));
    const answered = await answerMany(page, 30);
    await page.evaluate(() => show('settings'));
    const dl = page.waitForEvent('download');
    await page.click('#btnExport');
    const file = await (await dl).path(), text = fs.readFileSync(file, 'utf8');
    check(answered >= 30 && text.length > 50 && !text.includes(':theme') && !/"theme"/.test(text),
      `the Export progress file (${text.length} characters, ${answered} answers in the history) holds no theme`, answered);
    // Import into a fresh browser: the history arrives, and the device's own choice stays
    {
      const fresh = await open('light');
      await fresh.page.selectOption('#themeSel', 'light'); await fresh.page.waitForTimeout(100);
      await fresh.page.evaluate(() => show('settings'));
      await fresh.page.setInputFiles('#fileIn', file); await fresh.page.waitForTimeout(800);
      const f = await state(fresh.page);
      const n = await fresh.page.evaluate(() => { try { return JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]').length; } catch(e){ return -1; } });
      // the core merges answers by second, question, result and mode (core/shell.html mergeLog), so
      // the same answer to one question twice in a second arrives once
      const exp = JSON.parse(text), distinct = new Set((exp.log || []).map(e => e.slice(0, 4).join('|'))).size;
      check(distinct >= 10 && n === distinct && f.attr === 'light' && f.stored === 'light',
        `Import progress in a fresh browser brings the ${distinct} distinct answers of the file (${(exp.log || []).length} entries) and leaves that browser's own choice (Light) as it was`,
        Object.assign({answers: n, distinct}, f));
      allErrors.push(...fresh.errors, ...f.fx.map(e => e.module + ': ' + e.message)); await fresh.ctx.close();
    }
    // Settings: the same choice
    const radios = await page.evaluate(() => [...document.querySelectorAll('.fxtheme input[data-themepick]')].map(r => r.value + (r.checked ? '*' : '')));
    check(radios.join('|') === 'device|light|dark*', 'Settings holds the same choice, with Dark marked', radios);
    const where = await page.evaluate(() => (document.querySelector('.fxtheme p') || {}).textContent || '');
    check(/this browser on this device/.test(where) && /not part of your progress/.test(where), 'Settings says where the choice is kept and that it is not part of the progress', where);
    await page.click('.fxtheme input[value="light"]'); await page.waitForTimeout(100);
    s = await state(page);
    check(s.attr === 'light' && s.sel === 'light' && s.stored === 'light' && s.bg === coreSurface, 'Light picked in Settings shows the light colours and the header follows', s);
    // a profile switch leaves it alone
    await page.evaluate(() => { window.prompt = () => 'Second'; askProfile(true); });
    await page.waitForTimeout(200);
    s = await state(page);
    check(s.attr === 'light' && s.stored === 'light', 'switching profile keeps the choice (a device setting)', s);
    allErrors.push(...errors, ...s.fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }
  {
    const {ctx, page, errors} = await open('dark');
    await page.evaluate(() => { localStorage.setItem(FX.api('theme').key, 'light'); });
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    let s = await state(page);
    check(s.attr === 'light' && s.bg === coreSurface, 'Light stored on a dark device shows the light colours', s);
    await page.selectOption('#themeSel', 'device'); await page.waitForTimeout(100);
    s = await state(page);
    check(s.attr === null && s.stored === null && s.bg === darkSurface, 'Match device removes the stored choice and follows the dark device again', s);
    await page.evaluate(() => { localStorage.setItem(FX.api('theme').key, 'purple'); });
    await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
    s = await state(page);
    check(s.attr === null && s.sel === 'device' && s.bg === darkSurface, 'a stored value that is not light or dark reads as Match device', s);
    allErrors.push(...errors, ...s.fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }
  {
    const block = () => { Object.defineProperty(window, 'localStorage', {get(){ throw new DOMException('blocked', 'SecurityError'); }}); };
    const {ctx, page, errors} = await open('light', block);
    await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(100);
    const s = await page.evaluate(() => ({attr: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor}));
    check(s.attr === 'dark' && s.bg === darkSurface && !errors.length, 'with storage refused the page runs and Dark applies for the visit', Object.assign(s, {errors}));
    await ctx.close();
  }

  // a reload soon after a change: the choice is written at once, not with the progress 150 ms later
  for(const wait of [0, 100, 400]){
    const {ctx, page, errors} = await open('light');
    await page.selectOption('#themeSel', 'dark');
    if(wait) await page.waitForTimeout(wait);
    await page.reload(); await navUp(page);
    const s = await state(page);
    check(s.attr === 'dark' && s.stored === 'dark' && s.sel === 'dark', `a reload ${wait} ms after Dark is picked keeps Dark`, s);
    allErrors.push(...errors, ...s.fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }

  // storage that refuses writes (blocked, then full), with a long answer history and Light saved:
  // the student sees the notice, nothing saved is overwritten, and after storage works again
  // the saved choice and history load
  for(const [kind, label] of [['denied', 'storage denied (setItem throws SecurityError)'], ['full', 'storage full (setItem throws QuotaExceededError)']]){
    const refuse = () => { const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        const m = document.cookie.match(/(?:^|; )refuse=(\w+)/);
        if(m) throw new DOMException(m[1] === 'full' ? 'The quota has been exceeded.' : 'The operation is insecure.', m[1] === 'full' ? 'QuotaExceededError' : 'SecurityError');
        return orig.call(this, k, v); }; };
    const {ctx, page, errors} = await open('light', refuse);
    await page.selectOption('#themeSel', 'light'); await page.waitForTimeout(100);
    const answers = await answerMany(page, 25);
    const before = await page.evaluate(() => ({db: localStorage.getItem(keyFor(PROFILE)), log: localStorage.getItem(NS + ':log:' + PROFILE)}));
    await page.evaluate(k => { document.cookie = 'refuse=' + k + '; path=/'; }, kind);
    await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(150);
    let s = await state(page);
    const warn = await page.evaluate(() => { const w = document.getElementById('savewarn'); return w && w.getClientRects().length ? w.textContent : ''; });   // position:fixed, so no offsetParent
    const now = await page.evaluate(() => ({db: localStorage.getItem(keyFor(PROFILE)), log: localStorage.getItem(NS + ':log:' + PROFILE)}));
    check(s.attr === 'dark' && s.bg === darkSurface && /did not save/.test(warn), `${label}: Dark applies for the visit and the student sees the notice that the browser did not save`, {s, warn});
    check(s.stored === 'light' && now.db === before.db && now.log === before.log && answers >= 25,
      `${label}: the saved Light and the saved progress (${answers} answers) are not overwritten`, {stored: s.stored, answers});
    await page.evaluate(() => { document.cookie = 'refuse=; max-age=0; path=/'; });
    await page.reload(); await navUp(page);
    s = await state(page);
    const after = await page.evaluate(() => ({db: localStorage.getItem(keyFor(PROFILE)), log: localStorage.getItem(NS + ':log:' + PROFILE)}));
    check(s.attr === 'light' && s.sel === 'light' && s.bg === coreSurface && JSON.parse(after.log || '[]').length === answers,
      `${label}: with storage working again, the saved Light and the ${answers} answers load`, Object.assign({answers: JSON.parse(after.log || '[]').length}, s));
    await page.selectOption('#themeSel', 'dark'); await page.waitForTimeout(100);
    s = await state(page);
    check(s.stored === 'dark', `${label}: with storage working again, a new choice is saved`, s);
    allErrors.push(...errors, ...s.fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }

  // contrast in the dark colours, on every tab and on an answered quiz card
  for(const [scheme, pick, label] of [['dark', null, 'on a dark device (Match device)'], ['light', 'dark', 'with Dark picked on a light device']]){
    const {ctx, page, errors} = await open(scheme);
    if(pick){ await page.selectOption('#themeSel', pick); await page.waitForTimeout(100); }
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));
    const low = [];
    for(const v of tabs){
      await page.evaluate(v => show(v), v); await page.waitForTimeout(150);
      (await page.evaluate('(' + LOW + ')()')).forEach(x => low.push(v + ': ' + x));
    }
    // answered quiz cards: the course's first multiple-choice question and each fixture question
    const cards = await page.evaluate(ids => [(QUESTIONS.find(q => !q.type && (q.options || []).length) || {}).id].concat(ids).filter(id => id && byId(id)), fixIds);
    for(const q of cards){
      await L.quizOn(page, q); await page.waitForTimeout(150);
      (await page.evaluate('(' + LOW + ')()')).forEach(x => low.push(q + ' unanswered: ' + x));
      await page.evaluate(() => { const o = document.querySelector('#v-quiz .opt'); if(o) o.click(); const c = document.getElementById('btnCheck'); if(c) c.click(); });
      await page.waitForTimeout(150);
      (await page.evaluate('(' + LOW + ')()')).forEach(x => low.push(q + ' answered: ' + x));
    }
    check(!low.length && cards.length === fixIds.length + 1,
      `${label}, no text on the ${tabs.length} tabs or on ${cards.length} quiz cards (${fixIds.length} of them Basic-Pharmacokinetics questions), unanswered and answered, reads below 4.5 : 1 (3 : 1 large)`,
      low.slice(0, 4).join(' | ') || cards);
    // the answer box of a calculation is a native control: dark, with readable text (color-scheme)
    const num = await page.evaluate(() => (QUESTIONS.find(q => q.type === 'numeric') || {}).id);
    if(num){
      await L.quizOn(page, num); await page.waitForTimeout(150);
      const box = await page.evaluate(() => { const i = document.querySelector('#v-quiz .numin input'); if(!i) return null;
        const cs = getComputedStyle(i), c = s => (s.match(/[0-9.]+/g) || []).slice(0, 3).map(Number);
        const lum = a => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]); };
        const bg = lum(c(cs.backgroundColor)), fg = lum(c(cs.color));
        return {bg: cs.backgroundColor, fg: cs.color, bgLum: +bg.toFixed(3), ratio: +((Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05)).toFixed(2)}; });
      check(box && box.bgLum < 0.2 && box.ratio >= 4.5, `${label}, the answer box of a calculation (${num}) is dark with text at 4.5 : 1 or better`, box);
    } else L.skip(`${label}, the answer box of a calculation`, 'the course has no calculation question');
    // native parts the page's colours do not reach (scrollbars, the Settings radio buttons, a text
    // box without its own colours) are drawn in the browser's dark style: color-scheme dark
    await page.evaluate(() => show('settings')); await page.waitForTimeout(150);
    const cs = await page.evaluate(() => ({page: getComputedStyle(document.documentElement).colorScheme,
      radio: (el => el ? getComputedStyle(el).colorScheme : null)(document.querySelector('.fxtheme input[type=radio]'))}));
    check(/dark/.test(cs.page) && /dark/.test(cs.radio || ''), `${label}, the page and the Settings radio buttons are drawn in the browser's dark style (color-scheme)`, cs);
    const fx = await page.evaluate(() => FX.errors.slice());
    allErrors.push(...errors, ...fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }
  check(!allErrors.length, 'no page error and no module error', allErrors.slice(0, 3).join('; '));
  await browser.close();
  sb.rm();
  console.log();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
