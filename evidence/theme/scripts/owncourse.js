/* owncourse.js <kitDir> <courseSrcDir>: writes the theme test's fixture (FIX in
 * features/theme/current/test.js, read from that file as it stands, with its own fixtureFile()
 * and lectureLine()) into the course as course data: q90_theme_fixture.js in COURSE.files and
 * the deck in COURSE.lectures. This makes the theme module's own course a real-data course
 * (Basic-Pharmacokinetics ac2eb73 questions) for run_checks.sh. Evidence helper, not shipped. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const [kit, src] = process.argv.slice(2);
const t = fs.readFileSync(path.join(kit, 'features/theme/current/test.js'), 'utf8');
const a = t.indexOf('const FIX = {'), b = t.indexOf('\nconst lectureLine', a), c = t.indexOf('\n};\n', b);
if(a < 0 || b < 0 || c < 0) { console.error('owncourse: FIX, fixtureFile or lectureLine not found in test.js'); process.exit(1); }
const ctx = {};
vm.runInNewContext(t.slice(a, c + 3) + '\n;globalThis.out = {file: fixtureFile(), line: lectureLine(), FIXFILE};', ctx);
const out = ctx.out;
const file = path.join(src, out.FIXFILE);
if(fs.existsSync(file)) { console.error('owncourse: ' + file + ' exists'); process.exit(1); }
fs.writeFileSync(file, out.file);
const line = `\n;/* theme own course */ COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat([${JSON.stringify(out.FIXFILE)}]); ${out.line}\n`;
fs.appendFileSync(path.join(src, 'course.js'), line);
console.log('owncourse: wrote ' + file + ' (' + out.file.split('\n').filter(l => l.startsWith("{id:'")).length + ' questions) and appended to course.js:' + line.trimEnd());
