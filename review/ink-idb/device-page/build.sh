#!/usr/bin/env bash
# Builds review/ink-idb/device-page/index.html: Medicinal-chemistry (public repository, the commit
# named below) with this kit's core copied in, as core/ci_course.sh does, then make_device_page.js
# (namespace 'ink-validation', registerOutside('ink'), the validation panel).
#   review/ink-idb/device-page/build.sh        (run from the kit's root; needs git, python3, node)
set -euo pipefail
MC_COMMIT=97ecf8b34f8b64edb07a954ba8211e7e314d9394
kit="$(cd "$(dirname "$0")/../../.." && pwd)"
work="$(mktemp -d "${TMPDIR:-/tmp}/ink-device-XXXXXX")"
git clone -q --filter=blob:none https://github.com/lglouis3-create/Medicinal-chemistry "$work/mc"
git -C "$work/mc" checkout -q "$MC_COMMIT"
for f in "$kit"/core/*; do [ "$(basename "$f")" = README.md ] && continue; cp -r "$f" "$work/mc/src/"; done
(cd "$work/mc/src" && python3 build.py > /dev/null)
node "$kit/review/ink-idb/make_device_page.js" "$work/mc/index.html" "$kit/review/ink-idb/device-page/index.html"
echo "core: $(git -C "$kit" log -1 --format=%h -- core)  Medicinal-chemistry: ${MC_COMMIT:0:7}"
rm -rf "$work"
