/* theme: the student's own choice of colours, Match device, Light or Dark.
   Basic-Pharmacokinetics src/views.js lines 6323-6333 and src/shell.html lines
   1036-1042, at ac2eb73 (its choice was named System; here it is Match device).

   Match device (the default): no data-theme attribute on <html>, so the page
   follows the phone's or computer's own light or dark setting through the
   prefers-color-scheme rules in theme.css, and changes when that setting
   changes, with no script involved. Light or Dark sets data-theme on <html>,
   which theme.css reads.

   Where the choice is kept: in this browser's storage, under <ns>:theme, the
   same for every profile, beside the other settings of the device (<ns>:profile,
   <ns>:newsSeen). It is not in the progress (DB): the progress is per profile
   and moves to another device with Export progress, while a colour choice
   belongs to the screen it was made on (a phone kept dark at night, a laptop
   kept light). So Export does not carry it, Import does not change it, and
   switching profile does not change it. It is read through the core's `store`,
   so a browser that refuses storage keeps the choice for the visit only. */
const KEY = NS + ':theme';
const CHOICES = [['device', 'Match device'], ['light', 'Light'], ['dark', 'Dark']];
const valid = t => t === 'light' || t === 'dark';
function current(){ const t = store.get(KEY); return valid(t) ? t : 'device'; }
function apply(t){
  const root = document.documentElement;
  if(!root || typeof root.setAttribute !== 'function') return;   // no page: the checks run the engine in node
  if(valid(t)) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
}
function sync(){
  const t = current();
  document.querySelectorAll('[data-themepick]').forEach(el => {
    if(el.tagName === 'SELECT') el.value = t; else el.checked = el.value === t;
  });
}
function choose(t){
  if(valid(t)) store.set(KEY, t); else store.del(KEY);
  apply(current()); sync();
}
/* before views.js draws the first screen, so a page opened on Dark never shows light first */
apply(current());

X.start(() => {
  const who = document.querySelector('header .who');
  if(!who || document.getElementById('themeSel')) return;
  const sel = document.createElement('select');
  sel.id = 'themeSel'; sel.className = 'themesel';
  sel.setAttribute('aria-label', 'Color theme'); sel.setAttribute('data-themepick', '');
  sel.innerHTML = CHOICES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  sel.value = current();
  sel.onchange = () => choose(sel.value);
  who.insertBefore(sel, document.getElementById('btnWho'));
});

X.settings({
  title: 'Color theme',
  html: () => `<div class="fxtheme">` + CHOICES.map(([v, l]) =>
      `<label><input type="radio" name="fxtheme" value="${v}" data-themepick${current() === v ? ' checked' : ''}> ${l}</label>`).join('') +
    `<p>Match device uses the light or dark setting of this phone or computer. The choice is kept in this browser on this device,
    for every profile here. It is not part of your progress, so Export progress does not take it to another device.</p></div>`,
  wire: el => el.querySelectorAll('input[data-themepick]').forEach(r => { r.onchange = () => { if(r.checked) choose(r.value); }; }),
});

X.api({current, choose, key: KEY});
