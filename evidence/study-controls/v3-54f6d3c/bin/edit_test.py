"""Rewrites features/study-controls/current/test.js in the worktree: the fixture section becomes
FIX (verbatim course data) + WRITE (how it is written into a course) + fixtureFiles, and the uses
of the old IP/pre() ids follow. Each replacement must match exactly once."""
import sys, re
T = sys.argv[1]
s = open(T, encoding='utf8').read()
fix = open('/tmp/port-study-controls/v3/fixblock.js', encoding='utf8').read()

def rep(old, new):
    global s
    n = s.count(old)
    if n != 1:
        sys.exit(f'expected 1 match, found {n}: {old[:80]!r}')
    s = s.replace(old, new)

start = s.index("/* 6 of Intro to Pharmacology's questions (exam1-drill/src/q_L01.js, 929cd62), the fields the controls use */")
end = s.index("(async () => {")
WRITE = r'''/* How FIX is written into a course, as a question file in the kit's form: one question per line,
   opening {id:'...', skill:'...', prof:'...' (browser_test.js counts the bank that way), in a topic
   of its own after the course's topics. own = {prof, skills, lectures} of the course: `prof` is the
   course's first professor; a question's own skill is kept when the course has it (the template has
   both of FIX's, recall and apply), else the course's first skill. The source's `lecture` field
   (the source's lecture id) is left out: the kit finds a question's lecture from the deck its
   `cite` names. The topic keeps the subtopics FIX's questions are in (intro, nds). The lecture is
   added under id L91 (the template has its own L01), unless the course already has its deck.
   opt.base writes the topic and the 6 questions; opt.copies writes that many more copies of the 6
   (ids and concepts suffixed -c<n>, content unchanged; test pages only). ../ci/oncourse.js reads
   FIX and WRITE from this file, so the CI course and the test's copies hold the same data. */
const WRITE = (fix, own, opt) => {
  const lit = v => { if(!/^[^'\\\n]*$/.test(String(v))) throw new Error('cannot be written as a literal: ' + v); return `'${v}'`; };
  const skill = q => own.skills.includes(q.skill) ? q.skill : own.skills[0];
  const row = (q, c) => { const r = Object.assign({}, q); ['id', 'skill', 'prof', 'lecture'].forEach(k => delete r[k]);
    if(c) r.concept = q.concept + c;
    return `{id:${lit(q.id + c)}, skill:${lit(skill(q))}, prof:${lit(own.prof)}, ${JSON.stringify(r).slice(1)},`; };
  const topic = Object.assign({}, fix.topic, {prof: own.prof, subs: fix.topic.subs.filter(t => fix.qs.some(q => q.sub === t.id))});
  delete topic.lecture;
  const rows = [];
  if(opt.base) fix.qs.forEach(q => rows.push(row(q, '')));
  for(let c = 1; c <= (opt.copies || 0); c++) fix.qs.forEach(q => rows.push(row(q, '-c' + c)));
  let body = `/* study-controls: Intro to Pharmacology's Day 1 topic and 6 of its questions (exam1-drill/src/q_L01.js,\n   929cd62)${opt.copies ? `, ${opt.copies} copies of the 6 (ids suffixed -c<n>)` : ''}; written from FIX in features/study-controls/test.js */\n`;
  if(opt.base) body += `TOPICS.push(${JSON.stringify(topic)});\n`;
  if(rows.length) body += `QUESTIONS.push(\n${rows.join('\n')}\n);\n`;
  const l = fix.lecture;
  const lecture = (own.lectures || []).some(x => x.deck === l.deck) ? '' :
    `{id:'L91', deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(own.prof)}, exam:${JSON.stringify(l.exam)}, module:${JSON.stringify(l.module)}}`;
  return {body, lecture, rows: rows.length};
  };

/* The test's scratch copies: the course's own copy of FIX when it has one (a course made by
   ../ci/oncourse.js), else FIX written in; `copies` more copies for the persistence checks. */
function fixtureFiles(own, have, copies){
  const w = WRITE(FIX, own, {base: !have, copies});
  const files = w.rows ? {[have ? 'q91_sc_copies.js' : 'q90_sc_fixture.js']: w.body} : {};
  return {files, line: w.lecture ? `COURSE.lectures = (COURSE.lectures || []).concat([${w.lecture}]);` : ''};
}

'''
s = s[:start] + fix + 'const NOTE = FIX.strictNote;\n\n' + WRITE + s[end:]

