#!/bin/bash
# Fresh a/ (the integration branch's files) and b/ (to be fixed) copies.
set -e
K=/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3
cd /tmp/port-integration/fixwork
rm -rf a b
for m in glossary-tap paper-picker module-pages worksheets-ink terms-variables concept-statuses study-controls; do
  mkdir -p a/features/$m/current; cp $K/features/$m/current/test.js a/features/$m/current/
done
mkdir -p a/features/worksheets-ink/ci; cp $K/features/worksheets-ink/ci/oncourse.js a/features/worksheets-ink/ci/
cp -r a b
python3 /tmp/port-integration/fixwork/apply_fixes.py
