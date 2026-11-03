#!/bin/bash
# sweep.sh [module ...]: for each port module, a template scratch course with that module (at the
# port branch head unpacked in /tmp/port-theme/mods/<m>) and theme (this branch) switched on by their
# own ci/oncourse.js, built; then the coordinator's contrast sweep (evidence/integration 1329222,
# scripts/contrast_test.js: dark device and Dark picked) and the theme module test in that course.
# One line per module in /tmp/port-theme/evidence/sweep/sweep.tsv.
cd /tmp/port-theme
mods="${*:-worksheets-ink glossary-tap module-pages paper-picker study-controls pair-up-drills short-answer-graphs quiz-prep-cards stopwatch notes terms-variables concept-statuses plan-the-problem}"
out=/tmp/port-theme/evidence/sweep; mkdir -p $out
for m in $mods; do
  var="MODKIT_${m//-/_}"
  needs=$(python3 -c "import json;print(' '.join(json.load(open('/tmp/port-theme/mods/$m/features/$m/current/module.json')).get('needs',[])))")
  envs="$var=/tmp/port-theme/mods/$m"
  for n in $needs; do envs="$envs MODKIT_${n//-/_}=/tmp/port-theme/mods/$m"; done
  D=/tmp/port-theme/sw-$m
  env $envs bash /tmp/port-theme/tools/mkon.sh $D $needs $m > $out/build-$m.log 2>&1
  b=$?
  if [ $b -ne 0 ]; then printf '%s\t%s\tbuild %s\t\t\t\n' "$m" "$needs" "$b" >> $out/sweep.tsv; continue; fi
  bash /tmp/port-theme/tools/run.sh sweep-contrast-$m $D/src node /tmp/port-theme/integ/contrast_test.js $D/src $out/shots-$m > /dev/null
  c=$(tail -1 /tmp/port-theme/evidence/logs/COMMANDS.tsv | cut -f4)
  bash /tmp/port-theme/tools/run.sh sweep-themetest-$m $D/src node features/theme/test.js > /dev/null
  t=$(tail -1 /tmp/port-theme/evidence/logs/COMMANDS.tsv | cut -f4)
  rep=$(grep '^\[{' /tmp/port-theme/evidence/logs/sweep-contrast-$m.log | tail -1)
  tline=$(grep -E '^(PASS|FAIL): features/theme' /tmp/port-theme/evidence/logs/sweep-themetest-$m.log | tail -1)
  printf '%s\t%s\tbuild 0\tcontrast %s\t%s\ttheme test %s: %s\n' "$m" "$needs" "$c" "$rep" "$t" "$tline" >> $out/sweep.tsv
done
