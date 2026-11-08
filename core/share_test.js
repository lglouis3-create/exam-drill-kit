/* Link-preview tags: course.js `share`, and course.js `manifest.short_name`.
 *
 * A link preview (iMessage, Slack, social sites) reads the static <head> of the
 * page, not what the page's script draws. course.js `share` ({title?,
 * description?, url?, image?}, all optional strings) gives the page its <title>
 * and the og:/twitter: tags; `image` is a PNG under src/icons/ that the build
 * copies beside the page. `manifest.short_name` gives the web manifest its own
 * short_name. Checked here, each on a scratch copy of this source tree:
 *   (a) without `share` the page keeps the shell's <head> as it is (no tags, the
 *       title "Exam drill"), and every file the build writes is byte for byte what
 *       a base build.py writes for the same course, once the build time is set
 *       aside. The base is SHARE_BASE_BUILD, a build.py file (for example main's
 *       core/build.py, from `git show origin/main:core/build.py`); without it that
 *       comparison is skipped and says so;
 *   (b) with `share`, the title and every tag are there once and HTML-escaped;
 *   (c) a preview build's og:url ends in preview/;
 *   (d) the image is copied to the site root;
 *   (e) each value the build refuses stops it with its message before it writes:
 *       a url that is not https or does not end in "/", an image without a url, an
 *       image not in src/icons/, an unknown key, an empty value, an empty
 *       manifest.short_name;
 *   (f) manifest.short_name reaches manifest.json, the manifest's name stays the
 *       course title, and the page's COURSE keeps its own `short`.
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'share_test.js';

console.log('\n=== Link-preview tags (course.js share) and manifest.short_name ===');
const SRC = __dirname;
const SHELL = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8');
const headOf = page => page.slice(0, page.indexOf('<style>'));
const build = (src, args) => child.spawnSync('python3', ['build.py'].concat(args || []), {cwd: src, encoding: 'utf8', timeout: 600000});
const said = r => ((r.stdout || '') + (r.stderr || '')).trim();
const scratch = label => { const repo = L.scratchRepo(SRC, label); return {repo, src: path.join(repo, 'src')}; };
const rm = dir => fs.rmSync(dir, {recursive: true, force: true});
const rootFiles = repo => fs.readdirSync(repo).filter(f => fs.statSync(path.join(repo, f)).isFile()).sort();
// the build time is the one part of the output that differs between two builds
const timeless = (name, buf) => name === 'index.html' || name === 'version.json'
  ? Buffer.from(buf.toString('utf8').replace(/const BUILD = \{stamp:"[^"]*", built:"[^"]*"/, 'const BUILD = {stamp:"T", built:"T"')
      .replace(/^\{"built": "[^"]*"\}/, '{"built": "T"}'))
  : buf;
// a 1x1 PNG, for the image cases
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

// (a) no `share`
{
  const {repo, src} = scratch('share-off');
  const r = build(src);
  if(r.status !== 0) L.notRun(NAME, 'the template build failed in the scratch copy: ' + said(r).split('\n').pop());
  const page = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
  L.check(headOf(page) === headOf(SHELL), 'without share, the page\'s <head> up to <style> is the shell\'s, byte for byte');
  L.check(!/og:|twitter:|apple-mobile-web-app-title/.test(headOf(page)) && headOf(page).includes('<title>Exam drill</title>'),
    'without share, the page has no link-preview tags and keeps the title "Exam drill"');
  const man = JSON.parse(fs.readFileSync(path.join(repo, 'manifest.json'), 'utf8'));
  const course = new Function(fs.readFileSync(path.join(src, 'course.js'), 'utf8') + ';return COURSE;')();
  L.check(man.short_name === course.short, 'without manifest.short_name, the manifest\'s short_name is course.js short', man.short_name);

  let base = null, from = '';
  if(process.env.SHARE_BASE_BUILD){
    from = process.env.SHARE_BASE_BUILD;
    try { base = fs.readFileSync(from); } catch(e) { L.check(false, 'SHARE_BASE_BUILD can be read', e.message); }
  }
  if(base){
    const b = scratch('share-base');
    fs.writeFileSync(path.join(b.src, 'build.py'), base);
    const rb = build(b.src);
    L.check(rb.status === 0, `the same course builds with the base build.py (${from})`, said(rb).split('\n').pop());
    const ours = rootFiles(repo), theirs = rootFiles(b.repo);
    L.check(JSON.stringify(ours) === JSON.stringify(theirs), `without share, the build writes the same files as the base (${ours.length} files)`,
      {ours, theirs});
    const differ = ours.filter(f => theirs.includes(f) &&
      !timeless(f, fs.readFileSync(path.join(repo, f))).equals(timeless(f, fs.readFileSync(path.join(b.repo, f)))));
    L.check(!differ.length, `without share, every file is byte for byte the base build's (${from}; build time set aside)`, differ.join(', '));
    rm(b.repo);
  } else {
    L.skip('without share, every file is byte for byte a base build\'s', 'SHARE_BASE_BUILD (a base build.py to compare with) is not set');
  }
  rm(repo);
}

// (e) refused values: each stops the build before it writes anything
{
  const {repo, src} = scratch('share-refused');
  fs.mkdirSync(path.join(src, 'icons'), {recursive: true});
  fs.writeFileSync(path.join(src, 'icons', 'logo.png'), PNG);
  const original = fs.readFileSync(path.join(src, 'course.js'), 'utf8');
  const url = 'https://example.invalid/course/';
  const cases = [
    ['a url that is not https', `COURSE.share = {url: 'http://example.invalid/course/'};`, /`share\.url` is .*https address, ending in "\/"/],
    ['a url that does not end in "/"', `COURSE.share = {url: 'https://example.invalid/course'};`, /`share\.url` is .*ending in "\/"/],
    ['a url with a space', `COURSE.share = {url: 'https://example.invalid/a b/'};`, /`share\.url` is /],
    ['an image without a url', `COURSE.share = {image: 'logo.png'};`, /`share\.image` needs `share\.url`/],
    ['an image not in src/icons/', `COURSE.share = {url: '${url}', image: 'missing.png'};`, /`share\.image` names 'missing\.png', which is not in src\/icons\//],
    ['an image that is not a PNG file name', `COURSE.share = {url: '${url}', image: 'icons/logo.png'};`, /`share\.image` is .*PNG file name/],
    ['an unknown key', `COURSE.share = {title: 'X', site_name: 'Y'};`, /`share` has \['site_name'\]; it takes only `title`, `description`, `url`, `image`/],
    ['an empty title', `COURSE.share = {title: '  '};`, /`share\.title` must be a non-empty string/],
    ['a description that is not a string', `COURSE.share = {description: 5};`, /`share\.description` must be a non-empty string/],
    ['share that is not an object', `COURSE.share = 'DEENT';`, /`share` must be an object/],
    ['an empty manifest.short_name', `COURSE.manifest = {short_name: ''};`, /`manifest\.short_name` must be a non-empty string/],
    ['an unknown manifest key', `COURSE.manifest = {name: 'X'};`, /`manifest` takes only `description`, `orientation` and `short_name`/],
  ];
  for(const [label, line, re] of cases){
    fs.writeFileSync(path.join(src, 'course.js'), original + '\n;' + line + '\n');
    const r = build(src);
    const out = said(r);
    L.check(r.status !== 0 && re.test(out) && /^ERROR: /m.test(out), `the build stops on ${label}, with its message`, out.split('\n').pop());
    L.check(!fs.existsSync(path.join(repo, 'index.html')), `the build writes nothing on ${label}`, rootFiles(repo).join(', '));
  }
  rm(repo);
}

// (b), (d), (f): share set, with a title that needs escaping, and manifest.short_name
{
  const {repo, src} = scratch('share-on');
  fs.mkdirSync(path.join(src, 'icons'), {recursive: true});
  fs.writeFileSync(path.join(src, 'icons', 'logo.png'), PNG);
  const share = {title: 'DEENT "Exam" <Review> & more', description: "Louis's practice <b>questions</b>",
                 url: 'https://example.invalid/course/', image: 'logo.png'};
  fs.appendFileSync(path.join(src, 'course.js'), `\n;COURSE.share = ${JSON.stringify(share)};\n` +
    `COURSE.manifest = Object.assign({}, COURSE.manifest, {short_name: 'DEENT'});\n`);
  const r = build(src);
  L.check(r.status === 0, 'the course builds with share and manifest.short_name set', said(r).split('\n').pop());
  const page = fs.existsSync(path.join(repo, 'index.html')) ? fs.readFileSync(path.join(repo, 'index.html'), 'utf8') : '';
  const head = headOf(page);
  const T = 'DEENT &quot;Exam&quot; &lt;Review&gt; &amp; more', D = 'Louis&#x27;s practice &lt;b&gt;questions&lt;/b&gt;';
  const once = s => head.split(s).length - 1 === 1;
  L.check(once(`<title>${T}</title>`) && !head.includes('<title>Exam drill</title>') && (head.match(/<title>/g) || []).length === 1,
    'the page has one <title>, the share title HTML-escaped', (head.match(/<title>.*<\/title>/) || [''])[0]);
  L.check(!/apple-mobile-web-app-title/.test(head), 'share writes no apple-mobile-web-app-title (the Home Screen name stays the manifest\'s short_name)', head.match(/apple-mobile[^>]*>/));
  const want = [
    ['property', 'og:title', T], ['name', 'twitter:title', T],
    ['name', 'description', D], ['property', 'og:description', D], ['name', 'twitter:description', D],
    ['property', 'og:type', 'website'], ['property', 'og:url', share.url],
    ['property', 'og:image', share.url + 'logo.png'], ['property', 'og:image:type', 'image/png'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:image', share.url + 'logo.png']];
  const missing = want.filter(([a, k, v]) => !once(`<meta ${a}="${k}" content="${v}">`)).map(w => w[1]);
  L.check(!missing.length, `the ${want.length} link-preview tags are in the <head> once each, escaped`, missing.join(', '));
  L.check(!head.includes(share.title) && !head.includes('<b>questions'), 'no share value appears unescaped in the <head>');
  const copied = path.join(repo, 'logo.png');
  L.check(fs.existsSync(copied) && fs.readFileSync(copied).equals(PNG), '(d) the share image is copied to the site root, byte for byte');
  const man = fs.existsSync(path.join(repo, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(repo, 'manifest.json'), 'utf8')) : {};
  const course = new Function(fs.readFileSync(path.join(src, 'course.js'), 'utf8') + ';return COURSE;')();
  L.check(man.short_name === 'DEENT', '(f) manifest.short_name reaches manifest.json', man.short_name);
  L.check(man.name === course.title, '(f) the manifest\'s name stays the course title', man.name);
  L.check(page.includes(`short: ${JSON.stringify(course.short).replace(/"/g, "'")}`) && course.short !== 'DEENT',
    '(f) the page\'s COURSE keeps its own short', course.short);

  // (c) the preview build
  const p = build(src, ['--preview']);
  L.check(p.status === 0, 'the preview builds with share set', said(p).split('\n').pop());
  const pv = path.join(repo, 'preview', 'index.html');
  const phead = fs.existsSync(pv) ? headOf(fs.readFileSync(pv, 'utf8')) : '';
  L.check(phead.includes(`<meta property="og:url" content="${share.url}preview/">`), '(c) the preview page\'s og:url ends in preview/',
    (phead.match(/<meta property="og:url"[^>]*>/) || [''])[0]);
  L.check(phead.includes(`<meta property="og:image" content="${share.url}logo.png">`) &&
    JSON.stringify(fs.readdirSync(path.join(repo, 'preview')).sort()) === JSON.stringify(['index.html', 'version.json']),
    'the preview page\'s og:image is the live site\'s copy, and preview/ holds only index.html and version.json');
  rm(repo);
}

// a share with only a title: the title alone, no url or image tags
{
  const {repo, src} = scratch('share-title');
  fs.appendFileSync(path.join(src, 'course.js'), `\n;COURSE.share = {title: 'DEENT Exam Review'};\n`);
  const r = build(src);
  const head = r.status === 0 ? headOf(fs.readFileSync(path.join(repo, 'index.html'), 'utf8')) : '';
  L.check(r.status === 0 && head.includes('<title>DEENT Exam Review</title>') && head.includes('<meta property="og:title" content="DEENT Exam Review">') &&
    !/og:url|og:image|og:type|twitter:card|name="description"/.test(head),
    'a share with only a title gives the title tags and no url, image or description tags', said(r).split('\n').pop());
  rm(repo);
}
// a share without a title: the course title, escaped
{
  const {repo, src} = scratch('share-notitle');
  fs.appendFileSync(path.join(src, 'course.js'), `\n;COURSE.title = 'A & B'; COURSE.share = {description: 'Practice'};\n`);
  const r = build(src);
  const head = r.status === 0 ? headOf(fs.readFileSync(path.join(repo, 'index.html'), 'utf8')) : '';
  L.check(r.status === 0 && head.includes('<title>A &amp; B</title>') && !/og:title/.test(head),
    'a share without a title gives the page the course title, escaped, and no title tags', said(r).split('\n').pop());
  rm(repo);
}
L.finish(NAME);
