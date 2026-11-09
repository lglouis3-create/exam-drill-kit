# Writing a step-through figure

A step-through shows one process as a few end states and lets the reader walk
between them. The engine animates the difference, so each step is authored as a
complete picture of that moment and nothing in the source describes the motion.

    DIA['gpcr'] = stepper('gpcr', 'Title drawn inside the panel', [
      ['The caption for step 1, drawn in the band at the bottom.', step1Svg],
      ['Step 2.', step2Svg, 'optional tag'],
      ['Step 3.', step3Svg],
    ], 200, 'The figcaption under the figure.', 'optional footer note');

`stepper(key, title, steps, h, cap, footer)` builds the groups, the Back / Next /
Replay step / Play all controls and a dot per step. The engine adds to every
step-through it draws (views.js `armFigs`): the current step in words for a
screen reader (the drawn caption already shows it), `aria-current` on its dot, the
left and right arrow keys while a control has focus, and an Enlarge button that
shows the figure across the screen until Close or Escape. Every control and dot is
a 44 by 44 px touch target (shell.html). None of this changes the steps or their
order. `h` is the panel height and
has to leave about 34 px at the bottom for a one-line step caption, more for two.

## What the engine does between two steps

| the shape is | what happens |
|---|---|
| in both steps | it glides from its old position to its new one |
| only in the new step | it fades in |
| only in the old step | it fades out from a ghost copy of the old step |

Matching is by `data-k` when the author supplies one, and otherwise by tag plus
class plus text or fill. So:

1. **Give the same thing the same `data-k` in every step it appears in.** A
   receptor drawn in all five steps with `data-k="rec"` stays put; the same
   receptor with no `data-k` and a different class in step 3 fades out and back
   in, which reads as a flicker.
2. **Keep `data-k` values unique within a step**, or the queue of old positions
   is matched in document order and two shapes can swap.
3. **Set a shape's own opacity with the `opacity` attribute, not a class.** The
   fade-in animates opacity from 0 to whatever the element's own value is, so a
   shape drawn at `opacity="0.45"` stays translucent; a class that sets opacity
   is overridden by the animation and the shape turns solid.
4. **A shape with its own `transform` attribute does not glide.** A CSS
   transform would replace its `rotate()`, so rotated labels are left in place
   and fade instead.
5. **Captions carry class `capt`** (the builder does this) so they fade rather
   than trying to travel.
6. Draw every step at the same size and in the same coordinate space; a shape
   that is the same thing in two steps should differ only in the attributes that
   are meant to change.

`prefers-reduced-motion: reduce` turns the whole animation off: steps then swap
with no glide, no fade and no ghost.

## Checks

`node stepper_test.js` walks every step-through in `DIA`: each step settles with
exactly one group shown and the dots in sync, no ghost copy left behind, no
leftover inline transform, translucent shapes keep their opacity, rotated labels
keep their rotation, and no shape both fades out and fades back in across a move.
Run it after writing or changing a figure.

What the test cannot see: a shape that *moves* and whose `data-k` changed
between the steps. The old one leaves and a new one arrives somewhere else, and
nothing distinguishes that from a shape that genuinely appeared elsewhere. It
does report a shape fading in where another just faded out at the same spot,
since that is usually one thing with two keys — though a label deliberately
replaced in place looks the same, which is why it is a note rather than a
failure. Rule 1 above is therefore an authoring rule, not something a check
enforces.
