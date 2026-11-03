/* ==========================================================================
   COURSE MANIFEST — everything that is specific to this course lives here.
   The engine (shell.html, views.js) reads COURSE and nothing else about the
   course. Fill this in first; the checks read it too.
   ==========================================================================
   id, title, short   names shown in the header and the page title
   output             file name of the built page (the site serves it under this name)
   atlas              true only when atlas.js carries drawn structures for an Atlas tab
   ns                 storage namespace: keep it the same for the whole course so
                      progress carries from Exam 1 through the final
   oldCachePrefix     optional, only for a drill that had its own service worker
                      before it moved onto the core: that worker's cache name
                      prefix (for example 'phar4342-drill-'); the core's worker
                      deletes those caches. It must end with '-'.
   professors         names exactly as the questions' `prof` field spells them
   lectures           one entry per deck: `deck` is the file name as the citations
                      spell it (dots in the stem become underscores), `exam` the
                      exam it is tested on, `module` the block the course groups
                      it under. Questions are labelled by the deck their `cite`
                      names, so every cite must name its deck.
   exams              blueprint per exam: questions, minutes, select-all count,
                      and the pools with their marks. A pool `filter` is an object
                      of field:value that a question must match; a value may be
                      an array meaning "one of". Pools' marks add up to `questions`.
                      `date` is the string shown in the header; add `when` (ISO)
                      and the page counts the days down to it.
                      Optional `typed: true`: this exam's papers draw the
                      numeric and matching items too (typed and picked on the
                      paper); without it they stay off papers.
                      Optional `blueprint`: use it only when the professor has
                      announced counts per topic. See the commented example.
   activeExam         which exam the simulator and the weighted pass follow
   skills             this course's taxonomy of what a question asks the student
                      to do; every question carries one `skill`; Weak spots groups
                      by it. Replace the defaults with the kinds this course
                      tests (a drug course: brand, generic, category, indication,
                      essential; a calculation course: setup, unit, algebra, …).
   paceDefault        review pace for a new profile: cram | weekly | semester
   scheduler          which scheduler picks the next question (core/README.md
                      "The scheduler"). model 'concept' (the default when the
                      field is absent): concepts are scheduled by box, and an
                      exam with a `when` shortens the day-clock gap for the
                      concepts its pools cover. preset:'calc' for a
                      calculation course: no two questions of one skill in a
                      row, and due questions of earlier lectures mixed in.
                      model 'fsrs': FSRS-7 per question (ts-fsrs, from the
                      kit's core/vendor/, which the build then inlines).
                      model 'concept-fsrs' (off by default): FSRS-7 per
                      concept with question rotation; it ships with
                      compare:true, which assigns each concept at random to
                      it or to 'concept' and logs which.
   files              the data files, in the order the build puts them into the
                      page: atlas.js and diagrams.js, then every question file
                      (q<N>_<topic>.js), the first of which declares TOPICS and
                      QUESTIONS. Add each new question file here. The list
                      belongs to the course, so a core update (which replaces
                      build.py) keeps it; without the field the build uses
                      ['atlas.js', 'diagrams.js', 'q1_topics.js']. A question
                      file in src/ that is not listed stops the build.
   manifest           optional: {description, orientation} for the web
                      manifest the build writes (description: one sentence;
                      orientation: 'portrait-primary', 'any', ... as the web
                      manifest allows). Leave it out and the manifest has
                      neither.
   tools              optional: the course's own tables for three core tools.
                      They live here because a core update copies the tools
                      over the course's copies (Mode 7) and never replaces
                      course.js. Every field is optional; the build stops on a
                      field name that no tool reads.
                        citeAliases   cite_check.py: how a citation spells a
                                      deck, in lower case -> the file on disk,
                                      or null for a deck that is not a PDF on
                                      hand (its slide numbers are then
                                      reported unchecked)
                        citeLectures  cite_check.py: lecture number -> file,
                                      only for "Lecture #11" citations that
                                      number a lecture differently from the
                                      digits of its `lectures` id
                        citeBareMap   cite_check.py: a deck named in words in
                                      a citation ('Absorption I slide 24') ->
                                      its file, or null
                        explainTerms  explain_check.js: ['gloss key', 'regex
                                      source'] for each term the course leans
                                      on; one whose key is not in the glossary
                                      is reported where it is used. Appended
                                      to the kit's own list.
                        harvestMasks  harvest_mask.py: ['images.json key',
                                      ['phrase', ...]] for each question crop
                                      that prints its own answer; the phrases
                                      are whited out on the question image
   features           optional: the feature modules this course switches on,
                      {<name>: {version:'v1', ...options}}, each copied from
                      the kit's features/<name>/current/ to src/features/<name>/
                      (the kit's features/README.md). The version pins it; only
                      Mode 7 changes it. Leave it out and the page has no
                      module code at all.
   numeric            optional, for a course with typed calculations:
                      {margin: 0.02} reads a typed number with its unit after
                      it (2.6 hr, 0.17 1/hr), never joins two numbers, and
                      grades an item within max(tol, margin x |key|). Leave it
                      out and typed numbers are read and graded as before
                      (core/README.md, Typed numbers).
   kit                {core:'<kit commit>'}: the exam-drill-kit commit this
                      src/ engine was copied from (core/), written when the
                      course is set up; only Mode 7 (a drill update) changes it
   ========================================================================== */
