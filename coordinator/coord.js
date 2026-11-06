#!/usr/bin/env node
/* The improvement coordinator's engine: reads the records in this folder and works out,
   for each registered course, its lifecycle status, which reviews are due, what changed,
   whether the student site shows only released exams, and the dashboard.

   node coordinator/coord.js status      [--now <ISO>] [--json]
   node coordinator/coord.js plan        [--now <ISO>] [--json] [--heads <file>]
   node coordinator/coord.js published   [--course <id>] [--json]
   node coordinator/coord.js dashboard   [--now <ISO>] [--json] [--offline] [--cache <file> | --no-cache]
   node coordinator/coord.js lastseen    (the last successful reads, for a run to commit into state.json)

   It reads and prints; it never writes a record, pushes, merges or publishes. A run
   (coordinator/RUN.md) records its results by editing state.json and improvements.json in
   a bookkeeping pull request. Network use: `git ls-remote` for repository heads and
   `gh api` for course files and pull requests; --offline skips both. No dependencies. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');

const DIR = __dirname;
const read = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const DAY = 86400000;

/* ---------- time in the course's time zone ---------- */
// the UTC instant of a wall-clock time in a time zone (handles daylight saving)
function zonedInstant(dateStr, timeStr, tz){
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = (timeStr || '00:00').split(':').map(Number);
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for(let i = 0; i < 3; i++){
    const off = tzOffset(guess, tz);
    const next = Date.UTC(y, mo - 1, d, h, mi) - off;
    if(next === guess) break;
    guess = next;
  }
  return guess;
}
function tzOffset(t, tz){   // local minus UTC, in ms, at instant t
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'})
    .formatToParts(new Date(t)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(t / 1000) * 1000;
}
const localDate = (t, tz) => new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(t));

