/* ==========================================================================
   DIAGRAMS — figures drawn as inline SVG
   ==========================================================================
   A figure is a string of SVG markup wrapped in <figure class="fig">. Figures
   are written here rather than cropped from a slide when the point is a process
   or a relation: they stay sharp at any size, cost almost nothing in file size,
   and follow the page's light and dark colours.

   Three ways a figure reaches the reader:
     a question's concept block   `svg: DIA.key` on the question
     a reading tab                `<!--DIA:key-->` in reference.js / tell.js / guide.js
     the Diagrams tab             listed in DIAGRAMS below

   `figure(inner, cap, h)` wraps plain SVG. `stepper(key, title, steps, h, cap,
   footer)` builds a step-through: one group per step, with Back, Next, Replay
   step, Play all and a dot per step. The engine (views.js) animates the move
   between two steps, so authoring a step-through means writing each step's end
   state and nothing about the motion. See STEPPERS.md before writing one; the
   two rules that matter most are repeated here:

     1. A shape that is the same thing in two steps carries the same `data-k`.
        That is what makes it glide instead of fading out and back in.
     2. A shape that should keep its own opacity sets the `opacity` attribute,
        not a CSS class; the fade-in animates from 0 to whatever that is.

   Everything below the helpers is SAMPLE content: one step-through so the
   Diagrams tab, the stepper test and the browser sweep have something to
   exercise. Replace it with the course's own figures.
   ========================================================================== */
const DIA_W = 360;                                  // every figure is drawn 360 wide
const DIA_H = 200;

/* The arrow marker is defined inside each figure, since a figure can be moved
   into a question, a reading tab or the Diagrams tab and has to carry its own. */
const figure = (inner, cap, h = DIA_H) => `<figure class="fig"><svg viewBox="0 0 ${DIA_W} ${h}" role="img" aria-label="${
  String(cap || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;')}">
  <defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
  <path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.65"/></marker></defs>${inner}</svg>${
  cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;

/* Captions are drawn inside the panel so a step's own words travel with it.
   Three lines at most; the third is clipped rather than overflowing the box. */
const wrapLines = (t, n = 76) => {
  const out = []; let cur = '';
  String(t).split(' ').forEach(w => {
    if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w;
  });
  out.push(cur.trim());
  if (out.length > 3) { out.length = 3; out[2] = out[2].replace(/.{2}$/, '…'); }
  return out.filter(Boolean);
};

/* steps = [[caption, inner, tag?], …]. The caption of the active step is drawn
   in the band at the bottom of the panel, which is why `h` has to leave room
   for it (about 34px for a one-line caption). Captions carry class `capt` so
   the engine fades them rather than trying to glide them. */
function stepper(key, title, steps, h = DIA_H, cap = '', footer = '') {
  let g = title ? `<text class="title" x="${DIA_W / 2}" y="11" text-anchor="middle">${title}</text>` : '';
  steps.forEach((st, i) => {
    const lines = wrapLines(st[0]);
    g += `<g class="st${i === 0 ? ' on' : ''}" data-step="${i + 1}">${st[1]}` +
      `<text class="lbl sm capt" x="6" y="${h - 12 - lines.length * 10}" text-anchor="start">Step ${i + 1} of ${steps.length}${st[2] ? ' · ' + st[2] : ''}</text>` +
      lines.map((l, k) => `<text class="lbl xs capt" x="6" y="${h - 2 - (lines.length - 1 - k) * 10}" text-anchor="start">${l}</text>`).join('') +
      `</g>`;
  });
  const dots = steps.map((st, i) =>
    `<button class="sdot${i === 0 ? ' on' : ''}" data-go="dot" data-i="${i}" aria-label="Go to step ${i + 1}"></button>`).join('');
  const controls = `<div class="anim" data-anim="${key}">` +
    `<button class="btn ghost" data-go="-1">◀ Back</button>` +
    `<button class="btn ghost" data-go="1">Next ▶</button>` +
    `<button class="btn ghost" data-go="replay">↻ Replay step</button>` +
    `<button class="btn ghost" data-go="play">▶ Play all</button>` +
    `<span class="sdots">${dots}</span>` +
    (footer ? `<span class="meta">${footer}</span>` : '') + `</div>`;
  return figure(g, cap, h).replace('</svg>', '</svg>' + controls);
}

/* ---------- SAMPLE: replace with the course's own figures ------------------
   A three-step figure. The ligand circle keeps data-k="lig" in all three
   steps, so it glides along; the signal arrow and the response bar appear only
   in later steps, so they fade in. */
const SAMPLE_STEPS = (() => {
  const box = (x, y, w, hh, k) => `<rect class="box" data-k="${k}" x="${x}" y="${y}" width="${w}" height="${hh}" rx="6"/>`;
  const label = (x, y, t, k) => `<text class="lbl" data-k="${k}" x="${x}" y="${y}" text-anchor="middle">${t}</text>`;
  const frame = `${box(28, 46, 96, 44, 'a')}${label(76, 73, 'SAMPLE A', 'la')}` +
                `${box(236, 46, 96, 44, 'b')}${label(284, 73, 'SAMPLE B', 'lb')}`;
  const lig = x => `<circle class="mark" data-k="lig" cx="${x}" cy="26" r="9"/>`;
  return stepper('sample-steps', 'SAMPLE: a three-step figure', [
    ['The first state: the thing that moves starts at A.', frame + lig(76)],
    ['It moves to B. Because it carries the same data-k, it glides rather than reappearing.', frame + lig(284) +
      `<path class="arrow" data-k="ar" d="M136 68 L224 68"/>`],
    ['A new shape appears, so it fades in; nothing that stayed is redrawn.', frame + lig(284) +
      `<path class="arrow" data-k="ar" d="M136 68 L224 68"/>` +
      `<rect class="mark" x="236" y="98" width="96" height="10" rx="5" opacity="0.45"/>` +
      `<text class="lbl xs" x="284" y="122" text-anchor="middle">a response at B</text>`],
  ], 170, 'Sample step-through. Replace it with a figure of the course’s own.');
})();

/* Inline SVG a question can show in its concept block via `svg: DIA.key`, a
   reading tab via <!--DIA:key-->, and the Diagrams tab via DIAGRAMS. */
const DIA = {
  'sample-steps': SAMPLE_STEPS,
};

/* The Diagrams tab: [group name, [figure keys]]. Course-specific — group the
   figures the way the course groups the processes they show. A key that is not
   in DIA is skipped, and the tab hides itself when nothing is listed. */
const DIAGRAMS = [
  ['Sample figures', ['sample-steps']],
];

/* A figure's own title, used by the Diagrams tab's contents chips when a key
   needs a name different from the title drawn inside it. */
const DIA_NAMES = {};
