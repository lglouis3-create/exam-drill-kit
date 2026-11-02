/* glossary-tap: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data: every term in TERMS is found by its own name, as
 * that term, by the finder the tap uses (a name with brackets, a slash, a Greek
 * letter or a dash is escaped, and the longest name wins); the number of terms
 * the bank's explanations name is printed.
 * The build step: no TERMS, an empty TERMS, an id used twice, a term with no
 * definition, a figure that is not in DIA, a lecture that is not in
 * COURSE.lectures, two terms found by the same name and a notTapped id that is
 * not a term each stop the step with that reason; a duplicate name stops the
 * whole build with no page written.
 * On a scratch copy with 8 of Intro to Pharmacology's terms (exam1-drill/src/
 * glossary.js), 2 of its questions (q_L02.js L02-018 and L02-023) and 2 of its
 * guide sections (guide.js sections 1 and 4, first lines), at 929cd62 (ids
 * prefixed gtp-, the professor, topic and skill set to the course's own, the
 * figure keys replaced by one of the course's own DIA figures), with the core's
 * GLOSS given a bracketed definition of "affinity" (the term's own gist), in
 * Chromium (Intro to Pharmacology browser_test.js lines 53-56 ported: the
 * glossary shows its terms and figures; the rest written for the kit): the tab
 * in the nav before Settings; every term with its definition and source, under
 * its group; a search lists names that match first, then terms that only
 * mention the word, with the count; Clear; a letter switches to A-Z and jumps
 * to the letter, absent letters disabled; a group chip narrows the list; the
 * floating button once the search bar is off screen. Tap a term: nothing marked
 * before the answer is shown; after it, each term once per question, never in
 * an option's own text or the stem; a tap opens the definition under the line
 * and a second tap closes it; "Open in the Glossary" opens the tab at the term,
 * with the way back; a term the core glossed in brackets in that question is
 * not a button there; in the Guides tab each term once per section, again in
 * the next section, and not in a section whose word list (dt) defines it. With
 * notTapped the term is no longer found; with tap off nothing is marked.
 *
 *     node features/glossary-tap/test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/glossary-tap/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;
const HERE = __dirname;

/* 8 terms, 2 questions and 2 guide sections from Intro to Pharmacology
   (exam1-drill/src/glossary.js, q_L02.js, guide.js, at 929cd62): the terms'
   lecture and fig and the questions' prof, lecture, fg and reading fields left out. */
