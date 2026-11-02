// Prints the FIX block for test.js from fix.json (extract.js output). The one change to the data:
// every `prof` (the professor's name in the source) becomes the template's 'Professor'.
const f = require('/tmp/port-study-controls/v3/fix.json');
const P = 'Professor';
const set = o => Object.assign({}, o, {prof: P});
const topic = set(f.topic), lecture = set(f.lecture), qs = f.qs.map(set);
const note = `${f.note.when}: "${f.note.quote}"`;
const out = [
  '/* The course data of this test and of ../ci/oncourse.js, verbatim from Intro-Pharmacology-',
  '   exam1-drill/src at 929cd62: the Day 1 topic (q_L01.js line 1), its lecture (course.js',
  '   `lectures`, id L01), 6 of its questions (q_L01.js: L01-002, -004, -005, -006 single-answer;',
  '   L01-003, -007 select-all) and the professor\'s 10/21 answer on going back to a question',
  '   (app.js line 678), the strict-paper note. The one change: `prof` is the template\'s',
  '   "Professor" (the source names the professor). WRITE below says how it is written into a course. */',
  'const FIX = {',
  `  topic: ${JSON.stringify(topic)},`,
  `  lecture: ${JSON.stringify(lecture)},`,
  `  strictNote: ${JSON.stringify(note)},`,
  '  qs: [',
  qs.map(q => '    ' + JSON.stringify(q)).join(',\n'),
  '  ]};',
];
process.stdout.write(out.join('\n') + '\n');
