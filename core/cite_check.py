#!/usr/bin/env python3
"""Check every slide number cited anywhere in the bank against the real deck.

A citation drifts silently: the text stays plausible and only the number is
wrong, so reading does not catch it. This reads the page count of each deck on
hand and reports any cited slide that falls outside it, plus any deck named in a
citation that is not on hand to check.

Citations are scanned in `cite`, `teach`, `note` and every option's `why`, since
slide numbers appear in all four.

    python3 cite_check.py

Decks are looked for under decks/ and the working directory. A citation spells
a deck the way `course.js` does (dots in the file stem written as underscores),
and that spelling is resolved against the files on disk automatically; the
course's own tables in course.js `tools` (see COURSE TABLES below) cover any
other spelling a citation uses.

    python3 cite_check.py --tables   print the tables read from course.js and stop
"""
import glob, json, os, re, subprocess, sys

# Exit codes as every check uses them (check_lib.js): 0 pass, 1 fail, 2 NOT RUN.
# A check that cannot run says why and exits 2, so it is never read as a pass.
def not_run(why):
    print(f"NOT RUN: cite_check.py: {why}")
    sys.exit(2)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None       # main() says NOT RUN; --tables still works

DECK_DIRS = ["decks", "."]

# --------------------------------------------------------------------------
# COURSE TABLES (usually empty): spellings that cannot be derived. They belong
# to the course and live in its course.js `tools`, which a core update never
# replaces (a core update copies this file over the course's own), so this
# file holds no course data. Each field is optional:
#
#   citeAliases   how a citation spells a deck (lower case) -> the file on
#                 disk, or null when the deck is not a PDF on hand (its slide
#                 numbers are then reported unchecked)
#   citeLectures  lecture number -> file, for citations that say "Lecture #11"
#                 instead of a file name. Filled from course.js `lectures` (the
#                 digits of each lecture id); add here only when a citation
#                 numbers a lecture differently.
#   citeBareMap   a deck named in words inside a citation ("... slides 13;
#                 Absorption I slide 24") -> its file, or null, so the slide
#                 number is not attributed to the previous deck
# --------------------------------------------------------------------------
TABLES = ("citeAliases", "citeLectures", "citeBareMap")

# The built page is located by built_page.js, the helper every check uses.
HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

PDF_IN_TEXT = re.compile(r"([A-Za-z0-9_.\-]+\.pdf)", re.I)
LECTURE_IN_TEXT = re.compile(r"[Ll]ecture\s*#\s*(\d+)")
# "slide 34", "slides 29-30", "slides 46, 50, 56", "slides 42 to 62"
SLIDES = re.compile(r"slides?\s+((?:\d+\s*(?:[-–]|,|and|to)?\s*)+)", re.I)


def course_tables():
    """course.js `tools`: this check's tables, from course.js evaluated by node
    the way build.py reads it. A field the course leaves out is empty."""
    tools = {}
    if os.path.exists("course.js"):
        js = ("const fs=require('fs');"
              "const C=new Function(fs.readFileSync('course.js','utf8')+';return COURSE;')();"
              "process.stdout.write(JSON.stringify(C.tools===undefined?{}:C.tools))")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True)
        if r.returncode != 0:
            print("ERROR: course.js could not be evaluated\n" + (r.stderr or r.stdout).strip())
            print("FAIL: cite_check.py: course.js could not be evaluated")
            sys.exit(1)
        tools = json.loads(r.stdout)
    if not isinstance(tools, dict):
        print("FAIL: cite_check.py: course.js `tools` must be an object")
        sys.exit(1)
    out = {}
    for name in TABLES:
        t = tools.get(name)
        t = {} if t is None else t
        if not isinstance(t, dict) or not all(v is None or isinstance(v, str) for v in t.values()):
            print(f"FAIL: cite_check.py: course.js `tools.{name}` must be an object of file names (or null)")
            sys.exit(1)
        out[name] = t
    return out


def course_lectures():
    """lecture number -> deck file, read off course.js: {id:'L07', deck:'Lecture07.pdf', ...}."""
    out = {}
    if not os.path.exists("course.js"):
        return out
    src = open("course.js", encoding="utf-8").read()
    for m in re.finditer(r"\{\s*id:\s*'([^']+)'\s*,\s*deck:\s*'([^']+)'", src):
        num = re.fullmatch(r"L?(\d+)", m.group(1))      # L07 or 7; other ids are not lecture numbers
        if num:
            out[str(int(num.group(1)))] = m.group(2)
    return out


def page_counts():
    counts = {}
    for d in DECK_DIRS:
        for f in glob.glob(os.path.join(d, "*.pdf")):
            name = os.path.basename(f)
            if name in counts:
                continue
            try:
                with pdfplumber.open(f) as doc:
                    counts[name] = len(doc.pages)
            except Exception:
                pass
    return counts


