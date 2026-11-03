#!/bin/bash
# checks.sh <name> <worktree> <outdir>: the module's own course (mkcourse + ci/oncourse.js + commit + build), the module
# test 3 times on it, then core/ci_course.sh module:<name>. Each command's exit code in <outdir>/exit-codes.txt.
N=$1; WT=$2; OUT=$3; mkdir -p $OUT; export NODE_PATH=$(npm root -g)
EX=$OUT/exit-codes.txt; : > $EX
run(){ local tag=$1; shift; ( "$@" ) > $OUT/$tag.log 2>&1; local c=$?; echo -e "$tag\t$c\t$*" >> $EX; return $c; }
C=$OUT/own; rm -rf $C
run 01-mkcourse /tmp/port-tools/mkcourse.sh $WT $C $N
run 02-oncourse node $WT/features/$N/ci/oncourse.js $WT $C/src
run 03-commit git -C $C -c user.email=t@t -c user.name=t commit -qam "module data" 
run 03b-add bash -c "cd $C && git add -A && git -c user.email=t@t -c user.name=t commit -qm 'module data files' || true"
run 04-build bash -c "cd $C/src && python3 build.py"
for i in 1 2 3; do run 05-module-test-$i bash -c "cd $C/src && timeout 1200 node features/$N/test.js"; done
run 06-ci_course timeout 2400 $WT/core/ci_course.sh module:$N
echo done >> $EX
