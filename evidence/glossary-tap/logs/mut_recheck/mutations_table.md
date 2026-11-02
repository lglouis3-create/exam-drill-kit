| Mutation | What it breaks | Test exit | Checks that FAILed |
|---|---|---|---|
| M0 | no mutation (control) | 0 | PASS: features/glossary-tap/test.js: 93 checks passed |
| M13 | the source line is marked | 0 | PASS: features/glossary-tap/test.js: 93 checks passed |
| M25 | shortest name first in the finder | 1 | all 10 terms are found by their own name, as themselves; in the page, each of the 10 terms is found by its own name, as itself |
| M26 | no plural s/es | 1 | a plural is found: "receptors" in T-affinity-3's concept block is Receptor |
