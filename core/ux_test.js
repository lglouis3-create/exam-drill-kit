/* The first screen, the narrow screen and the Atlas, in a real browser.
 *
 *   1  Start here: the Topics tab opens with one short block of the existing
 *      routes (learn a topic, practice, weak concepts, a practice exam), above the
 *      filters and the topic list; each button opens its view; the whole-bank
 *      passes are still offered, after the topic list.
 *   2  Wide tables in the reading tabs: in a table wider than the screen the first
 *      column stays in view while the rest scrolls, and the box says there is more
 *      to the side.
 *   3  The tab bar on a phone: a cue on the side that has more tabs, gone at the
 *      end; the tab opened is scrolled into view.
 *   4  Step-through controls: every control at least 44 by 44 px, the current step
 *      named in text, the arrow keys step, an Enlarge view that Escape closes; the
 *      steps themselves unchanged.
 *   5  The Atlas (a fixture board drawn into the course's own ATLAS): title, noun
 *      and "e.g." label from course.js, the defaults unchanged without them; a
 *      reveal button per tile with aria-expanded and a name that names no
 *      structure; in Hide names mode no drawing label, heading, section label or
 *      intro names a structure; the count leaves out tiles hidden by a class too;
 *      "Back to the atlas" after a jump out of it.
 *
 * Widths: 360, 390, 430 portrait, 844x390 landscape, 768 and 1024 tablet, 1280.
 * Chromium (or DRILL_BROWSER) emulation, not a phone.
 *
 *     node ux_test.js
 */
const L = require('./check_lib');
const NAME = 'ux_test.js';
const {check} = L;
L.PAGE.need(NAME);

const SIZES = [[360, 740], [390, 844], [430, 932], [844, 390], [768, 1024], [1024, 768], [1280, 900]];

/* The fixture board: three structures in two sections. Names appear in the
   drawings' aria-labels, the board title, the section labels and the intro, the
   way a course's atlas.js writes them. */
const FIXTURE = () => {
  const svg = n => `<svg viewBox="0 0 60 40" role="img" aria-label="${n}"><title>${n}</title><path d="M5 20 L55 20" stroke="currentColor"/></svg>`;
  ATLAS.FG['Zylonol'] = svg('Zylonol'); ATLAS.FG['Quarbate'] = svg('Quarbate'); ATLAS.FG['Fenmorine'] = svg('Fenmorine');
  ATLAS.boards.push({id: 'uxfix', title: 'Zylonol and Quarbate', intro: 'Zylonol carries the ring that Quarbate lacks.',
    note: 'Fenmorine is the odd one out.',
    sections: [{label: 'Zylonol family', items: [
        {plain: 'Zylonol', n: 'Zylonol', t: 'The <b>ring</b>.', e: 'Taught on slide 3.'},
        {plain: 'Quarbate', n: 'Quarbate', t: 'No ring.'}]},
      {label: 'Fenmorine', items: [{plain: 'Fenmorine', n: 'Fenmorine', t: 'A chain.'}]}]});
};
const NAMES = ['Zylonol', 'Quarbate', 'Fenmorine'];

