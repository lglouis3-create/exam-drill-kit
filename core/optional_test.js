/* Optional topics: a TOPICS entry with `optional: true` (shell.html OPTIONAL_TOPICS).
 *
 * Louis, 2026-11-06, for DEENT: questions taught only on slides outside a
 * professor's assigned pages stay in the bank, kept "outside Exam 1 practice
 * papers, required-exam readiness calculations, and default Exam 1 study
 * recommendations", and reachable "through an explicitly labeled optional or
 * beyond-Exam-1 practice category". The mark is per topic.
 *
 * Checked on a scratch copy of this source tree with one topic marked optional
 * (a file q99_optional_check.js appended to course.js `files`: the topic already
 * optional in the course, else the topic with the fewest questions among those
 * with two or more, never the only topic with questions):
 *   - Topics shows the topic with a visible "Optional" label; no other topic has one;
 *   - none of its questions is in "Everything, adaptive" (unfiltered, and filtered
 *     by its professor), in 200 picks of the adaptive runner started from the
 *     Topics button (and 60 filtered), in the pass of every question, the filtered
 *     pass or the exam-weighted pass, or on 20 drawn exam papers;
 *   - after every question in the bank is answered wrong: Weak spots' "What to
 *     review next" (the count, "Drill all" and each section's drill), the mastered
 *     count and the pool cards (their concept counts and their buttons) leave the
 *     optional questions out;
 *   - a question card of the topic carries no "Exam N · …" label and does carry
 *     "Optional"; a card of another topic keeps its exam label;
 *   - opening the topic reaches every question of it: its "Everything in" Start,
 *     each subtopic's Start, and the adaptive runner on that set picks from it.
 * On the course's own page, when it has no optional topic: no "Optional" label,
 * "Everything" and the pass of every question hold every question (the behaviour
 * before optional topics existed).
 *
 *     node optional_test.js
 */
const L = require('./check_lib');
const NAME = 'optional_test.js';
const {check} = L;
L.PAGE.need(NAME);

const MARK = `/* optional_test.js: one topic marked optional on a scratch copy */
;(() => {
  if(TOPICS.some(t => t.optional)) return;
  const n = t => QUESTIONS.filter(q => q.topic === t.id).length;
  const withQs = TOPICS.filter(t => n(t) >= 2);
  if(TOPICS.filter(t => n(t) > 0).length < 2 || !withQs.length) return;
  withQs.sort((a, b) => n(a) - n(b))[0].optional = true;
})();
`;

// answers the question on screen through its controls, then Next (nullexam_test.js)
const ANSWER = right => {
  const q = Q && Q.current; if(!q) return null;
  if(q.type === 'numeric'){ document.getElementById('numIn').value = String(right ? q.answer : q.answer + 1000); document.getElementById('btnCheck').click(); }
  else if(q.type === 'match'){
    const sels = [...document.querySelectorAll('#v-quiz select[data-row]')];
    sels.forEach((s, i) => { s.value = String(right ? i : (i + 1) % sels.length); s.dispatchEvent(new Event('change')); });
    document.getElementById('btnCheck').click();
  } else if(isMulti(q)){
    for(const i of (right ? correctSet(q) : [q.options.findIndex(o => !o.correct)])) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
    document.getElementById('btnCheck').click();
  } else document.querySelector(`#v-quiz button[data-o="${q.options.findIndex(o => right ? o.correct : !o.correct)}"]`).click();
  const b = document.getElementById('btnNext'); if(b) b.click();
  return q.id;
};

