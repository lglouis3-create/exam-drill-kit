// Write features/paper-picker/current/test_fixture.js from fixture.json (made by mkfixture.js).
//   node writefixture.js <fixture.json> <out test_fixture.js>
const fs = require('fs');
const [inp, out] = process.argv.slice(2);
const F = JSON.parse(fs.readFileSync(inp, 'utf8'));
const head = `/* paper-picker: the course data of the module's test and of its CI course (ci/oncourse.js).
 *
 * Basic-Pharmacokinetics' own data, read from a read-only copy at ac2eb73, with nothing
 * written for the test:
 *   exams       src/course.js \`exams\`, all three, every field as the course has it
 *   activeExam  src/course.js \`activeExam\` (3)
 *   lectures    src/course.js \`lectures\`, all twelve (the exams' pools name modules 1-9)
 *   skills      the src/course.js \`skills\` entries the questions below use
 *   topics      the TOPICS entries (src/q1_module1.js and the files that push to it) the
 *               questions below belong to
 *   qs          ${F.qs.length} of its questions (src/q*.js, in the order its build.py reads them),
 *               every field as the course has it
 *   images      the ${Object.keys(F.images).length} src/images.json entries those questions show
 * Which questions (the rule only chooses; no question is changed). A question can be taken
 * when it has no \`type\` (a single-answer or select-all question; these exams have no
 * \`typed\`, so their papers carry only these), is not \`lowYield\`, does not name the
 * professor in its text, passes the core's rules for a question (style_check.js STEM_RE; a
 * stem that promises a figure shows one, browser_test.js; its cite names a lecture deck, at
 * least 3 options and a select-all at least 4 with a distractor, test.js; no word
 * "undefined", "null" or "NaN", browser_test.js and nullexam_test.js), and its \`dupOf\`
 * chain, if any, can be taken too. Every such question without an image is taken; one with
 * an image only while a pool of Exam 3 or Exam 2 has fewer question families than its
 * marks, smallest image first. Exam 1's Module 2 pool cannot be filled from such questions,
 * so a paper for Exam 1 cannot be drawn here, as the drill then says. The script that made
 * this file is kept with the review evidence (branch evidence/paper-picker).
 * The one change to the data: \`prof\` is left out here, and courseData(prof) writes the
 * course's own first professor (the kit template's "Professor") into every question, topic
 * and lecture, so the kit holds no personal name. In the course, the lectures' ids carry
 * the prefix \`pp-\` (pp-L01 ... pp-L12), because the kit template already has a lecture L01;
 * the questions' own \`lecture\` field is kept as the course has it (the kit does not read it).
 * courseData(prof) returns the question file (one question per line, opening {id:'...', in
 * the kit's question-file form, which core browser_test.js counts) and the course.js line.
 */
`;
const body = `const PK = ${JSON.stringify(F)};
const FILE = 'q90_paper_picker_pk.js';
function courseData(prof){
  if(typeof prof !== 'string' || !prof || /['\\\\\\n]/.test(prof)) throw new Error('the professor cannot be written as a literal');
  const lit = s => { if(!/^[A-Za-z0-9_. -]+$/.test(String(s))) throw new Error('cannot be written as a literal: ' + s); return "'" + s + "'"; };
  const rest = (o, drop) => { const c = Object.assign({}, o); drop.forEach(k => { delete c[k]; }); c.prof = prof; return JSON.stringify(c).slice(1); };
  const qline = q => '{id:' + lit(q.id) + ',' + (q.dupOf ? ' dupOf:' + lit(q.dupOf) + ',' : '') + ' skill:' + lit(q.skill) + ', prof:' + lit(prof) + ', ' +
    JSON.stringify((() => { const c = Object.assign({}, q); delete c.id; delete c.dupOf; delete c.skill; return c; })()).slice(1) + ',';
  const text = '/* paper-picker test data: Basic-Pharmacokinetics\\' own topics and questions (ac2eb73), as\\n' +
    '   features/paper-picker/current/test_fixture.js names them; the professor set to the course\\'s own */\\n' +
    'TOPICS.push(\\n' + PK.topics.map(t => JSON.stringify(Object.assign({}, t, {prof}))).join(',\\n') + ');\\n' +
    'QUESTIONS.push(\\n' + PK.qs.map(qline).join('\\n') + '\\n);\\n';
  const lecture = l => '{id:' + lit('pp-' + l.id) + ', ' + rest(l, ['id']);
  const courseLine = 'COURSE.lectures = (COURSE.lectures || []).concat([' + PK.lectures.map(lecture).join(', ') + ']); ' +
    'COURSE.skills = (COURSE.skills || []).concat(' + JSON.stringify(PK.skills) + '.filter(s => !(COURSE.skills || []).some(k => k.id === s.id))); ' +
    'COURSE.exams = ' + JSON.stringify(PK.exams) + '; COURSE.activeExam = ' + JSON.stringify(PK.activeExam) + ';';
  return {files: {[FILE]: text}, courseLine, images: PK.images};
}
/* The course's images.json with the fixture's images added (an image the course already
   has under the same key stops it: nothing of the course is overwritten). */
function withImages(json){
  const have = JSON.parse(json || '{}');
  for(const [k, v] of Object.entries(PK.images)){
    if(k in have && have[k] !== v) throw new Error('images.json already has another image under ' + k);
    have[k] = v;
  }
  return JSON.stringify(have, null, 1) + '\\n';
}
module.exports = {PK, FILE, courseData, withImages};
`;
fs.writeFileSync(out, head + body);
console.log('wrote', out, fs.statSync(out).size, 'bytes');
