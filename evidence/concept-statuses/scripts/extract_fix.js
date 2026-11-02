/* Reads Basic-Pharmacokinetics src (read-only clone, ac2eb73), the whole bank in build.py's DATA_FILES order,
   and writes the concept-statuses fixture as JSON: 7 questions of the topic "infusion", that topic, the
   lecture they cite (L04) and the skills they use; and CONCEPT_WORDS from src/views.js.
   The one change to the data: prof -> 'Professor'. teachImg is left out and reported.
   It also reports, for each question, any personal name or pronoun in its text, a figure-promise word
   (browser_test.js) or "given as" (style_check.js) in its stem, and a dupOf that is not in the fixture.
     node extract_fix.js <pkSrc> <fix.json> <words.json> */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2];
const ctx = {}; vm.createContext(ctx);
const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8') + (f === 'course.js' ? '\n;globalThis.__C = COURSE;' : ''), ctx, {filename: f});
const BANK = vm.runInContext('QUESTIONS', ctx), TOPICS = vm.runInContext('TOPICS', ctx), C = ctx.__C;
const views = fs.readFileSync(path.join(SRC, 'views.js'), 'utf8');
const m = views.match(/^const CONCEPT_WORDS = (\{[\s\S]*?\});$/m);
const WORDS = vm.runInNewContext('(' + m[1] + ')');
// inf-c11 and cq2-4: two wordings of loading-purpose; inf-c5: wrong options with their why; inf-n1: a calculation;
// inf-c4, inf-n2, inf-n4: further concepts of the topic
const IDS = ['inf-c4', 'inf-c5', 'inf-c11', 'cq2-4', 'inf-n1', 'inf-n2', 'inf-n4'];
const P = 'Professor', prof0 = C.professors[0];
const fileOf = id => FILES.find(f => fs.readFileSync(path.join(SRC, f), 'utf8').includes(`{id:'${id}'`));
const qs = IDS.map(id => { const q = BANK.find(x => x.id === id); if(!q) throw new Error('no question ' + id); return JSON.parse(JSON.stringify(q)); });
const dropped = [], notes = [];
const fig = /\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\b/i;
qs.forEach(q => {
  if(q.prof !== prof0) throw new Error('prof ' + q.prof);
  q.prof = P;
  if('teachImg' in q){ dropped.push(q.id + ' teachImg ' + q.teachImg); delete q.teachImg; }
  const t = JSON.stringify(q);
  const names = t.match(new RegExp(prof0 + '|\\bDr\\.|\\bshe\\b|\\bher\\b|\\bhers\\b|\\bhe\\b|\\bhis\\b|\\bhim\\b', 'gi'));
  if(names) notes.push(q.id + ': names or pronouns ' + names.join(','));
  if(fig.test(q.stem)) notes.push(q.id + ': figure-promise word in the stem');
  if(/given as/i.test(q.stem)) notes.push(q.id + ': "given as" in the stem');
  if(q.dupOf && !IDS.includes(q.dupOf)) notes.push(q.id + ': dupOf ' + q.dupOf + ' not in the fixture');
});
const tids = [...new Set(qs.map(q => q.topic))];
const topics = TOPICS.filter(t => tids.includes(t.id)).map(t => Object.assign(JSON.parse(JSON.stringify(t)), {prof: P}));
const lids = [...new Set(qs.map(q => q.lecture))];
if(lids.length !== 1) throw new Error('lectures ' + lids);
const lecture = Object.assign(JSON.parse(JSON.stringify(C.lectures.find(l => l.id === lids[0]))), {prof: P});
if(!qs.every(q => String(q.cite).includes(lecture.deck))) notes.push('a question cites no ' + lecture.deck);
const sk = [...new Set(qs.map(q => q.skill))];
const skills = C.skills.filter(s => sk.includes(s.id)).map(s => JSON.parse(JSON.stringify(s)));
const out = {qs, topics, lecture, skills};
fs.writeFileSync(process.argv[3], JSON.stringify(out));
fs.writeFileSync(process.argv[4], JSON.stringify(WORDS));
console.log('questions', qs.map(q => `${q.id} (${fileOf(q.id)}, ${q.concept}, ${q.type || 'mcq'})`).join('; '));
console.log('topics', topics.map(t => t.id + ' (' + t.subs.length + ' subs)').join(', '));
console.log('lecture', JSON.stringify(lecture));
console.log('skills', skills.map(s => s.id).join(', '));
console.log('CONCEPT_WORDS entries', Object.keys(WORDS).length);
console.log('left out (not in the kit):', dropped.join('; ') || 'nothing');
console.log('findings:', notes.join('; ') || 'none');
console.log(`remaining "${prof0}" in the fixture:`, (JSON.stringify(out).match(new RegExp(prof0, 'g')) || []).length);