// start and end instants of a scheduled exam; an exam with no time counts as the whole day
function examSpan(e, tz){
  if(!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return null;
  if(e.start){
    const s = zonedInstant(e.date, e.start, tz);
    return {start: s, end: s + (e.minutes || 180) * 60000, timeKnown: true};
  }
  const s = zonedInstant(e.date, '00:00', tz);
  const last = e.endDate && /^\d{4}-\d{2}-\d{2}$/.test(e.endDate) ? e.endDate : e.date;   // a window of days, such as a quiz open Tue-Thu
  const nextDay = new Date(Date.UTC(...last.split('-').map((x, i) => i === 1 ? +x - 1 : +x)) + DAY).toISOString().slice(0, 10);
  return {start: s, end: zonedInstant(nextDay, '00:00', tz), timeKnown: false};
}

/* ---------- lifecycle ---------- */
const STATUSES = ['active', 'exam-approaching', 'recently-completed', 'completed', 'archived'];
const RELEASE = ['planned', 'collecting-material', 'in-development', 'ready-for-review', 'approved', 'published'];

function lifecycle(course, now, cfg){
  const tz = course.timezone || cfg.timezone;
  const d = Object.assign({}, cfg.defaults, course.thresholds || {});
  const flags = [];
  const exams = (course.schedule && course.schedule.exams) || [];
  const spans = exams.map(e => ({e, s: examSpan(e, tz)}));
  for(const {e, s} of spans){
    if(!s) flags.push(`${e.name}: no date recorded`);
    else if(!s.timeKnown) flags.push(`${e.name}: date ${e.date}, time not recorded`);
  }
  const dated = spans.filter(x => x.s).sort((a, b) => a.s.start - b.s.start);
  const finals = exams.filter(e => e.final);
  if(!finals.length) flags.push('no exam is marked as the final: completion is judged from the last exam recorded');
  if(course.schedule && course.schedule.uncertain) flags.push(course.schedule.uncertain);
  const next = dated.find(x => x.s.end > now) || null;
  const final = finals.length ? dated.find(x => x.e === finals[finals.length - 1]) : dated[dated.length - 1];
  let status, why;
  const o = course.override;
  if(o && o.status && (!o.until || now < Date.parse(o.until))){
    if(!STATUSES.includes(o.status)) throw new Error(`${course.id}: override status "${o.status}" is not one of ${STATUSES.join(', ')}`);
    status = o.status; why = `override: ${o.reason || 'no reason recorded'}${o.until ? ` (until ${o.until})` : ''}`;
  }else if(!dated.length){
    status = 'active'; why = 'no dated exam recorded: treated as active until the schedule is known';
  }else if(next && (!final || next.s.start <= final.s.start)){
    const days = (next.s.start - now) / DAY;
    if(days <= d.approachDays){ status = 'exam-approaching'; why = `${next.e.name} ${days < 0 ? 'in progress' : 'in ' + days.toFixed(1) + ' days'}`; }
    else { status = 'active'; why = `next: ${next.e.name} on ${next.e.date}`; }
  }else{
    const since = (now - final.s.end) / DAY;
    if(since <= d.recentDays){ status = 'recently-completed'; why = `${final.e.name} was ${since.toFixed(1)} days ago`; }
    else if(since <= d.archiveDays){ status = 'completed'; why = `${final.e.name} was ${Math.round(since)} days ago`; }
    else { status = 'archived'; why = `${final.e.name} was ${Math.round(since)} days ago`; }
  }
  return {status, why, flags, next: next ? next.e : null, final: final ? final.e : null};
}

/* ---------- review cadence and change detection ---------- */
function plan(cfg, state, heads, now, improvements){
  return cfg.courses.map(c => {
    const lc = lifecycle(c, now, cfg);
    const cad = cfg.cadence[lc.status];
    const ck = (state.checkpoints || {})[c.id] || {};
    const head = heads ? heads[c.repo] || null : null;
    const changed = head ? head !== ck.lastReviewedCommit : null;   // null: head not known
    const last = ck.lastReviewAt ? Date.parse(ck.lastReviewAt) : null;
    const lastDeep = ck.lastDeepAt ? Date.parse(ck.lastDeepAt) : null;
    const due = cad.everyDays == null ? false : (last == null || now - last >= cad.everyDays * DAY - 3600000);
    const deepDue = cad.deepEveryDays ? (lastDeep == null || now - lastDeep >= cad.deepEveryDays * DAY - 3600000) : false;
    const critical = (improvements.items || []).filter(i => i.severity === 'critical' && (i.candidateCourses || []).includes(c.id) && !['adopted', 'rejected', 'deferred'].includes(i.status));
    let action, reason;
    if(critical.length){ action = 'review'; reason = `critical open item: ${critical.map(i => i.id).join(', ')}`; }
    else if(lc.status === 'archived'){ action = changed ? 'essential-check' : 'skip'; reason = changed ? 'archived course changed' : 'archived: checks only on change'; }
    else if(deepDue && lc.status === 'completed'){ action = 'deep-audit'; reason = `deep review every ${cad.deepEveryDays} days`; }
    else if(!due){ action = 'wait'; reason = `next review ${new Date(last + cad.everyDays * DAY).toISOString().slice(0, 10)}`; }
    else if(changed === false && (lc.status === 'completed')){ action = 'skip'; reason = 'unchanged since the last review'; }
    else if(changed === false){ action = lc.status === 'recently-completed' ? 'retrospective' : 'light'; reason = 'unchanged: open items and readiness only, no full review of unchanged code'; }
    else { action = lc.status === 'recently-completed' ? 'retrospective' : 'review'; reason = changed ? `changed since ${ck.lastReviewedCommit ? ck.lastReviewedCommit.slice(0, 7) : 'no recorded review'}` : 'head not known'; }
    return {course: c.id, status: lc.status, why: lc.why, priority: cad.priority, action, reason, head, lastReviewedCommit: ck.lastReviewedCommit || null, lastReviewAt: ck.lastReviewAt || null, flags: lc.flags};
  }).sort((a, b) => b.priority - a.priority);
}

/* ---------- published-content separation ---------- */
// the COURSE object of a kit course.js, evaluated with no access to anything outside it
function courseFromJs(text){
  const sandbox = {};
  vm.runInNewContext(text + '\n;this.__COURSE = (typeof COURSE !== "undefined") ? COURSE : undefined;', sandbox, {timeout: 2000});
  if(!sandbox.__COURSE) throw new Error('course file defines no COURSE');
  return sandbox.__COURSE;
}
// What the student site shows, against what is released. An exam may appear on the site only
// when its schedule entry is published; the exam the site opens on must be published; a
// published exam missing from the site is reported so the record can be corrected.
function checkPublished(course, courseObj){
  const problems = [], notes = [];
  const sched = (course.schedule && course.schedule.exams) || [];
  const bySite = new Map(sched.filter(e => e.siteId != null).map(e => [String(e.siteId), e]));
  const siteExams = (courseObj.exams || []).map(e => String(e.id));
  for(const id of siteExams){
    const e = bySite.get(id);
    if(!e) problems.push(`the site lists exam "${id}", which the schedule does not map to any exam`);
    else if(e.status !== 'published') problems.push(`the site lists ${e.name} (exam "${id}"), whose release status is "${e.status}", not published`);
  }
  const active = courseObj.activeExam != null ? String(courseObj.activeExam) : siteExams[0];
  const ae = bySite.get(active);
  if(active != null && (!ae || ae.status !== 'published')) problems.push(`the site opens on exam "${active}", which is not a published exam in the schedule`);
  for(const e of sched){
    if(!RELEASE.includes(e.status)) problems.push(`${e.name}: release status "${e.status}" is not one of ${RELEASE.join(', ')}`);
    if(e.status === 'published' && !siteExams.includes(String(e.siteId))) notes.push(`${e.name} is recorded as published but the site does not list it: update the record or the site`);
  }
  const hidden = sched.filter(e => e.status !== 'published').map(e => `${e.name} (${e.status})`);
  return {ok: !problems.length, problems, notes, siteExams, activeExam: active, knownNotReleased: hidden};
}

/* ---------- live data (skipped with --offline) ---------- */
// Each read says what happened: ok, missing (the repository answered that the file or
// branch is not there), or unavailable (this session could not ask: no credentials for the
// repository, the proxy refused, no network). "Unavailable" is never reported as the
// repository or its site being down.
function run(cmd, args){
  try { return {ok: true, out: cp.execFileSync(cmd, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000})}; }
  catch(e){ return {ok: false, err: String((e.stderr || '') + (e.stdout || '') + (e.message || '')).slice(0, 600)}; }
}
const sanitize = s => String(s || '').replace(/gh[p]_[A-Za-z0-9]{20,}|github_[p]at_[A-Za-z0-9_]+/g, '[token]').replace(/\s+/g, ' ').trim().slice(0, 200);
const ghKind = err => /HTTP 404|Not Found/i.test(err) ? 'missing' : 'unavailable';
function liveHead(repo){
  const r = run('git', ['ls-remote', `https://github.com/${repo}`, 'HEAD']);
  return r.ok && r.out.trim() ? {state: 'ok', head: r.out.split(/\s/)[0]} : {state: 'unavailable', why: sanitize(r.err || 'no HEAD returned')};
}
function liveFile(repo, file, ref){
  const r = run('gh', ['api', `repos/${repo}/contents/${file}${ref ? '?ref=' + ref : ''}`, '--jq', '.content']);
  if(r.ok) return {state: 'ok', text: Buffer.from(r.out.trim(), 'base64').toString('utf8'), via: 'GitHub API'};
  if(ghKind(r.err) === 'missing') return {state: 'missing', via: 'GitHub API'};
  // a public file can still be read without credentials
  const g = run('curl', ['-sSL', '-w', '\n%{http_code}', `https://raw.githubusercontent.com/${repo}/${ref || 'HEAD'}/${file}`]);
  if(g.ok){
    const i = g.out.lastIndexOf('\n'), code = g.out.slice(i + 1).trim(), body = g.out.slice(0, i);
    if(code === '200') return {state: 'ok', text: body, via: 'raw.githubusercontent.com'};
    if(code === '404') return {state: 'missing', via: 'raw.githubusercontent.com'};
  }
  return {state: 'unavailable', why: sanitize(r.err)};
}
function livePRs(repo){
  const r = run('gh', ['api', `repos/${repo}/pulls?state=open&per_page=100`, '--jq',
    '[.[] | {number, title, draft, head: .head.sha, body: (.body // "" | .[0:4000]), url: .html_url}]']);
  if(r.ok) return {state: 'ok', prs: JSON.parse(r.out)};
  return {state: ghKind(r.err) === 'missing' ? 'missing' : 'unavailable', why: sanitize(r.err)};
}
// how far the default (working) branch is ahead of the branch Pages serves: unreleased work
function liveAhead(repo, pagesBranch){
  const m = run('gh', ['api', `repos/${repo}`, '--jq', '.default_branch']);
  if(!m.ok) return {state: ghKind(m.err) === 'missing' ? 'missing' : 'unavailable', why: sanitize(m.err)};
  const def = m.out.trim();
  if(def === pagesBranch) return {state: 'ok', value: {defaultBranch: def, ahead: 0}};
  const c = run('gh', ['api', `repos/${repo}/compare/${pagesBranch}...${encodeURIComponent(def)}`, '--jq', '.ahead_by']);
  if(!c.ok) return {state: 'unavailable', why: sanitize(c.err)};
  return {state: 'ok', value: {defaultBranch: def, ahead: +c.out.trim()}};
}
function liveChecks(repo, sha){
  const r = run('gh', ['api', `repos/${repo}/actions/runs?head_sha=${sha}`, '--jq', '[.workflow_runs[] | {name, status, conclusion, id}]']);
  return r.ok ? JSON.parse(r.out) : null;
}
const sh = (cmd, args) => { const r = run(cmd, args); return r.ok ? r.out : null; };

