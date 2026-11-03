/* glossary-tap: build the module's own course in a fresh scratch course, for the kit's CI.
 *
 *     node features/glossary-tap/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The course is Intro to Pharmacology's own data at 929cd62, read from the fixtures
 * in the kit's features/glossary-tap/current/test.js (`const FIX` and `const
 * FIXCOURSE`, copied as they are, every `prof` the source's own). Nothing is
 * invented and no text is changed. It writes only inside <courseSrcDir>, and adds to
 * what the course has (CIDATA rule 1): it runs on a fresh template course and on a
 * course other modules' scripts have already written to.
 *   - terms_gtap.js: FIX.terms (glossary.js; each term's lecture and fig left out),
 *     added to TERMS when the course already declares it;
 *   - q90_gtap_course.js: FIXCOURSE's topics added to TOPICS and its questions to
 *     QUESTIONS (see its comment in test.js), after the course's own;
 *   - images.json: the images FIXCOURSE's questions name, added (keys prefixed too);
 *   - guide.js: FIX.guide (guide.js sections 1 and 4, opening lines) added as one
 *     section at the end of GUIDE_HTML;
 *   - course.js, one line appended: FIXCOURSE's lectures added to COURSE.lectures,
 *     the course's professors added to COURSE.professors and its skills to
 *     COURSE.skills (each only when the course does not hold it yet),
 *     q90_gtap_course.js and terms_gtap.js added to `files`, and the module switched
 *     on at the version in its module.json, beside any module already on.
 * Ids (CIDATA rule 2): every lecture, topic, subtopic and question id is written with
 * the prefix `gtap-` in front of the course's own id (L04 -> gtap-L04, L04-009 ->
 * gtap-L04-009, subtopic recap -> gtap-recap), and every reference to one (a
 * question's lecture, topic, sub, dupOf and img; a topic's lecture) is rewritten the same
 * way. The script stops when any of those ids is already in the course.
 * Prints what it wrote. Stops with a non-zero exit on any failure, including a
 * course it has already been run on (it runs once per fresh course).
 */
