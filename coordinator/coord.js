#!/usr/bin/env node
/* The improvement coordinator's engine: reads the records in this folder and works out,
   for each registered course, its lifecycle status, which reviews are due, what changed,
   whether the student site shows only released exams, and the dashboard.

   node coordinator/coord.js status      [--now <ISO>] [--json]
   node coordinator/coord.js plan        [--now <ISO>] [--json] [--heads <file>]
   node coordinator/coord.js published   [--course <id>] [--json]
   node coordinator/coord.js dashboard   [--now <ISO>] [--json] [--offline]

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
const sh = (cmd, args) => { try { return cp.execFileSync(cmd, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000}); } catch(e){ return null; } };
function liveHead(repo){ const o = sh('git', ['ls-remote', `https://github.com/${repo}`, 'HEAD']); return o ? o.split(/\s/)[0] : null; }
function liveFile(repo, file, ref){
  const o = sh('gh', ['api', `repos/${repo}/contents/${file}${ref ? '?ref=' + ref : ''}`, '--jq', '.content']);
  if(o) return Buffer.from(o.trim(), 'base64').toString('utf8');
  const g = sh('curl', ['-sfL', `https://raw.githubusercontent.com/${repo}/${ref || 'HEAD'}/${file}`]);
  return g || null;
}
function livePRs(repo){
  const o = sh('gh', ['api', `repos/${repo}/pulls?state=open&per_page=100`, '--jq',
    '[.[] | {number, title, draft, head: .head.sha, body: (.body // "" | .[0:4000]), url: .html_url}]']);
  return o ? JSON.parse(o) : null;
}
function liveChecks(repo, sha){
  const o = sh('gh', ['api', `repos/${repo}/actions/runs?head_sha=${sha}`, '--jq', '[.workflow_runs[] | {name, status, conclusion, id}]']);
  return o ? JSON.parse(o) : null;
}
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
  const offline = opts.offline;
  const heads = {};
  if(!offline) for(const c of cfg.courses) heads[c.repo] = liveHead(c.repo);
  const pl = plan(cfg, state, offline ? null : heads, now, imp);
  const courses = cfg.courses.map(c => {
    const lc = lifecycle(c, now, cfg);
    const p = pl.find(x => x.course === c.id);
    let pub = null, pin = null, behind = null, previewWaiting = null;
    if(!offline && c.siteKind === 'kit'){
      const txt = liveFile(c.repo, c.courseFile);
      if(txt){ try { const co = courseFromJs(txt); pub = checkPublished(c, co); pin = co.kit && co.kit.core || null; behind = kitBehind(pin); } catch(e){ pub = {ok: false, problems: ['course file could not be read: ' + e.message.split('\n')[0]]}; } }
      const live = liveFile(c.repo, 'version.json'), prev = liveFile(c.repo, 'preview/version.json');
      if(prev) previewWaiting = live !== prev;
    }
    const sched = (c.schedule && c.schedule.exams) || [];
    const open = (imp.items || []).filter(i => (i.candidateCourses || []).includes(c.id) && !['adopted', 'rejected', 'deferred'].includes(i.status) && ['critical', 'high'].includes(i.severity));
    return {id: c.id, code: c.code, name: c.name, repo: c.repo, site: c.site, term: c.term, status: lc.status, why: lc.why,
      next: lc.next ? `${lc.next.name} ${lc.next.date}${lc.next.start ? ' ' + lc.next.start : ''}` : null,
      final: lc.final ? `${lc.final.name} ${lc.final.date}` : null,
      published: sched.filter(e => e.status === 'published').map(e => e.name),
      knownFuture: sched.filter(e => e.status !== 'published').map(e => `${e.name} ${e.date || 'date unknown'} (${e.status})`),
      developing: c.inDevelopment || [], lastReview: p.lastReviewAt, nextAction: `${p.action}: ${p.reason}`,
      kitPin: pin, kitBehind: behind, previewWaiting, publication: pub, flags: lc.flags, openProblems: open.map(i => i.id)};
  });
  let approvals = null;
  if(!offline){
    approvals = [];
    for(const repo of [cfg.kitRepo, ...cfg.courses.map(c => c.repo)]){
      const prs = livePRs(repo);
      if(prs == null){ approvals.push({repo, unreachable: true}); continue; }
      approvals.push(...approvalsFrom(repo, prs, sha => liveChecks(repo, sha)));
    }
  }
  return {generatedAt: new Date(now).toISOString(), offline: !!offline, courses, plan: pl, improvements: imp.items || [], approvals, automations: auto.automations || []};
}

function md(d){
  const L = [], cell = s => String(s == null ? '—' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  L.push(`# Exam Drill Dashboard`, ``, `Generated ${d.generatedAt}${d.offline ? ' (offline: no repository heads, course files or pull requests read)' : ''}.`, ``);
  L.push(`## Courses`, ``, `| Course | Status | Next exam | Final | Published | Known, not released | Kit pin (behind) | Preview waiting | Next review | Problems |`, `|---|---|---|---|---|---|---|---|---|---|`);
  for(const c of d.courses){
    const probs = [...(c.publication && c.publication.problems || []), ...c.openProblems].join('; ') || (c.publication ? 'none' : 'publication check not run');
    L.push(`| [${cell(c.code)}](https://github.com/${c.repo}) ${cell(c.name)}, ${cell(c.term)} | ${c.status}: ${cell(c.why)} | ${cell(c.next)} | ${cell(c.final)} | ${cell(c.published.join(', ') || 'none')} | ${cell(c.knownFuture.join('; ') || 'none')} | ${cell(c.kitPin ? c.kitPin + (c.kitBehind != null ? ` (${c.kitBehind} core commits)` : '') : 'not a kit course or not read')} | ${cell(c.previewWaiting == null ? '—' : c.previewWaiting ? 'yes' : 'no')} | ${cell(c.nextAction)} | ${cell(probs)} |`);
  }
  const fl = d.courses.filter(c => c.flags.length);
  if(fl.length){ L.push(``, `**Schedule uncertainties:**`); for(const c of fl) L.push(`- ${c.code}: ${c.flags.join('; ')}`); }
  L.push(``, `## Improvements`, ``, `| Id | Title | Source | Kind | Status | In the kit | Candidate courses | PRs |`, `|---|---|---|---|---|---|---|---|`);
  for(const i of d.improvements) L.push(`| ${cell(i.id)} | ${cell(i.title)} | ${cell(i.sourceRepo)}${i.sourceCommit ? ' ' + cell(i.sourceCommit) : ''} | ${cell(i.kind)} | ${cell(i.status)} | ${cell(i.existsInKit)} | ${cell((i.candidateCourses || []).join(', '))} | ${cell((i.prs || []).join(', ') || '—')} |`);
  L.push(``, `## Approvals`, ``);
  if(d.approvals == null) L.push(`Not read (offline).`);
  else {
    const w = d.approvals.filter(a => a.waitsForLouis), f = d.approvals.filter(a => a.failedChecks && a.failedChecks.length), u = d.approvals.filter(a => a.unreachable);
    L.push(`**Waiting for your yes or no** (open, not draft, and the description says so):`);
    L.push(...(w.length ? w.map(a => `- [${a.repo}#${a.number}](${a.url}) ${a.title}`) : ['- none']));
    L.push(``, `**Failed or cancelled checks on an open pull request's head:**`);
    L.push(...(f.length ? f.map(a => `- [${a.repo}#${a.number}](${a.url}): ${a.failedChecks.join('; ')}`) : ['- none']));
    const pv = d.courses.filter(c => c.previewWaiting);
    L.push(``, `**Course previews that differ from the live site** (approval needed before they go live):`);
    L.push(...(pv.length ? pv.map(c => `- ${c.code}: \`/preview/\` differs from the live \`version.json\``) : ['- none']));
    if(u.length) L.push(``, `Not reachable from this session: ${u.map(a => a.repo).join(', ')}.`);
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
  else if(cmd === 'dashboard'){ const d = dashboard(now, {offline: argv.includes('--offline')}); out(json ? d : md(d)); }
  else { console.error('usage: coord.js status|plan|published|dashboard [--now ISO] [--json] [--offline]'); process.exit(2); }
}
module.exports = {zonedInstant, examSpan, lifecycle, plan, checkPublished, courseFromJs, approvalsFrom, md, STATUSES, RELEASE};
