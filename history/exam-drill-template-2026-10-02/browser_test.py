#!/usr/bin/env python3
"""Drive the built app in a real browser and fail on anything a user would hit.

The node checks parse the bank and exercise the engine, but they stub out the
DOM. This opens the actual file in Chromium, answers a question, reveals the
explanation and visits every view, so a fault that only appears once the page
runs — a boot error, a view that throws on click, an image that does not decode
— is caught before the file is delivered.

    python3 browser_test.py [path-to-html]
"""
import glob, json, pathlib, re, sys
from playwright.sync_api import sync_playwright

_m = re.search(r"output:\s*'([^']+)'", open('course.js', encoding='utf-8').read())
HTML = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/' + (_m.group(1) if _m else 'exam_drill.html')

# Every question file, found rather than listed, so a new one is picked up here
# the moment it is built into the page instead of quietly going uncounted.
QSRC = sorted(glob.glob('q[0-9]*.js'))


# A question object opens at column 0 and carries a prof field; the TOPICS
# entries in the first question file are indented and have no prof, so they are not counted.
QRE = re.compile(r"(?m)^\{id:'[^']+',(?: *(?:lowYield|dupOf|skill|type):[^,]+,)* *prof:'")


def source_counts():
    """How many questions and images the sources hold, so the page can be
    compared against them instead of against a number written here."""
    n = sum(len(QRE.findall(open(f, encoding='utf-8').read())) for f in QSRC)
    if n == 0:
        sys.exit('ERROR: counted no questions in the sources — the count pattern is wrong')
    return n, len(json.load(open('images.json')))


fails = []
def check(ok, label, detail=''):
    print(('  ok    ' if ok else '  FAIL  ') + label + (f'  — {detail}' if detail and not ok else ''))
    if not ok:
        fails.append(label)


skipped = []
def skip(label, why):
    """A check that could not run on this bank is reported as skipped, never as passed."""
    print('  skip  ' + label + f'  — {why}')
    skipped.append(label)


