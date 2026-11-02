#!/usr/bin/env node
/* module-pages: switch the module on in a fresh scratch course, for the kit's CI
 * (the shape agreed in PR #12). Outside current/, so a course never copies it.
 *
 *     node features/module-pages/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module's course data (OBJECTIVES, CALC_TYPES) is optional, and its test's
 * fixture (Basic-Pharmacokinetics' Module 2) cites decks the template course does
 * not list, so the core checks would refuse it on the course itself; the test adds
 * that fixture to its own scratch copies when it runs. So no data file is written:
 * the template's sample questions take their module from the template's lecture
 * (`module: 'Module 1'`) and are listed under "All concept questions" and
 * "Calculations by subtopic".
 * Writes one thing inside <courseSrcDir>: a line appended to course.js that
 * switches module-pages on at the version in its module.json, kept with any module
 * already on. The module must already be copied into <courseSrcDir>/features/module-pages/.
 * Exits non-zero on any failure, and when the line is already there (run it
 * once per fresh course).
 */
const fs = require('fs'), path = require('path');
const NAME = 'module-pages';
function fail(msg){ console.error(NAME + ' ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/module-pages/ci/oncourse.js <kitDir> <courseSrcDir>');
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', NAME, 'current', 'module.json'), 'utf8')); }
catch(e){ fail('cannot read the kit\'s features/' + NAME + '/current/module.json: ' + e.message); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail('no course.js in ' + src);
if(!fs.existsSync(path.join(src, 'features', NAME, 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', NAME));
const MARK = '/* switched on by features/' + NAME + '/ci/oncourse.js */';
const text = fs.readFileSync(course, 'utf8');
if(text.includes(MARK)) fail('course.js already has the line this script writes; run it on a fresh course');
const line = `\n;${MARK} COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(meta.name)}: {version: ${JSON.stringify(meta.version)}}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write course.js: ' + e.message); }
console.log(`${NAME} ci/oncourse.js: appended to ${course}:${line.trimEnd()}`);
console.log(`${NAME} ci/oncourse.js: no data files written (OBJECTIVES and CALC_TYPES are optional; the test adds its own fixture)`);
