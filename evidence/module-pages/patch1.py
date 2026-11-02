p = '/home/user/exam-drill-kit/.claude/worktrees/agent-aa8a4a6d1fc0e12bc/features/module-pages/current/test.js'
s = open(p).read()
s = s.replace("OBJECTIVES[1].subs.includes(q.topic + '/' + q.sub)", "FX.api('module-pages').objectivesOf(2)[1].subs.includes(q.topic + '/' + q.sub)")
a = s.index("    const tpl = await ev(")
b = s.index("    check(!errors.length && !(await ev(() => FX.errors.length)), 'no page error and no module error'")
s = s[:a] + s[b:]
new = '''    { // the same Module 2 without its objectives, kinds of problem and set
      const sb = L.scratchBuild('mp-bare', {files: fixtureFiles(own, {mutate: d => { d.objectives.length = 0; d.types.length = 0; d.chains.length = 0; }}), courseLine: courseLine(own, [])});
      builds.push(sb);
      if(check(sb.code === 0, 'the scratch copy builds with no objectives and no kinds of problem for Module 2', sb.out.split('\\n').pop())){
        const o = await L.openPage(browser, sb.page, {viewport: {width: 1100, height: 1300}});
        const e = (f, a) => o.page.evaluate(f, a);
        const i = await e(() => FX.api('module-pages').mods().findIndex(r => r[0] === 2));
        const b = await e(i => [...document.querySelectorAll(`#mpCards .modbtn[data-mpmod="${i}"] small`)].map(x => x.textContent), i);
        await e(i => FX.api('module-pages').open(i, 'concepts'), i);
        const t1 = await e(() => ({other: !!document.querySelector('#v-topics [data-mpother="concept"]'), objs: document.querySelectorAll('#v-topics [data-mpobj], #v-topics [data-mpobjall]').length, text: document.getElementById('v-topics').textContent}));
        await o.page.click('#v-topics .mtab[data-mpsec="calcs"]'); await o.page.waitForTimeout(60);
        const t2 = await e(() => ({other: !!document.querySelector('#v-topics [data-mpother="calc"]'), types: document.querySelectorAll('#v-topics [data-mpctype]').length, text: document.getElementById('v-topics').textContent}));
        check(b.join(' | ') === '10 questions · 0 objectives | 12 problems · 0 types' && t1.other && !t1.objs && /All concept questions in this module/.test(t1.text)
              && t2.other && !t2.types && /Calculations by subtopic/.test(t2.text),
              'a module with no objectives or kinds lists its questions under All concept questions and Calculations by subtopic', {b, c: t1.other, k: t2.other});
        await o.page.click('#v-topics [data-mpother="calc"]'); await o.page.waitForTimeout(60);
        check(await e(() => Q.pool.length === 12 && Q.pool.every(q => q.type === 'numeric')), 'its 12 calculations start as one pass');
        await e(i => FX.api('module-pages').open(i, 'concepts'), i);
        await o.page.click('#v-topics [data-mpother="concept"]'); await o.page.waitForTimeout(60);
        check(await e(() => Q.pool.length === 10 && Q.pool.every(q => !q.type)), 'its 10 concept questions start as one drill');
        check(!o.errors.length, 'no page error on the copy without objectives', o.errors);
        await o.ctx.close();
      }
    }
'''
c = s.index("    if(chained.length){\n      const s2 = L.scratchBuild('mp-nochain'")
s = s[:c] + new + s[c:]
open(p, 'w').write(s)
print('ok')
