/* The study flow around a session: what a repeat keeps, what each number on
 * Weak spots and on an exam result counts, and what an empty screen offers.
 *
 *   1  Repeating a set: "again, reshuffled" after a drill of a list (a weak-spot
 *      section, the session's misses, the not-solid questions, a filtered pass)
 *      asks the same question ids again, in a new order; a filter changed in
 *      between does not widen it; the whole bank is its own button, which says so;
 *      a straight pass of everything and the adaptive runner are unchanged.
 *   2  A partial exam: the paper's score counts every item on the paper, and the
 *      result also names the answered count, the unanswered count, the accuracy
 *      on the answered items and "partial submission".
 *   3  Weak spots' numbers: answer accuracy (matched the key, a guess included),
 *      confidence (knew it, not sure, guessed), solid, and mastery are each named
 *      for what they count; no confidence-adjusted figure is called "correct".
 *   4  The session's retry button says "missed, guessed or unsure" and counts
 *      questions, not answers.
 *   5  Empty screens: the Quiz tab with no set, Weak spots with nothing answered,
 *      with nothing weak, and with weak spots, each with a next step; a review card
 *      with no reading section points to the question's own explanation.
 *   6  A filter with no questions: the chip says so, Start is not offered, and
 *      "Clear filters" brings the bank back; every professor stays listed.
 *
 * Also kept (what already worked): the first handoff from a weak-spot card, a
 * confident retry that ends a concept's open review without deleting the answer
 * history, a topic opening and its subtopic Start.
 *
 *     node flow_test.js
 */
const L = require('./check_lib');
const NAME = 'flow_test.js';
const {check} = L;
L.PAGE.need(NAME);

