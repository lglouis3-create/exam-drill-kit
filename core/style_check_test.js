/* The stem rule of style_check.js (style_rules.js stemFlag), on examples:
 *
 *   dose or problem wording    "given as" saying how a drug is given or what value a
 *                              problem gives is not flagged (Louis, 2026-11-02: "Allow
 *                              legitimate dose/problem wording")
 *   the material               a stem that asks what the slide, the deck or the lecture
 *                              says, or what is "given as" the example, the cause or the
 *                              answer, is flagged ("continuing to flag questions that
 *                              merely ask what a slide says")
 *
 * Each dose example is also shown flagged by the rule as it was before 2026-11-02 (plain
 * "given as" in STEM_RE), so the test shows the change. Then style_check.js itself runs
 * on a scratch build of this course with one question of each kind added: it names the
 * one that asks about the material and not the dose question.
 *
 *     node style_check_test.js
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'style_check_test.js';
const {check} = L;
const {stemFlag} = require('./style_rules');
delete process.env.DRILL_PAGE;

// the rule before 2026-11-02, for comparison
const OLD = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|given as|named as|described as)\b/i;

// The first is the Basic-Pharmacokinetics stem that the old rule flagged on 2026-11-02
// (formulas-in-text's fixture, question m6b-c02); the rest are written for this test.
const DOSE = [
  'A drug is given as a series of 2-hour intravenous (IV) infusions. Which equation gives the plasma concentration at the end of one infusion?',
  'Gentamicin is given as a 30-minute IV infusion every 8 hours. Which concentration is drawn as the peak?',
  'A dose is given as two tablets of the same strength. How does the amount absorbed change when F falls?',
  'The elimination rate constant is given as 0.173 h⁻¹. What is the half-life?',
  'Morphine is given as a 2.5 mg IV dose every 4 hours. What is the hourly rate?',
  'The drug is given as an oral solution to a patient who cannot swallow tablets. Which property limits absorption?',
  'Ceftriaxone is given as IV push over 5 minutes. Which model describes the first hour?',
  'A loading dose is given as a single bolus. Which equation gives the initial concentration?',
];
const MATERIAL = [
  ['Which drug is given as the example of a prodrug?', 'given as'],
  ['Which drug is given as the example of an oral prodrug?', 'given as'],
  ['Which mechanism is given as the cause of serotonin syndrome?', 'given as'],
  ['Which half-life value is given as correct?', 'given as'],
  ['A drug is given as an IV bolus. Which drug is given as the example of a narrow therapeutic index?', 'given as'],
  ['According to the slide, which isoform metabolizes most drugs?', 'According to'],
  ['Which property is described as the key to oral absorption?', 'described as'],
  ['What does the lecture give as the first-line agent?', 'the lecture'],
  ['Which enzyme is named as the main route of warfarin metabolism?', 'named as'],
];

console.log('\n=== The stem rule on examples ===');
for(const s of DOSE){
  check(stemFlag(s) === null, `not flagged: "${s.slice(0, 70)}..."`, stemFlag(s));
  check(OLD.test(s), '  (the rule before 2026-11-02 flagged it)');
}
for(const [s, want] of MATERIAL)
  check(String(stemFlag(s)).toLowerCase() === want.toLowerCase(), `flagged [${want}]: "${s.slice(0, 70)}"`, stemFlag(s));
check(stemFlag('Which enzyme converts codeine to morphine?') === null, 'a stem that asks the subject is not flagged');

console.log('\n=== style_check.js on a scratch build with one question of each kind ===');
L.PAGE.need(NAME);
const q = (id, stem) => `{id:'${id}', skill:COURSE.skills[0].id, prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id, ` +
  `concept:'${id}', tags:[], source:'slide', stem:${JSON.stringify(stem)}, options:[` +
  `{t:'Cp = k0(1 − e^(−kt))/(kV)', correct:true, why:'Zero-order input with first-order loss.'},` +
  `{t:'Cp = Cp0·e^(−kt)', correct:false, why:'A bolus with no input.'}], cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'}`;
const s = L.scratchBuild('styletest', {files: {'q98_style_test.js': '/* added by style_check_test.js */\nQUESTIONS.push(\n' +
  [q('stx-dose', DOSE[0]), q('stx-material', MATERIAL[0][0])].join(',\n') + ');\n'}});
if(s.code !== 0) L.notRun(NAME, 'the scratch copy does not build: ' + s.out.split('\n').pop());
try {
  const r = child.spawnSync(process.execPath, ['style_check.js'], {cwd: s.src, encoding: 'utf8', timeout: 120000,
    env: Object.assign({}, process.env, {DRILL_PAGE: s.page})});
  const out = (r.stdout || '') + (r.stderr || '');
  check(/stx-material \[given as\]/.test(out), 'style_check.js names the question that asks what is "given as" the example', out.split('\n').filter(l => /stx-/.test(l)).join(' | '));
  check(!/stx-dose/.test(out), 'and not the question whose "given as" is a dose', out.split('\n').filter(l => /stx-dose/.test(l)).join(' | '));
  check(r.status === 1 && /^FAIL: style_check\.js/m.test(out), 'it fails on the flagged question', `exit ${r.status}`);
} finally { s.rm(); }
L.finish(NAME);
