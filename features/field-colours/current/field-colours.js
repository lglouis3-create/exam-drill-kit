/* ==========================================================================
   FIELD COLOURS (feature module field-colours v1)
   ==========================================================================
   Ported from BDK at 05c36c3: its two field colours (assets/style.css lines
   367-383: --k-cat #0f766e and --k-ind #a21caf, #5eead4 and #f0abfc on its
   dark and blue themes) on the Drug list's column headings (app.js line 2598,
   th.k-cat and th.k-ind; the rules `th.k-cat { color: var(--k-cat) }`, lines 372-373).
   What changed for the kit:
   - the fields and their colours are the option `fields`;
   - the hook is an attribute, not a class: any element marked
     data-field="<field>" inside the pane of a feature tab (FX.tabs(), the
     panes #v-<tab>) takes the field's colour as its text colour. drug-list-tab
     marks its column headings so; compare-tab (port queue item 12, not built
     yet) can mark its row headers the same way (BDK app.js line 2325);
   - the rules are written once, at start (X.start), into a <style> element, from
     the options and the feature tabs that are on: a CSS file cannot hold
     colours that are options, and a stylesheet keeps applying to every redraw
     of a pane without a hook on each one;
   - dark colours only under the theme module's dark theme (kit #20, not merged:
     :root[data-theme="dark"], and, when that module is on, a dark device with
     Match device). The core's page is light only, so a dark device without the
     theme module keeps the light colours: BDK's own rule for a dark device
     (style.css line 370) would put light text on the core's light page;
   - left out (FEATURES.md "Not ported"): the after-answer drug card's dt/dd
     colours and the `.asked` shading (app.js 899-918, 934; style.css 372-381)
     and the field labels in question prompts (style.css 372-373, .term-label).
   Nothing is stored.
   ========================================================================== */
function fcCss(){
  const tabs = typeof FX !== 'undefined' ? FX.tabs() : [], F = OPT.fields || [];
  if(!tabs.length || !F.length) return '';
  const sel = (pre, f) => tabs.map(t => `${pre}#v-${t} [data-field="${f}"]`).join(',');
  let css = F.map(([f, light]) => `${sel('', f)}{color:${light}}`).join('\n') + '\n' +
            F.map(([f, , dark]) => `${sel(':root[data-theme="dark"] ', f)}{color:${dark}}`).join('\n') + '\n';
  if(FX.on('theme'))
    css += '@media (prefers-color-scheme: dark){\n' + F.map(([f, , dark]) => `${sel(':root:not([data-theme="light"]) ', f)}{color:${dark}}`).join('\n') + '\n}\n';
  return css;
}
X.start(() => {
  const css = fcCss();
  if(!css || !document.head) return;
  const s = document.createElement('style');
  s.id = 'fx-field-colours';
  s.textContent = css;
  document.head.appendChild(s);
});
X.api({css: fcCss});
