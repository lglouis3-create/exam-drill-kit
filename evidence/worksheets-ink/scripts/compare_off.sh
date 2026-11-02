#!/bin/bash
# Compare the no-module template course built from port/worksheets-ink with the same
# course built from origin/main, with the build stamp masked.
#   compare_off.sh <port course> <main course>
a=$1; b=$2; rc=0
mask() { sed -E 's/20[0-9]{2}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}(:[0-9]{2})?(\.[0-9]+)?Z?/STAMP/g; s/"stamp": *"[^"]*"/"stamp":"STAMP"/g; s/-v[0-9]{10,}/-vSTAMP/g' "$1"; }
for f in index.html sw.js version.json manifest.json; do
  if cmp -s <(mask "$a/$f") <(mask "$b/$f"); then echo "same: $f"; else echo "DIFFERENT: $f"; diff <(mask "$a/$f") <(mask "$b/$f") | head -5; rc=1; fi
done
exit $rc
