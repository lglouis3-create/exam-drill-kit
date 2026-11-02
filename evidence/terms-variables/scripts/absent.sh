#!/bin/bash
# absent.sh: the module test on a copy of the module's own course built with the module's code left out
# (terms-variables.js emptied); the test must FAIL.
export NODE_PATH=/opt/node22/lib/node_modules
D=/tmp/port-terms-variables/c-absent
rm -rf "$D"; cp -r /tmp/port-terms-variables/f-on "$D"
: > "$D/src/features/terms-variables/terms-variables.js"
cd "$D/src" && python3 build.py > /dev/null 2>&1; echo "build.py exit $?"
node features/terms-variables/test.js; echo "test exit $?"
