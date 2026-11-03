#!/usr/bin/env bash
# sync.sh M : kit-b-M = the patched integration kit with features/M from the fixed worktree
m=$1; rm -rf /tmp/port-fix-b/kit-b-$m; cp -r /tmp/port-fix-b/intkit /tmp/port-fix-b/kit-b-$m; rm -rf /tmp/port-fix-b/kit-b-$m/.git
rm -rf /tmp/port-fix-b/kit-b-$m/features/$m; cp -r /tmp/port-fix-b/$m/features/$m /tmp/port-fix-b/kit-b-$m/features/$m
