// node gentest.js <tpl> <fix_line.txt> <out test.js>: puts the FIX line into the test template
const fs = require('fs');
const [tpl, fix, out] = process.argv.slice(2);
let t = fs.readFileSync(tpl, 'utf8');
const f = fs.readFileSync(fix, 'utf8').trim();
if(t.split('/*FIX*/').length !== 2) throw new Error('template has no single /*FIX*/');
t = t.replace('/*FIX*/', () => f);
fs.writeFileSync(out, t);
console.log('wrote', out, t.length, 'characters');