/* ---------- last successful reads ----------
   The dashboard keeps the last successful result of each read, with its time, in a cache
   file outside the repository (default ~/.cache/exam-drill-kit/dashboard.json, or --cache),
   and also reads state.json "lastSeen", which coordinator runs commit (RUN.md step 4) so the
   last results survive a new container. The newer of the two is shown. */
function lastSeenStore(cacheFile, state){
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch(e){}
  const committed = (state && state.lastSeen) || {};
  return {
    get(key){ const a = cache[key], b = committed[key]; if(!a) return b || null; if(!b) return a; return Date.parse(a.at) >= Date.parse(b.at) ? a : b; },
    put(key, value, at){ cache[key] = {at, value}; },
    save(){ if(!cacheFile) return; try { fs.mkdirSync(path.dirname(cacheFile), {recursive: true}); fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1)); } catch(e){} },
    all(){ return Object.assign({}, committed, cache); }
  };
}
const UNAVAILABLE = 'Access unavailable—status not checked';
// the kit commits a course is behind, from its kit.core pin, counted on core/ in this checkout
function kitBehind(pin){
  if(!pin) return null;
  const kit = path.join(DIR, '..');
  sh('git', ['-C', kit, 'fetch', '-q', 'origin', 'main']);
  const n = sh('git', ['-C', kit, 'rev-list', '--count', `${pin}..origin/main`, '--', 'core']);
  return n == null ? null : +n.trim();
}

