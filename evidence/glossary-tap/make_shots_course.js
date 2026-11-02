/* Adds the formulas-in-text fixture of features/glossary-tap/test.js to a scratch
 * course for the screenshots: node make_shots_course.js <testJs> <courseSrc>
 * (the same data the test writes into its own scratch copies; glossary-tap first) */
const fs = require('fs'), path = require('path');
const [testJs, src] = process.argv.slice(2);
const t = fs.readFileSync(testJs, 'utf8');
const FIXPK = JSON.parse(t.match(/^const FIXPK = (\{.*\});$/m)[1]);
const SYM = eval(t.match(/const PK_SYMBOLS = (\[[\s\S]*?\]\]);/)[1]);
const PKQ = JSON.parse(t.match(/^const PKQ = (".*");$/m)[1]);
const pre = 'gtp-';
const terms = FIXPK.terms.map(x => Object.assign({}, x, {id: pre + x.id, confuse: (x.confuse || []).map(c => pre + c)}));
const q = FIXPK.qs[0];
fs.writeFileSync(path.join(src, 'q94_shots.js'), `TERMS.length = 0; TERMS.push(...${JSON.stringify(terms)});\n` +
  `QUESTIONS.push(Object.assign(${JSON.stringify(Object.assign({}, q, {id: pre + q.id, concept: pre + q.concept}))}, {prof: COURSE.professors[0], topic: TOPICS[0].id, sub: TOPICS[0].subs[0].id, skill: COURSE.skills[0].id}));\n`);
fs.appendFileSync(path.join(src, 'course.js'), `\n;COURSE.files = COURSE.files.concat(['q94_shots.js']); COURSE.features = {"glossary-tap": {version: 'v1'}, "formulas-in-text": {version: 'v1', symbols: ${JSON.stringify(SYM)}, rates: ['k0', 'ka', 'ke', 'km']}};\n`);
const line = q.teach[0].t;
const html = `<h3 id="gtp-guide-pk">${q.teach[0].h}</h3>\n<p>${line.slice(line.indexOf(': ') + 2)}</p>\n<ul>\n${PKQ}\n</ul>\n`;
const g = path.join(src, 'guide.js'), s = fs.readFileSync(g, 'utf8'), at = s.lastIndexOf('`;');
fs.writeFileSync(g, s.slice(0, at) + '\n<section class="gobj" id="gtp-guide">\n' + html + '</section>\n' + s.slice(at));
console.log('wrote q94_shots.js, the course.js line and the guide section');
