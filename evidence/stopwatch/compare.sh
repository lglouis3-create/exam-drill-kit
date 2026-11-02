#!/bin/bash
# compare the no-module course built from origin/main (main/) and from the port branch (off/),
# raw and with build timestamps masked
cd /tmp/port-stopwatch || exit 1
mask() { sed -E 's/20[0-9]{2}-[0-9]{2}-[0-9]{2}[T ][0-9:.Z+-]+//g; s/[0-9]{10,13}//g' "$1"; }
for f in index.html sw.js version.json manifest.json; do
  if cmp -s "main/$f" "off/$f"; then echo "$f: identical byte for byte"
  elif diff <(mask "main/$f") <(mask "off/$f") > /dev/null; then echo "$f: differs only in the build timestamp ($(cmp "main/$f" "off/$f" | head -1))"
  else echo "$f: DIFFERS beyond the timestamp"; fi
done
