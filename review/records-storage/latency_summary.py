# Kit #66: summarizes logs/latency-measure-r2.log (latency_measure.js, 3 runs per row).
# For each sample, rate and variant: the median of the 3 runs' per-save medians, the range of those
# medians, and the range over the runs of the longest task and of the slowest click to next paint.
# Usage: python3 -I latency_summary.py logs/latency-measure-r2.log
import json, sys, statistics
rows = [json.loads(l) for l in open(sys.argv[1]) if l.startswith('{') and '"mode"' in l]
idb = [json.loads(l) for l in open(sys.argv[1]) if l.startswith('{') and '"idbPut"' in l]
by = {}
for r in rows: by.setdefault((r['sample'], r['chars'], r['rate'], r['mode']), []).append(r)
def rng(v): v = [x for x in v if x is not None]; return '-' if not v else (str(min(v)) if min(v) == max(v) else f"{min(v)}-{max(v)}")
def mid(v): v = [x for x in v if x is not None]; return '-' if not v else str(round(statistics.median(v)))
order = []
for k in by:
    if (k[0], k[1]) not in order: order.append((k[0], k[1]))
print('| Sample (progress characters) | Rate | Variant | Saves compressed | Save, median ms (range of 3 runs) | Compress and pack, median ms | Longest task, ms (3 runs) | Slowest click to next paint, ms (3 runs) | Writes refused (progress / record) | Record stored at the end |')
print('|---|---|---|---|---|---|---|---|---|---|')
for (sample, chars) in order:
    for rate in (1, 4, 6):
        for mode in ('A', 'F', 'T', 'W'):
            rs = by.get((sample, chars, rate, mode))
            if not rs: continue
            sm = [r['saveWorkMs']['median'] for r in rs]
            comp = [r.get('compressMs') for r in rs] if mode in 'FT' else [r['worker']['compressMs'] for r in rs] if mode == 'W' else []
            ref = f"{sum(r['refused']['progress'] for r in rs)} / {sum(r['refused']['record'] for r in rs)}"
            st = rs[-1]['stored']; rec = 'none' if st['record'] is None else (f"compressed, {st['record']:,}" if st['recordCompressed'] else f"full, {st['record']:,}")
            if not st['progressCurrent']: rec += '; progress not current'
            label = {'A': 'A', 'F': 'F, compress on every save', 'T': 'T, threshold', 'W': 'W, Worker (unthrottled)'}[mode]
            print(f"| {sample} ({chars:,}) | {rate} | {label} | {sum(r['compressedSaves'] for r in rs)} of {sum(r['saves'] for r in rs)} | {mid(sm)} ({rng(sm)}) | {mid(comp) + (' (in the Worker)' if mode == 'W' else '')} | {rng([r['longTasks']['maxMs'] for r in rs])} | {rng([r['clicks']['maxMs'] for r in rs])} | {ref} | {rec} |")
print()
print('| Sample (progress characters) | Rate | W: compress in the Worker, median ms | W: record write on the page, median ms | W: record stored after the save, per-save median ms (3 runs) | W: per-save maximum, ms (3 runs) |')
print('|---|---|---|---|---|---|')
for (sample, chars) in order:
    for rate in (1, 4, 6):
        rs = by.get((sample, chars, rate, 'W'))
        if not rs: continue
        w = [r['worker'] for r in rs]
        print(f"| {sample} ({chars:,}) | {rate} | {mid([x['compressMs'] for x in w])} | {mid([x['recordWriteMs'] for x in w])} | {rng([x['recordAfterSaveMs'] for x in w])} | {rng([x['recordAfterSaveMaxMs'] for x in w])} |")
print()
print('| Sample | Rate | Progress characters | IndexedDB put: the call on the page, median ms | to the complete event, median ms |')
print('|---|---|---|---|---|')
for r in idb: print(f"| {r['sample']} | {r['rate']} | {r['idbPut']['chars']:,} | {r['idbPut']['callMs']} | {r['idbPut']['completeMs']} |")
