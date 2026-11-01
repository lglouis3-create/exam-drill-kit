#!/usr/bin/env python3
"""Ingest one lecture: deck (+ transcript) -> everything a question-writing
session needs, with the citations already in place.

    python3 ingest.py --deck Lecture16.pdf --lecture L16 \
        --label "Lecture 16: title (09/22)" --prof Professor \
        [--transcript "Course - 09_22.txt"] [--out ingest/L16] [--render]

    # when only the slide TEXT is available (a scheduled session reading the
    # Claude Project, which returns text for a PDF, not the file):
    python3 ingest.py --slides-text L16_slides.txt --lecture L16 --label ... --prof ...

Writes into --out (default ingest/<lecture>/):
  <lecture>_slides.txt        printed text per slide, "===== L16 SLIDE 12 =====" delimiters
  picture_slides.txt          slides with little or no text: candidates for a crop
  harvest_<lecture>.py        a harvest spec skeleton, one line per picture slide
  transcript_cues.md          lines from the transcript that carry exam emphasis,
                              polls, numbers or definitions, with context
  corpus_additions.md         poll / Q: / TRUE-FALSE slides verbatim, for STYLE.md
  q_<lecture>_skeleton.js     one question skeleton per content slide, cite filled
  pages/                      (--render) one PNG per slide for reading pictures

Nothing here decides what a question says; it puts the slide, its number and
its text in front of the writer so no number is written without a location.
"""
import argparse, os, re, sys, json, subprocess

CUE = re.compile(r"\b(exam|test|quiz|poll|question|true or false|wrong|except|remember|memori[sz]e|know this|need to know|"
                 r"important|take[- ]home|will ask|i(?:'ll| will) ask|bank it|write this down|pay attention|"
                 r"\d+(?:\.\d+)?\s?%|percent|per cent|one third|half|majority|most|least|only|never|always)\b", re.I)
POLL = re.compile(r"^(pollev|poll|q[:.]|question|true\s*/?\s*false|t/f)", re.I)


def slide_texts_from_pdf(path):
    import pdfplumber
    doc = pdfplumber.open(path)
    return [(pg.extract_text() or '').strip() for pg in doc.pages]


def slide_texts_from_dump(path):
    txt = open(path, encoding='utf-8').read()
    parts = re.split(r"===== \S+ SLIDE (\d+) =====", txt)
    out = {}
    for i in range(1, len(parts), 2):
        out[int(parts[i])] = parts[i + 1].strip()
    n = max(out) if out else 0
    return [out.get(k, '') for k in range(1, n + 1)]


