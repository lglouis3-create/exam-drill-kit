// Prints the FIX constant for features/theme/current/test.js from fix.json (pick.js output):
// PK's topic, lecture and questions verbatim, with `prof` set to the template's "Professor"
// (the one change to the data). Ids are prefixed when the fixture is written, not here.
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const P = 'Professor';
const topic = Object.assign({}, d.topics[0], {prof: P});
const lecture = Object.assign({}, d.lectures[0], {prof: P});
const qs = d.qs.map(q => Object.assign({}, q, {prof: P}));
const lines = [];
lines.push('const FIX = {');
lines.push('  topic: ' + JSON.stringify(topic) + ',');
lines.push('  lecture: ' + JSON.stringify(lecture) + ',');
lines.push('  qs: [');
qs.forEach(q => lines.push('    ' + JSON.stringify(q) + ','));
lines.push('  ],');
lines.push('};');
process.stdout.write(lines.join('\n') + '\n');
