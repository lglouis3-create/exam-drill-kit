#!/bin/bash
# mk.sh DEST WS(yes|no) [CI(yes|no)] [LOG]
# A scratch course from the kit worktree with module-pages and chained-problem-sets
# (mkcourse.sh), plus worksheets-ink (origin/port/worksheets-ink) and concept-statuses
# (origin/port/concept-statuses) copied in. WS=yes: worksheets-ink's ci/oncourse.js
# writes its data first. CI=yes (default): module-pages' ci/oncourse.js runs.
# WSTAR (env): another worksheets-ink archive (default ws.tar). Then commit and build.
set -e
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-afaac94bfc8add4ab
V=/tmp/port-module-pages/v2
DEST=$1; WS=$2; CI=${3:-yes}; LOG=$4
if [ -n "$LOG" ]; then exec >"$LOG" 2>&1; fi
/tmp/port-tools/mkcourse.sh $KIT $DEST module-pages chained-problem-sets
rm -rf $V/pk && mkdir -p $V/pk && tar -xf ${WSTAR:-$V/ws.tar} -C $V/pk && tar -xf $V/cs.tar -C $V/pk
for m in worksheets-ink concept-statuses; do mkdir -p $DEST/src/features/$m; cp -r $V/pk/features/$m/current/. $DEST/src/features/$m/; done
if [ "$WS" = yes ]; then echo "+ worksheets-ink ci"; node $V/pk/features/worksheets-ink/ci/oncourse.js $V/pk $DEST/src; fi
if [ "$CI" = yes ]; then echo "+ module-pages ci"; node $KIT/features/module-pages/ci/oncourse.js $KIT $DEST/src; fi
cd $DEST
git add -A
git -c user.email=t@t -c user.name=t commit -qm data
cd src
python3 build.py
