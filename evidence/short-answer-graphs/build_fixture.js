/* Writes the questions, figures, images, lectures and skills of the IP fixture in
 * features/short-answer-graphs/current/test.js from Intro-Pharmacology
 * exam1-drill/src at 929cd62 (read-only clone), verbatim except `prof`, which is
 * "Professor" (the one change made to the data). The prompts, topics and miss tables
 * of the fixture are left as they are (verify_fixture.js compares them with the source).
 *
 * Figures: the fixture's two (rev-pindolol, pe2-gi-tracing) and two more of the
 * professor's review figures, rev-rt-figure and rev-allo-ant, each with every question
 * whose img is its key, in the order the fixture had them (q_FIGS.js, then q_L06.js,
 * then q_PE2.js; in each file, the file's order), and the figures in graphs.js order.
 * Why the two more figures: core test.js section 7 takes the first concept with two
 * or more questions, misses it, answers at least 4 (the core's GAP) other concepts of
 * the same topic, and expects that concept back in another wording of the same topic.
 * With the two figures alone, the first such concept (the pindolol figure's) had no
 * other concept in its topic, and section 7 failed. With these, the first such
 * concept is rev-rt-figure's "three-questions-irreversible" (FG-025, FG-027, FG-028),
 * and topic FG has five other concepts.
 * Lectures whose text other than `prof` names a professor are left out (none of
 * those cited).
 *   node build_fixture.js <test.js> <ip src dir>
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const [testFile, src] = process.argv.slice(2);
const lines = fs.readFileSync(testFile, 'utf8').split('\n');
const at = lines.findIndex(l => l.startsWith('const IP = '));
const IP = JSON.parse(lines[at].slice('const IP = '.length).replace(/;\s*$/, ''));
const ctx = {}; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8').replace(/^(const|let) /gm, 'var '), ctx);
run('course.js'); vm.runInContext('var TOPICS = [], QUESTIONS = [];', ctx);
['q_FIGS.js', 'q_L06.js', 'q_PE2.js'].forEach(run);
run('graphs.js');
const C = ctx.COURSE, re = new RegExp('\\b(' + C.professors.join('|') + ')\\b', 'i');
const images = JSON.parse(fs.readFileSync(path.join(src, 'images.json'), 'utf8'));
const copy = x => JSON.parse(JSON.stringify(x));
const FIGS = ['rev-rt-figure', 'rev-allo-ant', 'rev-pindolol', 'pe2-gi-tracing'];
const EXTRA = [];
const graphs = FIGS.map(k => copy(ctx.GRAPHS.find(g => g.key === k)));
graphs.sort((a, b) => ctx.GRAPHS.indexOf(ctx.GRAPHS.find(g => g.key === a.key)) - ctx.GRAPHS.indexOf(ctx.GRAPHS.find(g => g.key === b.key)));
const keys = new Set(graphs.flatMap(g => [g.key].concat(g.alts || [])));
const qs = ctx.QUESTIONS.filter(q => keys.has(q.img) || EXTRA.includes(q.id)).map(q => Object.assign(copy(q), {prof: 'Professor'}));
const named = qs.filter(q => { const c = Object.assign({}, q); delete c.prof; return re.test(JSON.stringify(c)); });
if(named.length) { console.log('a question names a professor outside prof: ' + named.map(q => q.id).join(', ')); process.exit(1); }
const ids = new Set(qs.map(q => q.id));
const dangling = qs.filter(q => q.dupOf && !ids.has(q.dupOf));
if(dangling.length) { console.log('dupOf names a question not in the fixture: ' + dangling.map(q => q.id + ' -> ' + q.dupOf).join(', ')); process.exit(1); }
const cites = qs.map(q => q.cite).join('; ');
const lectures = C.lectures.filter(l => cites.includes(l.deck)).filter(l => {
  const n = Object.entries(l).some(([k, v]) => k !== 'prof' && re.test(JSON.stringify(v)));
  if(n) console.log('left out: lecture ' + l.id + ' (its text names a professor)');
  return !n;
}).map(l => Object.assign(copy(l), {prof: 'Professor'}));
const unresolved = qs.filter(q => !lectures.some(l => q.cite.includes(l.deck)));
if(unresolved.length) { console.log('cites no deck of the lectures kept: ' + unresolved.map(q => q.id).join(', ')); process.exit(1); }
const used = new Set(qs.map(q => q.skill));
const topicsUsed = new Set(qs.map(q => q.topic));
const missingTopic = [...topicsUsed].filter(t => !IP.topics.some(x => x.id === t));
if(missingTopic.length) { console.log('topics not in the fixture: ' + missingTopic.join(', ')); process.exit(1); }
const out = {graphs, qs, topics: IP.topics, images: Object.fromEntries([...keys].map(k => [k, images[k]])), sa: IP.sa, miss: IP.miss, miss2: IP.miss2,
             lectures, skills: copy(C.skills.filter(s => used.has(s.id)))};
for(const k of keys) if(!images[k]) { console.log('no image for ' + k); process.exit(1); }
lines[at] = 'const IP = ' + JSON.stringify(out) + ';';
fs.writeFileSync(testFile, lines.join('\n'));
console.log(`figures: ${graphs.map(g => g.key).join(', ')}; questions (${qs.length}): ${qs.map(q => q.id).join(', ')}; ` +
  `lectures: ${lectures.map(l => l.id).join(', ')}; skills: ${out.skills.map(s => s.id).join(', ')}; images: ${Object.keys(out.images).length}`);
