/* ==========================================================================
   TYPED NUMBERS, READ AND GRADED (core option: course.js `numeric`)
   ==========================================================================
   build.py puts this file into the page only when course.js sets `numeric`;
   without it the engine's own parseNum and gradeNumeric (views.js) grade as
   they always have, and the page is unchanged. With it, a typed answer is
   read and graded as Basic-Pharmacokinetics does (src/shell.html lines
   1236-1269 at ac2eb73):

   - A number with its unit after it reads as the number: "2.6 hr",
     "188.2 (mg/L)hr", "55%", "0.17 hr-1", "0.17 hr^-1", "0.17 1/hr",
     "12 mg/L*hr", "1,000 mg". The unit is not graded. In the unit, a digit is
     allowed only straight after a minus, a caret or a slash, so a second
     number after a space ("2.6 hr 3", "8 5") is no answer at all: two numbers
     are never joined into one (the engine's own reading drops every
     character that is not part of a number, so "8 5" reads 85 and "0.25 1/hr"
     reads 0.251).
   - The margin: with `numeric.margin` set (a fraction of the key; PK's is
     0.02, from her Canvas quizzes' 2% and 3% margins), an item is right
     within max(its own `tol`, margin x |key|); without `margin`, within its
     `tol`, or 1% of the key when it has none, as the engine's own rule.
   - Binary floating point cannot hold most decimal margins exactly, so an
     answer typed exactly on the boundary can differ from the key by
     0.20000000000000018 against a margin of 0.2; a relative slack of one part
     in a billion absorbs that (PK FP_SLACK).

   The verdict line after a typed answer names the margin it was graded to.
   ========================================================================== */
const NUMERIC = (() => {
  const opt = COURSE.numeric || {};
  const margin = typeof opt.margin === 'number' ? opt.margin : null;
  const SLACK = 1e-9;
  const tol = q => margin === null
    ? (q.tol !== undefined ? q.tol : Math.abs(q.answer) * 0.01)
    : Math.max(q.tol || 0, margin * Math.abs(q.answer || 0));
  function read(entered){
    if(entered === null || entered === undefined) return NaN;
    const t = String(entered).trim().replace(/,/g, '');
    // the unit tail: letters, slashes, brackets and dots, with a digit allowed only right after a minus,
    // a caret or a slash ("hr-1", "hr^-1", "1/hr", "mg/L*hr"), so a second number after a space is no answer
    const m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)(?:\s*(?:1\/)?[A-Za-zµ%(/](?:[A-Za-z\s/()·⋅*%^.\-⁻¹²³⁴]|[-^/]\d+)*)?$/.exec(t);
    return m ? parseFloat(m[1]) : NaN;
  }
  function grade(q, typed){
    const v = read(typed);
    if(!isFinite(v)) return false;
    const t = tol(q);
    return Math.abs(v - q.answer) <= t + Math.abs(t) * SLACK;
  }
  return {margin, tol, read, grade};
})();
parseNum = NUMERIC.read;
gradeNumeric = NUMERIC.grade;
/* the verdict line names the margin the answer was graded to */
{
  const engineBody = numericBody;
  numericBody = function(q){
    const h = engineBody.apply(this, arguments);
    if(!Q || !Q.revealed) return h;
    const t = NUMERIC.tol(q);
    return h.replace(/ \(accepted within ±[^)]*\)(?=<\/p>)/, '')
            .replace('</p>', ` (accepted within ±${esc(fmtNum(t))}${q.units ? ' ' + esc(q.units) : ''})</p>`);
  };
}