const text = (page, sel) => page.$eval(sel, el => el.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
// the core's own Start buttons on Topics (a feature module may add Starts of its own,
// such as chained-problem-sets' fixed sets, which the filters do not apply to)
const CORE_STARTS = '#v-topics button[data-t], #v-topics #sweepWeighted, #v-topics #sweepAll, #v-topics #sweepFiltered';
const go = (page, v) => page.click(`#nav button[data-v="${v}"]`);
const qState = page => page.evaluate(() => Q ? {
  pool: Q.pool.map(q => q.id).sort(), sweep: Q.sweep ? Q.sweep.slice() : null,
  label: Q.label, current: Q.current ? Q.current.id : null} : null);
// answer the question on screen: right ('knew', 'shaky', 'guess') or wrong ('wrong')
async function answerAs(page, how){
  const ok = await page.evaluate(how => {
    const q = Q && Q.current; if(!q || q.type) return false;
    const want = how !== 'wrong';
    if(isMulti(q)){
      const set = q.options.map((o, i) => i).filter(i => !!q.options[i].correct === want);
      Q.picked = want ? set : [set[0] !== undefined ? set[0] : 0];
      submitMulti();
    }else{
      const i = q.options.findIndex(o => !!o.correct === want);
      answer(i);
    }
    if(how === 'shaky'){ const b = document.getElementById('btnShaky'); if(b) b.click(); }
    if(how === 'guess'){ const b = document.getElementById('btnGuess'); if(b) b.click(); }
    return true;
  }, how);
  return ok;
}
const next = page => page.evaluate(() => { const b = document.getElementById('btnNext'); if(b) b.click(); });
const mcIds = page => page.evaluate(() => QUESTIONS.filter(q => !q.type && !isMulti(q)).map(q => q.id));
const fresh = async browser => {
  const o = await L.openFile(browser);
  return o;
};

(async () => {
  const {browser} = await L.launch(NAME);
  const ALL = await (async () => { const {ctx, page} = await fresh(browser);
    // the whole bank outside any optional topic (optional_test.js), which is every question
    // in a course that marks none
    const n = await page.evaluate(() => { const opt = new Set(TOPICS.filter(t => t.optional).map(t => t.id));
      return QUESTIONS.filter(q => !opt.has(q.topic)).length; }); await ctx.close(); return n; })();

  console.log('\n=== 1. Repeating a targeted set keeps its question ids ===');
  {
    const {ctx, page, errors} = await fresh(browser);
    const mc = await mcIds(page);
    const id = mc[0];
    // one miss, through the quiz
    await L.quizOn(page, [id]);
    await answerAs(page, 'wrong'); await next(page);
    await go(page, 'gaps');
    const area = await page.$('#v-gaps [data-area="0"]');
    check(!!area, 'Weak spots offers "Drill these" for the missed question');
    if(area) await area.click();
    let s = await qState(page);
    check(s && JSON.stringify(s.pool) === JSON.stringify([id]) && s.current === id,
      'the weak-spot card hands over exactly that one question (kept)', s);
    await answerAs(page, 'knew'); await next(page);
    const endText = await text(page, '#v-quiz');
    check(/1 question/.test(endText) && !/whole bank/i.test(endText.split('Whole bank')[0]),
      'the end of the set counts its own question and does not claim the whole bank', endText.slice(0, 200));
    const again = await page.$('#goAgain');
    check(again && /reshuffled/i.test(await again.textContent()) && /\(1\)/.test(await again.textContent()),
      'the repeat button names the set\'s own size', again ? await again.textContent() : 'no #goAgain');
    if(again) await again.click();
    s = await qState(page);
    check(s && JSON.stringify(s.pool) === JSON.stringify([id]) && s.sweep && s.sweep.length === 1 && s.sweep[0] === id,
      '"again, reshuffled" asks the same 1 question, not the bank', s && {pool: s.pool.length, sweep: s.sweep && s.sweep.length});
    // a tab switch in between keeps the set
    await go(page, 'gaps'); await go(page, 'quiz');
    s = await qState(page);
    check(s && s.pool.length === 1 && s.current === id, 'leaving the Quiz tab and coming back keeps the set', s);
    await answerAs(page, 'knew'); await next(page);
    const again2 = await page.$('#goAgain'); if(again2) await again2.click();
    s = await qState(page);
    check(s && s.pool.length === 1 && s.sweep && s.sweep.length === 1, 'a second repeat still asks the 1 question', s);
    // the whole bank is a separate, labelled action
    await page.evaluate(() => { Q.i = Q.sweep.length; nextQuestion(); });
    const whole = await page.$('#goWhole');
    const wt = whole ? (await whole.textContent()).replace(/\s+/g, ' ').trim() : '';
    check(whole && /whole bank/i.test(wt) && wt.includes(`(${ALL})`), 'the whole bank is its own button, named with its size', wt || 'no #goWhole');
    if(whole) await whole.click();
    s = await qState(page);
    check(s && s.pool.length === ALL && s.sweep && s.sweep.length === ALL, 'that button starts a pass of the whole bank', s && s.pool.length);
    check(!errors.length, 'no page errors', errors);
    await ctx.close();
  }
  {
    const {ctx, page} = await fresh(browser);
    // the session's misses, and the not-solid list
    const mc = await mcIds(page);
    await L.quizOn(page, mc.slice(0, 2));
    await answerAs(page, 'wrong'); await next(page);
    await answerAs(page, 'shaky'); await next(page);
    await go(page, 'gaps');
    for(const [sel, label] of [['#retrysess', 'the session\'s retry'], ['#missall', '"Drill all not-solid"']]){
      if(sel === '#retrysess'){ await go(page, 'gaps'); const b = await page.$(sel); if(b){ await b.click();
        const l = (await qState(page)).label;
        check(l === 'Missed, guessed or unsure this session', 'the session\'s retry set is named as its button is', l); } }
      await go(page, 'gaps');
      const b = await page.$(sel);
      if(!b){ check(false, `${label}: its button is there`); continue; }
      await b.click();
      const want = (await qState(page)).pool;
      await page.evaluate(() => { Q.i = Q.sweep.length; nextQuestion(); });
      const a = await page.$('#goAgain'); if(a) await a.click();
      const got = await qState(page);
      check(got && JSON.stringify(got.pool) === JSON.stringify(want) && got.sweep.length === want.length,
        `${label} repeated keeps its ${want.length} questions`, got && got.pool.length);
    }
    // a filtered pass, with the filter changed before the repeat
    const tag = await page.evaluate(() => {
      const t = ALL_TAGS.find(t => { FILTER.tag = t; const n = poolFor(null, null).length; return n > 0 && n < QUESTIONS.length; });
      FILTER.tag = 'all'; return t || null;
    });
    if(tag){
      const want = await page.evaluate(t => { FILTER.tag = t; startSweep('filtered'); return Q.pool.map(q => q.id).sort(); }, tag);
      await page.evaluate(() => { FILTER.tag = 'all'; Q.i = Q.sweep.length; nextQuestion(); });
      const a = await page.$('#goAgain'); if(a) await a.click();
      const got = await qState(page);
      check(got && JSON.stringify(got.pool) === JSON.stringify(want),
        `a filtered pass repeated after the filter was cleared keeps its ${want.length} questions`, got && got.pool.length);
      check(got && got.label === `The same ${want.length} questions again`, 'and is named by its size, not by the filters now set', got && got.label);
    }else L.skip('a filtered pass repeated', 'no question type selects part of this bank');
    // broad modes unchanged
    const all = await page.evaluate(() => { startSweep('all'); Q.i = Q.sweep.length; nextQuestion();
      document.getElementById('goAgain').click(); return {n: Q.pool.length, sweep: Q.sweep.length}; });
    check(all.n === ALL && all.sweep === ALL, 'a pass of every question repeats as every question (unchanged)', all);
    const ad = await page.evaluate(() => { startQuiz(null, null); return {sweep: !!Q.sweep, n: Q.pool.length}; });
    check(!ad.sweep && ad.n === ALL, 'the adaptive runner over everything is unchanged (no fixed queue)', ad);
    await ctx.close();
  }

  console.log('\n=== 1b. "I was sure of that" inside a set the student chose stays inside it ===');
  {
    const {ctx, page, errors} = await fresh(browser);
    // a sibling on the same concept as a question of the first topic, placed in another
    // topic, subtopic and professor, so every narrowed session leaves it out
    const ids = await page.evaluate(() => {
      const t = TOPICS.find(t => t.subs.length && QUESTIONS.some(q => q.topic === t.id && !q.type && !isMulti(q) && armOf(q.concept) === 'concept'));
      if(!t) return null;
      const q = QUESTIONS.find(q => q.topic === t.id && !q.type && !isMulti(q) && armOf(q.concept) === 'concept');
      const t2 = TOPICS.find(x => x.id !== t.id);
      if(!t2) return null;
      const sib = Object.assign({}, q, {id: q.id + '-outside', topic: t2.id, sub: t2.subs[0].id, prof: 'Outside Prof', types: []});
      QUESTIONS.push(sib); BY_CONCEPT[q.concept].push(sib);
      const other = QUESTIONS.find(x => x.topic === t.id && x.concept !== q.concept && !x.type && !isMulti(x));
      return {q: q.id, sib: sib.id, other: other ? other.id : null, topic: t.id, sub: q.sub, prof: q.prof};
    });
    if(!ids) L.skip('the retry inside a chosen set', 'no topic with a single-answer question on the concept model');
    else{
      // put q on screen in the session just opened, miss it, tap "I was sure of that", go on
      const sureThenNext = () => page.evaluate(id => {
        const q = byId(id);
        if(!Q.pool.some(x => x.id === id)) return {inPool: false};
        if(Q.sweep){ Q.sweep = [id, ...Q.sweep.filter(x => x !== id)]; Q.i = 0; nextQuestion(); }
        else { Q.current = q; Q.picked = null; Q.revealed = false; Q.order = q.options.map((o, i) => i); renderQuiz(); }
        answer(q.options.findIndex(o => !o.correct));
        document.getElementById('btnSure').click();
        const note = (document.getElementById('sureNote') || {}).textContent || '';
        document.getElementById('btnNext').click();
        return {inPool: true, targeted: (typeof targetedSet === 'function' ? targetedSet() : null), note, next: Q.current ? Q.current.id : null,
                nextInPool: !Q.current || Q.pool.some(x => x.id === Q.current.id)};
      }, ids.q);
      const entries = [
        ['a subtopic button', async () => { await go(page, 'topics');
          await page.evaluate(() => { const d = document.querySelectorAll('#v-topics details.topic'); d.forEach(x => x.open = true); });
          await page.click(`#v-topics button[data-t="${ids.topic}"][data-s="${ids.sub}"]`); }],
        ['a topic drill', async () => { await go(page, 'topics');
          await page.evaluate(() => { document.querySelectorAll('#v-topics details.topic').forEach(x => x.open = true); });
          await page.click(`#v-topics button[data-t="${ids.topic}"][data-s=""]`); }],
        ['a filtered "Everything, adaptive"', async () => { await go(page, 'topics');
          await page.evaluate(p => { FILTER.prof = p; renderTopics(); }, ids.prof);
          await page.click('#v-topics button[data-t=""][data-s=""]'); }],
        ['a filtered pass (startSweep)', async () => { await page.evaluate(p => { FILTER.prof = p; startSweep('filtered'); }, ids.prof); }],
        ['its repeat (repeatSet)', async () => { await page.evaluate(p => { FILTER.prof = p; startSweep('filtered'); FILTER.prof = 'all';
          Q.i = Q.sweep.length; nextQuestion(); document.getElementById('goAgain').click(); }, ids.prof); }],
        ['a weak-spot drill (drillList)', async () => { await page.evaluate(ids => drillList([byId(ids.q)].concat(ids.other ? [byId(ids.other)] : []), 'check'), ids); }],
      ];
      for(const [name, open] of entries){
        await page.evaluate(() => { FILTER.prof = FILTER.tier = FILTER.tag = 'all'; });
        await open();
        const r = await sureThenNext();
        await page.evaluate(() => { FILTER.prof = FILTER.tier = FILTER.tag = 'all'; });
        if(!r.inPool){ check(false, `${name}: the session holds the question`, r); continue; }
        check(r.targeted, `${name} counts as a chosen set`, r);
        check(r.next !== ids.sib && r.nextInPool, `${name}: "I was sure of that" brings in no question from outside the session`, r);
        check(!/different question/i.test(r.note), `${name}: the note promises no different question`, r.note);
      }
      // with the sibling inside the set, it still comes straight after (rule 8 kept)
      await L.quizOn(page, [ids.q, ids.sib].concat(ids.other ? [ids.other] : []));
      const inSet = await sureThenNext();
      check(inSet.next === ids.sib, 'a sibling inside the set still comes straight after', inSet);
      // broad sessions: unchanged
      const broad = await page.evaluate(() => {
        const out = {};
        startQuiz(null, null); out.everything = (typeof targetedSet === 'function' ? targetedSet() : null);
        startSweep('all'); out.all = (typeof targetedSet === 'function' ? targetedSet() : null);
        startSweep('weighted'); out.weighted = (typeof targetedSet === 'function' ? targetedSet() : null);
        return out;
      });
      check(!broad.everything && !broad.all && !broad.weighted,
        '"Everything, adaptive" with no filter, the pass of everything and the exam-weighted pass stay broad', broad);
      await page.evaluate(() => startQuiz(null, null));
      const ev = await sureThenNext();
      check(ev.next === ids.sib, 'the unfiltered adaptive runner still takes the retry from the rest of the bank', ev);
    }
    check(!errors.length, 'no page errors', errors);
    await ctx.close();
  }

  console.log('\n=== 2. A partial exam names its denominators ===');
  {
    const {ctx, page} = await fresh(browser);
    await go(page, 'exam');
    if(!(await page.$('#startExam'))){
      L.skip('a partial exam', 'this course\'s active exam has no question count, so no paper is drawn');
      await ctx.close();
    }else{
    await page.click('#startExam');
    const n = await page.evaluate(() => EX.qs.length);
    await page.evaluate(() => {
      const pick = (q, right) => isMulti(q)
        ? (right ? q.options.map((o, i) => i).filter(i => q.options[i].correct) : [q.options.findIndex(o => !o.correct)])
        : q.options.findIndex(o => !!o.correct === right);
      EX.picks[0] = pick(EX.qs[0], true); EX.picks[1] = pick(EX.qs[1], false);
      finishExam(true);
    });
    const t = await text(page, '#v-exam');
    const pct = Math.round(100 / n);
    check(t.includes(`1 / ${n} (${pct}%)`), `the paper's score stays 1 of all ${n} items (scoring unchanged)`, t.slice(0, 120));
    check(/partial submission/i.test(t), 'the result is labelled a partial submission', t.slice(0, 300));
    check(/2 answered/.test(t) && new RegExp(`${n - 2} unanswered`).test(t),
      `it names 2 answered and ${n - 2} unanswered`, t.slice(0, 300));
    check(/50% on the 2 answered/.test(t), 'it gives the accuracy on the answered items: 50%', t.slice(0, 300));
    await go(page, 'gaps');
    const g = await text(page, '#v-gaps');
    check(/50%/.test(g), 'Weak spots shows 50% for the same two answers', g.slice(0, 200));
    await ctx.close();
    }
  }

  console.log('\n=== 3 and 4. Weak spots names what each number counts ===');
  {
    const {ctx, page, errors} = await fresh(browser);
    const mc = await mcIds(page);
    const ids = [mc[0], mc[1 % mc.length], mc[2 % mc.length], mc[0], mc[1 % mc.length]];
    await L.quizOn(page, ids);
    for(const how of ['knew', 'shaky', 'guess', 'wrong', 'wrong']){ await answerAs(page, how); await next(page); }
    await go(page, 'gaps');
    const g = await text(page, '#v-gaps');
    const acc = await text(page, '#v-gaps [data-stat="accuracy"]');
    check(/60%/.test(acc) && /right · 3 of 5 \(guesses included\)/.test(acc),
      'answer accuracy: 60%, "right · 3 of 5 (guesses included)"', acc || g.slice(0, 200));
    const conf = await text(page, '#v-gaps [data-stat="confidence"]');
    check(/1 knew it/.test(conf) && /1 not sure/.test(conf) && /1 guessed/.test(conf),
      'confidence on the 3 that matched: 1 knew it, 1 not sure, 1 guessed', conf || 'no confidence line');
    check(!/\d+%\s*correct/i.test(g), 'no percentage on Weak spots is labelled "correct"', (g.match(/\d+%\s*correct/i) || [''])[0]);
    const ses = await text(page, '#v-gaps [data-stat="session"]');
    check(/20%/.test(ses) && /solid · 1 of 5 in/.test(ses) && (ses.match(/solid/g) || []).length === 1,
      'the session figure is 20%, "solid · 1 of 5", "solid" once', ses);
    check(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)),
      'Weak spots does not widen a 390 px page (its tables scroll in their own box)',
      await page.evaluate(() => document.documentElement.scrollWidth));
    check(/solid means/i.test(g) && /review schedule/i.test(g),
      'one line says what "solid" and "mastered" each count', g.slice(0, 400));
    const r = await page.$('#retrysess');
    const rt = r ? (await r.textContent()).replace(/\s+/g, ' ').trim() : '';
    const uniq = await page.evaluate(() => new Set(sessionLog().filter(e => !solidEntry(e)).map(e => e.qid)).size);
    check(rt === `Retry missed, guessed or unsure (${uniq})`, `the retry button counts ${uniq} questions, not 4 answers`, rt);
    const strip = await page.evaluate(() => sessStrip());
    check(/This session: 1\/5 solid/.test(strip), 'the quiz strip says "solid", not a bare score', strip.slice(0, 80));
    check(!errors.length, 'no page errors', errors);
    await ctx.close();
  }

  console.log('\n=== 5. Empty screens offer a next step ===');
  {
    const {ctx, page} = await fresh(browser);
    await page.evaluate(() => { Q = null; show('quiz'); });
    const b = await page.$('#v-quiz #emptyTopics');
    check(!!b, 'the Quiz tab with no set offers a button to the topics');
    if(b){ await b.click(); check(await page.evaluate(() => VIEW === 'topics'), 'it opens the topic list'); }
    await go(page, 'gaps');
    let g = await text(page, '#v-gaps');
    check(/nothing answered yet/i.test(g) && !!(await page.$('#v-gaps [data-go="topics"]')),
      'Weak spots with no answers: "nothing answered yet", with a way to the topics', g.slice(0, 160));
    const mc = await mcIds(page);
    await L.quizOn(page, [mc[0]]); await answerAs(page, 'knew'); await next(page);
    await go(page, 'gaps');
    g = await text(page, '#v-gaps');
    check(/no weak concepts right now/i.test(g) && !!(await page.$('#v-gaps [data-go="topics"]')),
      'Weak spots with nothing weak: "no weak concepts right now", with a next step', g.slice(0, 300));
    // a miss on a question with no reading section
    const noLink = await page.evaluate(() => {
      const q = QUESTIONS.find(q => !q.type && !isMulti(q) && !linksFor(q).length);
      if(q) return q.id;
      const p = QUESTIONS.find(q => !q.type && !isMulti(q)); p.read = []; READ_LINKS.byKey = []; READ_LINKS.bySub = {}; READ_LINKS.byLecture = {};
      return p.id;
    });
    await L.quizOn(page, [noLink]); await answerAs(page, 'wrong'); await next(page);
    await go(page, 'gaps');
    g = await text(page, '#v-gaps');
    check(/weak concepts to review/i.test(g), 'Weak spots with a miss: "weak concepts to review"', g.slice(0, 300));
    check(!/Read the section/.test(g) && /explanation/i.test(g),
      'a card with no reading section points to the question\'s own explanation, not a missing section', g.slice(0, 500));
    await ctx.close();
  }

  console.log('\n=== 6. A filter with no questions ===');
  {
    const {ctx, page} = await fresh(browser);
    await page.evaluate(() => { COURSE.professors.push('Nobody Yet'); renderTopics(); });
    const chip = await page.$('#v-topics .chip[data-f="prof"][data-v="Nobody Yet"]');
    check(!!chip, 'every professor stays listed, one with no questions too');
    const ct = chip ? (await chip.textContent()).replace(/\s+/g, ' ').trim() : '';
    check(/no questions/i.test(ct), 'that chip says it has no questions', ct);
    const tagNone = await page.$$eval('#v-topics .chip.none[data-f="tag"]', bs => bs.map(b => b.textContent.replace(/\s+/g, ' ').trim()));
    check(tagNone.every(t => /\(none with the other filters\)/.test(t)), 'a chip with nothing under the other filters says so in its text', tagNone);
    if(chip) await chip.click();
    const starts = await page.$$eval(CORE_STARTS, bs => bs.filter(b => /^(Start|Review)$/.test(b.textContent.trim()) && !b.disabled).length);
    check(starts === 0, 'with no questions selected, no Start is offered', `${starts} Start buttons`);
    const t = await text(page, '#v-topics');
    check(/no questions match/i.test(t), 'the page says why nothing can start', t.slice(0, 400));
    const clr = await page.$('#v-topics #clearFilters');
    check(!!clr, 'a "Clear filters" button is there');
    if(clr) await clr.click();
    const after = await page.evaluate(() => ({prof: FILTER.prof, tier: FILTER.tier, tag: FILTER.tag}));
    const starts2 = await page.$$eval(CORE_STARTS, bs => bs.filter(b => /^(Start|Review)$/.test(b.textContent.trim()) && !b.disabled).length);
    check(after.prof === 'all' && after.tag === 'all' && after.tier === 'all' && starts2 > 0, 'Clear filters brings the bank back', {after, starts2});
    const startedEmpty = await page.evaluate(() => { FILTER.prof = 'Nobody Yet'; const before = Q; startSweep('filtered'); startQuiz(null, null);
      const same = Q === before; FILTER.prof = 'all'; return same; });
    check(startedEmpty, 'an empty set never starts a session');
    await ctx.close();
  }

  console.log('\n=== Kept: a topic opens and its Start begins that subtopic; a confident retry ===');
  {
    const {ctx, page} = await fresh(browser);
    const t = await page.evaluate(() => { const t = TOPICS.find(t => t.subs.some(s => poolFor(t.id, s.id).length)); return t ? {t: t.id, s: t.subs.find(s => poolFor(t.id, s.id).length).id} : null; });
    const det = await page.$(`#v-topics details.topic:has(button[data-t="${t.t}"])`);
    if(det){ await page.evaluate(d => d.open = false, det); await det.$eval('summary', s => s.click()); }
    check(det && await det.evaluate(d => d.open), 'tapping a topic opens it');
    await page.click(`#v-topics button[data-t="${t.t}"][data-s="${t.s}"]`);
    const s = await page.evaluate(() => ({ok: Q.pool.every(q => q.topic === Q.pool[0].topic), sweep: !!Q.sweep, view: VIEW}));
    check(s.ok && !s.sweep && s.view === 'quiz', 'its Start opens the adaptive quiz on that subtopic', s);
    const mc = await mcIds(page);
    await L.quizOn(page, [mc[0]]); await answerAs(page, 'wrong'); await next(page);
    const before = await page.evaluate(id => ({box: DB.concepts[byId(id).concept].box, n: DB.answers.length}), mc[0]);
    await L.quizOn(page, [mc[0]]); await answerAs(page, 'knew'); await next(page);
    const after = await page.evaluate(id => ({box: DB.concepts[byId(id).concept].box, n: DB.answers.length,
      kept: DB.answers.filter(a => a.qid === id).map(a => a.result)}), mc[0]);
    check(before.box === 0 && after.box >= 1, 'a confident right answer after a miss ends the concept\'s open review', {before, after});
    check(after.n === before.n + 1 && after.kept.join() === 'wrong,correct', 'and the miss stays in the answer history', after);
    await ctx.close();
  }

  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: ${e.stack || e}`); process.exit(1); });
