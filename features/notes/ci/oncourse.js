#!/usr/bin/env node
/* notes: switch the module on in a fresh scratch course, for the kit's CI
 * (the shape agreed in PR #12). Outside current/, so a course never copies it.
 *
 *     node features/notes/ci/oncourse.js <kitDir> <courseSrcDir>
 *
 * The module reads no course data, so no data file is written: its test adds
 * its own fixture (Basic-Pharmacokinetics' cq5-5) to a scratch copy when it runs.
 * Writes one thing inside <courseSrcDir>: a line appended to course.js that
 * switches notes on at the version in its module.json, kept with any module
 * already on. The module must already be copied into <courseSrcDir>/features/notes/.
 * Exits non-zero on any failure, and when the line is already there (run it
 * once per fresh course).
 */
const fs = require('fs'), path = require('path');
function fail(msg){ console.error('notes ci/oncourse.js: ' + msg); process.exit(1); }
const [kit, src] = process.argv.slice(2);
if(!kit || !src) fail('usage: node features/notes/ci/oncourse.js <kitDir> <courseSrcDir>');
let meta;
try { meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', 'notes', 'current', 'module.json'), 'utf8')); }
catch(e){ fail('cannot read the kit\'s features/notes/current/module.json: ' + e.message); }
const course = path.join(src, 'course.js');
if(!fs.existsSync(course)) fail('no course.js in ' + src);
if(!fs.existsSync(path.join(src, 'features', 'notes', 'module.json'))) fail('the module is not copied into ' + path.join(src, 'features', 'notes'));
const MARK = '/* switched on by features/notes/ci/oncourse.js */';
const text = fs.readFileSync(course, 'utf8');
if(text.includes(MARK)) fail('course.js already has the line this script writes; run it on a fresh course');
const line = `\n;${MARK} COURSE.features = Object.assign({}, COURSE.features, {${JSON.stringify(meta.name)}: {version: ${JSON.stringify(meta.version)}}});\n`;
try { fs.appendFileSync(course, line); } catch(e){ fail('cannot write course.js: ' + e.message); }
console.log(`notes ci/oncourse.js: appended to ${course}:${line.trimEnd()}`);
console.log('notes ci/oncourse.js: no data files written (the module reads no course data)');
