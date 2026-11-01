/* ==========================================================================
   TERM GLOSSES
   ==========================================================================
   Terms that carry conceptual weight in this course get a short definition the
   first time they appear in a question's explanation, so a reader who has
   forgotten one is not sent away to look it up.

     k     a short key, unique in this file
     p     the pattern to match, as a string (a regex source, case-insensitive)
     d     the definition, in the course's own wording where a deck gives one
     skip  recognises an explanation that already defines the term in its own
           prose, so a hand-written definition is never doubled by a gloss

   A term appearing in one explanation is glossed once, in the first place it
   appears, whether that is an option's `why` or the concept block.
   `explain_check.js` reports weighty terms used in the bank that have no entry
   here, which is how this file grows.

   The two below are SAMPLES: replace them with the course's own terms.
   ========================================================================== */
const GLOSS = [
 {k:'sample1', p:'sample term',
  d:'the one-line definition, as the deck words it',
  skip:/already defined in the explanation/i},
 {k:'sample2', p:'another sample term|another sampled term',
  d:'a second definition, to show that `p` may list alternative spellings',
  skip:/spelled either way/i},
];
