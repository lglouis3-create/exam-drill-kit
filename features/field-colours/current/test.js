/* field-colours: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * The data is BDK's drug list as drug-list-tab's own test holds it (its `const FIX`:
 * data/decks.json at 05c36c3, 26 pages, 300 drugs), read from
 * features/drug-list-tab/test.js in the course; the fields and colours are BDK's
 * (assets/style.css lines 369 and 371). On the course's own page: the module loads,
 * throws nothing and colours the course's own drug-list headings when that module is
 * on. On a scratch copy with drug-list-tab off: nothing is coloured, no rule is
 * written, no error. On a scratch copy with BDK's tables and BDK's fields, at 390 px
 * and 820 px: the Pharmacologic category and Common indications headings of every
 * table have BDK's light colours and every other heading keeps the core's colour; each
 * colour's contrast against the background the heading sits on (read in the page) is
 * measured with the WCAG 2 relative-luminance formula and compared with 4.5:1 (normal
 * text: the headings are 12 px); a device set to dark, without the theme module, keeps
 * the light colours on the core's light page; nothing is written beyond what the same
 * page writes without field-colours (every write from the first line on, by key); no page or console
 * error. Options change the fields and the colours. With the theme module in the course
 * (kit #20), its dark theme takes the dark colours, measured the same way, and so does
 * Match device on a dark device; without it that case is skipped. The build step
 * refuses malformed options.
 *
 *     node features/field-colours/test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/field-colours/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

const META = JSON.parse(fs.readFileSync(path.join(__dirname, 'module.json'), 'utf8'));
const BDK_FIELDS = META.options.fields.default;          // BDK's, assets/style.css lines 369 and 371
const DLT_DIR = path.join(__dirname, '..', 'drug-list-tab');
const THEME_DIR = path.join(__dirname, '..', 'theme');
const FILE = 'fc_tables_test.js';

/* WCAG 2: relative luminance and contrast ratio */
const lum = rgb => { const c = rgb.map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hexRgb = h => { h = h.replace('#', ''); if(h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgbStr = h => `rgb(${hexRgb(h).join(', ')})`;
const parseRgb = s => (String(s).match(/[\d.]+/g) || []).slice(0, 3).map(Number);

/* drug-list-tab on with every option at its default, so the course's own options for it never mix in */
function dltDefaults(){
  const m = JSON.parse(fs.readFileSync(path.join(DLT_DIR, 'module.json'), 'utf8'));
  return Object.assign({version: m.version}, Object.fromEntries(Object.entries(m.options || {}).map(([k, v]) => [k, v.default])));
}
function dltFix(){
  const t = fs.readFileSync(path.join(DLT_DIR, 'test.js'), 'utf8').split('\n').find(l => l.startsWith('const FIX = '));
  return vm.runInNewContext(t + '\n;FIX', {});
}
const consoleTrap = () => { window.__writes = [];
  const S = Storage.prototype;
  for(const f of ['setItem', 'removeItem', 'clear']){ const o = S[f]; S[f] = function(k){ try { window.__writes.push([f, this === sessionStorage ? 'ss' : 'ls', String(k)]); } catch(e){} return o.apply(this, arguments); }; }
  try { const io = indexedDB.open.bind(indexedDB); indexedDB.open = function(n){ window.__writes.push(['open', 'idb', String(n)]); return io.apply(null, arguments); }; } catch(e){}
  window.__cerr = []; const o = console.error;
  console.error = function(){ try { window.__cerr.push([...arguments].map(String).join(' ')); } catch(e){} return o.apply(this, arguments); }; };
/* each heading of the Drug list: its field, its computed colour, the background it sits on, its size and weight */
const headings = (page, tab) => page.evaluate(tab => [...document.querySelectorAll(`#v-${tab} section[data-table] th`)].map(th => {
  let e = th, bg = 'rgba(0, 0, 0, 0)';
  while(e){ const b = getComputedStyle(e).backgroundColor; if(b && !/rgba\(.*,\s*0\)$/.test(b) && b !== 'transparent'){ bg = b; break; } e = e.parentElement; }
  const cs = getComputedStyle(th);
  return {field: th.dataset.field, color: cs.color, bg, size: cs.fontSize, weight: cs.fontWeight};
}), tab);

let hasOwn = false;
const build = (label, tables, dltOn, fields, extra) => {
  const data = tables ? `/* BDK's drug list (data/decks.json, 05c36c3), from drug-list-tab's test, added by the field-colours test */\n` +
    (hasOwn ? `DRUG_TABLES.splice(0, DRUG_TABLES.length, ...${JSON.stringify(tables)});` : `const DRUG_TABLES = ${JSON.stringify(tables)};`) + '\n' : null;
  let line = data ? `COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(FILE)}]);` : '';
  line += dltOn ? `COURSE.features = Object.assign({}, COURSE.features, {"drug-list-tab": ${JSON.stringify(dltDefaults())}});`
                : `if(COURSE.features) delete COURSE.features['drug-list-tab'];`;
  line += L.featureOn(__dirname, fields ? {fields} : {fields: BDK_FIELDS});
  if(extra) line += extra;
  return L.scratchBuild(label, {files: data ? {[FILE]: data} : {}, courseLine: line});
};

async function snapshotState(page){
  return page.evaluate(() => { const dump = s => { const o = {}; for(let i = 0; i < s.length; i++){ const k = s.key(i); o[k] = s.getItem(k); } return o; };
    return JSON.stringify({ls: dump(localStorage), ss: dump(sessionStorage), db: JSON.stringify(DB)}); });
}

/* the light colours on BDK's list, measured */
async function lightView(browser, file, width, dark, baseline){
  const tag = ` (${width} px${dark ? ', device set to dark, no theme module' : ''})`;
  const {ctx, page, errors} = await L.openPage(browser, file, Object.assign({viewport: {width, height: 900}}, dark ? {colorScheme: 'dark'} : {}), consoleTrap);
  const cerr = []; page.on('console', m => { if(m.type() === 'error') cerr.push(m.text()); });
  const before = await snapshotState(page);
  await page.click('#nav button[data-v="drugs"]');
  await page.click('#v-drugs [data-listgroup="-1"]').catch(() => {});
  const hs = await headings(page, 'drugs');
  const want = Object.fromEntries(BDK_FIELDS.map(([f, l]) => [f, rgbStr(l)]));
  const other = hs.filter(h => !want[h.field]);
  const bad = hs.filter(h => want[h.field] && h.color !== want[h.field]);
  check(hs.length === 26 * 5 && !bad.length, `every table's ${BDK_FIELDS.map(f => f[0]).join(' and ')} headings have BDK's light colours (${hs.filter(h => want[h.field]).length} headings)` + tag, bad.slice(0, 3));
  const base = await page.evaluate(() => { const p = document.createElement('div'); p.className = 'pagetable'; p.innerHTML = '<table><tr><th>x</th></tr></table>'; document.body.appendChild(p);
    const c = getComputedStyle(p.querySelector('th')).color; p.remove(); return c; });
  check(other.length === 26 * 3 && other.every(h => h.color === base), `the other ${other.length} headings keep the core's heading colour (${base})` + tag, other.filter(h => h.color !== base).slice(0, 3));
  for(const [f, light] of BDK_FIELDS){
    const h = hs.find(x => x.field === f), bgs = [...new Set(hs.filter(x => x.field === f).map(x => x.bg))];
    const r = ratio(hexRgb(light), parseRgb(h.bg));
    check(bgs.length === 1 && r >= 4.5, `contrast of ${f} ${light} on its heading's background ${h.bg}: ${r.toFixed(2)}:1, at ${h.size} weight ${h.weight} (normal text, 4.5:1 needed)` + tag, {bgs, r: r.toFixed(2)});
  }
  const st = await snapshotState(page), {writes, placeKey} = await page.evaluate(() => ({writes: window.__writes, placeKey: PLACE_KEY}));
  const A = JSON.parse(st), B = JSON.parse(before); delete A.ss[placeKey]; delete B.ss[placeKey];
  // every write from the page's first line on, by key, against the same page and steps without field-colours
  const keys = [...new Set(writes.map(w => w.join(' ')))].sort();
  // the core's own place record (sessionStorage <NS>:place, views.js placeSave) is written for every tab
  // after a pause, so whether a short visit has written it yet is timing: it is left out of both lists
  const extra = keys.filter(k => !baseline.includes(k) && k !== 'setItem ss ' + placeKey);
  check(baseline.length > 0 && !extra.length && JSON.stringify(A.ls) === JSON.stringify(B.ls) && A.db === B.db,
        'nothing written to localStorage, sessionStorage, IndexedDB or the progress (DB) beyond what the same page writes without field-colours (the core\'s place record aside)' + tag, {extra, baseline});
  check(!(await sideways(page)), 'no sideways scroll' + tag);
  const fxErr = await page.evaluate(() => FX.errors.slice()), cAll = cerr.concat(await page.evaluate(() => window.__cerr || []));
  check(!errors.length && !fxErr.length && !cAll.length, 'no page, module or console error' + tag, errors.concat(cAll, fxErr.map(e => JSON.stringify(e))).slice(0, 3));
  await ctx.close();
}
const sideways = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

(async () => {
  console.log('\n=== the course\'s own page ===');
  L.PAGE.need(NAME);
  const X = L.engine('({T: typeof DRUG_TABLES === "undefined" ? null : DRUG_TABLES, FX})');
  hasOwn = !!X.T;
  const mods = X.FX.modules();
  check(mods.some(m => m.name === 'field-colours' && m.on) && !X.FX.errors.length, 'the module loads in the course and throws nothing', X.FX.errors);
  const hasDlt = fs.existsSync(path.join(DLT_DIR, 'module.json')), hasTheme = fs.existsSync(path.join(THEME_DIR, 'module.json'));
  const {browser} = await L.launch(NAME);
  try {
    {
      const {ctx, page, errors} = await L.openFile(browser);
      const own = await page.evaluate(() => ({errors: FX.errors.slice(), tabs: FX.tabs(), css: (document.getElementById('fx-field-colours') || {}).textContent || ''}));
      check(!errors.length && !own.errors.length, 'no page or module error on the course\'s own page', errors.concat(own.errors.map(e => JSON.stringify(e))));
      if(own.tabs.includes('drugs')){
        await page.evaluate(() => show('drugs'));
        const hs = await headings(page, 'drugs'), f = (await page.evaluate(() => FX.modules().find(m => m.name === 'field-colours').options.fields));
        const bad = hs.filter(h => f.some(x => x[0] === h.field) && h.color !== rgbStr(f.find(x => x[0] === h.field)[1]));
        check(hs.length && !bad.length, `the course's own Drug list headings take the course's colours (${hs.length} headings)`, bad.slice(0, 3));
      } else L.skip('the course\'s own Drug list headings', 'drug-list-tab is not on in this course');
      await ctx.close();
    }

    console.log('\n=== the build step refuses malformed options ===');
    for(const [what, fields, re] of [
      ['an entry that is not [field, light, dark]', [['category', '#0f766e']], /option fields entry 1 must be \[field, light colour, dark colour\]/],
      ['a colour that is not #rgb or #rrggbb', [['category', '#0f766', '#5eead4']], /"#0f766" is not a colour as #rgb or #rrggbb/],
      ['a field name a selector cannot hold', [['category"]', '#0f766e', '#5eead4']], /the field "category"\]" must be letters, digits/],
      ['a field named twice', [['category', '#0f766e', '#5eead4'], ['category', '#a21caf', '#f0abfc']], /names the field "category" twice/]]){
      const b = build('fc-bad', null, false, fields);
      check(b.code !== 0 && re.test(b.out) && !fs.existsSync(b.page), `${what}: the build stops with its message`, b.out.split('\n').pop());
      b.rm();
    }

    console.log('\n=== drug-list-tab off ===');
    {
      const s = build('fc-off', null, false, null);
      if(s.code !== 0) check(false, 'the scratch copy with drug-list-tab off builds', s.out.split('\n').pop());
      else {
        const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 390, height: 900}}, consoleTrap);
        const r = await page.evaluate(() => ({tabs: FX.tabs(), errors: FX.errors.slice(), style: !!document.getElementById('fx-field-colours'), css: FX.api('field-colours').css(),
          marked: document.querySelectorAll('[data-field]').length, on: FX.modules().find(m => m.name === 'field-colours').on, cerr: window.__cerr}));
        check(!r.tabs.includes('drugs') && r.on && !r.css.includes('#v-drugs') && (r.tabs.length || (!r.style && r.css === '')) && !errors.length && !r.errors.length && !r.cerr.length,
              `with drug-list-tab off the module writes no rule for it${r.tabs.length ? '' : ' (no feature tab: no rule at all)'} and throws nothing`, r);
        await ctx.close();
      }
      s.rm();
    }

    if(!hasDlt){ L.skip('BDK\'s list with field-colours', 'drug-list-tab is not in this course (src/features/drug-list-tab)'); }
    else {
      const FIX = dltFix();
      console.log('\n=== BDK\'s list with BDK\'s field colours (scratch copy) ===');
      // the writes of the same page without field-colours, from its first line, by key
      const s0 = build('fc-none', FIX.tables, true, null, `delete COURSE.features['field-colours']; if(COURSE.features) delete COURSE.features.theme;`);
      let baseline = [];
      if(s0.code !== 0) check(false, 'the scratch copy without field-colours builds', s0.out.split('\n').pop());
      else {
        const {ctx, page} = await L.openPage(browser, s0.page, {viewport: {width: 390, height: 900}}, consoleTrap);
        await page.click('#nav button[data-v="drugs"]');
        baseline = [...new Set((await page.evaluate(() => window.__writes)).map(w => w.join(' ')))].sort();
        await ctx.close();
      }
      s0.rm();
      // "no theme module": a course that has the theme module on (the kit's theme,* run) has it taken off here
      const s = build('fc-bdk', FIX.tables, true, null, `if(COURSE.features) delete COURSE.features.theme;`);
      if(s.code !== 0) check(false, 'the scratch copy with BDK\'s tables builds', s.out.split('\n').pop());
      else {
        for(const w of [390, 820]) await lightView(browser, s.page, w, false, baseline);
        await lightView(browser, s.page, 390, true, baseline);
        // a tab id that a CSS selector must escape (drug-list-tab's own step allows none, so the
        // pane is made here): the rules the module writes for it colour its headings, with the
        // browser's CSS.escape and with the module's own escape where CSS.escape is missing
        const {ctx, page} = await L.openPage(browser, s.page, {viewport: {width: 390, height: 900}});
        const esc = await page.evaluate(([light]) => {
          const A = FX.api('field-colours'), ids = ['drug.list', '1st list', 'a"b'], out = {};
          for(const how of ['CSS.escape', 'own escape']){
            const keep = CSS.escape; if(how === 'own escape') CSS.escape = undefined;
            const css = A.css(ids); CSS.escape = keep;
            const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
            out[how] = ids.map(id => { const sec = document.createElement('section'); sec.id = 'v-' + id;
              sec.innerHTML = '<table><tr><th data-field="category">x</th><th data-field="brand">y</th></tr></table>';
              document.querySelector('main').appendChild(sec);
              const r = [getComputedStyle(sec.querySelector('[data-field="category"]')).color, getComputedStyle(sec.querySelector('[data-field="brand"]')).color];
              sec.remove(); return r; });
            st.remove();
          }
          return out;
        }, BDK_FIELDS[0]);
        const okEsc = Object.values(esc).every(list => list.every(([c, b]) => c === rgbStr(BDK_FIELDS[0][1]) && b !== c));
        check(okEsc, 'tab ids a selector must escape ("drug.list", "1st list", \'a"b\'): their headings are coloured, with CSS.escape and with the module\'s own escape', esc);
        await ctx.close();
      }
      s.rm();

      console.log('\n=== other options ===');
      const o = [['generic', '#9a3412', '#fdba74']];
      const s2 = build('fc-opts', FIX.tables, true, o);
      if(s2.code !== 0) check(false, 'the scratch copy with other options builds', s2.out.split('\n').pop());
      else {
        const {ctx, page, errors} = await L.openPage(browser, s2.page, {viewport: {width: 390, height: 900}}, consoleTrap);
        await page.click('#nav button[data-v="drugs"]');
        const hs = await headings(page, 'drugs');
        check(hs.filter(h => h.field === 'generic').length === FIX.tables.length && hs.filter(h => h.field === 'generic').every(h => h.color === rgbStr(o[0][1])) && hs.filter(h => h.field === 'category' || h.field === 'indication').every(h => h.color !== rgbStr(BDK_FIELDS[0][1]) && h.color !== rgbStr(BDK_FIELDS[1][1])),
              `options change the fields and colours: Generic takes ${o[0][1]}, Pharmacologic category and Common indications take none`, hs.slice(0, 5));
        check(!errors.length, 'no page error (options copy)', errors);
        await ctx.close();
      }
      s2.rm();

      console.log('\n=== the theme module\'s dark theme ===');
      if(!hasTheme) L.skip('the dark colours', 'the theme module is not in this course (kit #20, not merged)');
      else {
        const tv = JSON.parse(fs.readFileSync(path.join(THEME_DIR, 'module.json'), 'utf8')).version;
        const s3 = build('fc-theme', FIX.tables, true, null, `COURSE.features = Object.assign({}, COURSE.features, {"theme": Object.assign({}, (COURSE.features || {}).theme, {version: ${JSON.stringify(tv)}})});`);
        if(s3.code !== 0) check(false, 'the scratch copy with the theme module builds', s3.out.split('\n').pop());
        else for(const [how, scheme, attr] of [['Dark picked', 'light', 'dark'], ['Match device on a dark device', 'dark', null], ['Light picked on a dark device', 'dark', 'light']]){
          const {ctx, page, errors} = await L.openPage(browser, s3.page, {viewport: {width: 390, height: 900}, colorScheme: scheme}, consoleTrap);
          await page.evaluate(a => { if(a) document.documentElement.setAttribute('data-theme', a); else document.documentElement.removeAttribute('data-theme'); }, attr);
          await page.click('#nav button[data-v="drugs"]');
          const hs = await headings(page, 'drugs');
          const darkOn = attr !== 'light';
          for(const [f, light, dark] of BDK_FIELDS){
            const h = hs.find(x => x.field === f), want = darkOn ? dark : light, r = ratio(hexRgb(want), parseRgb(h.bg));
            check(hs.filter(x => x.field === f).every(x => x.color === rgbStr(want)) && r >= 4.5,
                  `${how}: ${f} takes ${darkOn ? 'the dark' : 'the light'} colour ${want}; contrast on ${h.bg}: ${r.toFixed(2)}:1, at ${h.size} weight ${h.weight} (4.5:1 needed)`, {color: h.color, r: r.toFixed(2)});
          }
          check(!errors.length && !(await page.evaluate(() => FX.errors.length)), `no page or module error (${how})`, errors);
          await ctx.close();
        }
        if(s3.rm) s3.rm();
      }
    }
  } finally { await browser.close(); }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
