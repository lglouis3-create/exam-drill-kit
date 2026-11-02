/* pp_off.js <kit> <courseSrc>: one course.js line that switches paper-picker off again, after its
 * ci/oncourse.js wrote its Basic-Pharmacokinetics 3-exam course: the exams, lectures and questions
 * stay, the module is not on. Writes only course.js. */
const fs = require('fs'), path = require('path');
const [, SRC] = process.argv.slice(2);
fs.appendFileSync(path.join(SRC, 'course.js'), "\n;/* paper-picker off */ COURSE.features = Object.assign({}, COURSE.features); delete COURSE.features['paper-picker'];\n");
console.log("pp_off.js: appended a line that removes paper-picker from COURSE.features (its course data stays)");
