const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({viewport: {width: 1000, height: 900}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  const p = await ctx.newPage(); p.on('dialog', d => d.accept()); p.on('console', m => console.log('console:', m.text()));
  await p.goto('file://' + process.argv[2]); await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
  const id = process.argv[3];
  for(const mode of ['none', 'dialog', 'panel']){
    await p.evaluate(id => { Q = {pool: [byId(id)], label: 'd', sweep: [id], i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false}; nextQuestion(); show('quiz'); }, id);
    await p.waitForTimeout(80);
    await p.evaluate(mode => {
      document.addEventListener('keydown', e => console.log('keydown', e.key, e.target.tagName, 'opts', document.querySelectorAll('#v-quiz .qbody button.opt[data-o]').length, 'scall', !!document.querySelector('#v-quiz .scall'), 'VIEW', VIEW), {once: true});
      if(mode === 'dialog'){ const d = document.createElement('dialog'); d.innerHTML = 'x'; document.body.appendChild(d); d.showModal(); }
      if(mode === 'panel'){ const d = document.createElement('div'); d.setAttribute('role', 'dialog'); d.tabIndex = -1; document.body.appendChild(d); d.focus(); }
    }, mode);
    await p.keyboard.press('a'); await p.waitForTimeout(100);
    console.log(mode, JSON.stringify(await p.evaluate(() => ({rev: Q.revealed, picked: Q.picked, fx: FX.errors}))));
    await p.evaluate(() => { document.querySelectorAll('dialog').forEach(d => { d.close(); d.remove(); }); document.querySelectorAll('[role=dialog]').forEach(d => d.remove()); });
  }
  await b.close();
})();
