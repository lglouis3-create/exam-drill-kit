/* The stem rule of style_check.js: a stem asks about the subject, not about what the
   course material says. It is kept apart from that script so that style_check_test.js
   can try it on examples of each kind.

   A stem is flagged when it names the material (the deck, the slide, the lecture, a
   deck note), asks what is listed, named or described, or uses "according to".

   "Given as" is flagged too ("Which drug is given as the example of a prodrug?"),
   except in dose or problem wording, where it says how a drug is given or what value a
   problem gives (Louis, 2026-11-02: "Allow legitimate dose/problem wording while
   continuing to flag questions that merely ask what a slide says"). Two kinds of
   "given as" are dose or problem wording and are left out before the check:
     - a number after it: "the rate constant is given as 0.173 h⁻¹", "given as 500 mg";
     - a route, a dosage form or a dosing word within 60 characters after it, in the
       same clause, with none of the words in META before it: "given as a series of
       2-hour intravenous (IV) infusions", "given as two 250 mg tablets", "given as an
       oral solution", "given as IV push" (but not "given as the example of an oral
       prodrug").
   Every other "given as" in the stem is flagged as before, even when the stem also
   holds one of those two kinds. */
const STEM_RE = /\b(the deck|the slide|the lecture|lecture (gives|asks|notes|states)|deck note|is listed|are listed|according to|as presented in lecture|named as|described as)\b/i;
const ROUTE = String.raw`IV|intravenous(?:ly)?|oral(?:ly)?|PO|IM|intramuscular(?:ly)?|subcutaneous(?:ly)?|SC|SQ|sublingual(?:ly)?|buccal|rectal(?:ly)?|topical(?:ly)?|transdermal(?:ly)?|inhaled|intranasal(?:ly)?|intrathecal(?:ly)?|epidural`;
const FORM = String.raw`doses?|bolus(?:es)?|push|infusions?|injections?|drips?|tablets?|capsules?|solutions?|suspensions?|elixirs?|syrups?|suppositor(?:y|ies)|patch(?:es)?|lozenges?|sprays?|inhalers?|loading|maintenance|regimens?`;
// words that make "given as" refer to the material even before a route or a form:
// "given as the example of an oral prodrug" is not dose wording
const META = String.raw`the|example|examples|answer|reason|cause|definition|explanation|correct|key|main|best|first-line`;
const GIVEN_DOSE = new RegExp(String.raw`\bgiven as\s+(?:[~≈<>≤≥]\s*)?[-−]?\.?\d` +
  String.raw`|\bgiven as\s+(?:(?!\b(?:${META})\b)(?:\d\.\d|[^.;:?!])){0,60}?\b(?:${ROUTE}|${FORM})\b`, 'gi');   // 2.5 mg: a decimal point does not end the clause
const GIVEN_AS = /\bgiven as\b/i;

/* What in the stem refers to the course material: the words flagged, or null. */
function stemFlag(stem){
  const s = String(stem || '');
  const m = s.match(STEM_RE);
  if(m) return m[0];
  const g = s.replace(GIVEN_DOSE, ' ').match(GIVEN_AS);
  return g ? g[0] : null;
}

module.exports = {STEM_RE, GIVEN_DOSE, stemFlag};
