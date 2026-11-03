/* Rework of 2026-11-03 (Louis's porter policy): reads Basic-Pharmacokinetics src (read-only clone, ac2eb73),
   the whole bank in build.py's DATA_FILES order, and writes the concept-statuses fixture as JSON, verbatim:
   10 questions of the topic "infusion" (the 7 of the first fixture and inf-c12, inf-c13, inf-c16, which the
   first selection had passed over because their text names the professor by a pronoun), that topic, the
   lecture they cite (L04) and the skills they use; and CONCEPT_WORDS from src/views.js. Nothing is changed:
   prof, teachImg and every text field are the course's own. It also writes the slide images that the
   questions' teachImg fields name, byte for byte from src/images.json, as files <key>.<ext>.
     node extract_fix.js <pkSrc> <fix.json> <words.json> <imagesDir> */
const fs = require('fs'), vm = require('vm'), path = require('path');
const [SRC, OUT, WOUT, IDIR] = process.argv.slice(2);
const ctx = {}; vm.createContext(ctx);
const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8') + (f === 'course.js' ? '\n;globalThis.__C = COURSE;' : ''), ctx, {filename: f});
const BANK = vm.runInContext('QUESTIONS', ctx), TOPICS = vm.runInContext('TOPICS', ctx), C = ctx.__C;
const views = fs.readFileSync(path.join(SRC, 'views.js'), 'utf8');
const m = views.match(/^const CONCEPT_WORDS = (\{[\s\S]*?\});$/m);
const WORDS = vm.runInNewContext('(' + m[1] + ')');
const IDS = ['inf-c4', 'inf-c5', 'inf-c11', 'cq2-4', 'inf-n1', 'inf-n2', 'inf-n4', 'inf-c12', 'inf-c13', 'inf-c16'];
const fileOf = id => FILES.find(f => fs.readFileSync(path.join(SRC, f), 'utf8').includes(`{id:'${id}'`));
const qs = IDS.map(id => { const q = BANK.find(x => x.id === id); if(!q) throw new Error('no question ' + id); return JSON.parse(JSON.stringify(q)); });
const notes = [];
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
qs.forEach(q => {
  if(fig.test(q.stem)) notes.push(q.id + ': figure-promise word in the stem');
  if(/given as/i.test(q.stem)) notes.push(q.id + ': "given as" in the stem');
  if(q.dupOf && !IDS.includes(q.dupOf)) notes.push(q.id + ': dupOf ' + q.dupOf + ' not in the fixture');
});
const tids = [...new Set(qs.map(q => q.topic))];
const topics = TOPICS.filter(t => tids.includes(t.id)).map(t => JSON.parse(JSON.stringify(t)));
const lids = [...new Set(qs.map(q => q.lecture))];
if(lids.length !== 1) throw new Error('lectures ' + lids);
const lecture = JSON.parse(JSON.stringify(C.lectures.find(l => l.id === lids[0])));
if(!qs.every(q => String(q.cite).includes(lecture.deck))) notes.push('a question cites no ' + lecture.deck);
const sk = [...new Set(qs.map(q => q.skill))];
const skills = C.skills.filter(s => sk.includes(s.id)).map(s => JSON.parse(JSON.stringify(s)));
const out = {qs, topics, lecture, skills};
fs.writeFileSync(OUT, JSON.stringify(out));
fs.writeFileSync(WOUT, JSON.stringify(WORDS));
const IMG = JSON.parse(fs.readFileSync(path.join(SRC, 'images.json'), 'utf8'));
fs.mkdirSync(IDIR, {recursive: true});
const keys = [...new Set(qs.filter(q => q.teachImg).map(q => q.teachImg))];
for(const k of keys){
  const v = IMG[k]; if(!v) throw new Error('images.json has no ' + k);
  const mm = v.match(/^data:image\/([a-z]+);base64,(.*)$/); if(!mm) throw new Error(k + ' is not a base64 data URL');
  fs.writeFileSync(path.join(IDIR, k + '.' + mm[1]), Buffer.from(mm[2], 'base64'));
  if('data:image/' + mm[1] + ';base64,' + fs.readFileSync(path.join(IDIR, k + '.' + mm[1])).toString('base64') !== v) throw new Error(k + ' does not round-trip');
  console.log('image', k, mm[1], v.length, 'chars, round-trips');
}
console.log('questions', qs.map(q => `${q.id} (${fileOf(q.id)}, ${q.concept}, ${q.type || (q.multi ? 'select-all' : 'mcq')}, prof ${q.prof}${q.teachImg ? ', teachImg ' + q.teachImg : ''})`).join('; '));
console.log('topics', topics.map(t => t.id + ' (' + t.subs.length + ' subs, prof ' + t.prof + ')').join(', '));
console.log('lecture', JSON.stringify(lecture));
console.log('skills', skills.map(s => s.id).join(', '));
console.log('CONCEPT_WORDS entries', Object.keys(WORDS).length);
console.log('findings:', notes.join('; ') || 'none');
