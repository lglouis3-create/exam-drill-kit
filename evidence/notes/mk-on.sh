#!/bin/bash
# scratch course with notes on (alone)
set -e
W=/home/user/exam-drill-kit/.claude/worktrees/agent-ad792d8c15dc40f9c
D=${1:-/tmp/port-notes/on}
/tmp/port-tools/mkcourse.sh $W $D notes
cd $D/src
echo ";COURSE.features = {notes: {version: 'v1'}};" >> course.js
git add -A && git -c user.email=t@t -c user.name=t commit -qm "notes on"
python3 build.py
