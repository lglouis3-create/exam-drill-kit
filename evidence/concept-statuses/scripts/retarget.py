"""Retarget test.tpl.js from the Module 1 fixture to the infusion fixture (each old string must occur once)."""
p = '/tmp/port-concept-statuses/scripts/test.tpl.js'
t = open(p, encoding='utf-8').read()
R = [
(""" * On a scratch copy of the course that holds FIX (below): 4 of Basic-Pharmacokinetics'
 * questions, their 3 topics, the lecture they cite and the 2 skills the course lacks,
 * from src/q1_module1.js and src/course.js at ac2eb73. The ids, the wording and every""",
 """ * On a scratch copy of the course that holds FIX (below): 7 of Basic-Pharmacokinetics'
 * questions of the topic "infusion", that topic, the lecture they cite and the skill the
 * course lacks, from src/q3_module3.js, src/q13_quizzes.js, src/q1_module1.js and
 * src/course.js at ac2eb73. The ids, the wording and every"""),
(""" * plan-the-problem is switched off in the scratch copy: m1-auc-n02 keeps its `setup`
 * line, which names the equation "auc-trap", and plan-the-problem's build step stops a""",
 """ * plan-the-problem is switched off in the scratch copy: inf-n1, inf-n2 and inf-n4 keep
 * their `setup` lines, which name the equations "css" and "cp-infusing", and
 * plan-the-problem's build step stops a"""),
("""/* Basic-Pharmacokinetics at ac2eb73: questions m1-ord-c07 and m1-ord-c08 (two wordings of
   one concept), m1-int-05 (single answer, a why on each wrong option) and m1-auc-n02 (a
   calculation) from src/q1_module1.js Q_MODULE1; their topics intro, orders and auc from
   its TOPICS; lecture L01 and the skills order and auc (and tell) from src/course.js. Taken""",
 """/* Basic-Pharmacokinetics at ac2eb73, the topic "infusion": inf-c11 (src/q3_module3.js) and
   cq2-4 (src/q13_quizzes.js), two wordings of one concept; inf-c5, single answer, a why on
   each wrong option, ratios in them; inf-n1, a calculation; inf-c4, inf-n2 and inf-n4, three
   more concepts of the topic (src/q3_module3.js); the topic from TOPICS (src/q1_module1.js);
   lecture L04 and the skills recall, apply and infusion from src/course.js. Chosen so that
   no text names the professor or uses a pronoun for the professor, no stem trips the core
   checks, and every dupOf is in FIX (scripts/extract_fix.js reports each). Taken"""),
("4 of Basic-Pharmacokinetics' questions and their topics (src/q1_module1.js, ac2eb73)",
 "7 of Basic-Pharmacokinetics' questions and their topic (ac2eb73)"),
("  const two = [byId('m1-ord-c07'), byId('m1-ord-c08')], mcq = byId('m1-int-05'), num = byId('m1-auc-n02');",
 "  const two = [byId('inf-c11'), byId('cq2-4')], mcq = byId('inf-c5'), num = byId('inf-n1');"),
("with 4 of Basic-Pharmacokinetics\\' questions (Chromium)", "with 7 of Basic-Pharmacokinetics\\' questions (Chromium)"),
("const A = FX.api('concept-statuses'), two = [byId('m1-ord-c07'), byId('m1-ord-c08')];",
 "const A = FX.api('concept-statuses'), two = [byId('inf-c11'), byId('cq2-4')];"),
("out.title = A.conceptTitle(byId('m1-auc-n02').concept);", "out.title = A.conceptTitle(byId('inf-c4').concept);"),
("const mcq = byId('m1-int-05'), ri =", "const mcq = byId('inf-c5'), ri ="),
("""check(r.title === 'Trapezoidal AUC', 'the course\\'s `words` option names the concept ("trapezoidal-auc" as "Trapezoidal AUC")', r.title);""",
 """check(r.title === 'Time to Css', 'the course\\'s `words` option names the concept ("time-to-css" as "Time to Css")', r.title);"""),
("""      // a card's option text and its why: no {{frac:...}} markup (m1-ord-c07's "First order" why holds four ratios)
      await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; const q = byId('m1-ord-c07'), wi = q.options.findIndex(o => /\\{\\{frac:/.test(o.why || ''));""",
 """      // a card's option text and its why: no {{frac:...}} markup (inf-c5's wrong options hold the ratio {{frac:R|Cl}})
      const want = await ev(() => { const o = byId('inf-c5').options.find(o => !o.correct && /\\{\\{frac:/.test(o.why || '')), m = o.why.match(/\\{\\{frac:([^|}]*)\\|([^}]*)\\}\\}/); return `(${m[1]})/(${m[2]})`; });
      await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; const q = byId('inf-c5'), wi = q.options.findIndex(o => !o.correct && /\\{\\{frac:/.test(o.why || ''));"""),
("fr.t.includes('(89.0)/(73.0)'), `a card shows a ratio of the why as (a)/(b)", "fr.t.includes(want), `a card shows the ratio of the why as ${want}"),
("const q = byId('m1-int-05'), wi = q.options.findIndex(o => !o.correct); for(let k = 0; k < 3; k++) record(q, 'wrong', wi);",
 "const q = byId('inf-c5'), wi = q.options.findIndex(o => !o.correct); for(let k = 0; k < 3; k++) record(q, 'wrong', wi);"),
("const mark = async ms => { const e = await ev(ms => { const q = byId('m1-int-05'),", "const mark = async ms => { const e = await ev(ms => { const q = byId('inf-c5'),"),
("a.qid === 'm1-int-05'), qn: DB.qn", "a.qid === 'inf-c5'), qn: DB.qn"),
("const q = byId('m1-ord-c07'); record(q, 'correct', q.options.findIndex(o => o.correct));",
 "const q = byId('inf-c4'); record(q, 'correct', q.options.findIndex(o => o.correct));"),
]
for o, n in R:
    c = t.count(o)
    assert c == 1, (c, o[:80])
    t = t.replace(o, n)
open(p, 'w', encoding='utf-8').write(t)
import re
left = re.findall(r"m1-[a-z]+-[a-z0-9]+|auc-trap|q1_module1", t)
print('replaced', len(R), '; left:', left)
