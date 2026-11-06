#!/usr/bin/env node
/* The improvement coordinator's engine: reads the records in this folder and works out,
   for each registered course, its lifecycle status, which reviews are due, what changed,
   whether the student site shows only released exams, and the dashboard.

   node coordinator/coord.js status      [--now <ISO>] [--json]
   node coordinator/coord.js plan        [--now <ISO>] [--json] [--heads <file>] [--offline]
   node coordinator/coord.js published   [--course <id>] [--json]
   node coordinator/coord.js dashboard   [--now <ISO>] [--json] [--offline] [--cache <file> | --no-cache]
   node coordinator/coord.js lastseen    (the last successful reads, for a run to commit into state.json)
   node coordinator/coord.js kitupdate   [--json]   (for the kit-update run: which courses' kit-update previews are paused, and why)

   It reads and prints; it never writes a record, pushes, merges or publishes, and it never
   runs a course's code: a course file is read as text (parseCourse). The only file it
   writes is the dashboard's cache of last successful reads, outside the repository. Network
   use: `git ls-remote` for heads, `gh api` for files, pull requests, check runs and Pages
   deployments, raw.githubusercontent.com for public files; --offline skips all of it.
   No dependencies. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

const DIR = __dirname;
const read = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const DAY = 86400000;

/* ---------- credentials never shown or kept ---------- */
// Every error text passes through redact() before it is printed, cached or returned.
const SECRET_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g,                         // GitHub tokens: personal, OAuth, user, server, refresh
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,                       // fine-grained personal tokens
  /\b(x-access-token|x-oauth-basic|oauth2):[^@\s/]+@/gi,     // token in a URL
  /(https?:\/\/)[^\/\s:@]+:[^\/\s@]+@/gi,                    // user:password in a URL
  /\b(authorization|proxy-authorization)\s*[:=]\s*\S+(\s+\S+)?/gi,
  /\b(bearer|token|basic)\s+(?=[A-Za-z0-9._~+\/=-]*\d)[A-Za-z0-9._~+\/=-]{16,}/gi,
  /([?&](access_token|token|key|sig|signature|password)=)[^&\s]+/gi,
  /\b(sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,})\b/g,
  // NAME_TOKEN=..., password=..., password: ..., token: ... These also hide harmless values such as
  // MAX_TOKENS=4096; an error message loses nothing a person needs by that.
  /\b([A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY)[A-Za-z0-9_]*\s*=\s*|(?:password|token)\s*:\s*)(?!\[redacted\])[^\s&]+/gi,
  /\bgh[pousr]_[A-Za-z0-9]{8,15}\b/g                         // short or truncated GitHub tokens
];
function redact(s){
  let t = String(s == null ? '' : s);
  t = t.replace(SECRET_PATTERNS[0], '[redacted]').replace(SECRET_PATTERNS[1], '[redacted]')
       .replace(SECRET_PATTERNS[2], '$1:[redacted]@').replace(SECRET_PATTERNS[3], '$1[redacted]@')
       .replace(SECRET_PATTERNS[4], (m, h) => `${h}: [redacted]`).replace(SECRET_PATTERNS[5], (m, w) => `${w} [redacted]`)
       .replace(SECRET_PATTERNS[6], '$1[redacted]').replace(SECRET_PATTERNS[7], '[redacted]')
       .replace(SECRET_PATTERNS[8], '$1[redacted]').replace(SECRET_PATTERNS[9], '[redacted]');
  return t;
}
const sanitize = s => redact(s).replace(/\s+/g, ' ').trim().slice(0, 240);
// true when a text still holds something that looks like a credential (used by the checks)
const hasSecret = s => /gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,}|(x-access-token|x-oauth-basic|oauth2):(?!\[redacted\])[^@\s\/]+@|:\/\/[^\/\s:@]+:(?!\[redacted\])[^\/\s@]+@|(authorization|proxy-authorization)\s*[:=]\s*(?!\[redacted\])\S|\b(bearer|token|basic)\s+(?!\[redacted\])(?=[A-Za-z0-9._~+\/=-]*\d)[A-Za-z0-9._~+\/=-]{16,}|[?&](access_token|token|key|sig|signature|password)=(?!\[redacted\])[^&\s]|sk-ant-[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,}|\b[A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY)[A-Za-z0-9_]*\s*=\s*(?!\[redacted\])[^\s&]|\b(?:password|token)\s*:\s*(?!\[redacted\])\S|\bgh[pousr]_[A-Za-z0-9]{8,}/i.test(String(s));
const redactDeep = v => typeof v === 'string' ? redact(v) : Array.isArray(v) ? v.map(redactDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redactDeep(x)])) : v;

/* ---------- dates and time in the course's time zone ---------- */
const validDate = s => {
  if(typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};
const validTime = s => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
// the UTC instant of a wall-clock time in a time zone (handles daylight saving)
function zonedInstant(dateStr, timeStr, tz){
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = (timeStr || '00:00').split(':').map(Number);
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for(let i = 0; i < 3; i++){
    const next = Date.UTC(y, mo - 1, d, h, mi) - tzOffset(guess, tz);
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
const dayAfter = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d) + DAY).toISOString().slice(0, 10); };
// an instant given as a full timestamp, or as a date (midnight in the time zone); null if neither
function parseInstant(s, tz){
  if(validDate(s)) return zonedInstant(s, '00:00', tz);
  if(typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(s)){ const t = Date.parse(s); return isNaN(t) ? null : t; }
  return null;
}

// Start and end of a scheduled exam, with what had to be assumed. An exam with no time covers
// its whole local day (or its window of days); an exam with a time and no length ends with its
// day. Nothing is invented: each assumption is returned as a flag.
function examSpan(e, tz){
  const notes = [];
  if(e.date == null) return {span: null, notes: [`${e.name}: no date recorded`]};
  if(!validDate(e.date)) return {span: null, notes: [`${e.name}: date "${e.date}" is not a real calendar date; treated as not recorded`]};
  let last = e.date;
  if(e.endDate != null){
    if(validDate(e.endDate) && e.endDate >= e.date) last = e.endDate;
    else notes.push(`${e.name}: end date "${e.endDate}" ignored (not a real date on or after ${e.date})`);
  }
  const dayEnd = zonedInstant(dayAfter(last), '00:00', tz);
  if(e.start != null && !validTime(e.start)) notes.push(`${e.name}: start "${e.start}" is not a time; treated as not recorded`);
  if(e.start != null && validTime(e.start)){
    const s = zonedInstant(e.date, e.start, tz);
    let end = dayEnd;
    if(Number.isFinite(e.minutes) && e.minutes > 0) end = Math.max(s + e.minutes * 60000, last !== e.date ? dayEnd : 0);
    else notes.push(`${e.name}: length not recorded; counted as lasting to the end of ${last === e.date ? 'its day' : 'its last day'}`);
    return {span: {start: s, end, timeKnown: true}, notes};
  }
  notes.push(`${e.name}: date ${e.date}${last !== e.date ? ' to ' + last : ''}, time not recorded`);
  return {span: {start: zonedInstant(e.date, '00:00', tz), end: dayEnd, timeKnown: false}, notes};
}

