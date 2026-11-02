#!/bin/bash
# scratch course with notes and study-controls (from origin/port/study-controls c81a735) on
set -e
W=/home/user/exam-drill-kit/.claude/worktrees/agent-ad792d8c15dc40f9c
D=${1:-/tmp/port-notes/onsc}
/tmp/port-tools/mkcourse.sh $W $D notes
mkdir -p $D/src/features/study-controls
cp /tmp/port-notes/sc-files/* $D/src/features/study-controls/
cd $D/src
echo ";COURSE.features = {notes: {version: 'v1'}, 'study-controls': {version: 'v1'}};" >> course.js
git add -A && git -c user.email=t@t -c user.name=t commit -qm "notes and study-controls on"
python3 build.py
