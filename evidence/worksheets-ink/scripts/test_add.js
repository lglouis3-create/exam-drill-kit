
    /* ---- Practice in the drill with chained-problem-sets on and off ---- */
    {
      const chainedDir = path.join(__dirname, '..', 'chained-problem-sets');
      const runs = [['off', "delete COURSE.features['chained-problem-sets'];"]];
      if(fs.existsSync(path.join(chainedDir, 'module.json'))) runs.push(['on', L.featureOn(chainedDir, {})]);
      else L.skip('Practice in the drill with chained-problem-sets on', 'NOT RUN: this course does not carry features/chained-problem-sets/');
      for(const [how, line] of runs){
        console.log(`\n--- Practice in the drill, chained-problem-sets ${how} ---`);
        const b = L.scratchBuild('ws-chain', {files: fixtureFiles(own), courseLine: courseLine() + line});
        if(!check(b.code === 0, `the scratch copy builds with chained-problem-sets ${how}`, b.out.split('\n').slice(-2).join(' '))){ b.rm(); continue; }
        const o = await L.openPage(browser, b.page, {viewport: {width: 820, height: 1180}}, INIT);
        o.page.on('console', m => { if(m.type() === 'error') o.errors.push(m.text()); });
        const go = (id, v) => o.page.evaluate(([id, v]) => { FX.api('worksheets-ink').startSheetSet(id, v);
          return {view: VIEW, chain: Q && Q.chain ? Q.chain.id : null, sweep: Q ? Q.sweep.slice() : null, cur: Q && Q.current ? Q.current.id : null,
                  prog: (document.querySelector('#v-quiz .qprog span') || {}).textContent || '', cset: !!document.querySelector('#v-quiz .cset'),
                  on: !!FX.api('chained-problem-sets')}; }, [id, v]);
        const one = await go(pre('dp-m1-3'), 'main'), want1 = EXPECT['dp-m1-3'].main.flat().map(pre);
        const two = await go(pre('hw-2'), 'main'), want2 = EXPECT['hw-2'].main.flat().map(pre);
        if(how === 'on'){
          check(one.on && one.view === 'quiz' && one.chain === pre('ws1-p3') && JSON.stringify(one.sweep) === JSON.stringify(want1) && /^part 1 of 5$/.test(one.prog) && one.cset,
                `with chained-problem-sets on, a sheet that is one whole problem set starts that set (part 1 of 5, with its vignette line) ${JSON.stringify(one)}`);
        } else {
          check(!one.on && one.view === 'quiz' && !one.chain && JSON.stringify(one.sweep) === JSON.stringify(want1) && one.cur === want1[0],
                `with chained-problem-sets off, the same sheet is asked as one pass in the sheet's order ${JSON.stringify(one)}`);
        }
        check(two.view === 'quiz' && !two.chain && JSON.stringify(two.sweep) === JSON.stringify(want2),
              `a sheet of two problem sets is asked as one pass in the sheet's order (chained-problem-sets ${how}) ${JSON.stringify([two.chain, two.sweep.length])}`);
        check(!o.errors.length, `no page or console errors (chained-problem-sets ${how})`, o.errors.slice(0, 3).join('; '));
        await o.ctx.close(); b.rm();
      }
    }

    /* ---- persistence: the writing is part of the progress, written whole at every save ---- */
    console.log('\n=== persistence: much writing, Export and Import, profiles, reloads, storage refused or full (Chromium) ===');
    const DENY = () => { const o = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){ if(window.__deny) throw new DOMException('The operation is insecure.', 'SecurityError'); return o.call(this, k, v); }; };
    const openWith = async (w, h, extra) => {
      const o = await L.openPage(browser, s.page, {viewport: {width: w, height: h}, acceptDownloads: true}, extra ? `(${INIT})(); (${extra})();` : INIT);
      o.page.on('console', m => { if(m.type() === 'error') o.errors.push(m.text()); });
      return o;
    };
    const SID = pre('dp-m1-2');
    // open a worksheet (as Write on it does) and give the key of its first calculation part
    const sheetOpen = (page, id, v) => page.evaluate(([id, v]) => { FX.api('worksheets-ink').inkOpen(id, v || 'main');
      const el = document.querySelector('#ink .wspart.calc') || document.querySelector('#ink .wspart'); el.querySelector('.wswork').scrollIntoView({block: 'center'}); return el.dataset.ink; }, [id, v]);
    const drawOn = async (page, k, dy) => {
      const oy = await page.evaluate(k => { const el = document.querySelector(`#ink .wspart[data-ink="${k}"]`); return el.querySelector('.wswork').getBoundingClientRect().y - el.getBoundingClientRect().y; }, k);
      await stroke(page, `#ink .wspart[data-ink="${k}"] > canvas.inkcv`, 30, oy + 40 + (dy || 0), 200, oy + 90 + (dy || 0));
    };
    const stored = (page, who) => page.evaluate(who => { const r = localStorage.getItem(keyFor(who || PROFILE)); return r; }, who);
    const summary = (raw, id) => { if(!raw) return null; const d = JSON.parse(raw), ink = d.ink || {};
      const pg = ink[id + '|main']; return {answers: (d.answers || []).length, pages: Object.keys(ink).length,
        strokes: Object.values(ink).reduce((n, p) => n + Object.values(p.parts || {}).reduce((a, l) => a + l.length, 0), 0),
        page: pg ? Object.values(pg.parts).reduce((a, l) => a + l.length, 0) : 0, len: raw.length}; };
    const answer = (page, qid) => page.evaluate(qid => { DB.answers.push({qid, concept: 'x', result: 'correct', at: Date.now(), qn: DB.answers.length + 1}); save(); }, qid);
    const done = page => page.evaluate(() => { const b = document.querySelector('#ink [data-inkdone]'); if(b) b.click(); });
    const reload = async page => { await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); };
    const warnInfo = page => page.evaluate(() => { const w = document.querySelector('#ink .inkwarn'), r = w && w.getBoundingClientRect();
      return {shown: !!w && !w.hidden && r.width > 0 && r.bottom <= innerHeight && r.top >= 0 && r.left >= 0 && r.right <= innerWidth, text: w ? w.textContent : '',
              state: FX.api('worksheets-ink').state() && FX.api('worksheets-ink').state().saved, core: !!document.getElementById('savewarn')}; });
    // pages of strokes shaped like the module's own (60 points each, 4 decimals), added straight to the progress
    const BULK = ([pages, per, tag]) => {
      const ids = QUESTIONS.map(q => q.id), mk = (seed, n) => { const p = []; for(let i = 0; i < n; i++) p.push(+(0.05 + ((seed * 7 + i * 13) % 900) / 1000).toFixed(4), +(0.05 + ((seed * 11 + i * 17) % 900) / 1000).toFixed(4)); return {t: 'pen', c: '#111111', w: 0.00305, p}; };
      DB.ink = DB.ink || {};
      for(let g = 0; g < pages; g++){ const ss = []; for(let j = 0; j < per; j++) ss.push(mk(g * per + j, 60));
        DB.ink['q:' + ids[g % ids.length] + '|' + tag + Math.floor(g / ids.length)] = {parts: {work: ss}, room: {}, at: Date.now()}; }
      return JSON.stringify(DB.ink).length;
    };

    { // much writing: Export, Import into a fresh profile, a profile switch, reloads under and over 150 ms
      const {ctx, page, errors} = await openWith(820, 1180);
      const ev = (f, a) => page.evaluate(f, a);
      let k = await sheetOpen(page, SID); await drawOn(page, k); await done(page);
      const bytes = await ev(BULK, [60, 30, 'bulk']);
      await ev(() => save()); await page.waitForTimeout(400);
      const big = summary(await stored(page), SID);
      console.log(`  size  much writing: ${big.pages} pages, ${big.strokes} strokes, ${bytes} characters of writing in a saved progress of ${big.len} characters`);
      check(big.pages === 61 && big.strokes === 1801 && big.page === 1, `much writing is saved whole: ${big.pages} pages, ${big.strokes} strokes, ${Math.round(big.len / 1024)} KB`, big);
      await reload(page);
      const back = await ev(() => { const A = FX.api('worksheets-ink'); return [Object.keys(DB.ink || {}).length, A.inkBytes()]; });
      k = await sheetOpen(page, SID);
      const px = await ev(k => { const c = document.querySelector(`#ink .wspart[data-ink="${k}"] > canvas.inkcv`), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for(let i = 3; i < d.length; i += 4) if(d[i] > 0) n++; return n; }, k);
      check(back[0] === 61 && back[1] === bytes && px > 50, `after a reload every page of it is back and the page shows its writing (${back[0]} pages, ${back[1]} characters, ${px} pixels)`);
      await done(page);
      // Export progress, then Import into a fresh profile
      const mine = await ev(() => PROFILE), inkMine = await ev(() => JSON.stringify(DB.ink));
      await ev(() => show('settings'));
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
      const file = fs.readFileSync(await dl.path(), 'utf8'), j = JSON.parse(file);
      console.log(`  size  the export file of that progress: ${file.length} characters`);
      check(JSON.stringify(j.db.ink) === inkMine, `Export progress holds all the writing (${Object.keys(j.db.ink).length} pages, ${Math.round(file.length / 1024)} KB file)`);
      await ev(() => { window.__name = 'Fresh'; askProfile(true); show('settings'); });
      const fresh0 = await ev(() => [PROFILE, FX.api('worksheets-ink').inkBytes()]);
      await page.setInputFiles('#fileIn', {name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(file)});
      await page.waitForFunction(n => DB.ink && Object.keys(DB.ink).length === n, Object.keys(j.db.ink).length, {timeout: 10000}).catch(() => {});
      await page.waitForTimeout(400);
      const fresh1 = await ev(() => JSON.stringify(DB.ink)), freshStored = JSON.parse(await stored(page)).ink;
      check(fresh0[0] === 'Fresh' && fresh0[1] === 0 && fresh1 === inkMine && JSON.stringify(freshStored) === inkMine,
            `Import into a fresh profile brings the same writing back, and saves it (${fresh0}, ${fresh1 === inkMine}, ${JSON.stringify(freshStored) === inkMine})`);
      // a profile switch: each profile keeps its own
      k = await sheetOpen(page, SID); await drawOn(page, k, 40); await done(page);
      const f1 = await ev(id => FX.api('worksheets-ink').inkCount(id, 'main'), SID);
      await ev(n => { window.__name = n; askProfile(true); }, mine);
      const m1 = await ev(id => [PROFILE, FX.api('worksheets-ink').inkCount(id, 'main')], SID);
      await ev(() => { window.__name = 'Fresh'; askProfile(true); });
      const f2 = await ev(id => [PROFILE, FX.api('worksheets-ink').inkCount(id, 'main')], SID);
      check(f1 === 2 && m1[0] === mine && m1[1] === 1 && f2[1] === 2, `after a switch each profile keeps its own writing (Fresh ${f1}, ${JSON.stringify(m1)}, ${JSON.stringify(f2)})`);
      // a reload under 150 ms after a stroke, and over
      k = await sheetOpen(page, SID); await drawOn(page, k, 80);
      await reload(page);
      const fast = await ev(id => [PROFILE, FX.api('worksheets-ink').inkCount(id, 'main')], SID);
      check(fast[0] === 'Fresh' && fast[1] === 3, `a reload at once after a stroke keeps the stroke: the module writes the progress when the pen lifts (${JSON.stringify(fast)})`);
      k = await sheetOpen(page, SID); await drawOn(page, k, 120); await page.waitForTimeout(300);
      await reload(page);
      check(await ev(id => FX.api('worksheets-ink').inkCount(id, 'main'), SID) === 4, 'a reload 300 ms after a stroke keeps it');
      // the core's own 150 ms wait, for an answer (reported, not a check: core behaviour)
      const a0 = await ev(() => DB.answers.length); await answer(page, pre('ws1-2-1')); await reload(page);
      const a1 = await ev(() => DB.answers.length); await answer(page, pre('ws1-2-1')); await page.waitForTimeout(300); await reload(page);
      const a2 = await ev(() => DB.answers.length);
      console.log(`  report  core: an answer saved and the page reloaded at once: ${a1 - a0} of 1 kept; reloaded after 300 ms: ${a2 - a1} of 1 kept (the core writes the progress 150 ms after the last change)`);
      check(!errors.length, 'no page or console errors with much writing', errors.slice(0, 3).join('; '));
      await ctx.close();
    }

    for(const [W, H] of [[820, 1180], [390, 844]]){ // storage denied: setItem throws
      console.log(`\n--- storage denied at ${W} px ---`);
      const {ctx, page, errors} = await openWith(W, H, DENY);
      const ev = (f, a) => page.evaluate(f, a);
      await answer(page, pre('ws1-2-1')); await page.waitForTimeout(300);
      let k = await sheetOpen(page, SID); await drawOn(page, k);
      const before = await stored(page);
      await ev(() => { window.__deny = true; });
      await drawOn(page, k, 60);
      const w = await warnInfo(page), mem = await ev(id => FX.api('worksheets-ink').state().data.parts, SID);
      await answer(page, pre('ws1-2-2')); await page.waitForTimeout(300);
      const during = await stored(page);
      check(w.shown && w.state === 'off' && /not saving/.test(w.text) && w.core, `with storage denied the page says the writing is not being saved, on screen (${JSON.stringify(w)})`);
      check(during === before && summary(during, SID).page === 1 && summary(during, SID).answers === 1 && Object.values(mem).reduce((a, l) => a + l.length, 0) === 2,
            `nothing saved before is overwritten, and the new stroke stays on screen (${JSON.stringify(summary(during, SID))})`);
      await done(page); await reload(page);   // storage works again (the page starts without the refusal)
      const after = await ev(id => [DB.answers.length, FX.api('worksheets-ink').inkCount(id, 'main')], SID);
      k = await sheetOpen(page, SID); await drawOn(page, k, 60); await page.waitForTimeout(300);
      const again = summary(await stored(page), SID), w2 = await warnInfo(page);
      check(after[0] === 1 && after[1] === 1 && again.page === 2 && !w2.shown && w2.state === 'ok',
            `once storage works again the answers and writing saved before load, and new writing is saved (${JSON.stringify(after)}, ${again.page} strokes)`);
      await done(page);
      check(!errors.length, `no page or console errors with storage denied at ${W} px`, errors.slice(0, 3).join('; '));
      await ctx.close();
    }

    for(const [W, H] of [[820, 1180], [390, 844]]){ // storage full: this browser's real localStorage quota
      console.log(`\n--- storage full (Chromium's own quota) at ${W} px ---`);
      const {ctx, page, errors} = await openWith(W, H);
      const ev = (f, a) => page.evaluate(f, a);
      await answer(page, pre('ws1-2-1')); await page.waitForTimeout(300);
      // the longest value one more key can hold now, to 256 characters
      const PROBE = () => { const k = '__wsi_probe', fits = n => { try { localStorage.setItem(k, 'x'.repeat(n)); return true; } catch(e){ return false; } finally { try { localStorage.removeItem(k); } catch(e){} } };
        let lo = 0, hi = 1 << 22; while(fits(hi)) { lo = hi; hi *= 2; if(hi > (1 << 28)) break; }
        while(hi - lo > 256){ const m = (lo + hi) >> 1; if(fits(m)) lo = m; else hi = m; } return lo; };
      const free0 = await ev(PROBE);
      const used0 = await ev(() => { let n = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); n += k.length + localStorage.getItem(k).length; } return n; });
      // fill the progress with writing until about 3000 characters are left
      const fill = await ev(([free, used, BULKs]) => { const BULK = eval(BULKs); const len0 = JSON.stringify(DB).length, target = len0 + free - 3000;
        let have = len0; const per = JSON.stringify({parts: {work: Array(20).fill(0).map(() => ({t: 'pen', c: '#111111', w: 0.00305, p: Array(120).fill(0.1234)}))}, room: {}, at: Date.now()}).length + 30;
        BULK([Math.max(0, Math.floor((target - have - 40000) / per)), 20, 'fill']); have = JSON.stringify(DB).length;
        const pad = {t: 'pen', c: '#111111', w: 0.00305, p: []}; DB.ink['q:' + QUESTIONS[0].id + '|pad'] = {parts: {work: [pad]}, room: {}, at: 1};
        have = JSON.stringify(DB).length; const add = Math.max(0, Math.floor((target - have) / 7) & ~1); for(let i = 0; i < add; i++) pad.p.push(0.1234);
        while(JSON.stringify(DB).length > target) pad.p.splice(-2, 2);
        while(JSON.stringify(DB).length < target - 14) pad.p.push(0.1234, 0.1234);
        const ok = store.set(keyFor(PROFILE), JSON.stringify(DB)); return {ok, len: JSON.stringify(DB).length, len0, used, free}; }, [free0, used0, BULK.toString()]);
      const free1 = await ev(PROBE);
      console.log(`  size  Chromium's localStorage for this origin took ${used0 + free0} characters of keys and values (${(2 * (used0 + free0) / 1048576).toFixed(2)} MiB as UTF-16); a save failed once the progress passed ${fill.len + free1} characters, with ${free1} left after the fill`);
      check(fill.ok && free1 < 6000, `the progress, filled with writing, is saved with under 6000 characters left (${fill.len} characters, ${free1} left)`);
      const before = await stored(page);
      let k = await sheetOpen(page, SID);
      // one long stroke of 400 points (about 5600 characters), more than is left
      await ev(k => { const c = document.querySelector(`#ink .wspart[data-ink="${k}"] > canvas.inkcv`), r = c.getBoundingClientRect();
        const e = (type, x, y) => c.dispatchEvent(new PointerEvent(type, {pointerType: 'mouse', clientX: r.left + x, clientY: r.top + y, pointerId: 61, bubbles: true, cancelable: true, isPrimary: true, buttons: 1}));
        e('pointerdown', 20, 120); for(let i = 1; i <= 400; i++) e('pointermove', 20 + (i % 100) * 3, 120 + Math.floor(i / 100) * 30 + (i % 2) * 4); e('pointerup', 300, 250); }, k);
      const w = await warnInfo(page);
      const st = await ev(([id, k]) => { const I = FX.api('worksheets-ink').state(); return [(I.data.parts[k] || []).length, !!(DB.ink[id + '|main'])]; }, [SID, k]);
      const kept = await stored(page);
      check(w.shown && w.state === 'refused' && /not saved/.test(w.text) && !w.core, `when the stroke would make the progress too big, the page says it was not saved, on screen (${JSON.stringify(w)})`);
      check(kept === before && st[0] === 1 && !st[1], `the saved progress is left as it was, and the stroke stays on screen only (${kept === before}, ${JSON.stringify(st)})`);
      await done(page);
      await answer(page, pre('ws1-2-2')); await page.waitForTimeout(300);
      const after = summary(await stored(page), SID);
      check(after.answers === 2, `an answer given after the refused stroke is still saved (${after.answers} answers saved)`);
      // Export of the full progress, and Import of it into a second profile, which does not fit
      await ev(() => show('settings'));
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
      const file = fs.readFileSync(await dl.path(), 'utf8'), inkNow = await ev(() => JSON.stringify(DB.ink));
      check(JSON.stringify(JSON.parse(file).db.ink) === inkNow, `Export progress works with storage full (${Math.round(file.length / 1024)} KB file)`);
      const mine = await ev(() => PROFILE), mineBefore = await stored(page);
      await ev(() => { window.__name = 'Second'; askProfile(true); show('settings'); });
      await page.setInputFiles('#fileIn', {name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(file)});
      await page.waitForTimeout(600);
      const imp = await ev(([who]) => ({core: !!document.getElementById('savewarn'), second: localStorage.getItem(keyFor('Second')), first: localStorage.getItem(keyFor(who))}), [mine]);
      check(imp.core && (!imp.second || imp.second.length < 1000) && imp.first === mineBefore,
            `an Import that does not fit shows the core's notice and leaves the first profile's saved progress as it was (${imp.core}, ${imp.second ? imp.second.length : null}, ${imp.first === mineBefore})`);
      console.log('  report  core: the imported progress that did not fit is kept for this visit only; the core says so (#savewarn) and nothing else changes');
      await ev(n => { window.__name = n; askProfile(true); }, mine);
      await reload(page);
      const back = await ev(id => [PROFILE, DB.answers.length, Object.keys(DB.ink || {}).length, FX.api('worksheets-ink').inkCount(id, 'main')], SID);
      check(back[0] === mine && back[1] === 2 && back[2] === summary(before, SID).pages && back[3] === 0,
            `after a reload the answers and the writing saved before load, without the refused stroke (${JSON.stringify(back)})`);
      // making room: Erase all writing, then writing is saved again
      await ev(() => show('settings')); await page.click('#inkErase'); await page.waitForTimeout(300);
      k = await sheetOpen(page, SID); await drawOn(page, k);
      const room = summary(await stored(page), SID), w2 = await warnInfo(page);
      check(room.page === 1 && room.answers === 2 && !w2.shown, `after Erase all writing makes room, new writing is saved and the answers are kept (${JSON.stringify(room)})`);
      await done(page);
      check(!errors.length, `no page or console errors with storage full at ${W} px`, errors.slice(0, 3).join('; '));
      await ctx.close();
    }
