// node compare_old.js <test.js> <fix.json>: each field of the old FIX that differs from the source fixture
const fs = require('fs'), vm = require('vm');
const t = fs.readFileSync(process.argv[2], 'utf8'), line = t.split('\n').find(l => l.startsWith('const FIX = '));
const OLD = vm.runInNewContext(line + ';FIX'), NEW = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const diff = (a, b, p, out) => { if(JSON.stringify(a) === JSON.stringify(b)) return;
  if(a && b && typeof a === 'object' && typeof b === 'object'){ for(const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + '.' + k, out); }
  else out.push(`${p}: old ${JSON.stringify(a)} | source ${JSON.stringify(b)}`); };
const out = [];
OLD.qs.forEach(q => diff(q, NEW.qs.find(x => x.id === q.id), q.id, out));
diff(OLD.topics, NEW.topics, 'topics', out); diff(OLD.lecture, NEW.lecture, 'lecture', out); diff(OLD.skills, NEW.skills, 'skills', out);
console.log(out.join('\n') || 'no difference'); console.log(out.length + ' differences');