/* ---------- lifecycle ---------- */
const STATUSES = ['active', 'exam-approaching', 'recently-completed', 'completed', 'archived'];
const RELEASE = ['planned', 'collecting-material', 'in-development', 'ready-for-review', 'approved', 'published'];

function lifecycle(course, now, cfg){
  const tz = course.timezone || cfg.timezone;
  const d = Object.assign({}, cfg.defaults, course.thresholds || {});
  const flags = [];
  const exams = (course.schedule && course.schedule.exams) || [];
  const spans = exams.map(e => { const r = examSpan(e, tz); flags.push(...r.notes); return {e, s: r.span}; });
  const dated = spans.filter(x => x.s).sort((a, b) => a.s.start - b.s.start);
  const finals = spans.filter(x => x.e.final);
  if(finals.length > 1) flags.push(`${finals.length} exams are marked final; the last of them counts`);
  if(!finals.length && exams.length) flags.push('no exam is marked as the final: completion is judged from the last dated exam');
  if(course.schedule && course.schedule.uncertain) flags.push(course.schedule.uncertain);
  const marked = finals.length ? finals[finals.length - 1] : null;
  const finalUndated = marked && !marked.s;
  if(finalUndated) flags.push(`${marked.e.name} (the final) has no date: the course is not judged complete`);
  const final = marked ? (marked.s ? marked : null) : dated[dated.length - 1] || null;
  if(final) for(const x of dated) if(x !== final && x.s.start > final.s.start) flags.push(`${x.e.name} is dated after ${final.e.name}, which is marked final: check the schedule`);
  const next = dated.find(x => x.s.end > now) || null;
  let status, why, override = null;
  const o = course.override;
  if(o && o.status){
    if(!STATUSES.includes(o.status)) throw new Error(`${course.id}: override status "${o.status}" is not one of ${STATUSES.join(', ')}`);
    const until = o.until == null ? null : parseInstant(o.until, tz);
    if(o.until != null && until == null) flags.push(`override until "${o.until}" is not a date: the override is not applied`);
    else if(until == null || now < until) override = o;
  }
  if(override){
    status = override.status; why = `override: ${override.reason || 'no reason recorded'}${override.until ? ` (until ${override.until})` : ''}`;
  }else if(!dated.length){
    status = 'active'; why = 'no dated exam recorded: treated as active until the schedule is known';
  }else if(next && (!final || next.s.start <= final.s.start || finalUndated)){
    const days = (next.s.start - now) / DAY;
    if(days <= d.approachDays){ status = 'exam-approaching'; why = `${next.e.name} ${days < 0 ? 'in progress' : 'in ' + days.toFixed(1) + ' days'}`; }
    else { status = 'active'; why = `next: ${next.e.name} on ${next.e.date}`; }
  }else if(finalUndated){
    status = 'active'; why = `every dated exam has passed, but ${marked.e.name} has no date: treated as active until it is known`;
  }else{
    const since = (now - final.s.end) / DAY;
    if(since <= d.recentDays){ status = 'recently-completed'; why = `${final.e.name} was ${since.toFixed(1)} days ago`; }
    else if(since <= d.archiveDays){ status = 'completed'; why = `${final.e.name} was ${Math.round(since)} days ago`; }
    else { status = 'archived'; why = `${final.e.name} was ${Math.round(since)} days ago`; }
  }
  return {status, why, flags, next: next ? next.e : null, final: final ? final.e : marked ? marked.e : null};
}

/* ---------- review cadence and change detection ---------- */
const CLOSED = ['adopted', 'rejected', 'deferred'];
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
    const critical = (improvements.items || []).filter(i => i.severity === 'critical' && (i.candidateCourses || []).includes(c.id) && !CLOSED.includes(i.status));
    let action, reason;
    if(critical.length){
      // reviewed whatever the lifecycle; but an unchanged repository reviewed within a day gets a light pass, not a full review again
      if(changed === false && last != null && now - last < DAY){ action = 'light'; reason = `critical open item ${critical.map(i => i.id).join(', ')}; unchanged since today's review`; }
      else { action = 'review'; reason = `critical open item: ${critical.map(i => i.id).join(', ')}`; }
    }
    else if(lc.status === 'archived'){ action = changed ? 'essential-check' : 'skip'; reason = changed ? 'archived course changed' : changed === false ? 'archived: checks only on change' : 'archived; head not known'; }
    else if(deepDue && lc.status === 'completed'){ action = 'deep-audit'; reason = `deep review every ${cad.deepEveryDays} days`; }
    else if(!due){ action = 'wait'; reason = `next review ${new Date(last + cad.everyDays * DAY).toISOString().slice(0, 10)}`; }
    else if(changed === false && lc.status === 'completed'){ action = 'skip'; reason = 'unchanged since the last review'; }
    else if(changed === false){ action = lc.status === 'recently-completed' ? 'retrospective' : 'light'; reason = 'unchanged: open items and readiness only, no full review of unchanged code'; }
    else { action = lc.status === 'recently-completed' ? 'retrospective' : 'review'; reason = changed ? `changed since ${ck.lastReviewedCommit ? ck.lastReviewedCommit.slice(0, 7) : 'no recorded review'}` : 'head not known'; }
    return {course: c.id, status: lc.status, why: lc.why, priority: cad.priority, critical: critical.map(i => i.id), action, reason, head, lastReviewedCommit: ck.lastReviewedCommit || null, lastReviewAt: ck.lastReviewAt || null, flags: lc.flags};
  }).sort((a, b) => (b.critical.length > 0) - (a.critical.length > 0) || b.priority - a.priority);
}

/* ---------- reading a course file without running it ----------
   A course.js is JavaScript. The coordinator never executes it: it splits the text into
   tokens (strings, numbers, names, punctuation; comments and regular expressions skipped)
   and reads only the literal values it needs from the object assigned to COURSE: each
   exams[].id, activeExam and kit.core. A value that is not a literal is reported, not
   guessed. So a course file can't run code, reach Node, the files, the environment or the
   network, and can't hang the coordinator: the scan is one pass over the text. */