const FIX = {"terms":[{"id":"pharmacodynamics","term":"Pharmacodynamics (PD)","group":"Drug basics","def":"The study of the biochemical and physiological effects of drugs and their mechanisms of action. General rules: the drug must reach the site of action, must bind to and interact with a receptor, and does not create anything but changes the ongoing physiological system.","hook":"Spoken definition: “the study of how drugs interact with the biological system.” Its two basic concepts are affinity and efficacy.","gist":"How the drug interacts with the biological system: affinity and efficacy only.","scene":"Metoprolol reaches the heart, binds the β1 receptor and blocks it, and the heart rate falls; nothing new is created, an ongoing process is changed.","confuse":["pharmacokinetics","pharmacology"],"quote":"General rules: 1) Drug must reach the site of action 2) Drug must bind to and interact with a receptor 3) Drug do not create anything, but change the ongoing phys. system","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~31; Pharmacodynamics-Day-1-2026s.pdf slide ~22; transcript 9/23","src":"both"},{"id":"drug","term":"Drug","group":"Drug basics","def":"A chemical substance that alters an ongoing physiological or pathological function by interacting with components of a biological system. Drugs initiate, inhibit or modulate a response; they do not create anything new.","hook":"Walter Straub: there is only a quantitative difference between a drug and a poison (vitamin A in carrots vs polar bear liver).","gist":"A chemical that changes an ongoing function; enhances or suppresses, creates nothing new.","scene":"Metoprolol does not create a new heartbeat; it slows the rate the heart was already producing. Vitamin A in a carrot helps night blindness and in a polar bear liver poisons: only the amount differs.","confuse":["ligand","nds"],"quote":"drugs don’t create anything new, they just change whatever is happening in the body. Either they are going to enhance the signal or perhaps suppress the signal","cite":"Pharmacodynamics-Day-1-2026s.pdf slides ~29–~31; transcript 9/22","src":"both"},{"id":"receptor","term":"Receptor","group":"Drug basics","def":"Regulatory proteins involved in the transfer of chemical information carried by endogenous or exogenous mediators. Classified by the structure of the receptor protein and its transduction components: ion channels, 7-transmembrane (GPCR), 1-transmembrane (tyrosine kinases) and intracellular/nuclear receptors.","hook":"His picture: the gatekeeper that senses hormones, neurotransmitters and drugs; the message the receptor creates is the physiological response. Receptors come in two flavors, active or inactive.","gist":"The regulatory protein that senses hormones, neurotransmitters and drugs; it is active or inactive.","scene":"A protein in the heart cell membrane recognizes norepinephrine by its shape and size, changes its conformation, and the cell answers with a faster beat. The same protein also binds metoprolol.","confuse":["ligand","effector","transducer"],"quote":"Receptors are regulatory proteins involved in the transfer of chemical information carried by various endogenous/exogenous mediators","cite":"Pharmacodynamics-Day-1-2026s.pdf slides ~11, ~34–~36; transcript 9/22","src":"both"},{"id":"affinity","term":"Affinity","group":"Drug–receptor binding","def":"The attraction of a ligand for the receptor: how likely a drug is to bind and stay bound. It depends on the molecular forces (bonds) the drug forms with the receptor and is measured by Kd: the smaller the Kd, the greater the affinity.","hook":"Affinity is read on the x-axis (further left = higher affinity); efficacy on the y-axis. Poll trap: “the ability of a drug to bind and stay bound to a receptor” is affinity, not efficacy.","gist":"How likely a drug binds and stays bound; depends on the bonds formed.","scene":"Phenoxybenzamine forms a covalent bond with the α1 receptor and stays bound; prazosin forms weaker bonds and comes off. On a binding curve, the drug furthest left binds 50% of receptors at the smallest dose.","confuse":["efficacy","potency","kd"],"quote":"Remember, affinity is how likely a drug is to bind and stay bound to a receptor, and the binding of a drug to the receptor is going to be depending on what type of bonds they form covalent bonds, hydrogen bonds, ion bonds.","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~31, ~55; Pharmacodynamics-Day-1-2026s.pdf slides ~21, ~37; transcript 9/22; transcript 9/23","src":"both"},{"id":"efficacy","term":"Efficacy (intrinsic efficacy)","group":"Drug–receptor binding","def":"The property of a molecule that causes the receptor to change its behavior: the ability of the drug to change the receptor state, active to inactive or inactive to active. Positive efficacy activates receptors, negative efficacy shuts them down, and zero efficacy is a neutral antagonist.","hook":"Read on the y-axis as the height of the curve (Emax). Efficacy cannot be calculated directly; it is a relative measurement between ligands.","gist":"The ability to change the receptor state; positive activates, negative shuts down.","scene":"Norepinephrine binds β1 and flips it from inactive to active, loratadine binds H1 and flips it from active to inactive, and metoprolol binds β1 without changing its state.","confuse":["affinity","intrinsic-activity","potency"],"quote":"Efficacy is the ability of that drug to change the receptor behavior. It’s activity, its state from active to inactive or inactive to active, right?","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~31; Pharmacodynamics-Day_3_2026s.pdf slides ~19, ~26; Pharmacodynamics-Day-1-2026s.pdf slide ~38; transcript 9/22; transcript 9/23","src":"both"},{"id":"kd","term":"Kd (dissociation constant)","group":"Drug–receptor binding","def":"The drug concentration that binds 50% of the available binding sites (also written Ki, Ka). From the law of mass action it equals K2/K1, the rate of dissociation over the rate of association. The smaller it is, the greater the affinity: inversely proportional.","hook":"Read on the x-axis of a binding curve; it says nothing about effect. Convert units before comparing (milli 10^-3, micro 10^-6, nano 10^-9): “the units ... about 10% of you are gonna miss it.”","gist":"The concentration binding 50% of receptors; smaller means greater affinity, says nothing of effect.","scene":"For the β1 receptor drug A has a value of 30 micromolar and drug B 100 nanomolar; after converting the units the smaller number means drug B binds half of the receptors at a lower concentration (at M1 both are 250 nanomolar: equal affinity). Convert milli, micro and nano before comparing.","confuse":["ec50","affinity","mass-action"],"quote":"So the take-home message is that the smaller the coefficient of dissociation is, the more drugs receptors are going to find together, and thus the greater the affinity is going to be.","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~45–~50; Pharmacodynamics-Day_3_2026s.pdf slide ~31; transcript 9/24","src":"both"},{"id":"orthosteric","term":"Orthosteric site","group":"Drug–receptor binding","def":"The receptor’s own binding pocket, where the endogenous agonist binds. Drugs that bind there (phenylephrine, prazosin, phenoxybenzamine at α1) compete for that one pocket, so only one can be bound at a time: either one or the other, not both.","hook":"Orthosteric: one or the other. Allosteric: one and the other. Spoken as “orthostatic” in the transcripts; the slide term is orthosteric.","gist":"The receptor’s own pocket where the endogenous agonist binds; one or the other.","scene":"Phenylephrine, prazosin and phenoxybenzamine all go for the same pocket on the α1 receptor, the one norepinephrine uses, so only one of them can be in it at a time.","confuse":["allosteric"],"quote":"How we define orthostatic. So they compete for the same binding pocket, right? ... with orthostatic, we can have either one or the other, not both at the same time. As with allosteric, we can have one in the other","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~18–~19; transcript 9/23; transcript 9/24","src":"both"},{"id":"mass-action","term":"Law of mass action","group":"Drug–receptor binding","def":"The rate of a chemical reaction is proportional to the concentration (mass) of the reactants: the more drug or the more receptors present, the greater the chance of binding. It is the basis of Kd and of dose responsiveness.","hook":"More receptors in a tissue make the same dose of norepinephrine appear more potent (curve shifts left) while its Kd, affinity and efficacy are unchanged; what changed is the tissue.","gist":"More drug or more receptors present, greater the chance of binding.","scene":"Two hearts get the same dose of norepinephrine, one with 10 receptors and one with 100; the heart with 100 responds at a lower dose, though norepinephrine itself is unchanged.","confuse":["kd"],"quote":"The more I have either of the receptors or the more I have either the drug, the greater the capacity of binding to something is going to be, right?","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~45; transcript 9/24","src":"both"}],"qs":[{"id":"L02-018","tier":"new","topic":"L02","sub":"site","skill":"apply","concept":"diazepam-gaba-pam","tags":["exam-cue"],"source":"both","stem":"GABA (γ-aminobutyric acid) is bound to its GABA-A receptor, a chloride (Cl−) ion channel, when diazepam is added. What is the result?","options":[{"t":"GABA binds better; more Cl− enters","correct":true,"why":"Diazepam is a positive allosteric modulator: it increases the affinity and/or efficacy of GABA, so more chloride enters."},{"t":"GABA is displaced; less Cl− enters","correct":false,"why":"Diazepam does not compete for the GABA site; it binds someplace else."},{"t":"Cl− leaves the neuron","correct":false,"why":"Opening the GABA channel lets chloride move from outside to inside the cell."},{"t":"Na+ enters; the neuron is more excitable","correct":false,"why":"GABA is the major inhibitory pathway; the channel conducts chloride and shuts things down."}],"teach":"GABA binds its orthosteric sites and opens the GABA-A channel; chloride enters, the membrane becomes more negative, and the person becomes less anxious and more sleepy. Diazepam, an allosteric agonist (positive allosteric modulator, PAM), binds elsewhere and increases GABA's affinity and/or efficacy, so more chloride enters faster or longer.","quote":"Benzos increase the affinity And/or efficacy of GABA For its receptor","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~21–~24; transcript 9/23"},{"id":"L02-023","tier":"new","topic":"L02","sub":"class","skill":"tell","concept":"efficacy-definition","tags":["poll"],"source":"both","stem":"Which best describes efficacy?","options":[{"t":"Ability of a drug to bind and stay bound to a receptor","correct":false,"why":"Binding and staying bound is affinity."},{"t":"Ability of a cell to increase its number of receptors","correct":false,"why":"Receptor number is the cell's business, not a drug property."},{"t":"Ability of a drug to change the receptor behavior","correct":true,"why":"Efficacy is the drug changing the receptor state from inactive to active or active to inactive."},{"t":"Ability of a drug to be absorbed into the body","correct":false,"why":"Absorption is pharmacokinetics, not pharmacodynamics."}],"teach":"Affinity describes the association between drug and receptor (molecular forces, bonds). Efficacy (intrinsic efficacy) describes the mechanism by which the drug changes the receptor. A drug with efficacy changes the receptor state; one with zero efficacy (a neutral antagonist) does not.","quote":"Efficacy is the ability of that drug to change the receptor behavior. It's activity, its state from active to inactive or inactive to active, right?","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~31; transcript 9/23"}],"guide":"<h3 id=\"guide-1\">1. Affinity, efficacy, potency</h3>\n<h4>What it is</h4>\n<ul>\n<li><b>Affinity</b>: how likely a drug is to bind and stay bound; set by the bonds it forms (covalent, ionic, hydrogen, van der Waals). <small>Day 2 ~55; (T) 9/23</small></li>\n<li><b>Efficacy</b>: the ability to change the receptor's state, inactive (R) or active (R*); positive (activates receptors) or negative (shuts them down). <small>Day 1 ~38; (T) 9/22, 9/23</small></li>\n<h3 id=\"guide-4\">4. Orthosteric vs allosteric</h3>\n<h4>What it is</h4>\n<ul>\n<li><b>Orthosteric</b> drugs bind the receptor's own pocket and compete for it: one or the other (phenylephrine, prazosin, phenoxybenzamine). <small>Day 2 ~18; (T) 9/23</small></li>\n<li><b>Allosteric</b> drugs bind a second site and change the pocket, so the agonist's affinity, efficacy, both or neither changes: one and the other. <small>Day 2 ~19–~20, ~39, ~44; (T) 9/23</small></li>"};
const pre = 'gtp-';
const fixTerms = (fig) => FIX.terms.map(t => Object.assign({}, t, {id: pre + t.id, confuse: (t.confuse || []).map(c => pre + c)},
  fig && t.id === 'affinity' ? {fig} : {}));
