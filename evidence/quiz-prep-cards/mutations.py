#!/usr/bin/env python3
"""Mutation checks for quiz-prep-cards (QUALITY.md B).

usage: python3 mutations.py <course-dir> <out-dir> [mutation-id ...]

<course-dir> is the module's own course as core/ci_course.sh module:quiz-prep-cards builds it
(tools/mkci.sh). For each mutation: copy the course to a scratch folder, apply one exact string
replacement to the module file in src/features/quiz-prep-cards/ (the old string must occur exactly
once, or the mutation is reported as BAD and not run), build, run the module test, and record the
exit code and the checks that failed. Nothing here touches the kit's port branch.
"""
import json, os, shutil, subprocess, sys, tempfile

M = [
 # id, file, old, new, what it breaks
 ('M01', 'quiz-prep-cards.js', "return QUESTIONS.filter(q => t.includes(q.topic) || (q.module !== undefined && m.includes(q.module)));",
  "return QUESTIONS.filter(q => t.includes(q.topic));", 'a quiz scope ignores `modules`'),
 ('M02', 'quiz-prep-cards.js', "const kindOf = q => (q.type === 'numeric' ? 'calc' : 'concept');",
  "const kindOf = q => 'concept';", 'no question counts as a calculation'),
 ('M03', 'quiz-prep-cards.js', "+ (qz.minutes || 0) * 60000;", "+ 0;", 'the quiz ends at its start, not start plus minutes'),
 ('M04', 'quiz-prep-cards.js', "const d = Math.round((day(start) - day(now)) / 86400000);",
  "const d = Math.ceil((start - now) / 86400000);", 'days left counted in hours rounded up, not calendar days'),
 ('M05', 'quiz-prep-cards.js', "if(now >= start) return 'The quiz is in progress.';", "", 'no in-progress line'),
 ('M06', 'quiz-prep-cards.js', "const hidden = qz => store.get(HIDE_KEY + qz.id) === '1';", "const hidden = qz => false;", 'a hidden card is never hidden'),
 ('M07', 'quiz-prep-cards.js', "quizzes().filter(live).map(cardHTML)", "quizzes().map(cardHTML)", 'a card for every quiz, over or hidden'),
 ('M08', 'quiz-prep-cards.js', "const KEEP = /&lt;(\\/?)(sub|sup|b|i|em)&gt;/g;", "const KEEP = /&lt;(\\/?)(b|i|em)&gt;/g;", '<sub> and <sup> shown as text'),
 ('M09', 'quiz-prep-cards.js', "h.replace(/\\{\\{frac:([^|{}]*)\\|([^{}]*)\\}\\}/g, '($1)/($2)')", "h", '{{frac}} left raw without formulas-in-text'),
 ('M10', 'quiz-prep-cards.js', "Object.assign(Q, {sweep: shuffle(pool.map(q => q.id)), i: 0});",
  "Object.assign(Q, {sweep: shuffle(pool.map(q => q.id)).concat([pool[0].id]), i: 0});", 'the straight pass asks one question twice'),
 ('M11', 'quiz-prep-cards.js', "const all = scopeOf(qz), pool = k ? ofKind(all, k) : all;", "const all = scopeOf(qz), pool = all;", 'concepts and calculations drills not narrowed'),
 ('M12', 'quiz-prep-cards.js', "function hide(id){ store.set(HIDE_KEY + id, '1'); }", "function hide(id){ MEM[HIDE_KEY + id] = '1'; }", 'Hide kept for the visit only, not stored'),
 ('M13', 'quiz-prep-cards.js', "function unhideAll(){ quizzes().forEach(qz => store.del(HIDE_KEY + qz.id)); }", "function unhideAll(){}", 'Show again does nothing'),
 ('M14', 'quiz-prep-cards.js', "const back = quizzes().filter(qz => ahead(qz) && hidden(qz));", "const back = quizzes().filter(qz => hidden(qz));", 'Settings offers back a hidden card of a quiz that is over'),
 ('M15', 'quiz-prep-cards.js', "if(at) at.insertAdjacentHTML('afterend', box); else", "if(at) pane.insertAdjacentHTML('afterbegin', box); else", 'the cards go above the heading, not under the stamp'),
 ('M16', 'quiz-prep-cards.js', "This puts it back on Topics: ${back.map(qz => esc(qz.name)).join(', ')}.", "This puts it back on Topics.", 'Settings does not name the hidden quiz'),
 ('M17', 'quiz-prep-cards.js', 'title="Hide the ${esc(qz.name)} prep card on this browser until the quiz is over"', 'title="Hide this card"', 'the first tooltip, which the core reads as skipping a question'),
 ('M18', 'quiz-prep-cards.js', "${qz.covers ? ' ' + esc(qz.covers) : ''}", "", 'what the quiz covers is not shown'),
 ('M19', 'quiz-prep-cards.js', "${qz.quote ? `<p class=\"qpquote\">“${esc(qz.quote)}”</p>` : ''}", "", 'the professor\'s words are not shown'),
 ('M20', 'quiz-prep-cards.js', "${qz.src ? `<p class=\"qpsrc\">${esc(qz.src)}</p>` : ''}", "", 'the source is not shown'),
 ('M21', 'quiz-prep-cards.js', "const label = qz.name + ' prep'", "const label = qz.name", 'the drill is not labelled as the quiz\'s prep'),
 ('S01', 'step.js', "for(const k of Object.keys(qz)) if(!FIELDS.includes(k)) errs.push(", "for(const k of Object.keys(qz)) if(false) errs.push(", 'a misspelt field is accepted'),
 ('S02', 'step.js', "else if(/<[a-zA-Z/]/.test(qz[f])) errs.push(", "else if(false) errs.push(", 'a tag in covers, quote or src is accepted'),
 ('S03', 'step.js', "if(!['sub', 'sup', 'b', 'i', 'em'].includes(g[1].toLowerCase()) || /<[a-zA-Z]+\\s/.test(g[0]))", "if(false)", 'any tag in a said line is accepted'),
 ('S04', 'step.js', "else if(seen.has(qz.id)) errs.push(", "else if(false) errs.push(", 'two quizzes with one id are accepted'),
 ('S05', 'step.js', "if(typeof qz.minutes !== 'number' || !(qz.minutes >= 0))", "if(typeof qz.minutes !== 'number')", 'negative minutes accepted'),
 ('S06', 'step.js', "if(typeof qz.when !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(qz.when) || isNaN(new Date(qz.when).getTime()))",
  "if(typeof qz.when !== 'string')", 'a when that is not YYYY-MM-DDTHH:MM accepted'),
 ('S07', 'step.js', "if((Array.isArray(t) || Array.isArray(m)) && !n) errs.push(", "if(false) errs.push(", 'a quiz that covers no question accepted'),
 ('S08', 'step.js', "if(!modules.has(x)) errs.push(", "if(false) errs.push(", 'a module no question carries accepted'),
 ('S09', 'step.js', "if(!topicIds.has(x)) errs.push(", "if(false) errs.push(", 'a topic TOPICS does not have accepted'),
 ('S10', 'step.js', "if(!str(qz.id) || !/^[A-Za-z0-9_-]+$/.test(qz.id))", "if(!str(qz.id))", 'an id with a space accepted'),
 ('S11', 'step.js', "if(!Array.isArray(list) || !list.length)", "if(!Array.isArray(list))", 'an empty quiz list accepted'),
 ('S12', 'step.js', "if(!Array.isArray(qz.said) || !qz.said.every(str)) errs.push(", "if(false) errs.push(", 'said that is not a list accepted'),
]

