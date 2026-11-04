/* contrast_test.js <courseSrc> <shotsDir> : the theme module's contrast measure (its own LOW
 * function, read verbatim from features/theme/test.js in the course) over every tab and the views
 * the modules add, with the device dark (Match device) and with Dark picked on a light device.
 * Each view: LOW run on the page, and one screenshot (viewport, 390 x 844). Integration check,
 * agent-run, Chromium. A view that could not be reached is listed as skipped. */
const path = require('path'), fs = require('fs');
const SRC = path.resolve(process.argv[2]), SHOTS = path.resolve(process.argv[3] || '/tmp/port-integration/shots/contrast');
const L = require(path.join(SRC, 'check_lib.js'));
const NAME = 'integration contrast_test.js';
const {check} = L;
const themeTest = fs.readFileSync(path.join(SRC, 'features/theme/test.js'), 'utf8');
const LOW = themeTest.slice(themeTest.indexOf('const LOW = function(){') + 'const LOW = '.length, themeTest.indexOf('\n};\n', themeTest.indexOf('const LOW = function(){')) + 2);
fs.mkdirSync(SHOTS, {recursive: true});
const SKIP_BTN = /erase|clear|delete|import|export|reload|reset|switch|profile|download|copy|save as pdf|remove|hide|submit/i;

