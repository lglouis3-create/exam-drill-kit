#!/usr/bin/env node
/* Checks of the coordinator: time zone, lifecycle, review planning and change detection,
   published-content separation, approvals, the dashboard, and the records themselves.
   node coordinator/coord_test.js   (no network, no dependencies) */
'use strict';
const fs = require('fs'), path = require('path');
const C = require('./coord.js');
let fails = 0, passes = 0;
const check = (ok, label, detail) => { if(ok){ passes++; console.log('  ok    ' + label); } else { fails++; console.log('  FAIL  ' + label + (detail !== undefined ? '  — ' + JSON.stringify(detail) : '')); } };
const T = s => Date.parse(s);
const read = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const cfg = read('courses.json');
const clone = x => JSON.parse(JSON.stringify(x));
const deent = cfg.courses.find(c => c.id === 'deent');

console.log('\n=== Time in America/Chicago ===');
check(C.zonedInstant('2026-11-09', '09:00', 'America/Chicago') === T('2026-11-09T15:00:00Z'), '9:00 on 11/09 (CST) is 15:00 UTC');
check(C.zonedInstant('2026-10-27', '08:00', 'America/Chicago') === T('2026-10-27T13:00:00Z'), '8:00 on 10/27 (CDT) is 13:00 UTC');
check(C.zonedInstant('2026-11-01', '00:00', 'America/Chicago') === T('2026-11-01T05:00:00Z'), 'midnight on the day daylight saving ends is 05:00 UTC');
const day = C.examSpan({date: '2026-11-16'}, 'America/Chicago');
check(day.start === T('2026-11-16T06:00:00Z') && day.end === T('2026-11-17T06:00:00Z') && !day.timeKnown, 'an exam with no time covers its whole local day');
const win = C.examSpan({date: '2026-11-17', endDate: '2026-11-19'}, 'America/Chicago');
check(win.end === T('2026-11-20T06:00:00Z'), 'a quiz window ends at the end of its last day');

console.log('\n=== Lifecycle: DEENT through its term ===');
const at = (s, c = deent) => C.lifecycle(c, T(s), cfg);
check(at('2026-11-01T17:00:00Z').status === 'active', '11/01: active (Exam 1 more than 7 days away)', at('2026-11-01T17:00:00Z'));
check(at('2026-11-06T15:00:00Z').status === 'exam-approaching', '11/06: exam-approaching (Exam 1 on 11/09)');
check(/in progress/.test(at('2026-11-09T16:00:00Z').why) && at('2026-11-09T16:00:00Z').status === 'exam-approaching', 'during Exam 1: exam-approaching, in progress');
check(at('2026-11-09T18:00:00Z').next.id === 'exam2', 'after Exam 1 ends, the next exam is Exam 2');
check(at('2026-11-28T18:00:00Z').status === 'active', '11/28: active (the final more than 7 days away)', at('2026-11-28T18:00:00Z'));
check(at('2026-12-01T18:00:00Z').status === 'exam-approaching' && at('2026-12-01T18:00:00Z').next.id === 'final', '12/01: exam-approaching, the final next');
check(at('2026-12-07T20:00:00Z').status === 'exam-approaching', 'on the day of the final (time not recorded): still exam-approaching until the day ends');
check(at('2026-12-08T18:00:00Z').status === 'recently-completed', '12/08: recently-completed');
check(at('2026-12-31T18:00:00Z').status === 'completed', '12/31: completed (more than 21 days after the final)');
check(at('2027-12-31T18:00:00Z').status === 'archived', 'a year after the final: archived');
check(at('2026-11-06T15:00:00Z').flags.some(f => /Exam 2: date 2026-11-16, time not recorded/.test(f)), 'a missing exam time is flagged, not invented');

console.log('\n=== Lifecycle: overrides, reactivation, missing data ===');
const ov = clone(deent); ov.override = {status: 'active', until: '2027-01-31T06:00:00Z', reason: 'course extended'};
check(C.lifecycle(ov, T('2026-12-31T18:00:00Z'), cfg).status === 'active', 'an override keeps a finished course active until its date');
check(C.lifecycle(ov, T('2027-02-01T18:00:00Z'), cfg).status === 'completed', 'after the override ends, the schedule decides again');
const re = clone(deent); re.schedule.exams.push({id: 'spring1', name: 'Spring Exam 1', date: '2027-02-10', start: '09:00', minutes: 90, siteId: null, status: 'planned'});
re.schedule.exams.find(e => e.id === 'final').final = false; re.schedule.exams[re.schedule.exams.length - 1].final = true;
check(C.lifecycle(re, T('2027-01-15T18:00:00Z'), cfg).status === 'active', 'a completed course with a new term\'s exam becomes active again');
const bad = clone(deent); bad.override = {status: 'finished'};
let threw = false; try { C.lifecycle(bad, T('2026-11-06T15:00:00Z'), cfg); } catch(e){ threw = true; }
check(threw, 'an override with an unknown status is refused');
const nodate = {id: 'x', schedule: {exams: [{id: 'e1', name: 'Exam 1', date: null, status: 'planned'}]}};
const nd = C.lifecycle(nodate, T('2026-11-06T15:00:00Z'), cfg);
check(nd.status === 'active' && nd.flags.some(f => /no date recorded/.test(f)) && nd.flags.some(f => /no exam is marked as the final/.test(f)), 'no dated exam: active, with the missing date and final flagged', nd);
const before = JSON.stringify(deent);
for(const d of ['2026-11-01', '2026-11-17', '2026-12-31']) C.lifecycle(deent, T(d + 'T18:00:00Z'), cfg);
check(JSON.stringify(deent) === before, 'working out the lifecycle changes no record (a date passing never changes a release status)');
const dx = clone(deent); dx.activeExam = 'exam1';
check(C.lifecycle(dx, T('2026-11-25T18:00:00Z'), cfg).status === 'active', 'completion does not follow activeExam: on 11/25, with the site still on Exam 1, the course is active (the Final ahead)');

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
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-19T12:00:00Z', lastDeepAt: '2026-11-19T12:00:00Z'}}, {'o/c': 'aaa'}, N,
  [{id: 'save-loss', severity: 'critical', candidateCourses: ['c'], status: 'evaluating'}])[0];
