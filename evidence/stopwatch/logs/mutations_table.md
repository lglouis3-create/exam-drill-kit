| Mutation | What it breaks | Exit code | Checks that FAILed |
|---|---|---|---|
| M1 | no clock on a quiz calculation | 1 | a calculation shows one running clock in its card head; its title gives the professor's pace; it counts in place (the same element, the text moved on); past 2 minutes it is red and says over 2:00; the clock runs with no pace and no "over" |
| M2 | the clock does not count (the tick shows 0:00) | 1 | it counts in place (the same element, the text moved on); past 2 minutes it is red and says over 2:00; the clock runs with no pace and no "over" |
| M3 | the pace is never passed (over at ten times the pace) | 1 | past 2 minutes it is red and says over 2:00; after the answer it stops on the time taken, over the pace |
| M4 | the time taken shown is not the recorded ms (one minute added) | 1 | after the answer it stops on the time taken, over the pace; the time shown is the ms the engine recorded with the answer; an answer within the pace is shown in green, with no "over"; it stops on the time taken, with no pace colour |
| M5 | an answer within the pace is not shown green | 1 | an answer within the pace is shown in green, with no "over" |
| M6 | multiple-choice questions get a clock too | 1 | a multiple-choice question has no clock; the multiple-choice question of the paper has no clock |
| M7 | time on a paper question is replaced, not added up (Back loses the earlier time) | 1 | each answer of the submitted paper keeps its question's time as ms (Back added to the calculation's) |
| M8 | paper answers do not keep their time | 1 | each answer of the submitted paper keeps its question's time as ms (Back added to the calculation's) |
| M9 | with paceSeconds 0 every time counts as over the pace | 1 | the clock runs with no pace and no "over"; it stops on the time taken, with no pace colour |
| M10 | no clock on a paper calculation | 1 | an exam calculation shows its own clock; the time on each paper question is added up while it is shown: 40, 20 s; back on the calculation its clock reads undefined |
