#!/bin/bash
# on-nodata.sh SRC LOG: switch module-pages on with no data of its own (as ci/oncourse.js at
# 428d109 did), commit, build. Used for the F6 case.
set -e
SRC=$1; exec >"$2" 2>&1
printf '\n;/* switched on by features/module-pages/ci/oncourse.js */ COURSE.features = Object.assign({}, COURSE.features, {"module-pages": {version: "v1"}});\n' >> $SRC/course.js
cd $SRC/..
git add -A
git -c user.email=t@t -c user.name=t commit -qm on
cd src
python3 build.py
echo "build exit $?"