check(r.action === 'review' && /save-loss/.test(r.reason), 'a critical open item is reviewed whatever the lifecycle and cadence', r);
r = P([mk('completed')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-19T12:00:00Z', lastDeepAt: '2026-11-19T12:00:00Z'}}, {'o/c': 'aaa'}, N,
  [{id: 'old', severity: 'critical', candidateCourses: ['c'], status: 'adopted'}])[0];
check(r.action === 'wait', 'a critical item already adopted does not force a review', r);
const order = P([mk('completed', {id: 'a'}), mk('exam-approaching', {id: 'b'}), mk('active', {id: 'd'})], {}, {}, N).map(x => x.course);
check(order.join() === 'b,d,a', 'the plan lists exam-approaching first, then active, then completed', order);
r = P([mk('active')], {c: {lastReviewedCommit: 'aaa', lastReviewAt: '2026-11-10T12:00:00Z'}}, null, N)[0];
check(r.action === 'review' && r.head === null, 'with no head known (offline), a due review is not skipped as unchanged', r);

console.log('\n=== Published content: students see only released exams ===');
const site = txt => C.courseFromJs(txt);
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
let sandboxed = true; try { site("require('fs'); const COURSE = {};"); sandboxed = false; } catch(e){}
check(sandboxed, 'a course file is evaluated with no access to Node (require is not defined)');
const deentFile = path.join(__dirname, '..', '..', 'ro', 'deent', 'src', 'course.js');
if(process.env.DEENT_COURSE_JS || fs.existsSync(deentFile)){
  pr = C.checkPublished(deent, site(fs.readFileSync(process.env.DEENT_COURSE_JS || deentFile, 'utf8')));
  check(pr.ok, 'the real DEENT course.js: only released exams on the site', pr);
}

console.log('\n=== Approvals come only from what pull requests say ===');
const prs = [
  {number: 1, title: 'a', draft: false, head: 'h1', body: '**For Louis\'s yes or no (progress storage), at abc.**', url: 'u1'},
  {number: 2, title: 'b', draft: true, head: 'h2', body: 'For Louis\'s yes or no', url: 'u2'},
  {number: 3, title: 'c', draft: false, head: 'h3', body: 'Test-only; merges under the standing policy.', url: 'u3'}];
const ap = C.approvalsFrom('o/r', prs, sha => sha === 'h3' ? [{name: 'Kit checks', status: 'completed', conclusion: 'cancelled'}] : [{name: 'Kit checks', status: 'completed', conclusion: 'success'}]);
check(ap[0].waitsForLouis && !ap[1].waitsForLouis && !ap[2].waitsForLouis, 'only an open, non-draft pull request whose description says so waits for Louis', ap);
check(ap[2].failedChecks.length === 1 && !ap[0].failedChecks.length, 'a cancelled check on a pull request head is reported', ap);

console.log('\n=== The dashboard (offline) ===');
const dd = require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'coord.js'), 'dashboard', '--offline', '--now', '2026-11-06T15:00:00Z'], {encoding: 'utf8'});
check(/## Courses/.test(dd) && /## Improvements/.test(dd) && /## Approvals/.test(dd) && /## Automation activity/.test(dd), 'the dashboard has its four sections');
check(/PHAR 4346.*exam-approaching.*Exam 1 2026-11-09 09:00.*Final Exam 2026-12-07.*\| Exam 1 \|.*Exam 2 2026-11-16 \(planned\); Exam 3 2026-11-23 \(planned\); Final Exam 2026-12-07 \(planned\)/.test(dd), 'DEENT row: next Exam 1, final 12/07, Exam 1 published, the other three known and not released');
check(/Kit coordinator daily.*proposed \(not configured\)/.test(dd), 'the proposed coordinator task shows as not configured');

console.log('\n=== The records ===');
const ids = new Set();
for(const c of cfg.courses){
  check(!ids.has(c.id), `${c.id}: id unique`); ids.add(c.id);
  const ex = c.schedule.exams;
  check(ex.every(e => C.RELEASE.includes(e.status)), `${c.id}: every exam has a known release status`);
  check(ex.filter(e => e.final).length <= 1, `${c.id}: at most one final`);
  check(ex.every(e => e.source), `${c.id}: every exam names its source`);
  check(ex.every(e => e.status !== 'published' || e.siteId != null), `${c.id}: every published exam names its id on the site`);
  check(!c.override || C.STATUSES.includes(c.override.status), `${c.id}: override status valid`);
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
const blob = ['courses.json', 'state.json', 'improvements.json', 'automations.json'].map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
check(!/gh[p]_[A-Za-z0-9]{20,}|github_[p]at_|"score"|"grade"|"answers"\s*:/.test(blob), 'the records hold no tokens, scores, grades or answer histories');

console.log(fails ? `FAIL: coord_test.js: ${fails} of ${fails + passes} checks failed` : `PASS: coord_test.js: ${passes} checks passed`);
process.exitCode = fails ? 1 : 0;
