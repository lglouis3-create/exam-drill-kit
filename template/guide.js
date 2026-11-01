const GUIDE_HTML = `
<h2>Objective guides</h2>
<p class="sub">One section per objective on the professor's own objectives slides: the words on the slides, the points in slide order with what he or she said in lecture marked (T), the pairs that get swapped and what separates them, the poll or practice item on that objective, and how it is asked. Nothing here is scored.</p>

<section class="gobj" id="gobj-1">
<h3>Lecture 1 (deck file name) &mdash; Objective 1 of N: title in the professor's words</h3>
<div class="gbar"><span>OBJECTIVE (slide 2)</span><b>The objective as the slide prints it</b><i>slides 3&ndash;20</i></div>
<h4>Read this first &mdash; the words on these slides</h4>
<dl class="gwords"><dt>Term</dt><dd>Plain definition, with the slide it appears on.</dd></dl>
<h4>The points, in slide order</h4>
<div class="gpt"><h5>1. First point (slide 3)</h5><ul><li>One thought per bullet, each with its slide.</li><li>(T) &ldquo;A verbatim lecture quote in its own bullet.&rdquo;</li></ul></div>
<div class="gtell"><b>Tell apart</b><ul><li>Pair of swappable items: the one feature that separates them.</li></ul></div>
<div class="gpoll"><b>Poll or practice item on this objective</b><ul><li>The professor's own item, each option judged TRUE or FALSE, and the answer.</li></ul></div>
<div class="gask"><b>How it is asked, and how to answer</b><ul><li>Format the professor uses, with an example stem.</li></ul><ul><li>Step 1 &mdash; what to check first in the stem.</li></ul></div>
</section>
`;
