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
 * On a scratch copy of this course built with the module on, in Chromium:
 *   - Match device (nothing stored): a device set to light shows the core's light
 *     colours, a device set to dark the dark ones, with no data-theme on <html>;
 *   - the header holds the choice with Match device, Light and Dark; Dark on a light
 *     device and Light on a dark device win over the device, are kept through a
 *     reload, and Match device removes the stored choice;
 *   - Settings holds the same choice, kept in step with the header;
 *   - the choice is a device setting: kept under <ns>:theme, the same after a
 *     profile switch, not in the profile's saved progress and not in Export progress;
 *   - a stored value that is not light or dark reads as Match device; a browser that
 *     refuses storage still shows the page and keeps the choice for the visit;
 *   - on every tab, and on an answered quiz card, no text in the dark colours reads
 *     below 4.5 : 1 against what is behind it (3 : 1 for large text), both with the
 *     device dark and with Dark picked on a light device;
 *   - no page error and no module error.
 *
 *     node features/theme/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/theme/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

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

  const sb = L.scratchBuild('theme', {courseLine: L.featureOn(__dirname)});
  if(sb.code !== 0){ check(false, 'the scratch copy builds with the module on', sb.out.slice(-400)); sb.rm(); L.finish(NAME); }

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
  const allErrors = [];

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
    await page.waitForTimeout(300);
    const saved = await page.evaluate(() => store.get(keyFor(PROFILE)) || '');
    check(!/theme|"dark"/.test(saved), 'the profile\'s saved progress holds no theme', saved.slice(0, 120));
    await page.evaluate(() => show('settings'));
    const dl = page.waitForEvent('download');
    await page.click('#btnExport');
    const file = await (await dl).path(), text = fs.readFileSync(file, 'utf8');
    check(text.length > 50 && !text.includes(':theme') && !/"theme"/.test(text), `the Export progress file (${text.length} characters) holds no theme`, '');
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
    const q = await page.evaluate(() => (QUESTIONS.find(q => !q.type && (q.options || []).length) || {}).id);
    if(q){
      await L.quizOn(page, q); await page.waitForTimeout(150);
      await page.evaluate(() => { const o = document.querySelector('#v-quiz .opt'); if(o) o.click(); const c = document.getElementById('btnCheck'); if(c) c.click(); });
      await page.waitForTimeout(150);
      (await page.evaluate('(' + LOW + ')()')).forEach(x => low.push('answered quiz card: ' + x));
    }
    check(!low.length, `${label}, no text on the ${tabs.length} tabs${q ? ' or an answered quiz card' : ''} reads below 4.5 : 1 (3 : 1 large)`, low.slice(0, 4).join(' | '));
    const fx = await page.evaluate(() => FX.errors.slice());
    allErrors.push(...errors, ...fx.map(e => e.module + ': ' + e.message)); await ctx.close();
  }
  check(!allErrors.length, 'no page error and no module error', allErrors.slice(0, 3).join('; '));
  await browser.close();
  sb.rm();
  console.log();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