const fixFile = (hasTerms, fig) => '/* Intro to Pharmacology terms and questions (929cd62), added by the glossary-tap test */\n' +
  (hasTerms ? `TERMS.length = 0; TERMS.push(...${JSON.stringify(fixTerms(fig))});\n` : `const TERMS = ${JSON.stringify(fixTerms(fig))};\n`) +
  FIX.qs.map(q => `QUESTIONS.push(Object.assign(${JSON.stringify(Object.assign({}, q, {id: pre + q.id, concept: pre + q.concept}))},
  {prof: COURSE.professors[0], topic: TOPICS[0].id, sub: TOPICS[0].subs[0].id, skill: COURSE.skills[0].id}));`).join('\n') + '\n';
const affinity = FIX.terms.find(t => t.id === 'affinity');
/* the core's own bracketed gloss of "affinity", in the term's own words; an
   explanation that says "staying bound" defines it itself, so the core leaves it */
const glossLine = `\n;GLOSS.push({k: 'gtp-affinity', p: 'affinity', d: ${JSON.stringify(affinity.gist)}, skip: /staying bound/i});\n`;
/* the two guide sections; section 4 given the template's word list (dt) for efficacy, with the term's own definition */
const efficacy = FIX.terms.find(t => t.id === 'efficacy');
const guideFix = FIX.guide.replace(/id="guide-/g, 'id="gtp-guide-').replace(/(<h4>What it is<\/h4>\n<ul>\n<li><b>Orthosteric)/,
    `<h4>What it is</h4>\n<dl class="gwords"><dt>Efficacy</dt><dd>${efficacy.def}</dd></dl>\n<ul>\n<li><b>Orthosteric`)
  .replace(/(<\/small><\/li>)\n<h3/, '$1\n</ul>\n<h3') + '\n</ul>\n';
