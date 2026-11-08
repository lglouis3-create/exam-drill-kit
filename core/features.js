/* ==========================================================================
   FEATURE MODULES: the hooks the engine offers a switched-on module
   ==========================================================================
   build.py puts this file into the page only when course.js `features`
   switches on at least one module (features/README.md), so a course without
   modules carries none of it and its page is the one the core built before.

   Where it sits in the page: after the shell (storage, scheduler, record) and
   the course's data, before views.js. Each module follows it, wrapped by the
   build as

       FX.load('<name>', '<version>', {<options>}, <build step output>,
               function(X, OPT, DATA){ 'use strict'; <the module's files> });

   so a module's top-level names stay its own. A module runs before views.js:
   while it loads it only defines things and registers hooks; what it needs
   from views.js it uses inside its hooks, which run later.

   The hooks, on X (the module's handle):
     X.tab({id, label, render(pane), before})  a nav tab and its pane #v-<id>,
                              placed before the tab `before` (default Settings)
     X.type(name, {body(q, Q), wire(q, el, Q), read(q, el, Q), grade(q, picked)})
                              a question type: its quiz card body, how the
                              answer is read off the card, and its grader
     X.after(fn(q, result, picked, mode, entry))
                              after an answer is recorded (entry is the
                              answer kept in the progress, DB.answers)
     X.rendered(fn(pane, view))  after the engine draws into a view's pane
     X.reading(fn(html))      the HTML of a reading tab (Guides, Tell apart,
                              Reference) before it is drawn; returns the HTML
     X.paper(fn(qs))          the questions of a new exam paper, in order,
                              before it starts; returns a paper of the same
                              length, each a question of the bank once: these
                              questions in another order, or other questions
                              in their place (paper-picker draws another
                              exam's paper); not run on the sample papers
                              the exam's opening page draws
     X.settings({title, html(), wire(el)})  a section at the end of Settings
     X.start(fn())            once, after the first progress load
     X.progress(fn(db))       on every saved progress read or imported, before
                              the engine uses it (a converter for old answers)
     X.api(object)            what the module offers other modules: FX.api(name)

   The engine functions these hooks attach to are wrapped here and nowhere
   else: show, renderQuiz, renderSettings, refFigures and drawPaper
   (views.js), record, load and upgradeDB (shell.html). Each stays the engine's own function: the
   wrapper calls it and adds the module's part before or after.

   A module that throws while it loads is not registered; a hook that throws
   switches its module off for the rest of the visit (its tab goes). Either way
   the error is kept in FX.errors and printed to the console, and the page
   carries on with the modules that work.
   ========================================================================== */
