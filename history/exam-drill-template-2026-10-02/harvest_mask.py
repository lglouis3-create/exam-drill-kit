#!/usr/bin/env python3
"""Question crops that printed their own answer, with the answer text masked.

The reaction schemes on these slides are embedded pictures, so pdfplumber has
no word positions for their labels. The crop already in images.json is OCR'd
(tesseract, at 2x), every run of words spelling a listed phrase is whited out
with a margin, and the masked crop replaces the key. The printed version is
kept under `<key>_labeled` for the concept block, where the answer is wanted.

    python3 harvest_mask.py
"""
import base64, csv, io, json, subprocess, sys
from PIL import Image, ImageDraw

# One entry per crop that prints its own answer: the images.json key, and the
# phrases to white out. Course-specific — fill it in as such crops appear.
# key                       phrases to mask on the question image
SPEC = [
  # ("rx_oxidation", ["the enzyme name the slide prints", "the product name"]),
]
SCALE = 2       # OCR upscale
PAD = 4         # px of margin around each masked word, at crop scale
QUALITY = 70


def ocr_words(img):
    big = img.resize((img.size[0] * SCALE, img.size[1] * SCALE), Image.LANCZOS)
    buf = io.BytesIO(); big.save(buf, "PNG")
    out = subprocess.run(["tesseract", "stdin", "-", "--psm", "11", "tsv"],
                         input=buf.getvalue(), capture_output=True).stdout.decode("utf-8", "replace")
    rows = []
    for r in csv.DictReader(io.StringIO(out), delimiter="\t"):
        if r["text"].strip() and float(r["conf"]) > 30:
            rows.append({"text": r["text"].strip(),
                         "box": (int(r["left"]) / SCALE, int(r["top"]) / SCALE,
                                 (int(r["left"]) + int(r["width"])) / SCALE,
                                 (int(r["top"]) + int(r["height"])) / SCALE),
                         "line": (r["block_num"], r["par_num"], r["line_num"])})
    return rows


def phrase_boxes(words, phrase):
    target = phrase.split()
    n = len(target)
    hits = []
    for i in range(len(words) - n + 1):
        run = words[i:i + n]
        if [w["text"] for w in run] == target:
            hits.append((min(w["box"][0] for w in run), min(w["box"][1] for w in run),
                         max(w["box"][2] for w in run), max(w["box"][3] for w in run)))
    return hits


def main():
    images = json.load(open("images.json"))
    for key, phrases in SPEC:
        src = images.get(key + "_labeled") or images[key]     # always mask from the printed original
        hdr, b64 = src.split(",", 1)
        img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
        words = ocr_words(img)
        draw = ImageDraw.Draw(img)
        found = []
        for ph in phrases:
            boxes = phrase_boxes(words, ph)
            if not boxes:
                sys.exit(f"ERROR: {key}: phrase {ph!r} not found by OCR")
            for (x0, y0, x1, y1) in boxes:
                draw.rectangle([x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD], fill="white")
            found.append(f"{ph} x{len(boxes)}")
        # confirm nothing of the phrase survives
        left = [w["text"] for w in ocr_words(img)]
        for ph in phrases:
            if phrase_boxes([{"text": t, "box": (0, 0, 0, 0)} for t in left], ph):
                sys.exit(f"ERROR: {key}: {ph!r} still readable after masking")
        if key + "_labeled" not in images:
            images[key + "_labeled"] = images[key]
        buf = io.BytesIO(); img.save(buf, "JPEG", quality=QUALITY, optimize=True)
        images[key] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
        print(f"  {key:24s} {img.size[0]}x{img.size[1]}  {len(buf.getvalue())//1024} KB  masked: {'; '.join(found)}")
    json.dump(images, open("images.json", "w"))
    print(f"images.json now holds {len(images)} figures")


if __name__ == "__main__":
    main()