def main():
    course, out = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    env = dict(os.environ, NODE_PATH=os.environ.get('NODE_PATH', '/opt/node22/lib/node_modules'))
    rows = []
    for mid, f, old, new, what in M:
        if only and mid not in only: continue
        work = tempfile.mkdtemp(prefix='qp-mut-' + mid + '-', dir=os.environ.get('TMPDIR', '/tmp'))
        dst = os.path.join(work, 'course')
        shutil.copytree(course, dst, symlinks=True)
        p = os.path.join(dst, 'src', 'features', 'quiz-prep-cards', f)
        text = open(p, encoding='utf-8').read()
        n = text.count(old)
        if n != 1:
            rows.append({'id': mid, 'file': f, 'what': what, 'result': f'BAD: old string found {n} times'}); shutil.rmtree(work); continue
        open(p, 'w', encoding='utf-8').write(text.replace(old, new))
        b = subprocess.run(['python3', 'build.py'], cwd=os.path.join(dst, 'src'), capture_output=True, text=True, env=env)
        log = os.path.join(out, mid + '.log')
        if b.returncode != 0:
            open(log, 'w').write(b.stdout + b.stderr)
            rows.append({'id': mid, 'file': f, 'what': what, 'exit': b.returncode, 'failed': ['build.py: ' + (b.stdout + b.stderr).strip().split('\n')[-1]]}); shutil.rmtree(work); continue
        t = subprocess.run(['node', 'features/quiz-prep-cards/test.js'], cwd=os.path.join(dst, 'src'), capture_output=True, text=True, env=env, timeout=900)
        open(log, 'w').write(t.stdout + t.stderr)
        failed = [l.strip()[6:].split('  — ')[0] for l in t.stdout.split('\n') if l.startswith('  FAIL')]
        last = [l for l in (t.stdout + t.stderr).strip().split('\n') if l.startswith(('FAIL', 'PASS', 'NOT RUN'))][-1:]
        rows.append({'id': mid, 'file': f, 'what': what, 'exit': t.returncode, 'failed': failed or last, 'caught': t.returncode != 0})
        print(mid, t.returncode, (failed or last)[:2], flush=True)
        shutil.rmtree(work)
    json.dump(rows, open(os.path.join(out, 'mutations.json'), 'w'), indent=1, ensure_ascii=False)
    with open(os.path.join(out, 'mutations.md'), 'w') as fh:
        fh.write('| Mutation | File | What it breaks | Exit | Checks that failed |\n|---|---|---|---|---|\n')
        for r in rows:
            fh.write(f"| {r['id']} | {r['file']} | {r['what']} | {r.get('exit', '-')} | {'; '.join(r.get('failed', [r.get('result', '')]))} |\n")

main()
