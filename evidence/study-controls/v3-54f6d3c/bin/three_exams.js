/* three_exams.js <kit> <courseSrc>: makes a scratch course a 3-exam course, with paper-picker's own
 * test fixture (features/paper-picker/current/test.js `const PK`, Basic-Pharmacokinetics at ac2eb73),
 * written the way that test's fixtureFiles writes it: its 3 exams (ids 1, 2, 3: numbers; 120 minutes
 * each; every paper 6 questions with 1 select-all item; Exam 3's marks 2/2/1/1), its lectures, topics
 * and 18 questions (ids, topics and lectures prefixed sc3-; professor and skill the course's own),
 * current exam 3. Writes q92_sc3_exams.js and one course.js line, only inside <courseSrc>. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const [KIT, SRC] = process.argv.slice(2);
const t = fs.readFileSync(path.join(KIT, 'features', 'paper-picker', 'current', 'test.js'), 'utf8');
const m = t.match(/^const PK = (.*);\s*$/m);
if(!m) { console.error('no one-line const PK in paper-picker test.js'); process.exit(1); }
const PK = vm.runInNewContext('(' + m[1] + ')');
const C = vm.runInNewContext(fs.readFileSync(path.join(SRC, 'course.js'), 'utf8') + ';COURSE');
const own = {prof: C.professors[0], skills: C.skills.map(s => s.id)}, skills = new Set(own.skills), pre = s => 'sc3-' + s;
const qs = PK.qs.map(q => Object.assign({}, q, {id: pre(q.id), topic: pre(q.topic), lecture: pre(q.lecture), prof: own.prof, skill: skills.has(q.skill) ? q.skill : own.skills[0]}));
const topics = PK.topics.map(x => Object.assign({}, x, {id: pre(x.id), prof: own.prof}));
const lectures = PK.lectures.map(l => Object.assign({}, l, {id: pre(l.id), prof: own.prof}));
const scaled = {1: null, 2: null, 3: [2, 2, 1, 1]};
const exams = PK.exams.map(e => Object.assign({}, e, {questions: 6, sata: 1, pools: e.pools.map((p, i) => Object.assign({}, p, scaled[e.id] ? {marks: scaled[e.id][i]} : {}))}));
fs.writeFileSync(path.join(SRC, 'q92_sc3_exams.js'), '/* paper-picker test fixture (Basic-Pharmacokinetics ac2eb73), prefix sc3- */\n' +
  `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`);
fs.appendFileSync(path.join(SRC, 'course.js'), `\n;/* three exams */ COURSE.files = COURSE.files.concat(['q92_sc3_exams.js']); COURSE.lectures = COURSE.lectures.concat(${JSON.stringify(lectures)}); COURSE.exams = ${JSON.stringify(exams)}; COURSE.activeExam = ${JSON.stringify(PK.activeExam)};\n`);
console.log(`three_exams wrote q92_sc3_exams.js: ${qs.length} questions, ${topics.length} topics, ${lectures.length} lectures; ${exams.length} exams (ids ${exams.map(e => JSON.stringify(e.id)).join(', ')}, minutes ${exams.map(e => e.minutes).join('/')}), current ${JSON.stringify(PK.activeExam)}`);