const FX = (() => {
  const mods = {}, order = [], errors = [], apis = {};
  const tabs = {}, types = {}, afters = [], renders = [], sections = [], starts = [], progs = [], readings = [], papers = [];
  let started = false, domDone = false;
  const on = n => !!(mods[n] && !mods[n].off);
  const note = (n, where, e) => {
    errors.push({module: n, where, message: String((e && e.message) || e)});
    try { console.error('feature module ' + n + ' (' + where + '):', e); } catch(_){}
  };
  function off(n, where, e){
    note(n, where, e);
    if(mods[n]) mods[n].off = true;
    for(const id in tabs) if(tabs[id].module === n){
      try {
        const b = document.querySelector('#nav button[data-v="' + id + '"]'); if(b) b.remove();
        if(typeof VIEW !== 'undefined' && VIEW === id) show('topics');
      } catch(_){}
    }
  }
  /* run one hook of module n; a throw switches the module off */
  function run(n, where, f, fallback){
    if(!on(n)) return fallback;
    try { return f(); } catch(e){ off(n, where, e); return fallback; }
  }

  function loadModule(name, version, opt, data, body){
    const m = mods[name] = {name, version, opt, off: false};
    order.push(name);
    const staged = [];          // registrations count only if the whole module loads
    const X = {
      name, version, opt, data,
      tab:      t => staged.push(() => { tabs[t.id] = Object.assign({module: name, before: 'settings'}, t); }),
      type:     (k, t) => staged.push(() => { types[k] = Object.assign({module: name}, t); }),
      after:    f => staged.push(() => afters.push({n: name, f})),
      rendered: f => staged.push(() => renders.push({n: name, f})),
      reading:  f => staged.push(() => readings.push({n: name, f})),
      paper:    f => staged.push(() => papers.push({n: name, f})),
      settings: s => staged.push(() => sections.push(Object.assign({n: name}, s))),
      start:    f => staged.push(() => starts.push({n: name, f})),
      progress: f => staged.push(() => progs.push({n: name, f})),
      api:      o => staged.push(() => { apis[name] = o; }),
    };
    try { body(X, opt, data); staged.forEach(s => s()); }
    catch(e){ m.off = true; note(name, 'load', e); }
  }

  /* ---- tabs: the nav button and pane, made once the page is there -------- */
  function dom(){
    if(domDone) return;
    domDone = true;
    watch();
    const nav = document.getElementById('nav'), main = document.querySelector('main');
    for(const id in tabs){
      const t = tabs[id];
      run(t.module, 'tab', () => {
        if(!document.getElementById('v-' + id)){
          const sec = document.createElement('section');
          sec.id = 'v-' + id; sec.className = 'hide';
          const at = document.getElementById('v-' + t.before);
          if(at && typeof main.insertBefore === 'function') main.insertBefore(sec, at); else main.appendChild(sec);
        }
        if(!nav.querySelector('button[data-v="' + id + '"]')){
          const b = document.createElement('button');
          b.setAttribute('data-v', id); b.textContent = t.label;
          b.onclick = () => show(id);
          const at = nav.querySelector('button[data-v="' + t.before + '"]');
          if(at && typeof nav.insertBefore === 'function') nav.insertBefore(b, at); else nav.appendChild(b);
        }
        if(typeof VIEW_NAME !== 'undefined' && !VIEW_NAME[id]) VIEW_NAME[id] = 'the ' + t.label.toLowerCase();
      });
    }
  }
  function startUp(){
    if(started) return;
    started = true;
    try { dom(); } catch(e){ note('(tabs)', 'dom', e); }
    starts.forEach(s => run(s.n, 'start', s.f));
    sweepNow();
  }

  /* ---- the engine functions the hooks attach to --------------------------- */
  const wrapped = [];
  function wrap(label, get, set, make){
    try { const orig = get(); if(typeof orig !== 'function') throw new Error(label + ' is not a function');
          set(make(orig)); wrapped.push(label); }
    catch(e){ note('(engine)', 'wrap ' + label, e); }
  }
  wrap('show', () => show, f => { show = f; }, orig => function(v){
    try { dom(); } catch(e){}
    const t = tabs[v] && on(tabs[v].module) ? tabs[v] : null;
    for(const id in tabs){ const p = document.getElementById('v-' + id); if(p) p.classList.toggle('hide', !(t && id === v)); }
    if(!t) return orig.apply(this, arguments);
    VIEW = v;
    document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v));
    VIEWS.forEach(k => { const p = document.getElementById('v-' + k); if(p) p.classList.add('hide'); });
    window.scrollTo(0, 0);
    const pane = document.getElementById('v-' + v);
    if(run(t.module, 'tab ' + v, () => { t.render(pane); return true; }, false) !== true) return orig.call(this, 'topics');
  });
  wrap('renderQuiz', () => renderQuiz, f => { renderQuiz = f; }, orig => function(){
    const q = typeof Q !== 'undefined' && Q && Q.current;
    const T = q && q.type && types[q.type];
    if(!T) return orig.apply(this, arguments);
    if(!on(T.module)) return typeOff(q, T);
    return typeCard(q, T);
  });
  wrap('record', () => record, f => { record = f; }, orig => function(q, result, picked, ms, mode){
    const r = orig.apply(this, arguments);
    const entry = DB.answers[DB.answers.length - 1];
    const how = mode || (typeof Q !== 'undefined' && Q && Q.sweep ? 'sweep' : 'quiz');
    afters.forEach(a => run(a.n, 'after', () => a.f(q, result, picked, how, entry && entry.qid === q.id ? entry : null)));
    return r;
  });
  wrap('renderSettings', () => renderSettings, f => { renderSettings = f; }, orig => function(){
    const r = orig.apply(this, arguments);
    const el = document.getElementById('v-settings');
    sections.forEach(s => run(s.n, 'settings', () => {
      const box = document.createElement('div');
      box.className = 'fxsettings'; box.setAttribute('data-feature', s.n);
      box.innerHTML = `<h3>${esc(s.title)}</h3>` + s.html();
      el.appendChild(box);
      if(s.wire) s.wire(box);
    }));
    return r;
  });
  wrap('refFigures', () => refFigures, f => { refFigures = f; }, orig => function(html){
    readings.forEach(r => { html = run(r.n, 'reading', () => { const out = r.f(html); if(typeof out !== 'string') throw new Error('X.reading must return the HTML'); return out; }, html); });
    return orig.call(this, html);
  });
  wrap('drawPaper', () => drawPaper, f => { drawPaper = f; }, orig => function(){
    let qs = orig.apply(this, arguments);
    if(typeof EXAM_SAMPLING !== 'undefined' && EXAM_SAMPLING) return qs;   // the opening page's sample draws are not new papers
    papers.forEach(p => { qs = run(p.n, 'paper', () => { const out = p.f(qs.slice()); if(!Array.isArray(out) || out.length !== qs.length || !out.every(x => x && typeof x === 'object' && byId(x.id) === x) || new Set(out.map(x => x.id)).size !== out.length) throw new Error('X.paper must return a paper of the same length, each a question of the bank once'); return out; }, qs); });
    return qs;
  });
  wrap('load', () => load, f => { load = f; }, orig => function(){
    const r = orig.apply(this, arguments);
    startUp();
    return r;
  });
  wrap('upgradeDB', () => upgradeDB, f => { upgradeDB = f; }, orig => function(raw){
    const db = orig.apply(this, arguments);
    progs.forEach(p => run(p.n, 'progress', () => p.f(db)));
    return db;
  });

  /* ---- a question type a module draws ------------------------------------- */
  function typeCard(q, T){
    const el = $('#v-quiz');
    let h = `<div class="qcard"><div class="qhead">${profTag(q.prof)}<span>${esc(Q.label)}</span>${qLabel(q)}<span class="spacer"></span></div>
      <div class="qprog"><span>${Q.sweep ? `question ${Q.i} of ${Q.sweep.length}` : ''}</span>${sessStrip()}</div>
      <div class="qbody"><p class="stem">${esc(q.stem)}</p>`;
    const body = run(T.module, 'type body', () => T.body(q, Q), null);
    if(body === null) return typeOff(q, T);
    h += body + (Q.revealed ? explainRow(q) : '') + `</div><div class="qfoot">`;
    if(!Q.revealed) h += `<button class="btn" id="btnCheck">Check answer</button>`;
    else {
      h += `<button class="btn" id="btnNext">Next question</button>`;
      if(Q.lastRight && !Q.guessedLogged) h += confidenceButtons();
      if(!Q.lastRight) h += sureButton();
      h += `<button class="btn ghost" onclick="show('topics')">Change topic</button>`;
    }
    el.innerHTML = h + `</div></div>`;
    if(T.wire) run(T.module, 'type wire', () => T.wire(q, el, Q));
    const bc = $('#btnCheck'); if(bc) bc.onclick = () => {
      if(Q.revealed) return;
      const picked = T.read ? run(T.module, 'type read', () => T.read(q, el, Q), null) : Q.picked;
      if(picked === null || picked === undefined || !on(T.module)) return;
      const ok = run(T.module, 'type grade', () => !!T.grade(q, picked), null);
      if(ok === null) return renderQuiz();
      Q.picked = picked; Q.revealed = true; Q.guessedLogged = false; Q.lastRight = ok;
      record(q, ok ? 'correct' : 'wrong', picked, Date.now() - (Q.startedAt || Date.now()));
      renderQuiz();
    };
    const bn = $('#btnNext'); if(bn) bn.onclick = () => { Q.answered++; Q.lastId = q.id; nextQuestion(); };
    wireConfidence();
  }
  /* a question whose module is off: said plainly, with a way on */
  function typeOff(q, T){
    $('#v-quiz').innerHTML = `<div class="empty"><p><b>This question is drawn by the ${esc(T.module)} part of the drill,
      which stopped with an error on this page.</b></p><p style="margin:10px 0 16px">The other questions work as before.</p>
      <p><button class="btn" id="fxSkip">Next question</button> <button class="btn ghost" onclick="show('topics')">Back to topics</button></p></div>`;
    const b = document.getElementById('fxSkip');
    if(b) b.onclick = () => { Q.answered++; Q.lastId = q.id; nextQuestion(); };
  }

  /* ---- after the engine draws: one pass per batch of changes --------------- */
  let mo = null;
  function watch(){
    if(mo || typeof MutationObserver === 'undefined' || !renders.length) return;
    const main = document.querySelector('main');
    if(!main || typeof main.querySelectorAll !== 'function') return;
    mo = new MutationObserver(recs => {
      const panes = new Set();
      for(const r of recs){
        let n = r.target;
        while(n && n !== main && !(n.id && /^v-/.test(n.id) && n.parentElement === main)) n = n.parentElement;
        if(n && n !== main) panes.add(n);
      }
      if(!panes.size) return;
      mo.disconnect();
      try {
        panes.forEach(p => renders.forEach(r => run(r.n, 'rendered', () => r.f(p, p.id.slice(2)))));
      } finally { mo.takeRecords(); mo.observe(main, {childList: true, subtree: true}); }
    });
    mo.observe(main, {childList: true, subtree: true});
  }
  /* the views drawn before the watch began (the first screen) get one pass too */
  function sweepNow(){
    const main = document.querySelector('main');
    if(!main || typeof main.querySelectorAll !== 'function' || !renders.length) return;
    if(mo) mo.disconnect();
    try { main.querySelectorAll(':scope > section').forEach(p => renders.forEach(r => run(r.n, 'rendered', () => r.f(p, p.id.slice(2))))); }
    finally { if(mo){ mo.takeRecords(); mo.observe(main, {childList: true, subtree: true}); } }
  }
  return {
    load: loadModule, on, run, errors, wrapped,
    api: n => (on(n) ? apis[n] || null : null),
    modules: () => order.map(n => ({name: n, version: mods[n].version, on: on(n), options: mods[n].opt})),
    tabs: () => Object.keys(tabs).filter(id => on(tabs[id].module)),
    types: () => Object.keys(types).filter(k => on(types[k].module)),
  };
})();
