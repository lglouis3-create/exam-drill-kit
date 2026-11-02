/* typed.js <kit> <courseSrc>: one course.js line, calculations on the papers (exams[].typed), so that
 * keys_test.js can open worksheets-ink's Scratch paper over a paper's calculation. Writes only course.js. */
const fs = require('fs'), path = require('path');
const [, SRC] = process.argv.slice(2);
fs.appendFileSync(path.join(SRC, 'course.js'), '\n;/* typed papers */ COURSE.exams.forEach(e => { e.typed = true; });\n');
console.log('typed.js: appended COURSE.exams.forEach(e => { e.typed = true; }) to course.js');
