import shutil
d = '/tmp/port-integration/c-all5/src/features/module-pages/'
s = open(d + 'test.js').read()
old = "      await page.click('#v-topics [data-mpchain=\"mpt-hw2-p2\"] >> visible=true');"
assert old in s
s = s.replace(old, "      console.log('DBG', JSON.stringify(await ev(() => ({view: VIEW, btns: [...document.querySelectorAll('[data-mpchain]')].map(b => [b.dataset.mpchain, JSON.stringify(b.getBoundingClientRect()), getComputedStyle(b).visibility, getComputedStyle(b).display, b.closest('.hide,[hidden],details:not([open])') ? b.closest('.hide,[hidden],details:not([open])').outerHTML.slice(0,120) : '-']), cls: document.getElementById('v-topics').className, mp: !!document.querySelector('#v-topics .mpage')}))));\n      await browser.close(); process.exit(0);\n" + old)
open(d + 'test.dbg.js', 'w').write(s)
