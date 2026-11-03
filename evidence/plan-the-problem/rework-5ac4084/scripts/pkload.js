/* Loads Basic-Pharmacokinetics (read-only clone, src/) data as PK's own build orders it:
   build.py DATA_FILES then the three equation files; ASKS from shell.html; the plan
   tables from views.js. Usage: require('./pkload')(srcDir) -> {QUESTIONS, TOPICS, COURSE, EQUATIONS, ASKS, PLAN_MODELS, PLAN_TOPIC, UNIT_POOL, CALC_ROUTINE_HTML} */
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function(src){
  const py = fs.readFileSync(path.join(src, 'build.py'), 'utf8');
  const listOf = name => { const m = py.match(new RegExp(name + " = \\[([\\s\\S]*?)\\]")); return [...m[1].matchAll(/'([^']+\.js)'/g)].map(x => x[1]); };
  const data = listOf('DATA_FILES'), content = listOf('CONTENT_FILES').filter(f => /^eq/.test(f));
  const read = f => fs.readFileSync(path.join(src, f), 'utf8');
  const shell = read('shell.html'), views = read('views.js');
  const grab = (txt, start, endRe) => { const i = txt.indexOf(start); if(i < 0) throw new Error('missing ' + start); const rest = txt.slice(i); const m = endRe.exec(rest); return rest.slice(0, m.index + m[0].length); };
  const asks = grab(shell, 'const ASKS = {', /\n};/);
  const pm = grab(views, 'const PLAN_MODELS = [', /\]\];/), pt = grab(views, 'const PLAN_TOPIC = {', /};/),
        up = grab(views, 'const UNIT_POOL = [', /\];/), cr = grab(views, 'const CALC_ROUTINE_HTML = `', /<\/details>`;/);
  const code = data.concat(content).map(read).join('\n;\n') + '\n' + asks + '\n' + pm + '\n' + pt + '\n' + up + '\n' + cr +
    '\n;globalThis.__PK = {QUESTIONS, TOPICS, COURSE, EQUATIONS, ASKS, PLAN_MODELS, PLAN_TOPIC, UNIT_POOL, CALC_ROUTINE_HTML};';
  const ctx = {console}; vm.createContext(ctx); vm.runInContext(code, ctx, {filename: 'pk-data'});
  return {files: data.concat(content), ...JSON.parse(JSON.stringify(ctx.__PK))};
};