def main():
    path = pathlib.Path(HTML).resolve()
    if not path.exists():
        sys.exit(f'ERROR: {path} does not exist — run build.py first')

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1280, 'height': 900})

        errors, console_errors = [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)

        print('\n=== Browser smoke test ===')
        page.goto(path.as_uri())
        page.wait_for_timeout(1200)

        # the app asks for a name on first run; answer the prompt if it appears
        page.evaluate("window.prompt = () => 'TestUser'")

        check(not errors, 'page loads with no uncaught JavaScript error',
              '; '.join(errors[:2]))
        check(not console_errors, 'no console errors on load', '; '.join(console_errors[:2]))

        body = page.inner_text('body')
        check(len(body) > 200, 'page renders visible text', f'only {len(body)} chars')

        # the question bank reached the page, counted from the sources rather
        # than from a literal, so adding questions does not require editing this
        want_q, want_i = source_counts()
        n = page.evaluate('typeof QUESTIONS !== "undefined" ? QUESTIONS.length : -1')
        check(n == want_q, f'question bank present in the page ({n} of {want_q} in the sources)')
        imgs = page.evaluate('typeof IMAGES !== "undefined" ? Object.keys(IMAGES).length : -1')
        check(imgs == want_i, f'image bank present in the page ({imgs} of {want_i} in images.json)')

        # every image decodes: a truncated base64 URL would fail here and nowhere else
        bad = page.evaluate("""async () => {
            const bad = [];
            for (const [k, v] of Object.entries(IMAGES)) {
                const ok = await new Promise(res => {
                    const im = new Image();
                    im.onload = () => res(im.naturalWidth > 0);
                    im.onerror = () => res(false);
                    im.src = v;
                });
                if (!ok) bad.push(k);
            }
            return bad;
        }""")
        check(not bad, f'all {imgs} embedded images decode', ', '.join(bad[:5]))

        # answer a question end to end through the real UI
        # A select-all item is answered by toggling options and pressing Check;
        # a single-answer item by clicking one option. `answerCurrent` does
        # whichever the question on screen needs, through the rendered buttons,
        # so every walk below exercises the same code a reader would.
        page.evaluate("""() => {
            window.answerCurrent = (allCorrect) => {
                const q = Q && Q.current; if (!q) return false;
                if (q.type === 'numeric') {
                    const inp = document.getElementById('numIn'); if (!inp) return false;
                    inp.value = allCorrect ? String(q.answer) : String(q.answer + 1000);
                    document.getElementById('btnCheck').click(); return true;
                }
                if (q.type === 'match') {
                    const sels = [...document.querySelectorAll('#v-quiz select[data-row]')]; if (!sels.length) return false;
                    sels.forEach((s, i) => { s.value = String(allCorrect ? i : (i + 1) % sels.length); s.dispatchEvent(new Event('change')); });
                    document.getElementById('btnCheck').click(); return true;
                }
                const btns = [...document.querySelectorAll('#v-quiz button[data-o]')];
                if (!btns.length) return false;
                if (isMulti(q)) {
                    const want = allCorrect ? correctSet(q) : [+btns[0].dataset.o];
                    for (const i of want) { const b = document.querySelector(`#v-quiz button[data-o="${i}"]`); if (b) b.click(); }
                    const chk = document.getElementById('btnCheck'); if (!chk) return false;
                    chk.click();
                } else if (allCorrect) {
                    const c = q.options.findIndex(o => o.correct);
                    document.querySelector(`#v-quiz button[data-o="${c}"]`).click();
                } else btns[0].click();
                return true;
            };
        }""")
        started = page.evaluate("""() => {
            if (typeof startQuiz !== 'function') return 'no startQuiz';
            try { startQuiz(TOPICS[0].id); return 'ok'; } catch (e) { return String(e); }
        }""")
        check(started == 'ok', 'a quiz starts', started)
        page.wait_for_timeout(400)

        opts = page.query_selector_all('#v-quiz button[data-o]')
        check(len(opts) >= 2, f'question options render ({len(opts)} found)')
        if opts:
            page.evaluate('answerCurrent(false)')
            page.wait_for_timeout(500)
            after = page.inner_text('body')
            check('concept behind this' in after.lower() or len(after) > len(body),
                  'answering reveals the explanation')
        # A teachImg renders only inside the concept block, so answering a
        # question that carries one is the only way to see whether it displays.
        # Driving a specific question makes this assert something; counting
        # whatever happened to be on screen would pass with zero figures.
        shown = page.evaluate("""() => {
            const want = QUESTIONS.filter(q => q.teachImg);
            if (!want.length) return {none: true};
            const noTeach = want.filter(q => !q.teach).map(q => q.id);
            const missing = [], notEmbedded = [];
            for (const q of want) {
                startQuiz(q.topic);
                if (!Q) return {err: 'startQuiz left no quiz state'};
                Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
                renderQuiz();
                if (!answerCurrent(true)) { missing.push(q.id + ' (no options)'); continue; }
                const img = document.querySelector('#v-quiz img.qimg');
                if (!img) { missing.push(q.id + ' -> ' + q.teachImg); continue; }
                if (!img.getAttribute('src').startsWith('data:image/'))
                    notEmbedded.push(q.id);
            }
            return {n: want.length, noTeach, missing, notEmbedded};
        }""")
        if shown.get('none'):
            skip('concept-block figures render after answering', 'no question in this bank carries a teachImg')
        else:
            check(not shown.get('err'), 'questions carrying a figure can be reached', shown.get('err', ''))
            check(not shown.get('noTeach'),
                  'every teachImg sits on a question that has a concept block',
                  'these would never display: ' + ', '.join(shown.get('noTeach', [])))
            check(not shown.get('missing'),
                  f"all {shown.get('n')} concept-block figures render after answering",
                  'did not render: ' + ', '.join(shown.get('missing', [])[:6]))
            check(not shown.get('notEmbedded'),
                  'every rendered figure is an embedded data URL',
                  ', '.join(shown.get('notEmbedded', [])[:6]))

        # Every question, answered through the real renderer. The checks above
        # drive a handful; a fault in one question's data — an option list that
        # renders short, an explanation that throws, a citation that vanishes —
        # only shows up when that question is the one on screen.
        every = page.evaluate("""() => {
            const bad = {options: [], verdict: [], whys: [], cite: [], threw: []};
            for (const q of QUESTIONS) {
                if (q.type) continue;   // numeric and matching items have their own check
                try {
                    startQuiz(q.topic);
                    Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
                    renderQuiz();
                    const btns = document.querySelectorAll('#v-quiz button[data-o]');
                    if (btns.length !== q.options.length) {
                        bad.options.push(`${q.id} (${btns.length}/${q.options.length})`);
                        continue;
                    }
                    if (!answerCurrent(true)) { bad.verdict.push(q.id + ' (could not answer)'); continue; }
                    const panel = document.querySelector('#v-quiz .why');
                    if (!panel) { bad.verdict.push(q.id); continue; }
                    const verdict = panel.querySelector('.verdict');
                    if (!verdict || !verdict.classList.contains('ok'))
                        bad.verdict.push(q.id + ' (keyed answer not marked correct)');
                    const rows = panel.querySelectorAll('.wrow');
                    if (rows.length !== q.options.length)
                        bad.whys.push(`${q.id} (${rows.length}/${q.options.length})`);
                    if (/\b(undefined|null|NaN|\[object Object\])\b/.test(document.getElementById('v-quiz').textContent))
                        bad.whys.push(`${q.id} (undefined/null text reached the page)`);
                    const cite = panel.querySelector('.cite');
                    if (!cite || cite.textContent.trim().length < 5) bad.cite.push(q.id);
                } catch (e) {
                    bad.threw.push(`${q.id}: ${e.message}`);
                }
            }
            return bad;
        }""")
        n_q = len(page.evaluate('QUESTIONS.map(q=>q.id)'))
        check(not every['threw'], f'all {n_q} questions answer without throwing',
              ' | '.join(every['threw'][:3]))
        check(not every['options'], 'every question renders all of its options',
              ', '.join(every['options'][:5]))
        check(not every['verdict'], 'every answer produces an explanation panel',
              ', '.join(every['verdict'][:5]))
        check(not every['whys'], 'every option gets its own explanation row',
              ', '.join(every['whys'][:5]))
        check(not every['cite'], 'every question shows a citation',
              ', '.join(every['cite'][:5]))

        # The full sweep: every question once, in order, no repeats, ending on
        # its own panel. A queue that loops or stops short is invisible until
        # someone actually walks it.
        sweep = page.evaluate("""() => {
            show('topics');
            const btn = document.getElementById('sweepAll');
            if (!btn) return {err: 'no "All questions" button on the topics view'};
            btn.click();
            if (!Q || !Q.sweep) return {err: 'sweep did not start'};
            const want = Q.sweep.length;
            const seen = new Set(); let dup = 0, n = 0;
            while (Q && Q.current && n < want + 20) {
                if (seen.has(Q.current.id)) dup++;
                seen.add(Q.current.id);
                if (!answerCurrent(false)) return {err: 'no options at question ' + (n + 1)};
                const nx = document.getElementById('btnNext');
                if (!nx) return {err: 'no Next button at question ' + (n + 1)};
                nx.click(); n++;
            }
            return {want, answered: n, distinct: seen.size, dup,
                    ended: !!document.querySelector('#v-quiz .empty')};
        }""")
        check(not sweep.get('err'), 'the full sweep starts from the topics view', sweep.get('err', ''))
        if not sweep.get('err'):
            check(sweep['answered'] == sweep['want'],
                  f"the sweep serves all {sweep.get('want')} questions",
                  f"served {sweep.get('answered')}")
            check(sweep['dup'] == 0, 'the sweep repeats nothing',
                  f"{sweep.get('dup')} repeats")
            check(sweep['distinct'] == sweep['want'], 'the sweep covers every question',
                  f"{sweep.get('distinct')} of {sweep.get('want')} distinct")
            check(sweep['ended'], 'the sweep ends on its completion panel')

        # The app is opened from disk, where a browser can give the page an
        # opaque origin and make localStorage throw on the first read. That used
        # to happen while the script was still evaluating, which left a blank
        # page. Loading with storage denied proves the drill still runs.
        denied = browser.new_page(viewport={'width': 1280, 'height': 900})
        denied_errors = []
        denied.on('pageerror', lambda e: denied_errors.append(str(e)))
        denied.add_init_script("""
            const boom = () => { throw new DOMException('denied', 'SecurityError'); };
            Object.defineProperty(window, 'localStorage', {
                configurable: true,
                get: boom,
            });
        """)
        denied.goto(path.as_uri())
        denied.wait_for_timeout(1000)
        denied.evaluate("window.prompt = () => 'TestUser'")
        survived = denied.evaluate("""() => {
            try {
                if (typeof QUESTIONS === 'undefined') return {err: 'script did not finish'};
                startQuiz(TOPICS[0].id);
                const btns = document.querySelectorAll('#v-quiz button[data-o]');
                if (!btns.length) return {err: 'no options rendered'};
                const q = Q.current;
                if (isMulti(q)) { for (const i of correctSet(q)) document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); document.getElementById('btnCheck').click(); }
                else btns[0].click();
                return {ok: !!document.querySelector('#v-quiz .why')};
            } catch (e) { return {err: e.message}; }
        }""")
        check(not survived.get('err') and survived.get('ok'),
              'the drill still runs when the browser denies localStorage',
              survived.get('err', 'no explanation panel'))
        check(not denied_errors, 'no uncaught error with storage denied',
              '; '.join(denied_errors[:2]))
        denied.close()

        # The reference text is authored as HTML, so any label re-escaped for an
        # attribute or a caption can reach the reader as a literal "&mdash;".
        ref = page.evaluate("""() => {
            show('ref');
            const el = document.querySelector('#v-ref');
            const raw = t => /&[a-z]+;/i.test(t);
            return {
                figs: el.querySelectorAll('.reffig img').length,
                secs: el.querySelectorAll('h3').length,
                navs: el.querySelectorAll('.refnav a').length,
                entities: [...el.querySelectorAll('figcaption, .refnav a, h3')]
                    .map(e => e.textContent).filter(raw).slice(0, 4),
                tokens: /\\{\\{fig:/.test(el.innerHTML),
                broken: [...el.querySelectorAll('.reffig img')]
                    .filter(i => !i.getAttribute('src').startsWith('data:image/'))
                    .map(i => i.getAttribute('alt')).slice(0, 4),
            };
        }""")
        check(ref['secs'] > 0 and ref['navs'] == ref['secs'],
              f"reference has {ref['secs']} sections, each with a jump link",
              f"{ref['navs']} links for {ref['secs']} sections")
        if ref['figs']: check(True, f"reference figures render ({ref['figs']})")
        check(not ref['broken'], 'every reference figure is an embedded data URL',
              ', '.join(ref['broken']))
        check(not ref['tokens'], 'no unexpanded figure token reached the reference')
        check(not ref['entities'], 'no raw HTML entity reaches the reader',
              ' | '.join(ref['entities']))

        has_atlas = page.evaluate("() => !!(document.querySelector('#nav button[data-v=\"atlas\"]') && typeof ATLAS !== 'undefined' && ATLAS.boards && ATLAS.boards.length)")
        if has_atlas:
            # The atlas is a recall surface as well as a reference one, so the
            # names have to be hideable and the structures have to survive hiding.
            atlas = page.evaluate("""() => {
                show('atlas');
                const el = document.getElementById('v-atlas');
                const tiles = () => [...el.querySelectorAll('.attile')].filter(t => !t.hidden);
                const before = tiles().length;

                const hide = el.querySelector('#atHide');
                if (hide) hide.click();
                const hidden = el.classList.contains('namesoff');

                const reveal = el.querySelector('#atShow');
                const revealOffered = !!reveal && !reveal.classList.contains('hide');
                if (hide) hide.click();          // back to names shown

                const box = el.querySelector('#atq');
                let filtered = before;
                if (box) {
                    // search for the first word of the last tile's name: a
                    // term that matches at least one tile and, on any atlas
                    // with more than a handful of tiles, not all of them
                    const names = [...el.querySelectorAll('.attile .atname')].map(n => n.textContent.trim());
                    box.value = (names[names.length - 1] || 'a').split(/\s+/)[0].toLowerCase();
                    box.oninput();
                    filtered = tiles().length;
                    box.value = '';
                    box.oninput();
                }
                return {
                    tiles: before,
                    items: ATLAS.boards.reduce((n, b) => n + b.sections.reduce((m, s) => m + s.items.length, 0), 0),
                    svgs: el.querySelectorAll('.attile .atfig svg').length,
                    boards: el.querySelectorAll('.atboard').length,
                    boardsInData: ATLAS.boards.length,
                    hidden, filtered, restored: tiles().length, revealOffered,
                    hasSearch: !!box, hasHide: !!hide,
                };
            }""")
            check(atlas['tiles'] == atlas['items'] and atlas['tiles'] > 0,
                  f"atlas renders a tile per item ({atlas['tiles']} of {atlas['items']})")
            check(atlas['svgs'] == atlas['tiles'],
                  'every atlas tile draws a structure',
                  f"{atlas['svgs']} drawings for {atlas['tiles']} tiles")
            check(atlas['boards'] == atlas['boardsInData'],
                  f"atlas boards render ({atlas['boards']} of {atlas['boardsInData']})")
            check(atlas['hasHide'] and atlas['hidden'],
                  'hiding the names puts the atlas into recall mode')
            check(atlas['revealOffered'],
                  'recall mode offers a way to reveal every name again')
            check(atlas['hasSearch'] and 0 < atlas['filtered'] < atlas['tiles'],
                  'atlas search narrows the tiles',
                  f"{atlas['filtered']} of {atlas['tiles']} left after searching")
            check(atlas['restored'] == atlas['tiles'],
                  'clearing the search brings every tile back',
                  f"{atlas['restored']} of {atlas['tiles']}")

        # A question that asks for the name of a drawn group must not carry
        # that name anywhere a reader can reach before answering.
        drawn = page.evaluate("""() => {
            const q = QUESTIONS.filter(x => x.fg);
            const missing = q.filter(x => !FGQ[x.fg]).map(x => x.id);
            const leaks = q.filter(x => {
                const svg = FGQ[x.fg] || '';
                return svg.includes(x.fg) || /aria-label="(?!Chemical structure)/.test(svg);
            }).map(x => x.id);
            return {n: q.length, missing: missing.slice(0, 4), leaks: leaks.slice(0, 4)};
        }""")
        if drawn['n'] == 0 and not has_atlas:
            skip('drawn structures', 'no question in this bank carries a drawn structure (no atlas)')
        else:
            check(drawn['n'] > 0, f"questions carry a drawn structure ({drawn['n']})")
            check(not drawn['missing'], 'every drawn structure resolves to a group',
                  ', '.join(drawn['missing']))
            check(not drawn['leaks'], 'no drawing names the group it is asking about',
                  ', '.join(drawn['leaks']))

        shown = page.evaluate("""() => {
            const drawn = QUESTIONS.filter(q => q.fg);
            if (!drawn.length) return 'ok';
            const missing = [];
            for (const q of drawn) {
                startQuiz(q.topic);
                Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
                renderQuiz();
                const el = document.getElementById('v-quiz');
                if (!el.querySelector('.fgshow svg')) missing.push(q.id);
            }
            return missing.length
                ? `${missing.length} show no drawing: ` + missing.slice(0, 4).join(', ')
                : 'ok';
        }""")
        check(shown == 'ok',
              'every structure question shows its drawing before the answer', shown)

        # The general form of that check. A stem that says "shown", "below",
        # "drawn" or "pictured" is promising the reader something to look at.
        # Nine ring questions once shipped with that promise and an empty
        # card, because the drawing lived in a field the pre-answer render
        # never read. This walks every such stem and requires a visible
        # figure of any kind before the answer.
        promised = page.evaluate("""() => {
            const re = /\\b(shown|below|drawn|pictured|illustrated|depicted|circled|boxed)\\b/i;
            const qs = QUESTIONS.filter(q => re.test(q.stem));
            const bare = [];
            for (const q of qs) {
                startQuiz(q.topic);
                Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
                renderQuiz();
                const el = document.getElementById('v-quiz');
                const figs = el.querySelectorAll('.qbody svg, .qbody img, .fgshow svg, .qimg');
                if (!figs.length) bare.push(q.id);
            }
            return {n: qs.length, bare};
        }""")
        if promised['n'] == 0:
            skip('stems that promise a figure show one', 'no stem in this bank promises a figure')
        else:
            check(promised['n'] > 0, f"stems that promise a figure exist ({promised['n']})")
        check(not promised['bare'],
              'every stem that promises a figure shows one before the answer',
              f"{len(promised['bare'])} bare: " + ', '.join(promised['bare'][:8]))

        # Select-all items: toggles, the Check button, all-or-nothing grading in
        # the quiz, the logged picks, and the exam paper's share of them.
        sata = page.evaluate("""() => {
            const out = {};
            const qs = QUESTIONS.filter(isMulti);
            out.n = qs.length;
            if (!qs.length) return out;
            const q = qs[0];
            startQuiz(q.topic);
            Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
            renderQuiz();
            const el = document.getElementById('v-quiz');
            out.banner = !!el.querySelector('.sata');
            out.toggles = el.querySelectorAll('button.opt.multi').length === q.options.length;
            const chk = () => document.getElementById('btnCheck');
            out.checkDisabledAtStart = !!chk() && chk().disabled;
            // a partial set: toggle one correct option, check -> marked wrong
            const want = correctSet(q);
            document.querySelector(`#v-quiz button[data-o="${want[0]}"]`).click();
            out.toggledOn = !!document.querySelector(`#v-quiz button[data-o="${want[0]}"].on`);
            out.checkEnabledAfterToggle = !!chk() && !chk().disabled;
            const before = DB.answers.length;
            chk().click();
            const v1 = el.querySelector('.verdict');
            out.partialMarkedWrong = !!v1 && v1.classList.contains('bad');
            const logged = DB.answers[DB.answers.length - 1];
            out.logged = DB.answers.length === before + 1 && logged.qid === q.id && logged.result === 'wrong'
                         && Array.isArray(logged.picked) && logged.picked.length === 1 && logged.picked[0] === want[0];
            out.youSelected = el.querySelectorAll('.youpicked').length === 1;
            // the full set: every correct option and nothing else -> marked right
            startQuiz(q.topic);
            Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
            renderQuiz();
            for (const i of want) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
            chk().click();
            const v2 = el.querySelector('.verdict');
            out.fullMarkedRight = !!v2 && v2.classList.contains('ok');
            out.guessOffered = !!document.getElementById('btnGuess');
            // the full set plus one wrong option -> marked wrong
            const wrong = q.options.findIndex(o => !o.correct);
            startQuiz(q.topic);
            Q.current = q; Q.order = q.options.map((o,i)=>i); Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
            renderQuiz();
            for (const i of [...want, wrong]) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
            chk().click();
            const v3 = el.querySelector('.verdict');
            out.extraMarkedWrong = !!v3 && v3.classList.contains('bad');
            // the exam paper draws its share of select-all items and renders them with toggles
            show('exam');
            document.getElementById('startExam').click();
            out.examSata = EX.qs.filter(isMulti).length;
            // the blueprint's own select-all count governs when the course has one
            out.examTarget = (EXAM.blueprint && (EXAM.blueprint.parts || []).length)
              ? (EXAM.blueprint.sata || 0) : EXAM_SATA;
            const first = EX.qs.findIndex(isMulti);
            if (first >= 0) {
                EX.i = first; renderExamQ();
                const ex = document.getElementById('v-exam');
                out.examToggles = ex.querySelectorAll('button.opt.multi').length === EX.qs[first].options.length;
                out.examChip = !!ex.querySelector('.tag.sata');
                ex.querySelector('button.opt.multi').click();
                out.examPickIsArray = Array.isArray(EX.picks[first]) && EX.picks[first].length === 1;
            }
            clearInterval(EX.timer); EX = null;
            return out;
        }""")
        if sata['n'] == 0 and not sata.get('examTarget'):
            skip('select-all items', 'no select-all question in this bank and none on the blueprint')
        else:
            check(sata['n'] >= sata.get('examTarget', 0),
                  f"select-all questions exist ({sata['n']}, the paper draws {sata.get('examTarget', 0)})")
        if sata['n']:
            check(sata['banner'] and sata['toggles'], 'a select-all item renders its banner and toggle options')
            check(sata['checkDisabledAtStart'] and sata['checkEnabledAfterToggle'] and sata['toggledOn'],
                  'the Check button waits for a selection and toggles mark on')
            check(sata['partialMarkedWrong'], 'a partial selection is marked wrong')
            check(sata['logged'], 'the answer log stores the picked set and the verdict')
            check(sata['youSelected'], 'the review marks which options were selected')
            check(sata['fullMarkedRight'] and sata['guessOffered'], 'the complete correct set is marked right and can be flagged as a guess')
            check(sata['extraMarkedWrong'], 'the correct set plus a wrong option is marked wrong')
            check(sata['examSata'] == sata['examTarget'],
                  f"the exam paper carries {sata['examTarget']} select-all items", f"drew {sata['examSata']}")
            if sata['examTarget']:
                check(sata['examToggles'] and sata['examChip'] and sata['examPickIsArray'],
                      'exam select-all items render toggles, a chip, and store an array of picks')
            else:
                skip('exam select-all rendering', 'the blueprint puts no select-all item on the paper')

        # Weak spots after mixed results: the next-step cards and the confusion table render
        gaps = page.evaluate("""() => {
            show('gaps');
            const el = document.getElementById('v-gaps');
            return {cards: el.querySelectorAll('.nextcard').length, pools: EXAM.pools.length,
                    table: !!el.querySelector('table'),
                    text: el.innerText.length};
        }""")
        check(gaps['cards'] == gaps['pools'], f"weak spots shows a next-step card per pool ({gaps['cards']} of {gaps['pools']})")
        check(gaps['table'] and gaps['text'] > 200, 'weak spots renders its tables')

        # typed items: a numeric answer graded and its steps shown; a matching table graded per pair
        typed = page.evaluate("""() => {
            const out = {};
            const nq = QUESTIONS.find(q => q.type === 'numeric');
            if (nq) {
                startQuiz(nq.topic);
                Q.current = nq; Q.order = []; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now(); Q.rights = null;
                renderQuiz();
                const inp = document.getElementById('numIn');
                out.numInput = !!inp;
                if (inp) { inp.value = String(nq.answer); document.getElementById('btnCheck').click(); }
                const v = document.querySelector('#v-quiz .verdict');
                out.numRight = !!(v && v.classList.contains('ok'));
                out.numSteps = document.querySelectorAll('#v-quiz .steps li').length;
                // a wrong answer offers the kind-of-miss buttons
                Q.current = nq; Q.order = []; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
                renderQuiz();
                const inp2 = document.getElementById('numIn'); inp2.value = String(nq.answer + 1000); document.getElementById('btnCheck').click();
                out.missButtons = document.querySelectorAll('#v-quiz [data-miss]').length;
                const mb = document.querySelector('#v-quiz [data-miss]'); if (mb) mb.click();
                out.missLogged = DB.answers[DB.answers.length-1].miss || null;
            }
            const mq = QUESTIONS.find(q => q.type === 'match');
            if (mq) {
                startQuiz(mq.topic);
                Q.current = mq; Q.order = []; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now(); Q.rights = null;
                renderQuiz();
                const sels = [...document.querySelectorAll('#v-quiz select[data-row]')];
                out.matchRows = sels.length;
                sels.forEach((s, i) => { s.value = String(i); s.dispatchEvent(new Event('change')); });
                const bc = document.getElementById('btnCheck'); out.matchEnabled = bc && !bc.disabled;
                if (bc) bc.click();
                const v = document.querySelector('#v-quiz .verdict');
                out.matchRight = !!(v && v.classList.contains('ok'));
                out.pairOk = (DB.answers[DB.answers.length-1].pairOk || []).every(Boolean);
            }
            return out;
        }""")
        if 'numInput' in typed:
            check(typed['numInput'] and typed['numRight'] and typed['numSteps'] >= 2, f"numeric item grades the answer and shows its steps ({typed.get('numSteps')} steps)")
            check(typed['missButtons'] == 4 and typed['missLogged'], 'a wrong numeric answer logs the kind of miss')
        if 'matchRows' in typed:
            check(typed['matchRows'] >= 3 and typed['matchEnabled'] and typed['matchRight'] and typed['pairOk'], f"matching item grades every pair ({typed.get('matchRows')} rows)")

        # the exam paper survives a reload and can be submitted in part
        ex = page.evaluate("""() => {
            beginExam();
            const q0 = EX.qs[0]; EX.picks[0] = isMulti(q0) ? correctSet(q0) : q0.options.findIndex(o=>o.correct);
            saveExam();
            const saved = LS.get(NS + ':exam:' + PROFILE);
            EX = null;
            const back = restoreExam();
            const same = back && EX && EX.qs.length === EXAM.questions && (Array.isArray(EX.picks[0]) ? EX.picks[0].length > 0 : EX.picks[0] !== null);
            const before = DB.answers.length;
            finishExam(true);
            const logged = DB.answers.length - before;
            return {saved: !!saved, same, logged, cleared: !LS.get(NS + ':exam:' + PROFILE)};
        }""")
        check(ex['saved'] and ex['same'], 'an exam paper in progress is saved and restored')
        check(ex['logged'] == 1 and ex['cleared'], f"submitting a partial paper logs only the answered items ({ex['logged']} logged)")

        # ---- What's new card and the change log ----------------------------
        news = page.evaluate("""() => {
            const log = BUILD.changelog || [];
            if (!log.length) return {none: true};
            LS.set(NS + ':newsSeen', '');
            show('topics');
            const card = document.getElementById('news');
            const out = {items: card ? card.querySelectorAll('li').length : 0, card: !!card};
            if (card) { document.getElementById('newsok').click();
                        out.dismissed = !document.getElementById('news');
                        out.remembered = LS.get(NS + ':newsSeen') === log[0].date + '|' + log[0].items.join('').length; }
            show('settings');
            out.inSettings = !!document.getElementById('changelog');
            show('topics');
            out.staysDismissed = !document.getElementById('news');
            return out;
        }""")
        if news.get('none'):
            skip("What's new card", 'the build carries no change log')
        else:
            check(news['card'] and news['items'] > 0, f"What's new card shows the newest entries ({news.get('items')} bullets)")
            check(news.get('dismissed') and news.get('remembered'), '"Got it" dismisses the card and remembers the entry')
            check(news.get('staysDismissed'), 'the card stays dismissed on the next visit to Topics')
            check(news.get('inSettings'), 'Settings lists the whole change log')

        # ---- session progress and the review plan --------------------------
        sess = page.evaluate("""() => {
            // answer a handful through the real UI, getting one wrong on purpose
            startQuiz(TOPICS[0].id);
            const out = {};
            for (let i = 0; i < 4; i++) {
                if (!Q || !Q.current) break;
                answerCurrent(i !== 1);
                // read the session line while a question is still on screen: a
                // short topic can run out before the loop does
                if (!out.strip) out.strip = (document.getElementById('sess') || {}).textContent || '';
                const nx = document.getElementById('btnNext'); if (nx) nx.click();
            }
            out.logged = sessionLog().length;
            show('gaps');
            const el = document.getElementById('v-gaps');
            out.sessionCard = !!el.querySelector('.sdots10');
            out.dots = el.querySelectorAll('.sdots10 i').length;
            out.plan = el.querySelectorAll('.panel.plan').length;
            out.planText = el.innerText.includes('What to review next');
            const drill = el.querySelector('[data-area]');
            out.drills = !!drill;
            if (drill) { drill.click(); out.drilled = !!(Q && Q.current); show('gaps'); }
            return out;
        }""")
        check(sess['logged'] >= 2, f"answers land in this session ({sess['logged']} logged)")
        check('This session' in sess['strip'], 'the quiz carries a session line', sess['strip'][:60])
        check(sess['sessionCard'] and sess['dots'] >= 2, f"Weak spots shows this session's dots ({sess['dots']})")
        check(sess['planText'], 'Weak spots shows the review plan')
        check(sess['plan'] >= 1, f"the plan groups what is not solid ({sess['plan']} section(s))")
        check(sess.get('drills') and sess.get('drilled'), 'a plan section drills its own questions')

        # ---- Explain more links, and the way back -------------------------
        links = page.evaluate("""() => {
            const q = QUESTIONS.find(x => linksFor(x).length);
            if (!q) return {none: true};
            startQuiz(q.topic);
            Q.current = q; Q.order = (q.options || []).map((o, i) => i); Q.picked = null; Q.revealed = false;
            renderQuiz(); answerCurrent(true);
            const chip = document.querySelector('#v-quiz [data-jump]');
            const out = {chip: !!chip};
            if (chip) {
                const [v, a] = chip.dataset.jump.split(':');
                chip.click();
                out.view = VIEW; out.want = v;
                out.target = !!document.getElementById(a);
                const back = document.getElementById('backbtn');
                out.back = !!back;
                if (back) { back.click(); out.returned = VIEW; }
            }
            return out;
        }""")
        if links.get('none'):
            skip('Explain more links', 'no question in this bank resolves to a reading section')
        else:
            check(links['chip'], 'an answered question offers its reading sections')
            check(links.get('view') == links.get('want'), f"the chip opens that tab ({links.get('view')})")
            check(links.get('target'), 'the section it names exists in that tab')
            check(links.get('back') and links.get('returned') == 'quiz', 'the floating button comes back to the question')

        # ---- Explain-one cards in a table ---------------------------------
        xp = page.evaluate("""() => {
            show('ref');
            const btn = document.querySelector('#v-ref [data-xpick]');
            if (!btn) return {none: true};
            const [g] = btn.dataset.xpick.split(':');
            btn.click();
            const out = {filled: (document.querySelector(`[data-xout="${g}"]`) || {}).innerHTML.length > 20};
            const sel = document.querySelector(`select[data-xsel="${g}"]`);
            if (sel && sel.options.length > 2) {
                sel.value = sel.options[2].value; sel.dispatchEvent(new Event('change'));
                out.viaSelect = (document.querySelector(`[data-xout="${g}"]`) || {}).innerHTML.length > 20;
            }
            const go = document.querySelector(`[data-xout="${g}"] [data-xgo]`);
            if (go) { go.click(); out.xback = !!document.getElementById('xback'); }
            return out;
        }""")
        if xp.get('none'):
            skip('Explain-one cards', 'no table in this bank carries one')
        else:
            check(xp['filled'], 'a Why? button fills the explanation card')
            check(xp.get('viaSelect', True), 'the Explain-one select fills it too')
            check(xp.get('xback', True), 'following a card to its figure offers a way back')

        # ---- step-through figures -----------------------------------------
        st = page.evaluate("""() => {
            const keys = (typeof DIA === 'undefined' ? [] : Object.keys(DIA).filter(k => /data-anim/.test(DIA[k])));
            if (!keys.length) return {none: true};
            show('diagrams');
            const fig = document.querySelector('#v-diagrams .fig');
            if (!fig) return {err: 'no figure rendered in the Diagrams tab'};
            const steps = fig.querySelectorAll('.st').length;
            const shown = () => [...fig.querySelectorAll('.st')].findIndex(s => s.classList.contains('on'));
            const first = shown();
            fig.querySelector('[data-go="1"]').click();
            const after = shown();
            fig.querySelector('[data-go="dot"][data-i="0"]').click();
            return {keys: keys.length, steps, first, after, back: shown(),
                    dots: fig.querySelectorAll('.sdot').length,
                    chips: document.querySelectorAll('#v-diagrams [data-dg]').length};
        }""")
        if st.get('none'):
            skip('step-through figures', 'no figure in DIA carries step controls')
        else:
            check(not st.get('err'), 'the Diagrams tab renders its figures', st.get('err', ''))
            check(st.get('steps', 0) >= 2, f"a step-through has its steps ({st.get('steps')})")
            check(st.get('first') == 0 and st.get('after') == 1, 'Next moves one step on')
            check(st.get('back') == 0, 'a step dot jumps back to that step')
            check(st.get('dots') == st.get('steps'), 'one dot per step')
            check(st.get('chips', 0) > 0, 'the contents chips list the figures')

        # ---- figure labels stay inside their figure ------------------------
        # A label that overflows the SVG box is invisible on a phone and cut off
        # on a desktop, and nothing else in the suite notices.
        overflow = page.evaluate("""() => {
            const bad = [];
            const keys = (typeof DIA === 'undefined' ? [] : Object.keys(DIA));
            const host = document.getElementById('v-topics');
            const old = host.innerHTML;
            for (const k of keys) {
                host.innerHTML = '<div style="max-width:620px">' + DIA[k] + '</div>';
                const svg = host.querySelector('svg'); if (!svg) continue;
                const steps = [...host.querySelectorAll('.st')];
                const groups = steps.length ? steps : [svg];
                groups.forEach((g, gi) => {
                    steps.forEach((s, j) => s.classList.toggle('on', j === gi));
                    const box = svg.getBoundingClientRect();
                    g.querySelectorAll('text').forEach(t => {
                        const r = t.getBoundingClientRect();
                        if (!r.width) return;
                        if (r.left < box.left - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1 || r.top < box.top - 1)
                            bad.push(k + (steps.length ? ' step ' + (gi + 1) : '') + ': "' + t.textContent.slice(0, 24) + '"');
                    });
                });
            }
            host.innerHTML = old;
            return [...new Set(bad)];
        }""")
        if not page.evaluate("() => typeof DIA !== 'undefined' && Object.keys(DIA).length"):
            skip('figure labels inside the box', 'no drawn figures in this bank')
        else:
            check(not overflow, 'every figure label sits inside its figure', ', '.join(overflow[:5]))

        # every view renders without throwing
        for view in ['topics', 'quiz', 'gaps', 'exam'] + (['atlas'] if has_atlas else []) + (['diagrams'] if page.evaluate("() => !!document.querySelector('#nav button[data-v=\"diagrams\"]')") else []) + ['guide', 'tell', 'ref', 'settings']:
            r = page.evaluate(f"""() => {{
                try {{ if (typeof show === 'function') {{ show('{view}'); return 'ok'; }}
                      return 'no show()'; }} catch (e) {{ return String(e); }} }}""")
            page.wait_for_timeout(150)
            check(r == 'ok', f"view '{view}' renders", r)

        check(not errors, 'no uncaught error after interaction', '; '.join(errors[:2]))

        page.screenshot(path='/tmp/drill_screenshot.png', full_page=False)

        # ---- every tab, on a phone and on a desktop, light and dark --------
        # Three faults live only here: a page that scrolls sideways on a phone,
        # a value that renders as "undefined" or "NaN" in one view only, and a
        # colour that is only defined for one theme.
        tabs = page.evaluate("() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v)")
        for w, label in ((375, 'phone'), (1100, 'desktop')):
            for scheme in ('light', 'dark'):
                p2 = browser.new_page(viewport={'width': w, 'height': 820}, color_scheme=scheme)
                errs2 = []
                p2.on('pageerror', lambda e: errs2.append(str(e)))
                p2.add_init_script("window.prompt = () => 'TestUser'")
                p2.goto(path.as_uri())
                p2.wait_for_timeout(700)
                worst, wide = [], []
                for v in tabs:
                    p2.evaluate(f"() => show('{v}')")
                    p2.wait_for_timeout(180)
                    over = p2.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
                    if over > 2:
                        wide.append(f'{v} by {over}px')
                    txt = p2.inner_text('body')
                    for token in ('undefined', 'NaN', '[object Object]'):
                        if token in txt:
                            worst.append(f'{v}: {token}')
                check(not wide, f'no sideways scroll on {label} ({scheme})', ', '.join(wide))
                check(not worst, f'no undefined or NaN on screen on {label} ({scheme})', ', '.join(worst[:4]))
                check(not errs2, f'no page error on {label} ({scheme})', '; '.join(errs2[:2]))
                p2.close()

        browser.close()

    print()
    if skipped:
        print(f'{len(skipped)} check(s) skipped on this bank: ' + '; '.join(skipped))
    if fails:
        print(f'{len(fails)} browser check(s) failed')
        sys.exit(1)
    print('Browser smoke test passed' + (' (with skips)' if skipped else ''))


if __name__ == '__main__':
    main()
