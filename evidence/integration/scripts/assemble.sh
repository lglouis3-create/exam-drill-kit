#!/bin/bash
# Assemble /tmp/port-integration/evidence/integration (shots already there).
set -e
P=/tmp/port-integration; E=$P/evidence/integration
mkdir -p $E/logs $E/scripts $E/fixes
cp -r $P/logs/. $E/logs/
cp $P/*.js $P/*.sh $P/*.py $E/scripts/
cp $P/fixwork/apply_fixes.py $P/fixwork/apply_ci_fix.py $P/fixwork/prep.sh $P/fixwork/mkpatches.sh $P/fixwork/checkbase.sh $E/scripts/
cp $P/merged-shas-at-fetch.txt $P/merged-shas-run2.txt $E/
for m in glossary-tap paper-picker module-pages worksheets-ink terms-variables concept-statuses study-controls; do
  mkdir -p $E/fixes/$m; cp $P/fixes/$m.patch $E/fixes/
  for f in $P/logs/fix-*-$m-before.log $P/logs/fix-*-$m-after.log; do [ -f "$f" ] && cp "$f" $E/fixes/$m/; done
done
cp $P/logs/build-all3.log $E/fixes/worksheets-ink/ci-before-build-all3.log
cp $P/logs/build-all4.log $E/fixes/worksheets-ink/ci-after-build-all4.log
cp $P/logs/keys-before-fix.log $E/fixes/study-controls/keys-at-c81a735-failing.log
cp $P/logs/keys-run2.log $E/fixes/study-controls/keys-at-d15ebd9-passing.log
ls $E $E/fixes/*
du -sh $E
