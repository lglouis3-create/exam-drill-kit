/* glossary-tap: build the module's own course in a fresh scratch course, for the kit's CI.
 *
 *     node features/glossary-tap/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course is Intro to Pharmacology's own data at 929cd62, read from the fixtures
 * in the kit's features/glossary-tap/current/test.js (`const FIX` and `const
 * FIXCOURSE`, copied as they are). The one change: every `prof` is set to the
 * template's "Professor", so no personal name is in the kit's course. Nothing is
 * invented. It writes only inside <courseSrcDir>:
 *   - terms_gtap.js: `const TERMS = [...]`, FIX.terms (glossary.js; lecture and fig
 *     left out);
 *   - q1_topics.js, replacing the template's sample questions: topics L02, L10 and
 *     TERMS and the questions of FIXCOURSE (every L02 and L10 question with no
 *     figure, graph, image or dupOf, and L02-018, L02-023, T-affinity-3);
 *   - guide.js, replacing the template's sample guide: FIX.guide (guide.js sections
 *     1 and 4, opening lines);
 *   - one line appended to course.js: the course's lectures L01, L02 and L10 and its
 *     skills, terms_gtap.js added to `files`, and the module switched on at the
 *     version in its module.json, kept beside any module already on (for example
 *     formulas-in-text, whose own script may run first).
 * Prints what it wrote. Stops with a non-zero exit on any failure, including a
 * course it has already been run on (it runs once per fresh course).
 */
const fs = require('fs'), path = require('path');
function fail(msg){ console.error('glossary-tap ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/glossary-tap/ci/oncourse.js <kitDir> <courseSrcDir>');
const here = path.join(kit, 'features', 'glossary-tap', 'current');
let meta, FIX, FC;
try { meta = JSON.parse(fs.readFileSync(path.join(here, 'module.json'), 'utf8')); }
catch(e){ fail('cannot read ' + path.join(here, 'module.json') + ': ' + e.message); }
try {
  const t = fs.readFileSync(path.join(here, 'test.js'), 'utf8');
  const a = t.match(/^const FIX = (\{.*\});$/m), b = t.match(/^const FIXCOURSE = (\{.*\});$/m);
  if(!a || !b) throw new Error('no line `const FIX = {...};` or `const FIXCOURSE = {...};` in it');
  FIX = JSON.parse(a[1]); FC = JSON.parse(b[1]);
} catch(e){ fail('cannot read the fixtures in ' + path.join(here, 'test.js') + ': ' + e.message); }
if(!Array.isArray(FIX.terms) || !FIX.terms.length || !FC.qs || !FC.qs.length || !FC.topics || !FC.lectures) fail('the fixtures in test.js are incomplete');
const course = path.join(src, 'course.js'), data = path.join(src, 'terms_gtap.js');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', 'glossary-tap', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'glossary-tap'));
const text = fs.readFileSync(course, 'utf8');
if(text.includes('/* glossary-tap ci */')) fail('course.js already switches glossary-tap on (this script runs once per course)');
if(fs.existsSync(data)) fail(data + ' already exists (this script runs once per course)');

const PROF = 'Professor';
const sq = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const prof = o => Object.assign({}, o, {prof: PROF});
// each question a literal in the template's form, `{id:'…', prof:'…', …}`, as browser_test.js counts them
const qLine = q => { const rest = Object.assign({}, q); delete rest.id; delete rest.prof;
  return `{id:${sq(q.id)}, prof:${sq(PROF)}, ` + JSON.stringify(rest).slice(1) + ','; };
// a lecture as a literal, `{id:'L02', …}`, as state_check.js finds it in course.js
const lLine = l => { const rest = prof(l); delete rest.id; return `{id:${sq(l.id)}, ` + JSON.stringify(rest).slice(1); };
const qfile = '/* glossary-tap ci: Intro to Pharmacology (929cd62) topics ' + FC.topics.map(t => t.id).join(', ') + ' and ' + FC.qs.length + ' of its\n' +
  '   questions (FIXCOURSE in features/glossary-tap/current/test.js); prof set to "Professor", nothing else changed */\n' +
  'const TOPICS = ' + JSON.stringify(FC.topics.map(prof)) + ';\n\nconst QUESTIONS = [\n' + FC.qs.map(qLine).join('\n') + '\n];\n';
const terms = '/* glossary-tap ci: Intro to Pharmacology exam1-drill/src/glossary.js (929cd62);\n' +
  '   lecture and fig left out */\nconst TERMS = ' + JSON.stringify(FIX.terms) + ';\n';
const guide = 'const GUIDE_HTML = `\n<h2>Guides</h2>\n<section class="gobj" id="ipguide">\n' + FIX.guide + '\n</section>\n`;\n';
if(/`|\$\{/.test(FIX.guide)) fail('the guide fixture holds a backtick or ${, which guide.js cannot carry');
const line = `\n;/* glossary-tap ci */ COURSE.lectures = [${FC.lectures.map(lLine).join(', ')}]; COURSE.skills = ${JSON.stringify(FC.skills)}; ` +
  `COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat(['terms_gtap.js']); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {"glossary-tap": ${JSON.stringify({version: meta.version})}});\n`;
try {
  fs.writeFileSync(data, terms);
  fs.writeFileSync(path.join(src, 'q1_topics.js'), qfile);
  fs.writeFileSync(path.join(src, 'guide.js'), guide);
  fs.appendFileSync(course, line);
} catch(e){ fail('cannot write in ' + src + ': ' + e.message); }
console.log('wrote: ' + data + ' (' + FIX.terms.length + ' terms)');
console.log('wrote: ' + path.join(src, 'q1_topics.js') + ' (' + FC.topics.length + ' topics, ' + FC.qs.length + ' questions; replaces the template sample)');
console.log('wrote: ' + path.join(src, 'guide.js') + ' (Intro to Pharmacology guide.js sections 1 and 4, opening lines; replaces the template sample)');
console.log('wrote: appended to ' + course + ': lectures ' + FC.lectures.map(l => l.id).join(', ') + ', ' + FC.skills.length + ' skills, terms_gtap.js in files, glossary-tap ' + meta.version + ' on');
