// node on_generic.js <kit> <src> mod[=jsonopts] ...
// Appends one features line to course.js switching the named modules on at the version in
// their module.json (kept with any module already on). Used only where a module has no
// ci/oncourse.js. Writes only course.js inside <src>.
const fs = require('fs'), path = require('path');
const [kit, src, ...mods] = process.argv.slice(2);
const add = {};
for (const m of mods) {
  const i = m.indexOf('=');
  const n = i < 0 ? m : m.slice(0, i), o = i < 0 ? null : m.slice(i + 1);
  const meta = JSON.parse(fs.readFileSync(path.join(kit, 'features', n, 'current', 'module.json'), 'utf8'));
  add[n] = Object.assign({version: meta.version}, o ? JSON.parse(o) : {});
}
const line = `\n;/* integration on_generic */ COURSE.features = Object.assign({}, COURSE.features, ${JSON.stringify(add)});\n`;
fs.appendFileSync(path.join(src, 'course.js'), line);
console.log('on_generic appended:' + line.trim());
