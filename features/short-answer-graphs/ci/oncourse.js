/* short-answer-graphs: switch the module on in a fresh scratch course, for the kit's CI.
 *
 *     node features/short-answer-graphs/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course data is the fixture of the module's own test.js, read from that file as
 * it stands: its `const IP` (Intro-Pharmacology exam1-drill/src at 929cd62: four figures
 * of graphs.js, the 21 questions on them from q_FIGS.js, q_L06.js and q_PE2.js with
 * their three topics, their four images from images.json, five short-answer prompts of
 * sa4.js and sa3.js, app.js's MISS and MISS2 tables, the COURSE.lectures entries
 * the questions cite and the COURSE.skills entries they use). It is written as it
 * stands, with these changes only:
 *   - the professor: the fixture already has "Professor" in every `prof`, the
 *     template's name, in place of the course's (the one change made to the data);
 *   - ids: questions, prompts, figures and images are prefixed `sgc-` (the test's
 *     own scratch copies use `sag-` and the figures' own keys, so the two never meet);
 *   - the questions' `fg` field is left out: the core reads `fg` as a drawn structure.
 * Left out, and why:
 *   - the lectures the prompts name (L14, L21, TBL3): their labels name a professor,
 *     so the prompts show the lecture id in their place;
 *   - each exam's intro line on the Graphs page (app.js vGraphs INTRO): the source
 *     text uses a pronoun for the professor, and it is not reworded here.
 * GRAPH_EXAMS holds Exam 2's tracing wording as test.js's EXAMS holds it: the noun
 * 'tracing', the group name 'Tissue tracings' and MISS2.
 * Files written in <courseSrcDir>:
 *   q90_sgc_fixture.js   the three topics (TOPICS.push, after the course's topics)
 *                        and the 21 questions, one per line in the kit's
 *                        question-file format
 *   sgc_data.js          SHORT_ANSWERS, GRAPHS, GRAPH_MISS and GRAPH_EXAMS
 *   images.json          the four figures' images added
 * and one line appended to course.js: the two files in COURSE.files, the lectures in
 * COURSE.lectures and the skills in COURSE.skills (those the course does not have
 * yet), and the module on at the version in its module.json, kept beside any module
 * already on. Writes only inside <courseSrcDir>; stops with a non-zero exit on any
 * failure, including a course that already has this data (it runs once per course).
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NAME = 'short-answer-graphs', TAG = '/* short-answer-graphs ci */', QFILE = 'q90_sgc_fixture.js', DFILE = 'sgc_data.js', PRE = 'sgc-';
function fail(msg){ console.error(`${NAME} ci/oncourse.js: ${msg}`); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail(`usage: node features/${NAME}/ci/oncourse.js <kitDir> <courseSrcDir>`);
const cur = path.join(kit, 'features', NAME, 'current');
let meta, test;
try { meta = JSON.parse(fs.readFileSync(path.join(cur, 'module.json'), 'utf8')); }
catch(e){ fail(`cannot read ${path.join(cur, 'module.json')}: ${e.message}`); }
try { test = fs.readFileSync(path.join(cur, 'test.js'), 'utf8'); }
catch(e){ fail(`cannot read ${path.join(cur, 'test.js')}: ${e.message}`); }
const ctx = {}; vm.createContext(ctx);
function grab(name){
  const lines = test.split('\n'), at = lines.findIndex(l => l.startsWith(`const ${name} = `));
  if(at < 0) fail(`test.js has no top-level \`const ${name} = \``);
  let end = at + 1;
  while(end < lines.length && /^\s/.test(lines[end])) end++;
  try { return vm.runInContext(lines.slice(at, end).join('\n').replace(/^const /, `globalThis.${name} = `) + `\n;${name}`, ctx); }
  catch(e){ fail(`test.js's ${name} cannot be read: ${e.message}`); }
}
const IP = grab('IP'), EXAMS = grab('EXAMS');
for(const k of ['graphs', 'qs', 'topics', 'images', 'sa', 'miss', 'miss2', 'lectures', 'skills'])
  if(!IP[k] || typeof IP[k] !== 'object') fail(`the fixture in test.js has no ${k}`);
if(!EXAMS[2] || !EXAMS[2].noun || !EXAMS[2].other) fail('test.js\'s EXAMS has no Exam 2 tracing wording');
const prof = 'Professor';
const bad = [].concat(IP.qs, IP.topics, IP.lectures).filter(x => x.prof !== prof);
if(bad.length) fail(`the fixture in test.js has a prof other than "${prof}" (${bad.map(x => x.id).join(', ')})`);

const course = path.join(src, 'course.js'), qfile = path.join(src, QFILE), dfile = path.join(src, DFILE), imgFile = path.join(src, 'images.json');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail(`course.js already switches ${NAME} on (this script runs once per course)`);
for(const f of [qfile, dfile]) if(fs.existsSync(f)) fail(f + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
// the data files the course already has: a list the course declares is added to, not declared again
const declared = name => (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).some(f => {
  try { return new RegExp(`^\\s*(const|let|var)\\s+${name}\\b`, 'm').test(fs.readFileSync(path.join(src, f), 'utf8')); } catch(e){ return false; } });
let images;
try { images = JSON.parse(fs.readFileSync(imgFile, 'utf8')); } catch(e){ fail('images.json cannot be read: ' + e.message); }
for(const k of Object.keys(IP.images)) if(images[PRE + k]) fail(`images.json already has ${PRE + k} (this script runs once per course)`);

const lit = s => { if(typeof s !== 'string' || !/^[A-Za-z0-9_. -]+$/.test(s)) fail(`"${s}" cannot be written as a literal`); return `'${s}'`; };
const img = k => PRE + k;
// questions: one per line, opening {id:'...', then type, then prof, then the rest of the fixture's fields as they stand
const qs = IP.qs.map(q => {
  const rest = Object.assign({}, q); delete rest.id; delete rest.type; delete rest.prof; delete rest.fg;
  if(rest.img) rest.img = img(rest.img);
  return `{id:${lit(PRE + q.id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` prof:${lit(prof)}, ${JSON.stringify(rest).slice(1)},`;
});
const graphs = IP.graphs.map(g => Object.assign({}, g, {key: img(g.key), alts: (g.alts || []).map(img)}));
const sa = IP.sa.map(p => Object.assign({}, p, {id: PRE + p.id}));
const exams = {2: {noun: EXAMS[2].noun, other: EXAMS[2].other, miss: IP.miss2}};
const list = (name, rows) => declared(name) ? `${name}.push(...${JSON.stringify(rows)});` : `const ${name} = ${JSON.stringify(rows)};`;
const obj = (name, value) => declared(name) ? `Object.assign(${name}, ${JSON.stringify(value)});` : `const ${name} = ${JSON.stringify(value)};`;
const qbody = `/* short-answer-graphs ci: the module test's fixture (Intro-Pharmacology exam1-drill/src
   q_FIGS.js, q_L06.js, q_PE2.js at 929cd62): three topics and the 21 questions on four figures,
   ids prefixed ${PRE}, prof "${prof}", fg left out, as features/short-answer-graphs/ci/oncourse.js says */
TOPICS.push(...${JSON.stringify(IP.topics)});
QUESTIONS.push(
${qs.join('\n')}
);
`;
const dbody = `/* short-answer-graphs ci: the module test's fixture (Intro-Pharmacology exam1-drill/src sa4.js,
   sa3.js, graphs.js and app.js MISS and MISS2, at 929cd62), ids prefixed ${PRE} */
${list('SHORT_ANSWERS', sa)}
${list('GRAPHS', graphs)}
${obj('GRAPH_MISS', IP.miss)}
${obj('GRAPH_EXAMS', exams)}
`;
const known = new Set((COURSE.lectures || []).map(l => l.id)), knownSkill = new Set((COURSE.skills || []).map(s => s.id));
const lectures = IP.lectures.filter(l => !known.has(l.id)), skills = IP.skills.filter(s => !knownSkill.has(s.id));
// a lecture in the course's own form, {id:'L06', ...}: state_check.js finds a lecture by its id:'...' entry in course.js
const lectureLit = l => { const rest = Object.assign({}, l); delete rest.id; return `{id:${lit(l.id)}, ${JSON.stringify(rest).slice(1)}`; };
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(QFILE)}, ${JSON.stringify(DFILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lectureLit).join(', ')}]); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version})}});\n`;
for(const k of Object.keys(IP.images)) images[img(k)] = IP.images[k];
try { fs.writeFileSync(qfile, qbody); } catch(e){ fail('cannot write ' + qfile + ': ' + e.message); }
try { fs.writeFileSync(dfile, dbody); } catch(e){ fail('cannot write ' + dfile + ': ' + e.message); }
try { fs.writeFileSync(imgFile, JSON.stringify(images)); } catch(e){ fail('cannot write ' + imgFile + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${qfile} (topics ${IP.topics.map(t => t.id).join(', ')}; ${qs.length} questions from the fixture in test.js)`);
console.log(`wrote: ${dfile} (${sa.length} prompts, ${graphs.length} figures, GRAPH_MISS ${Object.keys(IP.miss).length} tags, GRAPH_EXAMS Exam 2 with ${Object.keys(IP.miss2).length} tags)`);
console.log(`wrote: ${imgFile} (${Object.keys(IP.images).length} images added: ${Object.keys(IP.images).map(img).join(', ')})`);
console.log(`wrote: appended to ${course}: the two files in COURSE.files, ${lectures.length} lecture(s) in COURSE.lectures (${lectures.map(l => l.id).join(', ') || 'none new'}), ` +
  `${skills.length} skill(s) in COURSE.skills (${skills.map(s => s.id).join(', ') || 'none new'}), and ${NAME} ${meta.version} on`);
