// Extracts the notes test's course data from Basic-Pharmacokinetics (read-only clone /tmp/pk-readonly,
// ac2eb73): course.js lectures L11 and L12, skills pkpd and nonlin, the topics pkpd (q15_module7b.js)
// and nonlin (q16_module8.js) with the subtopics the chosen questions are in, and 16 questions
// (q13_quizzes.js, q15_module7b.js, q16_module8.js), as the engine reads them (each file evaluated,
// so a section a file writes once and shares, such as NL_RATE, is in each question that uses it).
// The one change: every `prof` is "Professor". Prints the `const FIX = ...` block for test.js and,
// to stderr, a check that the professor's name (read from course.js, never printed) and the
// pronouns she/her are nowhere in it.
const fs = require('fs'), vm = require('vm');
const S = '/tmp/pk-readonly/src/';
const rd = f => fs.readFileSync(S + f, 'utf8');
const code = rd('course.js') + '\nvar TOPICS=[];var CHAINS=[];\n' + rd('q13_quizzes.js') + '\n' + rd('q15_module7b.js') + '\n' + rd('q16_module8.js') +
  '\n;globalThis.__R={COURSE,TOPICS,Q:[].concat(Q_QUIZZES,Q_MODULE7B,Q_MODULE8)};';
const c = {}; vm.createContext(c); vm.runInContext(code, c);
const R = JSON.parse(JSON.stringify(c.__R));
const {COURSE, TOPICS, Q} = R;
const NAME = COURSE.professors[0];
const IDS = ['cq5-1', 'pd-c20', 'pd-c01', 'pd-c02', 'pd-c04', 'pd-c06', 'pd-c22', 'pd-ex-b',
             'cq5-6', 'nl-c04', 'nl-c02', 'nl-c03', 'nl-c05', 'nl-c06', 'nl-ex1', 'nl-ex2a'];
const P = o => Object.assign({}, o, {prof: 'Professor'});
const qs = IDS.map(id => { const q = Q.find(x => x.id === id); if(!q) throw new Error('no ' + id); return P(q); });
const tids = ['pkpd', 'nonlin'];
const topics = tids.map(t => { const x = TOPICS.find(y => y.id === t); return P(Object.assign({}, x, {subs: x.subs.filter(s => qs.some(q => q.topic === t && q.sub === s.id))})); });
const lectures = ['L11', 'L12'].map(id => P(COURSE.lectures.find(l => l.id === id)));
const skills = ['pkpd', 'nonlin'].map(id => COURSE.skills.find(s => s.id === id));
// every dupOf names a question of the set
qs.forEach(q => { if(q.dupOf && !IDS.includes(q.dupOf)) throw new Error(q.id + ' dupOf ' + q.dupOf + ' is not in the set'); });
const J = JSON.stringify;
let out = 'const FIX = {\n';
out += '  lectures: [\n' + lectures.map(l => '    ' + J(l)).join(',\n') + '],\n';
out += '  skills: [\n' + skills.map(l => '    ' + J(l)).join(',\n') + '],\n';
out += '  topics: [\n' + topics.map(l => '    ' + J(l)).join(',\n') + '],\n';
out += '  qs: [\n' + qs.map(l => '    ' + J(l)).join(',\n') + '\n  ]};\n';
process.stdout.write(out);
const low = out.toLowerCase();
console.error(`questions ${qs.length} (${qs.filter(q => !q.type).length} multiple-choice, of them ${qs.filter(q => q.multi).length} select-all; ${qs.filter(q => q.type === 'numeric').length} numeric), topics ${topics.length} (subs ${topics.map(t => t.subs.length).join('+')}), lectures ${lectures.length}, skills ${skills.length}`);
console.error(`the professor's name in the block: ${low.split(NAME.toLowerCase()).length - 1}; she/her/hers: ${(out.match(/\b(she|her|hers|herself)\b/gi) || []).length}; "given as": ${(out.match(/given as/gi) || []).length}; bytes ${out.length}`);
