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
 * stands, every `prof` the source's own (Louis's policy of 2026-11-03), with these
 * changes only:
 *   - ids (CIDATA rule 2): questions, prompts, figures, images, topics, subtopics and
 *     lectures are prefixed `sgc-` in front of the course's own id, and every reference
 *     to one (a question's topic, sub, lecture and img; a topic's lecture; a prompt's
 *     lecture; a figure's key and alts) is rewritten the same way (the test's own
 *     scratch copies use `sag-` and the figures' own keys, so the two never meet);
 *   - the questions' `fg` field is left out: the core reads `fg` as a drawn structure
 *     of atlas.js, and core browser_test.js fails on every one ("every drawn structure
 *     resolves to a group"); in the source it names the figure shown after the answer.
 * The lectures the questions cite and the prompts name (L14, L21, TBL3 among them) are
 * written with their labels as the source has them. GRAPH_EXAMS holds each exam's
 * intro line (app.js vGraphs INTRO) and Exam 2's tracing wording as test.js's EXAMS
 * holds them: the noun 'tracing', the group name 'Tissue tracings' and MISS2. The
 * module is switched on with saAbout, the Short answer page's line from app.js vSa
 * (test.js's SA_ABOUT). The course's professors are added to COURSE.professors.
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
const IP = grab('IP'), EXAMS = grab('EXAMS'), SA_ABOUT = grab('SA_ABOUT');
for(const k of ['graphs', 'qs', 'topics', 'images', 'sa', 'miss', 'miss2', 'lectures', 'skills'])
  if(!IP[k] || typeof IP[k] !== 'object') fail(`the fixture in test.js has no ${k}`);
if(!EXAMS[2] || !EXAMS[2].noun || !EXAMS[2].other) fail('test.js\'s EXAMS has no Exam 2 tracing wording');
if(typeof SA_ABOUT !== 'string') fail('test.js\'s SA_ABOUT is not text');
const noProf = [].concat(IP.qs, IP.topics, IP.lectures).filter(x => typeof x.prof !== 'string' || !x.prof);
if(noProf.length) fail(`the fixture in test.js has no prof on ${noProf.map(x => x.id).join(', ')}`);
const profs = [...new Set([].concat(IP.qs, IP.topics, IP.lectures).map(x => x.prof))];

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
// no id this script writes may be in the course already (rule 2)
const known = new Set((COURSE.lectures || []).map(l => l.id)), knownSkill = new Set((COURSE.skills || []).map(s => s.id));
for(const l of IP.lectures) if(known.has(PRE + l.id)) fail(`the course already has a lecture ${PRE + l.id}`);
const others = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).map(f => { try { return fs.readFileSync(path.join(src, f), 'utf8'); } catch(e){ return ''; } }).join('\n');
if(others.includes(`'${PRE}`) || others.includes(`"${PRE}`)) fail(`the course already holds an id that starts with ${PRE}`);

const lit = s => { if(typeof s !== 'string' || !/^[A-Za-z0-9_. -]+$/.test(s)) fail(`"${s}" cannot be written as a literal`); return `'${s}'`; };
const img = k => PRE + k, p = id => PRE + id;
// questions: one per line, opening {id:'...', then type, then prof, then the rest of the fixture's fields as they stand
const qs = IP.qs.map(q => {
  const rest = Object.assign({}, q); delete rest.id; delete rest.type; delete rest.prof; delete rest.fg;
  for(const k of ['img', 'topic', 'sub', 'lecture', 'dupOf']) if(rest[k] !== undefined) rest[k] = p(rest[k]);
  return `{id:${lit(PRE + q.id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` prof:${lit(q.prof)}, ${JSON.stringify(rest).slice(1)},`;
});
const graphs = IP.graphs.map(g => Object.assign({}, g, {key: img(g.key), alts: (g.alts || []).map(img)}));
const sa = IP.sa.map(x => Object.assign({}, x, {id: p(x.id)}, x.lecture ? {lecture: p(x.lecture)} : {}));
const topics = IP.topics.map(t => Object.assign({}, t, {id: p(t.id)}, t.lecture ? {lecture: p(t.lecture)} : {}, {subs: (t.subs || []).map(s => Object.assign({}, s, {id: p(s.id)}))}));
const exams = {};
for(const n of Object.keys(EXAMS)) exams[n] = Object.assign({}, EXAMS[n].intro ? {intro: EXAMS[n].intro} : {}, EXAMS[n].noun ? {noun: EXAMS[n].noun, other: EXAMS[n].other} : {});
exams[2].miss = IP.miss2;
const list = (name, rows) => declared(name) ? `${name}.push(...${JSON.stringify(rows)});` : `const ${name} = ${JSON.stringify(rows)};`;
const obj = (name, value) => declared(name) ? `Object.assign(${name}, ${JSON.stringify(value)});` : `const ${name} = ${JSON.stringify(value)};`;
const qbody = `/* short-answer-graphs ci: the module test's fixture (Intro-Pharmacology exam1-drill/src
   q_FIGS.js, q_L06.js, q_PE2.js at 929cd62): three topics and the 21 questions on four figures,
   ids prefixed ${PRE}, fg left out, as features/short-answer-graphs/ci/oncourse.js says */
TOPICS.push(...${JSON.stringify(topics)});
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
const lectures = IP.lectures.map(l => Object.assign({}, l, {id: p(l.id)})), skills = IP.skills.filter(s => !knownSkill.has(s.id));
const knownProf = new Set(COURSE.professors || []), newProfs = profs.filter(n => !knownProf.has(n));
// a lecture in the course's own form, {id:'L06', ...}: state_check.js finds a lecture by its id:'...' entry in course.js
const lectureLit = l => { const rest = Object.assign({}, l); delete rest.id; return `{id:${lit(l.id)}, ${JSON.stringify(rest).slice(1)}`; };
const line = `\n;${TAG} COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(QFILE)}, ${JSON.stringify(DFILE)}]); ` +
  `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.map(lectureLit).join(', ')}]); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.professors = (COURSE.professors || []).concat(${JSON.stringify(newProfs)}); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(NAME)}: ${JSON.stringify({version: meta.version, saAbout: SA_ABOUT})}});\n`;
for(const k of Object.keys(IP.images)) images[img(k)] = IP.images[k];
try { fs.writeFileSync(qfile, qbody); } catch(e){ fail('cannot write ' + qfile + ': ' + e.message); }
try { fs.writeFileSync(dfile, dbody); } catch(e){ fail('cannot write ' + dfile + ': ' + e.message); }
try { fs.writeFileSync(imgFile, JSON.stringify(images)); } catch(e){ fail('cannot write ' + imgFile + ': ' + e.message); }
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write ' + course + ': ' + e.message); }
console.log(`wrote: ${qfile} (topics ${topics.map(t => t.id).join(', ')}; ${qs.length} questions from the fixture in test.js)`);
console.log(`wrote: ${dfile} (${sa.length} prompts, ${graphs.length} figures, GRAPH_MISS ${Object.keys(IP.miss).length} tags, GRAPH_EXAMS: the intro line of exams ${Object.keys(exams).filter(n => exams[n].intro).join(' and ')}, Exam 2 with ${Object.keys(IP.miss2).length} tags)`);
console.log(`wrote: ${imgFile} (${Object.keys(IP.images).length} images added: ${Object.keys(IP.images).map(img).join(', ')})`);
console.log(`wrote: appended to ${course}: the two files in COURSE.files, ${lectures.length} lecture(s) in COURSE.lectures (${lectures.map(l => l.id).join(', ') || 'none new'}), ` +
  `${skills.length} skill(s) in COURSE.skills (${skills.map(s => s.id).join(', ') || 'none new'}), ${newProfs.length} professor(s) in COURSE.professors, and ${NAME} ${meta.version} on with saAbout`);