const editFor = (glossOn, guideOn) => src => {
  if(glossOn) fs.appendFileSync(path.join(src, 'glossary.js'), glossLine);
  if(guideOn){
    const f = path.join(src, 'guide.js'), s = fs.readFileSync(f, 'utf8'), at = s.lastIndexOf('`;');
    if(at > 0) fs.writeFileSync(f, s.slice(0, at) + '\n<section class="gobj" id="gtp-guide">\n' + guideFix + '</section>\n' + s.slice(at));
  }
};

/* the build step, run in node as build.py runs it */
function step(terms, opt, extra){
  const sb = Object.assign({console, COURSE: {lectures: [{id: 'L01'}]}, DIA: {'fig-a': '<figure></figure>'}, OPT: opt || {}, STEP: null}, extra || {});
  if(terms !== undefined) sb.TERMS = terms;
  vm.createContext(sb);
  try { vm.runInContext(fs.readFileSync(path.join(HERE, 'step.js'), 'utf8'), sb); return {ok: true, step: sb.STEP}; }
  catch(e){ return {ok: false, msg: String(e.message)}; }
}

(async () => {
  console.log('\n=== the course\'s own terms ===');
  L.PAGE.need(NAME);
  const E = L.engine('({TERMS: typeof TERMS === "undefined" ? null : TERMS, QUESTIONS, FX})');
  const api = E.FX && E.FX.api('glossary-tap');
  check(!!api, 'the module loads in the course\'s page and offers its finder', E.FX && E.FX.errors);
  if(api){
    const own = E.TERMS || [];
    if(!own.length) L.skip('the course\'s own terms', 'TERMS is empty');
    else {
      const miss = own.filter(t => { const f = api.find(api.nameOf(t)); return !f.length || f[0][0] !== t.id; });
      check(!miss.length, `all ${own.length} terms are found by their own name, as themselves`, miss.slice(0, 5).map(t => t.id + ': ' + api.nameOf(t)).join('; '));
      const named = new Set();
      E.QUESTIONS.forEach(q => api.find([...(q.options || []).map(o => o.why || ''), JSON.stringify(q.teach || '')].join(' ')).forEach(([id]) => named.add(id)));
      console.log(`  info  ${named.size} of ${own.length} terms are named in the bank's explanations`);
    }
  }

  console.log('\n=== the build step ===');
  const good = fixTerms('fig-a').map(t => Object.assign({}, t, {lecture: 'L01'}));
  const g = step(good);
  check(g.ok && g.step.terms === good.length && g.step.groups === 2, `${good.length} of the course's terms in 2 groups pass`, g);
  const cases = [
    ['no TERMS', undefined, null, /reads TERMS/],
    ['an empty TERMS', [], null, /TERMS is empty/],
    ['an id used twice', good.concat([Object.assign({}, good[1], {term: 'Another name'})]), null, /gtp-drug: the id is used twice/],
    ['a term with no definition', good.map((t, i) => i === 2 ? Object.assign({}, t, {def: ''}) : t), null, /gtp-receptor has no def/],
    ['a figure not in DIA', good.map((t, i) => i === 3 ? Object.assign({}, t, {fig: 'no-such-fig'}) : t), null, /fig "no-such-fig" is not a figure/],
    ['a lecture not in COURSE.lectures', good.map((t, i) => i === 0 ? Object.assign({}, t, {lecture: 'L99'}) : t), null, /lecture "L99" is not an id/],
    ['two terms found by the same name', good.concat([Object.assign({}, good[1], {id: 'gtp-drug-2', term: 'Drug (medicine)'})]), null, /both found by the name "drug"/],
    ['a notTapped id that is not a term', good, {notTapped: ['gtp-nowhere']}, /notTapped names "gtp-nowhere"/],
  ];
  for(const [label, terms, opt, re] of cases){
    const r = step(terms, opt);
    check(!r.ok && re.test(r.msg), `${label} stops the step with its reason`, r.msg || 'it passed');
  }
  const broken = L.scratchBuild('gtap-broken', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS) + 'TERMS.push(Object.assign({}, TERMS[0], {id: "gtp-twice"}));\n'}});
  check(broken.code !== 0 && /both found by the name/.test(broken.out) && !fs.existsSync(broken.page), 'a duplicate name stops the build, with no page written', broken.out.split('\n').pop());
  broken.rm();

  console.log('\n=== worked in the browser (scratch copy) ===');
  const figKey = await (async () => { const X = L.engine('(typeof DIA === "undefined" ? {} : DIA)'); return Object.keys(X).filter(k => k !== 'storage')[0] || null; })();
  const s = L.scratchBuild('gtap', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS, figKey)}, edit: editFor(true, true)});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test terms does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page);
    const nav = await page.evaluate(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));
    check(nav.includes('glossary') && nav.indexOf('glossary') === nav.indexOf('settings') - 1, 'the Glossary tab is in the nav, before Settings', nav);
    if(!nav.includes('glossary')){ await browser.close(); s.rm(); L.finish(NAME); }   // nothing else can be checked
    await page.click('#nav button[data-v="glossary"]');
    const tab = await page.evaluate(() => ({n: document.querySelectorAll('#v-glossary .gterm').length,
      heads: [...document.querySelectorAll('#gtlist h3')].map(h => h.textContent),
      cards: [...document.querySelectorAll('#v-glossary .gterm')].map(d => ({id: d.id, cite: !!d.querySelector('.cite') && d.querySelector('.cite').textContent, text: d.textContent})),
      figs: document.querySelectorAll('#v-glossary .gterm .gtfig figure, #v-glossary .gterm .gtfig svg').length,
      count: document.getElementById('gtcount').textContent}));
    const groups = [...new Set(FIX.terms.map(t => t.group))];
    check(tab.n === FIX.terms.length, `the glossary shows the ${FIX.terms.length} terms (IP browser_test.js line 55)`, tab.n);
    check(JSON.stringify(tab.heads) === JSON.stringify(groups), 'under their groups, in the course\'s order', tab.heads);
    const badCard = FIX.terms.filter(t => { const c = tab.cards.find(x => x.id === 'gt-' + pre + t.id);
      // the source as Intro to Pharmacology prints it (app.js fmtCite: an approximate range ~21–~22 reads ~21–22)
      return !(c && c.text.includes(t.def) && c.cite === t.cite.replace(/–~/g, '–') && (!t.gist || c.text.includes(t.gist)) && (!t.scene || c.text.includes('In action: ' + t.scene))); });
    check(!badCard.length, 'each card has the term\'s definition, one-line meaning, situation and source', badCard.map(t => t.id));
    if(figKey) check(tab.figs >= 1, 'a term with a figure shows it (IP browser_test.js line 56)', tab.figs);
    else L.skip('a term\'s figure', 'the course has no DIA figure to point a term at');
    check(tab.count === `${FIX.terms.length} terms`, 'the count line', tab.count);

    await page.fill('#gtsearch', 'receptor');
    const sr = await page.evaluate(() => ({heads: [...document.querySelectorAll('#gtlist h3')].map(h => h.textContent),
      first: [...document.querySelectorAll('#gtlist .panel')][0] ? [...document.querySelectorAll('#gtlist .panel')][0].querySelectorAll('.gterm').length : 0,
      ids: [...document.querySelectorAll('#gtlist .gterm')].map(d => d.id), count: document.getElementById('gtcount').textContent,
      clear: !document.getElementById('gtclear').hidden}));
    const want = FIX.terms.filter(t => [t.term, t.gist, t.def, t.scene].join(' ').toLowerCase().includes('receptor'));
    const wantNamed = want.filter(t => t.term.toLowerCase().includes('receptor'));
    check(sr.heads[0] === 'Term names with “receptor”' && sr.first === wantNamed.length && sr.heads[1] === 'Also mentioned in',
      `a search lists the ${wantNamed.length} names that match first, then the terms that mention the word`, sr);
    check(sr.ids.length === want.length && sr.count === `${want.length} matches` && sr.clear, `${want.length} matches, counted, with Clear shown`, sr.count);
    await page.fill('#gtsearch', 'zzqx');
    check(await page.evaluate(() => /No term matches/.test(document.getElementById('gtlist').textContent)), 'a search with no match says so');
    await page.click('#gtclear');
    check(await page.evaluate(n => document.querySelectorAll('#gtlist .gterm').length === n && document.getElementById('gtsearch').value === '', FIX.terms.length),
      'Clear empties the box and shows every term again');

    const letters = await page.evaluate(() => [...document.querySelectorAll('[data-gtlt]')].map(b => [b.dataset.gtlt, b.disabled]));
    const have = new Set(FIX.terms.map(t => t.term[0].toUpperCase()));
    check(letters.every(([L, d]) => d === !have.has(L)), 'the letters with no term are disabled', letters.filter(([L, d]) => d === have.has(L)));
    await page.click('[data-gtlt="O"]');
    const az = await page.evaluate(() => ({order: document.querySelector('[data-gtorder="az"]').getAttribute('aria-pressed'),
      heads: [...document.querySelectorAll('#gtlist h3')].map(h => h.textContent), at: !!document.getElementById('gtl-O')}));
    check(az.order === 'true' && az.at && JSON.stringify(az.heads) === JSON.stringify([...have].sort()), 'a letter switches to A-Z order, by first letter, and jumps to it', az);
    await page.click('[data-gtorder="group"]');
    await page.click(`[data-gtgroup="${groups[1]}"]`);
    const gr = await page.evaluate(() => [...document.querySelectorAll('#gtlist .gterm')].map(d => d.id));
    const inG = FIX.terms.filter(t => t.group === groups[1]).map(t => 'gt-' + pre + t.id);
    check(JSON.stringify(gr) === JSON.stringify(inG), `a group chip shows that group only (${inG.length} terms)`, gr);
    await page.click('[data-gtgroup="all"]');
    await page.setViewportSize({width: 390, height: 500});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const fb = await page.evaluate(() => !!document.getElementById('gtback'));
    if(await page.evaluate(() => document.body.scrollHeight > window.innerHeight + 200)){
      check(fb, 'the floating button appears once the search bar is off screen');
      await page.click('#gtback'); await page.waitForTimeout(600);
      check(await page.evaluate(() => !document.getElementById('gtback')), 'and goes once it is used');
    } else L.skip('the floating button', 'the glossary is too short to scroll at this size');
    await page.setViewportSize({width: 390, height: 844});

    // tap a term, on L02-023 (no core gloss: its explanation defines affinity itself)
    await L.quizOn(page, pre + 'L02-023');
    check(await page.evaluate(() => document.querySelectorAll('#v-quiz .gtap').length === 0), 'before the answer is shown, no term is marked');
    await page.evaluate(() => document.querySelector('#v-quiz .opt[data-o="0"], #v-quiz button[data-o="0"]').click());
    await page.waitForTimeout(200);
    const t1 = await page.evaluate(() => ({ids: [...document.querySelectorAll('#v-quiz .gtap')].map(b => b.dataset.term),
      inStem: document.querySelectorAll('#v-quiz .stem .gtap').length, inLabel: document.querySelectorAll('#v-quiz .wtxt > b .gtap').length,
      inVerdict: document.querySelectorAll('#v-quiz .verdict .gtap').length, gloss: document.querySelectorAll('#v-quiz .gloss').length}));
    const ids23 = t1.ids;
    check(ids23.length && new Set(ids23).size === ids23.length, `after the answer, ${ids23.length} terms are marked, each once`, ids23);
    check(['affinity', 'efficacy', 'pharmacodynamics', 'receptor'].every(id => ids23.includes(pre + id)), 'affinity, efficacy, pharmacodynamics and receptor among them', ids23);
    check(!t1.inStem && !t1.inLabel && !t1.inVerdict, 'none in the stem, an option\'s own text or the verdict', t1);
    check(t1.gloss === 0, 'the core gave no bracketed gloss here (the explanation defines affinity itself)', t1.gloss);
    await page.click(`#v-quiz .gtap[data-term="${pre}affinity"]`);
    const box = await page.evaluate(() => { const b = document.querySelector('#v-quiz .gtap-box'); return b && {text: b.textContent, open: document.querySelector('#v-quiz .gtap[aria-expanded="true"]').dataset.term,
      after: !!(b.previousElementSibling && b.previousElementSibling.classList.contains('wrow'))}; });
    check(box && box.text.includes(affinity.def) && box.text.includes(affinity.gist) && box.text.includes(affinity.cite) && box.open === pre + 'affinity' && box.after,
      'a tap opens the term\'s definition, meaning and source under the line', box);
    await page.click(`#v-quiz .gtap[data-term="${pre}affinity"]`);
    check(await page.evaluate(() => !document.querySelector('#v-quiz .gtap-box') && document.querySelector('#v-quiz .gtap[aria-expanded="true"]') === null), 'a second tap closes it');
    await page.click(`#v-quiz .gtap[data-term="${pre}efficacy"]`);
    await page.click('#v-quiz .gtap-box [data-gtopen]');
    const jumped = await page.evaluate(id => ({view: VIEW, there: !!document.getElementById('gt-' + id), back: (document.getElementById('backbtn') || {}).textContent || ''}), pre + 'efficacy');
    check(jumped.view === 'glossary' && jumped.there && /Back to the question/.test(jumped.back), '"Open in the Glossary" opens the tab at the term, with the way back to the question', jumped);

    // L02-018: the core glosses "affinity" in brackets, so the tap leaves it there
    await L.quizOn(page, pre + 'L02-018');
    await page.evaluate(() => document.querySelector('#v-quiz button[data-o="1"]').click());
    await page.waitForTimeout(200);
    const t2 = await page.evaluate(() => ({ids: [...document.querySelectorAll('#v-quiz .gtap')].map(b => b.dataset.term), gloss: document.querySelectorAll('#v-quiz .gloss').length}));
    check(t2.gloss === 1 && !t2.ids.includes(pre + 'affinity') && t2.ids.includes(pre + 'efficacy'), 'a term the core has glossed in brackets is not a button in that question; the others are', t2);

    // the Guides tab: once per section
    await page.click('#nav button[data-v="guide"]');
    const gd = await page.evaluate(p => { const sec = id => { const h = document.getElementById(id); const out = []; let n = h && h.nextElementSibling;
        while(n && n.tagName !== 'H3'){ n.querySelectorAll('.gtap').forEach(b => out.push(b.dataset.term)); n = n.nextElementSibling; } return out; };
      return {one: sec(p + 'guide-1'), four: sec(p + 'guide-4'), inH: document.querySelectorAll('#v-guide h3 .gtap').length}; }, pre);
    check(gd.one.includes(pre + 'affinity') && gd.one.includes(pre + 'efficacy') && new Set(gd.one).size === gd.one.length, 'in a guide section each term is marked once', gd.one);
    check(gd.four.includes(pre + 'affinity') && !gd.four.includes(pre + 'efficacy'), 'a new section marks affinity again, but not efficacy, which its word list defines', gd.four);
    check(gd.inH === 0, 'no heading holds a button', gd.inH);
    await page.click(`#v-guide .gtap[data-term="${pre}affinity"]`);
    check(await page.evaluate(d => { const b = document.querySelector('#v-guide .gtap-box'); return !!b && b.textContent.includes(d) && b.parentElement.tagName === 'LI'; }, affinity.def), 'a tap in a guide opens the definition inside that line');
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    s.rm();
  }

  console.log('\n=== the options ===');
  const o = L.scratchBuild('gtap-opts', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS, null)}, courseLine: L.featureOn(HERE, {notTapped: [pre + 'drug']})});
  const off = L.scratchBuild('gtap-off', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS, null)}, courseLine: L.featureOn(HERE, {tap: false})});
  try {
    if(o.code !== 0 || off.code !== 0) check(false, 'the scratch copies with notTapped and tap off build', (o.out + '\n' + off.out).split('\n').filter(l => /ERROR/.test(l)).join(' | '));
    else {
      const p1 = await L.openPage(browser, o.page);
      const f = await p1.page.evaluate(() => FX.api('glossary-tap').find('the drug binds the receptor').map(x => x[0]));
      check(JSON.stringify(f) === JSON.stringify([pre + 'receptor']), 'with notTapped, that term is no longer found', f);
      await p1.ctx.close();
      const p2 = await L.openPage(browser, off.page);
      await L.quizOn(p2.page, pre + 'L02-023');
      await p2.page.evaluate(() => document.querySelector('#v-quiz button[data-o="0"]').click());
      await p2.page.waitForTimeout(200);
      const n = await p2.page.evaluate(() => ({tap: document.querySelectorAll('#v-quiz .gtap').length, tab: !!document.querySelector('#nav button[data-v="glossary"]')}));
      check(n.tap === 0 && n.tab, 'with tap off, nothing is marked and the Glossary tab stays', n);
      await p2.ctx.close();
    }
  } finally {
    o.rm(); off.rm();
    await browser.close();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
