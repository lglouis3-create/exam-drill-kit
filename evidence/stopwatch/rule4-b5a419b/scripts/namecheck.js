// namecheck.js FILE|DIR... : count lines that hold the professor's name (read from the read-only PK course.js,
// so the name is never written into a file or a command). Exit 1 when any is found.
const fs = require('fs'), path = require('path');
const name = require('/tmp/port-stopwatch-h/scripts/pkload.js').COURSE.professors[0];
const re = new RegExp(name, 'i');
let hits = 0;
const walk = p => {
  const st = fs.statSync(p);
  if(st.isDirectory()){ for(const f of fs.readdirSync(p)) if(f !== '.git') walk(path.join(p, f)); return; }
  if(st.size > 50e6) return;
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  lines.forEach((l, i) => { if(re.test(l)){ hits++; console.log(`${p}:${i + 1}: holds the name`); } });
};
process.argv.slice(2).forEach(walk);
console.log(`name check: ${hits} line(s) hold the professor's name`);
process.exit(hits ? 1 : 0);
