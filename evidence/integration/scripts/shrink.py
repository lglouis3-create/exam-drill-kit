# Copy screenshots into the evidence folder as 64-colour PNGs (small), keeping names.
import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
n = 0
for f in sorted(os.listdir(src)):
    p = os.path.join(src, f)
    if f.endswith('.png'):
        Image.open(p).convert('RGB').quantize(64).save(os.path.join(dst, f), optimize=True); n += 1
    elif f.endswith('.json'):
        open(os.path.join(dst, f), 'w').write(open(p).read())
print(dst, n, 'png')
