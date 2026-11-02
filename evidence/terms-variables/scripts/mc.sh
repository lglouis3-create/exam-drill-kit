#!/bin/bash
# mc.sh: Medicinal-chemistry main (full clone, /tmp/port-terms-variables/mc) with this branch's core
# copied into src/ (as Mode 7 does), committed locally, then run_checks.sh. Nothing is pushed.
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a034bc474dd221e7e
MC=/tmp/port-terms-variables/mc
cd "$MC" || exit 1
echo "mc HEAD $(git rev-parse --short HEAD) shallow $(git rev-parse --is-shallow-repository)"
find "$KIT/core" -maxdepth 1 -type f ! -name README.md -exec cp {} "$MC/src/" \;
cp -r "$KIT/core/vendor" "$MC/src/"
git add -A && git -c user.email=t@t -c user.name=t commit -qm "kit core from port/terms-variables (local only)"
git remote set-url --push origin no-push
cd src && ./run_checks.sh
