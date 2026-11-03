// Write features/stopwatch/current/test_fixture.js from the fixture JSON made by mkfixture.js.
//   node writefixture.js <fixture.json> <out test_fixture.js>
const fs = require('fs');
const [inp, out] = process.argv.slice(2);
const FIX = JSON.parse(fs.readFileSync(inp, 'utf8'));
const head = `/* stopwatch: the course data of the module's test and of its own course (ci/oncourse.js).
 *
 * Basic-Pharmacokinetics' own data, read from a read-only copy at ac2eb73, with nothing
 * written for the test:
 *   exam        src/course.js \`exams\`, the entry with id 3 ("Exam 3 (final)", the course's
 *               \`activeExam\`), every field as the course has it. It has no \`typed\`: the
 *               course's own engine draws calculations onto every paper (src/shell.html
 *               line 1180, src/views.js lines 3270-3277), and the kit core does that only for an
 *               exam with \`typed: true\`. So on this exam's papers the kit draws only
 *               single-answer and select-all questions.
 *   activeExam  src/course.js \`activeExam\` (3)
 *   calc        the ${FIX.calc.length} numeric questions of the professor's Canvas Quiz 4 (src/q13_quizzes.js:
 *               ${FIX.calc.join(', ')}), the quiz whose \`said\` line in src/course.js (line 264) gives
 *               the pace: "A few calculations, each meant to take 2 minutes or less"
 *   qs          those ${FIX.calc.length} and ${FIX.qs.length - FIX.calc.length} single-answer and select-all questions that fill Exam 3's
 *               four pools (src/q*.js), every field as the course has it
 *   topics      the ${FIX.topics.length} TOPICS entries those questions name
 *   lectures    the ${FIX.lectures.length} COURSE.lectures entries whose deck those questions' cites name
 *   skills      the COURSE.skills entries those questions use
 *   images      the ${Object.keys(FIX.images).length} src/images.json entries those questions show
 * Which questions (the rule only chooses; no question is changed): a question is taken when
 * it is not lowYield, does not name the professor anywhere in its text, passes the kit
 * core's rules for a question (style_check.js STEM_RE, no figure promised by the stem,
 * a cite that names a lecture deck, the option and step rules of test.js, no word
 * "undefined", "null" or "NaN") and its dupOf chain can be taken too. For each pool of
 * Exam 3, questions without an image come first, in the course's order, then questions
 * with an image, smallest image first, until the pool holds its marks plus one question
 * family and its share of select-all questions plus one. The script that made this file
 * is kept with the review evidence (branch evidence/stopwatch, scripts/mkfixture.js).
 * The one change to the data: \`prof\` is left out here, and courseData(prof) writes the
 * course's own first professor (the kit template's "Professor") into every question,
 * topic and lecture, so the kit holds no personal name.
 * Placement in a course (not a change to what the data says): every question, topic and
 * lecture id, and each reference to one (dupOf, topic, lecture), carries the prefix sw-, so
 * these never meet another module's copy of the same Basic-Pharmacokinetics data in one
 * course; the topics come after the course's own; COURSE.exams becomes this one exam.
 * courseData(prof) returns the question file (one question per line, opening {id:'...', in
 * the kit's question-file form, which core browser_test.js counts) and the course.js line.
 */
`;
const body = `const FIX = ${JSON.stringify(FIX)};
const PRE = 'sw-', FILE = 'q90_stopwatch_pk.js';
const pre = id => PRE + id;
function courseData(prof){
  if(typeof prof !== 'string' || !prof || /['\\\\\\n]/.test(prof)) throw new Error('the professor cannot be written as a literal');
  const lit = s => { if(!/^[A-Za-z0-9_. -]+$/.test(String(s))) throw new Error('cannot be written as a literal: ' + s); return "'" + s + "'"; };
  const qline = q => { const c = Object.assign({}, q); ['id', 'type', 'dupOf', 'skill'].forEach(k => { delete c[k]; });
    if(c.topic) c.topic = pre(c.topic); if(c.lecture) c.lecture = pre(c.lecture);
    return '{id:' + lit(pre(q.id)) + ',' + (q.type ? ' type:' + lit(q.type) + ',' : '') + (q.dupOf ? ' dupOf:' + lit(pre(q.dupOf)) + ',' : '') +
      ' skill:' + lit(q.skill) + ', prof:' + lit(prof) + ', ' + JSON.stringify(c).slice(1) + ','; };
  const text = '/* stopwatch: Basic-Pharmacokinetics\\' own topics and questions (ac2eb73), as\\n' +
    '   features/stopwatch/current/test_fixture.js names them; ids prefixed sw-, the professor set to the course\\'s own */\\n' +
    'TOPICS.push(\\n' + FIX.topics.map(t => JSON.stringify(Object.assign({}, t, {id: pre(t.id), prof}))).join(',\\n') + ');\\n' +
    'QUESTIONS.push(\\n' + FIX.qs.map(qline).join('\\n') + '\\n);\\n';
  // a lecture as {id:'sw-L01', ...}: state_check.js finds a lecture by its id:'...' entry in course.js
  const lecture = l => { const c = Object.assign({}, l); delete c.id; c.prof = prof; return '{id:' + lit(pre(l.id)) + ', ' + JSON.stringify(c).slice(1); };
  const courseLine = 'COURSE.lectures = (COURSE.lectures || []).concat([' + FIX.lectures.map(lecture).join(', ') + ']); ' +
    'COURSE.skills = (COURSE.skills || []).concat(' + JSON.stringify(FIX.skills) + '.filter(s => !(COURSE.skills || []).some(k => k.id === s.id))); ' +
    'COURSE.exams = [' + JSON.stringify(FIX.exam) + ']; COURSE.activeExam = ' + JSON.stringify(FIX.activeExam) + ';';
  return {files: {[FILE]: text}, courseLine};
}
/* The course's images.json with the fixture's images added (an image the course already
   has under the same key with other data stops it: nothing of the course is overwritten). */
function withImages(json){
  const have = JSON.parse(json || '{}');
  for(const [k, v] of Object.entries(FIX.images)){
    if(k in have && have[k] !== v) throw new Error('images.json already has another image under ' + k);
    have[k] = v;
  }
  return JSON.stringify(have, null, 1) + '\\n';
}
module.exports = {FIX, PRE, FILE, pre, courseData, withImages};
`;
fs.writeFileSync(out, head + body);
console.log('wrote ' + out + ' (' + (head + body).length + ' characters)');