def load_questions():
    """Read the bank out of the built page, the same way the node checks do."""
    js = r"""
      const vm=require('vm');
      const PAGE=require(process.argv[1]);
      let c=PAGE.engine();
      c+='\nglobalThis.__Q=QUESTIONS;';
      const sb={console,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
        document:{querySelector:()=>({}),querySelectorAll:()=>[],getElementById:()=>({}),
                  createElement:()=>({}),body:{},addEventListener(){}},window:{},prompt:()=>'x',
        setTimeout:()=>0,clearTimeout(){},Date,Math,JSON,Object,Array,String,Number,
        Boolean,RegExp,Error,isNaN,parseInt,parseFloat};
      sb.globalThis=sb;vm.createContext(sb);vm.runInContext(c,sb);
      const tt=t=>Array.isArray(t)?t.map(p=>[p.h,p.t].filter(Boolean).join('. ')).join(' '):(t||'');
      process.stdout.write(JSON.stringify(sb.__Q.map(q=>({
        id:q.id, cite:q.cite||'', teach:tt(q.teach), note:q.note||'',
        whys:(q.options||[]).map(o=>o.why||'').concat((q.steps||[]).map(s=>s.why||''),(q.pairs||[]).map(p=>p.why||''))}))));
    """
    js = "require(process.argv[1]).need('cite_check.py');" + js
    out = subprocess.run(["node", "-e", js, os.path.join(HERE, "built_page.js")],
                         capture_output=True, text=True)
    if out.returncode == 2:
        print(out.stdout.strip())
        sys.exit(2)
    if out.returncode != 0:
        print("ERROR: could not read the built page\n" + out.stderr.strip())
        print("FAIL: cite_check.py: the built page could not be read")
        sys.exit(1)
    return json.loads(out.stdout)


def make_resolver(counts, aliases):
    """A deck as written in a citation -> the file on disk, or None.

    The derived spellings: the file name itself, and the file stem with its
    dots written as underscores (how course.js and the citations spell it)."""
    derived = {}
    for name in counts:
        stem, ext = os.path.splitext(name)
        derived[name.lower()] = name
        derived[(stem.replace(".", "_") + ext).lower()] = name

    def resolve(name):
        key = name.lower()
        if key in aliases:
            return aliases[key]
        return derived.get(key, name)
    return resolve


def main():
    if pdfplumber is None:
        not_run("pdfplumber is not installed, so no deck can be read")
    tables = course_tables()
    aliases, extra_lectures, bare_map = (tables[k] for k in TABLES)
    bare_deck = re.compile(r"\b(" + "|".join(re.escape(k) for k in bare_map) + r")\b") if bare_map else None
    counts = page_counts()
    qs = load_questions()
    resolve = make_resolver(counts, aliases)
    lectures = dict(course_lectures())
    lectures.update(extra_lectures)

    bad, unchecked, checked = [], {}, 0
    for q in qs:
        for field, text in [("cite", q["cite"]), ("teach", q["teach"]),
                            ("note", q["note"])] + \
                           [(f"why {i}", w) for i, w in enumerate(q["whys"])]:
            if not text:
                continue
            # walk the text, remembering the most recent deck named before each
            # slide reference, since one citation can name two decks
            marks = []
            for m in PDF_IN_TEXT.finditer(text):
                marks.append((m.start(), resolve(m.group(1)), m.group(1)))
            for m in LECTURE_IN_TEXT.finditer(text):
                marks.append((m.start(), lectures.get(m.group(1)), "Lecture #" + m.group(1)))
            if bare_deck:
                for m in bare_deck.finditer(text):
                    marks.append((m.start(), bare_map.get(m.group(1)), m.group(1)))
            marks.sort()
            for sm in SLIDES.finditer(text):
                prior = [x for x in marks if x[0] < sm.start()]
                if not prior:
                    continue
                _, fname, shown = prior[-1]
                nums = [int(n) for n in re.findall(r"\d+", sm.group(1))]
                if fname is None or fname not in counts:
                    unchecked.setdefault(shown, 0)
                    unchecked[shown] += 1
                    continue
                n = counts[fname]
                checked += len(nums)
                over = [x for x in nums if x < 1 or x > n]
                if over:
                    bad.append((q["id"], field, shown, fname, n, over))

    print("\n=== Citation check ===")
    if not counts:
        print("  The decks are the course's own files and are not in the repository,")
        print("  so this check only means something where they are present.")
        not_run("no lecture PDFs found under decks/ or src/")
    print(f"  {checked} slide references checked against {len(counts)} decks on hand")
    if unchecked:
        print("\n  decks named but not on hand (references not checked):")
        for k, v in sorted(unchecked.items(), key=lambda kv: -kv[1]):
            print(f"    {v:>4}  {k}")
    if bad:
        print(f"\n  {len(bad)} citation(s) point past the end of their deck:")
        for qid, field, shown, fname, n, over in bad:
            print(f"    {qid:10s} {field:8s} {shown} has {n} slides, cites {over}")
    elif checked:
        print("\n  every checked slide number exists in its deck")
    else:
        not_run("decks were found but no citation matched one of them")
    if bad:
        print(f"FAIL: cite_check.py: {len(bad)} citation(s) point past the end of their deck")
        return 1
    print(f"PASS: cite_check.py: {checked} slide references checked against {len(counts)} decks"
          + (f"; {sum(unchecked.values())} in decks not on hand were not checked" if unchecked else ""))
    return 0


if __name__ == "__main__":
    if "--tables" in sys.argv[1:]:
        print(json.dumps(course_tables(), ensure_ascii=False))
        sys.exit(0)
    sys.exit(main())
