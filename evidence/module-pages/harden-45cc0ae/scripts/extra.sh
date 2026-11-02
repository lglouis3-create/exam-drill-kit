#!/bin/bash
# extra.sh: (a) the module test on a copy of the module's own course built with
# module-pages.js emptied (must FAIL); (b) ci/oncourse.js a second time on the module's own
# course (must refuse, exit 1). One line per command in evidence/COMMANDS.tsv.
V=/tmp/port-module-pages/v2; E=$V/evidence/logs; T=$V/evidence/COMMANDS.tsv
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-afaac94bfc8add4ab
export NODE_PATH=/opt/node22/lib/node_modules
rec(){ printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "logs/$1.log" >> "$T"; echo "$1 exit $4: $(tail -1 "$E/$1.log" | cut -c1-200)"; }
rm -rf $V/c-nocode && cp -r $V/c-own $V/c-nocode
: > $V/c-nocode/src/features/module-pages/module-pages.js
(cd $V/c-nocode/src && python3 build.py) > $E/nocode-build.log 2>&1; rec nocode-build $V/c-nocode/src "python3 build.py (module-pages.js emptied)" $?
(cd $V/c-nocode/src && timeout 900 node features/module-pages/test.js) > $E/module-absent.log 2>&1; rec module-absent $V/c-nocode/src "node features/module-pages/test.js" $?
cp $V/c-own/src/course.js $V/course-own-before-again.js
node $KIT/features/module-pages/ci/oncourse.js $KIT $V/c-own/src > $E/ci-oncourse-again.log 2>&1; rec ci-oncourse-again $V/c-own/src "node features/module-pages/ci/oncourse.js <kit> <src> (second time)" $?
cmp $V/c-own/src/course.js $V/course-own-before-again.js && echo "course.js unchanged by the second run" | tee -a $E/ci-oncourse-again.log
