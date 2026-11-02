#!/bin/bash
set -u
OUT=/tmp/port-coord/mc-full; rm -rf $OUT; mkdir -p $OUT; export NODE_PATH=$(npm root -g)
M=/tmp/port-coord/main-wt; git -C /home/user/exam-drill-kit fetch -q origin; git -C $M checkout -q --detach origin/main
rm -rf /tmp/port-coord/mcf; git clone -q https://github.com/lglouis3-create/Medicinal-chemistry /tmp/port-coord/mcf > $OUT/clone.log 2>&1; echo "clone exit=$?" >> $OUT/exit-codes.txt
{ echo "kit $(git -C $M rev-parse HEAD) core $(git -C $M rev-parse HEAD:core) template $(git -C $M rev-parse HEAD:template)"; echo "medicinal-chemistry $(git -C /tmp/port-coord/mcf rev-parse HEAD) (full clone, $(git -C /tmp/port-coord/mcf rev-list --count HEAD) commits)"; date -u +%FT%TZ; } > $OUT/inputs.txt
find $M/core -maxdepth 1 -type f ! -name README.md -exec cp {} /tmp/port-coord/mcf/src/ \; ; cp -r $M/core/vendor /tmp/port-coord/mcf/src/
cd /tmp/port-coord/mcf && git add -A && git -c user.email=t@t -c user.name=t commit -qm "kit core"
cd src && ./run_checks.sh > $OUT/run_checks.log 2>&1; echo "run_checks exit=$?" >> $OUT/exit-codes.txt
L=$(grep -o '/tmp/drill-checks-[A-Za-z0-9]*' $OUT/run_checks.log | tail -1); [ -n "$L" ] && cp -r $L $OUT/checks
echo done > $OUT/DONE
