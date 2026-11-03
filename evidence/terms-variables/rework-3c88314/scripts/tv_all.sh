#!/bin/bash
O=/tmp/port-rework/terms-variables/run1
/tmp/port-rework/scripts/checks.sh terms-variables /tmp/port-rework/wt-terms-variables $O
sed -i '/^done$/d' $O/exit-codes.txt
export NODE_PATH=$(npm root -g)
( timeout 2400 /tmp/port-rework/wt-terms-variables/core/ci_course.sh modules:terms-variables,equation-drill ) > $O/07-ci_course-combination.log 2>&1
echo -e "07-ci_course-combination\t$?\tcore/ci_course.sh modules:terms-variables,equation-drill" >> $O/exit-codes.txt
echo done >> $O/exit-codes.txt