const COURSE = {
  id: 'course-id',                       // e.g. 'phar4351'
  title: 'COURSE 0000 — Course name',
  short: 'COURSE 0000',
  ns: 'course-id-drill',
  output: 'COURSE0000_Drill.html',
  atlas: false,
  professors: ['Professor'],

  lectures: [
    {id:'L01', deck:'Lecture01.pdf', label:'Lecture 1: title (date)', prof:'Professor', exam:1, module:'Module 1'},
  ],

  exams: [
    {id:'exam1', name:'Exam 1', date:'', when:'',   // when: '2026-10-14T09:00' turns on the countdown
     questions:4, minutes:10, sata:0,          // sample values for the sample bank; set the real blueprint
     blurb:'',
     pools:[
       {key:'all', name:'Lectures 1–4', marks:4, filter:{exam:1}},
     ],
     /* Only when the professor has announced counts per topic. Each part takes
        its questions from the category whose `match` pattern fits the stem,
        concept, subtopic and tags; `n` is a count or a [min,max] range, `min` is
        a floor, and one part carries `rest`. `sata` is how many select-all items
        the paper ends up with.
     blueprint: {
       sata: 2,
       cats: [{key:'regulation', match:'up-?regulat|down-?regulat|desensiti'},
              {key:'index',      match:'therapeutic index|safety index'}],
       rest: 'other',
       parts: [{key:'regulation', name:'receptor regulation', n:5},
               {key:'index',      name:'therapeutic index',   n:[2,3]},
               {key:'other',      name:'everything else',     rest:true}],
     },
     */},
  ],
  activeExam: 'exam1',

  skills: [
    {id:'recall', label:'Recall the fact',            short:'Recall'},
    {id:'tell',   label:'Tell apart',                 short:'Tell apart'},
    {id:'apply',  label:'Apply to a case',            short:'Apply'},
    {id:'read',   label:'Read a figure or scheme',    short:'Read'},
    {id:'calc',   label:'Calculate',                  short:'Calc'},
  ],

  paceDefault: 'weekly',

  scheduler: {model:'concept'},

  files: ['atlas.js', 'diagrams.js',
          'q1_topics.js'],                 // add each new question file here, in order

  tools: {citeAliases:{}, citeLectures:{}, citeBareMap:{},   // the course's tables for cite_check.py,
          explainTerms:[], harvestMasks:[]},                  // explain_check.js and harvest_mask.py

  kit: {core: ''},                         // the kit commit src/ was copied from (set at setup)
};

;/* concept-statuses ci */ COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat(["q90_cst_fixture.js"]); COURSE.professors = (COURSE.professors || []).concat(["Mosley"]); COURSE.lectures = (COURSE.lectures || []).concat([{id:'cst-L04', deck:'3IntravenousInfusions.pdf', label:'Module 3: Intravenous infusion (2 Sep)', prof:'Mosley', exam:1, module:3}]); COURSE.skills = (COURSE.skills || []).concat([{"id":"infusion","label":"Infusion rate and steady state","short":"Infusion","kind":"calc"}]); COURSE.features = Object.assign({}, COURSE.features, {"concept-statuses": {"version":"v1","words":{"999":"99.9%","vd":"VD","cl":"Cl","clr":"ClR","crcl":"CrCl","gfr":"GFR","ibw":"IBW","bw":"body weight","cmax":"Cmax","cmin":"Cmin","tmax":"tmax","c0":"C0","cp":"Cp","css":"Css","cavg":"Cavg","cav":"Cav","auc":"AUC","aucs":"AUCs","k":"k","ka":"ka","ke":"ke","kvd":"k × VD","thalf":"t½","tau":"τ","f":"F","fe":"fe","frel":"Frel","fabs":"Fabs","alpha":"α","beta":"β","vp":"Vp","db":"DB","d0":"D0","davg":"Davg","r":"R","mec":"MEC","pk":"PK","pd":"PD","adme":"ADME","iv":"IV","ph":"pH","ss":"steady state","halflife":"half-life","halflives":"half-lives","onecpt":"one-compartment","multicpt":"multicompartment","cpt":"compartment","defn":"definition","def":"definition","conc":"concentration","bioavail":"bioavailability","biexp":"biexponential","equiv":"equivalent","rel":"relative","params":"parameters","calc":"calculation","diffeq":"differential equation","cockcroft":"Cockcroft","gault":"Gault","henderson":"Henderson","hasselbalch":"Hasselbalch"}}});
