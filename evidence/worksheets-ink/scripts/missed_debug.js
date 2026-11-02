/* Which concept core test.js section 7 picks on the real-data course, and its questions. Run from the course's src/. */
const path = require('path');
const L = require(path.join(process.cwd(), 'check_lib'));
const X = L.engine('({QUESTIONS, TOPICS})');
const byC = {};
X.QUESTIONS.forEach(q => (byC[q.concept] ||= []).push(q));
const pair = Object.values(byC).find(a => a.length > 1);
console.log('concept', pair[0].concept, pair.map(q => q.id + '/' + q.topic + '/' + q.sub + (q.dupOf ? ' dupOf ' + q.dupOf : '')).join(', '));
const pool = X.QUESTIONS.filter(q => q.topic === pair[0].topic);
console.log('pool', pool.length, 'of topic', pair[0].topic, 'with that concept:', pool.filter(q => q.concept === pair[0].concept).map(q => q.id).join(' '));
