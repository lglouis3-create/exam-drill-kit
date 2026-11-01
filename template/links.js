/* ==========================================================================
   READ LINKS — which section of the reading tabs explains a question
   ==========================================================================
   Two things use this: the "Explain more" row under an answered question, and
   the Weak spots review plan, which groups what is not yet solid by the section
   that teaches it. Without any links the plan still works — it falls back to
   grouping by topic — so this file can start empty and grow.

   A link is [view, anchor, label]:
     view    'guide' | 'tell' | 'ref'
     anchor  the id of the <h3> (or <section>) in that tab. Give the heading an
             id in the content file (<h3 id="guide-receptors">) and name it
             here; ids written by hand stay put as sections are added, while the
             generated guide-0, guide-1 … shift whenever a section is inserted.
     label   what the button says, e.g. 'Guide 3: kinds of antagonists'

   Resolution order, first match wins:
     1. a question's own `read:[[view, anchor, label], …]`, if it carries one
     2. byKey — the first regex that matches the question's concept, sub, tags
        and functional-group key, joined and lower-cased
     3. bySub — by subtopic id
     4. byLecture — by lecture id from course.js
   ========================================================================== */
const READ_LINKS = {
  // [[/regex/, [[view, anchor, label], …]], …] — most specific first
  byKey: [
    // SAMPLE: delete these two and write the course's own
    [/sample-calculation|sample-matching/, [['ref', 'ref-sample', 'Reference: how to use this tab']]],
    [/sample/, [['guide', 'gobj-1', 'Guide: objective 1']]],
  ],

  bySub: {
    // 'a': ['guide', 'gobj-1', 'Guide: objective 1'],
  },

  byLecture: {
    // L01: ['guide', 'gobj-1', 'Guide: objective 1'],
  },
};