(async () => {
  const {browser} = await L.launch(NAME);
  try {
    // ---- the course's own page, when it has no optional topic: unchanged ----
    {
      const {ctx, page, errors} = await L.openFile(browser);
      const own = await page.evaluate(() => {
        const opt = TOPICS.some(t => t.optional);
        startSweep('all'); const all = Q.sweep.length; show('topics');
        return {opt, n: QUESTIONS.length, every: poolFor(null, null).length, matching: QUESTIONS.filter(matchesFilter).length, all,
                label: !!document.querySelector('#v-topics [data-optional]'),
                head: (document.querySelector('#v-topics p.sub') || {}).textContent || ''};
      });
      if(own.opt) L.skip("the course's own page is unchanged", 'this course marks a topic optional');
      else {
        check(!own.label, "the course's own page (no optional topic) shows no Optional label");
        check(own.every === own.matching && own.every === own.n, `"Everything" holds every question (${own.every} of ${own.n})`, own);
        check(own.all === own.n, `the pass of every question holds all ${own.n}`, own.all);
        check(!/optional topics/.test(own.head), 'the Topics header names no optional topics');
      }
      check(!errors.length, "no page error on the course's own page", errors.join(' | '));
      await ctx.close();
    }

    // ---- a scratch copy with one optional topic ----
    const b = L.scratchBuild('optional-test', {files: {'q99_optional_check.js': MARK}});
    try {
      if(!check(b.code === 0, 'the scratch copy builds', b.out.split('\n').slice(-3).join(' | '))) return;
      const {ctx, page, errors} = await L.openPage(browser, b.page);
      const info = await page.evaluate(() => {
        const t = TOPICS.find(t => t.optional);
        if(!t) return null;
        const opt = QUESTIONS.filter(q => q.topic === t.id);
        return {id: t.id, name: t.name, ids: opt.map(q => q.id), n: QUESTIONS.length, profs: [...new Set(opt.map(q => q.prof))],
                subs: t.subs.map(s => ({id: s.id, n: opt.filter(q => q.sub === s.id).length})).filter(s => s.n)};
      });
      if(!info){ L.notRun(NAME, 'this course has fewer than two topics with questions, so no topic can be marked optional'); }
      console.log(`  optional topic: ${info.id} (${info.ids.length} of ${info.n} questions)`);
      const OPT = new Set(info.ids);
      const none = (ids, label) => { const bad = (ids || []).filter(id => OPT.has(id));
        return check(bad.length === 0, label, `${bad.length} optional: ${bad.slice(0, 5).join(', ')}`); };

      // Topics: the label
      const lab = await page.evaluate(id => {
        show('topics');
        return [...document.querySelectorAll('#v-topics details.topic')].map(d => ({
          name: (d.querySelector('summary .tname') || {}).textContent || '',
          opt: !!d.querySelector('summary [data-optional]'),
          text: ((d.querySelector('summary [data-optional]') || {}).textContent || '').trim(),
          mine: !!d.querySelector(`button[data-t="${id}"]`)}));
      }, info.id);
      const mine = lab.filter(x => x.mine), other = lab.filter(x => !x.mine);
      check(mine.length === 1 && mine[0].opt && mine[0].text === 'Optional', 'Topics shows the optional topic with a visible "Optional" label', mine);
      check(other.every(x => !x.opt), 'no other topic carries the label', other.filter(x => x.opt).map(x => x.name));
      check(mine.length === 1 && await page.isVisible(`#v-topics details.topic:has(button[data-t="${info.id}"]) summary [data-optional]`),
            'the label is on the topic line, visible with the topic closed');

      // Everything, adaptive: unfiltered, from the Topics button, 200 picks
      const run = await page.evaluate(({n, prof}) => {
        DB.settings.mode = 'all';        // "Ask everything": the runner never runs dry in a small bank
        const out = {pool: null, picks: [], filtered: null, fpicks: []};
        show('topics');
        const btn = [...document.querySelectorAll('#v-topics .subrow button[data-t=""]')][0];
        if(!btn) return out;
        btn.click();
        out.pool = Q.pool.map(q => q.id); out.broad = Q.broad;
        return out;
      }, {n: 200});
      check(run.pool && run.pool.length > 0, '"Everything, adaptive" starts from its Topics button', run);
      none(run.pool, '"Everything, adaptive" (no filter) holds no optional question');
      // when the runner has nothing left to ask, the scheduling state is cleared (in this
      // test page only) and "Everything" started again, so the 200 picks are all served
      const AGAIN = () => { DB.concepts = {}; startQuiz(null, null); };
      const picks = [];
      for(let i = 0; i < 2000 && picks.length < 200; i++){
        const id = await page.evaluate(ANSWER, Math.random() < 0.5);
        if(!id){ await page.evaluate(AGAIN); continue; }
        picks.push(id);
      }
      check(picks.length === 200, `the adaptive runner served ${picks.length} picks`);
      none(picks, `none of ${picks.length} adaptive picks is an optional question`);

      // filtered by the professor of the optional topic
      const prof = info.profs[0];
      const filt = await page.evaluate(prof => {
        FILTER.prof = prof; const pool = poolFor(null, null).map(q => q.id);
        startQuiz(null, null);
        return {pool, qpool: Q ? Q.pool.map(q => q.id) : [], broad: Q && Q.broad};
      }, prof);
      none(filt.pool, `"Everything" filtered to ${prof} holds no optional question`);
      none(filt.qpool, `"Everything, adaptive" filtered to ${prof} starts with no optional question`);
      const fpicks = [];
      for(let i = 0; i < 600 && filt.qpool.length && fpicks.length < 60; i++){
        const id = await page.evaluate(ANSWER, Math.random() < 0.5);
        if(!id){ await page.evaluate(AGAIN); continue; }
        fpicks.push(id);
      }
      if(filt.qpool.length) none(fpicks, `none of ${fpicks.length} filtered adaptive picks is an optional question`);
      const passes = await page.evaluate(() => {
        const out = {};
        out.filtered = (startSweep('filtered'), Q && Q.sweep) || [];
        FILTER.prof = FILTER.tier = FILTER.tag = 'all';
        out.all = (startSweep('all'), Q.sweep.slice());
        out.weighted = [];
        if(document.getElementById('sweepWeighted') || true){ try { startSweep('weighted'); out.weighted = Q.sweep.slice(); } catch(e){ out.wErr = e.message; } }
        out.papers = [];
        for(let i = 0; i < 20; i++){ try { out.papers.push(...drawPaper().map(q => q.id)); } catch(e){ out.pErr = e.message; break; } }
        out.required = QUESTIONS.length;
        return out;
      });
      none(passes.filtered, 'the filtered pass holds no optional question');
      none(passes.all, 'the pass of every question holds no optional question');
      check(passes.all.length === info.n - info.ids.length, `the pass of every question holds every other question (${passes.all.length} of ${info.n - info.ids.length})`);
      none(passes.weighted, `the exam-weighted pass (${passes.weighted.length}) holds no optional question`);
      if(passes.papers.length) none(passes.papers, `20 drawn exam papers (${passes.papers.length} items) hold no optional question`);
      else L.skip('exam papers', passes.pErr || 'the paper draws no items on this course');

      // question cards: no exam label on an optional question
      const lbl = await page.evaluate(ids => {
        const labels = id => { quizOnId(id); return [...document.querySelectorAll('#v-quiz .lbl')].map(e => e.textContent.trim()); };
        function quizOnId(id){
          Q = {pool: [byId(id)], label: 'check', sweep: [id], i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
          nextQuestion(); show('quiz');
        }
        const opt = byId(ids[0]);
        const other = QUESTIONS.find(q => !ids.includes(q.id) && lecOf(q));
        return {opt: labels(opt.id), optLec: !!lecOf(opt), other: other ? labels(other.id) : null};
      }, info.ids);
      check(!lbl.opt.some(t => /^Exam\b/.test(t)), 'an optional question card carries no "Exam N" label', lbl.opt);
      check(lbl.opt.includes('Optional'), 'an optional question card says "Optional"', lbl.opt);
      if(lbl.other) check(lbl.other.some(t => /^Exam\b/.test(t)) && !lbl.other.includes('Optional'), 'a card of another topic keeps its exam label', lbl.other);
      else L.skip('another card keeps its exam label', 'no question names a lecture deck');

      // Weak spots, after every question in the bank is answered wrong once
      await page.evaluate(() => {
        Q = {pool: QUESTIONS.slice(), label: 'check', sweep: QUESTIONS.map(q => q.id), i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
        nextQuestion(); show('quiz');
      });
      for(let i = 0; i < info.n + 2; i++) if(!(await page.evaluate(ANSWER, false))) break;
      const gaps = await page.evaluate(ids => {
        const opt = new Set(ids);
        show('gaps');
        const el = document.getElementById('v-gaps'), t = el.innerText;
        const req = QUESTIONS.filter(q => !opt.has(q.id));
        const cs = list => new Set(list.map(q => q.concept)).size;
        const out = {text: t.slice(0, 400)};
        const m = /of (\d+) concepts mastered/.exec(t); out.mastered = m ? +m[1] : null; out.wantMastered = cs(req);
        const all = document.getElementById('missall');
        out.drillAll = all ? +((/Drill all (\d+)/.exec(all.textContent) || [])[1]) : null;
        out.wantDrill = req.filter(q => DB.answers.some(a => a.qid === q.id)).length;
        if(all){ all.click(); out.missall = Q.pool.map(q => q.id); show('gaps'); }
        out.areas = [];
        const n = document.querySelectorAll('#v-gaps [data-area]').length;
        for(let i = 0; i < n; i++){ document.querySelectorAll('#v-gaps [data-area]')[i].click(); out.areas.push(...Q.pool.map(q => q.id)); show('gaps'); }
        // the What to review next panels only (the list of every miss below them is a record)
        const plan = [...el.querySelectorAll('.panel.plan')].map(p => p.innerText).join(' ');
        out.planPanels = el.querySelectorAll('.panel.plan').length;
        out.stems = ids.map(byId).filter(q => plan.includes(q.stem.slice(0, 60))).map(q => q.id);
        // the pool cards: concept counts and their buttons
        const filt = f => q => Object.entries(f).every(([k, v]) => { const x = (k === 'exam' || k === 'module') ? (lecOf(q) || {})[k] : k === 'lecture' ? (lecOf(q) || {}).id : q[k];
          return Array.isArray(v) ? v.includes(x) : x === v; });
        out.cards = [...el.querySelectorAll('.nextcard')].map((c, i) => {
          const p = EXAM.pools[i];
          return {shown: +((/(\d+) concepts/.exec(c.querySelector('.nexthead').textContent) || [])[1]),
                  want: p && p.filter ? cs(req.filter(filt(p.filter))) : null};
        });
        out.next = [];
        const nb = document.querySelectorAll('#v-gaps [data-next]').length;
        for(let i = 0; i < nb; i++){ document.querySelectorAll('#v-gaps [data-next]')[i].click(); out.next.push(...Q.pool.map(q => q.id)); show('gaps'); }
        return out;
      }, info.ids);
      check(gaps.mastered === gaps.wantMastered, `the mastered count is over the ${gaps.wantMastered} concepts outside the optional topic`, `shows ${gaps.mastered}`);
      check(gaps.drillAll === gaps.wantDrill, `What to review next counts the ${gaps.wantDrill} not-solid questions outside the optional topic`, `shows ${gaps.drillAll}`);
      none(gaps.missall, '"Drill all not-solid" holds no optional question');
      none(gaps.areas, `What to review next's section drills (${gaps.areas.length} items) hold no optional question`);
      check(gaps.planPanels > 0, `What to review next shows ${gaps.planPanels} section(s)`);
      none(gaps.stems, 'What to review next shows no optional question');
      check(gaps.cards.length > 0 && gaps.cards.every(c => c.shown === c.want), 'each pool card counts only the concepts outside the optional topic', gaps.cards);
      none(gaps.next, `the pool cards' buttons (${gaps.next.length} items) start no optional question`);

      // opening the topic reaches it
      const open = await page.evaluate(({id, subs}) => {
        show('topics');
        const out = {};
        const all = [...document.querySelectorAll(`#v-topics .subrow button[data-t="${id}"][data-s=""]`)][0];
        if(all){ all.click(); out.pool = Q.pool.map(q => q.id); out.first = Q.current && Q.current.id; }
        out.subs = subs.map(s => {
          show('topics');
          const b = document.querySelector(`#v-topics .subrow button[data-t="${id}"][data-s="${s.id}"]`);
          if(!b) return {id: s.id, n: -1};
          b.click();
          return {id: s.id, n: Q.pool.length, want: s.n, first: Q.current && Q.current.id};
        });
        return out;
      }, {id: info.id, subs: info.subs});
      check(open.pool && open.pool.length === info.ids.length && open.pool.every(id => OPT.has(id)),
            `the topic's own Start holds all ${info.ids.length} of its questions`, open.pool && open.pool.length);
      check(!!open.first && OPT.has(open.first), 'the adaptive runner on the topic serves one of its questions', open.first);
      check(open.subs.length > 0 && open.subs.every(s => s.n === s.want && OPT.has(s.first)), "each subtopic's Start holds its questions", open.subs);
      const tp = [];
      for(let i = 0; i < 10; i++){ const id = await page.evaluate(ANSWER, true); if(!id) break; tp.push(id); }
      check(tp.length > 0 && tp.every(id => OPT.has(id)), `the topic's drill keeps to its questions (${tp.length} answered)`, tp);
      check(!errors.length, 'no page error on the scratch page', errors.join(' | '));
      await ctx.close();
    } finally { b.rm(); }
  } finally { await browser.close(); }
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: ${e.stack || e}`); process.exit(1); });