def deck_token(deck):
    """The deck name as citations spell it: dots in the stem become underscores."""
    base = os.path.basename(deck)
    stem, ext = os.path.splitext(base)
    return stem.replace('.', '_').replace(' ', '_') + ext


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--deck'); ap.add_argument('--slides-text')
    ap.add_argument('--transcript')
    ap.add_argument('--lecture', required=True, help='short id, e.g. L16')
    ap.add_argument('--label', required=True, help='e.g. "Lecture 16: drug design (09/22)"')
    ap.add_argument('--prof', required=True)
    ap.add_argument('--number', help='lecture number for the cite, e.g. 16 (default: digits in --lecture)')
    ap.add_argument('--out'); ap.add_argument('--render', action='store_true')
    a = ap.parse_args()
    if not a.deck and not a.slides_text:
        sys.exit('give --deck (a PDF) or --slides-text (a slide dump)')
    out = a.out or os.path.join('ingest', a.lecture)
    os.makedirs(out, exist_ok=True)
    num = a.number or re.sub(r'\D', '', a.lecture) or '?'
    deck_name = deck_token(a.deck) if a.deck else f'{a.lecture}.pdf'
    slides = slide_texts_from_pdf(a.deck) if a.deck else slide_texts_from_dump(a.slides_text)

    # 1. slide dump
    dump = os.path.join(out, f'{a.lecture}_slides.txt')
    with open(dump, 'w', encoding='utf-8') as fh:
        for n, t in enumerate(slides, 1):
            fh.write(f'===== {a.lecture} SLIDE {n} =====\n{t}\n\n')

    # 2. picture slides = little text beyond a title and the footer
    pics = []
    for n, t in enumerate(slides, 1):
        body = [ln for ln in t.splitlines() if not re.search(r'©|UIW-fsop|^\d+$', ln)]
        words = sum(len(ln.split()) for ln in body[1:])
        if words <= 12:
            pics.append((n, body[0] if body else ''))
    with open(os.path.join(out, 'picture_slides.txt'), 'w', encoding='utf-8') as fh:
        fh.write('# slides with little printed text: render and read them; crop what a question needs\n')
        for n, title in pics:
            fh.write(f'{n}\t{title}\n')

    # 3. harvest spec skeleton
    with open(os.path.join(out, f'harvest_{a.lecture}.py'), 'w', encoding='utf-8') as fh:
        fh.write('#!/usr/bin/env python3\n"""Crop spec for %s. Keep only the rows a question will use; give each a key.\n\n'
                 '    python3 harvest_%s.py\n"""\nimport json, os\nimport harvest\n\nSPEC = [\n' % (a.label, a.lecture))
        fh.write('  # key                    pdf                          slide  mode           for\n')
        for n, title in pics:
            key = re.sub(r'[^a-z0-9]+', '_', (a.lecture + '_' + title).lower()).strip('_')[:28] or f'{a.lecture.lower()}_s{n}'
            fh.write(f'  ("{key}", "{os.path.basename(a.deck) if a.deck else deck_name}", {n}, "below_title", "TODO q id"),  # {title}\n')
        fh.write(']\nharvest.MAX_W = 980\nharvest.QUALITY = 70\n\ndef main():\n    images = json.load(open("images.json"))\n'
                 '    for key, pdf, n, mode, used in SPEC:\n        workdir = "work_" + os.path.basename(pdf).replace(".pdf", "").replace(".", "_")\n'
                 '        pages = harvest.render(pdf, workdir)\n        import pdfplumber\n        doc = pdfplumber.open(pdf)\n'
                 '        crop, note = harvest.detect(doc.pages[n-1], pages[n-1], mode, harvest.deck_footer_top(doc))\n'
                 '        if crop is None: raise SystemExit(f"ERROR: {key} (slide {n}) -> {note}")\n'
                 '        url, size, nbytes = harvest.encode(crop)\n        images[key] = url\n'
                 '        print(f"  {key:24s} slide {n:2d}  {size[0]}x{size[1]}  {nbytes//1024} KB  -> {used}")\n'
                 '    json.dump(images, open("images.json", "w"))\n\nif __name__ == "__main__":\n    main()\n')

    # 4. corpus additions: poll / Q: / TRUE-FALSE slides verbatim
    with open(os.path.join(out, 'corpus_additions.md'), 'w', encoding='utf-8') as fh:
        fh.write(f'# {a.label} — polls and questions printed on the slides (verbatim)\n\n')
        for n, t in enumerate(slides, 1):
            first = (t.splitlines() or [''])[0]
            if POLL.search(first) or re.search(r'TRUE/FALSE|Select TWO|EXCEPT|answer statement is WRONG', t):
                fh.write(f'## Slide {n}\n\n```\n{t}\n```\n\n')

    # 5. transcript cues
    if a.transcript:
        tx = open(a.transcript, encoding='utf-8', errors='replace').read()
        sents = re.split(r'(?<=[.?!])\s+', tx)
        with open(os.path.join(out, 'transcript_cues.md'), 'w', encoding='utf-8') as fh:
            fh.write(f'# {a.label} — transcript lines carrying exam emphasis, polls, numbers or definitions\n\n'
                     'Auto-captions garble names and numbers: quote only what is clear, and mark it (T).\n\n')
            for i, s in enumerate(sents):
                if CUE.search(s) and len(s.split()) >= 5:
                    ctx = ' '.join(sents[max(0, i - 1):i + 2])
                    fh.write(f'- {ctx.strip()}\n')

    # 6. question skeletons, one per content slide
    with open(os.path.join(out, f'q_{a.lecture}_skeleton.js'), 'w', encoding='utf-8') as fh:
        fh.write(f'/* {a.label} — skeletons. One per content slide; delete the ones that carry no testable point,\n'
                 f'   split the ones that carry several. Fill stem, options, why, teach, skill; keep the cite. */\n'
                 'QUESTIONS.push(\n')
        first = True
        for n, t in enumerate(slides, 1):
            body = [ln for ln in t.splitlines() if not re.search(r'©|UIW-fsop|^\d+$', ln)]
            if len(body) < 2 and (n, body[0] if body else '') not in pics:
                continue
            title = body[0] if body else f'slide {n}'
            comment = ' | '.join(body[1:])[:300].replace('*/', '* /')
            fh.write(('' if first else ',\n') +
                     f"/* slide {n}: {title} :: {comment} */\n"
                     f"{{id:'{a.lecture.lower()}-s{n}', prof:'{a.prof}', tier:'new', topic:'TODO', sub:'TODO', concept:'TODO',\n"
                     f" tags:[], skill:'TODO', source:'slide',\n"
                     f" stem:'TODO',\n options:[\n  {{t:'TODO', correct:true, why:'TODO'}},\n  {{t:'TODO', correct:false, why:'TODO'}},\n"
                     f"  {{t:'TODO', correct:false, why:'TODO'}},\n  {{t:'TODO', correct:false, why:'TODO'}}],\n"
                     f" teach:'TODO',\n cite:'Lecture #{num} ({deck_name}) slide {n}'}}")
            first = False
        fh.write('\n);\n')

    # 7. page renders
    if a.render and a.deck:
        pdir = os.path.join(out, 'pages'); os.makedirs(pdir, exist_ok=True)
        subprocess.run(['pdftoppm', '-r', '80', '-png', a.deck, os.path.join(pdir, 'p')], check=False)

    print(f'{a.lecture}: {len(slides)} slides, {len(pics)} picture slides, outputs in {out}/')
    print('next: read picture_slides.txt and the renders; add polls from corpus_additions.md to STYLE.md;')
    print('      write the questions into q_%s_skeleton.js (rename to q<N>_<topic>.js, add it to course.js files)' % a.lecture)


if __name__ == '__main__':
    main()
