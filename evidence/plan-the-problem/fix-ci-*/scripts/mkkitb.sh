#!/bin/bash
# mkkitb.sh NAME MODULE-WORKTREE MODULE...: the patched integration kit (9acfe9d + patches/all-patched-kit.patch)
# with features/<MODULE>/ taken from MODULE-WORKTREE (the fixed branch) in place of the scratch patch.
set -e
N=$1; W=$2; shift 2
D=/tmp/port-fix-c/kitb-$N
git -C /home/user/exam-drill-kit worktree remove --force $D 2>/dev/null || true
git -C /home/user/exam-drill-kit worktree add -q --detach $D 9acfe9d
git -C $D apply /tmp/port-fix-c/evi/evidence/integration-3/patches/all-patched-kit.patch
for m in "$@"; do rm -rf $D/features/$m; cp -r $W/features/$m $D/features/$m; done
echo "$D: $(git -C $D diff --stat | tail -1)"
