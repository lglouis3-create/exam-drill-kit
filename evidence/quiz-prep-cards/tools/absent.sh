#!/bin/bash
# absent.sh: the module test on the module's own course built with the module's code emptied
# (quiz-prep-cards.js and .css as empty files; module.json, step.js and the data unchanged). It must FAIL.
set -u
rm -rf /tmp/port-quiz-prep-cards/absent
cp -r /tmp/port-quiz-prep-cards/course /tmp/port-quiz-prep-cards/absent
cd /tmp/port-quiz-prep-cards/absent/src
: > features/quiz-prep-cards/quiz-prep-cards.js
: > features/quiz-prep-cards/quiz-prep-cards.css
python3 build.py > /dev/null; echo "build.py exit $?"
NODE_PATH=/opt/node22/lib/node_modules node features/quiz-prep-cards/test.js
echo "test.js exit $?"
