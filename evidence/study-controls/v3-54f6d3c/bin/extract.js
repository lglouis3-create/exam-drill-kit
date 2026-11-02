// Reads Intro-Pharmacology- exam1-drill/src at 929cd62 (read-only clone) and prints the FIX data verbatim as JSON.
const fs = require('fs'), vm = require('vm'), path = require('path');
const S = '/tmp/ip-readonly/exam1-drill/src';
const sb = {TOPICS: [], QUESTIONS: []}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(S, 'q_L01.js'), 'utf8'), sb);
const ids = ['L01-002', 'L01-004', 'L01-005', 'L01-006', 'L01-003', 'L01-007'];
const qs = ids.map(id => sb.QUESTIONS.find(q => q.id === id));
const t = sb.TOPICS.find(t => t.id === 'L01');
const c = {}; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(S, 'course.js'), 'utf8') + ';globalThis.C = COURSE;', c);
const lec = c.C.lectures.find(l => l.id === 'L01');
const app = fs.readFileSync(path.join(S, 'app.js'), 'utf8').split('\n')[677];
const m = app.match(/item\("([^"]+)", '([^']+)'/);
process.stdout.write(JSON.stringify({topic: t, lecture: lec, qs, note: {quote: m[1], when: m[2], line: 678}}));
