#!/bin/bash
# One patch per module, relative to the kit root (apply with `git apply` in a worktree of the port branch).
cd /tmp/port-integration/fixwork
for m in glossary-tap paper-picker module-pages worksheets-ink terms-variables concept-statuses study-controls; do
  diff -ruN a/features/$m b/features/$m > /tmp/port-integration/fixes/$m.patch
  echo "$m: $(grep -c '^[-+][^-+]' /tmp/port-integration/fixes/$m.patch) changed lines"
done
