/* survey4.js <pkSrc> <id> ...: fields, lecture, skill, cite, setup eq and dupOf of each question in the whole bank */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2];
const ctx = {}; vm.createContext(ctx);
const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8') + (f === 'course.js' ? '\n;globalThis.__C = COURSE;' : ''), ctx, {filename: f});
const Q = vm.runInContext('QUESTIONS', ctx);
for(const id of process.argv.slice(3)){
  const q = Q.find(x => x.id === id);
  const file = FILES.find(f => new RegExp("\\{id:'" + id + "'").test(fs.readFileSync(path.join(SRC, f), 'utf8')));
  console.log(id, file, q.type || 'mcq', 'skill', q.skill, 'lecture', q.lecture, 'topic', q.topic + '/' + q.sub, q.dupOf ? 'dupOf ' + q.dupOf : '', q.setup ? 'eq ' + q.setup.eq : '',
    '\n   fields', Object.keys(q).join(','), '\n   cite', q.cite);
}