(async () => {
  L.PAGE.need(NAME);
  if(!/function\(\)\{/.test(LOW)) L.notRun(NAME, 'LOW not found in features/theme/test.js');
  const {browser} = await L.launch(NAME);
  const report = [];
  for(const [scheme, pick, label] of [['dark', null, 'dark-device'], ['light', 'dark', 'dark-picked']]){
    const {ctx, page, errors} = await L.openFile(browser, {colorScheme: scheme});
    if(pick){ await page.selectOption('#themeSel', pick); await page.waitForTimeout(100); }
    const theme = await page.evaluate(() => ({attr: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor}));
    const low = [], seen = [], skipped = [];
    let n = 0;
    const measure = async (view) => {
      await page.waitForTimeout(150);
      const r = await page.evaluate('(' + LOW + ')()');
      r.forEach(x => low.push(view + ': ' + x));
      const f = `${label}-${String(++n).padStart(2, '0')}-${view.replace(/[^a-z0-9]+/gi, '_').slice(0, 50)}.png`;
      await page.screenshot({path: path.join(SHOTS, f)});
      seen.push({view, low: r.length, shot: f});
    };
    // control: a planted grey-on-grey line is found, so a clean result below means something
    const ctl = await page.evaluate(LOWSRC => { const d = document.createElement('p'); d.id = 'ctlLow'; d.textContent = 'control text'; d.style.cssText = 'color:#333;background:#222;font-size:14px';
      document.querySelector('main').prepend(d); const r = eval('(' + LOWSRC + ')()'); d.remove(); return r.filter(x => x.includes('control text')).length; }, LOW);
    check(ctl === 1, label + ': control: the measure finds a planted #333-on-#222 line', ctl);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));
    // every tab, then each of its first buttons (one level deep; buttons that erase, export or switch are left)
    for(const v of tabs){
      await page.evaluate(v => show(v), v); await measure('tab ' + v);
      const btns = await page.evaluate(v => [...document.querySelectorAll('#v-' + v + ' button')].filter(b => b.offsetParent && !b.disabled).map(b => b.textContent.trim().slice(0, 40)), v);
      const pickB = [...new Set(btns)].filter(t => t && !/^(×|✕)$/.test(t)).slice(0, 10);
      for(const t of pickB){
        if(SKIP_BTN.test(t)) continue;
        await page.evaluate(v => show(v), v);
        const ok = await page.evaluate(([v, t]) => { const b = [...document.querySelectorAll('#v-' + v + ' button')].find(x => x.offsetParent && !x.disabled && x.textContent.trim().slice(0, 40) === t); if(!b) return false; b.click(); return true; }, [v, t]);
        if(!ok){ skipped.push(`${v} > ${t}`); continue; }
        await measure(`${v} after ${t}`);
        await page.evaluate(() => { const d = document.querySelector('#ink [data-inkdone]'); if(d) d.click(); });
        if(await page.evaluate(() => typeof EX !== 'undefined' && EX && EX.running)) await page.evaluate(() => { EX.running = false; });
      }
    }
    // the quiz: a right and a wrong multiple-choice answer, a glossary term tapped, a note open, a flag
    const mc = await page.evaluate(() => QUESTIONS.filter(q => !q.type && (q.options || []).length).map(q => q.id));
    await L.quizOn(page, mc[0]); await measure('quiz card unanswered (flag, note, keys line)');
    await page.evaluate(() => { const b = document.querySelector('#v-quiz [data-scflag]'); if(b) b.click(); const n = document.querySelector('#v-quiz [data-noteq]'); if(n) n.click(); });
    await measure('quiz card flagged, note box open');
    await page.evaluate(() => { const os = [...document.querySelectorAll('#v-quiz .opt')]; const o = os.find(b => { const x = (Q.current.options || [])[+b.dataset.o]; return x && !x.correct; }) || os[os.length - 1]; if(o) o.click(); const c = document.getElementById('btnCheck'); if(c) c.click(); });
    await measure('quiz card answered wrong');
    const tapped = await page.evaluate(() => { const t = document.querySelector('#v-quiz button.gtap'); if(!t) return false; t.click(); return true; });
    if(tapped) await measure('quiz card, a glossary term tapped'); else skipped.push('glossary tap in the quiz (no term named in this card)');
    // a calculation: stopwatch running, Scratch paper open, a wrong number checked (wrong-number-diagnosis)
    const num = await page.evaluate(() => (QUESTIONS.find(q => q.type === 'numeric') || {}).id);
    if(num){
      await L.quizOn(page, num); await page.waitForTimeout(1200); await measure('calculation, stopwatch running');
      const ink = await page.evaluate(() => { const b = document.querySelector('#v-quiz .inkscratch'); if(!b) return false; b.click(); return !!document.getElementById('ink'); });
      if(ink){ await measure('Scratch paper open over the calculation'); await page.evaluate(() => document.querySelector('#ink [data-inkdone]').click()); } else skipped.push('Scratch paper');
      await page.evaluate(() => { const i = document.getElementById('numIn'); if(i){ i.value = '1'; } const c = document.getElementById('btnCheck'); if(c) c.click(); });
      await measure('calculation answered wrong (diagnosis, miss chips, time taken)');
    }
    // one page: the quiz and the paper
    await page.evaluate(() => { DB.layout = 'all'; save(); });
    await L.quizOn(page, mc); await measure('quiz, all on one page (study-controls)');
    await page.evaluate(() => { const n = document.querySelector('#v-quiz [data-noteq]'); if(n) n.click(); });
    await measure('one-page quiz, a note open');
    await page.evaluate(() => { DB.layout = 'one'; save(); show('exam'); });
    await measure('exam start (paper-picker chips, strict box)');
    await page.evaluate(() => { const s = document.getElementById('startExam'); if(s) s.click(); });
    await measure('exam paper running, one at a time');
    await page.evaluate(() => { const o = document.querySelector('#v-exam .opt'); if(o) o.click(); const f = document.querySelector('#v-exam [data-scflag]'); if(f) f.click(); });
    await measure('exam paper, a pick and a flag');
    await page.evaluate(() => { if(EX && EX.running) finishExam(false); });
    await measure('exam result page');
    // module pages: each section of the first module card
    await page.evaluate(() => show('topics'));
    const secs = await page.evaluate(() => [...document.querySelectorAll('#mpCards .modbtn')].map(b => [b.dataset.mpmod, b.dataset.mpsec]));
    for(const [m, s] of secs.slice(0, 4)){
      await page.evaluate(() => show('topics'));
      await page.evaluate(([m, s]) => { const b = document.querySelector(`#mpCards .modbtn[data-mpmod="${m}"][data-mpsec="${s}"]`); if(b) b.click(); }, [m, s]);
      await measure(`module page ${m} ${s}`);
    }
    if(!secs.length) skipped.push('module-pages cards (none on Topics)');
    // Weak spots with answers logged (concept-statuses)
    await page.evaluate(() => show('gaps')); await measure('Weak spots after answers (concept-statuses)');
    const fx = await page.evaluate(() => FX.errors.slice());
    report.push({label, theme, views: seen.length, low: low.length, skipped});
    check(!low.length, `${label} (${JSON.stringify(theme)}): no text in ${seen.length} views reads below 4.5 : 1 (3 : 1 large)`, low.slice(0, 8).join(' | '));
    check(!errors.length && !fx.length, `${label}: no page error and no module error`, errors.concat(fx.map(e => e.module + ': ' + e.message)).slice(0, 4));
    fs.writeFileSync(path.join(SHOTS, label + '-views.json'), JSON.stringify({theme, seen, low, skipped}, null, 1));
    if(low.length) console.log('  low-contrast items (' + label + '):\n    ' + low.join('\n    '));
    if(skipped.length) console.log('  views not reached (' + label + '): ' + skipped.join('; '));
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(report));
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': ' + e.stack); process.exit(1); });
