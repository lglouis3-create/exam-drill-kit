/* Device lint: syntax that older Safari rejects, in anything that ships.
 *
 * A regex lookbehind is a syntax error in Safari releases older than the one
 * that added it. Written as a regex literal it stops the whole page script from parsing, so the
 * drill never starts; passed to new RegExp it throws when that line runs. Chromium
 * accepts both, so no browser check in this container can see the fault. PK
 * removed lookbehind for older Safari once and it came back three times
 * (review/findings.md §6.5), which is why this is a check and not a rule.
 *
 * What is scanned: every source build.py ships (python3 build.py --list-sources),
 * and the built page and service worker in the repository root, so a pattern
 * that reaches the page some other way is caught too. A match anywhere fails,
 * comments included; a comment can describe the pattern without spelling it.
 *
 *     node device_lint.js
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'device_lint.js';
// spelled in two parts so this file does not match itself
const LOOKBEHIND = new RegExp('\\(\\?' + '<[=!]', 'g');

console.log('\n=== Device lint: regex lookbehind ===');
const list = child.spawnSync('python3', ['build.py', '--list-sources'], {cwd: L.PAGE.SRC, encoding: 'utf8'});
let shipped = [];
try { shipped = JSON.parse(list.stdout); } catch(e) {}
if(!Array.isArray(shipped) || !shipped.length)
  L.notRun(NAME, 'build.py --list-sources gave no list of shipped sources' + (list.stderr ? ': ' + list.stderr.trim().split('\n').pop() : ''));

function scan(file, label){
  const hits = [];
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if(LOOKBEHIND.test(line)){
      const at = line.search(LOOKBEHIND);
      hits.push(`${label}:${i + 1}: …${line.slice(Math.max(0, at - 30), at + 30).trim()}…`);
    }
    LOOKBEHIND.lastIndex = 0;
  });
  return hits;
}
const missing = shipped.filter(f => !fs.existsSync(path.join(L.PAGE.SRC, f)));
L.check(!missing.length, `every shipped source is on disk (${shipped.length})`, missing.join(', '));
const srcHits = shipped.filter(f => fs.existsSync(path.join(L.PAGE.SRC, f))).flatMap(f => scan(path.join(L.PAGE.SRC, f), f));
L.check(!srcHits.length, `no lookbehind in the ${shipped.length} shipped sources`, srcHits.slice(0, 5).join(' | '));

const built = [L.PAGE.PAGE, path.join(L.PAGE.SITE, 'sw.js')].filter(f => fs.existsSync(f));
if(!fs.existsSync(L.PAGE.PAGE)){
  if(srcHits.length) L.finish(NAME);
  L.PAGE.need(NAME);
}
const pageHits = built.flatMap(f => scan(f, path.relative(L.PAGE.ROOT, f) || f));
L.check(!pageHits.length, `no lookbehind in the built page${built.length > 1 ? ' or the service worker' : ''}`, pageHits.slice(0, 5).join(' | '));
L.finish(NAME);