rep("L.engine('({FX: typeof FX === \"undefined\" ? null : FX, DB: () => DB, upgradeDB, QUESTIONS, COURSE})')",
    "L.engine('({FX: typeof FX === \"undefined\" ? null : FX, DB: () => DB, upgradeDB, QUESTIONS, TOPICS, COURSE})')")
rep("  const own = {prof: X.COURSE.professors[0], skill: X.COURSE.skills[0].id};\n",
    "  const own = {prof: X.COURSE.professors[0], skills: X.COURSE.skills.map(k => k.id), lectures: X.COURSE.lectures};\n"
    "  // a course made by ci/oncourse.js has FIX already: the copies use the course's own\n"
    "  const have = FIX.qs.every(q => X.QUESTIONS.some(x => x.id === q.id));\n"
    "  const otherTopics = X.TOPICS.map(t => t.id).filter(t => t !== FIX.topic.id);\n")
rep("  const s = L.scratchBuild('sc', {files: fixtureFiles(own), courseLine: L.featureOn(",
    "  const f1 = fixtureFiles(own, have), f3 = fixtureFiles(own, have, 50);\n"
    "  const s = L.scratchBuild('sc', {files: f1.files, courseLine: f1.line + L.featureOn(")
rep("  const s2 = L.scratchBuild('sc-off', {files: fixtureFiles(own), courseLine: L.featureOn(",
    "  const s2 = L.scratchBuild('sc-off', {files: f1.files, courseLine: f1.line + L.featureOn(")
rep("  const COPIES = 50;   // 300 more questions, for hundreds of flags\n"
    "  const s3 = L.scratchBuild('sc-many', {files: fixtureFiles(own, COPIES), courseLine: 'COURSE.exams.forEach(e => { e.typed = true; });' + L.featureOn(",
    "  const COPIES = 50;   // 300 more questions, for hundreds of flags (f3 above)\n"
    "  // calculations on the paper (exams[].typed); the papers drawn from the course's other topics, so the 300 copies do not crowd out its calculations\n"
    "  const s3 = L.scratchBuild('sc-many', {files: f3.files, courseLine: f3.line + `COURSE.exams.forEach(e => { e.typed = true; e.pools.forEach(p => { p.filter = Object.assign({}, p.filter, {topic: ${JSON.stringify(otherTopics)}}); }); });` + L.featureOn(")
rep("  const ids = IP.map(q => pre(q.id)), single = IP.filter(q => !q.multi).map(q => pre(q.id)), multi = IP.filter(q => q.multi).map(q => pre(q.id));",
    "  const ids = FIX.qs.map(q => q.id), single = FIX.qs.filter(q => !q.multi).map(q => q.id), multi = FIX.qs.filter(q => q.multi).map(q => q.id);")
rep("      const many = await pe(() => QUESTIONS.filter(q => /^sct-.*-c\\d+$/.test(q.id)).map(q => q.id));",
    "      const many = await pe(base => QUESTIONS.filter(q => /-c\\d+$/.test(q.id) && base.includes(q.id.replace(/-c\\d+$/, ''))).map(q => q.id), ids);")
rep("map(b => b.dataset.ppexam).filter(id => id !== EXAM.id) : null);",
    "map(b => b.dataset.ppexam).filter(id => id !== String(EXAM.id)) : null);   // data-ppexam is text; an exam id may be a number")
# the header comment
rep(" * On a scratch copy with 6 of Intro to Pharmacology's questions (exam1-drill/src/\n"
    " * q_L01.js at 929cd62: 4 single-answer, 2 select-all; ids prefixed sct-, the\n"
    " * professor and the skill set to the course's own), in Chromium, with\n",
    " * On a scratch copy with Intro to Pharmacology's Day 1 topic, its lecture and 6 of\n"
    " * its questions (FIX below, verbatim from exam1-drill/src at 929cd62: 4 single-answer,\n"
    " * 2 select-all; the professor set to the course's own; the course's own copy when\n"
    " * ci/oncourse.js wrote it), in Chromium, with\n")
rep(" * On a copy with 300 more questions (50 copies of the 6, ids suffixed) and\n"
    " * calculations on the paper (exams[].typed):",
    " * On a copy with 300 more questions (50 copies of the 6, ids suffixed) and\n"
    " * calculations on the paper (exams[].typed, drawn from the course's other topics):")
if re.search(r'\bIP\b|\bpre\(|sct-L01|sct-\$', s.replace('sct-nowhere-id', '')):
    for m in re.finditer(r'.*(\bIP\b|\bpre\(|sct-L01).*', s): print('left:', m.group(0)[:120])
    sys.exit('old fixture names are left')
open(T, 'w', encoding='utf8').write(s)
print('ok')
