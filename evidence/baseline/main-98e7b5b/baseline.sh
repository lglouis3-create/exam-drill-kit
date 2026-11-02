#!/bin/bash
# Baseline evidence: template course with no module, and Medicinal-chemistry with the kit core,
# both from origin/main. Logs, exit codes and inputs kept in /tmp/port-coord/baseline/.
set -u
OUT=/tmp/port-coord/baseline2; rm -rf $OUT; mkdir -p $OUT/logs
export NODE_PATH=$(npm root -g)
KIT=/home/user/exam-drill-kit
cd $KIT && git fetch -q origin
rm -rf /tmp/port-coord/main-wt; git worktree prune; git worktree add -q --detach /tmp/port-coord/main-wt origin/main
M=/tmp/port-coord/main-wt
{
echo "kit origin/main: $(git -C $M rev-parse HEAD)"
echo "core tree: $(git -C $M rev-parse HEAD:core)"
echo "template tree: $(git -C $M rev-parse HEAD:template)"
echo "node: $(node --version)  python: $(python3 --version)"
echo "date: $(date -u +%FT%TZ)"
} > $OUT/inputs.txt
# 1. template course, no module
/tmp/port-tools/mkcourse.sh $M /tmp/port-coord/off >/dev/null
cd /tmp/port-coord/off/src
echo '$ python3 build.py' > $OUT/logs/off-build.log; python3 build.py >> $OUT/logs/off-build.log 2>&1; echo "off build.py exit=$?" >> $OUT/exit-codes.txt
echo '$ ./run_checks.sh' > $OUT/logs/off-run_checks.log; ./run_checks.sh >> $OUT/logs/off-run_checks.log 2>&1; echo "off run_checks.sh exit=$?" >> $OUT/exit-codes.txt
L=$(grep -o '/tmp/drill-checks-[A-Za-z0-9]*' $OUT/logs/off-run_checks.log | tail -1); [ -n "$L" ] && cp -r $L $OUT/logs/off-checks
sha256sum ../index.html ../sw.js ../version.json ../manifest.json > $OUT/off-built-files.sha256
# 2. Medicinal-chemistry with the core
rm -rf /tmp/port-coord/mc; git clone -q https://github.com/lglouis3-create/Medicinal-chemistry /tmp/port-coord/mc
echo "medicinal-chemistry: $(git -C /tmp/port-coord/mc rev-parse HEAD)" >> $OUT/inputs.txt
find $M/core -maxdepth 1 -type f ! -name README.md -exec cp {} /tmp/port-coord/mc/src/ \; ; cp -r $M/core/vendor /tmp/port-coord/mc/src/
cd /tmp/port-coord/mc && git add -A && git -c user.email=t@t -c user.name=t commit -qm "kit core $(git -C $M rev-parse --short HEAD)"
cd src; echo '$ ./run_checks.sh' > $OUT/logs/mc-run_checks.log; ./run_checks.sh >> $OUT/logs/mc-run_checks.log 2>&1; echo "mc run_checks.sh exit=$?" >> $OUT/exit-codes.txt
L=$(grep -o '/tmp/drill-checks-[A-Za-z0-9]*' $OUT/logs/mc-run_checks.log | tail -1); [ -n "$L" ] && cp -r $L $OUT/logs/mc-checks
echo done > $OUT/DONE
