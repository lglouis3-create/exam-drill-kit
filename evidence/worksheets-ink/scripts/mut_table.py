#!/usr/bin/env python3
"""The mutation table (markdown) from mutations.json files.
   python3 mut_table.py <mutations.json> ..."""
import json, sys
rows = []
for f in sys.argv[1:]: rows += json.load(open(f))
print('| Mutation | Behaviour broken | Exit | First check that FAILed | FAILs |')
print('|---|---|---|---|---|')
for r in rows:
    if 'error' in r: print(f"| `{r['name']}` | {r['what']} | — | NOT RUN: {r['error']} | — |"); continue
    first = (r['failed'][0] if r['failed'] else 'none (NOT CAUGHT)').replace('|', '/')
    if len(first) > 140: first = first[:137] + '…'
    print(f"| `{r['name']}` | {r['what']} | {r['exit']} | {first} | {len(r['failed'])} |")
caught = sum(1 for r in rows if r.get('exit') == 1 and r.get('failed'))
print(f"\n{caught} of {len(rows)} mutations caught.")