/* ---------- approvals: only what pull requests themselves say ---------- */
const WAITS = /For Louis'?s yes or no|waits? for Louis'?s (approval|yes|decision)|needs Louis'?s (approval|yes)/i;
function approvalsFrom(repo, prs, checksOf){
  return (prs || []).map(p => {
    const runs = checksOf ? checksOf(p.head) : null;
    const failed = runs ? runs.filter(r => r.status === 'completed' && !['success', 'skipped', 'neutral'].includes(r.conclusion)).map(r => `${r.name}: ${r.conclusion}`) : null;
    return {repo, number: p.number, title: p.title, url: p.url, draft: p.draft, waitsForLouis: !p.draft && WAITS.test(p.body || ''), failedChecks: failed};
  });
}

/* ---------- dashboard ---------- */
function dashboard(now, opts){
  const cfg = read('courses.json'), state = read('state.json'), imp = read('improvements.json'), auto = read('automations.json');
  const offline = opts.offline, at = new Date(now).toISOString();
  const io = Object.assign({liveHead, liveFile, livePRs, liveChecks, kitBehind, liveAhead}, opts.io || {});   // opts.io: test doubles
  const seen = lastSeenStore(opts.cache === undefined ? path.join(require('os').homedir(), '.cache', 'exam-drill-kit', 'dashboard.json') : opts.cache, state);
  // one read: live when it can be made, otherwise the last successful result and its time
  const access = [];
  function readOr(key, label, fn){
    if(offline){ const l = seen.get(key); return {state: 'not-read', last: l}; }
    const r = fn();
    if(r.state === 'ok' || r.state === 'missing'){ seen.put(key, r.state === 'ok' ? r.value : {missing: true}, at); return r; }
    access.push({what: label, why: r.why || ''});
    return {state: 'unavailable', why: r.why, last: seen.get(key)};
  }
  const heads = {}, headRead = {};
  for(const c of cfg.courses){
    const r = readOr(`head|${c.repo}`, `${c.repo}: repository head (git)`, () => { const h = io.liveHead(c.repo); return h.state === 'ok' ? {state: 'ok', value: h.head} : h; });
    headRead[c.repo] = r;
    heads[c.repo] = r.state === 'ok' ? r.value : null;
  }
  const pl = plan(cfg, state, offline ? null : heads, now, imp);
  const courses = cfg.courses.map(c => {
    const lc = lifecycle(c, now, cfg);
    const p = pl.find(x => x.course === c.id);
    let pub = null, pin = null, behind = null, preview = {state: 'not-read'};
    if(c.siteKind === 'kit'){
      const cf = readOr(`course|${c.repo}`, `${c.repo}: ${c.courseFile}`, () => {
        const f = io.liveFile(c.repo, c.courseFile, c.pagesBranch || 'main');
        if(f.state !== 'ok') return f;
        try { const co = courseFromJs(f.text); return {state: 'ok', value: {pub: checkPublished(c, co), pin: co.kit && co.kit.core || null}}; }
        catch(e){ return {state: 'ok', value: {pub: {ok: false, problems: ['course file could not be read: ' + e.message.split('\n')[0]]}, pin: null}}; }
      });
      if(cf.state === 'ok'){ pub = Object.assign({checked: 'live'}, cf.value.pub); pin = cf.value.pin; }
      else if(cf.state === 'missing') pub = {checked: 'live', ok: false, problems: [`${c.courseFile} not found on the default branch`]};
      else pub = {checked: cf.state, why: cf.why, last: cf.last};
      if(pin && !offline) behind = io.kitBehind(pin);
      // a preview waits when the Pages branch carries a /preview/ built after its live page
      // (version.json holds only a build time, so the times are compared, not the text)
      preview = readOr(`preview|${c.repo}`, `${c.repo}: version.json and preview/version.json on ${c.pagesBranch || 'main'}`, () => {
        const ref = c.pagesBranch || 'main';
        const pv = io.liveFile(c.repo, 'preview/version.json', ref);
        if(pv.state === 'missing') return {state: 'ok', value: false};
        if(pv.state !== 'ok') return pv;
        const lv = io.liveFile(c.repo, 'version.json', ref);
        if(lv.state === 'unavailable') return lv;
        const built = t => { try { return Date.parse(JSON.parse(t).built); } catch(e){ return NaN; } };
        const pb = built(pv.text), lb = lv.state === 'ok' ? built(lv.text) : NaN;
        return {state: 'ok', value: isNaN(pb) || isNaN(lb) ? pv.text.trim() !== (lv.text || '').trim() : pb > lb};
      });
    }
    const ahead = readOr(`ahead|${c.repo}`, `${c.repo}: default branch against ${c.pagesBranch || 'main'} (GitHub API)`, () => io.liveAhead(c.repo, c.pagesBranch || 'main'));
    const sched = (c.schedule && c.schedule.exams) || [];
    const open = (imp.items || []).filter(i => (i.candidateCourses || []).includes(c.id) && !['adopted', 'rejected', 'deferred'].includes(i.status) && ['critical', 'high'].includes(i.severity));
    return {id: c.id, code: c.code, name: c.name, repo: c.repo, site: c.site, term: c.term, siteKind: c.siteKind, status: lc.status, why: lc.why,
      next: lc.next ? `${lc.next.name} ${lc.next.date}${lc.next.start ? ' ' + lc.next.start : ''}` : null,
      final: lc.final ? `${lc.final.name} ${lc.final.date}` : null,
      published: sched.filter(e => e.status === 'published').map(e => e.name),
      knownFuture: sched.filter(e => e.status !== 'published').map(e => `${e.name} ${e.date || 'date unknown'} (${e.status})`),
      developing: c.inDevelopment || [], lastReview: p.lastReviewAt, nextAction: `${p.action}: ${p.reason}`, head: headRead[c.repo],
      kitPin: pin, kitBehind: behind, preview, ahead, publication: pub, flags: lc.flags, openProblems: open.map(i => i.id)};
  });
  const approvals = [];
  for(const repo of [cfg.kitRepo, ...cfg.courses.map(c => c.repo)]){
    const r = readOr(`prs|${repo}`, `${repo}: open pull requests (GitHub API)`, () => {
      const x = io.livePRs(repo);
      return x.state === 'ok' ? {state: 'ok', value: approvalsFrom(repo, x.prs, sha => io.liveChecks(repo, sha))} : x;
    });
    if(r.state === 'ok') approvals.push({repo, checked: 'live', items: r.value});
    else if(r.state === 'missing') approvals.push({repo, checked: 'live', items: [], note: 'the repository answered "not found"'});
    else approvals.push({repo, checked: r.state, why: r.why, last: r.last});
  }
  if(!offline) seen.save();
  return {generatedAt: at, offline: !!offline, courses, plan: pl, improvements: imp.items || [], approvals, access, automations: auto.automations || [], lastSeen: seen.all()};
}

