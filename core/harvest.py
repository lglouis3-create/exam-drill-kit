#!/usr/bin/env python3
"""Harvest slide figures from a lecture PDF.

The figure on a slide is whatever ink is left once the title, the bullet text and
the footer are removed. Body text is separated from figure labels by type size,
which pdfplumber reports per character, so the split does not depend on where the
figure sits: it works when the figure is below the bullets, beside them, or when
the slide is a full-width table whose cells are set small.

Nothing here crops to a fixed fraction of the page, so wide reaction schemes and
full-width tables keep their edges.

    python3 harvest.py deck.pdf workdir                    # survey every page
    python3 harvest.py deck.pdf workdir spec.json out.json # encode to base64

Survey mode writes workdir/slide-NN.png and reports which pages carry a figure.
Encode mode reads {key: {slide: N, mode: "auto"|"below_title"}} and writes the
base64 JPEGs keyed for images.json.
"""
import base64, io, json, os, subprocess, sys

import numpy as np
import pdfplumber
from PIL import Image
from scipy import ndimage

RENDER_DPI = 200      # raster resolution the crops are taken from
BODY_PT = 19.0        # a character at least this tall is title/bullet text
                      # measured on this deck: titles 36-80pt, bullets 20-32pt,
                      # table cells and figure labels 8-18pt, footer 10pt
MAX_W = 820           # output width cap, per the brief
QUALITY = 66          # JPEG quality, per the brief
WHITE = 246           # pixels at or above this grey count as background
PAD = 14              # padding kept around a detected box, in raster px
TEXT_PAD = 5          # padding added when masking a body-text word, in raster px
MIN_H_FRAC = 0.10     # a region shorter than this fraction of the page is noise
MIN_W_FRAC = 0.10     # a region narrower than this fraction of the page is noise
MIN_BLOCK_CELLS = 12  # a surviving block smaller than this is a speck, not a figure


def render(pdf, outdir):
    """Rasterize every page once, at RENDER_DPI."""
    os.makedirs(outdir, exist_ok=True)
    have = sorted(f for f in os.listdir(outdir) if f.startswith("page-") and f.endswith(".png"))
    if not have:
        subprocess.run(["pdftoppm", "-r", str(RENDER_DPI), "-png", pdf,
                        os.path.join(outdir, "page")], check=True)
        have = sorted(f for f in os.listdir(outdir) if f.startswith("page-") and f.endswith(".png"))
    return [os.path.join(outdir, f) for f in have]


def is_footer(word, page_h):
    """The deck footers are a copyright line and a bare slide number."""
    if word["bottom"] <= page_h * 0.88:
        return False
    t = word["text"].strip()
    return ("©" in t or "UIW" in t or "fsop" in t or "f2026" in t
            or t.replace(".", "").replace("-", "").isdigit())


def classify_words(page):
    """Split the page's words into body text, small text, and footer."""
    h = page.height
    body, small, footer = [], [], []
    for w in page.extract_words(extra_attrs=["size"]) or []:
        if is_footer(w, h):
            footer.append(w)
        elif (w.get("size") or 0) >= BODY_PT:
            body.append(w)
        else:
            small.append(w)
    return body, small, footer


def title_bottom(body, page_h):
    """Bottom of the topmost contiguous run of body text (the title block)."""
    if not body:
        return 0.0
    lines = sorted(body, key=lambda w: w["top"])
    bottom = lines[0]["bottom"]
    gap_tol = page_h * 0.045
    for w in lines[1:]:
        if w["top"] - bottom > gap_tol:
            break
        bottom = max(bottom, w["bottom"])
    return bottom


def ink_mask(img):
    """Boolean mask of non-white pixels."""
    return np.asarray(img.convert("L")) < WHITE


def bbox_of(mask):
    rows = np.flatnonzero(mask.any(axis=1))
    cols = np.flatnonzero(mask.any(axis=0))
    if rows.size == 0 or cols.size == 0:
        return None
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def figure_bbox(mask):
    """Bounding box of the substantial ink in the mask.

    Masking the body text leaves behind superscripts, footnote marks and the
    footer that the slide master draws as graphics rather than text. Those are
    scattered specks; a figure or a table is a dense block. Reducing the mask to
    a coarse grid and keeping only the large connected blocks separates the two,
    so a stray e- in the middle of a bullet cannot stretch the box across the
    whole slide. Several blocks are unioned, which keeps multi-panel figures
    (two pie charts and a scheme, say) whole.
    """
    H, W = mask.shape
    cell = 16
    gh, gw = H // cell, W // cell
    if gh == 0 or gw == 0:
        return None
    grid = mask[:gh * cell, :gw * cell].reshape(gh, cell, gw, cell)
    dense = grid.sum(axis=(1, 3)) >= (cell * cell) * 0.06

    lab, n = ndimage.label(dense, structure=np.ones((3, 3), dtype=int))
    if n == 0:
        return None
    sizes = ndimage.sum(dense, lab, range(1, n + 1))
    biggest = sizes.max()
    if biggest < MIN_BLOCK_CELLS:         # nothing substantial survived
        return None

    keep = [i + 1 for i, s in enumerate(sizes) if s >= MIN_BLOCK_CELLS]
    sel = np.isin(lab, keep)
    box = bbox_of(sel)
    if box is None:
        return None
    l, t, r, b = box
    return l * cell, t * cell, r * cell, b * cell


