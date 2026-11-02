const {fixture} = require('/tmp/port-integration/fx.js');
const K = '/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3';
const q = fixture(K, 'quiz-prep-cards', 'PK'); console.log(JSON.stringify(q).slice(0, 1200));
const sa = fixture(K, 'short-answer-graphs', 'IP').sa; console.log(JSON.stringify(sa[0]).slice(0, 700));
const p = fixture(K, 'pair-up-drills', 'IP').pairSets; console.log(JSON.stringify(p.map(s => [s.id, s.pairs.length, s.bins])));
console.log(JSON.stringify(p[0]).slice(0, 600));
const ws = fixture(K, 'worksheets-ink', 'PK').sources; console.log(JSON.stringify(ws.map(s => [s.id, s.type, s.module, s.items.length, s.chains])));
const g = fixture(K, 'glossary-tap', 'FIX').terms; console.log(JSON.stringify(g[0]).slice(0, 700));
