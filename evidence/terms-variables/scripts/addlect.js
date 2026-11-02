// adds Basic-Pharmacokinetics' lectures L01-L05 and the 5 skills its fixture questions carry
// (src/course.js at ac2eb73, verbatim, prof as the fixture's "PROF") to test.js's const PK
const fs = require('fs');
const pk = require('./loadpk.js');
const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split('\n');
const at = lines.findIndex(l => l.startsWith('const PK = '));
const PK = JSON.parse(lines[at].slice('const PK = '.length).replace(/;$/, ''));
const lectIds = new Set(PK.qs.map(q => q.lecture).concat(PK.terms.map(t => t.lecture)).filter(Boolean));
const skillIds = new Set(PK.qs.map(q => q.skill));
const lectures = pk.COURSE.lectures.filter(l => lectIds.has(l.id)).map(l => Object.assign({}, l, {prof: 'PROF'}));
const skills = pk.COURSE.skills.filter(s => skillIds.has(s.id));
const out = {};
for(const [k, v] of Object.entries(PK)){ out[k] = v; if(k === 'topics'){ out.lectures = lectures; out.skills = skills; } }
lines[at] = 'const PK = ' + JSON.stringify(out) + ';';
fs.writeFileSync(file, lines.join('\n'));
console.log('lectures', lectures.map(l => l.id).join(','), 'skills', skills.map(s => s.id).join(','));
