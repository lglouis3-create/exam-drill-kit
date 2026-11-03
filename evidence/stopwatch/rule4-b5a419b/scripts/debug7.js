// Which concept core test.js section 7 picks on the module's course, and what that topic holds.
//   node debug7.js <courseSrcDir>
const src = process.argv[2];
process.chdir(src);
const L = require(src + '/check_lib.js');
const X = L.engine('({QUESTIONS, TOPICS, record, pickNext, getDB: () => DB})');
const byC = {};
X.QUESTIONS.forEach(q => (byC[q.concept] ||= []).push(q));
const pair = Object.values(byC).find(a => a.length > 1);
console.log('pair', pair.map(q => [q.id, q.type || '-', q.dupOf || '', q.topic]));
const pool = X.QUESTIONS.filter(q => q.topic === pair[0].topic);
console.log('topic pool', pool.map(q => q.id + ':' + q.concept + (q.type ? ':' + q.type : '')).join(' '));
X.getDB().concepts = {}; X.getDB().answers = []; X.getDB().qn = 0;
X.record(pair[0], 'wrong');
const log = [];
for (let i = 0; i < 6; i++){ const n = X.pickNext(pool.filter(q => q.concept !== pair[0].concept), null); log.push('pre:' + (n && n.id)); if(n) X.record(n, 'correct'); }
for (let i = 0; i < 60; i++){ const n = X.pickNext(pool, null); log.push(n ? n.id : 'null'); if(!n) break; if(n.concept === pair[0].concept) break; X.record(n, 'correct'); }
console.log(log.join(' '));
console.log(JSON.stringify(X.getDB().concepts[pair[0].concept]));
