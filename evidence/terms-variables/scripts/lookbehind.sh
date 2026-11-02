#!/bin/bash
# lookbehind.sh: device_lint.js on a copy of the module's own course with Basic-Pharmacokinetics'
# lookbehind sentence split (src/views.js line 1087) put back into the module; it must FAIL.
export NODE_PATH=/opt/node22/lib/node_modules
D=/tmp/port-terms-variables/c-lb
rm -rf "$D"; cp -r /tmp/port-terms-variables/c-on "$D"
F="$D/src/features/terms-variables/terms-variables.js"
python3 - "$F" <<'EOF'
import sys
p = sys.argv[1]; s = open(p).read()
old = ".replace(SENT_END, '$1\\u0000').split('\\u0000')"
assert s.count(old) == 1, s.count(old)
open(p, 'w').write(s.replace(old, ".split(/(?<=[.?!])\\s+(?=[A-Z(])/)"))
EOF
cd "$D/src" && python3 build.py > /dev/null 2>&1; echo "build.py exit $?"
node device_lint.js; echo "device_lint exit $?"
