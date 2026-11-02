// fx.js: read a fixture constant from a module's test.js, verbatim (the one-line `const X = ...;`).
const fs = require('fs'), path = require('path'), vm = require('vm');
function fixture(kit, mod, name){
  const t = fs.readFileSync(path.join(kit, 'features', mod, 'current', 'test.js'), 'utf8');
  const m = t.match(new RegExp('^const ' + name + ' = (.*);\\s*$', 'm'));
  if(!m) throw new Error(`${mod}: no one-line const ${name}`);
  try { return JSON.parse(m[1]); } catch(e) { return vm.runInNewContext('(' + m[1] + ')'); }
}
module.exports = {fixture};
if(require.main === module){
  const [kit, mod, name] = process.argv.slice(2);
  const v = fixture(kit, mod, name);
  const desc = x => Array.isArray(x) ? `array(${x.length})` + (x[0] && typeof x[0] === 'object' ? ' of {' + Object.keys(x[0]).join(',') + '}' : '') :
    (x && typeof x === 'object') ? '{' + Object.keys(x).map(k => k + ':' + desc(x[k])).join(', ') + '}' : JSON.stringify(x).slice(0, 60);
  console.log(mod, name, desc(v));
}
