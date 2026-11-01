/* ==========================================================================
   TOPICS and the first question file.
   ==========================================================================
   TOPICS is the Topics tab: one entry per topic with its subtopics and the
   slide ranges they cover. Every question names a topic id and a sub id from
   here. Keep this array at the top of the first question file so it is
   declared before any question uses it.

   The questions below are SAMPLES showing every field and every kind the
   engine renders (single answer, select all, numeric, matching). Replace them
   with the course's own; do not ship them. Every fact in a real question comes
   from a slide or the lecture audio, and `cite` names the deck file and slide.
   ========================================================================== */
const TOPICS = [
 {id:'topic1', name:'First topic', prof:'Professor', open:true,
  cite:'Lecture 1 — Lecture01.pdf',
  subs:[
   {id:'a', name:'First subtopic',  cite:'slides 3–8'},
   {id:'b', name:'Second subtopic', cite:'slides 9–15'}]},
 {id:'topic2', name:'Second topic', prof:'Professor',
  cite:'Lecture 1 — Lecture01.pdf, slides 16–30',
  subs:[
   {id:'a', name:'First subtopic',  cite:'slides 16–22'},
   {id:'b', name:'Second subtopic', cite:'slides 23–30'}]},
];

const QUESTIONS = [
/* ---- single answer: the standard item ---------------------------------- */
{id:'s1-1', skill:'recall', prof:'Professor', tier:'new', topic:'topic1', sub:'a', concept:'sample-definition',
 tags:['recall'], source:'slide',
 stem:'SAMPLE: Which term names the process in which a substrate is converted to a product?',
 options:[
  {t:'The right term', correct:true, why:'Why it is right, in one or two sentences, naming the slide (slide 3).'},
  {t:'A near miss', correct:false, why:'What confusion picking this reveals, and the slide that settles it.'},
  {t:'A related term', correct:false, why:'Name the error a reader makes by picking this, and the slide that settles it.'},
  {t:'An unrelated term', correct:false, why:'Name what this term does refer to, and the slide that defines it.'}],
 teach:'Two or three sentences on the concept behind the item, written so the reader could answer a differently worded question on it.',
 cite:'Lecture 1 (Lecture01.pdf) slide 3'},

{id:'s1-2', skill:'tell', prof:'Professor', tier:'new', topic:'topic1', sub:'a', concept:'sample-tell-apart',
 tags:['tell'], source:'slide',
 stem:'SAMPLE: Term A and Term B differ in which single feature?',
 options:[
  {t:'The separating feature', correct:true, why:'The feature, and the slide that states it (slide 4).'},
  {t:'A feature they share', correct:false, why:'Both have this, so it separates nothing.'},
  {t:'A feature neither has', correct:false, why:'Not on the slide for either.'},
  {t:'A feature of a third term', correct:false, why:'Belongs to Term C on slide 5.'}],
 teach:'The distinction in two sentences.',
 cite:'Lecture 1 (Lecture01.pdf) slides 4–5'},

{id:'s1-3', skill:'apply', prof:'Professor', tier:'new', topic:'topic1', sub:'b', concept:'sample-case',
 tags:['case'], source:'both',
 stem:'SAMPLE: A patient with the stated condition is started on the drug in question. What is the expected outcome?',
 options:[
  {t:'The outcome the slide predicts', correct:true, why:'Why, from the mechanism on slide 10; (T) the lecturer’s wording if the audio adds emphasis.'},
  {t:'The opposite outcome', correct:false, why:'This reverses the direction of the mechanism.'},
  {t:'No change', correct:false, why:'Ignores the mechanism entirely.'},
  {t:'An unrelated effect', correct:false, why:'Belongs to a different drug class on slide 12.'}],
 teach:'The reasoning chain from the given facts to the outcome, as the professor walked it.',
 cite:'Lecture 1 (Lecture01.pdf) slide 10'},

/* ---- select all that apply -------------------------------------------- */
{id:'s2-1', skill:'recall', prof:'Professor', tier:'new', topic:'topic2', sub:'a', concept:'sample-list', multi:true,
 tags:['list'], source:'slide',
 stem:'SAMPLE: Which of the following belong to the named category? Select all that apply.',
 options:[
  {t:'Member one', correct:true, why:'Listed on slide 17 under the category’s heading.'},
  {t:'Member two', correct:true, why:'Listed on slide 17 under the same heading.'},
  {t:'Member three', correct:true, why:'Listed on slide 17 as the third member.'},
  {t:'A non-member', correct:false, why:'Belongs to the neighbouring category on slide 18.'},
  {t:'Another non-member', correct:false, why:'Not on slide 17 or slide 18; name where it does belong.'}],
 teach:'The category and the rule that decides membership.',
 cite:'Lecture 1 (Lecture01.pdf) slides 17–18'},

{id:'s2-2', skill:'recall', prof:'Professor', tier:'new', topic:'topic2', sub:'a', concept:'sample-rank',
 tags:['ranking'], source:'slide',
 stem:'SAMPLE: Rank the three named items from largest to smallest.',
 options:[
  {t:'A > B > C', correct:true, why:'The order slide 19 gives.'},
  {t:'C > B > A', correct:false, why:'The order on slide 19 reversed end to end.'},
  {t:'B > A > C', correct:false, why:'Swaps the first two items of the order on slide 19.'},
  {t:'A > C > B', correct:false, why:'Swaps the last two items of the order on slide 19.'}],
 teach:'Why the order holds.',
 cite:'Lecture 1 (Lecture01.pdf) slide 19'},

/* ---- numeric: typed answer, graded within tol, worked steps ------------ */
{id:'s2-3', type:'numeric', skill:'calc', prof:'Professor', tier:'new', topic:'topic2', sub:'b', concept:'sample-calculation',
 tags:['calculation'], source:'slide',
 stem:'SAMPLE: A 70 kg patient is dosed at 2 mg/kg. What is the dose in mg?',
 units:'mg', answer:140, tol:0.5,
 steps:[
  {k:'setup',   t:'Dose = weight × dose per kg', why:'The relation on slide 25, written in the professor’s symbols.'},
  {k:'unit',    t:'70 kg × 2 mg/kg', why:'kg cancels against per kg, leaving mg.'},
  {k:'algebra', t:'= 140 mg', why:'One multiplication; nothing to round.'}],
 teach:'The relation, the substitution and the result, each line with its units (slide 25).',
 cite:'Lecture 1 (Lecture01.pdf) slide 25'},

/* ---- matching: every right-hand value offered for every left-hand item -- */
{id:'s2-4', type:'match', skill:'recall', prof:'Professor', tier:'new', topic:'topic2', sub:'b', concept:'sample-matching',
 tags:['matching'], source:'slide',
 stem:'SAMPLE: Match each drug to its brand name.',
 left:'Generic', right:'Brand',
 pairs:[
  {l:'generic one',   r:'Brand One',   why:'Slide 28, row 1.'},
  {l:'generic two',   r:'Brand Two',   why:'Slide 28, row 2.'},
  {l:'generic three', r:'Brand Three', why:'Slide 28, row 3.'}],
 teach:'The table the pairs come from and the pattern, if any, in the names.',
 cite:'Lecture 1 (Lecture01.pdf) slide 28'}
];