def deck_footer_top(doc):
    """Top of the footer band, in PDF points, measured across the whole deck.

    The slide master puts the copyright line and slide number in the same place
    on every page, but on some pages it draws them as graphics rather than text,
    where no text extraction can see them. Taking the highest footer found
    anywhere in the deck gives a band that holds for every page, measured from
    the document instead of assumed.
    """
    tops = []
    for page in doc.pages:
        h = page.height
        here = [w["top"] for w in (page.extract_words() or []) if is_footer(w, h)]
        if here:
            tops.append(min(here))
    if not tops:
        return None
    tops.sort()
    return tops[len(tops) // 2]          # median, so one high outlier cannot
                                         # clip real content on other pages


def detect(page, png_path, mode="auto", footer_pt=None):
    """Return (crop, note) for one page, or (None, note) when it is text only."""
    img = Image.open(png_path).convert("RGB")
    W, H = img.size
    s = H / page.height                      # raster px per PDF point

    body, small, footer = classify_words(page)
    mask = ink_mask(img).copy()

    # drop the footer band: this page's own footer when it has one, otherwise
    # the deck-wide figure, since some pages draw the footer as graphics
    ftop_pt = min(w["top"] for w in footer) if footer else footer_pt
    if ftop_pt is not None:
        mask[max(0, int(ftop_pt * s) - 2):, :] = False

    if mode == "below_title":
        cut = int(title_bottom(body, page.height) * s) + 2
        mask[:max(0, cut), :] = False
    else:
        # remove every title/bullet word, wherever it sits on the slide
        for w in body:
            x0 = max(0, int(w["x0"] * s) - TEXT_PAD)
            x1 = min(W, int(w["x1"] * s) + TEXT_PAD)
            y0 = max(0, int(w["top"] * s) - TEXT_PAD)
            y1 = min(H, int(w["bottom"] * s) + TEXT_PAD)
            mask[y0:y1, x0:x1] = False

    # below_title already bounds the region, so every mark in it belongs to the
    # figure; running the speck filter there would drop a sparse final row.
    box = bbox_of(mask) if mode == "below_title" else figure_bbox(mask)
    if box is None:
        return None, "no figure-sized ink outside the text"
    l, t, r, b = box
    if (b - t) < H * MIN_H_FRAC or (r - l) < W * MIN_W_FRAC:
        return None, f"residue too small ({r-l}x{b-t})"

    l = max(0, l - PAD); t = max(0, t - PAD)
    r = min(W, r + PAD); b = min(H, b + PAD)
    return img.crop((l, t, r, b)), "ok"


def encode(crop):
    """Downscale to the width cap and return a base64 JPEG data URL."""
    if crop.size[0] > MAX_W:
        ratio = MAX_W / crop.size[0]
        crop = crop.resize((MAX_W, max(1, int(crop.size[1] * ratio))), Image.LANCZOS)
    buf = io.BytesIO()
    crop.save(buf, "JPEG", quality=QUALITY, optimize=True)
    raw = buf.getvalue()
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii"), crop.size, len(raw)


def main():
    pdf_path, workdir = sys.argv[1], sys.argv[2]
    spec_path = sys.argv[3] if len(sys.argv) > 3 else None
    out_path = sys.argv[4] if len(sys.argv) > 4 else None

    pages = render(pdf_path, workdir)
    doc = pdfplumber.open(pdf_path)
    modes = {}
    if spec_path:
        for v in json.load(open(spec_path)).values():
            modes[v["slide"]] = v.get("mode", "auto")

    footer_pt = deck_footer_top(doc)
    print(f"{len(doc.pages)} pages rendered at {RENDER_DPI} dpi")
    print(f"footer band starts at y={footer_pt:.1f}pt (measured across the deck)\n"
          if footer_pt else "no footer text found in this deck\n")
    crops, textonly = {}, []
    for i, page in enumerate(doc.pages, start=1):
        crop, note = detect(page, pages[i - 1], modes.get(i, "auto"), footer_pt)
        if crop is None:
            textonly.append((i, note))
            continue
        crops[i] = crop
        crop.save(os.path.join(workdir, f"slide-{i:02d}.png"))

    print(f"pages carrying a figure: {len(crops)} of {len(doc.pages)}")
    print("text only: " + ", ".join(str(i) for i, _ in textonly) + "\n")
    for i in sorted(crops):
        w, h = crops[i].size
        print(f"  slide {i:>2}  {w}x{h}{'   [below_title]' if modes.get(i)=='below_title' else ''}")

    if spec_path and out_path:
        spec = json.load(open(spec_path))
        out, total = {}, 0
        print()
        for key, v in spec.items():
            n = v["slide"]
            if n not in crops:
                raise SystemExit(f"ERROR: slide {n} for {key} produced no figure")
            url, size, nbytes = encode(crops[n])
            out[key] = url
            total += nbytes
            print(f"  {key:26s} slide {n:>3}  {size[0]}x{size[1]}  {nbytes/1024:6.1f} KB")
        json.dump(out, open(out_path, "w"))
        print(f"\n{len(out)} images, {total/1024/1024:.2f} MB raw JPEG -> {out_path}")


if __name__ == "__main__":
    main()
