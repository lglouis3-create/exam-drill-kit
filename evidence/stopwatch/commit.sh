#!/bin/bash
# commit.sh DIR MSG: commit everything in a scratch repo
cd "$1" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "$2"
