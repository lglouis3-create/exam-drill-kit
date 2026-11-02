# Medicinal-chemistry with the kit core, full clone (coordinator-verified)

Inputs: `inputs.txt` (kit `ac5c644`; core `daac6e2`; template `cbac5bd`; Medicinal-chemistry `f1f5ee5`, a full clone of 32 commits). Script: `mc-full.sh`. Exit codes: `exit-codes.txt`.

## Results
- `run_checks.sh`: 22 PASS, 1 FAIL, 2 NOT RUN, 1 REPORT (exit 1).
  - NOT RUN: `stepper_test.js` (no step-through figures in DIA) and `cite_check.py` (no lecture PDFs).
  - `state_check.js` ran and passed. The shallow clone was the only reason it was NOT RUN before.
  - FAIL: `home_test.js`, 1 of 33 checks: "once this copy has progress of its own, the card is gone from Settings".
- `home_test.js` run alone 3 times: FAIL, PASS, FAIL (logs `home_test-alone-1.log` to `-3.log`; load average about 2.9 while other agents ran).

This is an intermittent failure on `main` with no module on. It goes to a separate core or test fix, not into a port.
