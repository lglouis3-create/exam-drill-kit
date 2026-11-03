// module: load Basic-Pharmacokinetics src (read-only) bank: {QUESTIONS, TOPICS, COURSE, OBJECTIVES, CALC_TYPES, CHAINS}
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = SRC => {
  const ctx = {console}; vm.createContext(ctx);
  const FILES = fs.readFileSync(path.join(SRC, 'build.py'), 'utf8').match(/DATA_FILES = \[([\s\S]*?)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
  for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8') + (f === 'course.js' ? '\n;globalThis.__C = COURSE;' : ''), ctx, {filename: f});
  const g = n => vm.runInContext(`typeof ${n} === 'undefined' ? null : ${n}`, ctx);
  return {QUESTIONS: g('QUESTIONS'), TOPICS: g('TOPICS'), COURSE: ctx.__C, OBJECTIVES: g('OBJECTIVES'), CALC_TYPES: g('CALC_TYPES'), CHAINS: g('CHAINS'), FILES,
          fileOf: id => FILES.find(f => fs.readFileSync(path.join(SRC, f), 'utf8').includes(`{id:'${id}'`))};
};
