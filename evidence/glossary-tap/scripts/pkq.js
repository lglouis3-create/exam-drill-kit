// read-only: PK terms named in ws6-i3-2c, and PK term names that hold a formulas-in-text mark
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = '/tmp/pk-readonly/src';
const sb = {console}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(D, 'glossary.js'), 'utf8') + '\n;this.__T = TERMS;', sb);
const T = sb.__T;
const line = fs.readFileSync(path.join(D, 'q9_worksheets.js'), 'utf8').split('\n').find(l => l.startsWith('{"id": "ws6-i3-2c"'));
const q = JSON.parse(line.replace(/,\s*$/, ''));
const text = q.options.map(o => o.why).join(' ') + ' ' + q.teach.map(s => s.list.join(' ')).join(' ');
const nameOf = t => String(t.term).replace(/\s*\([^)]*\)\s*$/, '').trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hit = T.filter(t => new RegExp('(^|[^A-Za-z0-9])' + reEsc(nameOf(t)) + '(e?s)?(?![A-Za-z0-9])', 'i').test(text));
console.log('named in ws6-i3-2c:', hit.map(t => t.id + ' = ' + t.term + ' [' + t.group + ']').join('\n  '));
console.log('names with ^, {{, t1/2, spaced x or -, or a digit:', T.filter(t => /\^|\{\{|t1\/2| x | - |\d/.test(nameOf(t))).map(t => t.term));
console.log('keys:', Object.keys(hit[0]));
console.log(JSON.stringify(q.teach));