function md(d){
  const L = [], cell = s => String(s == null ? '—' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  L.push(`# Exam Drill Dashboard`, ``, `Generated ${d.generatedAt}${d.offline ? ' (offline: no repository heads, course files or pull requests read)' : ''}.`, ``);
  L.push(`## Courses`, ``, `| Course | Status | Next exam | Final | Published | Known, not released | Kit pin (behind) | Preview waiting; unreleased work | Next review | Problems |`, `|---|---|---|---|---|---|---|---|---|---|`);
  const lastTxt = l => l ? ` (last successful read ${l.at})` : ' (no earlier successful read)';
  for(const c of d.courses){
    let probs;
    const pb = c.publication;
    if(!pb) probs = c.siteKind === 'kit' ? 'release check not run' : 'release check not run (not a kit course)';
    else if(pb.checked === 'unavailable' || pb.checked === 'not-read'){
      const last = pb.last && pb.last.value && pb.last.value.pub;
      probs = `${pb.checked === 'unavailable' ? UNAVAILABLE : 'not read (offline)'}${lastTxt(pb.last)}${last ? ': ' + (last.ok ? 'only released exams on the site' : last.problems.join('; ')) : ''}`;
    }else probs = pb.ok ? 'only released exams on the site' : pb.problems.join('; ');
    if(c.openProblems.length) probs += `; open: ${c.openProblems.join(', ')}`;
    const pv = c.preview;
    const pvTxt = pv.state === 'ok' ? (pv.value ? 'yes' : 'no') : pv.state === 'unavailable' ? `${UNAVAILABLE}${lastTxt(pv.last)}${pv.last ? ': ' + (pv.last.value ? 'yes' : 'no') : ''}` : '—';
    const pinTxt = c.kitPin ? c.kitPin + (c.kitBehind != null ? ` (${c.kitBehind} core commits behind)` : '') : c.siteKind === 'kit' ? (pb && pb.last && pb.last.value && pb.last.value.pin ? `${pb.last.value.pin}${lastTxt(pb.last)}` : 'not read') : 'not a kit course';
    const ah = c.ahead && c.ahead.state === 'ok' && c.ahead.value.ahead > 0 ? `; working branch \`${c.ahead.value.defaultBranch}\` ${c.ahead.value.ahead} commits ahead of the live branch` : c.ahead && c.ahead.state === 'unavailable' ? `; working branch: ${UNAVAILABLE}` : '';
    const nextRev = c.head && c.head.state === 'unavailable' ? `${UNAVAILABLE} (repository head)${lastTxt(c.head.last)}` : c.nextAction;
    L.push(`| [${cell(c.code)}](https://github.com/${c.repo}) ${cell(c.name)}, ${cell(c.term)} | ${c.status}: ${cell(c.why)} | ${cell(c.next)} | ${cell(c.final)} | ${cell(c.published.join(', ') || 'none')} | ${cell(c.knownFuture.join('; ') || 'none')} | ${cell(pinTxt)} | ${cell(pvTxt + ah)} | ${cell(nextRev)} | ${cell(probs)} |`);
  }
  const fl = d.courses.filter(c => c.flags.length);
  if(fl.length){ L.push(``, `**Schedule uncertainties:**`); for(const c of fl) L.push(`- ${c.code}: ${c.flags.join('; ')}`); }
  L.push(``, `## Improvements`, ``, `| Id | Title | Source | Kind | Status | In the kit | Candidate courses | PRs |`, `|---|---|---|---|---|---|---|---|`);
  for(const i of d.improvements) L.push(`| ${cell(i.id)} | ${cell(i.title)} | ${cell(i.sourceRepo)}${i.sourceCommit ? ' ' + cell(i.sourceCommit) : ''} | ${cell(i.kind)} | ${cell(i.status)} | ${cell(i.existsInKit)} | ${cell((i.candidateCourses || []).join(', '))} | ${cell((i.prs || []).join(', ') || '—')} |`);
  L.push(``, `## Approvals`, ``);
  const live = d.approvals.filter(a => a.checked === 'live'), notChecked = d.approvals.filter(a => a.checked !== 'live');
  const items = live.flatMap(a => a.items);
  const w = items.filter(a => a.waitsForLouis), f = items.filter(a => a.failedChecks && a.failedChecks.length);
  L.push(`**Waiting for your yes or no** (open, not draft, and the description says so):`);
  L.push(...(w.length ? w.map(a => `- [${a.repo}#${a.number}](${a.url}) ${a.title}`) : ['- none in the repositories read']));
  L.push(``, `**Failed or cancelled checks on an open pull request's head:**`);
  L.push(...(f.length ? f.map(a => `- [${a.repo}#${a.number}](${a.url}): ${a.failedChecks.join('; ')}`) : ['- none in the repositories read']));
  const pv = d.courses.filter(c => c.preview.state === 'ok' && c.preview.value);
  L.push(``, `**Course previews that differ from the live site** (approval needed before they go live):`);
  L.push(...(pv.length ? pv.map(c => `- ${c.code}: \`/preview/\` differs from the live \`version.json\``) : ['- none in the repositories read']));
  if(notChecked.length){
    L.push(``, `**${d.offline ? 'Not read (offline)' : UNAVAILABLE}** for these repositories' pull requests; this says nothing about whether the repository or its site is up:`);
    for(const a of notChecked){
      const lv = a.last && a.last.value;
      const sum = lv ? `last successful read ${a.last.at}: ${lv.filter(x => x.waitsForLouis).length} waiting for you, ${lv.filter(x => x.failedChecks && x.failedChecks.length).length} with failed checks${lv.filter(x => x.waitsForLouis).map(x => `; #${x.number} ${x.title}`).join('')}` : 'no earlier successful read';
      L.push(`- ${a.repo}: ${sum}`);
    }
  }
  if(d.access.length){
    L.push(``, `**Reads this session could not make** (sanitized errors):`);
    for(const x of d.access) L.push(`- ${x.what}: ${x.why || 'no detail'}`);
  }
  L.push(``, `## Automation activity`, ``, `| Automation | Kind | Responsibility | Schedule or trigger | State | Last run recorded | Verified |`, `|---|---|---|---|---|---|---|`);
  for(const a of d.automations) L.push(`| ${cell(a.name)} | ${cell(a.kind)} | ${cell(a.responsibility)} | ${cell(a.schedule)} | ${cell(a.state)} | ${cell(a.lastRun)} | ${cell(a.verified)} |`);
  return L.join('\n');
}

/* ---------- command line ---------- */
if(require.main === module){
  const argv = process.argv.slice(2), cmd = argv[0];
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const now = opt('--now') ? Date.parse(opt('--now')) : Date.now();
  const json = argv.includes('--json');
  const cfg = read('courses.json');
  const out = x => console.log(json ? JSON.stringify(x, null, 2) : x);
  if(cmd === 'status') out(json ? cfg.courses.map(c => Object.assign({course: c.id}, lifecycle(c, now, cfg))) : cfg.courses.map(c => { const l = lifecycle(c, now, cfg); return `${c.id.padEnd(22)} ${l.status.padEnd(19)} ${l.why}${l.flags.length ? '  [' + l.flags.join('; ') + ']' : ''}`; }).join('\n'));
  else if(cmd === 'plan'){
    let heads = null;
    if(opt('--heads')) heads = JSON.parse(fs.readFileSync(opt('--heads'), 'utf8'));
    else if(!argv.includes('--offline')){ heads = {}; for(const c of cfg.courses) heads[c.repo] = liveHead(c.repo); }
    const p = plan(cfg, read('state.json'), heads, now, read('improvements.json'));
    out(json ? p : p.map(x => `${x.course.padEnd(22)} ${x.status.padEnd(19)} ${x.action.padEnd(14)} ${x.reason}`).join('\n'));
  }
  else if(cmd === 'published'){
    const res = cfg.courses.filter(c => c.siteKind === 'kit' && (!opt('--course') || c.id === opt('--course'))).map(c => {
      const txt = liveFile(c.repo, c.courseFile);
      if(!txt) return {course: c.id, ok: null, problems: ['course file not reachable: NOT RUN']};
      return Object.assign({course: c.id}, checkPublished(c, courseFromJs(txt)));
    });
    out(json ? res : res.map(r => `${r.course}: ${r.ok === null ? 'NOT RUN' : r.ok ? 'OK' : 'PROBLEM'}${r.problems.length ? ' — ' + r.problems.join('; ') : ''}${r.knownNotReleased && r.knownNotReleased.length ? `\n  known, not released (hidden from students): ${r.knownNotReleased.join('; ')}` : ''}`).join('\n'));
    if(res.some(r => r.ok === false)) process.exitCode = 1;
  }
  else if(cmd === 'dashboard'){ const d = dashboard(now, {offline: argv.includes('--offline'), cache: argv.includes('--no-cache') ? null : (opt('--cache') || undefined)}); out(json ? d : md(d)); }
  else if(cmd === 'lastseen'){ const d = dashboard(now, {offline: false, cache: argv.includes('--no-cache') ? null : (opt('--cache') || undefined)}); console.log(JSON.stringify(d.lastSeen, null, 1)); }
  else { console.error('usage: coord.js status|plan|published|dashboard [--now ISO] [--json] [--offline]'); process.exit(2); }
}
module.exports = {dashboard, lastSeenStore, UNAVAILABLE, zonedInstant, examSpan, lifecycle, plan, checkPublished, courseFromJs, approvalsFrom, md, STATUSES, RELEASE};
