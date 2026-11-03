// Write features/paper-picker/current/test_fixture.js from the JSON made by mkfixture2.js.
//   node writefixture2.js <fixture.json> <out test_fixture.js>
const fs = require('fs');
const [inp, out] = process.argv.slice(2);
const F = JSON.parse(fs.readFileSync(inp, 'utf8'));
const head = `/* paper-picker: the course data of the module's test and of its CI course (ci/oncourse.js).
 *
 * Basic-Pharmacokinetics' own data, read from a read-only copy at ac2eb73, with nothing
 * written for the test and every field as the course has it, \`prof\` included:
 *   exams       src/course.js \`exams\`, all three, every field as the course has it
 *   activeExam  src/course.js \`activeExam\` (3)
 *   professors  src/course.js \`professors\`
 *   lectures    src/course.js \`lectures\`, all twelve (the exams' pools name modules 1-9)
 *   skills      the src/course.js \`skills\` entries the questions below use
 *   topics      the TOPICS entries (src/q1_module1.js and the files that push to it) the
 *               questions below belong to
 *   qs          ${F.qs.length} of its questions (src/q*.js, in the order its build.py reads them)
 *   images      the ${Object.keys(F.images).length} src/images.json entries those questions show
 * Which questions (the rule only chooses; no question is changed). In scope: every question
 * with no \`type\` (single-answer or select-all; these exams have no \`typed\`, so their papers
 * carry only these) that is not \`lowYield\` (never on a paper). Each of them is taken, with its
 * whole \`dupOf\` chain, except a question with an image that none of the rules below asks
 * for, which is left out for size only (the images are most of this file). A question with
 * an image is taken when the first version of this fixture left it out for a property it
 * has (it names the professor; a stem the core's stem rule flagged before or after kit pull
 * request #31; a stem promising a figure without one; a cite naming no deck; fewer than 3
 * options; the word "undefined"), when the first version held it, or while a pool of one of
 * the three exams has fewer question families than its marks, smallest image first. Every
 * pool of every exam is filled, so a paper can be drawn for each exam. The script that made
 * this file is kept with the review evidence (branch evidence/paper-picker, folder rework-*).
 * Ids (kit rule 2, /tmp/port-tools/CIDATA.md: other modules write some of the same
 * Basic-Pharmacokinetics questions and topics): PK below keeps the course's own ids, and
 * courseData() writes each id with the prefix PRE = \`pp-\`, the course's id kept inside it:
 *   question id    m7-c03          -> pp-m7-c03     (all ${F.qs.length}; \`dupOf\` rewritten the same way)
 *   topic id       pkpd            -> pp-pkpd       (all ${F.topics.length}; each question's \`topic\` the same)
 *   subtopic id    pkpd/teff       -> pp-pkpd/pp-teff (each question's \`sub\` the same)
 *   lecture id     L01             -> pp-L01        (all ${F.lectures.length}; the kit template has a lecture L01)
 * The questions' own \`lecture\` field is kept as the course has it (the kit does not read it).
 * The exams are kept as the course has them: their pools filter by exam and module, which
 * the core reads from the lecture whose deck a question cites, not by an id.
 * courseData() returns the question file (one question per line, opening {id:'...', in
 * the kit's question-file form, which core browser_test.js counts) and the course.js line,
 * which adds the course's professors to COURSE.professors (core test.js reads each
 * question's \`prof\` there).
 */
`;
const body = `const PK = ${JSON.stringify(F)};
const FILE = 'q90_paper_picker_pk.js', PRE = 'pp-';
function courseData(){
  const lit = s => { if(!/^[A-Za-z0-9_. -]+$/.test(String(s))) throw new Error('cannot be written as a literal: ' + s); return "'" + s + "'"; };
  const rest = (o, drop) => { const c = Object.assign({}, o); drop.forEach(k => { delete c[k]; }); return JSON.stringify(c).slice(1); };
  const qline = q => '{id:' + lit(PRE + q.id) + ',' + (q.dupOf ? ' dupOf:' + lit(PRE + q.dupOf) + ',' : '') + ' skill:' + lit(q.skill) + ', prof:' + lit(q.prof) + ', ' +
    JSON.stringify((() => { const c = Object.assign({}, q); delete c.id; delete c.dupOf; delete c.skill; delete c.prof; c.topic = PRE + q.topic; c.sub = PRE + q.sub; return c; })()).slice(1) + ',';
  const topic = t => Object.assign({}, t, {id: PRE + t.id, subs: t.subs.map(s => Object.assign({}, s, {id: PRE + s.id}))});
  const text = '/* paper-picker test data: Basic-Pharmacokinetics\\' own topics and questions (ac2eb73), as\\n' +
    '   features/paper-picker/current/test_fixture.js names them, every field as the course has it;\\n' +
    '   question, topic, subtopic and lecture ids carry the prefix ' + PRE + ' (the course\\'s id kept inside it) */\\n' +
    'TOPICS.push(\\n' + PK.topics.map(t => JSON.stringify(topic(t))).join(',\\n') + ');\\n' +
    'QUESTIONS.push(\\n' + PK.qs.map(qline).join('\\n') + '\\n);\\n';
  const lecture = l => '{id:' + lit(PRE + l.id) + ', ' + rest(l, ['id']);
  const courseLine = 'COURSE.professors = (COURSE.professors || []).concat(' + JSON.stringify(PK.professors) + '.filter(p => !(COURSE.professors || []).includes(p))); ' +
    'COURSE.lectures = (COURSE.lectures || []).concat([' + PK.lectures.map(lecture).join(', ') + ']); ' +
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
module.exports = {PK, FILE, PRE, courseData, withImages};
`;
fs.writeFileSync(out, head + body);
console.log('wrote', out, fs.statSync(out).size, 'bytes');
