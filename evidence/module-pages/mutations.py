#!/usr/bin/env python3
"""module-pages mutation checks (agent-run). Each mutation is an exact string replace that
must match once, applied to a scratch course's src/features/module-pages/ (never to the port
branch); the page is rebuilt, the module test runs, the file is restored.
Usage: mutations.py <scratch course src dir> <log dir>"""
import os, re, shutil, subprocess, sys
SRC, LOGS = sys.argv[1], sys.argv[2]
MOD = os.path.join(SRC, 'features', 'module-pages')
M = [
 ('M1 objective drill takes calculations too', 'module-pages.js',
  "QUESTIONS.filter(q => kindOf(q) === 'concept' && o.subs.includes(subKey(q))", "QUESTIONS.filter(q => o.subs.includes(subKey(q))"),
 ('M2 kind of problem ignores the skill in its match', 'module-pages.js',
  "&& (!sk || skillOf(q) === sk);", "&& true;"),
 ('M3 worked example without its working', 'module-pages.js',
  "${steps ? `<ol class=\"steps\">${steps}</ol>` : ''}", ""),
 ('M4 a tap on Topics keeps the module page', 'module-pages.js',
  "if(b && MODPAGE && typeof VIEW !== 'undefined' && VIEW === 'topics') MODPAGE = null;", "if(b && false) MODPAGE = null;"),
 ('M5 other modules\' cards not hidden under a module page', 'module-pages.css',
  "#v-topics.onmodpage > :not(.mpage){display:none}", ""),
 ('M6 status line does not count unanswered concepts', 'module-pages.js',
  "if(!G[c]) { none++; return; }", "if(!G[c]) { return; }"),
 ('M7 worksheets not matched to the module', 'module-pages.js',
  ".filter(s => s.module === m || (Array.isArray(s.modules) && s.modules.includes(m)));", ".filter(s => false);"),
 ('M8 questions no kind takes are dropped', 'module-pages.js',
  "const otherCalcs = m => ofKind(modulePool(m), 'calc').filter(q => !calcTypeOf(q));", "const otherCalcs = m => [];"),
 ('M9 build step accepts a worked example of another kind', 'step.js',
  "if(first !== t) errs.push(", "if(false) errs.push("),
 ('M10 module page not redrawn when Topics is drawn again', 'module-pages.js',
  "if(!p || p.dataset.mpkey !== pageKey()) drawPage(pane);", "if(!p && false) drawPage(pane);"),
 ('M11 In parts not offered', 'module-pages.js',
  "chains.length === 1 ? `<button class=\"btn small ghost\" data-mpchain", "false ? `<button class=\"btn small ghost\" data-mpchain"),
 ('M12 numeric items counted as concepts', 'module-pages.js',
  "if(q.type === 'numeric') return 'calc';", "if(q.type === 'numeric' && q.id !== q.id) return 'calc';"),
 ('M13 module of a question ignores its own module field', 'module-pages.js',
  "const modOf = q => (q.module !== undefined && q.module !== null ? q.module : (lecOf(q) || {}).module);", "const modOf = q => (lecOf(q) || {}).module;"),
]
env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
rows = []
for k, (name, f, old, new) in enumerate(M, 1):
    p = os.path.join(MOD, f); orig = open(p, encoding='utf-8').read()
    n = orig.count(old)
    if n != 1:
        rows.append((name, f'replace matched {n} times: not applied', '-')); continue
    open(p, 'w', encoding='utf-8').write(orig.replace(old, new))
    try:
        b = subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True, text=True)
        r = subprocess.run(['node', 'features/module-pages/test.js'], cwd=SRC, capture_output=True, text=True, env=env, timeout=900)
        out = b.stdout + b.stderr + '\n' + r.stdout + r.stderr
        open(os.path.join(LOGS, f'mutation-{k:02d}.log'), 'w').write(out)
        fails = [l.strip()[6:].split('  — ')[0] for l in r.stdout.splitlines() if l.startswith('  FAIL')]
        last = (r.stdout.strip().splitlines() or [''])[-1]
        rows.append((name, '; '.join(fails) if fails else last, r.returncode))
    finally:
        open(p, 'w', encoding='utf-8').write(orig)
    print(rows[-1], flush=True)
subprocess.run(['python3', 'build.py'], cwd=SRC, capture_output=True)
with open(os.path.join(LOGS, 'mutations.md'), 'w') as o:
    o.write('| Mutation | Check that failed | Exit code |\n|---|---|---|\n')
    for name, what, code in rows: o.write(f'| {name} | {what} | {code} |\n')
print(open(os.path.join(LOGS, 'mutations.md')).read())