function tokenize(src){
  const toks = []; let i = 0; const n = src.length;
  let prevSig = null;   // last significant token, to tell a regular expression from a division
  const push = t => { toks.push(t); prevSig = t; };
  while(i < n){
    const ch = src[i];
    if(ch === '/' && src[i + 1] === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(ch === '/' && src[i + 1] === '*'){ const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if(/\s/.test(ch)){ i++; continue; }
    if(ch === '"' || ch === "'" || ch === '`'){
      let j = i + 1, v = '', esc = false, nl = false;
      while(j < n && src[j] !== ch){ if(src[j] === '\\'){ esc = true; v += src[j + 1] || ''; j += 2; } else { if(src[j] === '\n') nl = true; v += src[j++]; } }
      // esc: the source had a backslash escape (the value above keeps the escape letter, not its
      // meaning, so such a string is never trusted as a key or an id); nl: a raw line break inside
      // a quoted string, which JavaScript refuses, so the tokenizer has lost its place
      push({t: ch === '`' ? 'tpl' : 'str', v, esc, nl: nl && ch !== '`'}); i = j + 1; continue;
    }
    if(ch === '/'){
      const regexOk = !prevSig || (prevSig.t === 'p' && /[(,=:[!&|?{};+\-*%<>~^]/.test(prevSig.v)) || (prevSig.t === 'id' && /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else)$/.test(prevSig.v));
      if(regexOk){
        let j = i + 1, cls = false;
        while(j < n && src[j] !== '\n'){ if(src[j] === '\\'){ j += 2; continue; } if(src[j] === '[') cls = true; else if(src[j] === ']') cls = false; else if(src[j] === '/' && !cls) break; j++; }
        j++; while(j < n && /[a-z]/i.test(src[j])) j++;
        push({t: 're'}); i = j; continue;
      }
    }
    const num = /^-?(?:0x[0-9a-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i.exec(src.slice(i, i + 40));
    if(/[0-9]/.test(ch) && num){ push({t: 'num', v: Number(num[0])}); i += num[0].length; continue; }
    const id = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 200));
    if(id){ push({t: 'id', v: id[0]}); i += id[0].length; continue; }
    push({t: 'p', v: ch}); i++;
  }
  return toks;
}
// the index of the token that closes the bracket opened at toks[k]
function closeOf(toks, k){
  const open = toks[k].v, close = {'{': '}', '[': ']', '(': ')'}[open];
  let depth = 0;
  for(let j = k; j < toks.length; j++){
    if(toks[j].t !== 'p') continue;
    if(toks[j].v === open) depth++;
    else if(toks[j].v === close && --depth === 0) return j;
  }
  return toks.length - 1;
}
// the top-level properties of the object literal between toks[a] ('{') and its close.
// As in JavaScript, a repeated key keeps its last value; repeated keys are listed in
// out.duplicates. An entry that is not `key: value` (a spread, a shorthand property, a
// computed key, a getter, setter or method) is listed in out.irregular: what it adds or
// replaces cannot be read without running the code.
function props(toks, a){
  const out = new Map(), b = closeOf(toks, a);
  out.duplicates = new Set(); out.irregular = [];
  const valueEnd = vs => {
    let ve = vs;
    // a value runs to the next comma at this level
    while(ve < b){
      const t = toks[ve];
      if(t.t === 'p' && /[{[(]/.test(t.v)){ ve = closeOf(toks, ve) + 1; continue; }
      if(t.t === 'p' && t.v === ',') break;
      ve++;
    }
    return ve;
  };
  let j = a + 1;
  while(j < b){
    const k = toks[j];
    if(k.t === 'p' && k.v === ','){ j++; continue; }
    if((k.t === 'id' || (k.t === 'str' && !k.esc) || k.t === 'num') && toks[j + 1] && toks[j + 1].t === 'p' && toks[j + 1].v === ':'){
      const vs = j + 2, ve = valueEnd(vs), key = String(k.v);
      if(out.has(key)) out.duplicates.add(key);
      out.set(key, {s: vs, e: ve});
      j = ve + 1; continue;
    }
    // anything else is an entry whose effect is not literal
    const ve = valueEnd(j);
    out.irregular.push(toks.slice(j, Math.min(ve, j + 3)).map(t => t.v === undefined ? t.t : String(t.v)).join(' '));
    j = ve + 1;
  }
  return out;
}
// the value range r is exactly one bracketed literal opened by `open` ({ or [), with nothing after it
const wholeBracket = (toks, r, open) => r && toks[r.s] && toks[r.s].t === 'p' && toks[r.s].v === open && closeOf(toks, r.s) + 1 === r.e;
// a literal value (string, number, true, false, null), or undefined when it is anything else
function literal(toks, r){
  if(!r || r.e - r.s !== 1) return undefined;
  const t = toks[r.s];
  if(t.t === 'str' && !t.esc) return t.v;
  if(t.t === 'num') return t.v;
  if(t.t === 'tpl' && !t.esc && !/\$\{/.test(t.v)) return t.v;
  if(t.t === 'id' && t.v === 'null') return null;
  return undefined;
}
// Identifiers whose presence means the file may change COURSE in a way a text reading cannot
// see (code run from a string, a timer, the page's globals, reflection; in a classic script
// `this` at the top level is the global object). Any of them makes the file "not checked".
// `window`, `globalThis` and `this` are allowed only as `window.COURSE =`, the declaration.
const UNREADABLE_IDS = /^(this|eval|Function|setTimeout|setInterval|queueMicrotask|requestAnimationFrame|import|require|document|window|globalThis|self|top|parent|frames|Reflect|Proxy|with|fetch|location|navigator|define)$/;
const LINE_TERMINATORS = new RegExp('[' + String.fromCharCode(13, 0x2028, 0x2029) + ']');
function parseCourse(text){
  text = String(text);
  const toks = tokenize(text);
  // incomplete: reasons the file cannot be checked without running it. Any one of them makes
  // the release check "not checked" (ok: null), never ok: the check fails closed. The rules
  // below are deliberately wider than what a real course.js uses (the kit template, DEENT and
  // Medicinal-chemistry use none of these constructs), so a file that trips one is read by a
  // person, not passed.
  const incomplete = [];
  if(LINE_TERMINATORS.test(text)) incomplete.push('the file contains a carriage return or a Unicode line separator, which ends a comment or line in JavaScript but not in this reading: not checked');
  if(toks.some(t => t.t === 're')) incomplete.push('the file contains a regular expression literal or an ambiguous slash: not checked');
  if(toks.some(t => t.t === 'p' && t.v === '\\')) incomplete.push('the file contains a backslash outside a string or comment (an escaped identifier): not checked');
  if(toks.some(t => t.t === 'tpl' && /\$\{/.test(t.v))) incomplete.push('the file contains a template literal with a substitution, which can run code: not checked');
  if(toks.some(t => t.t === 'str' && t.nl)) incomplete.push('a quoted string spans a line break, so the tokenizer lost its place: not checked');
  if(toks.some(t => (t.t === 'str' || t.t === 'tpl') && /COURSE\s*[.\[=(;]/.test(t.v))) incomplete.push('a string mentions COURSE as code (it could be run or has swallowed code): not checked');
  // COURSE = {   (const/let/var COURSE, window.COURSE, globalThis.COURSE)
  const decl = [];
  for(let j = 0; j + 2 < toks.length; j++){
    if(toks[j].t === 'id' && toks[j].v === 'COURSE' && toks[j + 1].t === 'p' && toks[j + 1].v === '=' && toks[j + 2].t === 'p' && toks[j + 2].v === '{') decl.push(j);
  }
  if(!decl.length) throw new Error('no object literal assigned to COURSE');
  if(decl.length > 1) incomplete.push(`COURSE is assigned ${decl.length} times: not checked`);
  const at = decl[0] + 2, close = closeOf(toks, at);
  // the literal must stand alone: nothing such as .concat(...) or ||  applied to it
  const after = toks[close + 1];
  if(after && !(after.t === 'p' && after.v === ';') && !(after.t === 'id' && /^(const|let|var|function|class|if|for|while|window|globalThis|COURSE)$/.test(after.v))) incomplete.push(`the COURSE literal is followed by "${after.v === undefined ? after.t : after.v}": not checked`);
  // any other mention of COURSE can change it (COURSE.exams.push(...), COURSE.activeExam = ...,
  // Object.assign(COURSE, ...), an alias): the file is not checked
  const declNames = new Set(decl);
  const others = [];
  for(let j = 0; j < toks.length; j++) if(toks[j].t === 'id' && toks[j].v === 'COURSE' && !declNames.has(j)) others.push(j);
  if(others.length) incomplete.push(`COURSE is referenced ${others.length} time${others.length > 1 ? 's' : ''} outside its declaration (it may change after the literal): not checked`);
  // identifiers that can change COURSE without naming it in a readable way
  const risky = new Set();
  for(let j = 0; j < toks.length; j++){
    const t = toks[j];
    if(t.t !== 'id' || !UNREADABLE_IDS.test(t.v)) continue;
    if((t.v === 'window' || t.v === 'globalThis' || t.v === 'this') && toks[j + 1] && toks[j + 1].t === 'p' && toks[j + 1].v === '.' && declNames.has(j + 2)) continue;   // window.COURSE = {
    risky.add(t.v);
  }
  if(risky.size) incomplete.push(`the file uses ${[...risky].join(', ')}, which can change COURSE in a way this reading cannot see: not checked`);
  const top = props(toks, at);
  if(top.irregular.length) incomplete.push(`COURSE has entries that are not key: value (${top.irregular.slice(0, 3).join('; ')}): not checked`);
  for(const k of ['exams', 'activeExam']) if(top.duplicates.has(k)) incomplete.push(`COURSE.${k} is given more than once: not checked`);
  const exams = [];
  const ex = top.get('exams');
  if(!ex) incomplete.push('COURSE has no exams property: not checked');
  else if(!wholeBracket(toks, ex, '[')) incomplete.push('COURSE.exams is not a single array literal: not checked');
  else {
    const end = closeOf(toks, ex.s);
    for(let j = ex.s + 1; j < end; j++){
      if(toks[j].t === 'p' && toks[j].v === ','){ continue; }
      if(toks[j].t === 'p' && toks[j].v === '{'){
        const ce = closeOf(toks, j), nx = toks[ce + 1];
        if(nx && !(nx.t === 'p' && (nx.v === ',' || (nx.v === ']' && ce + 1 === end)))) incomplete.push('an entry of COURSE.exams is not a plain object literal: not checked');
        const p = props(toks, j), idr = p.get('id'), id = literal(toks, idr);
        if(p.irregular.length) incomplete.push(`an exam has entries that are not key: value (${p.irregular.slice(0, 3).join('; ')}): not checked`);
        if(p.duplicates.has('id')) incomplete.push(`an exam's id is given more than once: not checked`);
        if(id === undefined) incomplete.push(`an exam's id is not a literal: not checked`);
        else exams.push({id});
        j = ce;
        continue;
      }
      incomplete.push('an entry of COURSE.exams is not an object literal: not checked');
      // skip to the next entry
      while(j < end && !(toks[j].t === 'p' && toks[j].v === ',')){ if(toks[j].t === 'p' && /[{[(]/.test(toks[j].v)) j = closeOf(toks, j); j++; }
    }
  }
  let activeExam;
  const ae = top.get('activeExam');
  if(ae){ activeExam = literal(toks, ae); if(activeExam === undefined) incomplete.push('COURSE.activeExam is not a literal: not checked'); }
  let kitCore = null;
  const kit = top.get('kit');
  if(kit && wholeBracket(toks, kit, '{')){ const c = literal(toks, props(toks, kit.s).get('core')); if(typeof c === 'string') kitCore = c; }
  // warnings: the same list under its earlier name, kept for the older checks in coord_test.js
  return {exams, activeExam: activeExam === undefined ? null : activeExam, kit: kitCore ? {core: kitCore} : null, incomplete, warnings: incomplete};
}

/* ---------- published-content separation ---------- */
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
  const ae = active == null ? null : bySite.get(active);
  if(active != null && (!ae || ae.status !== 'published')) problems.push(`the site opens on exam "${active}", which is not a published exam in the schedule`);
  for(const e of sched){
    if(!RELEASE.includes(e.status)) problems.push(`${e.name}: release status "${e.status}" is not one of ${RELEASE.join(', ')}`);
    if(e.status === 'published' && !siteExams.includes(String(e.siteId))) notes.push(`${e.name} is recorded as published but the site does not list it: update the record or the site`);
  }
  const hidden = sched.filter(e => e.status !== 'published').map(e => `${e.name} (${e.status})`);
  // a file that could not be read completely is never reported as ok
  const incomplete = courseObj.incomplete || [];
  if(incomplete.length) return {ok: null, notChecked: true, problems: [...incomplete, ...problems], notes, siteExams, activeExam: active == null ? null : active, knownNotReleased: hidden};
  return {ok: !problems.length, problems, notes, siteExams, activeExam: active == null ? null : active, knownNotReleased: hidden};
}

/* ---------- live data (skipped with --offline) ---------- */
// Each read says what happened: ok; missing (the repository, read with access, answered that
// the file is not there); or unavailable (this session could not ask, or GitHub would not say:
// no credentials for the repository, the proxy refused, no network, a private repository's
// 404). "Unavailable" is never reported as the repository or its site being down.
const RUN_TIMEOUT = 30000;
function run(cmd, args, timeout = RUN_TIMEOUT){
  // a child that does not finish in time is killed outright (SIGKILL), so none is left running
  try { return {ok: true, out: cp.execFileSync(cmd, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout, killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024})}; }
  catch(e){ return {ok: false, timedOut: e.code === 'ETIMEDOUT' || e.signal === 'SIGKILL', err: sanitize(String((e.stderr || '') + ' ' + (e.message || '')).slice(0, 1200))}; }
}
const is404 = err => /HTTP 404|Not Found/i.test(err);
const repoReadable = (() => { const memo = new Map(); return repo => { if(!memo.has(repo)) memo.set(repo, run('gh', ['api', `repos/${repo}`, '--jq', '.full_name']).ok); return memo.get(repo); }; })();
function liveHead(repo, ref){
  const r = run('git', ['ls-remote', `https://github.com/${repo}`, ref ? `refs/heads/${ref}` : 'HEAD']);
  if(r.ok && r.out.trim()) return {state: 'ok', head: r.out.split(/\s/)[0]};
  if(r.ok) return {state: 'missing', why: `no ${ref ? 'branch ' + ref : 'HEAD'}`};
  return {state: 'unavailable', why: r.err || 'no answer'};
}
function liveFile(repo, file, ref){
  const r = run('gh', ['api', `repos/${repo}/contents/${file}${ref ? '?ref=' + encodeURIComponent(ref) : ''}`, '--jq', '.content']);
  if(r.ok) return {state: 'ok', text: Buffer.from(r.out.trim(), 'base64').toString('utf8'), via: 'GitHub API'};
  // a 404 means the file is missing only when this session can read the repository at all
  if(is404(r.err) && repoReadable(repo)) return {state: 'missing', via: 'GitHub API'};
  const g = run('curl', ['-sS', '--max-time', '25', '-w', '\n%{http_code}', `https://raw.githubusercontent.com/${repo}/${ref || 'HEAD'}/${file}`]);
  if(g.ok){
    const i = g.out.lastIndexOf('\n'), code = g.out.slice(i + 1).trim();
    if(code === '200') return {state: 'ok', text: g.out.slice(0, i), via: 'raw.githubusercontent.com'};
  }
  return {state: 'unavailable', why: r.err};
}
function livePRs(repo){
  const r = run('gh', ['api', `repos/${repo}/pulls?state=open&per_page=100`, '--jq',
    '[.[] | {number, title, draft, head: .head.sha, body: (.body // ""), url: .html_url}]']);
  if(r.ok){ try { return {state: 'ok', prs: JSON.parse(r.out)}; } catch(e){ return {state: 'unavailable', why: 'unreadable answer from the GitHub API'}; } }
  return {state: 'unavailable', why: r.err};
}
// how far the default (working) branch is ahead of the branch Pages serves: unreleased work
function liveAhead(repo, pagesBranch){
  const m = run('gh', ['api', `repos/${repo}`, '--jq', '.default_branch']);
  if(!m.ok) return {state: 'unavailable', why: m.err};
  const def = m.out.trim();
  if(def === pagesBranch) return {state: 'ok', value: {defaultBranch: def, ahead: 0}};
  const c = run('gh', ['api', `repos/${repo}/compare/${encodeURIComponent(pagesBranch)}...${encodeURIComponent(def)}`, '--jq', '.ahead_by']);
  if(!c.ok) return {state: 'unavailable', why: c.err};
  return {state: 'ok', value: {defaultBranch: def, ahead: +c.out.trim()}};
}
// The revision GitHub Pages last deployed: the head of the newest successful "pages build and
// deployment" run. The Pages source setting itself is not read (this session's proxy refuses
// repos/<repo>/pages); with no successful deployment run found, the live revision is unknown.
function liveDeployed(repo){
  const r = run('gh', ['api', `repos/${repo}/actions/runs?per_page=50`, '--jq',
    '[.workflow_runs[] | select(.name == "pages build and deployment") | {sha: .head_sha, branch: .head_branch, status, conclusion, at: .updated_at, id}]']);
  if(!r.ok) return {state: 'unavailable', why: r.err};
  let runs; try { runs = JSON.parse(r.out); } catch(e){ return {state: 'unavailable', why: 'unreadable answer from the GitHub API'}; }
  const ok = runs.find(x => x.status === 'completed' && x.conclusion === 'success');
  const newest = runs[0] || null;
  return {state: 'ok', value: ok ? {sha: ok.sha, branch: ok.branch, at: ok.at, run: ok.id, newer: newest && newest.id !== ok.id ? `${newest.status} ${newest.conclusion || ''}`.trim() : null} : null};
}
// the newest run of each workflow on a commit (an older failed attempt does not count once a rerun passed)
function liveChecks(repo, sha){
  const r = run('gh', ['api', `repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`, '--jq', '[.workflow_runs[] | {name, status, conclusion, id, attempt: .run_attempt}]']);
  if(!r.ok) return null;
  let runs; try { runs = JSON.parse(r.out); } catch(e){ return null; }
  const latest = new Map();
  for(const x of runs){ const k = latest.get(x.name); if(!k || x.id > k.id || (x.id === k.id && x.attempt > k.attempt)) latest.set(x.name, x); }
  return [...latest.values()];
}

/* ---------- last successful reads ----------
   The dashboard keeps the last successful result of each read, with the wall-clock time it was
   read, in a cache file outside the repository (default ~/.cache/exam-drill-kit/dashboard.json,
   or --cache), and also reads state.json "lastSeen", which coordinator runs commit (RUN.md
   step 4) so the last results survive a new container. For each key the newer of the two wins,
   in get() and in all(). Values are redacted before they are kept; errors are never kept. */
function lastSeenStore(cacheFile, state){
  let cache = {};
  try { const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); if(c && typeof c === 'object' && !Array.isArray(c)) cache = c; } catch(e){}
  const committed = (state && state.lastSeen && typeof state.lastSeen === 'object') ? state.lastSeen : {};
  const ok = e => e && typeof e === 'object' && typeof e.at === 'string' && !isNaN(Date.parse(e.at));
  const newer = (a, b) => !ok(a) ? (ok(b) ? b : null) : !ok(b) ? a : Date.parse(a.at) >= Date.parse(b.at) ? a : b;
  return {
    get: key => newer(cache[key], committed[key]),
    put(key, value, at){ cache[key] = {at, value: redactDeep(value)}; },
    save(){ if(!cacheFile) return; try { fs.mkdirSync(path.dirname(cacheFile), {recursive: true}); fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1)); } catch(e){} },
    all(){ const out = {}; for(const k of new Set([...Object.keys(committed), ...Object.keys(cache)])){ const v = newer(cache[k], committed[k]); if(v) out[k] = v; } return out; }
  };
}
const UNAVAILABLE = 'Access unavailable—status not checked';
// the kit commits a course is behind, from its kit.core pin, counted on core/ against this
// checkout's origin/main as last fetched (the dashboard skill fetches first; nothing is fetched here)
function kitBehind(pin){
  if(!pin || !/^[0-9a-f]{7,40}$/i.test(pin)) return null;
  const r = run('git', ['-C', path.join(DIR, '..'), 'rev-list', '--count', `${pin}..origin/main`, '--', 'core']);
  return r.ok ? +r.out.trim() : null;
}

/* ---------- approvals: an explicit line in the pull request, or "unclear" ----------
   A pull request states its approval status on a line of its own description:
     Approval: awaiting Louis
     Approval: approved by Louis on <YYYY-MM-DD> at <commit>
     Approval: not needed (<reason>)
   "approved" counts only while the pull request's head is that commit; a later head makes it
   unclear again. A description with no such line but with older wording that asks for Louis's
   answer is "unclear", with the sentence quoted. Passing checks never make anything approved. */
const APPROVAL_LINE = /^[ \t>*_-]*Approval:\**[ \t]*(.+?)[ \t*_]*$/im;
const LEGACY = /[^.\n]*(For Louis[’']s yes or no|needs your yes|waits? for (?:your|Louis[’']s) (?:yes|approval|decision|reply)|awaiting (?:your|Louis[’']s) (?:yes|approval|decision)|needs Louis[’']s (?:yes|approval))[^.\n]*/i;
function approvalStatus(body, head){
  const b = String(body || '');
  const m = APPROVAL_LINE.exec(b);
  if(m){
    const line = m[1].trim(), src = `description: "Approval: ${line}"`;
    if(/^awaiting\b/i.test(line)) return {status: 'awaiting approval', source: src};
    if(/^not needed\b/i.test(line)) return {status: 'not needed', source: src};
    const ap = /^approved\b.*?\bat\s+([0-9a-f]{7,40})\b/i.exec(line);
    if(ap){
      if(head && head.toLowerCase().startsWith(ap[1].toLowerCase())) return {status: 'approved', source: src};
      return {status: 'unclear', source: `${src}; the head is now ${head ? head.slice(0, 7) : 'unknown'}, not ${ap[1]}`};
    }
    return {status: 'unclear', source: `${src} (not one of: awaiting Louis; approved by Louis on <date> at <commit>; not needed)`};
  }
  const l = LEGACY.exec(b);
  if(l) return {status: 'unclear', source: `no "Approval:" line; the description says: "${l[0].trim().slice(0, 160)}"`};
  return {status: 'none stated', source: 'no "Approval:" line and no request for Louis\'s answer'};
}
function approvalsFrom(repo, prs, checksOf){
  return (prs || []).map(p => {
    let runs = null;
    try { runs = checksOf ? checksOf(p.head) : null; } catch(e){ runs = null; }   // checks that cannot be read are "not read", never "no failures"
    const failed = runs ? runs.filter(r => r.status === 'completed' && !['success', 'skipped', 'neutral'].includes(r.conclusion)).map(r => `${r.name}: ${r.conclusion}`) : null;
    const running = runs ? runs.filter(r => r.status !== 'completed').map(r => r.name) : null;
    const a = approvalStatus(p.body, p.head);
    return {repo, number: p.number, title: p.title, url: p.url, draft: !!p.draft, head: p.head ? p.head.slice(0, 7) : null,
      approval: a.status, approvalSource: a.source, failedChecks: failed, runningChecks: running, checksRead: runs != null};
  });
}

/* ---------- dashboard ---------- */
function dashboard(now, opts){
  opts = opts || {};
  const cfg = read('courses.json'), state = read('state.json'), imp = read('improvements.json'), auto = read('automations.json');
  const offline = !!opts.offline, at = new Date(now).toISOString();
  const readAt = () => new Date(opts.clock ? opts.clock() : Date.now()).toISOString();   // when a read happened, not --now
  const io = Object.assign({liveHead, liveFile, livePRs, liveChecks, kitBehind, liveAhead, liveDeployed}, opts.io || {});   // opts.io: test doubles
  const seen = lastSeenStore(opts.cache === undefined ? path.join(os.homedir(), '.cache', 'exam-drill-kit', 'dashboard.json') : opts.cache, state);
  // one read: live when it can be made, otherwise the last successful result and its time
  const access = [];
  function readOr(key, label, fn){
    if(offline) return {state: 'not-read', last: seen.get(key)};
    let r;
    try { r = fn(); } catch(e){ r = {state: 'unavailable', why: sanitize('the read failed: ' + (e && e.message))}; }
    if(r && (r.state === 'ok' || r.state === 'missing')){ seen.put(key, r.state === 'ok' ? r.value : {missing: true}, readAt()); return r; }
    const why = sanitize(r && r.why || 'no detail');
    access.push({what: label, why});
    return {state: 'unavailable', why, last: seen.get(key)};
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
    const pagesBranch = c.pagesBranch || 'main';
    // what is live: the commit of the last successful Pages deployment
    const dep = readOr(`deployed|${c.repo}`, `${c.repo}: Pages deployments (GitHub API)`, () => io.liveDeployed(c.repo));
    const deployed = dep.state === 'ok' ? dep.value : null;
    let pub = null, pin = null, behind = null, preview = {state: 'not-read'};
    const ref = deployed ? deployed.sha : pagesBranch;
    const basis = deployed ? `the deployed commit ${deployed.sha.slice(0, 7)} (Pages run ${deployed.run}, ${deployed.at})` : dep.state === 'ok' ? `the head of ${pagesBranch}; no successful Pages deployment found, so the live revision is unknown` : `the head of ${pagesBranch}; the deployments could not be read, so the live revision is unknown`;
    if(c.siteKind === 'kit'){
      const cf = readOr(`course|${c.repo}`, `${c.repo}: ${c.courseFile} at ${ref}`, () => {
        const f = io.liveFile(c.repo, c.courseFile, ref);
        if(f.state !== 'ok') return f;
        try { const co = parseCourse(f.text); return {state: 'ok', value: {pub: checkPublished(c, co), pin: co.kit && co.kit.core || null}}; }
        catch(e){ return {state: 'ok', value: {pub: {ok: false, problems: ['course file could not be read: ' + sanitize(e.message)]}, pin: null}}; }
      });
      if(cf.state === 'ok'){ pub = Object.assign({checked: 'live', basis}, cf.value.pub); pin = cf.value.pin; }
      else if(cf.state === 'missing') pub = {checked: 'live', basis, ok: false, problems: [`${c.courseFile} not found at ${ref}`]};
      else pub = {checked: cf.state, why: cf.why, last: cf.last, basis};
      if(pin && !offline) behind = io.kitBehind(pin);
      // a preview waits when the live revision carries a /preview/ built after its live page
      // (version.json holds only a build time, so the times are compared, not the text)
      preview = readOr(`preview|${c.repo}`, `${c.repo}: version.json and preview/version.json at ${ref}`, () => {
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
    const ahead = readOr(`ahead|${c.repo}`, `${c.repo}: default branch against ${pagesBranch} (GitHub API)`, () => io.liveAhead(c.repo, pagesBranch));
    const sched = (c.schedule && c.schedule.exams) || [];
    const open = (imp.items || []).filter(i => (i.candidateCourses || []).includes(c.id) && !CLOSED.includes(i.status) && ['critical', 'high'].includes(i.severity));
    return {id: c.id, code: c.code, name: c.name, repo: c.repo, site: c.site, term: c.term, siteKind: c.siteKind, status: lc.status, why: lc.why,
      next: lc.next ? `${lc.next.name} ${lc.next.date}${lc.next.start ? ' ' + lc.next.start : ''}` : null,
      final: lc.final ? `${lc.final.name} ${lc.final.date || '(date not recorded)'}` : null,
      published: sched.filter(e => e.status === 'published').map(e => e.name),
      knownFuture: sched.filter(e => e.status !== 'published').map(e => `${e.name} ${e.date || 'date not recorded'} (${e.status})`),
      developing: c.inDevelopment || [], lastReview: p.lastReviewAt, nextAction: `${p.action}: ${p.reason}`, head: headRead[c.repo],
      deployed: dep, kitPin: pin, kitBehind: behind, kitUpdate: kitUpdateState(c), preview, ahead, publication: pub, flags: lc.flags, openProblems: open.map(i => i.id)};
  });
  const approvals = [];
  for(const repo of [cfg.kitRepo, ...cfg.courses.map(c => c.repo)]){
    const r = readOr(`prs|${repo}`, `${repo}: open pull requests (GitHub API)`, () => {
      const x = io.livePRs(repo);
      return x.state === 'ok' ? {state: 'ok', value: approvalsFrom(repo, x.prs, sha => io.liveChecks(repo, sha))} : x;
    });
    if(r.state === 'ok') approvals.push({repo, checked: 'live', items: r.value});
    else approvals.push({repo, checked: r.state, why: r.why, last: r.last});
  }
  if(!offline) seen.save();
  return redactDeep({generatedAt: at, offline, courses, plan: pl, improvements: imp.items || [], approvals, access, automations: auto.automations || [], lastSeen: seen.all()});
}

function md(d){
  const L = [], cell = s => String(s == null ? '—' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  L.push(`# Exam Drill Dashboard`, ``, `Generated ${d.generatedAt}${d.offline ? ' (offline: no repository heads, course files, deployments or pull requests read)' : ''}.`, ``);
  L.push(`## Courses`, ``, `| Course | Status | Next exam | Final | Published | Known, not released | Live revision | Kit pin (behind) | Preview waiting; unreleased work | Next review | Problems |`, `|---|---|---|---|---|---|---|---|---|---|---|`);
  const lastTxt = l => l ? ` (last successful read ${l.at})` : ' (no earlier successful read)';
  for(const c of d.courses){
    let probs;
    const pb = c.publication;
    if(!pb) probs = c.siteKind === 'kit' ? 'release check not run' : 'release check not run (not a kit course)';
    else if(pb.checked === 'unavailable' || pb.checked === 'not-read'){
      const last = pb.last && pb.last.value && pb.last.value.pub;
      probs = `${pb.checked === 'unavailable' ? UNAVAILABLE : 'not read (offline)'}${lastTxt(pb.last)}${last ? ': ' + (last.ok ? 'only released exams on the site' : last.problems.join('; ')) : ''}`;
    }else probs = (pb.ok ? 'only released exams on the site' : pb.ok === null ? 'not checked: ' + pb.problems.join('; ') : pb.problems.join('; ')) + `, read at ${pb.basis}`;
    if(c.openProblems.length) probs += `; open: ${c.openProblems.join(', ')}`;
    const dp = c.deployed;
    const depTxt = dp.state === 'ok' ? (dp.value ? `${dp.value.sha.slice(0, 7)} on ${dp.value.branch}, deployed ${dp.value.at}${dp.value.newer ? `; a newer Pages run is ${dp.value.newer}` : ''}` : 'unknown: no successful Pages deployment found')
      : dp.state === 'unavailable' ? `${UNAVAILABLE}${lastTxt(dp.last)}${dp.last && dp.last.value ? ': ' + dp.last.value.sha.slice(0, 7) : ''}` : 'not read (offline)';
    const pv = c.preview;
    const pvTxt = pv.state === 'ok' ? (pv.value ? 'yes' : 'no') : pv.state === 'unavailable' ? `${UNAVAILABLE}${lastTxt(pv.last)}${pv.last ? ': ' + (pv.last.value ? 'yes' : 'no') : ''}` : '—';
    const pinTxt = c.kitPin ? c.kitPin + (c.kitBehind != null ? ` (${c.kitBehind} core commits behind)` : '') : c.siteKind === 'kit' ? (pb && pb.last && pb.last.value && pb.last.value.pin ? `${pb.last.value.pin}${lastTxt(pb.last)}` : 'not read') : 'not a kit course';
    const ah = c.ahead && c.ahead.state === 'ok' && c.ahead.value.ahead > 0 ? `; working branch \`${c.ahead.value.defaultBranch}\` ${c.ahead.value.ahead} commits ahead of the live branch` : c.ahead && c.ahead.state === 'unavailable' ? `; working branch: ${UNAVAILABLE}` : '';
    const kp = c.kitUpdate && c.kitUpdate.previews === 'paused' ? `; kit-update previews paused since ${c.kitUpdate.since}` : c.kitUpdate && c.kitUpdate.previews === 'invalid' ? `; kitUpdate record invalid (${c.kitUpdate.error})` : '';
    const nextRev = c.head && c.head.state === 'unavailable' ? `${UNAVAILABLE} (repository head)${lastTxt(c.head.last)}` : c.nextAction;
    L.push(`| [${cell(c.code)}](https://github.com/${c.repo}) ${cell(c.name)}, ${cell(c.term)} | ${c.status}: ${cell(c.why)} | ${cell(c.next)} | ${cell(c.final)} | ${cell(c.published.join(', ') || 'none')} | ${cell(c.knownFuture.join('; ') || 'none')} | ${cell(depTxt)} | ${cell(pinTxt + kp)} | ${cell(pvTxt + ah)} | ${cell(nextRev)} | ${cell(probs)} |`);
  }
  const fl = d.courses.filter(c => c.flags.length);
  if(fl.length){ L.push(``, `**Schedule uncertainties:**`); for(const c of fl) L.push(`- ${c.code}: ${c.flags.join('; ')}`); }
  L.push(``, `## Improvements`, ``, `| Id | Title | Source | Kind | Status | In the kit | Candidate courses | PRs |`, `|---|---|---|---|---|---|---|---|`);
  for(const i of d.improvements) L.push(`| ${cell(i.id)} | ${cell(i.title)} | ${cell(i.sourceRepo)}${i.sourceCommit ? ' ' + cell(i.sourceCommit) : ''} | ${cell(i.kind)} | ${cell(i.status)} | ${cell(i.existsInKit)} | ${cell((i.candidateCourses || []).join(', '))} | ${cell((i.prs || []).join(', ') || '—')} |`);
  L.push(``, `## Approvals`, ``, `Each pull request's approval status comes from its own description ("Approval:" line); passing checks never count as approval.`, ``);
  const live = d.approvals.filter(a => a.checked === 'live'), notChecked = d.approvals.filter(a => a.checked !== 'live');
  const items = live.flatMap(a => a.items);
  const row = a => `- [${a.repo}#${a.number}](${a.url})${a.draft ? ' (draft)' : ''} ${a.title} — head ${a.head}; ${a.approvalSource}`;
  for(const [title, st] of [['Awaiting your approval', 'awaiting approval'], ['Unclear: needs an explicit status', 'unclear'], ['Approved at the current head', 'approved']]){
    const g = items.filter(a => a.approval === st);
    L.push(`**${title}:**`, ...(g.length ? g.map(row) : ['- none in the repositories read']), ``);
  }
  const f = items.filter(a => a.failedChecks && a.failedChecks.length), nr = items.filter(a => !a.checksRead);
  L.push(`**Failed or cancelled checks on an open pull request's head** (newest run of each workflow):`);
  L.push(...(f.length ? f.map(a => `- [${a.repo}#${a.number}](${a.url})${a.draft ? ' (draft)' : ''}: ${a.failedChecks.join('; ')}`) : ['- none in the repositories read']));
  if(nr.length) L.push(``, `**Checks not read** (${UNAVAILABLE}): ${nr.map(a => `${a.repo}#${a.number}`).join(', ')}`);
  const pv = d.courses.filter(c => c.preview.state === 'ok' && c.preview.value);
  L.push(``, `**Course previews built after the live page** (approval needed before they go live):`);
  L.push(...(pv.length ? pv.map(c => `- ${c.code}: \`/preview/\` at the live revision is newer than the live page`) : ['- none in the repositories read']));
  if(notChecked.length){
    L.push(``, `**${d.offline ? 'Not read (offline)' : UNAVAILABLE}** for these repositories' pull requests; this says nothing about whether the repository or its site is up:`);
    for(const a of notChecked){
      const lv = a.last && a.last.value;
      const sum = lv ? `last successful read ${a.last.at}: ${lv.filter(x => x.approval === 'awaiting approval').length} awaiting approval, ${lv.filter(x => x.approval === 'unclear').length} unclear, ${lv.filter(x => x.failedChecks && x.failedChecks.length).length} with failed checks` : 'no earlier successful read';
      L.push(`- ${a.repo}: ${sum}`);
    }
  }
  if(d.access.length){
    L.push(``, `**Reads this session could not make** (errors with credentials removed):`);
    for(const x of d.access) L.push(`- ${x.what}: ${x.why || 'no detail'}`);
  }
  L.push(``, `## Automation activity`, ``, `| Automation | Kind | Responsibility | Schedule or trigger | State | Last run recorded | Verified |`, `|---|---|---|---|---|---|---|`);
  for(const a of d.automations) L.push(`| ${cell(a.name)} | ${cell(a.kind)} | ${cell(a.responsibility)} | ${cell(a.schedule)} | ${cell(a.state)} | ${cell(a.lastRun)} | ${cell(a.verified)} |`);
  return redact(L.join('\n'));
}

/* ---------- kit-update previews: active, or paused for a course ---------- */
// A course's `kitUpdate` record (courses.json). No record means previews are active. A pause
// stops the kit-update run from preparing a kit-update preview for that course only; the run's
// read-only checks (preflight, the pin on the Pages branch against the kit, the Pages deploy) go on.
const KIT_PREVIEWS = ['active', 'paused'];
function kitUpdatePolicy(course){
  const base = {course: course.id, repo: course.repo, pagesBranch: course.pagesBranch || 'main'};
  const k = course.kitUpdate;
  if(!k) return Object.assign(base, {previews: 'active'});
  if(!KIT_PREVIEWS.includes(k.previews)) throw new Error(`${course.id}: kitUpdate.previews must be one of ${KIT_PREVIEWS.join(', ')}`);
  if(k.previews === 'paused'){
    for(const f of ['since', 'reason', 'liftWhen', 'source']) if(!k[f] || typeof k[f] !== 'string') throw new Error(`${course.id}: a kit-update pause needs ${f}`);
    if(isNaN(Date.parse(k.since))) throw new Error(`${course.id}: kitUpdate.since is not a date`);
  }
  return Object.assign(base, {previews: k.previews, since: k.since || null, reason: k.reason || null, liftWhen: k.liftWhen || null, source: k.source || null});
}

// for the dashboard and `kitupdate`: an invalid record is reported for its course, never
// thrown, so one bad record does not hide every other course
function kitUpdateState(course){
  try { return kitUpdatePolicy(course); }
  catch(e){ return {course: course.id, repo: course.repo, pagesBranch: course.pagesBranch || 'main', previews: 'invalid', error: sanitize(e.message)}; }
}

/* ---------- command line ---------- */
if(require.main === module){
  const argv = process.argv.slice(2), cmd = argv[0];
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const now = opt('--now') ? Date.parse(opt('--now')) : Date.now();
  if(isNaN(now)){ console.error('--now is not a date'); process.exit(2); }
  const json = argv.includes('--json');
  const cfg = read('courses.json');
  const out = x => console.log(redact(json ? JSON.stringify(x, null, 2) : x));
  const cache = argv.includes('--no-cache') ? null : (opt('--cache') || undefined);
  if(cmd === 'status') out(json ? cfg.courses.map(c => Object.assign({course: c.id}, lifecycle(c, now, cfg))) : cfg.courses.map(c => { const l = lifecycle(c, now, cfg); return `${c.id.padEnd(22)} ${l.status.padEnd(19)} ${l.why}${l.flags.length ? '  [' + l.flags.join('; ') + ']' : ''}`; }).join('\n'));
  else if(cmd === 'plan'){
    let heads = null;
    if(opt('--heads')) heads = JSON.parse(fs.readFileSync(opt('--heads'), 'utf8'));
    else if(!argv.includes('--offline')){ heads = {}; for(const c of cfg.courses){ const h = liveHead(c.repo); heads[c.repo] = h.state === 'ok' ? h.head : null; } }
    const p = plan(cfg, read('state.json'), heads, now, read('improvements.json'));
    out(json ? p : p.map(x => `${x.course.padEnd(22)} ${x.status.padEnd(19)} ${x.action.padEnd(14)} ${x.reason}`).join('\n'));
  }
  else if(cmd === 'published'){
    const res = cfg.courses.filter(c => c.siteKind === 'kit' && (!opt('--course') || c.id === opt('--course'))).map(c => {
      const dep = liveDeployed(c.repo), ref = dep.state === 'ok' && dep.value ? dep.value.sha : (c.pagesBranch || 'main');
      const f = liveFile(c.repo, c.courseFile, ref);
      if(f.state !== 'ok') return {course: c.id, ok: null, at: ref, problems: [f.state === 'missing' ? `${c.courseFile} not found at ${ref}` : `${UNAVAILABLE}: ${f.why}`]};
      let co;
      try { co = parseCourse(f.text); }
      catch(e){ return {course: c.id, ok: null, at: ref, problems: [`${c.courseFile} at ${ref} could not be read: ${sanitize(e.message)}: not checked`]}; }
      return Object.assign({course: c.id, at: ref, deployedKnown: !!(dep.state === 'ok' && dep.value)}, checkPublished(c, co));
    });
    out(json ? res : res.map(r => `${r.course} (at ${String(r.at).slice(0, 12)}${r.deployedKnown === false ? ', live revision unknown' : ''}): ${r.ok === null ? 'NOT RUN' : r.ok ? 'OK' : 'PROBLEM'}${r.problems.length ? ' — ' + r.problems.join('; ') : ''}${r.knownNotReleased && r.knownNotReleased.length ? `\n  known, not released (hidden from students): ${r.knownNotReleased.join('; ')}` : ''}`).join('\n'));
    // a course that is not checked (NOT RUN) fails the command as a problem does: the check fails closed
    if(res.some(r => r.ok !== true)) process.exitCode = 1;
  }
  else if(cmd === 'dashboard'){ const d = dashboard(now, {offline: argv.includes('--offline'), cache}); out(json ? d : md(d)); }
  else if(cmd === 'kitupdate'){
    const k = cfg.courses.map(kitUpdateState);
    out(json ? k : k.map(x => `${x.course.padEnd(22)} kit-update previews ${x.previews}${x.previews === 'paused' ? ` since ${x.since} (Pages branch ${x.pagesBranch})\n  reason: ${x.reason}\n  lifted: ${x.liftWhen}` : x.previews === 'invalid' ? `: ${x.error}` : ''}`).join('\n'));
    // a run that cannot read every course's state builds no kit-update preview (skill/SKILL.md Mode 7)
    if(k.some(x => x.previews === 'invalid')) process.exitCode = 1;
  }
  else if(cmd === 'lastseen'){ const d = dashboard(now, {offline: false, cache}); console.log(redact(JSON.stringify(d.lastSeen, null, 1))); }
  else { console.error('usage: coord.js status|plan|published|dashboard|lastseen|kitupdate [--now ISO] [--json] [--offline]'); process.exit(2); }
}
module.exports = {kitUpdatePolicy, kitUpdateState, KIT_PREVIEWS, dashboard, lastSeenStore, UNAVAILABLE, zonedInstant, examSpan, lifecycle, plan, checkPublished, parseCourse, tokenize,
  approvalStatus, approvalsFrom, md, redact, sanitize, hasSecret, run, validDate, STATUSES, RELEASE};
