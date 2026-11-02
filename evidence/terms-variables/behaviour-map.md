## Behaviour map (agent-run reading of Basic-Pharmacokinetics `src/` at `ac2eb73`)

Source file `src/views.js` unless named. "Module" is `features/terms-variables/current/terms-variables.js`.

| # | Behaviour in the source | Source lines | Status | Note |
|---|---|---|---|---|
| 1 | A term's own name and abbreviation blanked (`____`) in its situation and definition (`termMask`) | 1040-1045 | ported | same function |
| 2 | Term wrong options: the term's `confuse` terms first, then terms of its group, then any term (`termDistractors`) | 1046-1051 | adapted | the module also skips an option whose text repeats one already chosen (two terms with the same name or meaning would give two equal options); on PK's 94 terms the result is the same (282 of 282 questions with the same keyed answer, ids in order) |
| 3 | Three questions per term: which term a situation describes (`-scene`), what a term means (`-gist`), which term a definition belongs to (`-def`); the second and third `dupOf` the first | 1052-1070 | adapted | a term with no `scene` gets no situation question, and its meaning question is the top one (PK: every term has a scene); a term with no `gist` uses its definition with the term blanked |
| 4 | Term questions carry `skill: 'term'`, `exam` worked out from the module, the professor's name as `prof` | 1055-1058 | adapted | the course's first professor; `skill` is the option `skill` (none: the core judges it); no `exam` field (the questions are never on a paper) |
| 5 | The concept block lists the definition and the professor's point (`teach` with `list`) | 1058 | adapted | one paragraph (`t`) with the definition and the point |
| 6 | Variables: symbol families (`VAR_FAMILY`), usual names (`VAR_NAMES`), twins (`VAR_TWINS`) as tables in the code | 1076-1083, 1092-1095, 1101 | adapted | course options `families`, `names`, `twins`; without `families`, every ASKS key in one family |
| 7 | The question sentence of a stem: its last question, else its last "calculate/determine/find/..." sentence; table rows skipped (`askSentence`) | 1085-1091 | adapted | same sentences without a regex lookbehind (older Safari cannot parse one): 534 of 534 numeric stems of PK's bank give the same sentence |
| 8 | A sentence that names its symbol, the symbol's usual name, or a symbol of its family is not asked (`namesSym`) | 1097-1099 | ported | |
| 9 | Variable wrong options: the same family first, never a twin (`varOptions`) | 1100-1106 | adapted | the module also skips an option whose text repeats one already chosen |
| 10 | Per symbol: "what does it stand for" (`-means`), "which symbol is ..." (`-symbol`), and one question per distinct question sentence of a calculation asking for it (`-ask-<qid>`); lowYield and part headers ("the following") left out; repeated sentences once | 1107-1136 | ported | PK's whole bank: 301 of 301 variable questions with the same ids, stems and keyed answers (stem "her problems" reads "the professor's problems") |
| 11 | The module of a symbol's questions: its earliest calculation, module 9 ("7b") ordered as 7.5 | 1111-1113 | adapted | plain module number order; PK's 9-as-7.5 is PK's own numbering, the option `groups` names the chips |
| 12 | The questions kept out of QUESTIONS: off exam papers, out of the topic counts | 1029-1036 | ported | |
| 13 | Answers to these questions counted in Weak spots under the skill "Terms" | 1035-1036 | omitted | the core's Weak spots finds a question by id in QUESTIONS only; the student does not see these answers in Weak spots (needs a core change) |
| 14 | Variables block under Quiz me: all variables and each family, with counts and Start | 1137-1147 | adapted | the family rows show only when there is more than one family |
| 15 | Terms tab: Glossary, Flashcards and Quiz me modes; group and module chips | 1176-1190 | adapted | Glossary mode is glossary-tap's (its own tab); when glossary-tap is on, the help links to it; the module chips show only with more than one module, named by the option `groups` |
| 16 | Glossary mode: term cards, search box, By group / A-Z, letter bar, back-to-search button | 1160-1175, 1191-1205, 1234-1258 | omitted here | the glossary-tap module (another port, its own pull request) shows this list |
| 17 | Flashcards: the scene with the term blanked, Show the term, then the term, its gist and definition; Knew it / Not sure / Did not know recorded as an answer to the meaning question; the end card with Shuffle and start again | 1206-1218, 1236-1243 | adapted | front is the definition (term blanked) when a term has no scene; the shown side adds the professor's point and the source |
| 18 | Flashcard order reshuffled when the group changes | 1208 | adapted | reshuffled when the group or the module changes |
| 19 | Quiz me: Start drills all terms or one group, by the scheduler (`startPool`), missed concepts first | 1219-1224, 1244-1245, 872-877 | adapted | the pool follows the module chip too (PK's Quiz me ignores the module chip) |
| 20 | The Equations tab offers the variables quiz | 4173-4175 | ported | when equation-drill is on |
| 21 | Weak-spot marks on the term cards, term figures (`fig`) and quotes on the cards | 1160-1166 | omitted | the student does not see a figure or the professor's quote on a term card |
| 22 | A reload during a term or variables drill | (core) | omitted | the core finds the question by id in QUESTIONS, so the reload comes back to Topics, not to the question (needs a core change) |
