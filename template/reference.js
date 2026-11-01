const REFERENCE_HTML = `
<h2>Reference</h2>
<p class="sub">The tables the questions keep coming back to. Nothing here is scored.</p>

<h3 id="ref-sample">How to use this tab</h3>
<p class="prose">Put here the tables a student consults while answering: enzyme lists, drug classes, formulas in the professor's form, unit conversions. Each table cites the slide it was copied from. A figure token on its own line, {{fig:key|caption}}, embeds a slide crop stored in images.json under that key, and &lt;!--DIA:key--&gt; embeds a figure drawn in diagrams.js, step-through controls and all.</p>

<!--DIA:sample-steps-->

<h3 id="ref-explain-one">SAMPLE: a table with an explanation per row</h3>
<p class="prose">A row cannot carry a paragraph of reasoning without the table becoming unreadable, so the reasoning lives in a card under it: each row has a Why? button, and the card for one row at a time appears below. Replace this sample table, its select and its templates with the course's own. The ids in the select and in each template have to match the <span class="kbd">group:key</span> pairs on the buttons.</p>

<table class="reftab"><thead><tr><th style="width:26%">Item</th><th>What it is</th><th style="width:16%">Slide</th></tr></thead><tbody>
<tr><td><button class="whybtn" data-xpick="sample:one">Why?</button> <b>Sample item one</b></td><td>One line, as the slide states it.</td><td>N</td></tr>
<tr><td><button class="whybtn" data-xpick="sample:two">Why?</button> <b>Sample item two</b></td><td>One line, as the slide states it.</td><td>N</td></tr>
</tbody></table>

<div class="xpick">
  <label class="meta">Explain one:
    <select data-xsel="sample">
      <option value="">pick a row…</option>
      <option value="one">Sample item one</option>
      <option value="two">Sample item two</option>
    </select>
  </label>
  <div class="xout" data-xout="sample"></div>
</div>

<template data-x="sample:one">
  <div class="panel"><b>Sample item one</b>
    <p class="prose" style="margin:6px 0 0">Why this row reads the way it does, in two or three sentences from the slide it cites. A card may send the reader to the figure that shows it:
      <button type="button" class="btn ghost" data-xgo="ref-sample">See the figure</button></p></div>
</template>
<template data-x="sample:two">
  <div class="panel"><b>Sample item two</b>
    <p class="prose" style="margin:6px 0 0">The same, for the second row. Nothing here is scored, so a card can be as long as the explanation needs.</p></div>
</template>
`;