const fs = require('fs'), path = require('path');
function fail(msg){ console.error('glossary-tap ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/glossary-tap/ci/oncourse.js <kitDir> <courseSrcDir>');
const here = path.join(kit, 'features', 'glossary-tap', 'current');
const PRE = 'gtap-', TAG = '/* glossary-tap ci */', QFILE = 'q90_gtap_course.js', TFILE = 'terms_gtap.js';
let meta, FIX, FC;
try { meta = JSON.parse(fs.readFileSync(path.join(here, 'module.json'), 'utf8')); }
catch(e){ fail('cannot read ' + path.join(here, 'module.json') + ': ' + e.message); }
try {
  const t = fs.readFileSync(path.join(here, 'test.js'), 'utf8');
  const a = t.match(/^const FIX = (\{.*\});$/m), b = t.match(/^const FIXCOURSE = (\{.*\});$/m);
  if(!a || !b) throw new Error('no line `const FIX = {...};` or `const FIXCOURSE = {...};` in it');
  FIX = JSON.parse(a[1]); FC = JSON.parse(b[1]);
} catch(e){ fail('cannot read the fixtures in ' + path.join(here, 'test.js') + ': ' + e.message); }
if(!Array.isArray(FIX.terms) || !FIX.terms.length || !FC.qs || !FC.qs.length || !FC.topics || !FC.lectures || !FC.professors) fail('the fixtures in test.js are incomplete');
const course = path.join(src, 'course.js'), tfile = path.join(src, TFILE), qfile = path.join(src, QFILE);
const gfile = path.join(src, 'guide.js'), imgFile = path.join(src, 'images.json');
if(!fs.existsSync(course)) fail(course + ' does not exist');
if(!fs.existsSync(path.join(src, 'features', 'glossary-tap', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'glossary-tap'));
const text = fs.readFileSync(course, 'utf8');
if(text.includes(TAG)) fail('course.js already switches glossary-tap on (this script runs once per course)');
for(const f of [tfile, qfile]) if(fs.existsSync(f)) fail(f + ' already exists (this script runs once per course)');
let COURSE;
try { COURSE = new Function(text + '\n;return COURSE;')(); } catch(e){ fail('course.js cannot be read: ' + e.message); }
const files = COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js'];
const read = f => { try { return fs.readFileSync(path.join(src, f), 'utf8'); } catch(e){ return ''; } };
const declared = name => files.some(f => new RegExp(`^\\s*(const|let|var)\\s+${name}\\b`, 'm').test(read(f)));
// no id this script writes may be in the course already (rule 2)
const all = files.map(read).join('\n') + '\n' + text;
if(all.includes(`'${PRE}`) || all.includes(`"${PRE}`)) fail(`the course already holds an id that starts with ${PRE}`);
let images;
try { images = JSON.parse(fs.readFileSync(imgFile, 'utf8')); } catch(e){ fail('images.json cannot be read: ' + e.message); }
const imgs = FC.images || {};
for(const k of Object.keys(imgs)) if(images[PRE + k]) fail(`images.json already has ${PRE + k}`);
let guide;
try { guide = fs.readFileSync(gfile, 'utf8'); } catch(e){ fail('guide.js cannot be read: ' + e.message); }
const gEnd = guide.lastIndexOf('`;');
if(gEnd < 0) fail('guide.js has no GUIDE_HTML template string ending in `;');
if(/`|\$\{/.test(FIX.guide)) fail('the guide fixture holds a backtick or ${, which guide.js cannot carry');

const p = id => PRE + id;
const lit = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const topics = FC.topics.map(t => Object.assign({}, t, {id: p(t.id), lecture: t.lecture && p(t.lecture),
  subs: (t.subs || []).map(s => Object.assign({}, s, {id: p(s.id)}))}));
// each question a literal in the template's form, `{id:'…', prof:'…', …}`, as browser_test.js counts them
const qLine = q => { const rest = Object.assign({}, q); delete rest.id; delete rest.prof;
  for(const k of ['lecture', 'topic', 'sub', 'dupOf', 'img']) if(rest[k] !== undefined) rest[k] = p(rest[k]);
  return `{id:${lit(p(q.id))}, prof:${lit(q.prof)}, ` + JSON.stringify(rest).slice(1) + ','; };
// a lecture as a literal, `{id:'gtap-L04', …}`, as state_check.js finds it in course.js
const lLine = l => { const rest = Object.assign({}, l); delete rest.id; return `{id:${lit(p(l.id))}, ` + JSON.stringify(rest).slice(1); };
const qbody = `${TAG.slice(0, -3)}: Intro to Pharmacology (929cd62) topics ${FC.topics.map(t => t.id).join(', ')} and ${FC.qs.length} of
   its questions (FIXCOURSE in features/glossary-tap/current/test.js), as they stand; ids prefixed ${PRE} */
TOPICS.push(...${JSON.stringify(topics)});
QUESTIONS.push(
${FC.qs.map(qLine).join('\n')}
);
`;
const tbody = `${TAG.slice(0, -3)}: Intro to Pharmacology exam1-drill/src/glossary.js (929cd62);
   each term's lecture and fig left out */
` + (declared('TERMS') ? `TERMS.push(...${JSON.stringify(FIX.terms)});\n` : `const TERMS = ${JSON.stringify(FIX.terms)};\n`);
const guide2 = guide.slice(0, gEnd) + '\n<section class="gobj" id="gtap-ipguide">\n' + FIX.guide + '\n</section>\n' + guide.slice(gEnd);
const knownSkill = new Set((COURSE.skills || []).map(s => s.id)), knownProf = new Set(COURSE.professors || []);
const skills = FC.skills.filter(s => !knownSkill.has(s.id)), profs = FC.professors.filter(n => !knownProf.has(n));
const line = `\n;${TAG} COURSE.lectures = (COURSE.lectures || []).concat([${FC.lectures.map(lLine).join(', ')}]); ` +
  `COURSE.professors = (COURSE.professors || []).concat(${JSON.stringify(profs)}); ` +
  `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` +
  `COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(QFILE)}, ${JSON.stringify(TFILE)}]); ` +
  `COURSE.features = Object.assign({}, COURSE.features, {"glossary-tap": ${JSON.stringify({version: meta.version})}});\n`;
for(const k of Object.keys(imgs)) images[PRE + k] = imgs[k];
try {
  fs.writeFileSync(tfile, tbody);
  fs.writeFileSync(qfile, qbody);
  fs.writeFileSync(gfile, guide2);
  fs.writeFileSync(imgFile, JSON.stringify(images));
  fs.appendFileSync(course, line);
} catch(e){ fail('cannot write in ' + src + ': ' + e.message); }
console.log('wrote: ' + tfile + ' (' + FIX.terms.length + ' terms)');
console.log('wrote: ' + qfile + ' (topics ' + topics.map(t => t.id).join(', ') + '; ' + FC.qs.length + ' questions)');
console.log('wrote: ' + gfile + ' (Intro to Pharmacology guide.js sections 1 and 4, opening lines, added at the end)');
console.log('wrote: ' + imgFile + ' (' + Object.keys(imgs).length + ' image(s) added' + (Object.keys(imgs).length ? ': ' + Object.keys(imgs).map(p).join(', ') : '') + ')');
console.log('wrote: appended to ' + course + ': lectures ' + FC.lectures.map(l => p(l.id)).join(', ') + '; ' + profs.length + ' professor(s) and ' +
  skills.length + ' skill(s) the course lacked (' + skills.map(k => k.id).join(', ') + '); ' + QFILE + ' and ' + TFILE + ' in files; glossary-tap ' + meta.version + ' on');