(async () => {
  const {browser} = await L.launch(NAME);

  console.log('\n=== 1. Start here, on the Topics tab ===');
  for(const [w, h] of [[390, 844], [1280, 900]]){
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: w, height: h}});
    const s = await page.evaluate(() => {
      show('topics');
      const box = document.getElementById('startHere');
      if(!box) return null;
      const pos = el => el ? (box.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING ? 'after' : 'before') : 'none';
      const btns = [...box.querySelectorAll('button[data-start]')];
      const sweepAll = document.getElementById('sweepAll');
      const lastTopic = [...document.querySelectorAll('#v-topics details.topic')].pop();
      return {routes: btns.map(b => b.dataset.start),
        minH: Math.min(...btns.map(b => b.getBoundingClientRect().height)),
        filters: pos(document.querySelector('#v-topics .chip[data-f]')),
        topics: pos(document.querySelector('#v-topics details.topic')),
        sweepAfterTopics: !!(sweepAll && lastTopic && (lastTopic.compareDocumentPosition(sweepAll) & Node.DOCUMENT_POSITION_FOLLOWING)),
        practiceSays: (box.querySelector('[data-start="practice"]') || {}).textContent || '',
        // the heading right before the whole-bank passes names them
        passHead: (() => { const hs = [...document.querySelectorAll('#v-topics h3')].filter(x => sweepAll && (x.compareDocumentPosition(sweepAll) & Node.DOCUMENT_POSITION_FOLLOWING));
          return hs.length ? hs[hs.length - 1].textContent.trim() : ''; })(),
        onScreen: box.getBoundingClientRect().top < innerHeight,
        sideways: document.documentElement.scrollWidth > innerWidth + 1};
    });
    check(!!s, `${w} px: the Topics tab has a Start here block`);
    if(s){
      check(['learn', 'practice', 'weak', 'exam'].every(r => s.routes.includes(r)), `${w} px: it offers learn, practice, weak concepts and a practice exam`, s.routes.join(','));
      check(s.minH >= 44, `${w} px: each of its buttons is at least 44 px tall`, `${s.minH} px`);
      check(s.filters === 'after' && s.topics === 'after', `${w} px: it comes before the filters and the topic list`, `${s.filters}/${s.topics}`);
      check(s.onScreen, `${w} px: it is on the first screen`);
      check(s.sweepAfterTopics, `${w} px: the whole-bank pass is still offered, after the topic list`);
      check(!s.sideways, `${w} px: no sideways scroll on the Topics tab`);
      check(/filters/.test(s.practiceSays), `${w} px: Start practice says it follows the filters`, s.practiceSays);
      check(/whole-bank/i.test(s.passHead), `${w} px: the whole-bank passes sit under a heading that names them`, s.passHead);
    }
    if(w === 390 && s){
      const went = {};
      for(const r of s.routes){
        went[r] = await page.evaluate(r => { show('topics'); document.querySelector(`#startHere button[data-start="${r}"]`).click();
          return {view: VIEW, quiz: !!(Q && Q.current)}; }, r);
      }
      check(went.practice && went.practice.view === 'quiz' && went.practice.quiz, 'Start practice opens a question', JSON.stringify(went.practice));
      check(went.weak && went.weak.view === 'gaps', 'Review weak concepts opens Weak spots', JSON.stringify(went.weak));
      check(went.exam && went.exam.view === 'exam', 'Practice exam opens the exam tab', JSON.stringify(went.exam));
      check(went.learn && (went.learn.view === 'guide' || went.learn.view === 'topics'), 'Learn a topic opens the guides (or the topic list)', JSON.stringify(went.learn));
    }
    check(!errors.length, `${w} px: no page error`, errors.join(' | '));
    await ctx.close();
  }

  console.log('\n=== 2. A wide table keeps its first column in view ===');
  for(const [w, h] of [[360, 740], [390, 844], [844, 390]]){
    const {ctx, page} = await L.openFile(browser, {viewport: {width: w, height: h}});
    const t = await page.evaluate(async () => {
      show('tell');
      const host = document.createElement('div');
      host.innerHTML = '<table class="reftab"><thead><tr><th>Looks alike</th><th>One</th><th>Two</th><th>Three</th><th>Four</th></tr></thead><tbody>' +
        '<tr><td>Row name</td><td>' + 'a long cell '.repeat(6) + '</td><td>' + 'b '.repeat(40) + '</td><td>c</td><td>d</td></tr></tbody></table>';
      host.querySelector('table').style.minWidth = '900px';
      document.getElementById('v-tell').appendChild(host);
      boxTables(host);
      const box = host.querySelector('.tscroll'), first = host.querySelector('tbody td');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cueStart = box.classList.contains('more-r');
      box.scrollLeft = 200; box.dispatchEvent(new Event('scroll'));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const stuck = Math.abs(first.getBoundingClientRect().left - box.getBoundingClientRect().left) < 2;
      const bg = getComputedStyle(first).backgroundColor;
      box.scrollLeft = box.scrollWidth; box.dispatchEvent(new Event('scroll'));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return {cueStart, stuck, opaque: bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent',
        cueEnd: box.classList.contains('more-r'), cueLeft: box.classList.contains('more-l'),
        widthShare: first.getBoundingClientRect().width / box.getBoundingClientRect().width,
        sideways: document.documentElement.scrollWidth > innerWidth + 1};
    });
    check(t.cueStart, `${w}x${h}: the box shows a cue that more columns are to the right`);
    check(t.stuck && t.opaque, `${w}x${h}: the first column stays in view, on its own background, while the table scrolls`, JSON.stringify(t));
    check(!t.cueEnd && t.cueLeft, `${w}x${h}: at the right end the right cue goes and a left cue shows`, JSON.stringify(t));
    check(t.widthShare <= 0.5, `${w}x${h}: the fixed column takes at most half the box`, t.widthShare.toFixed(2));
    check(!t.sideways, `${w}x${h}: the page itself does not scroll sideways`);
    const rs = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.innerHTML = '<table class="reftab"><tbody><tr><td rowspan="2">Group</td><td>one</td><td>' + 'x '.repeat(30) + '</td></tr>' +
        '<tr><td>two</td><td>' + 'y '.repeat(30) + '</td></tr></tbody></table>';
      host.querySelector('table').style.minWidth = '900px';
      document.getElementById('v-tell').appendChild(host);
      boxTables(host);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const box = host.querySelector('.tscroll'), second = host.querySelectorAll('tr')[1].firstElementChild;
      return {stick: box.classList.contains('stick'), cue: box.classList.contains('more-r'), pos: getComputedStyle(second).position};
    });
    check(!rs.stick && rs.pos !== 'sticky' && rs.cue, `${w}x${h}: a table with a rowspan scrolls with its cue but pins no cell`, JSON.stringify(rs));
    await ctx.close();
  }

  console.log('\n=== 3. The tab bar on a narrow screen ===');
  for(const [w, h] of SIZES){
    const {ctx, page} = await L.openFile(browser, {viewport: {width: w, height: h}});
    const n = await page.evaluate(async () => {
      const nav = document.getElementById('nav');
      const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      show('topics'); nav.scrollLeft = 0; nav.dispatchEvent(new Event('scroll')); await raf();
      const over = nav.scrollWidth > nav.clientWidth + 1;
      // the chevron covers the bar's very edge: what is under its outer 3 px is the bar, not a tab
      const edge = side => { const r = nav.getBoundingClientRect(), y = r.top + r.height / 2;
        const x = side === 'r' ? r.right - 3 : r.left + 3; return document.elementFromPoint(x, y) === nav; };
      const start = {r: nav.classList.contains('more-r'), l: nav.classList.contains('more-l'), edgeR: over ? edge('r') : true};
      const last = [...nav.querySelectorAll('button[data-v]')].pop();
      show(last.dataset.v); await raf(); await new Promise(r => setTimeout(r, 450));
      const nr = nav.getBoundingClientRect(), br = last.getBoundingClientRect();
      const inView = br.left >= nr.left - 1 && br.right <= nr.right + 1;
      nav.scrollLeft = nav.scrollWidth; nav.dispatchEvent(new Event('scroll')); await raf();
      const end = {r: nav.classList.contains('more-r'), l: nav.classList.contains('more-l'), edgeL: over ? edge('l') : true};
      // a long course title wraps the header; scrolled down, the tab bar stays below it
      document.getElementById('courseTitle').textContent = 'PHAR 0000 — A long course title that wraps onto a second line (P2 Fall 2026)';
      window.dispatchEvent(new Event('resize')); show('topics');
      document.getElementById('v-topics').insertAdjacentHTML('beforeend', '<div style="height:3000px"></div>');
      window.scrollTo(0, 1200); await raf();
      const hb = document.querySelector('header').getBoundingClientRect(), nb = nav.getBoundingClientRect();
      return {over, start, end, inView, navBelow: nb.top >= hb.bottom - 1 && nb.bottom <= innerHeight, hb: Math.round(hb.bottom), nt: Math.round(nb.top)};
    });
    check(n.navBelow, `${w}x${h}: scrolled down under a wrapped title, the tab bar shows below the header`, `header ends ${n.hb}, bar starts ${n.nt}`);
    if(n.over){
      check(n.start.r && !n.start.l, `${w}x${h}: tabs run off the right edge and the bar shows a cue there`, JSON.stringify(n.start));
      check(!n.end.r && n.end.l, `${w}x${h}: at the end the cue moves to the left edge`, JSON.stringify(n.end));
      check(n.inView, `${w}x${h}: the tab opened last is scrolled into view`);
      check(n.start.edgeR && n.end.edgeL, `${w}x${h}: each chevron covers the bar's edge, with no sliver of a tab outside it`, JSON.stringify([n.start, n.end]));
    }else{
      check(!n.start.r && !n.start.l, `${w}x${h}: every tab fits and no cue shows`, JSON.stringify(n.start));
    }
    await ctx.close();
  }

  console.log('\n=== 4. Step-through controls ===');
  {
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: 390, height: 844}});
    const has = await page.evaluate(() => !!document.querySelector('#nav button[data-v="diagrams"]') &&
      typeof DIA !== 'undefined' && Object.keys(DIA).some(k => /data-anim/.test(DIA[k])));
    if(!has) L.skip('step-through controls', 'this course has no step-through figure on its Diagrams tab');
    else{
      const s = await page.evaluate(() => {
        show('diagrams');
        const fig = document.querySelector('#v-diagrams figure:has([data-anim])');
        const ctl = [...fig.querySelectorAll('[data-anim] button')].filter(b => b.offsetParent);
        const small = ctl.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
          .map(b => (b.dataset.go || b.className) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height));
        const now = fig.querySelector('.stepnow');
        return {small, now: now ? now.textContent.trim() : null, live: now ? now.getAttribute('aria-live') : null,
          steps: fig.querySelectorAll('.st').length, enlarge: !!fig.querySelector('[data-go="big"]')};
      });
      check(!s.small.length, 'every step control is at least 44 by 44 px at 390 px', s.small.join(', '));
      check(s.now && /^Step 1 of \d+$/.test(s.now) && s.live === 'polite', 'the current step is named in text and announced', `${s.now} (${s.live})`);
      // keyboard: Tab to Next, Enter; then the arrow keys on a control
      await page.focus('#v-diagrams figure:has([data-anim]) [data-anim] [data-go="1"]');
      await page.keyboard.press('Enter');
      const k1 = await page.evaluate(() => document.querySelector('#v-diagrams figure:has([data-anim]) .stepnow').textContent.trim());
      await page.keyboard.press('ArrowRight');
      const k2 = await page.evaluate(() => document.querySelector('#v-diagrams figure:has([data-anim]) .stepnow').textContent.trim());
      await page.keyboard.press('ArrowLeft');
      const k3 = await page.evaluate(() => {
        const fig = document.querySelector('#v-diagrams figure:has([data-anim])');
        const i = [...fig.querySelectorAll('.st')].findIndex(x => x.classList.contains('on'));
        const d = [...fig.querySelectorAll('.sdot')].findIndex(x => x.classList.contains('on'));
        return {t: fig.querySelector('.stepnow').textContent.trim(), i, d};
      });
      check(/^Step 2 /.test(k1) && /^Step 3 /.test(k2) && /^Step 2 /.test(k3.t) && k3.i === 1 && k3.d === 1,
        'Enter on Next, then ArrowRight and ArrowLeft, step forward, forward and back, dots in step', [k1, k2, k3.t, k3.i, k3.d].join(' / '));
      check(s.enlarge, 'a step-through offers Enlarge');
      if(s.enlarge){
        await page.click('#v-diagrams figure:has([data-anim]) [data-go="big"]');
        const big = await page.evaluate(() => {
          const fig = document.querySelector('#v-diagrams figure.big');
          if(!fig) return null;
          const r = fig.getBoundingClientRect(), sv = fig.querySelector('svg').getBoundingClientRect();
          return {w: r.width, svgW: sv.width, steps: fig.querySelectorAll('.st').length,
            t: fig.querySelector('.stepnow').textContent.trim(), focus: fig.contains(document.activeElement),
            label: fig.querySelector('[data-go="big"]').textContent.trim()};
        });
        check(big && big.w >= 380 && big.svgW >= 340, 'Enlarge shows the figure across the screen', JSON.stringify(big));
        check(big && big.steps === s.steps && /^Step 2 /.test(big.t), 'enlarged, the steps and the current step are the same', JSON.stringify(big));
        check(big && big.focus && /Close/.test(big.label), 'enlarged, focus stays in the figure and its button says Close', JSON.stringify(big));
        const sel = '#v-diagrams figure.big';
        let inside = true;
        for(let i = 0; i < 14; i++){
          await page.keyboard.press(i < 8 ? 'Tab' : 'Shift+Tab');
          inside = inside && await page.evaluate(sel => { const f = document.querySelector(sel); return !!f && f.contains(document.activeElement); }, sel);
        }
        check(inside, 'enlarged, Tab and Shift+Tab stay among the figure\'s own controls');
        await page.keyboard.press('Escape');
        const closed = await page.evaluate(() => ({gone: !document.querySelector('#v-diagrams figure.big'), lock: document.body.classList.contains('figbig'),
          focus: document.activeElement && document.activeElement.dataset.go === 'big' && document.activeElement.textContent.trim() === 'Enlarge'}));
        check(closed.gone && !closed.lock, 'Escape closes the enlarged figure and releases the page', JSON.stringify(closed));
        check(closed.focus, 'after Escape, focus is back on Enlarge', JSON.stringify(closed));
        // another tab, or the view drawn again, while enlarged: no scroll lock left behind
        const away = await page.evaluate(() => {
          const b = () => document.querySelector('#v-diagrams figure:has([data-anim]) [data-go="big"]');
          b().click(); show('topics');
          const r1 = {lock: document.body.classList.contains('figbig'), big: !!document.querySelector('figure.big'), overflow: getComputedStyle(document.body).overflow};
          show('diagrams'); b().click(); renderDiagrams();
          const r2 = {lock: document.body.classList.contains('figbig'), big: !!document.querySelector('figure.big')};
          return {r1, r2};
        });
        check(!away.r1.lock && !away.r1.big && away.r1.overflow !== 'hidden', 'opening another tab while enlarged closes the figure and the page scrolls', JSON.stringify(away.r1));
        check(!away.r2.lock && !away.r2.big, 'drawing the view again while enlarged leaves no scroll lock', JSON.stringify(away.r2));
      }
    }
    // Enlarge and close keep the reader's place: the page does not jump when the
    // figure leaves the flow, nor stay moved after it comes back
    if(has){
      // a short screen (a phone in landscape), so the page scrolls even on a course with one figure
      await page.setViewportSize({width: 390, height: 420});
      // two places: the page scrolled to its end (the figure leaving the flow would
      // shorten it) and the figure's top at the top of the screen (scroll anchoring)
      for(const where of ['end', 'top']){
        const place = await page.evaluate(async where => {
          const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          show('diagrams'); await raf();
          const fig = document.querySelector('#v-diagrams figure:has([data-anim])');
          if(where === 'top') fig.scrollIntoView();
          else { fig.scrollIntoView(); window.scrollBy(0, -50);
            window.scrollTo(0, Math.max(window.scrollY, document.documentElement.scrollHeight - innerHeight)); }
          await raf();
          const y0 = Math.round(scrollY);
          fig.querySelector('[data-go="big"]').click(); await raf();
          const y1 = Math.round(scrollY);
          document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})); await raf();
          const y2 = Math.round(scrollY);
          fig.querySelector('[data-go="big"]').click(); await raf();
          fig.querySelector('[data-go="big"]').click(); await raf();
          return {y0, y1, y2, y3: Math.round(scrollY)};
        }, where);
        check(place.y0 > 0 && place.y1 === place.y0 && place.y2 === place.y0 && place.y3 === place.y0,
          `Enlarge, then Escape or Close, leaves the page where it was (${where === 'top' ? 'figure at the top of the screen' : 'page scrolled to its end'})`, JSON.stringify(place));
      }
      // a figure of fractional height (487.45 px, which offsetHeight rounds to 487)
      // with a 0.6 px spacer after it, the page scrolled to its end: the exact scroll
      // position and page height stay the same while enlarged and after Close and
      // Escape (kit #90; the rounded checks above pass with this defect present)
      const frac = await page.evaluate(async () => {
        const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        show('diagrams'); await raf();
        const figs = [...document.querySelectorAll('#v-diagrams figure')].filter(f => f.querySelector('[data-go="big"]'));
        const fig = figs[figs.length - 1];
        if(!fig) return null;
        const oldH = fig.style.height;
        const spacer = document.createElement('div');
        spacer.id = 'ux-frac-spacer'; spacer.style.height = '0.6px';
        fig.style.height = '487.45px'; fig.after(spacer);
        const big = () => fig.querySelector('[data-go="big"]');
        const at = () => ({y: window.scrollY, h: document.documentElement.scrollHeight});
        const out = {};
        try {
          await raf();
          window.scrollTo(0, document.documentElement.scrollHeight); await raf();
          out.before = at();
          big().click(); await raf(); out.enlarged = at();
          big().click(); await raf(); out.afterClose = at();
          big().click(); await raf(); out.enlarged2 = at();
          document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})); await raf();
          out.afterEscape = at();
        } finally {
          if(fig.classList.contains('big')) big().click();
          spacer.remove(); fig.style.height = oldH;
          window.scrollTo(0, 0); await raf();
        }
        out.cleaned = !document.getElementById('ux-frac-spacer') && fig.style.height === oldH && !document.querySelector('figure.big');
        return out;
      });
      const same = frac && ['enlarged', 'afterClose', 'enlarged2', 'afterEscape'].every(k =>
        frac[k].y === frac.before.y && frac[k].h === frac.before.h);
      check(!!frac && frac.before.y > 0 && same && frac.cleaned,
        'a figure of fractional height at the end of the page: the exact scroll position and page height stay the same through Enlarge, Close and Escape', JSON.stringify(frac));
    }
    check(!errors.length, 'no page error on the Diagrams tab', errors.join(' | '));
    await ctx.close();
  }

  console.log('\n=== 5. The Atlas ===');
  for(const [w, h] of [[390, 844], [1280, 900]]){
    const {ctx, page, errors} = await L.openFile(browser, {viewport: {width: w, height: h}});
    const draw = (settings) => page.evaluate(([fx, settings]) => {
      if(!ATLAS.boards.some(b => b.id === 'uxfix')) (new Function(fx))();
      delete COURSE.atlasTitle; delete COURSE.atlasNoun; delete COURSE.atlasExampleLabel;
      Object.assign(COURSE, settings || {});
      ATLAS_BUILT = false; show('atlas');
      const el = document.getElementById('v-atlas');
      return {h2: el.querySelector('h2').textContent.trim(), intro: el.querySelector('p.sub').textContent.replace(/\s+/g, ' ').trim(),
        ph: el.querySelector('#atq').placeholder, aria: el.querySelector('#atq').getAttribute('aria-label'),
        count: el.querySelector('#atCount').textContent.trim(),
        eg: [...el.querySelectorAll('.ateg')].map(p => p.textContent.trim())};
    }, ['(' + FIXTURE.toString() + ')()', settings]);
    const n = await page.evaluate(() => ATLAS.boards.reduce((a, b) => a + b.sections.reduce((m, s) => m + s.items.length, 0), 0));
    const def = await draw(null);
    // the core's own handler (oninput), not an input event: a course's Atlas controls
    // (DEENT's atlas_ui.js) listen for the event and write a count of their own
    const defSearch = await page.evaluate(() => { const q = document.getElementById('atq'); q.value = 'zylonol'; q.oninput();
      const t = document.getElementById('atCount').textContent.trim(); q.value = ''; q.oninput(); return t; });
    const own = await draw({atlasTitle: 'Structure atlas', atlasNoun: ['structure', 'structures'], atlasExampleLabel: ''});
    if(w === 390){
      check(def.h2 === 'Functional group atlas' && def.intro.startsWith(`${n + 3} groups,`) && def.ph === 'Find a group…' &&
        def.aria === 'Find a functional group' && def.count === `${n + 3} groups`, 'with no course setting the Atlas reads as before', JSON.stringify(def));
      check(/^\d+ of \d+$/.test(defSearch), 'with no course setting a narrowed count reads "n of N" as before', defSearch);
      check(def.eg.length >= 1 && def.eg.every(t => /^e\.g\. /.test(t)), 'with no course setting the "e.g." label stays, as text', def.eg.join(' | '));
      check(own.h2 === 'Structure atlas' && own.intro.startsWith(`${n + 3} structures,`) && own.ph === 'Find a structure…' &&
        own.aria === 'Find a structure' && own.count === `${n + 3} structures`, 'atlasTitle and atlasNoun name the Atlas, its intro, search and count', JSON.stringify(own));
      check(own.eg.length >= 1 && own.eg.every(t => !/^e\.g\./.test(t)), 'atlasExampleLabel "" drops the "e.g." label', own.eg.join(' | '));
    }
    const a = await page.evaluate(NAMES => {
      const el = document.getElementById('v-atlas');
      const tiles = [...el.querySelectorAll('#at-uxfix .attile')];
      const rev = tiles.map(t => t.querySelector('button.atrev'));
      const nameOf = b => (b.getAttribute('aria-label') || b.textContent).trim();
      const leaks = () => {
        const out = [];
        const seen = x => x.offsetParent !== null || x.getClientRects().length > 0;
        el.querySelectorAll('svg[aria-label]').forEach(s => { if(NAMES.some(nm => s.getAttribute('aria-label').includes(nm))) out.push('svg label'); });
        el.querySelectorAll('svg title').forEach(s => { if(NAMES.some(nm => s.textContent.includes(nm))) out.push('svg title'); });
        el.querySelectorAll('#at-uxfix h3, #at-uxfix .bintro, #at-uxfix .atsub, #at-uxfix .atnote').forEach(x => {
          if(seen(x) && NAMES.some(nm => x.innerText.includes(nm))) out.push(x.tagName + '.' + x.className); });
        el.querySelectorAll('#at-uxfix .attile:not(.shown)').forEach(t => { if(NAMES.some(nm => t.innerText.includes(nm))) out.push('tile text'); });
        rev.forEach(b => { if(b && NAMES.some(nm => nameOf(b).includes(nm))) out.push('reveal name'); });
        return out;
      };
      const r = {buttons: rev.every(b => b && b.tagName === 'BUTTON' && b.type === 'button')};
      r.hiddenWhenNamesOn = rev.every(b => b && !b.offsetParent);
      el.querySelector('#atHide').click();
      r.leaks = leaks();
      r.visible = rev.every(b => b.offsetParent);
      r.expanded0 = rev.map(b => b.getAttribute('aria-expanded'));
      r.names0 = rev.map(nameOf);
      rev[0].focus(); r.focusable = document.activeElement === rev[0];
      rev[0].click();
      r.after = {exp: rev[0].getAttribute('aria-expanded'), shown: tiles[0].classList.contains('shown'), name: nameOf(rev[0])};
      r.svgBack = tiles[0].querySelector('svg').getAttribute('aria-label');
      rev[0].click();
      el.querySelector('#atShow').click();
      r.allExp = rev.every(b => b.getAttribute('aria-expanded') === 'true');
      el.querySelector('#atHide').click();
      r.labelsBack = tiles.map(t => t.querySelector('svg').getAttribute('aria-label'));
      r.headBack = el.querySelector('#at-uxfix h3').innerText.trim();
      // the count leaves out a tile a class hides, not only one the search hides
      const st = document.createElement('style'); st.textContent = '.uxgone{display:none}'; document.head.appendChild(st);
      tiles[2].classList.add('uxgone');
      const q = el.querySelector('#atq'); q.value = ''; q.oninput();
      r.count = el.querySelector('#atCount').textContent.trim();
      r.total = el.querySelectorAll('.attile').length;
      return r;
    }, NAMES);
    check(a.buttons, `${w} px: each tile has a reveal button (a button element)`);
    check(a.hiddenWhenNamesOn, `${w} px: the reveal button is not shown while names are shown`);
    check(a.visible && a.focusable, `${w} px: in Hide names mode each reveal button is shown and takes focus`);
    check(a.expanded0.every(x => x === 'false') && a.after.exp === 'true' && a.after.shown, `${w} px: the reveal button sets aria-expanded and shows that tile`, JSON.stringify([a.expanded0, a.after]));
    check(a.allExp, `${w} px: Reveal all sets every reveal button expanded`);
    check(!a.leaks.length, `${w} px: in Hide names mode no label, heading, section label, intro or hidden text names a structure`, a.leaks.join(', '));
    check(a.svgBack === 'Zylonol', `${w} px: a revealed tile's drawing is labelled with its name again`, a.svgBack);
    check(a.labelsBack.join() === NAMES.join() && /Zylonol and Quarbate/.test(a.headBack), `${w} px: with names shown again, labels and headings are restored`, JSON.stringify([a.labelsBack, a.headBack]));
    check(a.count === `${a.total - 1} of ${a.total} structures`, `${w} px: the count leaves out a tile hidden by a class`, a.count);
    // the way back after a jump out of the Atlas
    const back = await page.evaluate(() => { show('atlas'); jump('ref'); const b = document.getElementById('backbtn'); const t = b ? b.textContent : '';
      if(b) b.click(); return {t, view: VIEW}; });
    check(/Back to the atlas/.test(back.t) && back.view === 'atlas', `${w} px: a jump out of the Atlas offers "Back to the atlas" and returns there`, JSON.stringify(back));
    const side = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    check(!side, `${w} px: no sideways scroll on the Atlas`);
    check(!errors.length, `${w} px: no page error on the Atlas`, errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  L.finish(NAME);
})().catch(e => { console.error(e); console.log(`FAIL: ${NAME}: ${String(e.message).split('\n')[0]}`); process.exit(1); });
