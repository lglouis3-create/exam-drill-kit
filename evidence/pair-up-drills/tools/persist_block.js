    await ctx.close();

    console.log('  -- persistence: a large saved state --');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pairup-test-'));
    const P2 = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}, acceptDownloads: true}, DENY);
    const pg = P2.page, ev2 = (f, a) => pg.evaluate(f, a), wait = ms => pg.waitForTimeout(ms);
    const ready = () => pg.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const chip2 = n => `#v-pairup .pchip[data-pc="${n.replace(/"/g, '\\"')}"]`, box2 = n => `#v-pairup .ptarget[data-pt="${n.replace(/"/g, '\\"')}"] .pl`;
    // one whole round of a set through the page: every chip tapped, then its own box, then Check
    const placeRound = async set => {
      await pg.click('#nav button[data-v="pairup"]'); await pg.click(`#v-pairup [data-pset="${set}"]`);
      const R = await ev2(() => FX.api('pair-up-drills').pair().round.map(p => [p[0], p[1]]));
      for(const [c, b] of R){ await pg.click(chip2(c)); await pg.click(box2(b)); }
      return R.length; };
    const roundOf = async set => { const n = await placeRound(set); await pg.click('#v-pairup #pcheck'); return n; };
    // every mode's misses (every item but its first) and a best score per mode and per set, from the course's own items
    const big = await ev2(() => {
      const A = FX.api('pair-up-drills'), P = {best: {}, miss: {}};
      RECALL_TABLES.forEach(t => t.modes.forEach(m => { const it = A.items(t, m); P.miss[t.id + ':' + m.id] = it.slice(1).map(x => x.id); P.best[t.id + ':' + m.id] = `${Math.floor(it.length / 2)}/${it.length}`; }));
      PAIR_SETS.forEach(x => { P.best['pair:' + x.id] = '0/' + Math.min(x.pairs.length, x.bins ? 12 : x.pairs.length <= 9 ? x.pairs.length : 7); });
      DB.pairup = P; save();
      return {profile: PROFILE, best: Object.keys(P.best).length, miss: Object.values(P.miss).reduce((n, v) => n + v.length, 0)};
    });
    await wait(400);
    const snap = await ev2(() => JSON.stringify(DB.pairup)), SN = JSON.parse(snap);
    await pg.reload(); await ready();
    check(await ev2(() => JSON.stringify(DB.pairup)) === snap, `${big.best} best scores and ${big.miss} missed items come back after a reload`, big);
    await pg.click('#nav button[data-v="rt-ip-rx"]');
    const lead = await ev2(() => { const T = FX.api('pair-up-drills').state('ip-rx'), m = DB.pairup.miss['ip-rx:rec'];
      return {n: T.queue.length, m: m.length, first: T.queue.slice(0, m.length).every(x => m.includes(x.id)), meta: document.querySelector('#v-rt-ip-rx .rxcard .meta').textContent}; });
    check(lead.n === 39 && lead.m === 38 && lead.first && /best 19\/39/.test(lead.meta), 'the 38 saved misses lead the round of 39, and the saved best score is shown', lead);

    // Export, then Import into a new profile
    await ev2(() => show('settings'));
    const dl = pg.waitForEvent('download'); await pg.click('#btnExport');
    const ef = path.join(tmp, 'export.json'); await (await dl).saveAs(ef);
    const exported = JSON.parse(fs.readFileSync(ef, 'utf8'));
    check(JSON.stringify(exported.db.pairup) === snap, `Export progress carries every best score (${Object.keys((exported.db.pairup || {}).best || {}).length}) and every miss list (${Object.keys((exported.db.pairup || {}).miss || {}).length})`);
    await ev2(() => { window.__name = 'Fresh'; askProfile(true); show('settings'); });
    check(await ev2(() => PROFILE === 'Fresh' && !DB.pairup), 'a new profile starts with no Pair up or table progress');
    await pg.setInputFiles('#fileIn', ef); await wait(600);
    check(await ev2(() => JSON.stringify(DB.pairup)) === snap, 'Import progress into the new profile brings back the same best scores and misses');
    await pg.reload(); await ready();
    check(await ev2(() => PROFILE === 'Fresh' && JSON.stringify(DB.pairup)) === snap, 'the imported progress is saved: it comes back after a reload');

    // each profile keeps its own
    await ev2(() => { window.__name = 'Other'; askProfile(true); });
    check(await ev2(() => PROFILE === 'Other' && !DB.pairup), 'a third profile has no Pair up or table progress');
    const nAnti = await roundOf('ip-anti'); await wait(400);
    const other = await ev2(() => JSON.stringify(DB.pairup));
    check(other === JSON.stringify({best: {'pair:ip-anti': nAnti + '/' + nAnti}, miss: {}}), 'a whole round in the third profile keeps only its own score there', other);
    await ev2(() => { window.__name = 'Fresh'; askProfile(true); });
    check(await ev2(() => JSON.stringify(DB.pairup)) === snap, 'switching back, the profile has its own best scores and misses, unchanged');
    await ev2(() => { window.__name = 'Other'; askProfile(true); });
    check(await ev2(() => JSON.stringify(DB.pairup)) === other, 'the third profile still has only its own score');
    await ev2(() => { window.__name = 'Fresh'; askProfile(true); });
    check(await ev2(() => PROFILE === 'Fresh'), 'back on the profile with the large saved state');

    // a reload soon after Check (the core writes the progress 150 ms after the last change)
    const reset = async () => { await ev2(() => { DB.pairup.best['pair:ip-anti'] = '0/8'; DB.pairup.best['pair:ip-dumb'] = '0/9'; save(); }); await wait(400); };
    await roundOf('ip-anti'); await wait(400);
    await pg.reload(); await ready();
    check(await ev2(() => DB.pairup.best['pair:ip-anti']) === '8/8', 'a reload 400 ms after Check keeps the new best score');
    await reset();
    await placeRound('ip-anti');
    await Promise.all([pg.waitForNavigation(), ev2(() => { document.querySelector('#v-pairup #pcheck').click(); location.reload(); }).catch(() => {})]);
    await ready();
    const fast = await ev2(() => ({b: DB.pairup.best['pair:ip-anti'], best: Object.keys(DB.pairup.best).length, miss: JSON.stringify(DB.pairup.miss)}));
    console.log(`  report  a reload in the same moment as Check: the best score reads ${fast.b} (${fast.b === '8/8' ? 'the new score was kept' : 'the new score was lost; the score saved before is kept'})`);
    check((fast.b === '8/8' || fast.b === '0/8') && fast.best === big.best && fast.miss === JSON.stringify(SN.miss),
          'a reload at once after Check loses at most that score, and every other saved value is still there', {b: fast.b, best: fast.best});

    // storage denied, then storage full
    for(const mode of ['denied', 'full']){
      await pg.reload(); await ready(); await reset();
      const stored0 = await ev2(() => localStorage.getItem(keyFor(PROFILE)));
      await ev2(m => { window.__deny = m; }, mode);
      await roundOf('ip-anti'); await wait(400);
      const r = await ev2(() => ({warn: (() => { const w = document.querySelector('#savewarn'); if(!w) return false; const b = w.getBoundingClientRect(), cs = getComputedStyle(w);
          return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; })(),
        text: (document.querySelector('#savewarn') || {}).textContent || '', stored: localStorage.getItem(keyFor(PROFILE)), mem: DB.pairup.best['pair:ip-anti'],
        shown: document.querySelector('#v-pairup #pscore').textContent}));
      check(r.warn && /did not save your progress/.test(r.text), `storage ${mode}: the student is told the progress was not saved`, r.text);
      check(r.stored === stored0 && r.mem === '8/8' && /8 of 8 right/.test(r.shown), `storage ${mode}: the stored progress is left as it was, and the new score stays on screen`, {mem: r.mem, shown: r.shown, same: r.stored === stored0});
      if(SHOTS && mode === 'full') await pg.screenshot({path: path.join(SHOTS, 'storage-full.png')});
      await ev2(() => { window.__deny = null; });
      await roundOf('ip-dumb'); await wait(400);
      await pg.reload(); await ready();
      const back = await ev2(() => ({a: DB.pairup.best['pair:ip-anti'], d: DB.pairup.best['pair:ip-dumb'], best: Object.keys(DB.pairup.best).length, miss: JSON.stringify(DB.pairup.miss)}));
      check(back.a === '8/8' && back.d === '9/9' && back.best === big.best && back.miss === JSON.stringify(SN.miss),
            `storage ${mode}: once storage works, the next change is saved with the score kept on screen and every earlier value, and loads after a reload`, {a: back.a, d: back.d, best: back.best});
    }

    // a saved value in another shape (an older or edited export) is read as none
    await ev2(() => { const k = keyFor(PROFILE), d = JSON.parse(localStorage.getItem(k));
      d.pairup.best['ip-rx:rec'] = 7; d.pairup.miss['ip-rx:rec'] = 5; d.pairup.miss['ip-pt:anti'] = {a: 1}; localStorage.setItem(k, JSON.stringify(d)); });
    await pg.reload(); await ready();
    await pg.click('#nav button[data-v="rt-ip-rx"]');
    const bs = await ev2(() => ({n: (FX.api('pair-up-drills').state('ip-rx') || {queue: []}).queue.length, meta: (document.querySelector('#v-rt-ip-rx .rxcard .meta') || {}).textContent || ''}));
    await pg.click('#nav button[data-v="rt-ip-pt"]');
    const bs2 = await ev2(() => (FX.api('pair-up-drills').state('ip-pt') || {queue: []}).queue.length);
    check(bs.n === 39 && !/best/.test(bs.meta) && bs2 === 12 && !P2.errors.length && await ev2(() => !FX.errors.length),
          'a saved best score or miss list in another shape is read as none: both tables open with every row', {bs, bs2, errors: P2.errors.slice(0, 2)});
    check(!P2.errors.length, 'no page error in the persistence runs', P2.errors.slice(0, 3).join(' | '));
    await P2.ctx.close();
    fs.rmSync(tmp, {recursive: true, force: true});
